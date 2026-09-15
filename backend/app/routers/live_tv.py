from fastapi import APIRouter, Query, HTTPException
from app.services import live_tv_service

router = APIRouter(prefix="/api/live", tags=["Live TV"])

@router.get("/channels")
def get_channels(refresh: bool = Query(False)):
    return live_tv_service.get_live_channels(force_refresh=refresh)

@router.get("/channel/{channel_id}")
def get_channel(channel_id: str):
    channel = live_tv_service.get_channel_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Canal não encontrado")
    return channel
