class HomeFlixPlayer {
  constructor() {
    this.overlay = document.getElementById('playerOverlay');
    this.video = document.getElementById('videoPlayer');
    this.titleDisplay = document.getElementById('playerTitle');
    this.playBtn = document.getElementById('playPauseBtn');
    this.progressBar = document.getElementById('playerProgressBar');
    this.progressFill = document.getElementById('playerProgressCurrent');
    this.timeDisplay = document.getElementById('playerTimeDisplay');
    this.volumeBtn = document.getElementById('playerVolumeBtn');
    this.fullscreenBtn = document.getElementById('playerFullscreenBtn');
    this.backBtn = document.getElementById('playerBackBtn');
    this.rewindBtn = document.getElementById('playerRewindBtn');
    this.forwardBtn = document.getElementById('playerForwardBtn');
    this.sourceSelector = document.getElementById('playerSourceSelect');
    this.cinemaWarning = document.getElementById('playerCinemaWarning');

    this.hls = null;
    this.heartbeatTimer = null;
    this.hideControlsTimer = null;
    this.cinemaWarningTimer = null;
    this.currentMedia = null;
    this.sources = [];
    this.isLive = false;

    this.initListeners();
  }

  initListeners() {
    // Play / Pause
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', () => this.togglePlay());

    // Atualização de tempo e progresso
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('play', () => {
      this.playBtn.innerHTML = '⏸';
      this.startHeartbeat();
    });
    this.video.addEventListener('pause', () => {
      this.playBtn.innerHTML = '▶';
      this.stopHeartbeat();
      this.syncProgress();
    });

    // Seek na barra
    this.progressBar.addEventListener('click', (e) => this.seek(e));

    // Pular 10s
    this.rewindBtn.addEventListener('click', () => {
      this.video.currentTime = Math.max(0, this.video.currentTime - 10);
    });
    this.forwardBtn.addEventListener('click', () => {
      this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 10);
    });

    // Volume / Mudo
    this.volumeBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.volumeBtn.innerHTML = this.video.muted ? '🔇' : '🔊';
    });

    // Fullscreen
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

    // Voltar / Fechar
    this.backBtn.addEventListener('click', () => this.close());

    // Seletor de fontes
    this.sourceSelector.addEventListener('change', (e) => {
      const selectedUrl = e.target.value;
      if (selectedUrl) {
        const currentTime = this.video.currentTime;
        this.loadStream(selectedUrl, currentTime);
      }
    });

    // Teclas de atalho (Espaço para Play/Pause, F para Fullscreen, Esc para sair)
    window.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('open')) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          this.close();
        }
      } else if (e.key === 'ArrowLeft') {
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
      } else if (e.key === 'ArrowRight') {
        this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 10);
      }
    });

    // Auto-hide controls
    this.overlay.addEventListener('mousemove', () => this.resetControlsTimeout());
  }

  play(options) {
    /**
     * options = {
     *   mediaId, mediaType, title, poster, backdrop,
     *   season, episode, episodeTitle,
     *   initialTime, isLive, streams, currentStreamUrl
     * }
     */
    this.currentMedia = options;
    this.isLive = !!options.isLive;
    this.sources = options.streams || [];

    this.titleDisplay.textContent = options.title + (options.episodeTitle ? ` - ${options.episodeTitle}` : '');
    this.overlay.classList.add('open');

    // Aviso de imagem de cinema (CAM)
    if (this.cinemaWarning) {
      if (options.isCinema) {
        this.cinemaWarning.style.display = 'flex';
        this.cinemaWarning.style.opacity = '1';
        clearTimeout(this.cinemaWarningTimer);
        this.cinemaWarningTimer = setTimeout(() => {
          this.cinemaWarning.style.opacity = '0';
          setTimeout(() => { if (this.cinemaWarning) this.cinemaWarning.style.display = 'none'; }, 500);
        }, 8000);
      } else {
        this.cinemaWarning.style.display = 'none';
      }
    }

    // Popula seletor de qualidade/fontes
    this.sourceSelector.innerHTML = '';
    const hevcSupported = this.isHevcSupported();
    if (this.sources.length > 0) {
      this.sourceSelector.style.display = 'block';
      this.sources.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.url;
        let suffix = '';
        if (!hevcSupported && s.quality && s.quality.includes('4K')) {
          suffix = ' ⚠️ (Requer TV/Win)';
        }
        opt.textContent = `${s.quality} • ${s.audio}${suffix}`;
        if (s.url === options.currentStreamUrl) opt.selected = true;
        this.sourceSelector.appendChild(opt);
      });
    } else {
      this.sourceSelector.style.display = 'none';
    }

    const startUrl = options.currentStreamUrl || (this.sources[0] ? this.sources[0].url : null);
    if (!startUrl) {
      alert('Nenhuma fonte de vídeo disponível.');
      this.close();
      return;
    }

    this.loadStream(startUrl, options.initialTime || 0);
  }

  isHevcSupported() {
    if (this._hevcSupported !== undefined) return this._hevcSupported;
    const testEl = document.createElement('video');
    const hevc1 = testEl.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"');
    const hevc2 = testEl.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"');
    this._hevcSupported = (hevc1 === 'probably' || hevc1 === 'maybe' || hevc2 === 'probably' || hevc2 === 'maybe');
    return this._hevcSupported;
  }

  showNotice(msg, duration = 6000) {
    let notice = document.getElementById('playerCodecNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'playerCodecNotice';
      notice.className = 'cinema-warning-banner';
      notice.style.background = 'rgba(20, 20, 20, 0.95)';
      notice.style.border = '1px solid #e50914';
      notice.style.top = '130px';
      this.overlay.appendChild(notice);
    }
    notice.innerHTML = `<span>⚡</span><span>${msg}</span>`;
    notice.style.display = 'flex';
    notice.style.opacity = '1';
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => {
      notice.style.opacity = '0';
      setTimeout(() => { if (notice) notice.style.display = 'none'; }, 500);
    }, duration);
  }

  loadStream(url, resumeTime = 0) {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const isHls = url.includes('.m3u8') || url.includes('pluto.tv');

    if (isHls && window.Hls && Hls.isSupported()) {
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3
      });
      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (resumeTime > 0 && !this.isLive) {
          this.video.currentTime = resumeTime;
        }
        const p = this.video.play();
        if (p !== undefined) {
          p.catch(e => {
            console.log('Autoplay blocked, user interaction required:', e);
            this.playBtn.innerHTML = '▶';
          });
        }
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error, tentando recuperar...', data);
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media error, tentando recuperar...', data);
              this.hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Erro fatal não recuperável', data);
              this.hls.destroy();
              break;
          }
        }
      });
    } else {
      // Direct MP4 ou Safari nativo HLS
      this.video.src = url;

      this.video.onerror = () => {
        console.warn('[Player] Erro de mídia ao reproduzir stream:', this.video.error);
        const fallback = this.sources.find(s => s.url !== url && (!s.quality.includes('4K') || this.isHevcSupported()));
        if (fallback) {
          this.showNotice('⚠️ Erro ao reproduzir stream. Alternando para servidor compatível...');
          this.sourceSelector.value = fallback.url;
          this.loadStream(fallback.url, resumeTime);
        }
      };

      this.video.onloadedmetadata = () => {
        // Se a resolução for 0x0, o navegador leu o container MP4 mas não suporta o codec de vídeo (ex: 4K HEVC no Chrome Linux)
        if (!this.isLive && this.video.videoWidth === 0 && this.video.videoHeight === 0) {
          console.warn('[Player] Dimensões 0x0 detectadas (codec HEVC incompatível com este navegador). Buscando alternativa...');
          const fallback = this.sources.find(s => s.url !== url && (!s.quality.includes('4K') || this.isHevcSupported()));
          if (fallback) {
            this.showNotice('ℹ️ Stream 4K HEVC não suportado neste navegador. Alternando para 1080p Full HD...');
            this.sourceSelector.value = fallback.url;
            this.loadStream(fallback.url, resumeTime);
            return;
          }
        }

        if (resumeTime > 0 && !this.isLive) {
          this.video.currentTime = resumeTime;
        }
        const p = this.video.play();
        if (p !== undefined) {
          p.catch(e => {
            console.log('Autoplay blocked:', e);
            this.playBtn.innerHTML = '▶';
          });
        }
      };
    }
  }

  togglePlay() {
    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  seek(e) {
    if (this.isLive) return;
    const rect = this.progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.video.currentTime = pos * this.video.duration;
  }

  onTimeUpdate() {
    if (this.isLive) {
      this.timeDisplay.textContent = 'AO VIVO';
      this.progressFill.style.width = '100%';
      return;
    }

    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    if (duration > 0) {
      const pct = (current / duration) * 100;
      this.progressFill.style.width = `${pct}%`;
    }

    this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    if (this.isLive) return;
    this.heartbeatTimer = setInterval(() => this.syncProgress(), 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  syncProgress() {
    if (this.isLive || !this.currentMedia || !window.currentProfile) return;
    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    if (current > 10 && duration > 0) {
      API.saveProgress({
        profile_id: window.currentProfile.id,
        media_id: String(this.currentMedia.mediaId),
        media_type: this.currentMedia.mediaType,
        title: this.currentMedia.title,
        poster_path: this.currentMedia.poster,
        backdrop_path: this.currentMedia.backdrop,
        position: current,
        duration: duration,
        season_number: this.currentMedia.season || 1,
        episode_number: this.currentMedia.episode || 1,
        episode_title: this.currentMedia.episodeTitle || null
      });
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.overlay.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  }

  resetControlsTimeout() {
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) top.style.opacity = '1';
    if (bottom) bottom.style.opacity = '1';

    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      if (!this.video.paused) {
        if (top) top.style.opacity = '0';
        if (bottom) bottom.style.opacity = '0';
      }
    }, 3500);
  }

  close() {
    this.syncProgress();
    this.stopHeartbeat();
    this.video.pause();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.src = '';
    this.overlay.classList.remove('open');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    // Atualiza a home e continuar assistindo se disponível
    if (window.app) {
      window.app.loadContinueWatching();
    }
  }
}
