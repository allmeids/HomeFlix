"""
HomeFlix - Cloud Progress Synchronization via Supabase Storage
Synchronizes "Continuar Assistindo" (Progress) and "Minha Lista" (Favorites)
between local SQLite (homeflix.db) and Supabase Storage (bucket: save-states).
Ensures seamless cross-device resumption (Smart TV, PC Gamer, Mobile).
"""

import os
import json
import time
import socket
import threading
from typing import Optional, Dict, Any, List
import requests

from supabase import create_client, Client
from app.database import get_db_connection

SUPABASE_URL = "https://cxgxecgsrkhlaobfwxxy.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z3hlY2dzcmtobGFvYmZ3eHh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDA3MDQsImV4cCI6MjEwNTMxNjcwNH0.IgnsIF2EK2_-oINlZxqU8DFZsU0uPlrFrfSsliXETLQ"
BUCKET_NAME = "save-states"

# Sessão padrão validada no ecossistema GamesHub / HomeFlix
DEFAULT_USER_ID = "8820a9f4-2851-4ff8-82ca-a91d24d65e4a"
DEFAULT_REFRESH_TOKEN = "4bipd47ejpfg"
DEFAULT_EMAIL = "allmeiids@gmail.com"

_client: Optional[Client] = None
_user_id: Optional[str] = None
_access_token: Optional[str] = None
_sync_lock = threading.Lock()
_debounce_timer: Optional[threading.Timer] = None
_last_upload_time = 0.0
_last_sync_status = {
    "status": "idle",
    "last_sync": None,
    "last_error": None,
    "device": socket.gethostname(),
    "items_synced": 0
}

def _get_auth_paths() -> List[str]:
    home = os.path.expanduser("~")
    return [
        os.path.join(home, ".config", "homeflix", "auth.json"),
        os.path.join(home, ".config", "gameshub", "auth.json"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "auth.json")
    ]

def _load_auth_session() -> Optional[Dict[str, Any]]:
    for path in _get_auth_paths():
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("user_id") and (data.get("refresh_token") or data.get("access_token")):
                        return data
            except Exception:
                pass
    return None

def _save_auth_session(session_data: Dict[str, Any]):
    save_path = os.path.join(os.path.expanduser("~"), ".config", "homeflix", "auth.json")
    try:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f)
        os.chmod(save_path, 0o600)
    except Exception as exc:
        print(f"[CloudSync] Falha ao salvar auth.json: {exc}")

def get_supabase_client() -> Optional[Client]:
    global _client, _user_id, _access_token
    if _client is not None and _user_id is not None:
        return _client

    try:
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        session = _load_auth_session()

        access_token = session.get("access_token") if session else None
        refresh_token = session.get("refresh_token") if session else DEFAULT_REFRESH_TOKEN
        uid = session.get("user_id") if session else DEFAULT_USER_ID

        if access_token and refresh_token:
            try:
                res = client.auth.set_session(access_token, refresh_token)
                if res and res.user:
                    _client = client
                    _user_id = res.user.id
                    _access_token = res.session.access_token if res.session else access_token
                    _save_auth_session({
                        "access_token": _access_token,
                        "refresh_token": res.session.refresh_token if res.session else refresh_token,
                        "user_id": _user_id,
                        "email": res.user.email,
                        "expires_at": res.session.expires_at if res.session else 0
                    })
                    return _client
            except Exception as e:
                print(f"[CloudSync] set_session aviso: {e}")

        # Se expirou ou não há access_token direto, tenta renovar pelo refresh_token
        if refresh_token:
            try:
                res = client.auth.refresh_session(refresh_token)
                if res and res.user:
                    _client = client
                    _user_id = res.user.id
                    _access_token = res.session.access_token
                    _save_auth_session({
                        "access_token": _access_token,
                        "refresh_token": res.session.refresh_token,
                        "user_id": _user_id,
                        "email": res.user.email,
                        "expires_at": res.session.expires_at
                    })
                    return _client
            except Exception as e:
                print(f"[CloudSync] refresh_session aviso: {e}")

        # Fallback usando user_id padrão
        _client = client
        _user_id = uid or DEFAULT_USER_ID
        return _client
    except Exception as exc:
        print(f"[CloudSync] Erro ao instanciar cliente Supabase: {exc}")
        return None

def get_cloud_storage_path() -> str:
    uid = _user_id or DEFAULT_USER_ID
    return f"{uid}/homeflix/progress.json"

def download_remote_progress() -> Optional[Dict[str, Any]]:
    """Baixa o arquivo de progresso remoto da nuvem com bypass estrito de cache CDN."""
    global _last_sync_status
    client = get_supabase_client()
    if not client:
        return None

    path = get_cloud_storage_path()
    # Usamos chamada HTTP direta com query de timestamp para evitar cache stale
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{path}?t={int(time.time())}"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Cache-Control": "no-cache"
        }
        if _access_token:
            headers["Authorization"] = f"Bearer {_access_token}"

        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 404:
            return {"version": 1, "progress": [], "favorites": []}
    except Exception as exc:
        print(f"[CloudSync] Erro no download do progresso remoto via HTTP: {exc}")

    # Fallback via storage client SDK
    try:
        data_bytes = client.storage.from_(BUCKET_NAME).download(path)
        if data_bytes:
            return json.loads(data_bytes.decode("utf-8"))
    except Exception as exc:
        if "404" not in str(exc) and "not found" not in str(exc).lower():
            print(f"[CloudSync] Erro no download do progresso via SDK: {exc}")

    return None

def merge_remote_into_sqlite(remote_data: Dict[str, Any]) -> int:
    """Mescla os registros da nuvem no SQLite local respeitando a versão mais recente."""
    if not remote_data:
        return 0

    progress_items = remote_data.get("progress", [])
    favorites_items = remote_data.get("favorites", [])
    merged_count = 0

    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Merge de Progresso / Continuar Assistindo
    for item in progress_items:
        try:
            profile_id = int(item.get("profile_id", 1))
            media_id = str(item.get("media_id", ""))
            if not media_id:
                continue

            season = int(item.get("season_number") or 1)
            episode = int(item.get("episode_number") or 1)
            remote_pos = float(item.get("position", 0))
            remote_dur = float(item.get("duration", 0))
            remote_completed = int(item.get("completed", 0))
            remote_updated = str(item.get("updated_at") or "")

            local = cur.execute("""
            SELECT id, position, duration, completed, updated_at
            FROM progress
            WHERE profile_id = ? AND media_id = ? AND season_number = ? AND episode_number = ?
            """, (profile_id, media_id, season, episode)).fetchone()

            if not local:
                # Não existe localmente: insere
                cur.execute("""
                INSERT INTO progress (
                    profile_id, media_id, media_type, title, poster_path, backdrop_path,
                    season_number, episode_number, episode_title, position, duration, completed, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), CURRENT_TIMESTAMP))
                """, (
                    profile_id, media_id, item.get("media_type", "movie"), item.get("title", ""),
                    item.get("poster_path"), item.get("backdrop_path"),
                    season, episode, item.get("episode_title"),
                    remote_pos, remote_dur, remote_completed, remote_updated
                ))
                merged_count += 1
            else:
                # Compara: se o remoto tem timestamp mais recente ou maior posição assistida
                local_pos = float(local["position"] or 0)
                local_updated = str(local["updated_at"] or "")
                
                # Se remoto é mais recente ou assistiu mais tempo
                is_remote_newer = remote_updated > local_updated if (remote_updated and local_updated) else (remote_pos > local_pos)

                if is_remote_newer or (remote_pos > local_pos and local["completed"] == 0):
                    cur.execute("""
                    UPDATE progress SET
                        position = ?,
                        duration = ?,
                        completed = ?,
                        updated_at = COALESCE(NULLIF(?, ''), CURRENT_TIMESTAMP)
                    WHERE id = ?
                    """, (remote_pos, remote_dur, remote_completed, remote_updated, local["id"]))
                    merged_count += 1
        except Exception as e:
            print(f"[CloudSync] Erro ao mesclar item de progresso: {e}")

    # 2. Merge de Favoritos (Minha Lista)
    for fav in favorites_items:
        try:
            profile_id = int(fav.get("profile_id", 1))
            media_id = str(fav.get("media_id", ""))
            if not media_id:
                continue

            existing = cur.execute("""
            SELECT id FROM favorites WHERE profile_id = ? AND media_id = ?
            """, (profile_id, media_id)).fetchone()

            if not existing:
                cur.execute("""
                INSERT INTO favorites (profile_id, media_id, media_type, title, poster_path, vote_average, added_at)
                VALUES (?, ?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), CURRENT_TIMESTAMP))
                """, (
                    profile_id, media_id, fav.get("media_type", "movie"), fav.get("title", ""),
                    fav.get("poster_path"), float(fav.get("vote_average", 0)), fav.get("added_at")
                ))
                merged_count += 1
        except Exception as e:
            print(f"[CloudSync] Erro ao mesclar item de favorito: {e}")

    conn.commit()
    conn.close()
    return merged_count

def upload_local_to_cloud() -> bool:
    """Lê todo o progresso e favoritos do SQLite local e faz upload para a nuvem."""
    global _last_sync_status, _last_upload_time
    client = get_supabase_client()
    if not client:
        return False

    path = get_cloud_storage_path()
    conn = get_db_connection()
    progress_rows = [dict(r) for r in conn.execute("SELECT * FROM progress ORDER BY updated_at DESC").fetchall()]
    favorites_rows = [dict(r) for r in conn.execute("SELECT * FROM favorites ORDER BY added_at DESC").fetchall()]
    conn.close()

    payload = {
        "version": 1,
        "device": socket.gethostname(),
        "synced_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "progress": progress_rows,
        "favorites": favorites_rows
    }
    payload_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

    try:
        # Tenta update primeiro (para substituir arquivo existente)
        try:
            client.storage.from_(BUCKET_NAME).update(
                path=path,
                file=payload_bytes,
                file_options={"content-type": "application/json"}
            )
        except Exception:
            # Se não existia ainda, faz upload
            client.storage.from_(BUCKET_NAME).upload(
                path=path,
                file=payload_bytes,
                file_options={"content-type": "application/json", "upsert": "true"}
            )

        _last_upload_time = time.time()
        _last_sync_status["status"] = "synced"
        _last_sync_status["last_sync"] = payload["synced_at"]
        _last_sync_status["items_synced"] = len(progress_rows) + len(favorites_rows)
        _last_sync_status["last_error"] = None
        print(f"[CloudSync] ✅ Sincronizado com sucesso para {path} ({len(progress_rows)} progressos, {len(favorites_rows)} favoritos)")
        return True
    except Exception as exc:
        _last_sync_status["status"] = "error"
        _last_sync_status["last_error"] = str(exc)
        print(f"[CloudSync] ❌ Erro no upload para nuvem: {exc}")
        return False

def sync_bidirectional() -> Dict[str, Any]:
    """
    Executa sincronização bidirecional completa:
    1. Baixa da nuvem e mescla no banco local.
    2. Sobe o estado resultante consolidado de volta para a nuvem.
    """
    with _sync_lock:
        remote = download_remote_progress()
        merged = 0
        if remote:
            merged = merge_remote_into_sqlite(remote)

        success = upload_local_to_cloud()
        return {
            "success": success,
            "merged_remote_items": merged,
            "status": _last_sync_status
        }

def schedule_cloud_upload(delay_seconds: float = 8.0):
    """Agenda um upload em background com debounce para não sobrecarregar em heartbeats contínuos."""
    global _debounce_timer
    if _debounce_timer is not None:
        _debounce_timer.cancel()

    def _worker():
        upload_local_to_cloud()

    _debounce_timer = threading.Timer(delay_seconds, _worker)
    _debounce_timer.daemon = True
    _debounce_timer.start()

def get_sync_status() -> Dict[str, Any]:
    return _last_sync_status
