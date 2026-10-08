import requests
import re
import urllib.parse
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
_STREAM_CACHE_TTL = 180  # 3 minutos (mantém tokens e links CDN sempre válidos e frescos)

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

def fetch_embedplayer(media_type: str, imdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> List[Dict[str, Any]]:
    """Provedor agregado EmbedPlayer para filmes e séries PT-BR em alta definição (HLS 1080p DUAL)."""
    if media_type not in ("movie", "filme"):
        return []

    streams = []
    try:
        url = f"https://embed.embedplayer.site/{imdb_id}"
        r = _vod_session.get(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64)"}, timeout=8)
        if r.status_code != 200:
            return []

        items = re.findall(r"class=[\"\']player_select_item[\"\']\s+idS=[\"\']([^\'\"]+)[\"\']", r.text)
        for idx, ids in enumerate(items[:3]):
            try:
                data = {"idS": ids}
                r_stream = _vod_session.post(
                    "https://embed.embedplayer.site/stream",
                    data=data,
                    headers={
                        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
                        "Referer": url,
                        "Origin": "https://embed.embedplayer.site",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    timeout=8
                )
                if r_stream.status_code != 200:
                    continue
                s_json = r_stream.json()
                sources = s_json.get("resources", {}).get("sources", [])
                if not sources:
                    continue
                video_url = sources[0].get("file", "")
                video_id = video_url.rstrip("/").split("/")[-1]
                if not video_id:
                    continue

                gv_url = f"https://embedplayer2.xyz/player/index.php?data={video_id}&do=getVideo"
                r_gv = _vod_session.post(
                    gv_url,
                    data={"hash": video_id, "r": "https://embed.embedplayer.site/"},
                    headers={
                        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)",
                        "Referer": f"https://embedplayer2.xyz/video/{video_id}",
                        "Origin": "https://embedplayer2.xyz",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    timeout=8
                )
                if r_gv.status_code != 200:
                    continue
                gv_json = r_gv.json()
                m3u8 = gv_json.get("securedLink")
                if m3u8:
                    proxy_m3u8 = f"/api/proxy/stream?url={urllib.parse.quote(m3u8, safe='')}"
                    streams.append({
                        "name": f"EmbedPlayer VIP #{idx+1} (1080p DUAL)",
                        "title": "🎬 1080p WEB-DL Full HD • Português (Dublado)",
                        "url": proxy_m3u8,
                        "_provider": "EmbedPlayer",
                        "behaviorHints": {"notWebReady": False}
                    })
            except Exception:
                pass
    except Exception as exc:
        print(f"[EmbedPlayer Error] {exc}")
    return streams

def validate_stream_alive(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Testa se o link remoto está ativo e não expirado (evita repassar streams mortas/404 para o cliente)."""
    url = item.get("url")
    if not url:
        return None

    # 1. Validação de streams que passam pelo proxy local (/api/proxy/stream?url=...)
    if url.startswith("/api/proxy/stream"):
        try:
            parsed = urllib.parse.urlparse(url)
            qs = urllib.parse.parse_qs(parsed.query)
            target_url = qs.get("url", [None])[0]
            if not target_url:
                return None
            target_url = urllib.parse.unquote(target_url)

            headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64)", "Accept": "*/*"}
            if "embedplayer" in target_url or "plosia" in target_url:
                headers["Referer"] = "https://embedplayer2.xyz/"
                headers["Origin"] = "https://embedplayer2.xyz"
            elif "froststream" in target_url:
                headers["User-Agent"] = "Stremio/4.4.168"

            r = _vod_session.get(target_url, headers=headers, stream=True, timeout=3.0, allow_redirects=True)
            if r.status_code >= 400:
                return None
            return item
        except Exception:
            return None

    # 2. Validação FrostStream
    if "froststream.cloutteam.com" in url:
        try:
            r = _vod_session.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, allow_redirects=False, timeout=2.5)
            if r.status_code >= 400:
                return None
            if r.status_code in (301, 302, 307, 308) and "Location" in r.headers:
                cdn_url = r.headers["Location"]
                try:
                    r_cdn = _vod_session.head(cdn_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=2.0)
                    if r_cdn.status_code >= 400:
                        return None
                except Exception:
                    pass
            return item
        except Exception:
            return None

    # 3. SuperStream ou links diretos
    try:
        r = _vod_session.head(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=2.5, allow_redirects=True)
        if r.status_code >= 400:
            return None
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

    title = details.get("title") or details.get("name") or "Vídeo"

    # Fallback inteligente se TMDB não tiver IMDb ID gravado (ex: animes recentes)
    if not imdb_id and title:
        try:
            suggest_url = f"https://v3.sg.media-imdb.com/suggestion/x/{urllib.parse.quote(title.lower())}.json"
            r_imdb = _vod_session.get(suggest_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=3)
            if r_imdb.status_code == 200:
                for cand in r_imdb.json().get("d", []):
                    c_id = cand.get("id")
                    if c_id and c_id.startswith("tt"):
                        imdb_id = c_id
                        break
        except Exception:
            pass

    if not imdb_id:
        return {
            "title": title,
            "imdb_id": None,
            "tmdb_id": tmdb_id,
            "count": 0,
            "streams": [],
            "best_stream": None,
            "is_cinema_version": False,
            "has_dubbed": False
        }

    raw_streams = []

    # 2. Busca paralela de alta velocidade (FrostStream + SuperStream + EmbedPlayer simultaneamente)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_frost = executor.submit(fetch_froststream, media_type, imdb_id, season, episode)
        f_super = executor.submit(fetch_superstream, media_type, imdb_id, season, episode)
        f_embed = executor.submit(fetch_embedplayer, media_type, imdb_id, season, episode)

        try:
            frost_streams = f_frost.result(timeout=8)
            for s in frost_streams:
                s["_provider"] = "FrostStream"
                raw_streams.append(s)
        except Exception as exc:
            print(f"[Parallel FrostStream Error] {exc}")

        try:
            super_streams = f_super.result(timeout=8)
            for s in super_streams:
                s["_provider"] = "SuperStream"
                raw_streams.append(s)
        except Exception as exc:
            print(f"[Parallel SuperStream Error] {exc}")

        try:
            embed_streams = f_embed.result(timeout=8)
            for s in embed_streams:
                raw_streams.append(s)
        except Exception as exc:
            print(f"[Parallel EmbedPlayer Error] {exc}")

    theatrical_cam = False
    if media_type in ("movie", "filme"):
        release_date = details.get("release_date")
        if is_recent_theatrical_release(release_date):
            theatrical_cam = True

    # 4. Normalizar streams encontrados com desduplicação inteligente
    normalized = []
    seen_media_signatures = set()
    provider_counts = {}

    for idx, s in enumerate(raw_streams):
        url = s.get("url")
        if not url:
            continue

        raw_title = s.get("title", "") or ""
        provider_name = s.get("_provider") or ("EmbedPlayer" if "embedplayer" in url or "plosia" in url else "Servidor")
        name = s.get("name", "") or provider_name
        is_cam = is_cinema_cam(raw_title, name)
        quality = parse_quality(raw_title, name, is_cam=is_cam)
        audio = parse_audio(raw_title, name)

        # Detecta se é HEVC/H.265
        is_hevc = bool(re.search(r'\b(HEVC|H\.?265|X265|2160P|4K)\b', f"{raw_title} {name} {url}", re.IGNORECASE)) and ("4K" in quality or "HEVC" in raw_title)

        # Limita redundância a no máximo 2 mirrors para não poluir a lista
        mirror_key = f"{provider_name}_{quality}_{audio}"
        provider_counts[mirror_key] = provider_counts.get(mirror_key, 0) + 1
        mirror_num = provider_counts[mirror_key]
        if mirror_num > 2:
            continue

        prov_display = f"{provider_name} #{mirror_num}" if mirror_num > 1 else provider_name
        clean_name = f"{quality} • {audio} [{prov_display}]"
        if is_hevc:
            clean_name += " • HEVC"

        details_label = raw_title.replace("\n", " • ").strip()

        normalized.append({
            "id": f"stream_{idx+1}",
            "name": name,
            "quality": quality,
            "audio": audio,
            "is_cinema": is_cam,
            "is_hevc": is_hevc,
            "label": clean_name,
            "details": details_label,
            "url": url,
            "provider": provider_name,
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

    # 4.2 Filtragem Estrita Anti-Cinema: Se já existe qualquer versão digital limpa (4K, 1080p, 720p),
    # descarta 100% das gravações de cinema (CAM/TS) para não poluir a lista nem correr risco de tocar CAM
    has_digital_clean = any(not s.get("is_cinema", False) for s in normalized)
    if has_digital_clean:
        normalized = [s for s in normalized if not s.get("is_cinema", False)]

    # 5. Algoritmo de Priorização Máxima de Qualidade (Best Stream Selection):
    # Foco total na melhor experiência possível:
    # 1º: Versão Digital limpa (WEB-DL/BluRay)
    # 2º: Áudio em Português Dublado ou Dual Audio
    # 3º: Máxima Resolução (4K Ultra HD > 1080p Full HD > 720p HD)
    def calculate_score(item):
        score = 0
        # Resolução e fidelidade visual
        q = item.get("quality", "")
        if "4K" in q:
            score += 180
        elif "1080p" in q:
            score += 110
        elif "720p" in q:
            score += 50
        else:
            score += 20

        # Áudio: Português Dublado é rei no conforto nacional
        a = item.get("audio", "")
        if "Português" in a:
            score += 100
        elif "Legendado" in a:
            score += 40
        else:
            score += 15

        # Versão Digital vs Cinema CAM
        if item.get("is_cinema", False):
            score -= 300  # Penaliza brutalmente cópia gravada
        else:
            score += 80   # Bônus para versão digital de alta fidelidade

        # Bônus de rapidez e CDN estável
        prov = item.get("provider", "")
        if prov == "EmbedPlayer":
            score += 30
        elif prov == "SuperStream":
            score += 25
        elif prov == "FrostStream":
            score += 20

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
