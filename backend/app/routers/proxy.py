from fastapi import APIRouter, Query, Request
from app.services.proxy_service import stream_remote_media

router = APIRouter(prefix="/api/proxy", tags=["Proxy"])

@router.get("/stream")
def proxy_stream(url: str = Query(...), request: Request = None):
    return stream_remote_media(url, request)
