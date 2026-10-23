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

# Canais Abertos Nacionais do Brasil (Streams Legais Públicos Verificados)
BRAZILIAN_OPEN_CHANNELS = [
    {
        "id": "br_tv_brasil",
        "number": 1,
        "name": "TV Brasil",
        "category": "TV Aberta",
        "summary": "Emissora pública da Empresa Brasil de Comunicação (EBC) com jornalismo, cultura, filmes brasileiros e programação educativa.",
        "current_show": "Programação Ao Vivo",
        "episode_title": "Transmissão Nacional HD",
        "time_range": "24 Horas",
        "next_show": "A seguir: Repórter Brasil",
        "progress_pct": 50,
        "logo": "/static/icons/channels/tv_brasil.svg",
        "featured_image": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&q=80",
        "stream_url": "/api/live/stream/br_tv_brasil.m3u8",
        "source_url": "https://tvbrasil-stream.ebc.com.br/index.m3u8",
        "backup_urls": [],
        "is_live": True
    },
    {
        "id": "br_tv_cultura",
        "number": 2,
        "name": "TV Cultura",
        "category": "TV Aberta",
        "summary": "Uma das emissoras públicas de maior prestígio do mundo, referência em jornalismo crítico, infantojuvenil e documentários.",
        "current_show": "Jornalismo & Cultura",
        "episode_title": "Fundação Padre Anchieta",
        "time_range": "24 Horas",
        "next_show": "A seguir: Jornal da Cultura",
        "progress_pct": 45,
        "logo": "/static/icons/channels/tv_cultura.svg",
        "featured_image": "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1280&q=80",
        "stream_url": "/api/live/stream/br_tv_cultura.m3u8",
        "source_url": "https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8",
        "backup_urls": [
            "https://fpa-gateway.tvcultura.com.br:8181/memfs/606caef0-a290-413d-9f1f-8fcdb3a73831.m3u8"
        ],
        "is_live": True
    },
    {
        "id": "br_band",
        "number": 4,
        "name": "Band (New Brasil)",
        "category": "TV Aberta",
        "summary": "Canal oficial do Grupo Bandeirantes de Comunicação com jornalismo ágil, automobilismo, MasterChef e entretenimento.",
        "current_show": "Jornalismo & Entretenimento",
        "episode_title": "Rede Bandeirantes",
        "time_range": "24 Horas",
        "next_show": "A seguir: Jornal da Band",
        "progress_pct": 60,
        "logo": "/static/icons/channels/band.svg",
        "featured_image": "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1280&q=80",
        "stream_url": "/api/live/stream/br_band.m3u8",
        "source_url": "https://dfr80qz435crc.cloudfront.net/EFGH/Amagi/NewCo/New_Brasil_BR/New_Brasil.m3u8",
        "backup_urls": [
            "http://170.83.49.66:8083/BANDNEWSHD/index.m3u8"
        ],
        "is_live": True
    },
    {
        "id": "br_sbt",
        "number": 5,
        "name": "SBT",
        "category": "TV Aberta",
        "summary": "A emissora mais alegre do Brasil: novelas consagradas, programas de auditório, humor, Chaves e jornalismo popular.",
        "current_show": "Programação Geral SBT",
        "episode_title": "Sistema Brasileiro de Televisão",
        "time_range": "24 Horas",
        "next_show": "A seguir: SBT Brasil",
        "progress_pct": 55,
        "logo": "/static/icons/channels/sbt.svg",
        "featured_image": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1280&q=80",
        "stream_url": "/api/live/stream/br_sbt.m3u8",
        "source_url": "https://video09.logicahost.com.br/sbtmutum/sbtmutum/playlist.m3u8",
        "backup_urls": [
            "https://video09.logicahost.com.br/sbtroo/sbtroo/playlist.m3u8"
        ],
        "is_live": True
    },
    {
        "id": "br_record_news",
        "number": 7,
        "name": "Record News",
        "category": "TV Aberta",
        "summary": "Primeiro e maior canal de notícias 24 horas em TV aberta no Brasil, cobrindo política, economia, esporte e internacional.",
        "current_show": "Record News Ao Vivo 24h",
        "episode_title": "Jornalismo em Tempo Real",
        "time_range": "24 Horas",
        "next_show": "A seguir: Conexão Record News",
        "progress_pct": 70,
        "logo": "/static/icons/channels/record_news.svg",
        "featured_image": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1280&q=80",
        "stream_url": "/api/live/stream/br_record_news.m3u8",
        "source_url": "https://rnw-rn.otteravision.com/rnw/rn/rnw_rn.m3u8",
        "backup_urls": [],
        "is_live": True
    },
    {
        "id": "br_cnn_brasil",
        "number": 8,
        "name": "CNN Brasil",
        "category": "TV Aberta",
        "summary": "O maior canal de notícias do mundo com edição brasileira: política direto de Brasília, grandes debates e breaking news.",
        "current_show": "CNN Brasil Ao Vivo",
        "episode_title": "Cobertura Especial",
        "time_range": "24 Horas",
        "next_show": "A seguir: CNN Arena",
        "progress_pct": 40,
        "logo": "/static/icons/channels/cnn_brasil.svg",
        "featured_image": "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1280&q=80",
        "stream_url": "/api/live/stream/br_cnn_brasil.m3u8",
        "source_url": "https://d25usgadhphvwi.cloudfront.net/hls/main.m3u8",
        "backup_urls": [],
        "is_live": True
    },
    {
        "id": "br_canal_gov",
        "number": 9,
        "name": "Canal Gov",
        "category": "TV Aberta",
        "summary": "Canal de utilidade pública do Governo Federal com coletivas, comunicados oficiais, prestação de serviços e programas de cidadania.",
        "current_show": "Transmissão Oficial Gov",
        "episode_title": "EBC Empresa Brasil de Comunicação",
        "time_range": "24 Horas",
        "next_show": "A seguir: Notícias do Governo",
        "progress_pct": 50,
        "logo": "/static/icons/channels/canal_gov.svg",
        "featured_image": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1280&q=80",
        "stream_url": "/api/live/stream/br_canal_gov.m3u8",
        "source_url": "https://canalgov-stream.ebc.com.br/index.m3u8",
        "backup_urls": [],
        "is_live": True
    },
    {
        "id": "br_rede_brasil",
        "number": 10,
        "name": "Rede Brasil de Televisão",
        "category": "TV Aberta",
        "summary": "Clássicos da televisão, filmes nostálgicos, séries inesquecíveis, animes retrô e conteúdo para todas as idades.",
        "current_show": "Séries e Clássicos Retrô",
        "episode_title": "Rede Brasil",
        "time_range": "24 Horas",
        "next_show": "A seguir: Sessão Nostalgia",
        "progress_pct": 65,
        "logo": "/static/icons/channels/rede_brasil.svg",
        "featured_image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1280&q=80",
        "stream_url": "/api/live/stream/br_rede_brasil.m3u8",
        "source_url": "https://redebrasil.nuvemplay.live/hls/stream.m3u8",
        "backup_urls": [
            "https://video09.logicahost.com.br/redebrasiloficial/redebrasiloficial/playlist.m3u8"
        ],
        "is_live": True
    },
    {
        "id": "br_tv_camara",
        "number": 11,
        "name": "TV Câmara",
        "category": "TV Aberta",
        "summary": "Canal oficial da Câmara dos Deputados em Brasília: sessões plenárias ao vivo, votação de leis, documentários e cidadania.",
        "current_show": "Sessão Plenária e Comissões",
        "episode_title": "Câmara dos Deputados",
        "time_range": "24 Horas",
        "next_show": "A seguir: Câmara Notícias",
        "progress_pct": 50,
        "logo": "/static/icons/channels/tv_camara.svg",
        "featured_image": "https://images.unsplash.com/photo-1520690214107-7371d41780b2?w=1280&q=80",
        "stream_url": "/api/live/stream/br_tv_camara.m3u8",
        "source_url": "https://stream3.camara.gov.br/tv1/manifest.m3u8",
        "backup_urls": [],
        "is_live": True
    },
    {
        "id": "br_tv_senado",
        "number": 12,
        "name": "TV Senado",
        "category": "TV Aberta",
        "summary": "Primeira emissora legislativa do país: transmissão de sessões do plenário do Senado Federal, debates e grandes temas nacionais.",
        "current_show": "Plenário do Senado Federal",
        "episode_title": "Senado Notícias",
        "time_range": "24 Horas",
        "next_show": "A seguir: Ordem do Dia",
        "progress_pct": 50,
        "logo": "/static/icons/channels/tv_senado.svg",
        "featured_image": "https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=1280&q=80",
        "stream_url": "/api/live/stream/br_tv_senado.m3u8",
        "source_url": "http://45.162.64.114/TV_SENADO/index.m3u8",
        "backup_urls": [
            "http://170.83.49.66:8083/TVSENADOHD/index.m3u8"
        ],
        "is_live": True
    }
]

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

                    time_range = ""
                    next_show = ""
                    try:
                        start_time = datetime.datetime.fromisoformat(tl.get("start").replace("Z", "+00:00"))
                        stop_time = datetime.datetime.fromisoformat(tl.get("stop").replace("Z", "+00:00"))
                        total_sec = (stop_time - start_time).total_seconds()
                        elapsed_sec = (now_utc - start_time).total_seconds()
                        if total_sec > 0:
                            progress_pct = max(5, min(95, int((elapsed_sec / total_sec) * 100)))

                        # Converter para fuso horário local
                        local_tz = datetime.datetime.now().astimezone().tzinfo
                        start_local = start_time.astimezone(local_tz)
                        stop_local = stop_time.astimezone(local_tz)
                        time_range = f"{start_local.strftime('%H:%M')} - {stop_local.strftime('%H:%M')}"

                        if len(timelines) > 1:
                            next_tl = timelines[1]
                            next_title = next_tl.get("title") or ""
                            if next_title:
                                next_start = datetime.datetime.fromisoformat(next_tl.get("start").replace("Z", "+00:00")).astimezone(local_tz)
                                next_show = f"A seguir: {next_title} ({next_start.strftime('%H:%M')})"
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
                    "time_range": time_range,
                    "next_show": next_show,
                    "progress_pct": progress_pct,
                    "logo": logo,
                    "featured_image": featured_image,
                    "stream_url": stream_url,
                    "is_live": True
                })

            # Unifica Canais Abertos Nacionais com os canais da Pluto TV
            category_set.add("TV Aberta")
            unified_channels = list(BRAZILIAN_OPEN_CHANNELS) + channels
            unified_channels.sort(key=lambda x: x.get("number") or 9999)
            categories = ["Todos", "TV Aberta"] + sorted([c for c in category_set if c != "TV Aberta"])

            _CHANNELS_CACHE["data"] = unified_channels
            _CHANNELS_CACHE["categories"] = categories
            _CHANNELS_CACHE["updated_at"] = now_ts

            return {
                "channels": unified_channels,
                "categories": categories,
                "total": len(unified_channels)
            }
    except Exception as exc:
        print(f"[Live TV Error] {exc}")

    # Fallback seguro com canais abertos caso haja instabilidade externa
    fallback_data = _CHANNELS_CACHE["data"] if _CHANNELS_CACHE["data"] else list(BRAZILIAN_OPEN_CHANNELS)
    fallback_categories = _CHANNELS_CACHE["categories"] if _CHANNELS_CACHE["categories"] else ["Todos", "TV Aberta"]

    return {
        "channels": fallback_data,
        "categories": fallback_categories,
        "total": len(fallback_data)
    }

def get_channel_live_playlist(channel_id: str) -> Response:
    # 1. Suporte prioritário para Canais Abertos Nacionais do Brasil
    open_ch = None
    for ch in BRAZILIAN_OPEN_CHANNELS:
        if str(ch["id"]) == str(channel_id) or str(ch.get("number")) == str(channel_id):
            open_ch = ch
            break

    if open_ch:
        urls_to_try = [open_ch["source_url"]] + open_ch.get("backup_urls", [])
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*"
        }
        for target_url in urls_to_try:
            try:
                parsed = urllib.parse.urlparse(target_url)
                req_headers = headers.copy()
                req_headers["Referer"] = f"{parsed.scheme}://{parsed.netloc}/"
                r = requests.get(target_url, headers=req_headers, timeout=7)
                if r.status_code == 200 and ("#EXTM3U" in r.text or "mpegurl" in r.headers.get("Content-Type", "").lower()):
                    base_variant_url = target_url.rsplit("/", 1)[0] + "/"
                    rewritten_lines = []

                    for line in r.text.splitlines():
                        line_strip = line.strip()
                        if not line_strip:
                            continue
                        if line_strip.startswith("#"):
                            if "URI=" in line_strip:
                                def repl_sub(m):
                                    quote_char = m.group(1)
                                    sub_uri = m.group(2)
                                    full_sub = urllib.parse.urljoin(base_variant_url, sub_uri)
                                    proxied_sub = f"/api/proxy/stream?url={urllib.parse.quote(full_sub, safe='')}"
                                    return f"URI={quote_char}{proxied_sub}{quote_char}"
                                line_strip = re.sub(r'URI=("|\')(.*?)(\1)', repl_sub, line_strip)
                            rewritten_lines.append(line_strip)
                        else:
                            full_variant = urllib.parse.urljoin(base_variant_url, line_strip)
                            proxied = f"/api/proxy/stream?url={urllib.parse.quote(full_variant, safe='')}"
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
                print(f"[Open TV Stream Proxy Error] {target_url}: {exc}")
                continue

        return Response(content="#EXTM3U\n# Canal Aberto Indisponível Temporariamente\n", status_code=503)

    # 2. Pluto TV Channels
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
                        proxied_sub = f"/api/proxy/stream?url={urllib.parse.quote(full_sub, safe='')}"
                        return f"URI={m.group(1)}{proxied_sub}{m.group(1)}"
                    line_strip = re.sub(r'URI=("|\')(.*?)(\1)', repl_sub, line_strip)
                rewritten_lines.append(line_strip)
            else:
                full_variant = urllib.parse.urljoin(base_variant_url, line_strip)
                proxied = f"/api/proxy/stream?url={urllib.parse.quote(full_variant, safe='')}"
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
