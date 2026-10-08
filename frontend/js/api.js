const API = {
  baseUrl: window.location.origin,

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`[API Request Error] ${endpoint}:`, err);
      return null;
    }
  },

  // TMDB / Catálogo
  async getHomeCatalog(refresh = false) {
    return await this.request(`/api/media/home${refresh ? '?refresh=true' : ''}`);
  },

  async refreshCatalog() {
    return await this.request('/api/media/refresh', { method: 'POST' });
  },

  async getTrending(type = 'all') {
    const data = await this.request(`/api/media/trending?type=${type}`);
    return data?.results || [];
  },

  async getPopularMovies(page = 1) {
    const data = await this.request(`/api/media/movies/popular?page=${page}`);
    return data?.results || [];
  },

  async getPopularSeries(page = 1) {
    const data = await this.request(`/api/media/series/popular?page=${page}`);
    return data?.results || [];
  },

  async getTopRatedMovies(page = 1) {
    const data = await this.request(`/api/media/movies/top?page=${page}`);
    return data?.results || [];
  },

  async getTopRatedSeries(page = 1) {
    const data = await this.request(`/api/media/series/top?page=${page}`);
    return data?.results || [];
  },

  async getNowPlaying(page = 1) {
    const data = await this.request(`/api/media/now-playing?page=${page}`);
    return data?.results || [];
  },

  async getAnimes(page = 1) {
    const data = await this.request(`/api/media/animes?page=${page}`);
    return data?.results || [];
  },

  async getRecommendations(profileId) {
    const data = await this.request(`/api/media/recommendations?profile_id=${profileId}`);
    return data?.results || [];
  },

  async getCategoryItems(categoryKey, page = 1) {
    return await this.request(`/api/media/category/${categoryKey}?page=${page}`);
  },

  async getMediaDetails(mediaType, tmdbId) {
    return await this.request(`/api/media/details/${mediaType}/${tmdbId}`);
  },

  async getSeasonDetails(tvId, seasonNumber) {
    return await this.request(`/api/media/season/${tvId}/${seasonNumber}`);
  },

  async getCategories() {
    const data = await this.request('/api/media/categories');
    return data?.categories || [];
  },

  async getCollections() {
    const data = await this.request('/api/media/collections');
    return data?.collections || [];
  },

  async getCollection(key) {
    return await this.request(`/api/media/collection/${key}`);
  },

  async getAnimeSagas(page = 1) {
    const data = await this.request(`/api/media/animes/sagas?page=${page}`);
    return data?.results || [];
  },

  async getAnimeHits(page = 1) {
    const data = await this.request(`/api/media/animes/hits?page=${page}`);
    return data?.results || [];
  },

  async search(query, page = 1) {
    if (!query) return { results: [], similar: [], exact_match: true };
    const data = await this.request(`/api/media/search?q=${encodeURIComponent(query)}&page=${page}`);
    return data || { results: [], similar: [], exact_match: true };
  },

  // VOD Streams
  async resolveStreams(mediaType, tmdbId, season = null, episode = null) {
    let url = `/api/streams/resolve?type=${mediaType}&id=${tmdbId}`;
    if (season) url += `&season=${season}`;
    if (episode) url += `&episode=${episode}`;
    return await this.request(url);
  },

  // Live TV
  async getLiveChannels(refresh = false) {
    const url = refresh ? '/api/live/channels?refresh=true' : '/api/live/channels';
    return await this.request(url);
  },

  // Perfis
  async getProfiles() {
    const data = await this.request('/api/profiles');
    return data?.profiles || [];
  },

  async createProfile(name, avatar) {
    return await this.request('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });
  },

  async updateProfile(profileId, name, avatar) {
    return await this.request(`/api/profiles/${profileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar })
    });
  },

  async deleteProfile(profileId) {
    return await this.request(`/api/profiles/${profileId}`, {
      method: 'DELETE'
    });
  },

  // Progresso & Quick Resume
  async getContinueWatching(profileId) {
    const data = await this.request(`/api/progress/continue-watching?profile_id=${profileId}`);
    return data?.results || [];
  },

  async getMediaProgress(profileId, mediaId, season = 1, episode = 1) {
    if (!profileId || !mediaId) return null;
    const data = await this.request(`/api/progress/media?profile_id=${profileId}&media_id=${mediaId}&season=${season}&episode=${episode}`);
    return data?.progress || null;
  },

  async saveProgress(progressData) {
    return await this.request('/api/progress/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressData)
    });
  },

  async deleteProgress(profileId, mediaId) {
    return await this.request(`/api/progress/${profileId}/${mediaId}`, {
      method: 'DELETE'
    });
  },

  // Favoritos
  async getFavorites(profileId) {
    const data = await this.request(`/api/favorites?profile_id=${profileId}`);
    return data?.results || [];
  },

  async toggleFavorite(favData) {
    return await this.request('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(favData)
    });
  }
};
