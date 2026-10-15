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

    // Elementos de Pular Abertura & Próximo Episódio (Séries)
    this.skipIntroBtn = document.getElementById('playerSkipIntroBtn');
    this.nextEpCard = document.getElementById('playerNextEpisodeCard');
    this.nextEpCountdownEl = document.getElementById('nextEpCountdown');
    this.nextEpTitleEl = document.getElementById('nextEpTitle');
    this.nextEpPlayNowBtn = document.getElementById('nextEpPlayNowBtn');
    this.nextEpCancelBtn = document.getElementById('nextEpCancelBtn');
    this.nextEpDismissed = false;
    this._autoPlayTriggered = false;

    // Elementos de Auto-Failover de Fontes
    this.failoverBadge = document.getElementById('playerFailoverBadge');
    this.failoverText = document.getElementById('playerFailoverText');
    this.failoverTimer = null;

    // Tela de Carregamento Clean (estilo Netflix)
    this.loadingScreen = document.getElementById('playerLoadingScreen');
    this.loadingBackdrop = document.getElementById('playerLoadingBackdrop');
    this.loadingPctEl = document.getElementById('playerLoadingPct');
    this.loadingActive = false;
    this.loadingPct = 0;
    this.loadingTarget = 0;
    this.loadingTimer = null;

    // Controles centrais (touch), feedback de play/pause, ripples de seek e tela de pausa
    this.centerControls = document.getElementById('playerCenterControls');
    this.centerPlayBtn = document.getElementById('playerCenterPlayBtn');
    this.centerRewindBtn = document.getElementById('playerCenterRewindBtn');
    this.centerForwardBtn = document.getElementById('playerCenterForwardBtn');
    this.centerFlash = document.getElementById('playerCenterFlash');
    this.seekRippleLeft = document.getElementById('playerSeekRippleLeft');
    this.seekRippleRight = document.getElementById('playerSeekRippleRight');
    this.seekAccum = { left: 0, right: 0 };
    this.seekRippleTimers = { left: null, right: null };
    this.pauseScreen = document.getElementById('playerPauseScreen');
    this.pauseScreenTitle = document.getElementById('pauseScreenTitle');
    this.pauseScreenMeta = document.getElementById('pauseScreenMeta');
    this.pauseScreenOverview = document.getElementById('pauseScreenOverview');
    this.pauseScreenTimer = null;
    this.progressBuffered = document.getElementById('playerProgressBuffered');
    this.progressTooltip = document.getElementById('playerProgressTooltip');
    this.previewCard = document.getElementById('playerPreviewCard');
    this.previewVideo = document.getElementById('playerPreviewVideo');
    this.previewFallback = document.getElementById('playerPreviewFallback');
    this.previewTime = document.getElementById('playerPreviewTime');
    this.previewDebounceTimer = null;
    this.isScrubbing = false;

    this.initListeners();
  }

  initListeners() {
    // Play / Pause
    this.playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePlay();
    });

    // Manipulador unificado de toque/clique para alternar HUD
    const togglePlayerHud = () => {
      if (this.sidebar && this.sidebar.classList.contains('open')) {
        this.toggleSidebar(false);
        return;
      }
      if (this.subtitlesMenu && this.subtitlesMenu.style.display !== 'none') {
        this.toggleSubtitlesMenu(false);
        return;
      }
      if (this.overlay.classList.contains('pause-idle')) {
        this.wakeHud();
        return;
      }
      if (this.overlay.classList.contains('hud-hidden')) {
        this.wakeHud();
      } else {
        this.hideHud();
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTouchHandledTime = 0;
    let lastTapTime = 0;
    let lastTapSide = null;
    let hudHiddenBeforeTap = false;
    let seekStreak = false;

    // Rastreia início do toque na tela
    this.overlay.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    // Toque simples: alterna HUD na hora. Toque duplo nas laterais: ±10s (estilo app Netflix)
    this.overlay.addEventListener('touchend', (e) => {
      if (!this.overlay.classList.contains('open')) return;
      const touchDuration = Date.now() - touchStartTime;
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return;

      const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
      if (touchDuration >= 400 || dist >= 20) return;

      const isInteractive = e.target.closest(
        'button, a, input, select, .player-progress-bar, .player-channels-sidebar, .player-subtitles-menu, .player-next-ep-card, .player-error-back-btn'
      );
      if (isInteractive) return;

      e.preventDefault();
      const now = Date.now();
      lastTouchHandledTime = now;

      const width = this.overlay.clientWidth || window.innerWidth;
      const side = touch.clientX < width * 0.35 ? 'left' : (touch.clientX > width * 0.65 ? 'right' : 'center');
      const canSeek = !this.isLive && !this.loadingActive && side !== 'center';

      if (canSeek && side === lastTapSide && (now - lastTapTime) < 320) {
        // Toque duplo (ou sequência): desfaz o toggle do primeiro toque e avança/retrocede
        if (!seekStreak) {
          if (hudHiddenBeforeTap) this.hideHud(); else this.wakeHud();
        }
        seekStreak = true;
        lastTapTime = now;
        this.seekBy(side === 'left' ? -10 : 10, true);
        return;
      }

      seekStreak = false;
      hudHiddenBeforeTap = this.overlay.classList.contains('hud-hidden');
      lastTapTime = now;
      lastTapSide = side;
      togglePlayerHud();
    }, { passive: false });

    // Clique do mouse em desktop: pausa/despausa como na Netflix (ignora clique sintético após toque)
    this.video.addEventListener('click', (e) => {
      if (Date.now() - lastTouchHandledTime < 500) {
        return;
      }
      if (this.loadingActive) return;
      if ((this.sidebar && this.sidebar.classList.contains('open')) ||
          (this.subtitlesMenu && this.subtitlesMenu.style.display !== 'none')) {
        togglePlayerHud();
        return;
      }
      this.togglePlay(true);
      this.wakeHud();
    });

    // Duplo clique no desktop alterna tela cheia (comportamento padrão de players)
    this.video.addEventListener('dblclick', (e) => {
      if (Date.now() - lastTouchHandledTime < 500) return;
      e.preventDefault();
      this.toggleFullscreen();
    });

    // Controles centrais (touch)
    if (this.centerPlayBtn) {
      this.centerPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
        this.wakeHud();
      });
    }
    if (this.centerRewindBtn) {
      this.centerRewindBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seekBy(-10, true);
        this.wakeHud();
      });
    }
    if (this.centerForwardBtn) {
      this.centerForwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seekBy(10, true);
        this.wakeHud();
      });
    }

    // Arrastar a barra de progresso (mouse e toque) com prévia de tempo
    this.initProgressScrubbing();

    // Atualização de tempo e progresso
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('play', () => {
      this.updatePlayPauseIcon(true);
      this.startHeartbeat();
      this.hidePauseScreen();
      this.resetControlsTimeout();
    });
    this.video.addEventListener('pause', () => {
      this.updatePlayPauseIcon(false);
      this.stopHeartbeat();
      this.syncProgress();
      this.hideSpinner();
      this.wakeHud();
    });

    // Eventos de buffer e fluidez visual (spinner limpo, sem textos)
    this.video.addEventListener('waiting', () => this.showSpinner());
    this.video.addEventListener('seeking', () => this.showSpinner());
    this.video.addEventListener('seeked', () => {
      if (this.video.readyState >= 3) this.hideSpinner();
    });
    this.video.addEventListener('loadedmetadata', () => this.setLoadingProgress(85));
    this.video.addEventListener('loadeddata', () => this.setLoadingProgress(93));
    this.video.addEventListener('canplay', () => this.hideSpinner());
    this.video.addEventListener('playing', () => {
      this.hideSpinner();
      this.clearStallWatchdog();
      this.finishLoadingScreen();
      this.resetControlsTimeout();
    });
    this.video.addEventListener('progress', () => this.updateBufferedBar());
    this.video.addEventListener('error', (e) => this.handleMediaError(e));

    // Pular 10s
    this.rewindBtn.addEventListener('click', () => this.seekBy(-10, true));
    this.forwardBtn.addEventListener('click', () => this.seekBy(10, true));

    // Pular Abertura (+85s)
    if (this.skipIntroBtn) {
      this.skipIntroBtn.addEventListener('click', () => {
        if (!this.isLive && this.video) {
          this.video.currentTime = Math.min(this.video.duration || 0, this.video.currentTime + 85);
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('⏭️ Abertura pulada (+85s)', 2500);
          }
        }
      });
    }

    // Card de Próximo Episódio
    if (this.nextEpPlayNowBtn) {
      this.nextEpPlayNowBtn.addEventListener('click', () => this.triggerNextEpisode());
    }
    if (this.nextEpCancelBtn) {
      this.nextEpCancelBtn.addEventListener('click', () => this.dismissNextEpisode());
    }

    // Fim da Mídia (Auto-play do próximo episódio)
    this.video.addEventListener('ended', () => {
      if (this.currentMedia && this.currentMedia.mediaType === 'tv' && this.currentMedia.onNextEpisode) {
        this.triggerNextEpisode();
      }
    });

    // Volume / Mudo & Slider
    this.volumeInput = document.getElementById('playerVolumeInput');
    this.volumeBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted;
      this.updateVolumeUi();
    });

    if (this.volumeInput) {
      this.volumeInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.video.volume = val;
        this.video.muted = (val === 0);
        this.updateVolumeUi();
      });
    }

    // Fullscreen
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());

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

      // Qualquer interação no controle remoto acorda o HUD ou reinicia o timer
      const wasHudHidden = this.overlay.classList.contains('hud-hidden');
      this.wakeHud();

      // 1. Play / Pause ou Despertar HUD com Enter / OK / Espaço
      if (key === ' ' || code === 'Space') {
        e.preventDefault();
        this.togglePlay(true);
      }
      else if (key === 'Enter') {
        // Se a sidebar de canais estiver aberta, o Enter seleciona o canal focado
        if (this.sidebar && this.sidebar.classList.contains('open')) {
          const focused = document.activeElement;
          if (focused && focused.classList.contains('sidebar-channel-item')) {
            focused.click();
            return;
          }
        }
        // Se o HUD estava oculto, a tecla Enter no controle apenas desperta o HUD e exibe as informações
        if (wasHudHidden) {
          if (this.isLive) {
            this.triggerLiveOsd(true);
          }
          return;
        }
        this.togglePlay(true);
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
        } else if (!this.overlay.classList.contains('hud-hidden')) {
          // Se o HUD estiver visível, a tecla Voltar primeiro oculta o HUD
          this.hideHud();
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
      // 6. Zapping no Teclado / Controle Remoto (Seta Cima e Baixo)
      else if (this.isLive && (key === 'ArrowUp' || key === 'PageUp' || key === 'ChannelUp')) {
        e.preventDefault();
        if (this.sidebar && this.sidebar.classList.contains('open')) {
          this.navigateSidebarChannels(-1);
        } else {
          this.prevLiveChannel();
        }
      }
      else if (this.isLive && (key === 'ArrowDown' || key === 'PageDown' || key === 'ChannelDown')) {
        e.preventDefault();
        if (this.sidebar && this.sidebar.classList.contains('open')) {
          this.navigateSidebarChannels(1);
        } else {
          this.nextLiveChannel();
        }
      }
      // 7. Navegação Lateral (Seta Esquerda e Direita)
      else if (key === 'ArrowLeft') {
        e.preventDefault();
        if (this.isLive) {
          // Na TV ao vivo, Seta Esquerda abre a gaveta lateral de canais!
          this.toggleSidebar(true);
        } else {
          this.seekBy(-10, true);
        }
      }
      else if (key === 'ArrowRight') {
        e.preventDefault();
        if (this.isLive) {
          if (this.sidebar && this.sidebar.classList.contains('open')) {
            this.toggleSidebar(false);
          } else {
            // Seta Direita na TV ao vivo mostra o guia OSD da atração
            this.triggerLiveOsd(true);
          }
        } else {
          this.seekBy(10, true);
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
      }
      else if (!this.isLive && key === 'ArrowDown') {
        e.preventDefault();
        this.video.volume = Math.max(0, this.video.volume - 0.1);
      }
      // 10. Mudo (M)
      else if (key === 'm' || key === 'M') {
        this.video.muted = !this.video.muted;
        this.updateVolumeUi();
      }
    });

    // Auto-hide controls ao mexer o mouse na tela em desktop
    this.overlay.addEventListener('mousemove', () => this.wakeHud());
    this.overlay.addEventListener('wheel', () => this.wakeHud(), { passive: true });
  }

  preparePlayback(options = {}) {
    this.overlay.style.display = 'flex';
    this.overlay.style.pointerEvents = 'auto';
    this.overlay.style.opacity = '1';
    this.overlay.classList.add('open');
    document.body.classList.add('player-open');
    this.isLive = !!options.isLive;

    // Configura botões exclusivos antes de qualquer exibição de HUD
    if (this.isLive) {
      if (this.prevChannelBtn) this.prevChannelBtn.style.display = 'flex';
      if (this.nextChannelBtn) this.nextChannelBtn.style.display = 'flex';
      if (this.guideBtn) this.guideBtn.style.display = 'inline-flex';
      if (this.guideBtnTop) this.guideBtnTop.style.display = 'inline-flex';
      if (this.sidebarOpenTab) this.sidebarOpenTab.style.display = 'flex';
      if (this.rewindBtn) this.rewindBtn.style.display = 'none';
      if (this.forwardBtn) this.forwardBtn.style.display = 'none';
      if (this.progressBar) this.progressBar.style.display = 'none';
      if (this.timeDisplay) this.timeDisplay.textContent = 'AO VIVO';
    } else {
      if (this.prevChannelBtn) this.prevChannelBtn.style.display = 'none';
      if (this.nextChannelBtn) this.nextChannelBtn.style.display = 'none';
      if (this.guideBtn) this.guideBtn.style.display = 'none';
      if (this.guideBtnTop) this.guideBtnTop.style.display = 'none';
      if (this.sidebarOpenTab) this.sidebarOpenTab.style.display = 'none';
      if (this.sidebar) this.sidebar.classList.remove('open');
      if (this.rewindBtn) this.rewindBtn.style.display = 'flex';
      if (this.forwardBtn) this.forwardBtn.style.display = 'flex';
      if (this.progressBar) this.progressBar.style.display = 'block';
      if (this.timeDisplay) this.timeDisplay.textContent = '00:00 / 00:00';
    }

    // Mantém topo visível (título e botão voltar) e esconde controles inferiores durante o pré-carregamento
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) {
      top.style.opacity = '1';
      top.style.pointerEvents = 'auto';
    }
    if (bottom) {
      bottom.style.opacity = '0';
      bottom.style.pointerEvents = 'none';
    }

    this.enterFullscreenWithOrientation();

    const title = options.title || 'Carregando título...';
    if (this.titleDisplay) this.titleDisplay.textContent = title;
    if (this.subtitleDisplay) {
      if (options.mediaType === 'tv' && options.season && options.episode) {
        this.subtitleDisplay.textContent = `T${options.season} : E${options.episode} ${options.episodeTitle ? `• ${options.episodeTitle}` : ''}`.trim();
        this.subtitleDisplay.style.display = 'block';
      } else {
        this.subtitleDisplay.style.display = 'none';
      }
    }

    this.hidePauseScreen();
    this.startLoadingScreen(options.backdrop);
    this.setLoadingProgress(35);
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

    this.nextEpDismissed = false;
    this._autoPlayTriggered = false;
    this.hideNextEpisodeCard();
    if (this.skipIntroBtn) this.skipIntroBtn.style.display = 'none';
    if (this.failoverBadge) this.failoverBadge.style.display = 'none';

    this.overlay.classList.add('open');
    document.body.classList.add('player-open');

    // Modo Celular / Fullscreen: aciona tela cheia e trava na horizontal automaticamente
    this.enterFullscreenWithOrientation();

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

    // Aviso de imagem de cinema (CAM) quando aplicável
    if (this.cinemaWarning) {
      if (options.isCinema) {
        this.cinemaWarning.style.display = 'block';
        clearTimeout(this.cinemaWarningTimer);
        this.cinemaWarningTimer = setTimeout(() => {
          if (this.cinemaWarning) this.cinemaWarning.style.display = 'none';
        }, 6500);
      } else {
        this.cinemaWarning.style.display = 'none';
      }
    }

    // Popula seletor de fontes (permite alternar manualmente se houver multiplas fontes)
    this.sourceSelector.innerHTML = '';
    if (this.sources.length > 1) {
      this.sourceSelector.style.display = 'inline-block';
      this.sources.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.url;
        opt.textContent = s.label || `${s.quality || 'HD'} • ${s.audio || 'Áudio Principal'} [${s.provider || 'Servidor'}]`;
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

  showSpinner(text = '') {
    // Se a tela inicial de carregamento com anel + % estiver ativa, não sobrepõe com spinner
    if (this.loadingActive) return;
    if (this.spinner) {
      const circle = this.spinner.querySelector('.spinner-circle');
      if (circle) circle.style.display = 'block';
      if (this.spinnerText) {
        this.spinnerText.textContent = text;
        this.spinnerText.style.display = text ? 'block' : 'none';
      }
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
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('active', 'fade-out');
      this.loadingActive = false;
    }
    if (this.spinner) {
      const circle = this.spinner.querySelector('.spinner-circle');
      if (circle) circle.style.display = 'none';
      if (this.spinnerText) {
        this.spinnerText.textContent = msg;
        this.spinnerText.style.display = 'block';
      }
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
    // Se após 6 segundos o vídeo não tiver dados prontos (readyState < 2), alterna de fonte automaticamente
    this.stallWatchdogTimer = setTimeout(() => {
      if (this.video && this.video.readyState < 2) {
        console.warn('[Player Watchdog] Transmissão travada após 6s, alternando servidor...', url);
        if (this.hls) {
          try { this.hls.destroy(); } catch (_) {}
          this.hls = null;
        }
        this.handleMediaError({ reason: 'Watchdog Timeout' }, url, resumeTime);
      }
    }, 6000);
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
    const nextSource = this.sources.find(s => !this.failedUrls.has(s.url));

    if (nextSource) {
      const serverLabel = nextSource.label || nextSource.provider || 'Servidor Reserva';
      this.showFailoverNotice(serverLabel);
      this.showSpinner(`Conectando à fonte alternativa (${nextSource.quality || 'HD'})...`);
      this.sourceSelector.value = nextSource.url;
      this.loadStream(nextSource.url, resumeTime);
    } else {
      this.showErrorScreen('Transmissão temporariamente indisponível neste servidor.');
    }
  }

  showFailoverNotice(serverName) {
    if (!this.failoverBadge) return;
    if (this.failoverText) {
      this.failoverText.textContent = `⚡ Alternando automaticamente para: ${serverName}...`;
    }
    this.failoverBadge.style.display = 'flex';
    clearTimeout(this.failoverTimer);
    this.failoverTimer = setTimeout(() => {
      if (this.failoverBadge) this.failoverBadge.style.display = 'none';
    }, 4500);
  }

  showNextEpisodeCard(remainingSec) {
    if (!this.nextEpCard || this.nextEpDismissed) return;
    if (this.nextEpCard.style.display === 'none' || !this.nextEpCard.style.display) {
      this.nextEpCard.style.display = 'flex';
      if (this.nextEpTitleEl && this.currentMedia) {
        const nextNum = (this.currentMedia.episode || 1) + 1;
        this.nextEpTitleEl.textContent = `Episódio ${nextNum} • ${this.currentMedia.title || ''}`;
      }
    }
    const countdown = Math.min(10, remainingSec);
    if (this.nextEpCountdownEl) {
      this.nextEpCountdownEl.textContent = countdown;
    }
    if (countdown <= 1 && !this._autoPlayTriggered) {
      this._autoPlayTriggered = true;
      setTimeout(() => this.triggerNextEpisode(), 1000);
    }
  }

  hideNextEpisodeCard() {
    if (this.nextEpCard) this.nextEpCard.style.display = 'none';
  }

  dismissNextEpisode() {
    this.nextEpDismissed = true;
    this.hideNextEpisodeCard();
  }

  triggerNextEpisode() {
    if (this.currentMedia && typeof this.currentMedia.onNextEpisode === 'function') {
      const nextFn = this.currentMedia.onNextEpisode;
      this.close();
      nextFn();
    }
  }

  loadStream(url, resumeTime = 0) {
    if (!this.overlay || !this.overlay.classList.contains('open')) {
      return;
    }

    if (this.hls) {
      try { this.hls.destroy(); } catch (_) {}
      this.hls = null;
    }

    // Se for URL do FrostStream que requer User-Agent do Stremio, roteia diretamente pelo proxy local
    let targetStreamUrl = url;
    if (url && url.includes('froststream.cloutteam.com') && !url.includes('/api/proxy/stream')) {
      targetStreamUrl = `/api/proxy/stream?url=${encodeURIComponent(url)}`;
    }

    this.hlsNetworkRetries = 0;
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
        if (!this.overlay || !this.overlay.classList.contains('open')) {
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
          }).catch(() => {
            this.playBtn.innerHTML = '▶';
            this.hideSpinner();
          });
        }
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: {
              this.hlsNetworkRetries = (this.hlsNetworkRetries || 0) + 1;
              const isHttpError = data.response && (data.response.code >= 400);
              if (isHttpError || this.hlsNetworkRetries > 1) {
                console.warn('[HLS] Falha de rede fatal ou status HTTP de erro (404/500), alternando para próxima fonte...', data);
                this.hlsNetworkRetries = 0;
                if (this.hls) {
                  try { this.hls.destroy(); } catch (_) {}
                  this.hls = null;
                }
                this.failedUrls.add(url);
                this.failedUrls.add(targetStreamUrl);
                this.tryNextSource(resumeTime, 'Erro HTTP no stream');
              } else {
                console.warn('[HLS] Falha de rede temporária, tentando reconectar...', data);
                this.hls.startLoad();
              }
              break;
            }
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Erro de decodificação de mídia, tentando recuperar áudio/vídeo...', data);
              this.hls.recoverMediaError();
              break;
            default:
              console.error('[HLS] Erro crítico não recuperável', data);
              if (this.hls) {
                try { this.hls.destroy(); } catch (_) {}
                this.hls = null;
              }
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
        if (!this.overlay || !this.overlay.classList.contains('open')) {
          this.video.pause();
          return;
        }

        // Se a resolução for 0x0, o navegador leu o container MP4 mas não decodifica o codec (ex: 4K HEVC no Chrome)
        if (!this.isLive && this.video.videoWidth === 0 && this.video.videoHeight === 0) {
          this.failedUrls.add(url);
          this.failedUrls.add(targetStreamUrl);
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('ℹ️ O seu navegador não possui suporte nativo para 4K HEVC. Reproduzindo na melhor resolução 1080p Full HD.', 4000);
          }
          this.tryNextSource(resumeTime, 'Stream 4K HEVC incompatível');
          return;
        }

        if (resumeTime > 0 && !this.isLive) {
          this.video.currentTime = resumeTime;
        }

        const p = this.video.play();
        if (p !== undefined) {
          p.then(() => {
            if (!this.overlay || !this.overlay.classList.contains('open')) {
              this.video.pause();
              return;
            }
            this.hideSpinner();
            this.clearStallWatchdog();
          }).catch(() => {
            this.playBtn.innerHTML = '▶';
            this.hideSpinner();
          });
        }
      };

      this.video.onerror = (err) => {
        const mediaError = this.video.error;
        console.warn('[Video Error]', mediaError, targetStreamUrl);
        this.clearStallWatchdog();

        // Código 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (geralmente codec HEVC/4K não suportado no Linux/Chrome)
        const isCodecUnsupported = mediaError && (mediaError.code === 4 || mediaError.code === 3);
        if (isCodecUnsupported && (url.includes('4K') || targetStreamUrl.includes('4K') || targetStreamUrl.includes('141207'))) {
          if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('ℹ️ Navegador sem suporte ao codec HEVC do vídeo 4K. Alternando para a melhor fonte disponível.', 4500);
          }
        }

        this.failedUrls.add(url);
        this.failedUrls.add(targetStreamUrl);
        this.tryNextSource(resumeTime, 'Erro ao carregar codec/mídia');
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

      row.setAttribute('tabindex', '0');
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.switchLiveChannel(ch);
        }
      });

      row.onclick = () => {
        this.switchLiveChannel(ch);
      };

      this.sidebarChannelsList.appendChild(row);

      // Auto-scroll para manter o canal ativo visível e focado
      if (isActive) {
        setTimeout(() => {
          row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          if (this.sidebar.classList.contains('open')) {
            row.focus();
          }
        }, 120);
      }
    });
  }

  toggleSidebar(forceState = null) {
    if (!this.isLive) return;
    const shouldOpen = forceState !== null ? forceState : !this.sidebar.classList.contains('open');
    if (shouldOpen) {
      this.wakeHud();
      this.sidebar.classList.add('open');
      this.renderSidebarChannels(this.activeSidebarCategory);
    } else {
      this.sidebar.classList.remove('open');
      this.resetControlsTimeout();
    }
  }

  navigateSidebarChannels(delta) {
    if (!this.sidebarChannelsList) return;
    const items = Array.from(this.sidebarChannelsList.querySelectorAll('.sidebar-channel-item'));
    if (items.length === 0) return;
    let currentIndex = items.findIndex(el => el === document.activeElement || el.classList.contains('focused'));
    if (currentIndex === -1) {
      currentIndex = items.findIndex(el => el.classList.contains('active'));
      if (currentIndex === -1) currentIndex = 0;
    }
    const nextIndex = Math.max(0, Math.min(items.length - 1, currentIndex + delta));
    items.forEach(el => el.classList.remove('focused'));
    items[nextIndex].classList.add('focused');
    items[nextIndex].focus();
    items[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

  updatePlayPauseIcon(isPlaying) {
    if (this.playBtn) {
      const iconPlay = this.playBtn.querySelector('.icon-play');
      const iconPause = this.playBtn.querySelector('.icon-pause');
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
      } else {
        this.playBtn.innerHTML = isPlaying ? '⏸' : '▶';
      }
    }
    if (this.centerPlayBtn) {
      const iconPlay = this.centerPlayBtn.querySelector('.icon-play');
      const iconPause = this.centerPlayBtn.querySelector('.icon-pause');
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
      }
    }
  }

  togglePlay(triggerFlash = false) {
    if (!this.video) return;
    if (this.video.paused) {
      this.video.play().then(() => {
        if (triggerFlash) this.triggerCenterFlash('play');
      }).catch(() => {});
    } else {
      this.video.pause();
      if (triggerFlash) this.triggerCenterFlash('pause');
      this.schedulePauseScreen();
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

      // Controle de visibilidade do Botão Pular Abertura (+85s)
      if (this.skipIntroBtn) {
        if (this.currentMedia && this.currentMedia.mediaType === 'tv' && current >= 15 && current <= 360) {
          this.skipIntroBtn.style.display = 'inline-flex';
        } else {
          this.skipIntroBtn.style.display = 'none';
        }
      }

      // Controle do Card de Próximo Episódio (Binge-Watching estilo Netflix)
      if (this.currentMedia && this.currentMedia.mediaType === 'tv' && this.currentMedia.onNextEpisode && !this.nextEpDismissed) {
        const remaining = duration - current;
        if (remaining <= 35 && duration > 90) {
          this.showNextEpisodeCard(Math.max(1, Math.round(remaining)));
        } else if (remaining > 35) {
          this.hideNextEpisodeCard();
        }
      }
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

  enterFullscreenWithOrientation() {
    const el = this.overlay || document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      try {
        const p = req.call(el);
        if (p && typeof p.then === 'function') {
          p.then(() => {
            this.lockLandscapeOrientation();
          }).catch(() => {
            this.lockLandscapeOrientation();
          });
        }
      } catch (_) {
        this.lockLandscapeOrientation();
      }
    } else {
      this.lockLandscapeOrientation();
    }
  }

  lockLandscapeOrientation() {
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}
    // Fallback nativo para iOS Safari caso fullscreen de elemento seja restrito
    if (this.video && typeof this.video.webkitEnterFullscreen === 'function' && window.innerWidth <= 800) {
      try { this.video.webkitEnterFullscreen(); } catch (_) {}
    }
  }

  handleFullscreenChange() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (isFs && this.overlay && this.overlay.classList.contains('open')) {
      this.lockLandscapeOrientation();
    } else if (!isFs && this.overlay && !this.overlay.classList.contains('open')) {
      try {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      } catch (_) {}
    }
  }

  toggleFullscreen() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFs) {
      this.enterFullscreenWithOrientation();
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) {
        try { exit.call(document); } catch (_) {}
      }
      try {
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      } catch (_) {}
    }
  }

  showControlsTemporarily() {
    this.wakeHud();
  }

  wakeHud() {
    if (!this.overlay) return;
    this.overlay.classList.remove('hud-hidden');
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) {
      top.style.opacity = '1';
      top.style.pointerEvents = 'auto';
    }
    if (bottom) {
      bottom.style.opacity = '1';
      bottom.style.pointerEvents = 'auto';
    }
    const openTab = document.getElementById('playerSidebarOpenTab');
    if (openTab && this.isLive) {
      openTab.style.opacity = '1';
      openTab.style.pointerEvents = 'auto';
    }
    this.resetControlsTimeout();
  }

  hideHud() {
    if (!this.overlay) return;
    // Não esconde se pausado ou com sidebar de canais aberta ou menu de legendas aberto
    if (this.video && this.video.paused) return;
    if (this.sidebar && this.sidebar.classList.contains('open')) return;
    if (this.subtitlesMenu && this.subtitlesMenu.style.display !== 'none') return;

    this.overlay.classList.add('hud-hidden');
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) {
      top.style.opacity = '0';
      top.style.pointerEvents = 'none';
    }
    if (bottom) {
      bottom.style.opacity = '0';
      bottom.style.pointerEvents = 'none';
    }
    const openTab = document.getElementById('playerSidebarOpenTab');
    if (openTab) {
      openTab.style.opacity = '0';
      openTab.style.pointerEvents = 'none';
    }
  }

  resetControlsTimeout() {
    if (!this.overlay) return;
    this.overlay.classList.remove('hud-hidden');
    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) {
      top.style.opacity = '1';
      top.style.pointerEvents = 'auto';
    }
    if (bottom) {
      bottom.style.opacity = '1';
      bottom.style.pointerEvents = 'auto';
    }
    const openTab = document.getElementById('playerSidebarOpenTab');
    if (openTab && this.isLive) {
      openTab.style.opacity = '1';
      openTab.style.pointerEvents = 'auto';
    }

    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      this.hideHud();
    }, 3500);
  }

  close() {
    this.syncProgress();
    this.stopHeartbeat();
    this.clearStallWatchdog();
    this.hideNextEpisodeCard();
    this.nextEpDismissed = false;
    this._autoPlayTriggered = false;
    clearTimeout(this.hideControlsTimer);
    clearTimeout(this.cinemaWarningTimer);
    clearTimeout(this.osdTimer);
    clearTimeout(this.noticeTimer);
    clearTimeout(this.failoverTimer);
    clearTimeout(this.pauseScreenTimer);
    clearInterval(this.loadingTimer);
    if (this.failoverBadge) this.failoverBadge.style.display = 'none';
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('active', 'fade-out');
      this.loadingActive = false;
    }
    this.hidePauseScreen();

    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load(); // Descarrega a mídia do buffer e cessa todo áudio/decodificação
    }
    if (this.hls) {
      try {
        this.hls.stopLoad();
        this.hls.destroy();
      } catch (_) {}
      this.hls = null;
    }
    this.sources = [];
    this.failedUrls.clear();
    this.overlay.classList.remove('open');
    this.overlay.classList.remove('hud-hidden');
    this.overlay.style.display = 'none';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.opacity = '0';

    const top = document.querySelector('.player-topbar');
    const bottom = document.querySelector('.player-controls-bottom');
    if (top) {
      top.style.pointerEvents = 'none';
      top.style.opacity = '0';
    }
    if (bottom) {
      bottom.style.pointerEvents = 'none';
      bottom.style.opacity = '0';
    }

    document.body.classList.remove('player-open');
    this.sidebar.classList.remove('open');
    if (this.liveOsd) this.liveOsd.classList.remove('show');
    if (this.subtitlesMenu) this.subtitlesMenu.style.display = 'none';
    this.clearSubtitles();
    this.hideSpinner();

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) {
        try { exit.call(document); } catch (_) {}
      }
    }

    // Restaura orientação do celular ao sair do player
    try {
      if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        screen.orientation.unlock();
      }
    } catch (_) {}

    // Notifica redimensionamento para restaurar reflow suave da página
    window.dispatchEvent(new Event('resize'));
    // Atualiza a home e continuar assistindo se disponível
    if (window.app) {
      window.app.loadContinueWatching();
      window.app.loadRecommendations();
      if (typeof window.app.onPlayerClose === 'function') {
        window.app.onPlayerClose();
      }
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

  /* ================================================================
     TELA DE CARREGAMENTO CLEAN ESTILO NETFLIX (ANEL VERMELHO + %)
     ================================================================ */

  startLoadingScreen(backdropUrl = null) {
    this.loadingActive = true;
    this.loadingPct = 5;
    this.loadingTarget = 20;

    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('fade-out');
      this.loadingScreen.classList.add('active');
    }
    if (this.loadingBackdrop) {
      if (backdropUrl) {
        const fullUrl = backdropUrl.startsWith('http') ? backdropUrl : `https://image.tmdb.org/t/p/original${backdropUrl}`;
        this.loadingBackdrop.style.backgroundImage = `url('${fullUrl}')`;
      } else {
        this.loadingBackdrop.style.backgroundImage = 'none';
      }
    }
    this.updateLoadingUi(this.loadingPct);

    clearInterval(this.loadingTimer);
    this.loadingTimer = setInterval(() => {
      if (!this.loadingActive) return;
      if (this.loadingPct < this.loadingTarget) {
        const step = Math.max(1, Math.round((this.loadingTarget - this.loadingPct) * 0.25));
        this.loadingPct = Math.min(this.loadingTarget, this.loadingPct + step);
        this.updateLoadingUi(this.loadingPct);
      }
    }, 120);
  }

  setLoadingProgress(pct) {
    if (!this.loadingActive) return;
    this.loadingTarget = Math.max(this.loadingTarget, Math.min(96, pct));
  }

  updateLoadingUi(pct) {
    if (this.loadingPctEl) {
      this.loadingPctEl.textContent = `${Math.round(pct)}%`;
    }
  }

  finishLoadingScreen() {
    if (!this.loadingActive) return;
    this.loadingTarget = 100;
    this.loadingPct = 100;
    this.updateLoadingUi(100);

    clearInterval(this.loadingTimer);
    this.loadingTimer = null;

    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.classList.remove('active', 'fade-out');
        }
        this.loadingActive = false;
      }, 350);
    } else {
      this.loadingActive = false;
    }
  }

  /* ================================================================
     FEEDBACK CENTRAL PLAY/PAUSE & DOUBLE-TAP SEEK (ESTILO NETFLIX)
     ================================================================ */

  triggerCenterFlash(type = 'play') {
    if (!this.centerFlash) return;
    const playSvg = '<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M5 2.691c0-.76.815-1.243 1.482-.876l16.925 9.309a1 1 0 0 1 0 1.752L6.482 22.185C5.815 22.552 5 22.069 5 21.31z"/></svg>';
    const pauseSvg = '<svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M4.5 3a.5.5 0 0 0-.5.5v17a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-17a.5.5 0 0 0-.5-.5zm10 0a.5.5 0 0 0-.5.5v17a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-17a.5.5 0 0 0-.5-.5z"/></svg>';

    this.centerFlash.innerHTML = type === 'play' ? playSvg : pauseSvg;
    this.centerFlash.classList.remove('animate');
    void this.centerFlash.offsetWidth; // Force reflow
    this.centerFlash.classList.add('animate');
  }

  seekBy(seconds, showRipple = false) {
    if (this.isLive || !this.video) return;
    const duration = this.video.duration || 0;
    const current = this.video.currentTime || 0;
    const target = Math.max(0, Math.min(duration, current + seconds));
    this.video.currentTime = target;

    if (showRipple) {
      const side = seconds < 0 ? 'left' : 'right';
      const el = side === 'left' ? this.seekRippleLeft : this.seekRippleRight;
      if (el) {
        this.seekAccum[side] = (this.seekAccum[side] || 0) + Math.abs(seconds);
        const label = el.querySelector('.seek-ripple-label');
        if (label) label.textContent = `${this.seekAccum[side]} s`;

        el.classList.remove('animate');
        void el.offsetWidth;
        el.classList.add('animate');

        clearTimeout(this.seekRippleTimers[side]);
        this.seekRippleTimers[side] = setTimeout(() => {
          el.classList.remove('animate');
          this.seekAccum[side] = 0;
        }, 700);
      }
    }
  }

  /* ================================================================
     SCRUBBING DE BARRA DE PROGRESSO & BUFFER
     ================================================================ */

  initProgressScrubbing() {
    if (!this.progressBar) return;

    const updateSeekFromEvent = (clientX, isMoving = false) => {
      if (this.isLive || !this.video || !this.video.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = pct * this.video.duration;

      this.progressFill.style.width = `${pct * 100}%`;
      this.timeDisplay.textContent = `${this.formatTime(targetTime)} / ${this.formatTime(this.video.duration)}`;

      this.updatePreviewCard(clientX, rect, pct, targetTime);
      return targetTime;
    };

    // Arraste com mouse
    this.progressBar.addEventListener('mousedown', (e) => {
      if (this.isLive) return;
      this.isScrubbing = true;
      this.progressBar.classList.add('scrubbing');
      const targetTime = updateSeekFromEvent(e.clientX, true);

      const onMouseMove = (ev) => {
        if (!this.isScrubbing) return;
        updateSeekFromEvent(ev.clientX, true);
      };

      const onMouseUp = (ev) => {
        if (!this.isScrubbing) return;
        this.isScrubbing = false;
        this.progressBar.classList.remove('scrubbing');
        this.hidePreviewCard();
        const finalTime = updateSeekFromEvent(ev.clientX, false);
        if (finalTime !== undefined) this.video.currentTime = finalTime;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // Arraste por toque no mobile
    this.progressBar.addEventListener('touchstart', (e) => {
      if (this.isLive || !e.touches[0]) return;
      this.isScrubbing = true;
      this.progressBar.classList.add('scrubbing');
      updateSeekFromEvent(e.touches[0].clientX, true);
    }, { passive: true });

    this.progressBar.addEventListener('touchmove', (e) => {
      if (!this.isScrubbing || !e.touches[0]) return;
      updateSeekFromEvent(e.touches[0].clientX, true);
    }, { passive: true });

    this.progressBar.addEventListener('touchend', (e) => {
      if (!this.isScrubbing) return;
      this.isScrubbing = false;
      this.progressBar.classList.remove('scrubbing');
      this.hidePreviewCard();
      const touch = e.changedTouches && e.changedTouches[0];
      if (touch) {
        const finalTime = updateSeekFromEvent(touch.clientX, false);
        if (finalTime !== undefined) this.video.currentTime = finalTime;
      }
    }, { passive: true });

    // Hover na barra para exibir preview no desktop
    this.progressBar.addEventListener('mousemove', (e) => {
      if (this.isLive || this.isScrubbing || !this.video || !this.video.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = pct * this.video.duration;
      this.updatePreviewCard(e.clientX, rect, pct, targetTime);
    });

    this.progressBar.addEventListener('mouseleave', () => {
      if (!this.isScrubbing) {
        this.hidePreviewCard();
      }
    });
  }

  updatePreviewCard(clientX, barRect, pct, targetTime) {
    if (this.isLive) return;

    if (this.progressTooltip) {
      this.progressTooltip.textContent = this.formatTime(targetTime);
      const rawX = clientX - barRect.left;
      const boundedX = Math.max(24, Math.min(barRect.width - 24, rawX));
      this.progressTooltip.style.left = `${boundedX}px`;
      this.progressTooltip.style.display = 'block';
    }
  }

  hidePreviewCard() {
    if (this.previewCard) {
      this.previewCard.style.display = 'none';
    }
    if (this.progressTooltip) {
      this.progressTooltip.style.display = 'none';
    }
    clearTimeout(this.previewDebounceTimer);
  }

  updateBufferedBar() {
    if (this.isLive || !this.video || !this.progressBuffered) return;
    const duration = this.video.duration;
    if (!duration || this.video.buffered.length === 0) return;

    try {
      const current = this.video.currentTime;
      let bufferedEnd = 0;
      for (let i = 0; i < this.video.buffered.length; i++) {
        if (this.video.buffered.start(i) <= current && current <= this.video.buffered.end(i)) {
          bufferedEnd = this.video.buffered.end(i);
          break;
        }
      }
      if (!bufferedEnd && this.video.buffered.length > 0) {
        bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      }
      const pct = Math.min(100, (bufferedEnd / duration) * 100);
      this.progressBuffered.style.width = `${pct}%`;
    } catch (_) {}
  }

  /* ================================================================
     TELA DE PAUSA "VOCÊ ESTÁ ASSISTINDO" (ESTILO NETFLIX)
     ================================================================ */

  schedulePauseScreen() {
    clearTimeout(this.pauseScreenTimer);
    if (this.isLive) return;

    // Se pausado por mais de 2.8s sem interação, exibe a tela elegante de pausa
    this.pauseScreenTimer = setTimeout(() => {
      if (this.video && this.video.paused && this.overlay && this.overlay.classList.contains('open')) {
        this.showPauseScreen();
      }
    }, 2800);
  }

  showPauseScreen() {
    if (!this.pauseScreen || this.isLive) return;
    if (this.pauseScreenTitle) {
      this.pauseScreenTitle.textContent = this.currentMedia?.title || 'HomeFlix';
    }
    if (this.pauseScreenMeta) {
      if (this.currentMedia?.mediaType === 'tv') {
        const epNum = this.currentMedia?.episode ? `T${this.currentMedia?.season || 1}:E${this.currentMedia?.episode}` : '';
        const epTitle = this.currentMedia?.episodeTitle ? ` • ${this.currentMedia?.episodeTitle}` : '';
        this.pauseScreenMeta.textContent = `${epNum}${epTitle}`.trim();
        this.pauseScreenMeta.style.display = 'block';
      } else {
        this.pauseScreenMeta.style.display = 'none';
      }
    }
    if (this.pauseScreenOverview) {
      this.pauseScreenOverview.style.display = 'none';
    }

    this.overlay.classList.add('pause-idle');
  }

  hidePauseScreen() {
    clearTimeout(this.pauseScreenTimer);
    if (this.overlay) {
      this.overlay.classList.remove('pause-idle');
    }
  }
}

