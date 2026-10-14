import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(tags=["App Update"])

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DIST_DIR = os.path.join(BASE_DIR, "dist")
APK_PATH = os.path.join(DIST_DIR, "HomeFlix.apk")

APP_INFO = {
    "version_code": 4,
    "version_name": "1.0.3",
    "download_url": "/api/app/download",
    "changelog": "Grade de busca em mosaico 3x3 no mobile; cabeçalho de busca limpo; Continuar Assistindo estilo Netflix com botões (i) e (✕); correção do banner no mobile; player de pausa minimalista sem textos gigantes; seleção de servidores 100% nos bastidores; e nova caixa de atualização personalizada HomeFlix."
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
