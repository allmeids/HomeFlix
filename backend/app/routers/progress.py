from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app import database
from app.services import cloud_sync_service

router = APIRouter(prefix="/api", tags=["Progress & Favorites"])

class ProgressSave(BaseModel):
    profile_id: int
    media_id: str
    media_type: str
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    position: float
    duration: float
    season_number: Optional[int] = 1
    episode_number: Optional[int] = 1
    episode_title: Optional[str] = None

class FavoriteToggle(BaseModel):
    profile_id: int
    media_id: str
    media_type: str
    title: str
    poster_path: Optional[str] = None
    vote_average: Optional[float] = 0.0

@router.get("/progress/continue-watching")
def get_continue_watching(profile_id: int = Query(...)):
    return {"results": database.get_continue_watching(profile_id)}

@router.delete("/progress/{profile_id}/{media_id}")
def delete_continue_watching(profile_id: int, media_id: str):
    database.delete_progress(profile_id, media_id)
    cloud_sync_service.schedule_cloud_upload(delay_seconds=1.0)
    return {"status": "ok"}

@router.post("/progress/save")
def save_progress(data: ProgressSave):
    res = database.save_progress(
        profile_id=data.profile_id,
        media_id=data.media_id,
        media_type=data.media_type,
        title=data.title,
        poster_path=data.poster_path,
        backdrop_path=data.backdrop_path,
        position=data.position,
        duration=data.duration,
        season_number=data.season_number or 1,
        episode_number=data.episode_number or 1,
        episode_title=data.episode_title
    )
    # Agenda sincronização para o Supabase sem bloquear a resposta do heartbeat
    cloud_sync_service.schedule_cloud_upload(delay_seconds=6.0)
    return res

@router.get("/progress/media")
def get_media_progress(
    profile_id: int = Query(...),
    media_id: str = Query(...),
    season: int = Query(1),
    episode: int = Query(1)
):
    prog = database.get_media_progress(profile_id, media_id, season, episode)
    return {"progress": prog}

@router.get("/progress/history")
def get_watch_history(profile_id: int = Query(...), limit: int = Query(50)):
    return {"results": database.get_watch_history(profile_id, limit)}

@router.post("/progress/history/clear")
def clear_watch_history(profile_id: int = Query(...)):
    database.clear_watch_history(profile_id)
    cloud_sync_service.schedule_cloud_upload(delay_seconds=1.0)
    return {"status": "ok"}

@router.delete("/progress/history/{profile_id}/{media_id}")
def delete_history_item(profile_id: int, media_id: str):
    database.delete_progress(profile_id, media_id)
    cloud_sync_service.schedule_cloud_upload(delay_seconds=1.0)
    return {"status": "ok"}

@router.post("/favorites/toggle")
def toggle_favorite(data: FavoriteToggle):
    res = database.toggle_favorite(
        profile_id=data.profile_id,
        media_id=data.media_id,
        media_type=data.media_type,
        title=data.title,
        poster_path=data.poster_path,
        vote_average=data.vote_average or 0.0
    )
    cloud_sync_service.schedule_cloud_upload(delay_seconds=1.5)
    return res

@router.get("/favorites")
def get_favorites(profile_id: int = Query(...)):
    return {"results": database.get_favorites(profile_id)}

@router.post("/cloud/sync")
def trigger_cloud_sync():
    """Força sincronização bidirecional entre o SQLite e o Supabase Storage."""
    return cloud_sync_service.sync_bidirectional()

@router.get("/cloud/status")
def get_cloud_status():
    """Retorna o status atual da sincronização com o Supabase Storage."""
    return cloud_sync_service.get_sync_status()

