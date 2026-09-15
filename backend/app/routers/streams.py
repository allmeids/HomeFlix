from fastapi import APIRouter, Query
from typing import Optional
from app.services import vod_service

router = APIRouter(prefix="/api/streams", tags=["Streams"])

@router.get("/resolve")
def resolve_stream(
    type: str = Query("movie", pattern="^(movie|tv|series)$"),
    id: str = Query(...),
    season: Optional[int] = Query(None),
    episode: Optional[int] = Query(None)
):
    media_type = "movie" if type == "movie" else "tv"
    return vod_service.resolve_streams(media_type, id, season, episode)
