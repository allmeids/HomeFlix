import requests
import time
from typing import Dict, Any, Optional, List

TMDB_API_KEY = "92c1507cc18d85290e7a0b96abb37316"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
LANGUAGE = "pt-BR"
REGION = "BR"

# Cache em memória simples com TTL
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 3600  # 1 hora para alta performance

def _get_cached(key: str) -> Optional[Any]:
    record = _CACHE.get(key)
    if record and time.time() - record["time"] < CACHE_TTL:
        return record["data"]
    return None

def _set_cached(key: str, data: Any):
    _CACHE[key] = {"data": data, "time": time.time()}

# Sessão HTTP persistente para Keep-Alive e alto desempenho
_session = requests.Session()
_adapter = requests.adapters.HTTPAdapter(pool_connections=15, pool_maxsize=30, max_retries=2)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)

def tmdb_request(endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    query_params = {
        "api_key": TMDB_API_KEY,
        "language": LANGUAGE,
        "region": REGION
    }
    if params:
        query_params.update(params)

    cache_key = f"{endpoint}_{sorted(query_params.items())}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    url = f"{TMDB_BASE_URL}/{endpoint.lstrip('/')}"
    try:
        response = _session.get(url, params=query_params, timeout=8)
        response.raise_for_status()
        data = response.json()
        _set_cached(cache_key, data)
        return data
    except Exception as exc:
        print(f"[TMDB Error] {endpoint}: {exc}")
        return {}

def get_trending(media_type: str = "all", time_window: str = "week") -> List[Dict[str, Any]]:
    data = tmdb_request(f"trending/{media_type}/{time_window}")
    return data.get("results", [])

def get_popular_movies(page: int = 1) -> List[Dict[str, Any]]:
    data = tmdb_request("movie/popular", {"page": page})
    return data.get("results", [])

def get_popular_series(page: int = 1) -> List[Dict[str, Any]]:
    data = tmdb_request("tv/popular", {"page": page})
    return data.get("results", [])

def get_top_rated_movies(page: int = 1) -> List[Dict[str, Any]]:
    data = tmdb_request("movie/top_rated", {"page": page})
    return data.get("results", [])

def get_top_rated_series(page: int = 1) -> List[Dict[str, Any]]:
    data = tmdb_request("tv/top_rated", {"page": page})
    return data.get("results", [])

def get_now_playing(page: int = 1) -> List[Dict[str, Any]]:
    data = tmdb_request("movie/now_playing", {"page": page})
    return data.get("results", [])

def get_superheroes(page: int = 1) -> List[Dict[str, Any]]:
    # Marvel Studios (420), Marvel Ent (7505), DC Entertainment (9993), DC Films (128064)
    data = tmdb_request("discover/movie", {
        "with_companies": "420|7505|9993|128064",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_action_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Ação (28) e Aventura (12)
    data = tmdb_request("discover/movie", {
        "with_genres": "28,12",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_scifi_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Ficção Científica (878) e Fantasia (14)
    data = tmdb_request("discover/movie", {
        "with_genres": "878,14",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_comedy_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Comédia (35)
    data = tmdb_request("discover/movie", {
        "with_genres": "35",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_horror_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Terror (27) e Suspense (53)
    data = tmdb_request("discover/movie", {
        "with_genres": "27,53",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_family_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Família (10751) e Animação (16)
    data = tmdb_request("discover/movie", {
        "with_genres": "10751,16",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_animes(page: int = 1) -> List[Dict[str, Any]]:
    # Animação japonesa (Genre 16 = Animation, Original Language = ja)
    data = tmdb_request("discover/tv", {
        "with_genres": "16",
        "with_original_language": "ja",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_thriller_movies(page: int = 1) -> List[Dict[str, Any]]:
    # Mistério (9648) e Crime (80)
    data = tmdb_request("discover/movie", {
        "with_genres": "9648,80",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

def get_documentaries(page: int = 1) -> List[Dict[str, Any]]:
    # Documentário (99)
    data = tmdb_request("discover/movie", {
        "with_genres": "99",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

# =====================================================================
# ACERVO EXPANDIDO DE ANIMES & SAGAS LENDÁRIAS (CURADORIA DE ALTA VELOCIDADE)
# =====================================================================

ANIME_SAGAS_DEF = [
    # Os Cavaleiros do Zodíaco (Todas as Sagas)
    ("tv", 42444, "Os Cavaleiros do Zodíaco (Clássico 1986)"),
    ("tv", 67199, "Os Cavaleiros do Zodíaco: A Saga de Hades"),
    ("tv", 61389, "Os Cavaleiros do Zodíaco: The Lost Canvas"),
    ("tv", 62428, "Os Cavaleiros do Zodíaco: Alma de Ouro"),
    ("tv", 44317, "Os Cavaleiros do Zodíaco: Ômega"),
    ("tv", 90855, "Os Cavaleiros do Zodíaco: Saint Seiya"),
    # Dragon Ball (Todas as Sagas)
    ("tv", 12609, "Dragon Ball (1986)"),
    ("tv", 12971, "Dragon Ball Z"),
    ("tv", 12697, "Dragon Ball GT"),
    ("tv", 61709, "Dragon Ball Z Kai"),
    ("tv", 62715, "Dragon Ball Super"),
    ("tv", 236994, "Dragon Ball Daima"),
    # Naruto & Próxima Geração
    ("tv", 46260, "Naruto (Clássico)"),
    ("tv", 31910, "Naruto Shippuden"),
    ("tv", 70881, "Boruto: Naruto Next Generations"),
    # Clássicos Shonen Imortais
    ("tv", 30669, "Yu Yu Hakusho"),
    ("tv", 30984, "Bleach"),
    ("tv", 37854, "One Piece"),
    ("tv", 45952, "Hunter x Hunter (2011)"),
    ("tv", 13916, "Death Note"),
    ("tv", 31911, "Fullmetal Alchemist: Brotherhood"),
    ("tv", 30699, "InuYasha"),
]

ANIME_HITS_DEF = [
    ("tv", 85937, "Demon Slayer: Kimetsu no Yaiba"),
    ("tv", 114868, "Record of Ragnarok (Shuumatsu no Valkyrie)"),
    ("tv", 95479, "Jujutsu Kaisen"),
    ("tv", 1429, "Attack on Titan (Shingeki no Kyojin)"),
    ("tv", 127532, "Solo Leveling"),
    ("tv", 114410, "Chainsaw Man"),
    ("tv", 86369, "Vinland Saga"),
    ("tv", 120089, "Spy x Family"),
    ("tv", 61374, "Tokyo Ghoul"),
    ("tv", 73223, "Black Clover"),
    ("tv", 240411, "Dandadan"),
    ("tv", 207049, "Kaiju No. 8"),
    ("tv", 65930, "My Hero Academia"),
    ("tv", 112160, "Mashle: Magia e Músculos"),
    ("tv", 94605, "Dr. STONE"),
    ("tv", 83095, "The Promised Neverland"),
]

def _fetch_curated_collection(curated_list: List[tuple], page: int = 1, page_size: int = 24) -> List[Dict[str, Any]]:
    """Busca em lote títulos curados com cache em memória por item."""
    from concurrent.futures import ThreadPoolExecutor

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    sliced = curated_list[start_idx:end_idx]
    if not sliced and page > 1:
        # Se ultrapassou os itens fixos da curadoria, complementa com discover popular
        return get_animes(page)

    def _fetch_single(entry):
        mtype, m_id, *rest = entry
        cache_key = f"curated_item_{mtype}_{m_id}"
        cached = _get_cached(cache_key)
        if cached:
            return cached

        d = tmdb_request(f"{mtype}/{m_id}")
        if d and (d.get("poster_path") or d.get("backdrop_path")):
            d["media_type"] = mtype
            _set_cached(cache_key, d)
            return d
        return None

    results = []
    with ThreadPoolExecutor(max_workers=min(len(sliced), 10) or 1) as executor:
        for item in executor.map(_fetch_single, sliced):
            if item:
                results.append(item)

    # Se a página pediu mais ou para preencher até 24 itens, adiciona do discover
    if len(results) < page_size:
        discover = get_animes(page)
        seen_ids = {str(r.get("id")) for r in results}
        for d in discover:
            if str(d.get("id")) not in seen_ids:
                results.append(d)
                if len(results) >= page_size:
                    break

    return results

def get_anime_sagas(page: int = 1) -> List[Dict[str, Any]]:
    """Retorna a coleção das maiores sagas: Cavaleiros do Zodíaco, Dragon Ball e Naruto."""
    return _fetch_curated_collection(ANIME_SAGAS_DEF, page)

def get_anime_hits(page: int = 1) -> List[Dict[str, Any]]:
    """Retorna os animes mais aclamados e sucessos modernos: Kimetsu no Yaiba, Ragnarok, Jujutsu."""
    return _fetch_curated_collection(ANIME_HITS_DEF, page)

CATEGORY_CONFIG = {
    "anime_sagas": {
        "title": "Sagas Lendárias: Saint Seiya, DBZ & Naruto",
        "func": get_anime_sagas,
        "icon": "⚔️",
        "description": "Coleções completas de Cavaleiros do Zodíaco, Dragon Ball (todas as sagas), Naruto e clássicos shonen."
    },
    "anime_hits": {
        "title": "Fenômenos do Anime: Kimetsu no Yaiba & Ragnarok",
        "func": get_anime_hits,
        "icon": "⚡",
        "description": "Grandes sucessos da nova era: Demon Slayer, Record of Ragnarok, Jujutsu Kaisen e Attack on Titan."
    },
    "animes": {
        "title": "Animes & Animações Japonesas",
        "func": get_animes,
        "icon": "🍙",
        "description": "Catálogo completo de animes japoneses de todos os gêneros e épocas."
    },
    "action": {
        "title": "Ação & Aventura Explosiva",
        "func": get_action_movies,
        "icon": "💥",
        "description": "Perseguições eletrizantes, tiroteios e aventuras épicas."
    },
    "scifi": {
        "title": "Ficção Científica & Fantasia",
        "func": get_scifi_movies,
        "icon": "🚀",
        "description": "Viagens espaciais, futuros distópicos, mundos mágicos e tecnologia avançada."
    },
    "superheroes": {
        "title": "Universo de Heróis & Quadrinhos",
        "func": get_superheroes,
        "icon": "🦸",
        "description": "As maiores produções dos universos Marvel, DC e quadrinhos lendários."
    },
    "popular_movies": {
        "title": "Grandes Sucessos do Cinema",
        "func": get_popular_movies,
        "icon": "🎬",
        "description": "Os filmes mais assistidos e comentados do cinema mundial."
    },
    "popular_series": {
        "title": "Séries Mais Maratonadas",
        "func": get_popular_series,
        "icon": "📺",
        "description": "Séries aclamadas para maratonar do início ao fim."
    },
    "comedy": {
        "title": "Comédias para Rir Muito",
        "func": get_comedy_movies,
        "icon": "😂",
        "description": "Diversão garantida com as melhores comédias nacionais e internacionais."
    },
    "horror": {
        "title": "Terror & Arrepios",
        "func": get_horror_movies,
        "icon": "👻",
        "description": "Histórias sobrenaturais, sustos intensos e clima de tensão extrema."
    },
    "thriller": {
        "title": "Suspense, Crime & Mistério",
        "func": get_thriller_movies,
        "icon": "🕵️",
        "description": "Investigações policiais, reviravoltas chocantes e mistérios instigantes."
    },
    "top_rated": {
        "title": "Aclamados pela Crítica",
        "func": get_top_rated_movies,
        "icon": "🏆",
        "description": "Filmes com as maiores notas e premiações da história do cinema."
    },
    "family": {
        "title": "Sessão em Família & Kids",
        "func": get_family_movies,
        "icon": "👨‍👩‍👧‍👦",
        "description": "Animações e filmes leves para todas as idades curtirem juntos."
    },
    "documentary": {
        "title": "Documentários & Fatos Reais",
        "func": get_documentaries,
        "icon": "📜",
        "description": "Histórias reais fascinantes, biografias e registros da humanidade e natureza."
    },
}

def get_categories_list() -> List[Dict[str, Any]]:
    """Retorna os metadados de todas as categorias ativas para o frontend."""
    return [
        {
            "key": k,
            "title": v["title"],
            "icon": v.get("icon", "🎬"),
            "description": v.get("description", "")
        }
        for k, v in CATEGORY_CONFIG.items()
    ]

def _fetch_multi_page(fetch_func, max_pages: int = 2) -> List[Dict[str, Any]]:
    results = []
    for p in range(1, max_pages + 1):
        try:
            res = fetch_func(p)
            if res:
                results.extend(res)
        except Exception:
            pass
    return results

def get_home_catalog() -> Dict[str, Any]:
    """Retorna o catálogo completo da Home sem títulos repetidos entre categorias e com mais filmes."""
    cached = _get_cached("home_catalog_complete_v2")
    if cached:
        return cached

    # 1. Busca trending
    raw_trending = get_trending("all", "week")
    seen_ids = set()
    trending = []
    for item in raw_trending:
        item_id = str(item.get("id"))
        if item_id not in seen_ids and (item.get("poster_path") or item.get("backdrop_path")):
            seen_ids.add(item_id)
            trending.append(item)

    # Helper de desduplicação
    def filter_unique(items: List[Dict[str, Any]], target_count: int = 24) -> List[Dict[str, Any]]:
        filtered = []
        for it in items:
            it_id = str(it.get("id"))
            if not (it.get("poster_path") or it.get("backdrop_path")):
                continue
            if it_id not in seen_ids:
                seen_ids.add(it_id)
                filtered.append(it)
                if len(filtered) >= target_count:
                    break
        # Se filtrou demais, aceita itens extras
        if len(filtered) < 12:
            for it in items:
                if it not in filtered and (it.get("poster_path") or it.get("backdrop_path")):
                    filtered.append(it)
                    if len(filtered) >= target_count:
                        break
        return filtered

    from concurrent.futures import ThreadPoolExecutor

    fetch_tasks = [
        ("anime_sagas", lambda: get_anime_sagas(1)),
        ("anime_hits", lambda: get_anime_hits(1)),
        ("superheroes", lambda: _fetch_multi_page(get_superheroes, 2)),
        ("action", lambda: _fetch_multi_page(get_action_movies, 2)),
        ("popular_movies", lambda: _fetch_multi_page(get_popular_movies, 2)),
        ("popular_series", lambda: _fetch_multi_page(get_popular_series, 2)),
        ("scifi", lambda: _fetch_multi_page(get_scifi_movies, 2)),
        ("comedy", lambda: _fetch_multi_page(get_comedy_movies, 2)),
        ("horror", lambda: _fetch_multi_page(get_horror_movies, 2)),
        ("thriller", lambda: _fetch_multi_page(get_thriller_movies, 2)),
        ("top_rated", lambda: _fetch_multi_page(get_top_rated_movies, 2)),
        ("animes", lambda: _fetch_multi_page(get_animes, 2)),
        ("family", lambda: _fetch_multi_page(get_family_movies, 2)),
    ]

    raw_data = {}
    with ThreadPoolExecutor(max_workers=13) as executor:
        future_map = {executor.submit(fn): cat for cat, fn in fetch_tasks}
        for future in future_map:
            cat = future_map[future]
            try:
                raw_data[cat] = future.result() or []
            except Exception as exc:
                print(f"[TMDB Error] {cat}: {exc}")
                raw_data[cat] = []

    catalog = {
        "trending": trending,
        "anime_sagas": filter_unique(raw_data.get("anime_sagas", []), 24),
        "anime_hits": filter_unique(raw_data.get("anime_hits", []), 24),
        "superheroes": filter_unique(raw_data.get("superheroes", []), 24),
        "action": filter_unique(raw_data.get("action", []), 24),
        "popular_movies": filter_unique(raw_data.get("popular_movies", []), 24),
        "popular_series": filter_unique(raw_data.get("popular_series", []), 24),
        "scifi": filter_unique(raw_data.get("scifi", []), 24),
        "comedy": filter_unique(raw_data.get("comedy", []), 24),
        "horror": filter_unique(raw_data.get("horror", []), 24),
        "thriller": filter_unique(raw_data.get("thriller", []), 24),
        "top_rated": filter_unique(raw_data.get("top_rated", []), 24),
        "animes": filter_unique(raw_data.get("animes", []), 24),
        "family": filter_unique(raw_data.get("family", []), 24),
    }

    _set_cached("home_catalog_complete_v2", catalog)
    return catalog

def get_category_items(category_key: str, page: int = 1) -> Dict[str, Any]:
    """Retorna itens de uma categoria específica com suporte a paginação"""
    conf = CATEGORY_CONFIG.get(category_key)
    if not conf:
        return {"title": "Catálogo", "results": get_popular_movies(page), "page": page}

    results = conf["func"](page)
    return {
        "key": category_key,
        "title": conf["title"],
        "page": page,
        "results": results
    }

def get_personalized_recommendations(profile_id: int) -> List[Dict[str, Any]]:
    """Gera recomendações personalizadas com base nos itens assistidos e favoritados pelo perfil"""
    try:
        from app import database
        recent = database.get_profile_recent_media_ids(profile_id, limit=5)
    except Exception as exc:
        print(f"[Recs Error] {exc}")
        recent = []

    recs = []
    seen_ids = set()

    for item in recent:
        m_id = str(item.get("media_id"))
        m_type = item.get("media_type") or "movie"
        if m_id.startswith("live_"):
            continue

        seen_ids.add(m_id)
        # Busca recomendações daquele título no TMDB
        endpoint = f"{m_type}/{m_id}/recommendations"
        data = tmdb_request(endpoint)
        results = data.get("results", [])

        for r in results:
            r_id = str(r.get("id"))
            if r_id not in seen_ids and (r.get("poster_path") or r.get("backdrop_path")):
                seen_ids.add(r_id)
                if "media_type" not in r:
                    r["media_type"] = m_type
                recs.append(r)
                if len(recs) >= 20:
                    break
        if len(recs) >= 20:
            break

    # Fallback se perfil for novo: filmes em alta hoje
    if not recs:
        trending = get_trending("all", "day")
        recs = [t for t in trending if t.get("poster_path") or t.get("backdrop_path")]

    return recs[:20]

import re

SEARCH_ALIASES = {
    "cavalheiro": "cavaleiro",
    "cavalheiros": "cavaleiros",
    "zodiaco": "zodíaco",
    "kimtsu": "kimetsu",
    "iaba": "yaiba",
    "shingek": "shingeki",
    "ataque dos titas": "Attack on Titan",
    "ataque dos titãs": "Attack on Titan",
    "drago": "dragon",
    "dragom": "dragon",
    "naroto": "naruto",
    "ragnarok anime": "Record of Ragnarok",
    "ragnarok": "Record of Ragnarok",
    "jujutsu": "Jujutsu Kaisen",
    "sololeveling": "Solo Leveling",
}

STOP_WORDS = {"todas", "todos", "as", "os", "de", "do", "da", "e", "sagas", "saga", "temporadas", "anime", "filme", "serie", "completo", "completa"}

def search_multi(query: str, page: int = 1) -> List[Dict[str, Any]]:
    if not query:
        return []
    data = tmdb_request("search/multi", {"query": query, "page": page, "include_adult": "false"})
    results = [
        item for item in data.get("results", [])
        if item.get("media_type") in ("movie", "tv") and (item.get("poster_path") or item.get("backdrop_path"))
    ]
    return results

def smart_search(query: str, page: int = 1) -> Dict[str, Any]:
    """Busca inteligente com correção de typos, expansão de sinônimos e títulos semelhantes estilo Netflix."""
    if not query or not query.strip():
        return {"query": "", "results": [], "similar": [], "exact_match": True}

    q_clean = query.strip()
    results = search_multi(q_clean, page)
    matched_via = "direto"

    # 1. Se não encontrou, tenta corrigir aliases e erros fonéticos
    if not results:
        q_norm = q_clean.lower()
        for typo, fix in SEARCH_ALIASES.items():
            q_norm = re.sub(r"\b" + re.escape(typo) + r"\b", fix, q_norm)
        
        if q_norm != q_clean.lower():
            results = search_multi(q_norm, page)
            if results:
                matched_via = f"alias ({q_norm})"

    # 2. Se ainda não encontrou, remove stop words (ex: 'todas as sagas', 'filme', etc.)
    if not results:
        tokens = [w for w in re.findall(r"\w+", q_clean.lower()) if w not in STOP_WORDS]
        if tokens:
            token_q = " ".join(tokens)
            if token_q != q_clean.lower():
                results = search_multi(token_q, page)
                if results:
                    matched_via = f"palavras-chave ({token_q})"

    # 3. Títulos Semelhantes / Recomendações
    similar = []
    seen_ids = {str(r.get("id")) for r in results}

    if len(results) >= 1:
        # Se tem poucos resultados (1 a 3), busca semelhantes daquele primeiro título para enriquecer a tela
        if len(results) < 4:
            top = results[0]
            top_type = top.get("media_type") or "tv"
            top_id = top.get("id")
            rec_data = tmdb_request(f"{top_type}/{top_id}/recommendations")
            rec_results = rec_data.get("results", [])
            for rec in rec_results:
                r_id = str(rec.get("id"))
                if r_id not in seen_ids and (rec.get("poster_path") or rec.get("backdrop_path")):
                    seen_ids.add(r_id)
                    if "media_type" not in rec:
                        rec["media_type"] = top_type
                    similar.append(rec)
                    if len(similar) >= 12:
                        break
    else:
        # NENHUM resultado encontrado: busca títulos em alta na semana e animes populares para o usuário nunca ver tela vazia
        trending = get_trending("all", "week")
        for item in trending:
            item_id = str(item.get("id"))
            if item_id not in seen_ids and (item.get("poster_path") or item.get("backdrop_path")):
                seen_ids.add(item_id)
                similar.append(item)
                if len(similar) >= 18:
                    break

    return {
        "query": q_clean,
        "matched_via": matched_via,
        "exact_match": len(results) > 0,
        "results": results,
        "similar": similar,
        "count": len(results)
    }

def get_media_details(media_type: str, tmdb_id: str) -> Dict[str, Any]:
    endpoint = f"{media_type}/{tmdb_id}"
    data = tmdb_request(endpoint, {"append_to_response": "videos,credits,external_ids,recommendations,similar"})
    
    if not data:
        return {}

    # Extrai o trailer oficial do YouTube (pt-BR ou fallback en-US)
    trailer_key = None
    videos = data.get("videos", {}).get("results", [])
    for v in videos:
        if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
            trailer_key = v.get("key")
            break

    if not trailer_key and media_type in ("movie", "tv"):
        eng_videos = tmdb_request(f"{media_type}/{tmdb_id}/videos", {"language": "en-US"}).get("results", [])
        for v in eng_videos:
            if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
                trailer_key = v.get("key")
                break
        if not trailer_key and eng_videos:
            trailer_key = eng_videos[0].get("key")

    data["trailer_key"] = trailer_key

    # Extrai diretor(es) e elenco principal com fotos
    crew = data.get("credits", {}).get("crew", [])
    directors = [c.get("name") for c in crew if c.get("job") == "Director"]
    data["directors"] = directors

    cast = data.get("credits", {}).get("cast", [])
    formatted_cast = []
    for actor in cast[:12]:
        formatted_cast.append({
            "name": actor.get("name"),
            "character": actor.get("character"),
            "profile_path": actor.get("profile_path")
        })
    data["main_cast"] = formatted_cast

    return data

def get_season_details(tv_id: str, season_number: int) -> Dict[str, Any]:
    endpoint = f"tv/{tv_id}/season/{season_number}"
    data = tmdb_request(endpoint)
    return data

def clear_catalog_cache() -> None:
    """Limpa o cache em memória do catálogo para forçar recarga fresca da API TMDB."""
    global _CACHE
    _CACHE.clear()

