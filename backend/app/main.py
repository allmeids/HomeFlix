import os
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.responses import Response

class CachedStaticFiles(StaticFiles):
    """Serve arquivos estáticos com cabeçalhos de cache agressivos para acelerar em até 10x o carregamento"""
    def file_response(self, *args, **kwargs) -> Response:
        resp = super().file_response(*args, **kwargs)
        path = args[0] if args else kwargs.get('full_path', '')
        p_str = str(path).lower()
        if any(p_str.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf']):
            resp.headers['Cache-Control'] = 'public, max-age=604800, immutable'
        elif any(p_str.endswith(ext) for ext in ['.css', '.js']):
            resp.headers['Cache-Control'] = 'public, max-age=86400'
        return resp

from app.database import init_db
from app.routers import media, streams, live_tv, profiles, progress, proxy, subtitles
from app.services import cloud_sync_service, backup_service

app = FastAPI(
    title="HOMEFLIX API",
    description="Plataforma de Streaming Pessoal & TV ao Vivo",
    version="1.0.0"
)

# Compressão de alta performance para respostas > 1KB (reduz tráfego em até 80%)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS liberado para rede local e qualquer cliente Web/SmartTV/Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Inicia rotina de backups periódicos do banco SQLite
    backup_service.start_backup_scheduler()
    # Executa sincronização com Supabase em thread em background para não atrasar o bind do servidor
    threading.Thread(target=cloud_sync_service.sync_bidirectional, daemon=True).start()

# Registrar rotas da API
app.include_router(media.router)
app.include_router(streams.router)
app.include_router(live_tv.router)
app.include_router(profiles.router)
app.include_router(progress.router)
app.include_router(proxy.router)
app.include_router(subtitles.router)

# Caminho do frontend estático
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", CachedStaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_home():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/manifest.json")
    def serve_manifest():
        return FileResponse(
            os.path.join(FRONTEND_DIR, "manifest.json"),
            media_type="application/manifest+json"
        )

    @app.get("/sw.js")
    def serve_sw():
        return FileResponse(
            os.path.join(FRONTEND_DIR, "sw.js"),
            media_type="application/javascript"
        )

    @app.get("/favicon.ico")
    def serve_favicon():
        return FileResponse(
            os.path.join(FRONTEND_DIR, "icons", "favicon.ico"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "HOMEFLIX", "version": "1.0.0"}

