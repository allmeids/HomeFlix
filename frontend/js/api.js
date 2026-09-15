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
  async getHomeCatalog() {
    return await this.request('/api/media/home');
  },

  async getTrending(type = 'all') {
    const data = await this.request(`/api/media/trending?type=${type}`);
    return data?.results || [];
  },

  async getPopularMovies() {
    const data = await this.request('/api/media/movies/popular');
    return data?.results || [];
  },

  async getPopularSeries() {
    const data = await this.request('/api/media/series/popular');
    return data?.results || [];
  },

  async getTopRatedMovies() {
    const data = await this.request('/api/media/movies/top');
    return data?.results || [];
  },

  async getTopRatedSeries() {
    const data = await this.request('/api/media/series/top');
    return data?.results || [];
  },

  async getNowPlaying() {
    const data = await this.request('/api/media/now-playing');
    return data?.results || [];
  },

  async getAnimes() {
    const data = await this.request('/api/media/animes');
    return data?.results || [];
  },

  async getMediaDetails(mediaType, tmdbId) {
    return await this.request(`/api/media/details/${mediaType}/${tmdbId}`);
  },

  async getSeasonDetails(tvId, seasonNumber) {
    return await this.request(`/api/media/season/${tvId}/${seasonNumber}`);
  },

  async search(query) {
    if (!query) return [];
    const data = await this.request(`/api/media/search?q=${encodeURIComponent(query)}`);
    return data?.results || [];
  },

  // VOD Streams
  async resolveStreams(mediaType, tmdbId, season = null, episode = null) {
    let url = `/api/streams/resolve?type=${mediaType}&id=${tmdbId}`;
    if (season) url += `&season=${season}`;
    if (episode) url += `&episode=${episode}`;
    return await this.request(url);
  },

  // Live TV
  async getLiveChannels() {
    return await this.request('/api/live/channels');
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

  // Progresso & Quick Resume
  async getContinueWatching(profileId) {
    const data = await this.request(`/api/progress/continue-watching?profile_id=${profileId}`);
    return data?.results || [];
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
