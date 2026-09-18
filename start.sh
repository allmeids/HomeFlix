#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$DIR/backend"

echo "=========================================================="
echo "🎬 HomeFlix — Servidor de Streaming Pessoal & TV ao Vivo"
echo "=========================================================="

# Se a porta 8080 já estiver em uso, apenas abre o navegador
if command -v ss &>/dev/null && ss -tulpn 2>/dev/null | grep -q ":8080 "; then
    echo "📡 HomeFlix já está em execução na porta 8080!"
    echo "🌐 Abrindo no navegador: http://localhost:8080"
    xdg-open "http://localhost:8080" 2>/dev/null || sensible-browser "http://localhost:8080" 2>/dev/null || true
    exit 0
fi

cd "$BACKEND_DIR"

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "📡 Local:               http://localhost:8080"
if [ -n "$IP" ]; then
    echo "🌐 Na Smart TV/Rede:    http://$IP:8080"
fi
echo "=========================================================="

# Executa com o python correto
if [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON="$DIR/.venv/bin/python"
elif [ -f "$BACKEND_DIR/.venv/bin/python" ]; then
    PYTHON="$BACKEND_DIR/.venv/bin/python"
elif command -v python3 &>/dev/null; then
    PYTHON="python3"
else
    PYTHON="python"
fi

exec "$PYTHON" run.py
