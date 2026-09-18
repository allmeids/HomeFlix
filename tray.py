"""
HomeFlix Tray — Controle do servidor HomeFlix pela gaveta do Windows.

Dependências (instalar no .venv ou globalmente):
    pip install pystray pillow requests
"""

import sys
import os
import threading
import subprocess
import webbrowser
import time
import requests
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

try:
    import pystray
    from pystray import MenuItem as item, Menu
except ImportError:
    print("Instale pystray: pip install pystray pillow requests")
    sys.exit(1)

# ── Configurações ────────────────────────────────────────────────────────────
ROOT_DIR   = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
HEALTH_URL  = "http://127.0.0.1:8080/api/health"
APP_URL     = "http://localhost:8080"
PORT        = 8080

# Detecta Python do venv local
def _find_python() -> str:
    candidates = [
        ROOT_DIR / ".venv" / "Scripts" / "python.exe",
        ROOT_DIR / "backend" / ".venv" / "Scripts" / "python.exe",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return "python"

PYTHON_EXE = _find_python()

# ── Estado global ─────────────────────────────────────────────────────────────
_server_proc: subprocess.Popen | None = None
_tray_icon: pystray.Icon | None = None
_status_text = "Verificando..."


# ── Helpers de status ─────────────────────────────────────────────────────────
def is_running() -> bool:
    """Verifica se o servidor HomeFlix está respondendo."""
    try:
        r = requests.get(HEALTH_URL, timeout=1.5)
        return r.status_code == 200
    except Exception:
        return False


def get_local_ip() -> str:
    """Retorna o IP local da máquina (melhor esforço)."""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ── Criação do ícone dinâmico ─────────────────────────────────────────────────
def _make_icon(online: bool) -> Image.Image:
    """Gera ícone 64×64: fundo escuro com símbolo ▶ verde ou ■ vermelho."""
    SIZE = 64
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fundo círculo escuro estilo Netflix
    bg_color = (20, 20, 20, 240)
    draw.ellipse([2, 2, SIZE - 2, SIZE - 2], fill=bg_color)

    # Símbolo: ▶ verde (online) ou ■ vermelho (offline)
    if online:
        # Triângulo play verde
        pts = [(20, 16), (20, 48), (48, 32)]
        draw.polygon(pts, fill=(0, 200, 80))
    else:
        # Quadrado vermelho (stop/off)
        draw.rectangle([18, 18, 46, 46], fill=(229, 9, 20))

    return img


# ── Texto do menu ──────────────────────────────────────────────────────────────
def _status_label(online: bool) -> str:
    ip = get_local_ip()
    if online:
        return f"● HomeFlix — ONLINE  ({ip}:{PORT})"
    return "○ HomeFlix — OFFLINE"


# ── Ações do menu ─────────────────────────────────────────────────────────────
def _start_server():
    """Inicia o servidor em background sem abrir janela."""
    global _server_proc
    if is_running():
        return
    _server_proc = subprocess.Popen(
        [PYTHON_EXE, "run.py"],
        cwd=str(BACKEND_DIR),
        creationflags=subprocess.CREATE_NO_WINDOW,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def _stop_server():
    """Para o servidor pelo PID ou via taskkill na porta 8080."""
    global _server_proc
    # Tenta via PID do processo filho
    if _server_proc and _server_proc.poll() is None:
        _server_proc.terminate()
        try:
            _server_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            _server_proc.kill()
        _server_proc = None

    # Garante mata qualquer processo na porta 8080 (caso iniciado externamente)
    subprocess.run(
        ["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command",
         "$p = Get-NetTCPConnection -LocalPort 8080 -State Listen -EA SilentlyContinue "
         "| Select -Expand OwningProcess -Unique; "
         "if ($p) { Stop-Process -Id $p -Force -EA SilentlyContinue }"],
        creationflags=subprocess.CREATE_NO_WINDOW,
        capture_output=True,
    )


def _action_toggle(icon, item_obj=None):
    """Alterna entre ligar e desligar o servidor."""
    online = is_running()
    if online:
        icon.notify("Desligando HomeFlix...", "HomeFlix")
        _stop_server()
        _wait_offline()
        icon.notify("HomeFlix desligado.", "HomeFlix")
    else:
        icon.notify("Ligando HomeFlix...", "HomeFlix")
        _start_server()
        if _wait_online():
            icon.notify(f"HomeFlix online! → {APP_URL}", "HomeFlix")
        else:
            icon.notify("Falha ao iniciar HomeFlix.", "HomeFlix ⚠")
    _refresh_icon(icon)


def _action_open_browser(icon=None, item_obj=None):
    webbrowser.open(APP_URL)


def _action_quit(icon, item_obj=None):
    # Pergunta se quer desligar o servidor ao sair
    import ctypes
    MB_YESNO = 0x04
    MB_ICONQUESTION = 0x20
    IDYES = 6
    resp = ctypes.windll.user32.MessageBoxW(
        0,
        "Deseja também DESLIGAR o servidor HomeFlix ao fechar o ícone da bandeja?",
        "HomeFlix — Sair",
        MB_YESNO | MB_ICONQUESTION
    )
    if resp == IDYES:
        _stop_server()
    icon.stop()


# ── Espera online/offline ─────────────────────────────────────────────────────
def _wait_online(timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if is_running():
            return True
        time.sleep(0.5)
    return False


def _wait_offline(timeout: float = 8.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if not is_running():
            return
        time.sleep(0.5)


# ── Atualização do ícone ──────────────────────────────────────────────────────
def _refresh_icon(icon: pystray.Icon):
    """Atualiza ícone e menu conforme status atual."""
    online = is_running()
    icon.icon = _make_icon(online)
    icon.title = _status_label(online)
    icon.menu = _build_menu(online)


def _build_menu(online: bool) -> Menu:
    toggle_label = "⏹  Desligar Servidor" if online else "▶  Ligar Servidor"
    open_label   = "🌐  Abrir no Navegador"
    status_label = _status_label(online)

    return Menu(
        item(status_label, None, enabled=False),
        Menu.SEPARATOR,
        item(toggle_label, _action_toggle),
        item(open_label,   _action_open_browser, enabled=online),
        Menu.SEPARATOR,
        item("✕  Fechar Bandeja", _action_quit),
    )


# ── Loop de polling em background ─────────────────────────────────────────────
def _polling_loop(icon: pystray.Icon):
    """Atualiza o ícone a cada 5 segundos automaticamente."""
    prev_state = None
    while icon.visible:
        current = is_running()
        if current != prev_state:
            _refresh_icon(icon)
            prev_state = current
        time.sleep(5)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    global _tray_icon

    online = is_running()
    icon_image = _make_icon(online)
    menu       = _build_menu(online)
    title      = _status_label(online)

    _tray_icon = pystray.Icon(
        name="homeflix",
        icon=icon_image,
        title=title,
        menu=menu,
    )

    # Inicia o loop de polling em background
    t = threading.Thread(target=_polling_loop, args=(_tray_icon,), daemon=True)
    t.start()

    _tray_icon.run()


if __name__ == "__main__":
    main()
