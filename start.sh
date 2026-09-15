#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/backend"

echo "=========================================================="
echo "🎬 HomeFlix — Servidor de Streaming Pessoal & TV ao Vivo"
echo "=========================================================="
echo "📡 Acessar localmente:    http://localhost:8080"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$IP" ]; then
  echo "🌐 Acessar na Smart TV/Rede: http://$IP:8080"
fi
echo "=========================================================="

python3 run.py
