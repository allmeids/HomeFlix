import os
import sys
import subprocess
import socket
import threading
import time
import webbrowser

backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Identificar se está rodando em modo sem janela (pythonw)
is_windowless = "pythonw" in os.path.basename(sys.executable).lower()
exe_name = "pythonw.exe" if is_windowless else "python.exe"

venv_python = os.path.normpath(os.path.join(backend_dir, "..", ".venv", "Scripts", exe_name))
if not os.path.exists(venv_python):
    venv_python = os.path.normpath(os.path.join(backend_dir, ".venv", "Scripts", exe_name))

current_python = os.path.normpath(sys.executable)
if os.path.exists(venv_python) and current_python.lower() != venv_python.lower():
    creationflags = 0x08000000 if (sys.platform == "win32" and is_windowless) else 0 # CREATE_NO_WINDOW
    sys.exit(subprocess.call([venv_python] + sys.argv, creationflags=creationflags))

# Redirecionar stdout/stderr para arquivo de log caso esteja sem console (pythonw)
if sys.stdout is None or sys.stderr is None:
    log_path = os.path.join(backend_dir, "homeflix_server.log")
    try:
        log_file = open(log_path, "a", encoding="utf-8", buffering=1)
        if sys.stdout is None:
            sys.stdout = log_file
        if sys.stderr is None:
            sys.stderr = log_file
    except Exception:
        pass

try:
    import uvicorn
    import fastapi
except ImportError:
    print("=" * 60)
    print("ERRO: Dependências do HomeFlix não encontradas no Python atual.")
    print("Execute 'start.bat' ou crie o ambiente com: python -m venv .venv")
    print("=" * 60)
    if sys.stdin and hasattr(sys.stdin, "isatty") and sys.stdin.isatty():
        try:
            input("Pressione Enter para fechar...")
        except Exception:
            pass
    sys.exit(1)

def is_port_in_use(port: int = 8080) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def open_browser_later():
    time.sleep(1.2)
    try:
        webbrowser.open("http://localhost:8080")
    except Exception:
        pass

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            if sys.stdout and hasattr(sys.stdout, "reconfigure"):
                sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            if sys.stderr and hasattr(sys.stderr, "reconfigure"):
                sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    if is_port_in_use(8080):
        print("=" * 60)
        print("🎬 HomeFlix já está em execução na porta 8080!")
        print("📡 Abrindo no navegador: http://localhost:8080")
        print("=" * 60)
        webbrowser.open("http://localhost:8080")
        sys.exit(0)

    print("=" * 60)
    print("🎬 Iniciando HomeFlix Server...")
    print("📡 Local:    http://localhost:8080")
    print("🌐 Na Rede:  http://0.0.0.0:8080")
    print("💡 Mantenha esta janela aberta enquanto estiver usando o HomeFlix.")
    print("💡 Pressione CTRL+C para encerrar o servidor.")
    print("=" * 60)

    # Abre o navegador automaticamente após inicializar
    threading.Thread(target=open_browser_later, daemon=True).start()

    # Executa o servidor uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=False)
