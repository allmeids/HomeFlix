import requests
import time
from typing import Dict, Any, Optional, List
from concurrent.futures import ThreadPoolExecutor

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
    "action": {
        "title": "Ação & Aventura",
        "func": get_action_movies,
        "icon": "",
        "description": "Perseguições eletrizantes, grandes confrontos e aventuras épicas no cinema."
    },
    "comedy": {
        "title": "Comédia",
        "func": get_comedy_movies,
        "icon": "",
        "description": "Diversão garantida com as melhores comédias nacionais e internacionais para rir do início ao fim."
    },
    "animes": {
        "title": "Animes & Animações Japonesas",
        "func": get_animes,
        "icon": "",
        "description": "Catálogo completo de animes japoneses de sucesso, clássicos e grandes lançamentos."
    },
    "scifi": {
        "title": "Ficção Científica & Fantasia",
        "func": get_scifi_movies,
        "icon": "",
        "description": "Viagens espaciais, futuros distópicos, mundos fantásticos e tecnologia avançada."
    },
    "horror": {
        "title": "Terror & Suspense",
        "func": get_horror_movies,
        "icon": "",
        "description": "Histórias sobrenaturais, sustos intensos e clima de tensão e mistério extremo."
    },
    "family": {
        "title": "Família & Animação",
        "func": get_family_movies,
        "icon": "",
        "description": "Animações aclamadas e filmes leves para todas as idades curtirem juntos em casa."
    },
    "superheroes": {
        "title": "Super-Heróis",
        "func": get_superheroes,
        "icon": "",
        "description": "As maiores produções dos universos Marvel, DC e lendas dos quadrinhos."
    },
    "thriller": {
        "title": "Crime & Mistério",
        "func": get_thriller_movies,
        "icon": "",
        "description": "Investigações policiais, reviravoltas chocantes e mistérios instigantes."
    },
    "popular_movies": {
        "title": "Grandes Sucessos",
        "func": get_popular_movies,
        "icon": "",
        "description": "Os filmes mais assistidos e aclamados do cinema mundial."
    },
    "popular_series": {
        "title": "Séries Populares",
        "func": get_popular_series,
        "icon": "",
        "description": "Séries consagradas e mais assistidas para maratonar do início ao fim."
    },
    "top_rated": {
        "title": "Aclamados pela Crítica",
        "func": get_top_rated_movies,
        "icon": "",
        "description": "Obras-primas cinematográficas com as maiores notas e premiações da história."
    },
    "documentary": {
        "title": "Documentários",
        "func": get_documentaries,
        "icon": "",
        "description": "Histórias reais fascinantes, biografias e grandes registros da humanidade e natureza."
    },
}

def get_categories_list() -> List[Dict[str, Any]]:
    """Retorna os metadados de todas as categorias ativas para o frontend."""
    return [
        {
            "key": k,
            "title": v["title"],
            "icon": v.get("icon", ""),
            "description": v.get("description", "")
        }
        for k, v in CATEGORY_CONFIG.items()
    ]

# ================================================================
# COLEÇÕES E FRANQUIAS EM ORDEM CRONOLÓGICA DE ASSISTIR
# ================================================================
COLLECTIONS_CONFIG: Dict[str, Dict[str, Any]] = {
    "mcu": {
        "title": "Universo Marvel (MCU)",
        "subtitle": "Ordem Cronológica Oficial dos Acontecimentos",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg",
        "description": "A jornada completa dos Vingadores e do multiverso organizada rigorosamente na linha do tempo histórica do MCU com filmes e séries oficiais.",
        "items": [
            {"tmdb_id": 1771, "media_type": "movie", "order": 1, "order_title": "1. Capitão América: O Primeiro Vingador (1942-1945)", "chronological_note": "A origem do primeiro super-soldado durante a 2ª Guerra Mundial."},
            {"tmdb_id": 299537, "media_type": "movie", "order": 2, "order_title": "2. Capitã Marvel (1995)", "chronological_note": "Carol Danvers e Nick Fury nos anos 90, iniciando a iniciativa Vingadores."},
            {"tmdb_id": 1726, "media_type": "movie", "order": 3, "order_title": "3. Homem de Ferro (2010)", "chronological_note": "Tony Stark constrói a armadura Mark I e revela sua identidade."},
            {"tmdb_id": 10138, "media_type": "movie", "order": 4, "order_title": "4. Homem de Ferro 2 (2011)", "chronological_note": "Surgimento da Viúva Negra e Máquina de Combate."},
            {"tmdb_id": 1724, "media_type": "movie", "order": 5, "order_title": "5. O Incrível Hulk (2011)", "chronological_note": "Bruce Banner em fuga do General Ross pelo Brasil e EUA."},
            {"tmdb_id": 10195, "media_type": "movie", "order": 6, "order_title": "6. Thor (2011)", "chronological_note": "Thor é banido para a Terra e prova seu valor para empunhar o Mjolnir."},
            {"tmdb_id": 24428, "media_type": "movie", "order": 7, "order_title": "7. Os Vingadores (2012)", "chronological_note": "A Batalha de Nova York: a primeira reunião oficial dos heróis mais poderosos da Terra."},
            {"tmdb_id": 68721, "media_type": "movie", "order": 8, "order_title": "8. Homem de Ferro 3 (2012)", "chronological_note": "Tony Stark lida com o trauma pós-Nova York e o falso Mandarim."},
            {"tmdb_id": 76338, "media_type": "movie", "order": 9, "order_title": "9. Thor: O Mundo Sombrio (2013)", "chronological_note": "A ameaça dos Elfos Negros e a Joia da Realidade (Éter)."},
            {"tmdb_id": 100402, "media_type": "movie", "order": 10, "order_title": "10. Capitão América 2: O Soldado Invernal (2014)", "chronological_note": "A queda da S.H.I.E.L.D., infiltração da Hydra e o retorno de Bucky Barnes."},
            {"tmdb_id": 118340, "media_type": "movie", "order": 11, "order_title": "11. Guardiões da Galáxia (2014)", "chronological_note": "Peter Quill e os desajustados cósmicos protegem a Joia do Poder."},
            {"tmdb_id": 283995, "media_type": "movie", "order": 12, "order_title": "12. Guardiões da Galáxia Vol. 2 (2014)", "chronological_note": "Meses após o primeiro filme, Peter descobre a verdade sobre seu pai Ego."},
            {"tmdb_id": 61889, "media_type": "tv", "order": 13, "order_title": "13. Demolidor (Série Marvel)", "chronological_note": "Matt Murdock defende Hell's Kitchen e enfrenta o Rei do Crime."},
            {"tmdb_id": 99861, "media_type": "movie", "order": 14, "order_title": "14. Vingadores: Era de Ultron (2015)", "chronological_note": "O surgimento de Ultron, Visão, Wanda e a destruição de Sokovia."},
            {"tmdb_id": 102899, "media_type": "movie", "order": 15, "order_title": "15. Homem-Formiga (2015)", "chronological_note": "Scott Lang aprende a usar o traje encolhedor com Hank Pym."},
            {"tmdb_id": 271110, "media_type": "movie", "order": 16, "order_title": "16. Capitão América: Guerra Civil (2016)", "chronological_note": "Tratado de Sokovia divide os Vingadores; estreia do Homem-Aranha e Pantera Negra."},
            {"tmdb_id": 497698, "media_type": "movie", "order": 17, "order_title": "17. Viúva Negra (2016)", "chronological_note": "Imediatamente após Guerra Civil, Natasha enfrenta seu passado e a Sala Vermelha."},
            {"tmdb_id": 284054, "media_type": "movie", "order": 18, "order_title": "18. Pantera Negra (2016)", "chronological_note": "T'Challa assume o trono de Wakanda e confronta Killmonger."},
            {"tmdb_id": 315635, "media_type": "movie", "order": 19, "order_title": "19. Homem-Aranha: De Volta ao Lar (2016)", "chronological_note": "Peter Parker tenta conciliar a escola com o heroísmo no Queens."},
            {"tmdb_id": 284052, "media_type": "movie", "order": 20, "order_title": "20. Doutor Estranho (2016-2017)", "chronological_note": "Stephen Strange treina as artes místicas em Kamar-Taj e guarda a Joia do Tempo."},
            {"tmdb_id": 284053, "media_type": "movie", "order": 21, "order_title": "21. Thor: Ragnarok (2017)", "chronological_note": "Destruição de Asgard, encontro com Hulk em Sakaar e a vinda da nave de Thanos."},
            {"tmdb_id": 363088, "media_type": "movie", "order": 22, "order_title": "22. Homem-Formiga e a Vespa (2018)", "chronological_note": "Resgate no Reino Quântico momentos antes do estalo de Thanos."},
            {"tmdb_id": 299536, "media_type": "movie", "order": 23, "order_title": "23. Vingadores: Guerra Infinita (2018)", "chronological_note": "Thanos reúne as seis Joias do Infinito e executa o estalo universal."},
            {"tmdb_id": 299534, "media_type": "movie", "order": 24, "order_title": "24. Vingadores: Ultimato (2018-2023)", "chronological_note": "O assalto temporal e a batalha culminante pela restauração do universo."},
            {"tmdb_id": 84958, "media_type": "tv", "order": 25, "order_title": "25. Loki (Série Marvel)", "chronological_note": "O Deus da Trapaça quebra a Linha do Tempo Sagrada e confronta a AVT e Aquele Que Permanece."},
            {"tmdb_id": 85271, "media_type": "tv", "order": 26, "order_title": "26. WandaVision (Série Marvel)", "chronological_note": "Três semanas pós-Ultimato: Wanda cria a anomalia de Westview e desperta como Feiticeira Escarlate."},
            {"tmdb_id": 88396, "media_type": "tv", "order": 27, "order_title": "27. Falcão e o Soldado Invernal (Série Marvel)", "chronological_note": "Sam Wilson e Bucky Barnes enfrentam os Apátridas e Sam assume o escudo de Capitão América."},
            {"tmdb_id": 566525, "media_type": "movie", "order": 28, "order_title": "28. Shang-Chi e a Lenda dos Dez Anéis (2021)", "chronological_note": "Shang-Chi confronta seu pai Wenwu e o poder milenar dos Dez Anéis místicas."},
            {"tmdb_id": 524434, "media_type": "movie", "order": 29, "order_title": "29. Eternos (2021)", "chronological_note": "Os seres cósmicos imortais emergem das sombras para impedir o Despertar do Celestial Tiamut."},
            {"tmdb_id": 429617, "media_type": "movie", "order": 30, "order_title": "30. Homem-Aranha: Longe de Casa (2024)", "chronological_note": "Viagem escolar pela Europa e confronto com Mistério pós-Ultimato."},
            {"tmdb_id": 634649, "media_type": "movie", "order": 31, "order_title": "31. Homem-Aranha: Sem Volta Para Casa (2024)", "chronological_note": "Abertura do Multiverso e encontro lendário dos três Homens-Aranha de diferentes realidades."},
            {"tmdb_id": 88329, "media_type": "tv", "order": 32, "order_title": "32. Gavião Arqueiro (Hawkeye - Série)", "chronological_note": "Clint Barton e Kate Bishop enfrentam a gangue do agasalho e o Rei do Crime no Natal de Nova York."},
            {"tmdb_id": 92749, "media_type": "tv", "order": 33, "order_title": "33. Cavaleiro da Lua (Moon Knight - Série)", "chronological_note": "Marc Spector e Steven Grant descobrem suas múltiplas personalidades como avatar do deus Khonshu."},
            {"tmdb_id": 453395, "media_type": "movie", "order": 34, "order_title": "34. Doutor Estranho no Multiverso da Loucura (2024)", "chronological_note": "Stephen Strange e América Chavez viajam pelas realidades contra a corrompida Feiticeira Escarlate."},
            {"tmdb_id": 92783, "media_type": "tv", "order": 35, "order_title": "35. Mulher-Hulk: Defensora de Heróis (Série)", "chronological_note": "Jennifer Walters ganha os poderes de Hulk e defende casos judiciais de super-heróis."},
            {"tmdb_id": 616037, "media_type": "movie", "order": 36, "order_title": "36. Thor: Amor e Trovão (2022)", "chronological_note": "Thor e Jane Foster (Poderosa Thor) enfrentam Gorr, o Carniceiro dos Deuses."},
            {"tmdb_id": 505642, "media_type": "movie", "order": 37, "order_title": "37. Pantera Negra: Wakanda Para Sempre (2022)", "chronological_note": "A rainha Ramonda e Shuri defendem Wakanda contra Namor e o reino subaquático de Talokan."},
            {"tmdb_id": 640146, "media_type": "movie", "order": 38, "order_title": "38. Homem-Formiga e a Vespa: Quantumania (2023)", "chronological_note": "A família Pym-Lang é sugada para o Reino Quântico e trava confronto com Kang, o Conquistador."},
            {"tmdb_id": 447365, "media_type": "movie", "order": 39, "order_title": "39. Guardiões da Galáxia Vol. 3 (2023)", "chronological_note": "A missão final dos Guardiões para salvar Rocket Raccoon das garras do Alto Evolucionário."},
            {"tmdb_id": 114472, "media_type": "tv", "order": 40, "order_title": "40. Invasão Secreta (Série Marvel)", "chronological_note": "Nick Fury descobre uma infiltração clandestina de Skrulls metamorfos nos altos escalões globais."},
            {"tmdb_id": 609681, "media_type": "movie", "order": 41, "order_title": "41. As Marvels (The Marvels - 2023)", "chronological_note": "Carol Danvers, Kamala Khan e Monica Rambeau têm seus poderes entrelaçados contra Dar-Benn."},
            {"tmdb_id": 533535, "media_type": "movie", "order": 42, "order_title": "42. Deadpool & Wolverine (2024)", "chronological_note": "Wade Wilson é recrutado pela AVT para salvar sua linha do tempo ao lado de Logan."}
        ]
    },
    "harry_potter": {
        "title": "Coleção Harry Potter & Mundo Bruxo",
        "subtitle": "Saga Completa em Ordem Cronológica",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/eKUk4oN4ucwnLJml7wRnjuB9AQH.jpg",
        "description": "Desde os eventos de Animais Fantásticos até a batalha final de Hogwarts contra Lord Voldemort.",
        "items": [
            {"tmdb_id": 259316, "media_type": "movie", "order": 1, "order_title": "1. Animais Fantásticos e Onde Habitam (1926)", "chronological_note": "Newt Scamander chega a Nova York com sua maleta repleta de criaturas mágicas."},
            {"tmdb_id": 338952, "media_type": "movie", "order": 2, "order_title": "2. Animais Fantásticos: Os Crimes de Grindelwald (1927)", "chronological_note": "A ascensão do bruxo das trevas Gellert Grindelwald em Paris."},
            {"tmdb_id": 338953, "media_type": "movie", "order": 3, "order_title": "3. Animais Fantásticos: Os Segredos de Dumbledore (1932)", "chronological_note": "Alvo Dumbledore reúne uma equipe para impedir o domínio de Grindelwald no mundo bruxo."},
            {"tmdb_id": 671, "media_type": "movie", "order": 4, "order_title": "4. Harry Potter e a Pedra Filosofal (2001)", "chronological_note": "Harry descobre aos 11 anos que é um bruxo e ingressa na Escola de Magia de Hogwarts."},
            {"tmdb_id": 672, "media_type": "movie", "order": 5, "order_title": "5. Harry Potter e a Câmara Secreta (2002)", "chronological_note": "O herdeiro de Salazar Sonserina reabre a temida Câmara Secreta e liberta o Basilisco."},
            {"tmdb_id": 673, "media_type": "movie", "order": 6, "order_title": "6. Harry Potter e o Prisioneiro de Azkaban (2004)", "chronological_note": "Sirius Black foge da prisão de Azkaban e os Dementadores cercam Hogwarts."},
            {"tmdb_id": 674, "media_type": "movie", "order": 7, "order_title": "7. Harry Potter e o Cálice de Fogo (2005)", "chronological_note": "O Torneio Tribruxo internacional e o temido renascimento de Lord Voldemort."},
            {"tmdb_id": 675, "media_type": "movie", "order": 8, "order_title": "8. Harry Potter e a Ordem da Fênix (2007)", "chronological_note": "A Armada de Dumbledore treina em segredo enquanto o Ministério nega o retorno das trevas."},
            {"tmdb_id": 767, "media_type": "movie", "order": 9, "order_title": "9. Harry Potter e o Enigma do Príncipe (2009)", "chronological_note": "O mistério das Horcruxes de Voldemort e as memórias do jovem Tom Riddle."},
            {"tmdb_id": 12444, "media_type": "movie", "order": 10, "order_title": "10. Harry Potter e as Relíquias da Morte: Parte 1 (2010)", "chronological_note": "A caçada desesperada às Horcruxes fora dos muros seguros de Hogwarts."},
            {"tmdb_id": 12445, "media_type": "movie", "order": 11, "order_title": "11. Harry Potter e as Relíquias da Morte: Parte 2 (2011)", "chronological_note": "A épica Batalha Final de Hogwarts entre a Ordem da Fênix e o exército de Voldemort."}
        ]
    },
    "transformers": {
        "title": "Coleção Transformers",
        "subtitle": "Ordem Cronológica dos Acontecimentos",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/cMfokHWle5lfCreoV08cbmkKv6G.jpg",
        "description": "Desde a queda e origem de Cybertron até as batalhas titânicas entre Autobots e Decepticons na Terra.",
        "items": [
            {"tmdb_id": 698687, "media_type": "movie", "order": 1, "order_title": "1. Transformers: O Início (Transformers One - 2024)", "chronological_note": "A história de origem no planeta Cybertron quando Optimus Prime e Megatron eram irmãos de armas."},
            {"tmdb_id": 424783, "media_type": "movie", "order": 2, "order_title": "2. Bumblebee (1987)", "chronological_note": "B-127 chega à Terra nos anos 80 e cria um laço de amizade com a jovem Charlie."},
            {"tmdb_id": 667538, "media_type": "movie", "order": 3, "order_title": "3. Transformers: O Despertar das Feras (1994)", "chronological_note": "Maximals, Predacons e Terrorcons se unem à batalha pelo destino da Terra no Brooklyn e Peru."},
            {"tmdb_id": 1858, "media_type": "movie", "order": 4, "order_title": "4. Transformers (2007)", "chronological_note": "A chegada oficial dos Autobots à Terra e a busca pelo lendário Allspark com Sam Witwicky."},
            {"tmdb_id": 8373, "media_type": "movie", "order": 5, "order_title": "5. Transformers: A Vingança dos Derrotados (2009)", "chronological_note": "O retorno do antigo Decepticon O Fallen e a batalha decisiva nas Pirâmides do Egito."},
            {"tmdb_id": 38356, "media_type": "movie", "order": 6, "order_title": "6. Transformers: O Lado Oculto da Lua (2011)", "chronological_note": "O segredo da corrida espacial dos anos 60 e a conspiração da Arca lunar em Chicago."},
            {"tmdb_id": 91314, "media_type": "movie", "order": 7, "order_title": "7. Transformers: A Era da Extinção (2014)", "chronological_note": "Cade Yeager descobre Optimus desativado; surgimento dos Dinobots e dos Criadores."},
            {"tmdb_id": 335988, "media_type": "movie", "order": 8, "order_title": "8. Transformers: O Último Cavaleiro (2017)", "chronological_note": "Quintessa corrompe Optimus Prime e a história secreta dos Transformers com o Rei Arthur."}
        ]
    },
    "dragon_ball": {
        "title": "Coleção Dragon Ball",
        "subtitle": "Sagas e Filmes na Ordem Canônica de Assistir",
        "icon": "",
        "badge": "Ordem Canônica",
        "backdrop": "/6OTRuxpwUUGbmCX3MKP25dOmo59.jpg",
        "description": "A trajetória completa de Goku e os Guerreiros Z: desde a infância no Monte Paozu até as batalhas multiversais de deuses.",
        "items": [
            {"tmdb_id": 12609, "media_type": "tv", "order": 1, "order_title": "1. Dragon Ball (Série Clássica)", "chronological_note": "A infância de Goku, o treinamento com Mestre Kame e os Torneios de Artes Marciais."},
            {"tmdb_id": 12971, "media_type": "tv", "order": 2, "order_title": "2. Dragon Ball Z (Sagas Saiyajins, Freeza, Cell & Boo)", "chronological_note": "Goku descobre sua origem Saiyajin, alcança o lendário Super Saiyajin e defende o universo."},
            {"tmdb_id": 126963, "media_type": "movie", "order": 3, "order_title": "3. Dragon Ball Z: A Batalha dos Deuses (2013)", "chronological_note": "O despertar de Bills, o Deus da Destruição, e a transformação no Deus Super Saiyajin."},
            {"tmdb_id": 303857, "media_type": "movie", "order": 4, "order_title": "4. Dragon Ball Z: O Renascimento de 'F' (2015)", "chronological_note": "O retorno de Freeza em sua forma dourada e a revelação do Super Saiyajin Blue."},
            {"tmdb_id": 62715, "media_type": "tv", "order": 5, "order_title": "5. Dragon Ball Super (Série Completa)", "chronological_note": "O Torneio dos Universos, a ameaça de Goku Black e o Instinto Superior no Torneio do Poder."},
            {"tmdb_id": 503314, "media_type": "movie", "order": 6, "order_title": "6. Dragon Ball Super: Broly (2018)", "chronological_note": "A canonização definitiva do lendário Saiyajin Broly em uma batalha insana no Ártico."},
            {"tmdb_id": 610150, "media_type": "movie", "order": 7, "order_title": "7. Dragon Ball Super: Super Hero (2022)", "chronological_note": "Gohan e Piccolo despertam novos poderes supremos contra os Androides Gamma e Cell Max."},
            {"tmdb_id": 236994, "media_type": "tv", "order": 8, "order_title": "8. Dragon Ball Daima (2024)", "chronological_note": "Nova aventura épica canônica escrita por Akira Toriyama no Reino Demoníaco."},
            {"tmdb_id": 12697, "media_type": "tv", "order": 9, "order_title": "9. Dragon Ball GT (História Alternativa Especial)", "chronological_note": "A jornada clássica pelas Esferas Negras e o icônico Super Saiyajin 4."}
        ]
    },
    "dc_comics": {
        "title": "Universo DC Comics",
        "subtitle": "Ordem Cronológica dos Maiores Heróis",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
        "description": "A saga dos ícones da DC Comics: Superman, Batman, Mulher-Maravilha e a Liga da Justiça na linha do tempo.",
        "items": [
            {"tmdb_id": 297762, "media_type": "movie", "order": 1, "order_title": "1. Mulher-Maravilha (1918)", "chronological_note": "Diana Prince deixa Themyscira durante a 1ª Guerra Mundial."},
            {"tmdb_id": 464052, "media_type": "movie", "order": 2, "order_title": "2. Mulher-Maravilha 1984 (1984)", "chronological_note": "Diana enfrenta Maxwell Lord e a Mulher-Leopardo no auge da Guerra Fria."},
            {"tmdb_id": 49521, "media_type": "movie", "order": 3, "order_title": "3. O Homem de Aço (2013)", "chronological_note": "A destruição de Krypton e a chegada de Kal-El à Terra contra o General Zod."},
            {"tmdb_id": 209112, "media_type": "movie", "order": 4, "order_title": "4. Batman vs Superman: A Origem da Justiça (2016)", "chronological_note": "O embate de ideais em Gotham e Metrópolis e a primeira aparição da Trindade."},
            {"tmdb_id": 297761, "media_type": "movie", "order": 5, "order_title": "5. Esquadrão Suicida (2016)", "chronological_note": "Amanda Waller reúne os piores vilões encarcerados para missões suicidas."},
            {"tmdb_id": 791373, "media_type": "movie", "order": 6, "order_title": "6. Liga da Justiça de Zack Snyder (2021)", "chronological_note": "A versão definitiva de 4 horas: a ressurreição do Superman e a invasão de Steppenwolf e Darkseid."},
            {"tmdb_id": 297802, "media_type": "movie", "order": 7, "order_title": "7. Aquaman (2018)", "chronological_note": "Arthur Curry descobre seu destino como verdadeiro Rei de Atlântida."},
            {"tmdb_id": 287947, "media_type": "movie", "order": 8, "order_title": "8. Shazam! (2019)", "chronological_note": "O jovem Billy Batson ganha os poderes de seis deuses mitológicos."},
            {"tmdb_id": 436969, "media_type": "movie", "order": 9, "order_title": "9. O Esquadrão Suicida (2021)", "chronological_note": "A missão explosiva de James Gunn na ilha de Corto Maltese contra Starro."},
            {"tmdb_id": 436270, "media_type": "movie", "order": 10, "order_title": "10. Adão Negro (2022)", "chronological_note": "O antigo campeão de Kahndaq é libertado após 5.000 anos com poder implacável."},
            {"tmdb_id": 298618, "media_type": "movie", "order": 11, "order_title": "11. The Flash (2023)", "chronological_note": "Barry Allen viaja no tempo para salvar sua mãe e colide com o Batman de Michael Keaton."},
            {"tmdb_id": 572802, "media_type": "movie", "order": 12, "order_title": "12. Aquaman 2: O Reino Perdido (2023)", "chronological_note": "Arthur Curry forja uma aliança relutante para salvar Atlântida da vingança do Arraia Negra."},
            {"tmdb_id": 414906, "media_type": "movie", "order": 13, "order_title": "13. The Batman (2022)", "chronological_note": "Robert Pattinson como o Cavaleiro das Trevas em seu segundo ano contra o Charada."},
            {"tmdb_id": 475557, "media_type": "movie", "order": 14, "order_title": "14. Coringa (Joker - 2019)", "chronological_note": "A obra-prima aclamada sobre a descida psicológica de Arthur Fleck em Gotham City."}
        ]
    },
    "star_wars": {
        "title": "Coleção Star Wars",
        "subtitle": "A Saga Skywalker Completa na Linha do Tempo",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/8BTsTfln4jlQrLXUBquXJ0ASQy9.jpg",
        "description": "A lendária saga galáctica em perfeita ordem cronológica: da ascensão de Anakin Skywalker à vitória final da Resistência.",
        "items": [
            {"tmdb_id": 1893, "media_type": "movie", "order": 1, "order_title": "1. Star Wars: Episódio I - A Ameaça Fantasma", "chronological_note": "Descoberta de Anakin Skywalker em Tatooine e o retorno dos Sith com Darth Maul."},
            {"tmdb_id": 1894, "media_type": "movie", "order": 2, "order_title": "2. Star Wars: Episódio II - O Ataque dos Clones", "chronological_note": "O início das Guerras Clônicas e o romance proibido entre Anakin e Padmé."},
            {"tmdb_id": 1895, "media_type": "movie", "order": 3, "order_title": "3. Star Wars: Episódio III - A Vingança dos Sith", "chronological_note": "A queda de Anakin para o Lado Sombrio e o nascimento de Darth Vader com a Ordem 66."},
            {"tmdb_id": 348350, "media_type": "movie", "order": 4, "order_title": "4. Han Solo: Uma História Star Wars", "chronological_note": "A juventude de Han Solo, o encontro com Chewbacca e a conquista da Millennium Falcon."},
            {"tmdb_id": 330459, "media_type": "movie", "order": 5, "order_title": "5. Rogue One: Uma História Star Wars", "chronological_note": "A perigosa missão dos Rebeldes para roubar os planos da temida Estrela da Morte."},
            {"tmdb_id": 11, "media_type": "movie", "order": 6, "order_title": "6. Star Wars: Episódio IV - Uma Nova Esperança", "chronological_note": "Luke Skywalker inicia seu treinamento Jedi e lidera o ataque contra a Estrela da Morte."},
            {"tmdb_id": 1891, "media_type": "movie", "order": 7, "order_title": "7. Star Wars: Episódio V - O Império Contra-Ataca", "chronological_note": "Treinamento com Mestre Yoda em Dagobah e a revelação histórica: 'Eu sou seu pai'."},{"tmdb_id": 1892, "media_type": "movie", "order": 8, "order_title": "8. Star Wars: Episódio VI - O Retorno de Jedi", "chronological_note": "A redenção de Anakin Skywalker e a queda do Imperador Palpatine na 2ª Estrela da Morte."},
            {"tmdb_id": 140607, "media_type": "movie", "order": 9, "order_title": "9. Star Wars: Episódio VII - O Despertar da Força", "chronological_note": "Trinta anos depois, Rey descobre sua afinidade com a Força contra Kylo Ren."},
            {"tmdb_id": 181808, "media_type": "movie", "order": 10, "order_title": "10. Star Wars: Episódio VIII - Os Últimos Jedi", "chronological_note": "Rey encontra Luke Skywalker exilado na ilha sagrada de Ahch-To."},
            {"tmdb_id": 181812, "media_type": "movie", "order": 11, "order_title": "11. Star Wars: Episódio IX - A Ascensão Skywalker", "chronological_note": "A batalha definitiva entre a Luz e as Trevas pelo destino final da Galáxia."}
        ]
    },
    "fast_furious": {
        "title": "Coleção Velozes & Furiosos",
        "subtitle": "Ordem Cronológica das Corridas e Família",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg",
        "description": "Das corridas clandestinas de rua em Los Angeles até missões de espionagem globais em alta velocidade.",
        "items": [
            {"tmdb_id": 9799, "media_type": "movie", "order": 1, "order_title": "1. Velozes e Furiosos (2001)", "chronological_note": "Brian O'Conner se infiltra no submundo dos rachas liderados por Dominic Toretto."},
            {"tmdb_id": 584, "media_type": "movie", "order": 2, "order_title": "2. + Velozes + Furiosos (2003)", "chronological_note": "Brian e Roman Pearce em corridas em Miami contra o cartel de Carter Verone."},
            {"tmdb_id": 13804, "media_type": "movie", "order": 3, "order_title": "3. Velozes e Furiosos 4 (2009)", "chronological_note": "Dom e Brian se reencontram para vingar a morte de Letty contra o cartel de Braga."},
            {"tmdb_id": 51497, "media_type": "movie", "order": 4, "order_title": "4. Velozes e Furiosos 5: Operação Rio (2011)", "chronological_note": "O icônico assalto do cofre pelas ruas do Rio de Janeiro e a introdução de Luke Hobbs."},
            {"tmdb_id": 82992, "media_type": "movie", "order": 5, "order_title": "5. Velozes e Furiosos 6 (2013)", "chronological_note": "A equipe viaja a Londres para capturar Owen Shaw e recuperar Letty sem memória."},
            {"tmdb_id": 9615, "media_type": "movie", "order": 6, "order_title": "6. Velozes e Furiosos: Desafio em Tóquio (2006)", "chronological_note": "A cronologia correta: os acontecimentos em Tóquio com Sean Boswell e Han ocorrem aqui."},
            {"tmdb_id": 168259, "media_type": "movie", "order": 7, "order_title": "7. Velozes e Furiosos 7 (2015)", "chronological_note": "Deckard Shaw busca vingança; a comovente despedida de Brian O'Conner (Paul Walker)."},
            {"tmdb_id": 337339, "media_type": "movie", "order": 8, "order_title": "8. Velozes e Furiosos 8 (2017)", "chronological_note": "A misteriosa hacker Cipher chantageia Toretto para trair sua própria família."},
            {"tmdb_id": 384018, "media_type": "movie", "order": 9, "order_title": "9. Velozes & Furiosos: Hobbs & Shaw (2019)", "chronological_note": "A dupla improvável se une para deter o supersoldado cibernético Brixton Lore."},
            {"tmdb_id": 385128, "media_type": "movie", "order": 10, "order_title": "10. Velozes e Furiosos 9 (2021)", "chronological_note": "O irmão renegado de Dom, Jakob Toretto, ressurge com um projeto letal de armas espaciais."},
            {"tmdb_id": 385687, "media_type": "movie", "order": 11, "order_title": "11. Velozes e Furiosos 10 (Fast X - 2023)", "chronological_note": "Dante Reyes (Jason Momoa) lança uma vingança impiedosa para destruir a família Toretto."}
        ]
    },
    "lord_of_the_rings": {
        "title": "O Senhor dos Anéis & O Hobbit",
        "subtitle": "Saga Completa da Terra Média",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg",
        "description": "A jornada mitológica de J.R.R. Tolkien na ordem cronológica: da jornada de Bilbo com os anões à destruição do Um Anel.",
        "items": [
            {"tmdb_id": 49051, "media_type": "movie", "order": 1, "order_title": "1. O Hobbit: Uma Jornada Inesperada (2012)", "chronological_note": "Bilbo Bolseiro deixa o Condado com Gandalf e treze anões em direção à Montanha Solitária."},
            {"tmdb_id": 57158, "media_type": "movie", "order": 2, "order_title": "2. O Hobbit: A Desolação de Smaug (2013)", "chronological_note": "O confronto épico com o terrível dragão Smaug nas entranhas de Erebor."},
            {"tmdb_id": 122917, "media_type": "movie", "order": 3, "order_title": "3. O Hobbit: A Batalha dos Cinco Exércitos (2014)", "chronological_note": "A gigantesca guerra entre anões, elfos, homens e orcs pelo tesouro de Erebor."},
            {"tmdb_id": 120, "media_type": "movie", "order": 4, "order_title": "4. O Senhor dos Anéis: A Sociedade do Anel (2001)", "chronological_note": "Frodo herda o Um Anel e parte de Valfenda com a Sociedade rumo a Mordor."},
            {"tmdb_id": 121, "media_type": "movie", "order": 5, "order_title": "5. O Senhor dos Anéis: As Duas Torres (2002)", "chronological_note": "A icônica Batalha do Abismo de Helm e a marcha dos Ents contra Isengard."},
            {"tmdb_id": 122, "media_type": "movie", "order": 6, "order_title": "6. O Senhor dos Anéis: O Retorno do Rei (2003)", "chronological_note": "A Batalha dos Campos de Pelennor, Aragorn coroado rei e a destruição do Um Anel na Montanha da Perdição."}
        ]
    },
    "saint_seiya": {
        "title": "Coleção Cavaleiros do Zodíaco",
        "subtitle": "Sagas Canônicas & Spin-offs de Saint Seiya",
        "icon": "",
        "badge": "Saga Completa",
        "backdrop": "/xqi7xzgzed2TyVuoXBmm6neYGee.jpg",
        "description": "Os defensores da deusa Atena na luta com suas armaduras de bronze e ouro pelas 12 Casas e Submundo.",
        "items": [
            {"tmdb_id": 42444, "media_type": "tv", "order": 1, "order_title": "1. Cavaleiros do Zodíaco (Série Clássica 1986)", "chronological_note": "A Guerra Galáctica, as 12 Casas do Santuário, Asgard e o Templo de Poseidon."},
            {"tmdb_id": 67199, "media_type": "tv", "order": 2, "order_title": "2. Saint Seiya: A Saga de Hades (Santuário, Inferno & Elíseos)", "chronological_note": "A invasão dos Espectros, o Muro das Lamentações e a batalha com Armaduras Divinas nos Elíseos."},
            {"tmdb_id": 61389, "media_type": "tv", "order": 3, "order_title": "3. Os Cavaleiros do Zodíaco: The Lost Canvas", "chronological_note": "A antiga Guerra Santa do século XVIII entre Tenma de Pégaso, Alone e Sasha."},
            {"tmdb_id": 62428, "media_type": "tv", "order": 4, "order_title": "4. Saint Seiya: Alma de Ouro (Soul of Gold)", "chronological_note": "Os 12 Cavaleiros de Ouro ressuscitam em Asgard e despertam suas Armaduras Divinas."},
            {"tmdb_id": 50253, "media_type": "movie", "order": 5, "order_title": "5. Cavaleiros do Zodíaco: Prólogo do Céu", "chronological_note": "O confronto pós-Hades contra os Anjos Celestiais e a deusa Ártemis."},
            {"tmdb_id": 287590, "media_type": "movie", "order": 6, "order_title": "6. Os Cavaleiros do Zodíaco: A Lenda do Santuário (3D)", "chronological_note": "A releitura cinematográfica das Doze Casas com computação gráfica espetacular."},
            {"tmdb_id": 44317, "media_type": "tv", "order": 7, "order_title": "7. Cavaleiros do Zodíaco: Saint Seiya Ômega", "chronological_note": "Kouga de Pégaso lidera a nova geração de cavaleiros contra Marte e Pallas."}
        ]
    },
    "naruto": {
        "title": "Coleção Naruto",
        "subtitle": "Da Academia Ninja ao Hokage e Boruto",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/z0YhJvomqedHF85bplUJEotkN5l.jpg",
        "description": "A história de superação de Naruto Uzumaki em sua jornada completa para ser respeitado e se tornar Hokage.",
        "items": [
            {"tmdb_id": 46260, "media_type": "tv", "order": 1, "order_title": "1. Naruto (Clássico)", "chronological_note": "Da infância na Academia aos Exames Chunin, Busca por Tsunade e o resgate de Sasuke."},
            {"tmdb_id": 16907, "media_type": "movie", "order": 2, "order_title": "2. Naruto: O Confronto Ninja no País da Neve", "chronological_note": "Missão de escolta de alta periculosidade do Time 7 no País da Neve."},
            {"tmdb_id": 31910, "media_type": "tv", "order": 3, "order_title": "3. Naruto Shippuden (Série Completa)", "chronological_note": "O retorno de Naruto mais forte, a ameaça da Akatsuki, Pain e a 4ª Grande Guerra Ninja."},
            {"tmdb_id": 317442, "media_type": "movie", "order": 4, "order_title": "4. The Last: Naruto o Filme", "chronological_note": "O filme canônico que narra o romance de Naruto e Hinata e a ameaça de Toneri Otsutsuki na Lua."},
            {"tmdb_id": 347201, "media_type": "movie", "order": 5, "order_title": "5. Boruto: Naruto o Filme", "chronological_note": "Naruto como 7º Hokage e seu filho Boruto enfrentando os invasores Otsutsuki."},
            {"tmdb_id": 70881, "media_type": "tv", "order": 6, "order_title": "6. Boruto: Naruto Next Generations", "chronological_note": "A nova era do mundo shinobi com Boruto, Sarada e Mitsuki enfrentando a Kara."}
        ]
    },
    "batman": {
        "title": "Coleção Batman",
        "subtitle": "O Cavaleiro das Trevas de Gotham",
        "icon": "",
        "badge": "Saga Completa",
        "backdrop": "/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg",
        "description": "Do clássico gótico de Tim Burton à aclamada trilogia de Christopher Nolan e o detetive noir de Gotham.",
        "items": [
            {"tmdb_id": 268, "media_type": "movie", "order": 1, "order_title": "1. Batman (1989)", "chronological_note": "Michael Keaton como o herói contra o Coringa de Jack Nicholson."},
            {"tmdb_id": 364, "media_type": "movie", "order": 2, "order_title": "2. Batman: O Retorno (1992)", "chronological_note": "Gotham em conflito com o Pinguim e a Mulher-Gato."},
            {"tmdb_id": 272, "media_type": "movie", "order": 3, "order_title": "3. Batman Begins (2005)", "chronological_note": "O treinamento de Bruce Wayne na Liga das Sombras com Ra's al Ghul."},
            {"tmdb_id": 155, "media_type": "movie", "order": 4, "order_title": "4. Batman: O Cavaleiro das Trevas (2008)", "chronological_note": "O embate lendário contra a anarquia do Coringa de Heath Ledger."},
            {"tmdb_id": 49026, "media_type": "movie", "order": 5, "order_title": "5. Batman: O Cavaleiro das Trevas Ressurge (2012)", "chronological_note": "Bane quebra Gotham e Bruce Wayne realiza a subida definitiva."},
            {"tmdb_id": 414906, "media_type": "movie", "order": 6, "order_title": "6. The Batman (2022)", "chronological_note": "Robert Pattinson em investigação noir contra o Charada."}
        ]
    },
    "spider_man": {
        "title": "Coleção Homem-Aranha",
        "subtitle": "Trilogia Maguire, Garfield, MCU e Aranhaverso",
        "icon": "",
        "badge": "Saga Completa",
        "backdrop": "/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg",
        "description": "Todas as eras do teioso no cinema: Sam Raimi, Espetacular Homem-Aranha, MCU e a animação do Aranhaverso.",
        "items": [
            {"tmdb_id": 557, "media_type": "movie", "order": 1, "order_title": "1. Homem-Aranha (2002)", "chronological_note": "A picada da aranha, Duende Verde e 'Com grandes poderes vêm grandes responsabilidades'."},
            {"tmdb_id": 558, "media_type": "movie", "order": 2, "order_title": "2. Homem-Aranha 2 (2004)", "chronological_note": "A crise de identidade de Peter Parker contra o Doutor Octopus."},
            {"tmdb_id": 559, "media_type": "movie", "order": 3, "order_title": "3. Homem-Aranha 3 (2007)", "chronological_note": "O uniforme negro do Simbionte, Homem-Areia e Venom."},
            {"tmdb_id": 1930, "media_type": "movie", "order": 4, "order_title": "4. O Espetacular Homem-Aranha (2012)", "chronological_note": "Andrew Garfield como Peter Parker investigando os segredos de seu pai contra o Lagarto."},
            {"tmdb_id": 102382, "media_type": "movie", "order": 5, "order_title": "5. O Espetacular Homem-Aranha 2: A Ameaça de Electro (2014)", "chronological_note": "Confronto elétrico contra Electro e o trágico destino na torre do relógio."},
            {"tmdb_id": 315635, "media_type": "movie", "order": 6, "order_title": "6. Homem-Aranha: De Volta ao Lar (2017)", "chronological_note": "Tom Holland mentorado por Tony Stark contra o Abutre."},
            {"tmdb_id": 324857, "media_type": "movie", "order": 7, "order_title": "7. Homem-Aranha no Aranhaverso (2018)", "chronological_note": "Miles Morales assume o manto e descobre heróis de realidades paralelas."},
            {"tmdb_id": 429617, "media_type": "movie", "order": 8, "order_title": "8. Homem-Aranha: Longe de Casa (2019)", "chronological_note": "Viagem pela Europa pós-Ultimato e as ilusões de Mistério."},
            {"tmdb_id": 634649, "media_type": "movie", "order": 9, "order_title": "9. Homem-Aranha: Sem Volta Para Casa (2021)", "chronological_note": "O feitiço que rompe as barreiras dimensionais unindo os três Peters."},
            {"tmdb_id": 569094, "media_type": "movie", "order": 10, "order_title": "10. Homem-Aranha: Através do Aranhaverso (2023)", "chronological_note": "Miles Morales viaja pelo multiverso e desafia a Sociedade Aranha de Miguel O'Hara."}
        ]
    },
    "john_wick": {
        "title": "Coleção John Wick",
        "subtitle": "A Saga de Baba Yaga",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/7I6VUdPj6tQECNHdviJkUHD2u89.jpg",
        "description": "O lendário assassino aposentado que desafia o submundo do crime e a Cúpula Alta em busca de liberdade.",
        "items": [
            {"tmdb_id": 245891, "media_type": "movie", "order": 1, "order_title": "1. De Volta ao Jogo (John Wick - 2014)", "chronological_note": "O despertar da lenda do Baba Yaga após a invasão de sua casa."},
            {"tmdb_id": 324552, "media_type": "movie", "order": 2, "order_title": "2. John Wick: Um Novo Dia Para Matar (2017)", "chronological_note": "Uma promessa de sangue leva Wick a Roma e quebra as regras do Continental."},
            {"tmdb_id": 458156, "media_type": "movie", "order": 3, "order_title": "3. John Wick 3: Parabellum (2019)", "chronological_note": "Excomungado e com uma recompensa mundial de 14 milhões de dólares pela sua cabeça."},
            {"tmdb_id": 603692, "media_type": "movie", "order": 4, "order_title": "4. John Wick 4: Baba Yaga (2023)", "chronological_note": "A batalha definitiva contra o Marquês de Gramont pela libertação total da Cúpula."}
        ]
    },
    "mission_impossible": {
        "title": "Coleção Missão: Impossível",
        "subtitle": "As Operações de Ethan Hunt e IMF",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/628Dep6AxEtDxjZoGP78TsOxYbK.jpg",
        "description": "Ação extrema sem dublês com Ethan Hunt e a IMF desarmando sindicatos terroristas globais.",
        "items": [
            {"tmdb_id": 954, "media_type": "movie", "order": 1, "order_title": "1. Missão: Impossível (1996)", "chronological_note": "Ethan Hunt acusado de traição após massacre em Praga busca a lista NOC."},
            {"tmdb_id": 955, "media_type": "movie", "order": 2, "order_title": "2. Missão: Impossível 2 (2000)", "chronological_note": "Missão em Sydney para impedir a disseminação do vírus Quimera."},
            {"tmdb_id": 956, "media_type": "movie", "order": 3, "order_title": "3. Missão: Impossível 3 (2006)", "chronological_note": "O sádico traficante Owen Davian ameaça a noiva de Ethan pelo Pé de Coelho."},
            {"tmdb_id": 56292, "media_type": "movie", "order": 4, "order_title": "4. Missão: Impossível - Protocolo Fantasma (2011)", "chronological_note": "IMF desavinda; escalada vertiginosa no Burj Khalifa em Dubai."},
            {"tmdb_id": 177677, "media_type": "movie", "order": 5, "order_title": "5. Missão: Impossível - Nação Secreta (2015)", "chronological_note": "A caçada contra o Sindicato de Solomon Lane com Ilsa Faust."},
            {"tmdb_id": 353081, "media_type": "movie", "order": 6, "order_title": "6. Missão: Impossível - Efeito Fallout (2018)", "chronological_note": "A corrida contra os Apóstolos para recuperar ogivas nucleares roubadas."},
            {"tmdb_id": 575264, "media_type": "movie", "order": 7, "order_title": "7. Missão: Impossível - Acerto De Contas Parte 1 (2023)", "chronological_note": "A inteligência artificial autônoma A Entidade ameaça a soberania global."}
        ]
    },
    "matrix": {
        "title": "Coleção Matrix",
        "subtitle": "A Realidade Simulada e a Libertação de Zion",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg",
        "description": "A jornada de Thomas Anderson (Neo), Trinity e Morpheus desvendando a ilusão da simulação.",
        "items": [
            {"tmdb_id": 603, "media_type": "movie", "order": 1, "order_title": "1. Matrix (1999)", "chronological_note": "A pílula vermelha: Neo descobre que a realidade é uma simulação controlada por máquinas."},
            {"tmdb_id": 604, "media_type": "movie", "order": 2, "order_title": "2. Matrix Reloaded (2003)", "chronological_note": "O exército de clones do Agente Smith e a busca pela Fonte e o Arquiteto."},
            {"tmdb_id": 605, "media_type": "movie", "order": 3, "order_title": "3. Matrix Revolutions (2003)", "chronological_note": "A guerra final das máquinas contra Zion e o sacrifício de Neo."},
            {"tmdb_id": 624860, "media_type": "movie", "order": 4, "order_title": "4. Matrix Resurrections (2021)", "chronological_note": "Anos após o sacrifício, Neo e Trinity despertam em uma nova versão da Matrix."}
        ]
    },
    "x_men": {
        "title": "Coleção X-Men & Mutantes",
        "subtitle": "A Saga dos Mutantes e Deadpool",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/3czpqXzFy5UcNuD1AubecRLWkwD.jpg",
        "description": "Desde a fundação do Instituto Xavier nos anos 60 até o sacrifício de Logan e o multiverso de Deadpool.",
        "items": [
            {"tmdb_id": 49538, "media_type": "movie", "order": 1, "order_title": "1. X-Men: Primeira Classe (1962)", "chronological_note": "Charles Xavier e Erik Lehnsherr durante a Crise dos Mísseis de Cuba."},
            {"tmdb_id": 127585, "media_type": "movie", "order": 2, "order_title": "2. X-Men: Dias de um Futuro Esquecido (1973/Futuro)", "chronological_note": "Wolverine viaja no tempo para impedir a criação dos Sentinelas."},
            {"tmdb_id": 246655, "media_type": "movie", "order": 3, "order_title": "3. X-Men: Apocalipse (1983)", "chronological_note": "O primeiro mutante da história acorda no Egito com seus Quatro Cavaleiros."},
            {"tmdb_id": 36657, "media_type": "movie", "order": 4, "order_title": "4. X-Men: O Filme (2000)", "chronological_note": "Wolverine e Vampira ingressam na Mansão X contra a Irmandade de Magneto."},
            {"tmdb_id": 36658, "media_type": "movie", "order": 5, "order_title": "5. X-Men 2 (2003)", "chronological_note": "Aliança temporária entre Xavier e Magneto contra o coronel William Stryker."},
            {"tmdb_id": 36668, "media_type": "movie", "order": 6, "order_title": "6. X-Men: O Confronto Final (2006)", "chronological_note": "A cura mutante e o surgimento descontrolado da Fênix Negra."},
            {"tmdb_id": 293660, "media_type": "movie", "order": 7, "order_title": "7. Deadpool (2016)", "chronological_note": "Wade Wilson ganha fator de cura acelerado e senso de humor ácido."},
            {"tmdb_id": 383498, "media_type": "movie", "order": 8, "order_title": "8. Deadpool 2 (2018)", "chronological_note": "Wade forma a X-Force para proteger o jovem Russell de Cable."},
            {"tmdb_id": 263115, "media_type": "movie", "order": 9, "order_title": "9. Logan (2029)", "chronological_note": "O futuro desolador onde um envelhecido Wolverine protege a jovem Laura (X-23)."},
            {"tmdb_id": 533535, "media_type": "movie", "order": 10, "order_title": "10. Deadpool & Wolverine (2024)", "chronological_note": "O salto multiversal para salvar a linha do tempo com a AVT."}
        ]
    },
    "shrek": {
        "title": "Coleção Shrek",
        "subtitle": "Do Pântano a Tão Tão Distante e Gato de Botas",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/w0eKUOEog2ImtktCHAMUZws8qif.jpg",
        "description": "As hilárias e emocionantes aventuras do ogro mais querido do cinema e seu companheiro Gato de Botas.",
        "items": [
            {"tmdb_id": 417859, "media_type": "movie", "order": 1, "order_title": "1. Gato de Botas (2011)", "chronological_note": "A origem do felino espadachim antes de conhecer Shrek e Burro."},
            {"tmdb_id": 808, "media_type": "movie", "order": 2, "order_title": "2. Shrek (2001)", "chronological_note": "O ogro parte para resgatar a Princesa Fiona do castelo do Dragão para Lord Farquaad."},
            {"tmdb_id": 809, "media_type": "movie", "order": 3, "order_title": "3. Shrek 2 (2004)", "chronological_note": "Visita aos sogros no Reino de Tão Tão Distante com a Fada Madrinha e Príncipe Encantado."},
            {"tmdb_id": 810, "media_type": "movie", "order": 4, "order_title": "4. Shrek Terceiro (2007)", "chronological_note": "A busca pelo herdeiro Arthur Pendragon para assumir o trono de Tão Tão Distante."},
            {"tmdb_id": 10192, "media_type": "movie", "order": 5, "order_title": "5. Shrek Para Sempre (2010)", "chronological_note": "Rumpelstiltskin cria uma realidade paralela onde Shrek nunca nasceu."},
            {"tmdb_id": 315162, "media_type": "movie", "order": 6, "order_title": "6. Gato de Botas 2: O Último Pedido (2022)", "chronological_note": "Em sua nona e última vida, o Gato busca a Estrela dos Desejos fugindo da Morte."}
        ]
    },
    "jurassic": {
        "title": "Coleção Jurassic Park & World",
        "subtitle": "65 Milhões de Anos de Evolução e Genética",
        "icon": "",
        "badge": "Ordem Cronológica",
        "backdrop": "/dF6FjTZzRTENfB4R17HDN20jLT2.jpg",
        "description": "A criação e fuga dos dinossauros clonados na Isla Nublar e sua coexistência perigosa pelo planeta.",
        "items": [
            {"tmdb_id": 329, "media_type": "movie", "order": 1, "order_title": "1. Jurassic Park: Parque dos Dinossauros (1993)", "chronological_note": "John Hammond inaugura a Isla Nublar com dinossauros clonados de âmbar fóssil."},
            {"tmdb_id": 330, "media_type": "movie", "order": 2, "order_title": "2. O Mundo Perdido: Jurassic Park (1997)", "chronological_note": "Expedição de Ian Malcolm à Isla Sorna e a chegada de um T-Rex em San Diego."},
            {"tmdb_id": 331, "media_type": "movie", "order": 3, "order_title": "3. Jurassic Park III (2001)", "chronological_note": "O paleontólogo Alan Grant é atraído à Isla Sorna pelo temível Espinossauro."},
            {"tmdb_id": 135397, "media_type": "movie", "order": 4, "order_title": "4. Jurassic World: O Mundo dos Dinossauros (2015)", "chronological_note": "O parque totalmente operacional enfrenta a fuga do híbrido Indominus Rex."},
            {"tmdb_id": 351286, "media_type": "movie", "order": 5, "order_title": "5. Jurassic World: Reino Ameaçado (2018)", "chronological_note": "Resgate dos dinossauros antes da erupção vulcânica e o leilão na Mansão Lockwood."},
            {"tmdb_id": 507086, "media_type": "movie", "order": 6, "order_title": "6. Jurassic World: Domínio (2022)", "chronological_note": "Dinossauros espalhados pelo mundo e a união épica das duas gerações de protagonistas."}
        ]
    }
}

def get_collections_list() -> List[Dict[str, Any]]:
    """Retorna lista de todas as coleções com seus metadados de apresentação."""
    return [
        {
            "key": k,
            "title": v["title"],
            "subtitle": v["subtitle"],
            "icon": v.get("icon", ""),
            "badge": v.get("badge", "Ordem Cronológica"),
            "description": v["description"],
            "backdrop": v.get("backdrop"),
            "item_count": len(v.get("items", []))
        }
        for k, v in COLLECTIONS_CONFIG.items()
    ]

def get_collection_details(collection_key: str) -> Optional[Dict[str, Any]]:
    """Retorna a coleção enriquecida com os dados TMDB de cada filme/série na ordem cronológica de assistir."""
    cache_key = f"collection_details_{collection_key}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    config = COLLECTIONS_CONFIG.get(collection_key)
    if not config:
        return None

    items_to_fetch = config["items"]

    def fetch_item(it: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        mtype = it["media_type"]
        tid = it["tmdb_id"]
        endpoint = f"{mtype}/{tid}"
        data = tmdb_request(endpoint)
        if not data:
            return None
        return {
            "id": data.get("id"),
            "tmdb_id": data.get("id"),
            "title": data.get("title") or data.get("name") or it.get("order_title"),
            "original_title": data.get("original_title") or data.get("original_name"),
            "poster_path": data.get("poster_path"),
            "backdrop_path": data.get("backdrop_path"),
            "overview": data.get("overview") or "",
            "vote_average": data.get("vote_average", 0.0),
            "release_date": data.get("release_date") or data.get("first_air_date", ""),
            "media_type": mtype,
            "order": it["order"],
            "order_title": it["order_title"],
            "chronological_note": it.get("chronological_note", "")
        }

    with ThreadPoolExecutor(max_workers=min(len(items_to_fetch), 10)) as executor:
        enriched_items = list(executor.map(fetch_item, items_to_fetch))

    valid_items = [it for it in enriched_items if it is not None]
    valid_items.sort(key=lambda x: x["order"])

    header_backdrop = config.get("backdrop")
    if not header_backdrop and valid_items:
        for it in valid_items:
            if it.get("backdrop_path"):
                header_backdrop = it["backdrop_path"]
                break

    result = {
        "key": collection_key,
        "title": config["title"],
        "subtitle": config["subtitle"],
        "icon": config.get("icon", ""),
        "badge": config.get("badge", "Ordem Cronológica"),
        "description": config["description"],
        "backdrop": header_backdrop,
        "total_items": len(valid_items),
        "items": valid_items
    }

    _set_cached(cache_key, result)
    return result

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
    """Gera recomendações personalizadas com base nos gostos do perfil e títulos assistidos"""
    profile = None
    recent = []
    try:
        from app import database
        profile = database.get_profile_by_id(profile_id)
        recent = database.get_profile_recent_media_ids(profile_id, limit=5)
    except Exception as exc:
        print(f"[Recs Error] {exc}")

    recs = []
    seen_ids = set()

    # 1. Recomendações baseadas no histórico recente
    for item in recent:
        m_id = str(item.get("media_id"))
        m_type = item.get("media_type") or "movie"
        if m_id.startswith("live_"):
            continue

        seen_ids.add(m_id)
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

    # 2. Se não houver histórico suficiente, usa os gêneros favoritos escolhidos no onboarding
    if len(recs) < 12 and profile and profile.get("preferred_genres"):
        pref_keys = [g.strip() for g in profile.get("preferred_genres", "").split(",") if g.strip()]
        for pkey in pref_keys:
            conf = CATEGORY_CONFIG.get(pkey)
            if conf:
                try:
                    genre_items = conf["func"](1)
                    for gi in genre_items:
                        gid = str(gi.get("id"))
                        if gid not in seen_ids and (gi.get("poster_path") or gi.get("backdrop_path")):
                            seen_ids.add(gid)
                            recs.append(gi)
                            if len(recs) >= 24:
                                break
                except Exception:
                    pass
            if len(recs) >= 24:
                break

    # 3. Fallback inteligente sem duplicar com a linha 'Em Alta no HomeFlix':
    # Usa obras mais bem avaliadas e aclamadas (Top Rated) filtrando títulos da semana
    if len(recs) < 10:
        trending_week = get_trending("all", "week")
        trending_ids = {str(t.get("id")) for t in trending_week}

        top_movies = get_top_rated_movies(1) + get_popular_series(1)
        for tm in top_movies:
            t_id = str(tm.get("id"))
            if t_id not in seen_ids and t_id not in trending_ids and (tm.get("poster_path") or tm.get("backdrop_path")):
                seen_ids.add(t_id)
                recs.append(tm)
                if len(recs) >= 20:
                    break

    return recs[:24]

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

