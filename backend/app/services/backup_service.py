import os
import time
import sqlite3
import threading
from datetime import datetime

from app.database import DB_PATH

BACKUPS_DIR = os.path.join(os.path.dirname(DB_PATH), "backups")
MAX_BACKUPS = 5

def create_instant_backup() -> str:
    """Cria snapshot atômico do banco de dados SQLite com backup nativo (suporta WAL)."""
    if not os.path.exists(DB_PATH):
        return ""

    os.makedirs(BACKUPS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    backup_filename = f"homeflix_backup_{timestamp}.db"
    backup_path = os.path.join(BACKUPS_DIR, backup_filename)

    try:
        source_conn = sqlite3.connect(DB_PATH, timeout=10.0)
        dest_conn = sqlite3.connect(backup_path)
        with dest_conn:
            source_conn.backup(dest_conn)
        dest_conn.close()
        source_conn.close()
        print(f"[BackupService] Snapshot do banco criado com sucesso: {backup_filename}")
        _rotate_backups()
        return backup_path
    except Exception as e:
        print(f"[BackupService] Erro ao criar snapshot do banco: {e}")
        return ""

def _rotate_backups():
    """Mantém apenas os últimos MAX_BACKUPS para não consumir armazenamento desnecessário."""
    try:
        if not os.path.exists(BACKUPS_DIR):
            return
        files = [
            os.path.join(BACKUPS_DIR, f)
            for f in os.listdir(BACKUPS_DIR)
            if f.startswith("homeflix_backup_") and f.endswith(".db")
        ]
        files.sort(key=os.path.getmtime)
        while len(files) > MAX_BACKUPS:
            oldest = files.pop(0)
            os.remove(oldest)
            print(f"[BackupService] Backup antigo removido: {os.path.basename(oldest)}")
    except Exception as e:
        print(f"[BackupService] Erro na rotação de backups: {e}")

def _backup_loop():
    """Loop em background que cria snapshot a cada 12 horas."""
    # Primeiro backup após 1 minuto de inicialização do servidor
    time.sleep(60)
    while True:
        try:
            create_instant_backup()
        except Exception as e:
            print(f"[BackupService] Erro no loop de backup: {e}")
        time.sleep(12 * 3600)  # A cada 12 horas

def start_backup_scheduler():
    """Inicia thread daemon de backup periódico."""
    t = threading.Thread(target=_backup_loop, daemon=True, name="HomeFlixBackupScheduler")
    t.start()
