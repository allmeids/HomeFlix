import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import init_db
from app.routers import media, streams, live_tv, profiles, progress, proxy

app = FastAPI(
    title="HomeFlix API",
    description="Plataforma de Streaming Pessoal & TV ao Vivo",
    version="1.0.0"
)

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

# Registrar rotas da API
app.include_router(media.router)
app.include_router(streams.router)
app.include_router(live_tv.router)
app.include_router(profiles.router)
app.include_router(progress.router)
app.include_router(proxy.router)

# Caminho do frontend estático
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_home():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "HomeFlix", "version": "1.0.0"}
