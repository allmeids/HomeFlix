import requests
import datetime
import time
import uuid
import re
import urllib.parse
from fastapi import Response
from typing import List, Dict, Any, Optional

_CHANNELS_CACHE = {
    "data": [],
    "categories": [],
    "updated_at": 0
}
CACHE_TTL = 300  # 5 minutos

_BOOT_CACHE = {
    "token": "",
    "stitcher_url": "",
    "stitcher_params": "",
    "ts": 0
}

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

def get_pluto_boot():
    global _BOOT_CACHE
    now = time.time()
    if _BOOT_CACHE["token"] and (now - _BOOT_CACHE["ts"] < 1800):
        return _BOOT_CACHE

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    params = {
        "appName": "web",
        "appVersion": "7.0.0",
        "deviceVersion": "122.0.0",
        "deviceModel": "web",
        "deviceMake": "chrome",
        "deviceType": "web",
        "clientID": str(uuid.uuid4()),
        "clientModelNumber": "1.0.0",
        "serverSideAds": "false",
        "clientTime": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    try:
        r = requests.get("https://boot.pluto.tv/v4/start", params=params, headers=headers, timeout=8)
        if r.status_code == 200:
            data = r.json()
            _BOOT_CACHE = {
                "token": data.get("sessionToken", ""),
                "stitcher_url": (data.get("servers", {}) or {}).get("stitcher", "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv"),
                "stitcher_params": (data.get("stitcherParams", "") or "").lstrip("?&"),
                "ts": now
            }
    except Exception as exc:
        print(f"[Pluto Boot Error] {exc}")

    return _BOOT_CACHE

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
                real_id = c.get("_id") or c.get("id") or str(c.get("number"))
                if not real_id:
                    continue

                raw_cat = c.get("category") or "Geral"
                norm_cat = CATEGORY_MAP.get(raw_cat, raw_cat)
                category_set.add(norm_cat)

                # Logos Oficiais em Alta Resolução
                logo = (
                    (c.get("colorLogoPNG") or {}).get("path") or
                    (c.get("logo") or {}).get("path") or
                    (c.get("solidLogoPNG") or {}).get("path")
                )

                # Banner Panorâmico de Fundo (Featured Image 16:9)
                featured_image = (
                    (c.get("featuredImage") or {}).get("path") or
                    (c.get("thumbnail") or {}).get("path")
                )

                # Guia de Programação Atual (Now Playing EPG)
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

                    try:
                        start_time = datetime.datetime.fromisoformat(tl.get("start").replace("Z", "+00:00"))
                        stop_time = datetime.datetime.fromisoformat(tl.get("stop").replace("Z", "+00:00"))
                        total_sec = (stop_time - start_time).total_seconds()
                        elapsed_sec = (now_utc - start_time).total_seconds()
                        if total_sec > 0:
                            progress_pct = max(5, min(95, int((elapsed_sec / total_sec) * 100)))
                    except Exception:
                        progress_pct = 40

                # URL do stream via proxy local anti-CORS
                stream_url = f"/api/live/stream/{real_id}.m3u8"

                channels.append({
                    "id": real_id,
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

def get_channel_live_playlist(channel_id: str) -> Response:
    boot = get_pluto_boot()
    token = boot.get("token", "")
    stitcher_params = boot.get("stitcher_params", "")
    stitcher_url = boot.get("stitcher_url", "https://cfd-v4-service-channel-stitcher-use1-1.prd.pluto.tv")

    master_url = f"{stitcher_url}/v2/stitch/hls/channel/{channel_id}/master.m3u8?jwt={token}&masterJWTPassthrough=true"
    if stitcher_params:
        master_url += f"&{stitcher_params}"

    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    try:
        r = requests.get(master_url, headers=headers, timeout=8)
        if r.status_code != 200:
            # Se expirou token, força refresh do boot
            _BOOT_CACHE["ts"] = 0
            boot = get_pluto_boot()
            master_url = f"{boot['stitcher_url']}/v2/stitch/hls/channel/{channel_id}/master.m3u8?jwt={boot['token']}&masterJWTPassthrough=true&{boot['stitcher_params']}"
            r = requests.get(master_url, headers=headers, timeout=8)

        if r.status_code != 200:
            return Response(content="#EXTM3U\n# Canal Indisponível\n", status_code=r.status_code)

        base_variant_url = master_url.rsplit("/", 1)[0] + "/"
        rewritten_lines = []

        for line in r.text.splitlines():
            line_strip = line.strip()
            if not line_strip:
                continue
            if line_strip.startswith("#"):
                if "URI=" in line_strip:
                    def repl_sub(m):
                        sub_uri = m.group(2)
                        full_sub = urllib.parse.urljoin(base_variant_url, sub_uri)
                        proxied_sub = f"/api/proxy/stream?url={urllib.parse.quote(full_sub)}"
                        return f"URI={m.group(1)}{proxied_sub}{m.group(1)}"
                    line_strip = re.sub(r'URI=("|\')(.*?)(\1)', repl_sub, line_strip)
                rewritten_lines.append(line_strip)
            else:
                full_variant = urllib.parse.urljoin(base_variant_url, line_strip)
                proxied = f"/api/proxy/stream?url={urllib.parse.quote(full_variant)}"
                rewritten_lines.append(proxied)

        content = "\n".join(rewritten_lines) + "\n"
        return Response(
            content=content,
            media_type="application/vnd.apple.mpegurl",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "no-cache, no-store"
            }
        )
    except Exception as exc:
        print(f"[Playlist Proxy Error] {exc}")
        return Response(content=f"# Error: {str(exc)}", status_code=500)

def get_channel_by_id(channel_id: str) -> Optional[Dict[str, Any]]:
    catalog = get_live_channels()
    for ch in catalog.get("channels", []):
        if str(ch["id"]) == str(channel_id) or str(ch.get("number")) == str(channel_id):
            return ch
    return None
