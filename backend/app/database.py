import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "homeflix.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -64000;")
    conn.execute("PRAGMA mmap_size = 268435456;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela de Perfis
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL DEFAULT '🦊',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Tabela de Progresso / Continuar Assistindo (Quick Resume)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL, -- 'movie' ou 'tv'
        title TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        season_number INTEGER DEFAULT 1,
        episode_number INTEGER DEFAULT 1,
        episode_title TEXT,
        position REAL DEFAULT 0, -- segundos assistidos
        duration REAL DEFAULT 0, -- duracao total em segundos
        completed INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profile_id, media_id, season_number, episode_number),
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
    """)

    # Tabela de Favoritos / Minha Lista
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        media_id TEXT NOT NULL,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        poster_path TEXT,
        vote_average REAL DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profile_id, media_id),
        FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
    """)

    # Índices para alta performance em consultas locais e Smart TVs
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_progress_profile ON progress(profile_id, updated_at DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_favorites_profile ON favorites(profile_id, added_at DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_progress_lookup ON progress(profile_id, media_id, season_number, episode_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_favorites_lookup ON favorites(profile_id, media_id);")

    # Migrações seguras de colunas em profiles
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN onboarded INTEGER DEFAULT 0;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE profiles ADD COLUMN preferred_genres TEXT DEFAULT '';")
    except Exception:
        pass

    # Cria perfil padrão se não existir nenhum
    cursor.execute("SELECT COUNT(*) as count FROM profiles")
    if cursor.fetchone()["count"] == 0:
        cursor.execute("INSERT INTO profiles (name, avatar, onboarded) VALUES (?, ?, ?)", ("Principal", "spiderman", 0))
        cursor.execute("INSERT INTO profiles (name, avatar, onboarded) VALUES (?, ?, ?)", ("Família", "mario", 0))

    conn.commit()
    conn.close()

# Helper functions para perfis
def get_profiles() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM profiles ORDER BY id ASC").fetchall()
    if not rows:
        # Auto-cria perfil padrão caso banco esteja vazio
        conn.execute("INSERT INTO profiles (name, avatar, onboarded) VALUES (?, ?, ?)", ("Principal", "spiderman", 0))
        conn.execute("INSERT INTO profiles (name, avatar, onboarded) VALUES (?, ?, ?)", ("Família", "mario", 0))
        conn.commit()
        rows = conn.execute("SELECT * FROM profiles ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_profile(name: str, avatar: str = "spiderman") -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO profiles (name, avatar, onboarded, preferred_genres) VALUES (?, ?, 0, '')", (name, avatar))
    profile_id = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    conn.close()
    return dict(row)

def get_profile_by_id(profile_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def update_profile(profile_id: int, name: str, avatar: str = "spiderman") -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    conn.execute("UPDATE profiles SET name = ?, avatar = ? WHERE id = ?", (name, avatar, profile_id))
    conn.commit()
    row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def save_profile_onboarding(profile_id: int, preferred_genres: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    conn.execute("UPDATE profiles SET onboarded = 1, preferred_genres = ? WHERE id = ?", (preferred_genres, profile_id))
    conn.commit()
    row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_profile(profile_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM profiles WHERE id = ?", (profile_id,))
    conn.commit()
    count = conn.execute("SELECT COUNT(*) as count FROM profiles").fetchone()["count"]
    if count == 0:
        conn.execute("INSERT INTO profiles (name, avatar, onboarded) VALUES (?, ?, ?)", ("Almeida", "spiderman", 0))
        conn.commit()
    conn.close()

def get_profile_recent_media_ids(profile_id: int, limit: int = 6) -> List[Dict[str, Any]]:
    """Retorna itens recentemente assistidos ou favoritados para gerar recomendações personalizadas"""
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT media_id, media_type, title FROM (
        SELECT media_id, media_type, title, updated_at as ts FROM progress WHERE profile_id = ?
        UNION ALL
        SELECT media_id, media_type, title, added_at as ts FROM favorites WHERE profile_id = ?
    )
    ORDER BY ts DESC
    LIMIT ?
    """, (profile_id, profile_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_watch_history(profile_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Retorna o histórico completo de títulos assistidos pelo perfil em ordem cronológica reversa"""
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT id, profile_id, media_id, media_type, title, poster_path, backdrop_path,
           season_number, episode_number, episode_title, position, duration, completed,
           updated_at
    FROM progress
    WHERE profile_id = ? AND position > 5
    ORDER BY updated_at DESC
    LIMIT ?
    """, (profile_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_watch_history(profile_id: int) -> bool:
    """Limpa todo o histórico de progresso do perfil"""
    conn = get_db_connection()
    conn.execute("DELETE FROM progress WHERE profile_id = ?", (profile_id,))
    conn.commit()
    conn.close()
    return True


# Helper functions para progresso (Continuar Assistindo)
def save_progress(
    profile_id: int,
    media_id: str,
    media_type: str,
    title: str,
    poster_path: Optional[str],
    backdrop_path: Optional[str],
    position: float,
    duration: float,
    season_number: int = 1,
    episode_number: int = 1,
    episode_title: Optional[str] = None
) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    completed = 1 if (duration > 0 and (position / duration) >= 0.92) else 0
    
    cur.execute("""
    INSERT INTO progress (
        profile_id, media_id, media_type, title, poster_path, backdrop_path,
        season_number, episode_number, episode_title, position, duration, completed, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(profile_id, media_id, season_number, episode_number) DO UPDATE SET
        position = excluded.position,
        duration = excluded.duration,
        completed = excluded.completed,
        updated_at = CURRENT_TIMESTAMP
    """, (
        profile_id, str(media_id), media_type, title, poster_path, backdrop_path,
        season_number, episode_number, episode_title, position, duration, completed
    ))
    conn.commit()
    conn.close()
    return {"status": "ok", "completed": completed}

def get_continue_watching(profile_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    # Retorna itens não concluídos e ordenados pelos mais recentes
    rows = conn.execute("""
    SELECT * FROM progress
    WHERE profile_id = ? AND completed = 0 AND position > 15
    ORDER BY updated_at DESC
    LIMIT 20
    """, (profile_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_progress(profile_id: int, media_id: str) -> bool:
    conn = get_db_connection()
    conn.execute("DELETE FROM progress WHERE profile_id = ? AND media_id = ?", (profile_id, str(media_id)))
    conn.commit()
    conn.close()
    return True

def get_media_progress(profile_id: int, media_id: str, season: int = 1, episode: int = 1) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("""
    SELECT * FROM progress
    WHERE profile_id = ? AND media_id = ? AND season_number = ? AND episode_number = ?
    """, (profile_id, str(media_id), season, episode)).fetchone()
    conn.close()
    return dict(row) if row else None

# Helper functions para favoritos (Minha Lista)
def toggle_favorite(profile_id: int, media_id: str, media_type: str, title: str, poster_path: Optional[str], vote_average: float = 0.0) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    existing = cur.execute("SELECT id FROM favorites WHERE profile_id = ? AND media_id = ?", (profile_id, str(media_id))).fetchone()
    if existing:
        cur.execute("DELETE FROM favorites WHERE id = ?", (existing["id"],))
        is_fav = False
    else:
        cur.execute("""
        INSERT INTO favorites (profile_id, media_id, media_type, title, poster_path, vote_average)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (profile_id, str(media_id), media_type, title, poster_path, vote_average))
        is_fav = True
    conn.commit()
    conn.close()
    return {"is_favorite": is_fav}

def get_favorites(profile_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM favorites WHERE profile_id = ? ORDER BY added_at DESC", (profile_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]
