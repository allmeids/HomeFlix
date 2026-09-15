import requests
import time
from typing import List, Dict, Any, Optional

PLUTO_CHANNELS_URL = "https://api.pluto.tv/v2/channels.json"

_CHANNELS_CACHE = {
    "data": [],
    "categories": [],
    "updated_at": 0
}
CACHE_TTL = 900  # 15 minutos

# Mapeamento para normalizar categorias amigáveis
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
}

def get_live_channels(force_refresh: bool = False) -> Dict[str, Any]:
    global _CHANNELS_CACHE
    now = time.time()
    if not force_refresh and _CHANNELS_CACHE["data"] and (now - _CHANNELS_CACHE["updated_at"] < CACHE_TTL):
        return {
            "channels": _CHANNELS_CACHE["data"],
            "categories": _CHANNELS_CACHE["categories"],
            "total": len(_CHANNELS_CACHE["data"])
        }

    try:
        r = requests.get(PLUTO_CHANNELS_URL, timeout=8)
        if r.status_code == 200:
            raw_channels = r.json()
            channels = []
            category_set = set()

            for c in raw_channels:
                # Pega stream HLS
                stream_urls = c.get("stitched", {}).get("urls", [])
                stream_url = stream_urls[0].get("url") if stream_urls else None
                if not stream_url:
                    continue

                raw_cat = c.get("category") or "Geral"
                norm_cat = CATEGORY_MAP.get(raw_cat, raw_cat)
                category_set.add(norm_cat)

                # Imagens / Logos
                images = c.get("images", [])
                logo = None
                for img in images:
                    if img.get("type") in ("colorLogoPNG", "solidLogoPNG", "thumbnail"):
                        logo = img.get("url")
                        break
                if not logo and images:
                    logo = images[0].get("url")

                # Programação atual (se houver)
                timelines = c.get("timelines", [])
                current_show = timelines[0].get("title", "Programação Ao Vivo") if timelines else "Ao Vivo"
                synopsis = timelines[0].get("episode", {}).get("description", "") if timelines else c.get("summary", "")

                channels.append({
                    "id": c.get("id") or str(c.get("number")),
                    "number": c.get("number"),
                    "name": c.get("name"),
                    "category": norm_cat,
                    "summary": synopsis or c.get("summary") or "Transmissão contínua em alta definição.",
                    "current_show": current_show,
                    "logo": logo,
                    "stream_url": stream_url,
                    "is_live": True
                })

            # Ordena por número de canal
            channels.sort(key=lambda x: x.get("number") or 9999)
            categories = ["Todos"] + sorted(list(category_set))

            _CHANNELS_CACHE["data"] = channels
            _CHANNELS_CACHE["categories"] = categories
            _CHANNELS_CACHE["updated_at"] = now

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
