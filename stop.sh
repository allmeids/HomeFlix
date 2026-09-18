#!/usr/bin/env bash
echo "=========================================================="
echo "🛑 Encerrando HomeFlix..."
echo "=========================================================="

PIDS=$(lsof -ti:8080 2>/dev/null || ss -tulpn 2>/dev/null | grep :8080 | awk '{print $7}' | grep -o '[0-9]*' | sort -u)

if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
        kill -15 "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
    done
    pkill -9 -f "app.main:app" 2>/dev/null || true
    echo "✅ HomeFlix encerrado com sucesso (PIDs: $PIDS)."
else
    pkill -9 -f "app.main:app" 2>/dev/null || true
    echo "✅ Servidor HomeFlix encerrado e porta 8080 liberada."
fi
