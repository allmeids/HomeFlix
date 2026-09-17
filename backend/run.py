import uvicorn
import os
import sys

# Adiciona o diretório backend ao sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configura codificação UTF-8 no Windows para suportar emojis e caracteres especiais no terminal
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Iniciando HomeFlix Server...")
    print("📡 Local:    http://localhost:8080")
    print("🌐 Na Rede:  http://0.0.0.0:8080")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)
