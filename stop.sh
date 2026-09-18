#!/usr/bin/env bash
echo "=========================================================="
echo "🛑 Encerrando HomeFlix..."
echo "=========================================================="

PID=$(lsof -ti:8080 2>/dev/null || ss -tulpn 2>/dev/null | grep :8080 | awk '{print $7}' | grep -o '[0-9]*' | head -n 1)

if [ -n "$PID" ]; then
    kill -15 "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
    echo "✅ HomeFlix encerrado com sucesso (PID $PID)."
else
    echo "ℹ️ Nenhum servidor HomeFlix ativo na porta 8080."
fi
