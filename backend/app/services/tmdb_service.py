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

CATEGORY_CONFIG = {
    "action": {"title": "Ação & Aventura Explosiva", "func": get_action_movies},
    "scifi": {"title": "Ficção Científica & Fantasia", "func": get_scifi_movies},
    "superheroes": {"title": "Universo de Heróis & Quadrinhos", "func": get_superheroes},
    "popular_movies": {"title": "Grandes Sucessos do Cinema", "func": get_popular_movies},
    "popular_series": {"title": "Séries Mais Maratonadas", "func": get_popular_series},
    "comedy": {"title": "Comédias para Rir Muito", "func": get_comedy_movies},
    "horror": {"title": "Terror & Arrepios", "func": get_horror_movies},
    "thriller": {"title": "Suspense, Crime & Mistério", "func": get_thriller_movies},
    "top_rated": {"title": "Aclamados pela Crítica", "func": get_top_rated_movies},
    "animes": {"title": "Animes & Animações Japonesas", "func": get_animes},
    "family": {"title": "Sessão em Família & Kids", "func": get_family_movies},
    "documentary": {"title": "Documentários & Fatos Reais", "func": get_documentaries},
}

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
    with ThreadPoolExecutor(max_workers=11) as executor:
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

def search_multi(query: str, page: int = 1) -> List[Dict[str, Any]]:
    if not query:
        return []
    data = tmdb_request("search/multi", {"query": query, "page": page, "include_adult": "false"})
    results = [
        item for item in data.get("results", [])
        if item.get("media_type") in ("movie", "tv") and (item.get("poster_path") or item.get("backdrop_path"))
    ]
    return results

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

