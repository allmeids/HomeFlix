import os
import re
import sys
import time
import shutil
import logging
import threading
import subprocess
from typing import Dict, Any, List, Optional
import requests

from app import database
from app.services import vod_service

logger = logging.getLogger("homeflix.download_service")

# Diretório padrão para armazenamento de downloads offline
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Controle de tarefas ativas em memória
_active_tasks: Dict[int, threading.Event] = {}
_active_procs: Dict[int, subprocess.Popen] = {}
_lock = threading.Lock()

def _sanitize_filename(name: str) -> str:
    """Gera um nome de arquivo seguro a partir do título"""
    clean = re.sub(r'[\s\\/*?:"<>|]+', '_', name)
    clean = clean.strip('_. ')
    return clean[:60] if clean else "midia"

def get_downloads_dir() -> str:
    return DOWNLOADS_DIR

def list_downloads() -> List[Dict[str, Any]]:
    """Lista todos os downloads cadastrados, enriquecendo com verificação física do arquivo"""
    records = database.get_downloads()
    for item in records:
        fp = item.get("file_path")
        if fp and os.path.isfile(fp):
            item["file_exists"] = True
            try:
                item["file_size"] = os.path.getsize(fp)
            except Exception:
                item["file_size"] = item.get("total_bytes", 0)
        else:
            item["file_exists"] = False
            item["file_size"] = item.get("downloaded_bytes", 0)
    return records

def get_download_status(download_id: int) -> Optional[Dict[str, Any]]:
    """Retorna detalhes e status em tempo real de um download"""
    item = database.get_download(download_id)
    if not item:
        return None
    fp = item.get("file_path")
    if fp and os.path.isfile(fp):
        item["file_exists"] = True
        try:
            item["file_size"] = os.path.getsize(fp)
        except Exception:
            item["file_size"] = item.get("total_bytes", 0)
    else:
        item["file_exists"] = False
        item["file_size"] = item.get("downloaded_bytes", 0)
    return item

def start_download(
    title: str,
    media_type: str,
    tmdb_id: Optional[int] = None,
    season_number: Optional[int] = None,
    episode_number: Optional[int] = None,
    poster_path: Optional[str] = None,
    stream_url: Optional[str] = None
) -> Dict[str, Any]:
    """Inicia ou retoma o processo de download em segundo plano"""
    # Verifica se já existe registro dessa mídia
    existing = None
    if tmdb_id:
        existing = database.get_download_by_media(media_type, tmdb_id, season_number, episode_number)

    if existing:
        status = existing.get("status")
        fp = existing.get("file_path")
        # Se já completado e arquivo existe fisicamente, retorna de imediato
        if status == "completed" and fp and os.path.isfile(fp):
            return existing
        # Se já está baixando, retorna status atual
        if status in ("downloading", "pending"):
            return existing

        # Se falhou ou foi cancelado, reutiliza o registro resetando os valores
        download_id = existing["id"]
        database.update_download(
            download_id,
            status="pending",
            progress=0.0,
            downloaded_bytes=0,
            stream_url=stream_url or existing.get("stream_url")
        )
        record = database.get_download(download_id)
    else:
        record = database.create_download(
            title=title,
            media_type=media_type,
            tmdb_id=tmdb_id,
            season_number=season_number,
            episode_number=episode_number,
            poster_path=poster_path,
            stream_url=stream_url,
            status="pending"
        )
        download_id = record["id"]

    # Inicia a thread trabalhadora em background
    cancel_event = threading.Event()
    with _lock:
        _active_tasks[download_id] = cancel_event

    thread = threading.Thread(
        target=_download_worker,
        args=(download_id, cancel_event),
        daemon=True,
        name=f"DownloadWorker-{download_id}"
    )
    thread.start()

    return database.get_download(download_id)

def cancel_download(download_id: int) -> bool:
    """Cancela um download ativo e limpa arquivos parciais"""
    with _lock:
        cancel_event = _active_tasks.get(download_id)
        if cancel_event:
            cancel_event.set()

        proc = _active_procs.get(download_id)
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass

    # Atualiza registro no banco
    item = database.get_download(download_id)
    if item and item.get("status") in ("pending", "downloading"):
        database.update_download(download_id, status="cancelled")

    # Limpa possíveis arquivos temporários (.part)
    safe_title = _sanitize_filename(item.get("title", "midia") if item else "midia")
    part_path = os.path.join(DOWNLOADS_DIR, f"{download_id}_{safe_title}.mp4.part")
    if os.path.isfile(part_path):
        try:
            os.remove(part_path)
        except Exception:
            pass

    return True

def delete_download(download_id: int) -> bool:
    """Cancela, deleta arquivo físico e remove registro do banco"""
    # Cancela se estiver ativo
    cancel_download(download_id)

    item = database.get_download(download_id)
    if item:
        file_path = item.get("file_path")
        if file_path and os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo físico {file_path}: {e}")

        # Limpeza defensiva de qualquer variação de nome
        safe_title = _sanitize_filename(item.get("title", "midia"))
        possible_files = [
            os.path.join(DOWNLOADS_DIR, f"{download_id}_{safe_title}.mp4"),
            os.path.join(DOWNLOADS_DIR, f"{download_id}_{safe_title}.mp4.part"),
            os.path.join(DOWNLOADS_DIR, f"{download_id}.mp4"),
            os.path.join(DOWNLOADS_DIR, f"{download_id}.mp4.part"),
        ]
        for pf in possible_files:
            if os.path.isfile(pf):
                try:
                    os.remove(pf)
                except Exception:
                    pass

    return database.delete_download_record(download_id)

def _download_worker(download_id: int, cancel_event: threading.Event):
    """Trabalhador assíncrono que realiza o download e remuxing"""
    try:
        item = database.get_download(download_id)
        if not item:
            return

        database.update_download(download_id, status="downloading", progress=0.0)

        stream_url = item.get("stream_url")
        media_type = item.get("media_type")
        tmdb_id = item.get("tmdb_id")
        season_num = item.get("season_number")
        ep_num = item.get("episode_number")

        # 1. Se stream_url não foi passada, resolve via VOD Service
        if not stream_url and tmdb_id:
            try:
                resolved = vod_service.resolve_streams(media_type, str(tmdb_id), season_num, ep_num)
                best = resolved.get("best_stream")
                if best and best.get("url"):
                    stream_url = best["url"]
                elif resolved.get("streams") and len(resolved["streams"]) > 0:
                    stream_url = resolved["streams"][0].get("url")
            except Exception as e:
                logger.error(f"[DownloadWorker] Falha ao resolver streams para {tmdb_id}: {e}")

        if not stream_url:
            database.update_download(download_id, status="error")
            logger.error(f"[DownloadWorker {download_id}] URL de stream não encontrada.")
            return

        database.update_download(download_id, stream_url=stream_url)

        # 2. Define caminho de saída seguro
        safe_title = _sanitize_filename(item.get("title", f"media_{download_id}"))
        if media_type == "tv" and season_num and ep_num:
            filename = f"{download_id}_{safe_title}_S{season_num:02d}E{ep_num:02d}.mp4"
        else:
            filename = f"{download_id}_{safe_title}.mp4"

        final_dest = os.path.join(DOWNLOADS_DIR, filename)
        part_dest = os.path.join(DOWNLOADS_DIR, f"{filename}.part")

        # Se já existe final_dest completo, atualiza banco
        if os.path.isfile(final_dest) and os.path.getsize(final_dest) > 1024 * 1024:
            f_size = os.path.getsize(final_dest)
            database.update_download(
                download_id,
                status="completed",
                progress=100.0,
                downloaded_bytes=f_size,
                total_bytes=f_size,
                file_path=final_dest
            )
            return

        # 3. Detecta se é HLS (.m3u8) ou MP4 direto
        is_hls = ".m3u8" in stream_url.lower() or "pluto.tv" in stream_url.lower()

        if is_hls and shutil.which("ffmpeg"):
            # Download e remuxing com ffmpeg para MP4 nativo
            _download_hls_ffmpeg(download_id, stream_url, final_dest, part_dest, cancel_event)
        else:
            # Download chunked via requests HTTP direto
            _download_http_stream(download_id, stream_url, final_dest, part_dest, cancel_event)

    except Exception as e:
        logger.exception(f"[DownloadWorker {download_id}] Erro inesperado: {e}")
        database.update_download(download_id, status="error")
    finally:
        with _lock:
            _active_tasks.pop(download_id, None)
            _active_procs.pop(download_id, None)

def _download_hls_ffmpeg(download_id: int, stream_url: str, final_dest: str, part_dest: str, cancel_event: threading.Event):
    """Faz download de stream HLS (.m3u8) usando ffmpeg com monitoramento de progresso"""
    if os.path.isfile(part_dest):
        try:
            os.remove(part_dest)
        except Exception:
            pass

    cmd = [
        "ffmpeg", "-y",
        "-headers", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n",
        "-i", stream_url,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        "-movflags", "+faststart",
        "-progress", "pipe:1",
        part_dest
    ]

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            bufsize=1
        )
        with _lock:
            _active_procs[download_id] = proc

        last_db_update = 0.0
        total_size_bytes = 0
        current_progress = 5.0

        for line in proc.stdout:
            if cancel_event.is_set():
                proc.terminate()
                break

            line = line.strip()
            if line.startswith("total_size="):
                try:
                    total_size_bytes = int(line.split("=")[1])
                except Exception:
                    pass
            elif line.startswith("progress="):
                p_state = line.split("=")[1]
                now = time.time()
                if now - last_db_update >= 1.5:
                    # Incrementa suavemente o progresso se total_bytes não for fixo
                    if current_progress < 95.0:
                        current_progress += 2.0
                    database.update_download(
                        download_id,
                        downloaded_bytes=total_size_bytes,
                        progress=current_progress
                    )
                    last_db_update = now

        proc.wait()

        if cancel_event.is_set():
            if os.path.isfile(part_dest):
                try: os.remove(part_dest)
                except Exception: pass
            database.update_download(download_id, status="cancelled")
            return

        if proc.returncode == 0 and os.path.isfile(part_dest) and os.path.getsize(part_dest) > 1024:
            os.rename(part_dest, final_dest)
            f_size = os.path.getsize(final_dest)
            database.update_download(
                download_id,
                status="completed",
                progress=100.0,
                downloaded_bytes=f_size,
                total_bytes=f_size,
                file_path=final_dest
            )
        else:
            if os.path.isfile(part_dest):
                try: os.remove(part_dest)
                except Exception: pass
            database.update_download(download_id, status="error")

    except Exception as e:
        logger.error(f"[DownloadWorker {download_id}] Erro no ffmpeg: {e}")
        if os.path.isfile(part_dest):
            try: os.remove(part_dest)
            except Exception: pass
        database.update_download(download_id, status="error")

def _download_http_stream(download_id: int, stream_url: str, final_dest: str, part_dest: str, cancel_event: threading.Event):
    """Download direto via HTTP streaming chunked com cálculo de porcentagem"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }

    try:
        with requests.get(stream_url, headers=headers, stream=True, timeout=25) as r:
            r.raise_for_status()
            total_bytes = int(r.headers.get("content-length", 0))
            downloaded = 0
            last_db_update = 0.0

            if total_bytes > 0:
                database.update_download(download_id, total_bytes=total_bytes)

            with open(part_dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=128 * 1024):
                    if cancel_event.is_set():
                        break
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)

                        now = time.time()
                        if now - last_db_update >= 1.0:
                            prog = (downloaded / total_bytes * 100.0) if total_bytes > 0 else min(95.0, downloaded / (100 * 1024 * 1024) * 10.0)
                            database.update_download(
                                download_id,
                                downloaded_bytes=downloaded,
                                total_bytes=total_bytes if total_bytes > 0 else downloaded,
                                progress=prog
                            )
                            last_db_update = now

        if cancel_event.is_set():
            if os.path.isfile(part_dest):
                try: os.remove(part_dest)
                except Exception: pass
            database.update_download(download_id, status="cancelled")
            return

        if os.path.isfile(part_dest) and os.path.getsize(part_dest) > 1024:
            os.rename(part_dest, final_dest)
            f_size = os.path.getsize(final_dest)
            database.update_download(
                download_id,
                status="completed",
                progress=100.0,
                downloaded_bytes=f_size,
                total_bytes=f_size,
                file_path=final_dest
            )
        else:
            if os.path.isfile(part_dest):
                try: os.remove(part_dest)
                except Exception: pass
            database.update_download(download_id, status="error")

    except Exception as e:
        logger.error(f"[DownloadWorker {download_id}] Erro no stream HTTP: {e}")
        if os.path.isfile(part_dest):
            try: os.remove(part_dest)
            except Exception: pass
        database.update_download(download_id, status="error")
