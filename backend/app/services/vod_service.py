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

# Sessão persistente para scrapers VOD com Keep-Alive
_vod_session = requests.Session()
_vod_adapter = requests.adapters.HTTPAdapter(pool_connections=10, pool_maxsize=20, max_retries=1)
_vod_session.mount("https://", _vod_adapter)
_vod_session.mount("http://", _vod_adapter)

from datetime import datetime

def is_recent_theatrical_release(release_date_str: Optional[str]) -> bool:
    """Verifica se o filme ainda está na janela de exibição de cinema (menos de 75 dias de lançamento)."""
    if not release_date_str:
        return False
    try:
        rel_date = datetime.strptime(release_date_str.strip(), "%Y-%m-%d").date()
        today = datetime.now().date()
        # Se foi lançado há menos de 75 dias ou data futura, lançamentos online ainda são gravações de cinema (CAM/TS)
        return (today - rel_date).days < 75
    except Exception:
        return False

def is_cinema_cam(title: str, name: str) -> bool:
    combined = f"{name} {title}".upper()
    cam_pattern = r'\b(CAM|HDCAM|CAM-RIP|CAMRIP|TELESYNC|HDTS|TS|TELECINE|TC|CINEMA|GRAVADO|1XBET|BET|PROPAGANDA)\b'
    return bool(re.search(cam_pattern, combined))

def is_digital_release(title: str, name: str) -> bool:
    combined = f"{name} {title}".upper()
    digital_pattern = r'\b(WEB-DL|WEBDL|WEBRIP|BLURAY|BDRIP|BRRIP|HDTV|REMUX|PROPER)\b'
    return bool(re.search(digital_pattern, combined))

def parse_quality(title: str, name: str, is_cam: bool = False) -> str:
    if is_cam:
        return "Qualidade Cinema (CAM)"

    # Limpar tags de provedor/servidor como CDN4K, Server4K para não gerar falso positivo de 4K
    clean_text = re.sub(r'\b(CDN\w*|SERVER\w*|HOST\w*)\b', '', f"{name} {title}", flags=re.IGNORECASE)

    if re.search(r'\b(4K|2160P|UHD|ULTRA\s*HD)\b', clean_text, re.IGNORECASE):
        return "4K Ultra HD"
    if re.search(r'\b(1080P|FHD|FULL\s*HD)\b', clean_text, re.IGNORECASE):
        return "1080p Full HD"
    if re.search(r'\b(720P|HD)\b', clean_text, re.IGNORECASE):
        return "720p HD"
    return "SD / 480p"

def parse_audio(title: str, name: str) -> str:
    combined = f"{name} {title}".lower()
    if any(k in combined for k in ["português", "portugues", "dublado", "pt-br", "ptbr", "dual"]):
        return "Português (Dublado)"
    if any(k in combined for k in ["legendado", "leg", "sub"]):
        return "Legendado"
    return "Original / Multiaudio"

import concurrent.futures

_STREAM_CACHE: Dict[str, Any] = {}
_STREAM_CACHE_TTL = 900  # 15 minutos

def fetch_froststream(media_type: str, imdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> List[Dict[str, Any]]:
    if media_type in ("movie", "filme"):
        url = f"{FROSTSTREAM_URL}/stream/movie/{imdb_id}.json"
    else:
        s = season or 1
        ep = episode or 1
        url = f"{FROSTSTREAM_URL}/stream/series/{imdb_id}:{s}:{ep}.json"

    try:
        r = _vod_session.get(url, headers=HEADERS, timeout=12)
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
        r = _vod_session.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=12)
        if r.status_code == 200:
            return r.json().get("streams", [])
    except Exception as exc:
        print(f"[SuperStream Error] {exc}")
    return []

def validate_stream_alive(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Testa se o link remoto está ativo e não expirado (evita repassar streams mortas/404 para o cliente)."""
    url = item.get("url")
    if not url:
        return None
    if "froststream.cloutteam.com" in url:
        try:
            r = _vod_session.get(url, headers={"User-Agent": "Stremio/4.4.168"}, allow_redirects=False, timeout=2.5)
            # Se retornou 404 ou erro, o stream expirou ou não existe
            if r.status_code == 404 or r.status_code >= 500:
                return None
            # Se retornou 302 com redirecionamento para CDN, verifica se a CDN está ativa
            if r.status_code == 302 and "Location" in r.headers:
                cdn_url = r.headers["Location"]
                try:
                    r_cdn = _vod_session.head(cdn_url, headers={"User-Agent": "Stremio/4.4.168"}, timeout=2)
                    if r_cdn.status_code == 404:
                        return None
                except Exception:
                    pass
        except Exception:
            pass
    return item

def resolve_streams(media_type: str, tmdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> Dict[str, Any]:
    cache_key = f"{media_type}_{tmdb_id}_{season}_{episode}"
    now_ts = datetime.now().timestamp()
    if cache_key in _STREAM_CACHE:
        cached_entry = _STREAM_CACHE[cache_key]
        if now_ts - cached_entry["timestamp"] < _STREAM_CACHE_TTL:
            return cached_entry["data"]

    # 1. Obter IMDb ID via TMDB se necessário
    details = get_media_details(media_type, tmdb_id)
    external_ids = details.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id")

    if not imdb_id:
        return {
            "title": details.get("title") or details.get("name") or "Vídeo",
            "imdb_id": None,
            "tmdb_id": tmdb_id,
            "count": 0,
            "streams": [],
            "best_stream": None,
            "is_cinema_version": False,
            "has_dubbed": False
        }

    title = details.get("title") or details.get("name") or "Vídeo"
    raw_streams = []

    # 2. Busca paralela de alta velocidade (FrostStream + SuperStream simultaneamente)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_frost = executor.submit(fetch_froststream, media_type, imdb_id, season, episode)
        f_super = executor.submit(fetch_superstream, media_type, imdb_id, season, episode)

        try:
            frost_streams = f_frost.result(timeout=14)
            for s in frost_streams:
                s["_provider"] = "FrostStream"
                raw_streams.append(s)
        except Exception as exc:
            print(f"[Parallel FrostStream Error] {exc}")

        try:
            super_streams = f_super.result(timeout=14)
            for s in super_streams:
                s["_provider"] = "SuperStream"
                raw_streams.append(s)
        except Exception as exc:
            print(f"[Parallel SuperStream Error] {exc}")

    theatrical_cam = False
    if media_type in ("movie", "filme"):
        release_date = details.get("release_date")
        if is_recent_theatrical_release(release_date):
            theatrical_cam = True

    # 4. Normalizar streams encontrados
    normalized = []
    for idx, s in enumerate(raw_streams):
        url = s.get("url")
        if not url:
            continue

        raw_title = s.get("title", "") or ""
        name = s.get("name", "") or s.get("_provider", "Servidor")
        is_cam = is_cinema_cam(raw_title, name) or (theatrical_cam and not is_digital_release(raw_title, name))
        quality = parse_quality(raw_title, name, is_cam=is_cam)
        audio = parse_audio(raw_title, name)

        clean_name = f"{quality} • {audio}"
        details_label = raw_title.replace("\n", " • ").strip()

        normalized.append({
            "id": f"stream_{idx+1}",
            "name": name,
            "quality": quality,
            "audio": audio,
            "is_cinema": is_cam,
            "label": clean_name,
            "details": details_label,
            "url": url,
            "provider": s.get("_provider"),
            "behaviorHints": s.get("behaviorHints", {})
        })

    # 4.1 Validação concorrente rápida para descartar streams mortas/expiradas (elimina 404s no cliente)
    if normalized:
        valid_streams = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(normalized), 8)) as validator:
            results = validator.map(validate_stream_alive, normalized)
            for res in results:
                if res is not None:
                    valid_streams.append(res)
        normalized = valid_streams

    # 5. Algoritmo de Priorização Inteligente (Best Stream Selection):
    # - Português (Dublado): Prioridade Máxima (+100)
    # - Qualidade Digital WEB-DL/Bluray ganha de Cinema CAM (+50 vs -80)
    # - Resolução (4K: +40, 1080p: +30, 720p: +20)
    def calculate_score(item):
        score = 0
        # Áudio: Português Dublado é rei
        if "Português" in item["audio"]:
            score += 100
        elif "Legendado" in item["audio"]:
            score += 35
        else:
            score += 10

        # Resolução
        if "4K" in item["quality"]:
            score += 40
        elif "1080p" in item["quality"]:
            score += 30
        elif "720p" in item["quality"]:
            score += 20
        else:
            score += 10

        # Versão Digital vs Cinema CAM
        if item["is_cinema"]:
            score -= 80  # Penaliza versão gravada se houver versão digital limpa
        else:
            score += 50  # Bônus para versão digital de alta fidelidade

        return score

    normalized.sort(key=calculate_score, reverse=True)

    best_stream = normalized[0] if normalized else None
    is_cinema_version = best_stream.get("is_cinema", False) if best_stream else False
    has_dubbed = any("Português" in s["audio"] for s in normalized)

    result = {
        "title": title,
        "imdb_id": imdb_id,
        "tmdb_id": tmdb_id,
        "season": season,
        "episode": episode,
        "count": len(normalized),
        "best_stream": best_stream,
        "is_cinema_version": is_cinema_version,
        "has_dubbed": has_dubbed,
        "streams": normalized
    }

    if normalized:
        _STREAM_CACHE[cache_key] = {
            "timestamp": now_ts,
            "data": result
        }

    return result
