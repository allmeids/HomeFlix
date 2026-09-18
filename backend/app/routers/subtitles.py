import urllib.parse
from typing import Optional
from fastapi import APIRouter, Query, Response, HTTPException
from app.services import subtitle_service

router = APIRouter(prefix="/api/subtitles", tags=["Subtitles"])

@router.get("/vtt")
def get_subtitle_vtt(url: str = Query(...)):
    """Baixa a legenda externa selecionada e a serve como WebVTT UTF-8 com suporte a CORS."""
    decoded_url = urllib.parse.unquote(url)
    vtt_content = subtitle_service.fetch_subtitle_vtt(decoded_url)
    
    return Response(
        content=vtt_content,
        media_type="text/vtt; charset=utf-8",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.get("/{media_type}/{tmdb_id}")
def get_media_subtitles(
    media_type: str,
    tmdb_id: str,
    season: Optional[int] = Query(None),
    episode: Optional[int] = Query(None)
):
    """Retorna lista de faixas de legendas disponíveis para o título, priorizando PT-BR."""
    subs = subtitle_service.get_subtitles(
        media_type=media_type,
        tmdb_id=tmdb_id,
        season=season,
        episode=episode
    )
    return {
        "media_type": media_type,
        "tmdb_id": tmdb_id,
        "count": len(subs),
        "subtitles": subs
    }
