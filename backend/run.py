import uvicorn
import os
import sys

# Adiciona o diretório backend ao sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Iniciando HomeFlix Server...")
    print("📡 Local:    http://localhost:8080")
    print("🌐 Na Rede:  http://0.0.0.0:8080")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
