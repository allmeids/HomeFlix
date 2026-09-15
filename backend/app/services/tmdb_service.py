import requests
import time
from typing import Dict, Any, Optional, List

TMDB_API_KEY = "92c1507cc18d85290e7a0b96abb37316"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
LANGUAGE = "pt-BR"
REGION = "BR"

# Cache em memória simples com TTL
_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 1800  # 30 minutos

def _get_cached(key: str) -> Optional[Any]:
    record = _CACHE.get(key)
    if record and time.time() - record["time"] < CACHE_TTL:
        return record["data"]
    return None

def _set_cached(key: str, data: Any):
    _CACHE[key] = {"data": data, "time": time.time()}

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
        response = requests.get(url, params=query_params, timeout=8)
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

def get_animes(page: int = 1) -> List[Dict[str, Any]]:
    # Animação japonesa (Genre 16 = Animation, Original Language = ja)
    data = tmdb_request("discover/tv", {
        "with_genres": "16",
        "with_original_language": "ja",
        "sort_by": "popularity.desc",
        "page": page
    })
    return data.get("results", [])

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
    data = tmdb_request(endpoint, {"append_to_response": "videos,credits,external_ids,recommendations"})
    return data

def get_season_details(tv_id: str, season_number: int) -> Dict[str, Any]:
    endpoint = f"tv/{tv_id}/season/{season_number}"
    data = tmdb_request(endpoint)
    return data
