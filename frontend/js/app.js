class HomeFlixApp {
  constructor() {
    this.currentTab = 'home';
    this.profiles = [];
    this.currentProfile = null;
    this.heroItem = null;
    this.channels = [];
    this.categories = [];
    this.selectedLiveCategory = 'Todos';

    this.player = new HomeFlixPlayer();
    this.init();
  }

  async init() {
    this.setupNavbar();
    this.setupModals();
    await this.loadProfiles();
    await this.loadHome();
  }

  setupNavbar() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.target.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Brand logo
    document.querySelector('.brand-logo').addEventListener('click', () => {
      this.switchTab('home');
    });

    // Profile button
    document.getElementById('profileBtn').addEventListener('click', () => {
      this.openProfileModal();
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      if (q.length >= 2) {
        debounceTimer = setTimeout(() => this.searchMedia(q), 400);
      } else if (q.length === 0) {
        this.switchTab('home');
      }
    });
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tab) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const heroSection = document.getElementById('heroSection');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');

    searchContainer.style.display = 'none';

    if (tab === 'home') {
      heroSection.style.display = 'flex';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadHome();
    } else if (tab === 'movies') {
      heroSection.style.display = 'flex';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadMoviesTab();
    } else if (tab === 'series') {
      heroSection.style.display = 'flex';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadSeriesTab();
    } else if (tab === 'live') {
      heroSection.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'block';
      this.loadLiveTv();
    } else if (tab === 'watchlist') {
      heroSection.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'none';
      this.loadWatchlist();
    }
  }

  async loadProfiles() {
    this.profiles = await API.getProfiles();
    const savedId = localStorage.getItem('homeflix_active_profile');
    if (savedId) {
      this.currentProfile = this.profiles.find(p => String(p.id) === String(savedId));
    }
    if (!this.currentProfile && this.profiles.length > 0) {
      this.currentProfile = this.profiles[0];
    }
    window.currentProfile = this.currentProfile;
    this.updateProfileUI();
  }

  updateProfileUI() {
    if (this.currentProfile) {
      document.getElementById('navProfileAvatar').textContent = this.currentProfile.avatar || '🦊';
      document.getElementById('navProfileName').textContent = this.currentProfile.name || 'Perfil';
    }
  }

  openProfileModal() {
    const modal = document.getElementById('profileModal');
    const grid = document.getElementById('profileModalGrid');
    grid.innerHTML = '';

    this.profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.innerHTML = `
        <div class="profile-avatar-large">${p.avatar}</div>
        <div class="profile-name-large">${p.name}</div>
      `;
      card.onclick = () => {
        this.currentProfile = p;
        window.currentProfile = p;
        localStorage.setItem('homeflix_active_profile', p.id);
        this.updateProfileUI();
        modal.classList.remove('open');
        this.loadContinueWatching();
      };
      grid.appendChild(card);
    });

    modal.classList.add('open');
  }

  async loadHome() {
    // 1. Trending para o Hero Banner
    const trending = await API.getTrending('all');
    if (trending.length > 0) {
      this.renderHero(trending[0]);
    }

    // 2. Continuar Assistindo (Quick Resume)
    await this.loadContinueWatching();

    // 3. Em Alta
    this.renderCarousel('trendingCarousel', trending);

    // 4. Filmes Populares
    const popularMovies = await API.getPopularMovies();
    this.renderCarousel('popularMoviesCarousel', popularMovies);

    // 5. Séries Populares
    const popularSeries = await API.getPopularSeries();
    this.renderCarousel('popularSeriesCarousel', popularSeries);

    // 6. Top Filmes
    const topMovies = await API.getTopRatedMovies();
    this.renderCarousel('topMoviesCarousel', topMovies);

    // 7. Animes
    const animes = await API.getAnimes();
    this.renderCarousel('animesCarousel', animes);
  }

  async loadMoviesTab() {
    const popular = await API.getPopularMovies();
    if (popular.length > 0) this.renderHero(popular[0]);
    this.renderCarousel('trendingCarousel', popular);
    const top = await API.getTopRatedMovies();
    this.renderCarousel('popularMoviesCarousel', top);
    const nowPlaying = await API.getNowPlaying();
    this.renderCarousel('popularSeriesCarousel', nowPlaying);
  }

  async loadSeriesTab() {
    const popular = await API.getPopularSeries();
    if (popular.length > 0) this.renderHero(popular[0]);
    this.renderCarousel('trendingCarousel', popular);
    const top = await API.getTopRatedSeries();
    this.renderCarousel('popularMoviesCarousel', top);
    const animes = await API.getAnimes();
    this.renderCarousel('popularSeriesCarousel', animes);
  }

  async loadContinueWatching() {
    if (!this.currentProfile) return;
    const items = await API.getContinueWatching(this.currentProfile.id);
    const section = document.getElementById('continueWatchingSection');
    const carousel = document.getElementById('continueWatchingCarousel');

    if (!items || items.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    carousel.innerHTML = '';

    items.forEach(item => {
      const pct = item.duration > 0 ? (item.position / item.duration) * 100 : 0;
      const card = document.createElement('div');
      card.className = 'media-card continue-card';
      const bgImg = item.backdrop_path 
        ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
        : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '');

      card.innerHTML = `
        <img class="media-card-poster" src="${bgImg}" alt="${item.title}" loading="lazy" />
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="media-card-info">
          <div class="media-card-title">${item.title}</div>
          <div class="media-card-sub">
            <span>${item.media_type === 'tv' ? `T${item.season_number} E${item.episode_number}` : 'Filme'}</span>
            <span style="color: var(--accent-red); font-weight:700;">▶ Retomar</span>
          </div>
        </div>
      `;

      card.onclick = () => {
        this.openMediaDetails(item.media_type, item.media_id, {
          resumeTime: item.position,
          season: item.season_number,
          episode: item.episode_number
        });
      };

      carousel.appendChild(card);
    });
  }

  renderHero(item) {
    this.heroItem = item;
    const hero = document.getElementById('heroSection');
    const title = item.title || item.name || 'Destaque';
    const overview = item.overview || 'Sem sinopse disponível.';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '9.2';
    const date = item.release_date || item.first_air_date || '2026';
    const year = date.split('-')[0];
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

    const backdrop = item.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : `https://image.tmdb.org/t/p/original${item.poster_path}`;

    hero.style.backgroundImage = `url('${backdrop}')`;
    document.getElementById('heroTitle').textContent = title;
    document.getElementById('heroRating').textContent = `★ ${rating}`;
    document.getElementById('heroYear').textContent = year;
    document.getElementById('heroType').textContent = mediaType === 'movie' ? 'Filme' : 'Série';
    document.getElementById('heroOverview').textContent = overview;

    document.getElementById('heroPlayBtn').onclick = () => {
      this.openMediaDetails(mediaType, item.id, { autoPlay: true });
    };

    document.getElementById('heroInfoBtn').onclick = () => {
      this.openMediaDetails(mediaType, item.id);
    };
  }

  renderCarousel(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    items.forEach(item => {
      if (!item.poster_path) return;
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
      const date = item.release_date || item.first_air_date || '';
      const year = date ? date.split('-')[0] : '';

      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${item.poster_path}" alt="${title}" loading="lazy" />
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${year}</span>
            <span class="card-rating">★ ${rating}</span>
          </div>
        </div>
      `;

      card.onclick = () => this.openMediaDetails(mediaType, item.id);
      container.appendChild(card);
    });
  }

  async openMediaDetails(mediaType, tmdbId, opts = {}) {
    const modal = document.getElementById('detailsModal');
    const details = await API.getMediaDetails(mediaType, tmdbId);
    if (!details) return;

    const title = details.title || details.name || '';
    const overview = details.overview || 'Sinopse não disponível.';
    const rating = details.vote_average ? details.vote_average.toFixed(1) : '';
    const date = details.release_date || details.first_air_date || '';
    const year = date ? date.split('-')[0] : '';
    const backdrop = details.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
      : `https://image.tmdb.org/t/p/original${details.poster_path}`;

    document.getElementById('modalHero').style.backgroundImage = `url('${backdrop}')`;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalRating').textContent = `★ ${rating}`;
    document.getElementById('modalYear').textContent = year;
    document.getElementById('modalOverview').textContent = overview;

    // Gêneros
    const genres = (details.genres || []).map(g => g.name).join(', ');
    document.getElementById('modalGenres').textContent = genres ? `Gêneros: ${genres}` : '';

    // Episódios / Temporadas para séries
    const tvBox = document.getElementById('modalTvControls');
    const seasonSelect = document.getElementById('modalSeasonSelect');
    const episodesList = document.getElementById('modalEpisodesList');

    let currentSeason = opts.season || 1;
    let currentEpisode = opts.episode || 1;

    if (mediaType === 'tv' && details.seasons) {
      tvBox.style.display = 'block';
      seasonSelect.innerHTML = '';
      details.seasons.filter(s => s.season_number > 0).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.season_number;
        opt.textContent = `${s.name} (${s.episode_count} eps)`;
        if (s.season_number === currentSeason) opt.selected = true;
        seasonSelect.appendChild(opt);
      });

      const loadEpisodes = async (seasonNum) => {
        episodesList.innerHTML = '<p style="color:#888; font-size:13px;">Carregando episódios...</p>';
        const sData = await API.getSeasonDetails(tmdbId, seasonNum);
        episodesList.innerHTML = '';
        (sData?.episodes || []).forEach(ep => {
          const epRow = document.createElement('div');
          epRow.className = 'stream-option';
          epRow.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-weight:700; color:var(--accent-red); font-size:14px;">EP ${ep.episode_number}</span>
              <div>
                <div style="font-size:13px; font-weight:600;">${ep.name}</div>
                <div style="font-size:11px; color:#888; max-width:480px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ep.overview || ''}</div>
              </div>
            </div>
            <button class="btn btn-primary" style="padding:6px 14px; font-size:12px;">▶ Assistir</button>
          `;
          epRow.onclick = () => {
            currentSeason = seasonNum;
            currentEpisode = ep.episode_number;
            this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, ep.name);
          };
          episodesList.appendChild(epRow);
        });
      };

      seasonSelect.onchange = (e) => loadEpisodes(e.target.value);
      loadEpisodes(currentSeason);
    } else {
      tvBox.style.display = 'none';
    }

    // Checagem e exibição de badge de Cinema (CAM)
    const cinemaBadge = document.getElementById('modalCinemaBadge');
    if (cinemaBadge) cinemaBadge.style.display = 'none';
    API.resolveStreams(mediaType, tmdbId, currentSeason, currentEpisode).then(res => {
      if (res?.is_cinema_version && cinemaBadge) {
        cinemaBadge.style.display = 'inline-flex';
      }
    }).catch(() => {});

    // Botão Principal de Assistir no Modal (Auto-Play Melhor Servidor PT-BR)
    document.getElementById('modalPlayBtn').onclick = () => {
      this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, null, opts.resumeTime);
    };

    // Botão Favorito
    const favBtn = document.getElementById('modalFavBtn');
    favBtn.onclick = async () => {
      if (!this.currentProfile) return;
      const res = await API.toggleFavorite({
        profile_id: this.currentProfile.id,
        media_id: String(tmdbId),
        media_type: mediaType,
        title: title,
        poster_path: details.poster_path,
        vote_average: details.vote_average
      });
      favBtn.textContent = res.is_favorite ? '✓ Na Minha Lista' : '➕ Minha Lista';
    };

    modal.classList.add('open');

    if (opts.autoPlay) {
      this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, null, opts.resumeTime);
    }
  }

  async fetchAndPlay(mediaType, tmdbId, title, details, season = 1, episode = 1, epTitle = null, resumeTime = 0) {
    const playBtn = document.getElementById('modalPlayBtn');
    if (playBtn) playBtn.textContent = '⏳ Conectando ao melhor servidor...';

    const resolved = await API.resolveStreams(mediaType, tmdbId, season, episode);
    if (playBtn) playBtn.textContent = '▶ Assistir Agora';

    const streams = resolved?.streams || [];
    const bestStream = resolved?.best_stream || (streams.length > 0 ? streams[0] : null);
    const isCinema = !!resolved?.is_cinema_version || (bestStream && bestStream.is_cinema);

    if (!bestStream) {
      alert('Nenhuma fonte de reprodução disponível no momento para este título.');
      return;
    }

    // Fecha o modal e inicia o player instantaneamente com o melhor servidor
    document.getElementById('detailsModal').classList.remove('open');
    this.player.play({
      mediaId: tmdbId,
      mediaType: mediaType,
      title: title,
      poster: details.poster_path,
      backdrop: details.backdrop_path,
      season: season,
      episode: episode,
      episodeTitle: epTitle,
      initialTime: resumeTime,
      streams: streams,
      currentStreamUrl: bestStream.url,
      isCinema: isCinema
    });
  }

  async loadLiveTv() {
    const pillsContainer = document.getElementById('liveCategoryPills');
    const channelsGrid = document.getElementById('liveChannelsGrid');

    if (this.channels.length === 0) {
      channelsGrid.innerHTML = '<p style="color:#888; padding:40px 0; text-align:center;">Carregando canais ao vivo...</p>';
      const res = await API.getLiveChannels();
      this.channels = res?.channels || [];
      this.categories = res?.categories || ['Todos'];
    }

    // Categorias
    pillsContainer.innerHTML = '';
    this.categories.forEach(cat => {
      const pill = document.createElement('div');
      pill.className = `category-pill ${cat === this.selectedLiveCategory ? 'active' : ''}`;
      pill.textContent = cat;
      pill.onclick = () => {
        this.selectedLiveCategory = cat;
        this.renderLiveChannels();
      };
      pillsContainer.appendChild(pill);
    });

    this.renderLiveChannels();
  }

  renderLiveChannels() {
    const pillsContainer = document.getElementById('liveCategoryPills');
    pillsContainer.querySelectorAll('.category-pill').forEach(p => {
      p.classList.toggle('active', p.textContent === this.selectedLiveCategory);
    });

    const channelsGrid = document.getElementById('liveChannelsGrid');
    channelsGrid.innerHTML = '';

    const filtered = this.selectedLiveCategory === 'Todos'
      ? this.channels
      : this.channels.filter(c => c.category === this.selectedLiveCategory);

    filtered.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'channel-card';
      
      const bgImg = ch.featured_image || 'https://images.pluto.tv/channels/5f120e94a5714d00074576a1/featuredImage.jpg';
      const logoHtml = ch.logo
        ? `<img class="channel-logo-img" src="${ch.logo}" alt="${ch.name}" loading="lazy" />`
        : `<span style="font-weight:900; font-size:14px; color:#fff; text-shadow:0 1px 2px #000;">${ch.name}</span>`;

      card.innerHTML = `
        <div class="channel-card-backdrop" style="background-image: url('${bgImg}')"></div>
        <div class="channel-card-overlay"></div>
        <div class="channel-card-content">
          <div class="channel-top-row">
            <div class="channel-logo-wrap">
              ${logoHtml}
            </div>
            <div class="channel-badge-box">
              <span class="channel-number-tag">CH ${ch.number || ''}</span>
              <span class="channel-badge-live-pulse">
                <span class="live-pulse-dot"></span> AO VIVO
              </span>
            </div>
          </div>
          
          <div class="channel-bottom-info">
            <div class="channel-name-title">${ch.name}</div>
            <div class="channel-now-playing">
              <span>▶</span> <span>${ch.current_show || 'Transmissão Ao Vivo'}</span>
            </div>
            <div class="channel-synopsis-text">${ch.summary || ''}</div>
            <div class="channel-progress-track">
              <div class="channel-progress-bar" style="width: ${ch.progress_pct || 40}%;"></div>
            </div>
          </div>
        </div>
      `;

      card.onclick = () => {
        this.player.play({
          mediaId: `live_${ch.id}`,
          mediaType: 'live',
          title: ch.name,
          episodeTitle: ch.current_show,
          isLive: true,
          streams: [{ quality: 'HD 1080p', audio: 'Português', url: ch.stream_url }],
          currentStreamUrl: ch.stream_url
        });
      };

      channelsGrid.appendChild(card);
    });
  }

  async loadWatchlist() {
    if (!this.currentProfile) return;
    const heroSection = document.getElementById('heroSection');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const searchContainer = document.getElementById('searchContainer');

    heroSection.style.display = 'none';
    sectionsContainer.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const grid = document.getElementById('searchGrid');
    titleEl.textContent = `Minha Lista — ${this.currentProfile.name}`;
    grid.innerHTML = '';

    const items = await API.getFavorites(this.currentProfile.id);
    if (items.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1; padding:40px 0;">Sua lista está vazia. Adicione filmes e séries clicando no botão "Minha Lista" nos detalhes do título.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${item.poster_path}" alt="${item.title}" loading="lazy" />
        <div class="media-card-info">
          <div class="media-card-title">${item.title}</div>
          <div class="media-card-sub">
            <span>${item.media_type === 'movie' ? 'Filme' : 'Série'}</span>
            <span class="card-rating">★ ${item.vote_average?.toFixed(1) || ''}</span>
          </div>
        </div>
      `;
      card.onclick = () => this.openMediaDetails(item.media_type, item.media_id);
      grid.appendChild(card);
    });
  }

  async searchMedia(query) {
    const heroSection = document.getElementById('heroSection');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');

    heroSection.style.display = 'none';
    sectionsContainer.style.display = 'none';
    liveTvContainer.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const grid = document.getElementById('searchGrid');
    titleEl.textContent = `Resultados para "${query}"`;
    grid.innerHTML = '<p style="color:#888; grid-column:1/-1;">Pesquisando no catálogo...</p>';

    const results = await API.search(query);
    grid.innerHTML = '';

    if (results.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1; padding:40px 0;">Nenhum título encontrado com este termo.</p>';
      return;
    }

    results.forEach(item => {
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '';

      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${item.poster_path}" alt="${title}" loading="lazy" />
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${mediaType === 'movie' ? 'Filme' : 'Série'}</span>
            <span class="card-rating">★ ${rating}</span>
          </div>
        </div>
      `;
      card.onclick = () => this.openMediaDetails(mediaType, item.id);
      grid.appendChild(card);
    });
  }

  setupModals() {
    // Fechar Detalhes
    document.getElementById('detailsCloseBtn').onclick = () => {
      document.getElementById('detailsModal').classList.remove('open');
      document.getElementById('modalSourcesBox').style.display = 'none';
    };

    // Fechar Perfis
    document.getElementById('profileCloseBtn').onclick = () => {
      document.getElementById('profileModal').classList.remove('open');
    };

    // Criar perfil
    document.getElementById('createNewProfileBtn').onclick = async () => {
      const name = prompt('Digite o nome do novo perfil:');
      if (name && name.trim()) {
        const avatars = ['🦊', '🐉', '🤖', '🎮', '⚡', '👑', '🎬', '🍿', '🚀', '🔥'];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
        const created = await API.createProfile(name.trim(), randomAvatar);
        if (created?.profile) {
          this.profiles.push(created.profile);
          this.openProfileModal();
        }
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new HomeFlixApp();
});
