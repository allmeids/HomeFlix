from fastapi import APIRouter, Query
from app.services import tmdb_service

router = APIRouter(prefix="/api/media", tags=["Media"])

@router.get("/home")
def get_home_catalog():
    return tmdb_service.get_home_catalog()

@router.get("/trending")
def get_trending(type: str = Query("all", pattern="^(all|movie|tv)$"), window: str = Query("week", pattern="^(day|week)$")):
    return {"results": tmdb_service.get_trending(type, window)}

@router.get("/movies/popular")
def get_popular_movies(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_popular_movies(page)}

@router.get("/series/popular")
def get_popular_series(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_popular_series(page)}

@router.get("/movies/top")
def get_top_rated_movies(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_top_rated_movies(page)}

@router.get("/series/top")
def get_top_rated_series(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_top_rated_series(page)}

@router.get("/now-playing")
def get_now_playing(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_now_playing(page)}

@router.get("/animes")
def get_animes(page: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_animes(page)}

@router.get("/details/{media_type}/{tmdb_id}")
def get_details(media_type: str, tmdb_id: str):
    return tmdb_service.get_media_details(media_type, tmdb_id)

@router.get("/season/{tv_id}/{season_number}")
def get_season(tv_id: str, season_number: int):
    return tmdb_service.get_season_details(tv_id, season_number)

@router.get("/recommendations")
def get_recommendations(profile_id: int = Query(1, ge=1)):
    return {"results": tmdb_service.get_personalized_recommendations(profile_id)}

@router.get("/category/{category_key}")
def get_category(category_key: str, page: int = Query(1, ge=1)):
    return tmdb_service.get_category_items(category_key, page)

@router.get("/search")
def search(q: str = Query(..., min_length=1), page: int = Query(1, ge=1)):
    return {"results": tmdb_service.search_multi(q, page)}

