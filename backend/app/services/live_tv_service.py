import requests
import datetime
import time
from typing import List, Dict, Any, Optional

_CHANNELS_CACHE = {
    "data": [],
    "categories": [],
    "updated_at": 0
}
CACHE_TTL = 300  # 5 minutos para manter o EPG do que está passando atualizado

CATEGORY_MAP = {
    "Filmes": "Filmes e Séries",
    "Séries": "Filmes e Séries",
    "Anime": "Animes & Infantil",
    "Infantil": "Animes & Infantil",
    "Kids": "Animes & Infantil",
    "Notícias": "Notícias & Jornalismo",
    "Entretenimento": "Variedades & Comédia",
    "Comédia": "Variedades & Comédia",
    "Música": "Música & Cultura",
    "Estilo de Vida": "Variedades & Comédia",
    "Curiosidades": "Documentários & Ciência",
    "Investigação": "Documentários & Ciência",
    "Esportes": "Esportes & Lutas",
}

def get_live_channels(force_refresh: bool = False) -> Dict[str, Any]:
    global _CHANNELS_CACHE
    now_ts = time.time()
    if not force_refresh and _CHANNELS_CACHE["data"] and (now_ts - _CHANNELS_CACHE["updated_at"] < CACHE_TTL):
        return {
            "channels": _CHANNELS_CACHE["data"],
            "categories": _CHANNELS_CACHE["categories"],
            "total": len(_CHANNELS_CACHE["data"])
        }

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    start_str = now_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
    stop_str = (now_utc + datetime.timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    url = f"https://api.pluto.tv/v2/channels?start={start_str}&stop={stop_str}"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            r = requests.get("https://api.pluto.tv/v2/channels.json", timeout=8)

        if r.status_code == 200:
            raw_channels = r.json()
            channels = []
            category_set = set()

            for c in raw_channels:
                # 1. Stream URL
                stream_urls = c.get("stitched", {}).get("urls", [])
                stream_url = stream_urls[0].get("url") if stream_urls else None
                if not stream_url:
                    continue

                # 2. Categoria
                raw_cat = c.get("category") or "Geral"
                norm_cat = CATEGORY_MAP.get(raw_cat, raw_cat)
                category_set.add(norm_cat)

                # 3. Logos Oficiais em Alta Resolução
                logo = (
                    (c.get("colorLogoPNG") or {}).get("path") or
                    (c.get("logo") or {}).get("path") or
                    (c.get("solidLogoPNG") or {}).get("path")
                )

                # 4. Banner Panorâmico de Fundo (Featured Image 16:9)
                featured_image = (
                    (c.get("featuredImage") or {}).get("path") or
                    (c.get("thumbnail") or {}).get("path")
                )

                # 5. Guia de Programação Atual (Now Playing EPG)
                timelines = c.get("timelines", [])
                current_show = "Transmissão Ao Vivo"
                episode_title = ""
                synopsis = c.get("summary") or "Transmissão contínua em alta definição."
                progress_pct = 50

                if timelines and isinstance(timelines, list):
                    tl = timelines[0]
                    current_show = tl.get("title") or current_show
                    ep = tl.get("episode") or {}
                    episode_title = ep.get("name") or ""
                    synopsis = ep.get("description") or synopsis

                    # Calcula progresso aproximado do programa no ar
                    try:
                        start_time = datetime.datetime.fromisoformat(tl.get("start").replace("Z", "+00:00"))
                        stop_time = datetime.datetime.fromisoformat(tl.get("stop").replace("Z", "+00:00"))
                        total_sec = (stop_time - start_time).total_seconds()
                        elapsed_sec = (now_utc - start_time).total_seconds()
                        if total_sec > 0:
                            progress_pct = max(5, min(95, int((elapsed_sec / total_sec) * 100)))
                    except Exception:
                        progress_pct = 40

                channels.append({
                    "id": c.get("id") or str(c.get("number")),
                    "number": c.get("number"),
                    "name": c.get("name"),
                    "category": norm_cat,
                    "summary": synopsis,
                    "current_show": current_show,
                    "episode_title": episode_title,
                    "progress_pct": progress_pct,
                    "logo": logo,
                    "featured_image": featured_image,
                    "stream_url": stream_url,
                    "is_live": True
                })

            channels.sort(key=lambda x: x.get("number") or 9999)
            categories = ["Todos"] + sorted(list(category_set))

            _CHANNELS_CACHE["data"] = channels
            _CHANNELS_CACHE["categories"] = categories
            _CHANNELS_CACHE["updated_at"] = now_ts

            return {
                "channels": channels,
                "categories": categories,
                "total": len(channels)
            }
    except Exception as exc:
        print(f"[Live TV Error] {exc}")

    return {
        "channels": _CHANNELS_CACHE["data"],
        "categories": _CHANNELS_CACHE["categories"],
        "total": len(_CHANNELS_CACHE["data"])
    }

def get_channel_by_id(channel_id: str) -> Optional[Dict[str, Any]]:
    catalog = get_live_channels()
    for ch in catalog.get("channels", []):
        if str(ch["id"]) == str(channel_id) or str(ch.get("number")) == str(channel_id):
            return ch
    return None
