class HomeFlixPlayer {
  constructor() {
    this.overlay = document.getElementById('playerOverlay');
    this.video = document.getElementById('videoPlayer');
    this.titleDisplay = document.getElementById('playerTitle');
    this.subtitleDisplay = document.getElementById('playerSubtitle');
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

    // Elementos de Legendas Externas PT-BR
    this.subtitlesBtn = document.getElementById('playerSubtitlesBtn');
    this.subtitlesMenu = document.getElementById('playerSubtitlesMenu');
    this.subtitlesCloseBtn = document.getElementById('playerSubtitlesCloseBtn');
    this.subtitlesTrackList = document.getElementById('playerSubtitlesTrackList');
    this.availableSubtitles = [];
    this.activeSubtitleId = 'off';

    // Elementos de TV ao Vivo & Zapping
    this.prevChannelBtn = document.getElementById('playerPrevChannelBtn');
    this.nextChannelBtn = document.getElementById('playerNextChannelBtn');
    this.guideBtn = document.getElementById('playerChannelGuideBtn');
    this.guideBtnTop = document.getElementById('playerToggleSidebarBtnTop');
    this.sidebar = document.getElementById('playerChannelsSidebar');
    this.sidebarCloseBtn = document.getElementById('playerSidebarCloseBtn');
    this.sidebarOpenTab = document.getElementById('playerSidebarOpenTab');
    this.sidebarChannelsList = document.getElementById('playerSidebarChannelsList');
    this.sidebarCategories = document.getElementById('playerSidebarCategories');
    this.sidebarSearch = document.getElementById('sidebarChannelSearch');

    // EPG OSD Banner & Indicador Numérico
    this.liveOsd = document.getElementById('playerLiveOsd');
    this.osdLogoWrap = document.getElementById('liveOsdLogoWrap');
    this.osdChannelBadge = document.getElementById('liveOsdChannelBadge');
    this.osdChannelName = document.getElementById('liveOsdChannelName');
    this.osdShowTitle = document.getElementById('liveOsdShowTitle');
    this.osdShowDesc = document.getElementById('liveOsdShowDesc');
    this.osdTimeRange = document.getElementById('liveOsdTimeRange');
    this.osdProgressBar = document.getElementById('liveOsdProgressBar');
    this.osdNextShow = document.getElementById('liveOsdNextShow');

    this.numberIndicator = document.getElementById('playerChannelNumberIndicator');
    this.numberValue = document.getElementById('playerChannelNumberValue');

    this.hls = null;
    this.heartbeatTimer = null;
    this.hideControlsTimer = null;
    this.cinemaWarningTimer = null;
    this.osdTimer = null;
    this.numberInputTimer = null;
    this.currentDigits = '';

    this.currentMedia = null;
    this.sources = [];
    this.failedUrls = new Set();
    this.stallWatchdogTimer = null;
    this.noticeTimer = null;
    this.isLive = false;
    this.liveChannels = [];
    this.currentChannelIndex = 0;
    this.activeSidebarCategory = 'Todos';

    this.spinner = document.getElementById('playerSpinner');
    this.spinnerText = document.getElementById('playerSpinnerText');

    this.initListeners();
  }

  initListeners() {
    // Play / Pause
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.video.addEventListener('click', (e) => {
      // Se clicou fora dos controles, fecha a sidebar se estiver aberta ou alterna play
      if (this.sidebar.classList.contains('open')) {
        this.toggleSidebar(false);
      } else {
        this.togglePlay();
      }
    });

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
      this.hideSpinner();
    });

    // Eventos de buffer e fluidez visual
    this.video.addEventListener('waiting', () => this.showSpinner('Carregando transmissão...'));
    this.video.addEventListener('seeking', () => this.showSpinner('Buscando ponto do vídeo...'));
    this.video.addEventListener('canplay', () => this.hideSpinner());
    this.video.addEventListener('playing', () => {
      this.hideSpinner();
      this.clearStallWatchdog();
    });
    this.video.addEventListener('error', (e) => this.handleMediaError(e));

    // Seek na barra
    this.progressBar.addEventListener('click', (e) => this.seek(e));

    // Pular 10s
    this.rewindBtn.addEventListener('click', () => {
      if (!this.isLive) {
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
      }
    });
    this.forwardBtn.addEventListener('click', () => {
      if (!this.isLive) {
        this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 10);
      }
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

    // Zapping / Próximo e Anterior
    this.prevChannelBtn.addEventListener('click', () => this.prevLiveChannel());
    this.nextChannelBtn.addEventListener('click', () => this.nextLiveChannel());

    // Sidebar de Canais
    this.guideBtn.addEventListener('click', () => this.toggleSidebar());
    if (this.guideBtnTop) {
      this.guideBtnTop.addEventListener('click', () => this.toggleSidebar());
    }
    this.sidebarCloseBtn.addEventListener('click', () => this.toggleSidebar(false));
    this.sidebarOpenTab.addEventListener('click', () => this.toggleSidebar(true));

    if (this.sidebarSearch) {
      this.sidebarSearch.addEventListener('input', (e) => {
        this.renderSidebarChannels(this.activeSidebarCategory, e.target.value.trim());
      });
    }

    // Seletor de fontes
    this.sourceSelector.addEventListener('change', (e) => {
      const selectedUrl = e.target.value;
      if (selectedUrl) {
        const currentTime = this.video.currentTime;
        this.loadStream(selectedUrl, currentTime);
      }
    });

    // Legendas externas PT-BR
    if (this.subtitlesBtn) {
      this.subtitlesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSubtitlesMenu();
      });
    }
    if (this.subtitlesCloseBtn) {
      this.subtitlesCloseBtn.addEventListener('click', () => {
        this.toggleSubtitlesMenu(false);
      });
    }

    // Teclas de atalho e Controle Remoto de TV
    window.addEventListener('keydown', (e) => {
      if (!this.overlay.classList.contains('open')) return;

      const key = e.key;
      const code = e.code;

      // Se usuário estiver digitando no campo de busca da sidebar
      if (document.activeElement === this.sidebarSearch) {
        if (key === 'Escape') {
          this.toggleSidebar(false);
          this.video.focus();
        }
        return;
      }

      // 1. Play / Pause
      if (key === ' ' || code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      }
      // 2. Fullscreen
      else if (key === 'f' || key === 'F') {
        this.toggleFullscreen();
      }
      // 3. Voltar / Sair
      else if (key === 'Escape' || key === 'Back' || key === 'BrowserBack') {
        if (this.subtitlesMenu && this.subtitlesMenu.style.display !== 'none') {
          this.toggleSubtitlesMenu(false);
        } else if (this.sidebar.classList.contains('open')) {
          this.toggleSidebar(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          this.close();
        }
      }
      // 4. Teclas para Guia de Canais (C, G) na TV ao Vivo
      else if (this.isLive && (key === 'c' || key === 'C' || key === 'g' || key === 'G')) {
        e.preventDefault();
        this.toggleSidebar();
      }
      // 4.1 Teclas para Legendas (L ou C) em VOD / Filmes e Séries
      else if (!this.isLive && (key === 'l' || key === 'L' || key === 'c' || key === 'C')) {
        e.preventDefault();
        this.toggleSubtitlesMenu();
      }
      // 5. Tecla Info (I)
      else if (key === 'i' || key === 'I') {
        e.preventDefault();
        this.triggerLiveOsd(true);
      }
      // 6. Zapping no Teclado / Controle Remoto (Seta Cima e Baixo, PageUp/PageDown, ChannelUp/ChannelDown)
      else if (this.isLive && (key === 'ArrowUp' || key === 'PageUp' || key === 'ChannelUp')) {
        e.preventDefault();
        this.prevLiveChannel();
      }
      else if (this.isLive && (key === 'ArrowDown' || key === 'PageDown' || key === 'ChannelDown')) {
        e.preventDefault();
        this.nextLiveChannel();
      }
      // 7. Navegação VOD ou atalhos laterais
      else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (this.isLive) {
          // Na TV ao vivo, Seta Esquerda abre o Guia de Canais!
          this.toggleSidebar(true);
        } else {
          this.video.currentTime = Math.max(0, this.video.currentTime - 10);
          this.showControlsTemporarily();
        }
      }
      else if (key === 'ArrowRight') {
        e.preventDefault();
        if (this.isLive) {
          // Na TV ao vivo, Seta Direita mostra a sinopse/OSD
          this.triggerLiveOsd(true);
        } else {
          this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 10);
          this.showControlsTemporarily();
        }
      }
      // 8. Entrada Numérica Direta (ex: digitou 105 para canal 105)
      else if (this.isLive && key >= '0' && key <= '9') {
        this.handleDigitInput(key);
      }
      // 9. Volume em filmes (quando não for TV ao vivo)
      else if (!this.isLive && key === 'ArrowUp') {
        e.preventDefault();
        this.video.volume = Math.min(1, this.video.volume + 0.1);
        this.showControlsTemporarily();
      }
      else if (!this.isLive && key === 'ArrowDown') {
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
        this.showControlsTemporarily();
      }
      // 10. Mudo (M)
      else if (key === 'm' || key === 'M') {
        this.video.muted = !this.video.muted;
        this.volumeBtn.innerHTML = this.video.muted ? '🔇' : '🔊';
      }
    });

    // Auto-hide controls ao mexer o mouse
    this.overlay.addEventListener('mousemove', () => {
      this.resetControlsTimeout();
    });
  }

  play(options) {
    /**
     * options = {
     *   mediaId, mediaType, title, poster, backdrop,
     *   season, episode, episodeTitle, nextEpisode,
     *   initialTime, isLive, streams, currentStreamUrl,
     *   channel, liveChannels
     * }
     */
    this.currentMedia = options;
    this.isLive = !!options.isLive;
    this.sources = options.streams || [];
    this.liveChannels = options.liveChannels || window.app?.channels || [];

    // Ajusta título e subtítulo
    this.titleDisplay.textContent = options.title;
    if (options.episodeTitle) {
      this.subtitleDisplay.textContent = options.episodeTitle;
      this.subtitleDisplay.style.display = 'block';
    } else {
      this.subtitleDisplay.style.display = 'none';
    }

    this.overlay.classList.add('open');

    // Configura elementos exclusivos de TV ao Vivo vs VOD
    if (this.isLive) {
      this.prevChannelBtn.style.display = 'flex';
      this.nextChannelBtn.style.display = 'flex';
      this.guideBtn.style.display = 'inline-flex';
      if (this.guideBtnTop) this.guideBtnTop.style.display = 'inline-flex';
      this.sidebarOpenTab.style.display = 'flex';
      this.rewindBtn.style.display = 'none';
      this.forwardBtn.style.display = 'none';
      this.progressBar.style.display = 'none';
      this.timeDisplay.textContent = 'AO VIVO';
      if (this.subtitlesBtn) this.subtitlesBtn.style.display = 'none';
      if (this.subtitlesMenu) this.subtitlesMenu.style.display = 'none';

      // Identifica índice do canal atual
      if (options.channel) {
        this.currentChannelIndex = this.liveChannels.findIndex(c => String(c.id) === String(options.channel.id));
        if (this.currentChannelIndex < 0) this.currentChannelIndex = 0;
      }

      this.initSidebarCategories();
      this.renderSidebarChannels(this.activeSidebarCategory);
      this.triggerLiveOsd(true, options.channel);
    } else {
      this.prevChannelBtn.style.display = 'none';
      this.nextChannelBtn.style.display = 'none';
      this.guideBtn.style.display = 'none';
      if (this.guideBtnTop) this.guideBtnTop.style.display = 'none';
      this.sidebarOpenTab.style.display = 'none';
      this.sidebar.classList.remove('open');
      this.rewindBtn.style.display = 'flex';
      this.forwardBtn.style.display = 'flex';
      this.progressBar.style.display = 'block';
      this.liveOsd.classList.remove('show');
      if (this.subtitlesBtn) this.subtitlesBtn.style.display = 'inline-flex';
      if (this.subtitlesMenu) this.subtitlesMenu.style.display = 'none';

      // Busca e disponibiliza legendas externas PT-BR
      this.fetchSubtitles(options.mediaType, options.mediaId, options.season, options.episode);
    }

    // Aviso de imagem de cinema (CAM) desativado para interface limpa
    if (this.cinemaWarning) {
      this.cinemaWarning.style.display = 'none';
    }

    // Popula seletor de fontes
    this.sourceSelector.innerHTML = '';
    const hevcSupported = this.isHevcSupported();
    if (this.sources.length > 0) {
      this.sourceSelector.style.display = 'block';
      this.sources.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.url;
        let suffix = '';
        if (!hevcSupported && s.quality && s.quality.includes('4K')) {
          suffix = ' ⚠️ (Requer TV/HEVC)';
        }
        opt.textContent = `${s.quality || 'HD'} • ${s.audio || 'Áudio Principal'}${suffix}`;
        if (s.url === options.currentStreamUrl) opt.selected = true;
        this.sourceSelector.appendChild(opt);
      });
    } else {
      this.sourceSelector.style.display = 'none';
    }

    this.failedUrls.clear();
    const startUrl = options.currentStreamUrl || (this.sources[0] ? this.sources[0].url : null);
    if (!startUrl) {
      this.showErrorScreen('Nenhuma transmissão disponível no momento para este título.');
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

  showSpinner(text = 'Carregando...') {
    if (this.spinner) {
      const circle = this.spinner.querySelector('.spinner-circle');
      if (circle) circle.style.display = 'block';
      if (this.spinnerText) this.spinnerText.textContent = text;
      const backBtn = this.spinner.querySelector('.player-error-back-btn');
      if (backBtn) backBtn.remove();
      this.spinner.style.display = 'flex';
    }
  }

  hideSpinner() {
    if (this.spinner) {
      this.spinner.style.display = 'none';
    }
  }

  showErrorScreen(msg = 'Transmissão indisponível no momento.') {
    if (this.spinner) {
      const circle = this.spinner.querySelector('.spinner-circle');
      if (circle) circle.style.display = 'none';
      if (this.spinnerText) this.spinnerText.textContent = msg;
      let backBtn = this.spinner.querySelector('.player-error-back-btn');
      if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.className = 'player-error-back-btn';
        backBtn.textContent = 'Voltar ao Catálogo';
        backBtn.style.cssText = 'margin-top: 16px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 8px 22px; border-radius: 6px; cursor: pointer; font-size: 14px;';
        backBtn.onclick = () => this.close();
        this.spinner.appendChild(backBtn);
      }
      this.spinner.style.display = 'flex';
    }
  }

  showNotice(msg, duration = 6000) {
    // Desativado: nenhum banner intrusivo ou poluição visual na tela
    const notice = document.getElementById('playerCodecNotice');
    if (notice) notice.remove();
  }

  startStallWatchdog(url, resumeTime = 0) {
    this.clearStallWatchdog();
    // Se após 8 segundos o vídeo não começar e não tiver dados, tenta rota alternativa silenciosamente
    this.stallWatchdogTimer = setTimeout(() => {
      if (this.video && this.video.readyState < 2 && !this.video.paused) {
        this.handleMediaError({ reason: 'Watchdog Timeout' }, url, resumeTime);
      }
    }, 8000);
  }

  clearStallWatchdog() {
    if (this.stallWatchdogTimer) {
      clearTimeout(this.stallWatchdogTimer);
      this.stallWatchdogTimer = null;
    }
  }

  handleMediaError(e, failedUrl = null, resumeTime = 0) {
    const rawUrl = failedUrl || (this.video ? this.video.src : '') || '';
    let originalUrl = rawUrl;
    if (rawUrl.includes('/api/proxy/stream')) {
      try {
        const parsed = new URL(rawUrl, window.location.origin);
        originalUrl = parsed.searchParams.get('url') || rawUrl;
      } catch (_) {}
    }
    this.clearStallWatchdog();

    // 1. Se for URL remota direta de vídeo MP4 e ainda não passou pelo proxy local (e não for FrostStream que já usa proxy), tenta proxy silenciosamente
    if (rawUrl && !rawUrl.includes('/api/proxy/stream') && !rawUrl.includes('.m3u8') && !rawUrl.includes('/api/live/stream/')) {
      const proxiedUrl = `/api/proxy/stream?url=${encodeURIComponent(rawUrl)}`;
      this.showSpinner('Conectando ao stream...');
      this.loadStream(proxiedUrl, resumeTime || (this.video ? this.video.currentTime : 0) || 0);
      return;
    }

    // 2. Se o proxy também falhou ou o stream é inválido, marca AMBAS as URLs como falha para não re-tentar
    this.failedUrls.add(rawUrl);
    this.failedUrls.add(originalUrl);
    this.tryNextSource(resumeTime || (this.video ? this.video.currentTime : 0) || 0, 'Servidor indisponível');
  }

  tryNextSource(resumeTime = 0, reason = '') {
    const hevcSupported = this.isHevcSupported();
    const nextSource = this.sources.find(s => 
      !this.failedUrls.has(s.url) && 
      (!s.quality.includes('4K') || hevcSupported)
    );

    if (nextSource) {
      this.showSpinner('Conectando ao stream...');
      this.sourceSelector.value = nextSource.url;
      this.loadStream(nextSource.url, resumeTime);
    } else {
      this.showErrorScreen('Transmissão temporariamente indisponível neste servidor.');
    }
  }

  loadStream(url, resumeTime = 0) {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    // Se for URL do FrostStream que requer User-Agent do Stremio, roteia diretamente pelo proxy local
    let targetStreamUrl = url;
    if (url && url.includes('froststream.cloutteam.com') && !url.includes('/api/proxy/stream')) {
      console.log('[Player] FrostStream detectado: roteando diretamente via proxy Stremio local.');
      targetStreamUrl = `/api/proxy/stream?url=${encodeURIComponent(url)}`;
    }

    this.showSpinner('Conectando ao stream...');
    this.startStallWatchdog(targetStreamUrl, resumeTime);

    const isHls = targetStreamUrl.includes('.m3u8') || targetStreamUrl.includes('pluto.tv') || targetStreamUrl.includes('/api/live/stream/');

    if (isHls && window.Hls && Hls.isSupported()) {
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 45,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 5,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 5,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6
      });

      this.hls.loadSource(targetStreamUrl);
      this.hls.attachMedia(this.video);
      
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (resumeTime > 0 && !this.isLive) {
          this.video.currentTime = resumeTime;
        }
        const p = this.video.play();
        if (p !== undefined) {
          p.then(() => {
            this.hideSpinner();
            this.clearStallWatchdog();
          }).catch(e => {
            console.log('Autoplay bloqueado pelo navegador, aguardando clique do usuário:', e);
            this.playBtn.innerHTML = '▶';
            this.hideSpinner();
          });
        }
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Falha de rede temporária, recuperando conexão...', data);
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Erro de decodificação de mídia, tentando recuperar áudio/vídeo...', data);
              this.hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Erro crítico não recuperável', data);
              this.hls.destroy();
              this.failedUrls.add(url);
              this.failedUrls.add(targetStreamUrl);
              this.tryNextSource(resumeTime, 'Falha fatal na transmissão');
              break;
          }
        }
      });
    } else {
      // Vídeo direto MP4 ou Safari nativo
      this.video.src = targetStreamUrl;

      this.video.onloadedmetadata = () => {
        // Se a resolução for 0x0, o navegador leu o container MP4 mas não decodifica o codec (ex: 4K HEVC no Chrome)
        if (!this.isLive && this.video.videoWidth === 0 && this.video.videoHeight === 0) {
          console.warn('[Player] Dimensões 0x0 detectadas (codec HEVC não suportado). Alternando...');
          this.failedUrls.add(url);
          this.failedUrls.add(targetStreamUrl);
          this.tryNextSource(resumeTime, 'Stream 4K HEVC incompatível');
          return;
        }

        if (resumeTime > 0 && !this.isLive) {
          this.video.currentTime = resumeTime;
        }

        const p = this.video.play();
        if (p !== undefined) {
          p.then(() => {
            this.hideSpinner();
            this.clearStallWatchdog();
          }).catch(e => {
            this.playBtn.innerHTML = '▶';
            this.hideSpinner();
          });
        }
      };
    }
  }

  /* ================================================================
     CONTROLE DE TV AO VIVO (SIDEBAR ESTILO KODI/PLUTO E ZAPPING)
     ================================================================ */

  initSidebarCategories() {
    const cats = ['Todos', 'Filmes e Séries', 'Notícias & Jornalismo', 'Animes & Infantil', 'Variedades & Comédia', 'Esportes & Lutas', 'Documentários & Ciência', 'Música & Cultura'];
    this.sidebarCategories.innerHTML = '';
    cats.forEach(c => {
      const pill = document.createElement('span');
      pill.className = `sidebar-cat-pill ${c === this.activeSidebarCategory ? 'active' : ''}`;
      pill.textContent = c;
      pill.onclick = () => {
        this.activeSidebarCategory = c;
        this.sidebarCategories.querySelectorAll('.sidebar-cat-pill').forEach(p => p.classList.toggle('active', p.textContent === c));
        this.renderSidebarChannels(c, this.sidebarSearch?.value?.trim() || '');
      };
      this.sidebarCategories.appendChild(pill);
    });
  }

  renderSidebarChannels(category = 'Todos', search = '') {
    if (!this.sidebarChannelsList) return;
    this.sidebarChannelsList.innerHTML = '';

    const list = this.liveChannels.filter(ch => {
      const matchesCat = category === 'Todos' || ch.category === category;
      const matchesSearch = !search || 
        ch.name.toLowerCase().includes(search.toLowerCase()) || 
        String(ch.number).includes(search) || 
        (ch.current_show && ch.current_show.toLowerCase().includes(search.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    if (list.length === 0) {
      this.sidebarChannelsList.innerHTML = '<div style="color:#888; padding:30px 16px; text-align:center;">Nenhum canal encontrado.</div>';
      return;
    }

    const currentCh = this.liveChannels[this.currentChannelIndex];

    list.forEach(ch => {
      const isActive = currentCh && String(ch.id) === String(currentCh.id);
      const row = document.createElement('div');
      row.className = `sidebar-channel-item ${isActive ? 'active' : ''}`;

      const logoHtml = ch.logo
        ? `<img class="sb-ch-logo" src="${ch.logo}" alt="${ch.name}" loading="lazy" />`
        : `<span style="font-weight:800; font-size:12px; color:#fff;">${ch.name.substring(0, 10)}</span>`;

      row.innerHTML = `
        <div class="sb-ch-left">
          <span class="sb-ch-num">${ch.number || ''}</span>
          <div class="sb-ch-logo-wrap">${logoHtml}</div>
        </div>
        <div class="sb-ch-info">
          <div class="sb-ch-name">${ch.name}</div>
          <div class="sb-ch-now">▶ ${ch.current_show || 'Transmissão Ao Vivo'}</div>
          <div class="sb-ch-progress-track">
            <div class="sb-ch-progress-bar" style="width: ${ch.progress_pct || 40}%;"></div>
          </div>
        </div>
        ${isActive ? '<span class="sb-ch-playing-dot"></span>' : ''}
      `;

      row.onclick = () => {
        this.switchLiveChannel(ch);
      };

      this.sidebarChannelsList.appendChild(row);

      // Auto-scroll para manter o canal ativo visível
      if (isActive) {
        setTimeout(() => {
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 100);
      }
    });
  }

  toggleSidebar(forceState = null) {
    if (!this.isLive) return;
    const shouldOpen = forceState !== null ? forceState : !this.sidebar.classList.contains('open');
    if (shouldOpen) {
      this.sidebar.classList.add('open');
      this.renderSidebarChannels(this.activeSidebarCategory);
    } else {
      this.sidebar.classList.remove('open');
    }
  }

  switchLiveChannel(channelObj) {
    if (!channelObj) return;
    this.currentChannelIndex = this.liveChannels.findIndex(c => String(c.id) === String(channelObj.id));
    if (this.currentChannelIndex < 0) this.currentChannelIndex = 0;

    const ch = this.liveChannels[this.currentChannelIndex] || channelObj;
    this.titleDisplay.textContent = ch.name;
    this.subtitleDisplay.textContent = ch.current_show || 'Ao Vivo';

    this.loadStream(ch.stream_url, 0);
    this.triggerLiveOsd(true, ch);
    this.renderSidebarChannels(this.activeSidebarCategory);
  }

  nextLiveChannel() {
    if (!this.isLive || this.liveChannels.length === 0) return;
    this.currentChannelIndex = (this.currentChannelIndex + 1) % this.liveChannels.length;
    this.switchLiveChannel(this.liveChannels[this.currentChannelIndex]);
  }

  prevLiveChannel() {
    if (!this.isLive || this.liveChannels.length === 0) return;
    this.currentChannelIndex = (this.currentChannelIndex - 1 + this.liveChannels.length) % this.liveChannels.length;
    this.switchLiveChannel(this.liveChannels[this.currentChannelIndex]);
  }

  handleDigitInput(digit) {
    clearTimeout(this.numberInputTimer);
    this.currentDigits += digit;
    
    if (this.numberIndicator) {
      this.numberValue.textContent = this.currentDigits;
      this.numberIndicator.classList.add('show');
    }

    this.numberInputTimer = setTimeout(() => {
      if (this.numberIndicator) this.numberIndicator.classList.remove('show');
      const targetNum = parseInt(this.currentDigits, 10);
      this.currentDigits = '';

      if (!isNaN(targetNum)) {
        // Encontra canal pelo número exato ou aproximado
        const found = this.liveChannels.find(c => c.number === targetNum);
        if (found) {
          this.switchLiveChannel(found);
        } else {
          console.log(`Canal ${targetNum} não encontrado.`);
        }
      }
    }, 900);
  }

  triggerLiveOsd(force = true, channel = null) {
    if (!this.isLive || !this.liveOsd) return;
    const ch = channel || this.liveChannels[this.currentChannelIndex];
    if (!ch) return;

    clearTimeout(this.osdTimer);

    // Popula banner OSD EPG
    if (ch.logo) {
      this.osdLogoWrap.innerHTML = `<img src="${ch.logo}" alt="${ch.name}" style="max-height: 40px; max-width: 90px; object-fit: contain;" />`;
    } else {
      this.osdLogoWrap.innerHTML = `<span>📡</span>`;
    }

    this.osdChannelBadge.textContent = `CH ${ch.number || ''} • AO VIVO`;
    this.osdChannelName.textContent = ch.name;
    this.osdShowTitle.textContent = ch.current_show || 'Transmissão Ao Vivo';
    this.osdShowDesc.textContent = ch.summary || 'Transmissão em alta definição via satélite digital.';
    this.osdTimeRange.textContent = ch.time_range || 'Ao Vivo';
    this.osdProgressBar.style.width = `${ch.progress_pct || 50}%`;
    this.osdNextShow.textContent = ch.next_show || '';

    this.liveOsd.classList.add('show');

    this.osdTimer = setTimeout(() => {
      this.liveOsd.classList.remove('show');
    }, 4500);
  }

  /* ================================================================
     CONTROLES DE REPRODUÇÃO GERAIS (PLAY, SEEK, PROGRESSO)
     ================================================================ */

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
      document.exitFullscreen().catch(err => console.log(err));
    }
  }

  showControlsTemporarily() {
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) top.style.opacity = '1';
    if (bottom) bottom.style.opacity = '1';
    this.resetControlsTimeout();
  }

  resetControlsTimeout() {
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) top.style.opacity = '1';
    if (bottom) bottom.style.opacity = '1';

    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      // Não esconde se o vídeo estiver pausado ou se a sidebar estiver aberta
      if (!this.video.paused && !this.sidebar.classList.contains('open')) {
        if (top) top.style.opacity = '0';
        if (bottom) bottom.style.opacity = '0';
      }
    }, 3800);
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
    this.sidebar.classList.remove('open');
    if (this.liveOsd) this.liveOsd.classList.remove('show');
    if (this.subtitlesMenu) this.subtitlesMenu.style.display = 'none';
    this.clearSubtitles();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // Atualiza a home e continuar assistindo se disponível
    if (window.app) {
      window.app.loadContinueWatching();
      window.app.loadRecommendations();
    }
  }

  toggleSubtitlesMenu(forceState) {
    if (!this.subtitlesMenu) return;
    const isShowing = this.subtitlesMenu.style.display === 'block';
    const show = forceState !== undefined ? forceState : !isShowing;
    this.subtitlesMenu.style.display = show ? 'block' : 'none';
    if (show) {
      this.showControlsTemporarily();
      const activeItem = this.subtitlesTrackList?.querySelector('.subtitles-track-item.active') ||
                         this.subtitlesTrackList?.querySelector('.subtitles-track-item');
      if (activeItem) activeItem.focus();
    }
  }

  async fetchSubtitles(mediaType, tmdbId, season, episode) {
    if (!tmdbId || this.isLive) return;
    this.availableSubtitles = [];
    this.renderSubtitlesMenu();

    try {
      const url = `/api/subtitles/${mediaType}/${tmdbId}?season=${season || 1}&episode=${episode || 1}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.availableSubtitles = data.subtitles || [];
        this.renderSubtitlesMenu();

        // Se o título não for dublado em português, auto-seleciona a melhor legenda PT-BR
        const isDubbed = this.currentMedia?.streams?.some(s => s.audio && (s.audio.includes('Dublado') || s.audio.includes('Português')));
        if (!isDubbed && this.availableSubtitles.length > 0 && this.activeSubtitleId === 'off') {
          const ptSub = this.availableSubtitles.find(s => s.is_pt);
          if (ptSub) {
            this.selectSubtitle(ptSub.id, false);
          }
        }
      }
    } catch (err) {
      console.warn('[Player] Falha ao carregar legendas externas:', err);
    }
  }

  renderSubtitlesMenu() {
    if (!this.subtitlesTrackList) return;
    this.subtitlesTrackList.innerHTML = '';

    // Opção 1: Desativado
    const offItem = document.createElement('div');
    offItem.className = `subtitles-track-item ${this.activeSubtitleId === 'off' ? 'active' : ''}`;
    offItem.setAttribute('tabindex', '0');
    offItem.innerHTML = `
      <span class="sub-track-indicator">${this.activeSubtitleId === 'off' ? '✓' : ''}</span>
      <span class="sub-track-label">Desativado</span>
    `;
    offItem.addEventListener('click', () => {
      this.selectSubtitle('off');
      this.toggleSubtitlesMenu(false);
    });
    offItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { offItem.click(); }
    });
    this.subtitlesTrackList.appendChild(offItem);

    // Opções: Legendas encontradas
    this.availableSubtitles.forEach(sub => {
      const item = document.createElement('div');
      const isSelected = String(this.activeSubtitleId) === String(sub.id);
      item.className = `subtitles-track-item ${isSelected ? 'active' : ''}`;
      item.setAttribute('tabindex', '0');
      item.innerHTML = `
        <span class="sub-track-indicator">${isSelected ? '✓' : ''}</span>
        <div class="sub-track-info">
          <span class="sub-track-label">${sub.label}</span>
          ${sub.is_pt ? '<span class="sub-track-badge">PT-BR</span>' : ''}
        </div>
      `;
      item.addEventListener('click', () => {
        this.selectSubtitle(String(sub.id));
        this.toggleSubtitlesMenu(false);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { item.click(); }
      });
      this.subtitlesTrackList.appendChild(item);
    });
  }

  selectSubtitle(subId, showToast = true) {
    this.activeSubtitleId = subId;
    this.clearSubtitles();

    if (subId === 'off') {
      if (showToast) this.showToastNotice('💬 Legendas desativadas');
      this.renderSubtitlesMenu();
      if (this.subtitlesBtn) this.subtitlesBtn.classList.remove('active');
      return;
    }

    const sub = this.availableSubtitles.find(s => String(s.id) === String(subId));
    if (!sub) return;

    // Cria elemento <track> com WebVTT PT-BR
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = sub.label;
    track.srclang = sub.lang || 'pt';
    track.src = sub.vtt_url;
    track.default = true;

    this.video.appendChild(track);

    track.addEventListener('load', () => {
      if (track.track) {
        track.track.mode = 'showing';
      }
    });

    setTimeout(() => {
      for (let i = 0; i < this.video.textTracks.length; i++) {
        this.video.textTracks[i].mode = 'showing';
      }
    }, 80);

    if (this.subtitlesBtn) this.subtitlesBtn.classList.add('active');
    if (showToast) this.showToastNotice(`💬 Legenda: ${sub.label}`);
    this.renderSubtitlesMenu();
  }

  clearSubtitles() {
    const existingTracks = this.video.querySelectorAll('track');
    existingTracks.forEach(t => t.remove());
    for (let i = 0; i < this.video.textTracks.length; i++) {
      this.video.textTracks[i].mode = 'disabled';
    }
  }
}

