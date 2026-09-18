import re
import urllib.parse
from typing import List, Dict, Any, Optional
import requests
from app.services.tmdb_service import get_media_details

USER_AGENT = "HomeFlix/1.0 (Smart TV; Linux x86_64)"
SUB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*"
}

OPEN_SUBTITLES_STREMIO_URL = "https://opensubtitles-v3.strem.io"

def convert_srt_to_vtt(srt_text: str) -> str:
    """Converte conteúdo SRT para o padrão WebVTT compatível com HTML5 <track>."""
    if srt_text.strip().startswith("WEBVTT"):
        return srt_text
    
    # Normaliza quebras de linha
    normalized = srt_text.replace("\r\n", "\n").replace("\r", "\n")
    
    # Converte marcações de tempo 00:00:00,000 --> 00:00:00.000
    converted = re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', normalized)
    
    return f"WEBVTT\n\n{converted.strip()}\n"

def fetch_subtitle_vtt(sub_url: str) -> str:
    """Baixa o arquivo de legenda remoto e converte para WebVTT UTF-8."""
    try:
        resp = requests.get(sub_url, headers=SUB_HEADERS, timeout=12)
        resp.raise_for_status()
        
        # Tenta decodificar com auto-detecção ou fallbacks comuns
        encoding = resp.encoding or "utf-8"
        try:
            content = resp.content.decode(encoding)
        except Exception:
            try:
                content = resp.content.decode("utf-8")
            except Exception:
                content = resp.content.decode("latin-1", errors="replace")
                
        return convert_srt_to_vtt(content)
    except Exception as exc:
        print(f"[SubtitleService Download Error] {exc}")
        return "WEBVTT\n\nNOTE Erro ao carregar legenda remota.\n"

def get_subtitles(media_type: str, tmdb_id: str, season: Optional[int] = None, episode: Optional[int] = None) -> List[Dict[str, Any]]:
    """Busca faixas de legendas externas (com foco em PT-BR) para o título especificado."""
    # 1. Resolver IMDb ID
    details = get_media_details(media_type, tmdb_id)
    external_ids = details.get("external_ids", {})
    imdb_id = external_ids.get("imdb_id")

    if not imdb_id:
        return []

    is_tv = media_type in ("tv", "series")
    s = season or 1
    ep = episode or 1

    if is_tv:
        url = f"{OPEN_SUBTITLES_STREMIO_URL}/subtitles/series/{imdb_id}:{s}:{ep}.json"
    else:
        url = f"{OPEN_SUBTITLES_STREMIO_URL}/subtitles/movie/{imdb_id}.json"

    raw_subs = []
    try:
        r = requests.get(url, headers=SUB_HEADERS, timeout=10)
        if r.status_code == 200:
            raw_subs = r.json().get("subtitles", [])
    except Exception as exc:
        print(f"[SubtitleService Query Error] {exc}")

    if not raw_subs:
        return []

    results: List[Dict[str, Any]] = []
    
    # 2. Filtrar e ordenar legendas em Português
    pt_langs = {"pob", "por", "pt", "pt-br", "pt_br", "pb"}
    
    pt_subs = []
    other_subs = []
    
    for sub in raw_subs:
        lang = (sub.get("lang") or "").lower()
        sub_url = sub.get("url")
        if not sub_url:
            continue
        
        rel = sub.get("releaseGroup") or sub.get("movieReleaseName") or ""
        sub_id = str(sub.get("id") or len(results) + 1)
        encoded_url = urllib.parse.quote(sub_url, safe="")
        vtt_url = f"/api/subtitles/vtt?url={encoded_url}"
        
        entry = {
            "id": sub_id,
            "lang": "pt-BR" if lang in pt_langs else lang,
            "label": f"Português ({rel[:22]})" if (lang in pt_langs and rel) else ("Português (Brasil)" if lang in pt_langs else f"{lang.upper()} ({rel[:18]})"),
            "url": sub_url,
            "vtt_url": vtt_url,
            "is_pt": lang in pt_langs
        }
        
        if lang in pt_langs:
            pt_subs.append(entry)
        elif lang in {"eng", "en"} and len(other_subs) < 3:
            other_subs.append(entry)

    # Coloca legendas em português no topo
    results.extend(pt_subs)
    results.extend(other_subs)

    return results
