import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(tags=["App Update"])

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DIST_DIR = os.path.join(BASE_DIR, "dist")
APK_PATH = os.path.join(DIST_DIR, "HomeFlix.apk")

APP_INFO = {
    "version_code": 5,
    "version_name": "1.0.4",
    "download_url": "/api/app/download",
    "changelog": "Player de vídeo perfeitamente centralizado sem deslocamento vertical; botão voltar e título alinhados à esquerda; remoção de caixas de preview pesadas na barra de progresso com scrubbing limpo e leve; atualização de estabilidade visual."
}

@router.get("/api/app/version")
def get_app_version():
    return APP_INFO

@router.get("/api/app/download")
@router.get("/apk")
def download_app_apk():
    if not os.path.exists(APK_PATH):
        raise HTTPException(status_code=404, detail="APK ainda não foi compilado no servidor.")
    return FileResponse(
        APK_PATH,
        media_type="application/vnd.android.package-archive",
        filename="HomeFlix.apk",
        headers={"Cache-Control": "no-cache"}
    )
