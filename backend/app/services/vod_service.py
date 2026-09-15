import requests
import re
from typing import List, Dict, Any, Optional
from app.services.tmdb_service import get_media_details

USER_AGENT = "OnePlay-Matrix/3.3.9 Kodi"
HEADERS = {
    "Accept": "application/json",
    "User-Agent": USER_AGENT
}

FROSTSTREAM_URL = "https://froststream.cloutteam.com"
SUPERSTREAM_URL = "https://da5f663b4690-superstream.baby-beamup.club"

def parse_quality(title: str, name: str) -> str:
    combined = f"{name} {title}".upper()
    if "4K" in combined or "2160P" in combined:
        return "4K Ultra HD"
    if "1080P" in combined or "FHD" in combined:
        return "1080p Full HD"
    if "720P" in combined or "HD" in combined:
        return "720p HD"
    return "SD / 480p"

def parse_audio(title: str, name: str) -> str:
    combined = f"{name} {title}".lower()
    if "português" in combined or "dublado" in combined or "pt-br" in combined or "pt" in combined or "dual" in combined:
        return "Português (Dublado)"
    if "legendado" in combined or "leg" in combined or "sub" in combined:
        return "Legendado"
    return "Original / Multiaudio"

def fetch_froststream(media_type: str, imdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> List[Dict[str, Any]]:
    if media_type in ("movie", "filme"):
        url = f"{FROSTSTREAM_URL}/stream/movie/{imdb_id}.json"
    else:
        s = season or 1
        ep = episode or 1
        url = f"{FROSTSTREAM_URL}/stream/series/{imdb_id}:{s}:{ep}.json"

    try:
        r = requests.get(url, headers=HEADERS, timeout=6)
        if r.status_code == 200:
            return r.json().get("streams", [])
    except Exception as exc:
        print(f"[FrostStream Error] {exc}")
    return []

def fetch_superstream(media_type: str, imdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> List[Dict[str, Any]]:
    stype = "series" if media_type in ("tv", "series") else "movie"
    if stype == "series":
        s = season or 1
        ep = episode or 1
        url = f"{SUPERSTREAM_URL}/stream/series/{imdb_id}:{s}:{ep}.json"
    else:
        url = f"{SUPERSTREAM_URL}/stream/movie/{imdb_id}.json"

    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=6)
        if r.status_code == 200:
            return r.json().get("streams", [])
    except Exception as exc:
        print(f"[SuperStream Error] {exc}")
    return []

def resolve_streams(media_type: str, tmdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> Dict[str, Any]:
    # 1. Obter IMDb ID via TMDB se necessário
    details = get_media_details(media_type, tmdb_id)
    external_ids = details.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id")

    if not imdb_id:
        # Fallback se não tiver imdb_id direto
        return {"streams": [], "imdb_id": None, "title": details.get("title") or details.get("name")}

    title = details.get("title") or details.get("name") or "Vídeo"
    raw_streams = []

    # 2. Busca FrostStream
    frost_streams = fetch_froststream(media_type, imdb_id, season, episode)
    for s in frost_streams:
        s["_provider"] = "FrostStream"
        raw_streams.append(s)

    # 3. Se necessário, busca SuperStream
    if len(raw_streams) < 3:
        super_streams = fetch_superstream(media_type, imdb_id, season, episode)
        for s in super_streams:
            s["_provider"] = "SuperStream"
            raw_streams.append(s)

    # 4. Normalizar streams encontrados
    normalized = []
    for idx, s in enumerate(raw_streams):
        url = s.get("url")
        if not url:
            continue

        raw_title = s.get("title", "") or ""
        name = s.get("name", "") or s.get("_provider", "Servidor")
        quality = parse_quality(raw_title, name)
        audio = parse_audio(raw_title, name)

        # Montar label amigável
        clean_name = f"{quality} • {audio}"
        details_label = raw_title.replace("\n", " • ").strip()

        normalized.append({
            "id": f"stream_{idx+1}",
            "name": name,
            "quality": quality,
            "audio": audio,
            "label": clean_name,
            "details": details_label,
            "url": url,
            "provider": s.get("_provider"),
            "behaviorHints": s.get("behaviorHints", {})
        })

    # Ordenar: 4K/1080p primeiro, Português primeiro
    def sort_score(item):
        score = 0
        if "4K" in item["quality"]:
            score += 40
        elif "1080p" in item["quality"]:
            score += 30
        elif "720p" in item["quality"]:
            score += 20
        if "Português" in item["audio"]:
            score += 15
        return score

    normalized.sort(key=sort_score, reverse=True)

    return {
        "title": title,
        "imdb_id": imdb_id,
        "tmdb_id": tmdb_id,
        "season": season,
        "episode": episode,
        "count": len(normalized),
        "streams": normalized
    }
