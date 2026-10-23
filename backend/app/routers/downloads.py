import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services import download_service

router = APIRouter(prefix="/api/downloads", tags=["Downloads"])

class DownloadStartRequest(BaseModel):
    title: str
    media_type: str = "movie"
    tmdb_id: Optional[int] = None
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    poster_path: Optional[str] = None
    stream_url: Optional[str] = None

@router.post("/start")
def start_download_endpoint(req: DownloadStartRequest):
    """Inicia ou agenda o download offline de um filme ou episódio"""
    if not req.title:
        raise HTTPException(status_code=400, detail="Título é obrigatório")
    
    result = download_service.start_download(
        title=req.title,
        media_type=req.media_type,
        tmdb_id=req.tmdb_id,
        season_number=req.season_number,
        episode_number=req.episode_number,
        poster_path=req.poster_path,
        stream_url=req.stream_url
    )
    return {"status": "ok", "download": result}

@router.get("")
def list_downloads_endpoint():
    """Retorna todos os downloads cadastrados"""
    downloads = download_service.list_downloads()
    return {"downloads": downloads, "count": len(downloads)}

@router.get("/{download_id}/status")
def get_download_status_endpoint(download_id: int):
    """Consulta o status e o progresso percentual de um download"""
    item = download_service.get_download_status(download_id)
    if not item:
        raise HTTPException(status_code=404, detail="Download não encontrado")
    return item

@router.post("/{download_id}/cancel")
def cancel_download_endpoint(download_id: int):
    """Interrompe e cancela um download ativo"""
    success = download_service.cancel_download(download_id)
    return {"status": "ok" if success else "error"}

@router.delete("/{download_id}")
def delete_download_endpoint(download_id: int):
    """Exclui o arquivo do disco e remove o registro do banco de dados"""
    success = download_service.delete_download(download_id)
    return {"status": "ok" if success else "error"}

@router.get("/stream/{download_id}")
def stream_download_endpoint(download_id: int, request: Request):
    """
    Transmite o vídeo baixado com suporte total a HTTP 206 Partial Content (Range requests).
    Permite avanço e retrocesso instantâneo (seek) no player de vídeo sem travamentos.
    """
    item = download_service.get_download_status(download_id)
    if not item:
        raise HTTPException(status_code=404, detail="Download não encontrado")

    file_path = item.get("file_path")
    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Arquivo de vídeo não disponível no disco")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    def file_chunk_generator(start_pos: int, bytes_to_read: int, chunk_size: int = 1024 * 512):
        with open(file_path, "rb") as f:
            f.seek(start_pos)
            remaining = bytes_to_read
            while remaining > 0:
                read_amount = min(chunk_size, remaining)
                data = f.read(read_amount)
                if not data:
                    break
                remaining -= len(data)
                yield data

    if range_header:
        # Formato esperado: bytes=start-end ou bytes=start-
        match = re.search(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            end_group = match.group(2)
            end = int(end_group) if end_group else file_size - 1
            if start >= file_size:
                return Response(
                    status_code=416,
                    headers={"Content-Range": f"bytes */{file_size}"}
                )
            end = min(end, file_size - 1)
            content_length = end - start + 1

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Type": "video/mp4",
                "Cache-Control": "no-cache"
            }
            return StreamingResponse(
                file_chunk_generator(start, content_length),
                status_code=status.HTTP_206_PARTIAL_CONTENT,
                headers=headers,
                media_type="video/mp4"
            )

    # Sem Range header: retorna vídeo completo com Accept-Ranges habilitado
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": "video/mp4",
        "Cache-Control": "no-cache"
    }
    return StreamingResponse(
        file_chunk_generator(0, file_size),
        status_code=status.HTTP_200_OK,
        headers=headers,
        media_type="video/mp4"
    )
