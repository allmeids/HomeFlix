class HomeFlixApp {
  constructor() {
    this.currentTab = 'home';
    this.previousTab = 'home';
    this.profiles = [];
    this.currentProfile = null;
    this.heroItem = null;
    this.channels = [];
    this.categories = [];
    this.selectedLiveCategory = 'Todos';
    this.selectedAvatar = '🦊';
    this.editingProfileId = null;

    this.player = new HomeFlixPlayer();
    this.init();
  }

  async init() {
    this.setupPwa();
    this.setupNavbar();
    this.setupCategoryBar();
    this.setupModals();
    this.setupCarouselArrows();
    this.setupTvNavigation();
    await this.loadProfiles();
    await this.loadHome();
  }

  setupPwa() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('[HomeFlix PWA] Service Worker registrado:', reg.scope))
          .catch((err) => console.warn('[HomeFlix PWA] Erro ao registrar SW:', err));
      });
    }
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

    // Logo click
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
      navLogo.addEventListener('click', () => {
        this.switchTab('home');
      });
    }

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          item.click();
        }
      });
    });

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.setAttribute('tabindex', '0');
      profileBtn.addEventListener('click', () => {
        this.openProfileModal();
      });
      profileBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          profileBtn.click();
        }
      });
    }

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

    // Botão Voltar da Busca
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) {
      searchBackBtn.onclick = () => this.switchTab('home');
    }
  }

  setupCategoryBar() {
    const catCarousel = document.getElementById('categoriesCarousel');
    const catLeft = document.getElementById('catNavLeft');
    const catRight = document.getElementById('catNavRight');

    if (catLeft && catRight && catCarousel) {
      catLeft.onclick = () => {
        catCarousel.scrollBy({ left: -320, behavior: 'smooth' });
      };
      catRight.onclick = () => {
        catCarousel.scrollBy({ left: 320, behavior: 'smooth' });
      };
    }

    // Clique nos cartões de categorias estilo Prime Video
    document.querySelectorAll('.cat-card').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          card.click();
        }
      });
      card.addEventListener('click', () => {
        const catKey = card.getAttribute('data-category');
        const scrollTargetId = card.getAttribute('data-scroll');

        if (catKey === 'live') {
          this.switchTab('live');
          return;
        }

        if (this.currentTab !== 'home') {
          this.switchTab('home');
        }

        if (scrollTargetId) {
          setTimeout(() => {
            const targetEl = document.getElementById(scrollTargetId);
            if (targetEl) {
              const section = targetEl.closest('.media-section');
              if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                section.classList.add('section-highlight');
                setTimeout(() => section.classList.remove('section-highlight'), 1800);
              }
            }
          }, 150);
        }
      });
    });
  }

  setupCarouselArrows() {
    // Adiciona funcionalidade de scroll suave para todos os carrosséis
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('carousel-nav-left')) {
        const wrapper = e.target.closest('.carousel-wrapper');
        const carousel = wrapper ? wrapper.querySelector('.media-carousel') : null;
        if (carousel) {
          carousel.scrollBy({ left: -carousel.clientWidth * 0.75, behavior: 'smooth' });
        }
      } else if (e.target.classList.contains('carousel-nav-right')) {
        const wrapper = e.target.closest('.carousel-wrapper');
        const carousel = wrapper ? wrapper.querySelector('.media-carousel') : null;
        if (carousel) {
          carousel.scrollBy({ left: carousel.clientWidth * 0.75, behavior: 'smooth' });
        }
      }
    });
  }

  /* ================================================================
     MODO SMART TV & NAVEGAÇÃO POR CONTROLE REMOTO / 10-FOOT UI
     ================================================================ */

  setupTvNavigation() {
    // Sincroniza classes visuais de foco (.tv-focused)
    document.addEventListener('focusin', (e) => {
      document.querySelectorAll('.tv-focused').forEach(el => {
        if (el !== e.target) el.classList.remove('tv-focused');
      });
      if (e.target && e.target.classList) {
        e.target.classList.add('tv-focused');
      }
    });

    document.addEventListener('focusout', (e) => {
      if (e.target && e.target.classList) {
        e.target.classList.remove('tv-focused');
      }
    });

    // Manipulador Global de Navegação Direcional
    window.addEventListener('keydown', (e) => {
      // 1. Se o player de vídeo estiver aberto, delega 100% para o player.js
      if (this.player && this.player.overlay && this.player.overlay.classList.contains('open')) {
        return;
      }

      const key = e.key;
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'];
      if (!navKeys.includes(key)) return;

      // 2. Modal do Trailer Oficial aberto
      const trailerModal = document.getElementById('trailerModal');
      if (trailerModal && trailerModal.classList.contains('active')) {
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          const closeBtn = document.getElementById('trailerCloseBtn');
          if (closeBtn) closeBtn.click();
        }
        return;
      }

      // 3. Modal de Perfis aberto ("Quem está assistindo?")
      const profileModal = document.getElementById('profileModal');
      if (profileModal && profileModal.classList.contains('active')) {
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          const closeBtn = document.getElementById('profileCloseBtn');
          const cancelBtn = document.getElementById('cancelProfileBtn');
          const formBox = document.getElementById('profileFormBox');
          if (formBox && formBox.style.display !== 'none' && cancelBtn) {
            cancelBtn.click();
          } else if (closeBtn) {
            closeBtn.click();
          }
          return;
        }

        this.navigateInContainer(profileModal, key, e);
        return;
      }

      // 4. Tela de Detalhes Dedicada (#detailsView)
      const detailsView = document.getElementById('detailsView');
      if (detailsView && detailsView.style.display !== 'none') {
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          const backBtn = document.getElementById('detailsViewBackBtn');
          if (backBtn) backBtn.click();
          return;
        }

        this.navigateDetailsView(key, e);
        return;
      }

      // 5. Navegação na Tela Principal (Home, Categorias, TV ao Vivo, Busca, Minha Lista)
      this.navigateMainView(key, e);
    });
  }

  navigateDetailsView(key, e) {
    const detailsView = document.getElementById('detailsView');
    const active = document.activeElement;

    // Coleta zonas interativas na tela de detalhes
    const topBtns = Array.from(detailsView.querySelectorAll('.details-topbar button:not([disabled])'));
    const actionBtns = Array.from(detailsView.querySelectorAll('.details-action-buttons button:not([disabled])'));
    const episodeCards = Array.from(detailsView.querySelectorAll('#detailsEpisodesGrid .episode-card'));
    const sourceCards = Array.from(detailsView.querySelectorAll('#detailsSourcesGrid .stream-source-card'));
    const castCards = Array.from(detailsView.querySelectorAll('#detailsCastGrid .details-cast-card'));
    const similarCards = Array.from(detailsView.querySelectorAll('#detailsSimilarCarousel .media-card'));

    const zones = [];
    if (topBtns.length) zones.push({ name: 'top', items: topBtns, type: 'row' });
    if (actionBtns.length) zones.push({ name: 'actions', items: actionBtns, type: 'row' });
    if (episodeCards.length) zones.push({ name: 'episodes', items: episodeCards, type: 'grid' });
    if (sourceCards.length) zones.push({ name: 'sources', items: sourceCards, type: 'grid' });
    if (castCards.length) zones.push({ name: 'cast', items: castCards, type: 'carousel' });
    if (similarCards.length) zones.push({ name: 'similar', items: similarCards, type: 'carousel' });

    let currentZoneIndex = -1;
    let currentItemIndex = -1;

    for (let z = 0; z < zones.length; z++) {
      const idx = zones[z].items.indexOf(active);
      if (idx !== -1) {
        currentZoneIndex = z;
        currentItemIndex = idx;
        break;
      }
    }

    if (currentZoneIndex === -1) {
      if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(key)) {
        e.preventDefault();
        const initial = actionBtns[0] || topBtns[0];
        if (initial) {
          initial.focus();
          initial.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const currentZone = zones[currentZoneIndex];

    if (key === 'ArrowRight') {
      e.preventDefault();
      if (currentItemIndex < currentZone.items.length - 1) {
        const next = currentZone.items[currentItemIndex + 1];
        next.focus();
        next.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      if (currentItemIndex > 0) {
        const prev = currentZone.items[currentItemIndex - 1];
        prev.focus();
        prev.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      if (currentZoneIndex < zones.length - 1) {
        const nextZone = zones[currentZoneIndex + 1];
        const targetIndex = Math.min(currentItemIndex, nextZone.items.length - 1);
        const target = nextZone.items[targetIndex >= 0 ? targetIndex : 0];
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      if (currentZoneIndex > 0) {
        const prevZone = zones[currentZoneIndex - 1];
        const targetIndex = Math.min(currentItemIndex, prevZone.items.length - 1);
        const target = prevZone.items[targetIndex >= 0 ? targetIndex : 0];
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (key === 'Enter') {
      if (active && typeof active.click === 'function') {
        active.click();
      }
    }
  }

  navigateMainView(key, e) {
    const active = document.activeElement;
    const isLiveTab = this.currentTab === 'live';
    const isSearchTab = this.currentTab === 'search' || document.getElementById('searchContainer').style.display !== 'none';

    // 1. Zona Navbar
    const navItems = Array.from(document.querySelectorAll('.navbar .nav-item, #searchInput, #profileBtn'));

    // 2. Zona Hero Banner
    const heroSection = document.getElementById('heroSection');
    const heroVisible = heroSection && heroSection.style.display !== 'none';
    const heroBtns = heroVisible
      ? Array.from(heroSection.querySelectorAll('#heroPlayBtn, #heroInfoBtn'))
      : [];

    // 3. Zona Barra de Categorias
    const catWrapper = document.getElementById('categoriesBarWrapper');
    const catVisible = catWrapper && catWrapper.style.display !== 'none';
    const catCards = catVisible
      ? Array.from(catWrapper.querySelectorAll('.cat-card'))
      : [];

    // 4. Zonas de Conteúdo
    const contentZones = [];

    if (isLiveTab) {
      const catPills = Array.from(document.querySelectorAll('#liveCategoryPills .category-pill'));
      if (catPills.length) contentZones.push({ el: document.getElementById('liveCategoryPills'), items: catPills, type: 'carousel' });

      const channels = Array.from(document.querySelectorAll('#liveChannelsGrid .channel-card'));
      if (channels.length) contentZones.push({ el: document.getElementById('liveChannelsGrid'), items: channels, type: 'grid' });
    } else if (isSearchTab) {
      const searchItems = Array.from(document.querySelectorAll('#searchGrid .media-card'));
      if (searchItems.length) contentZones.push({ el: document.getElementById('searchGrid'), items: searchItems, type: 'grid' });
    } else {
      // Continuar Assistindo (se presente)
      const continueSection = document.getElementById('continueWatchingSection');
      if (continueSection && continueSection.style.display !== 'none') {
        const contItems = Array.from(continueSection.querySelectorAll('.continue-card'));
        if (contItems.length) contentZones.push({ el: continueSection, items: contItems, type: 'carousel' });
      }

      // Carrosséis verticais de filmes, séries e coleções
      const sections = Array.from(document.querySelectorAll('#sectionsContainer .media-section'));
      sections.forEach(sec => {
        if (sec.id === 'continueWatchingSection') return;
        if (sec.style.display === 'none') return;
        const items = Array.from(sec.querySelectorAll('.media-carousel .media-card'));
        if (items.length) {
          contentZones.push({ el: sec, items, type: 'carousel' });
        }
      });
    }

    const allZones = [];
    if (navItems.length) allZones.push({ name: 'navbar', items: navItems, type: 'row' });
    if (heroBtns.length) allZones.push({ name: 'hero', items: heroBtns, type: 'row' });
    if (catCards.length) allZones.push({ name: 'categories', items: catCards, type: 'carousel' });
    contentZones.forEach(cz => allZones.push({ name: 'content', el: cz.el, items: cz.items, type: cz.type }));

    let currentZoneIndex = -1;
    let currentItemIndex = -1;

    for (let z = 0; z < allZones.length; z++) {
      const idx = allZones[z].items.indexOf(active);
      if (idx !== -1) {
        currentZoneIndex = z;
        currentItemIndex = idx;
        break;
      }
    }

    // Se nenhum item estiver focado, foca no Hero ou no primeiro card visível
    if (currentZoneIndex === -1) {
      if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(key)) {
        e.preventDefault();
        const initial = heroBtns[0] || (allZones[3] ? allZones[3].items[0] : navItems[0]);
        if (initial) {
          initial.focus();
          initial.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    const currentZone = allZones[currentZoneIndex];

    // Escape / Backspace: Volta para o Início ou Topo
    if (key === 'Escape' || key === 'Backspace') {
      if (this.currentTab !== 'home') {
        e.preventDefault();
        this.switchTab('home');
      } else if (currentZoneIndex > 1) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (heroBtns[0]) heroBtns[0].focus();
        else navItems[0].focus();
      }
      return;
    }

    // Enter: Selecionar / Executar
    if (key === 'Enter') {
      if (active && typeof active.click === 'function') {
        active.click();
      }
      return;
    }

    // Navegação Horizontal (Seta Esquerda / Seta Direita)
    if (key === 'ArrowRight') {
      e.preventDefault();
      if (currentItemIndex < currentZone.items.length - 1) {
        const next = currentZone.items[currentItemIndex + 1];
        next.focus();
        next.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      if (currentItemIndex > 0) {
        const prev = currentZone.items[currentItemIndex - 1];
        prev.focus();
        prev.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
    // Navegação Vertical (Seta Baixo / Seta Cima entre Carrosséis)
    else if (key === 'ArrowDown') {
      e.preventDefault();
      if (currentZone.type === 'grid') {
        const cols = this.calcGridColumns(currentZone.items);
        const nextIndex = currentItemIndex + cols;
        if (nextIndex < currentZone.items.length) {
          const target = currentZone.items[nextIndex];
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      if (currentZoneIndex < allZones.length - 1) {
        const nextZone = allZones[currentZoneIndex + 1];
        const targetIndex = this.findClosestHorizontalIndex(currentZone.items[currentItemIndex], nextZone.items);
        const target = nextZone.items[targetIndex];
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      if (currentZone.type === 'grid') {
        const cols = this.calcGridColumns(currentZone.items);
        const prevIndex = currentItemIndex - cols;
        if (prevIndex >= 0) {
          const target = currentZone.items[prevIndex];
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      if (currentZoneIndex > 0) {
        const prevZone = allZones[currentZoneIndex - 1];
        const targetIndex = this.findClosestHorizontalIndex(currentZone.items[currentItemIndex], prevZone.items);
        const target = prevZone.items[targetIndex];
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  calcGridColumns(items) {
    if (!items || items.length < 2) return 1;
    const firstTop = items[0].getBoundingClientRect().top;
    for (let i = 1; i < items.length; i++) {
      if (Math.abs(items[i].getBoundingClientRect().top - firstTop) > 10) {
        return i;
      }
    }
    return items.length;
  }

  findClosestHorizontalIndex(currentEl, targetItems) {
    if (!currentEl || !targetItems || targetItems.length === 0) return 0;
    const curRect = currentEl.getBoundingClientRect();
    const curCenterX = curRect.left + curRect.width / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < targetItems.length; i++) {
      const r = targetItems[i].getBoundingClientRect();
      const centerX = r.left + r.width / 2;
      const dist = Math.abs(curCenterX - centerX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  navigateInContainer(containerEl, key, e) {
    const focusable = Array.from(containerEl.querySelectorAll('button:not([disabled]), input, .profile-avatar-choice, .profile-card, [tabindex="0"]'))
      .filter(el => el.offsetParent !== null);
    if (!focusable.length) return;

    const active = document.activeElement;
    const idx = focusable.indexOf(active);

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      e.preventDefault();
      const next = idx < focusable.length - 1 ? focusable[idx + 1] : focusable[0];
      next.focus();
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      e.preventDefault();
      const prev = idx > 0 ? focusable[idx - 1] : focusable[focusable.length - 1];
      prev.focus();
    } else if (key === 'Enter') {
      if (active && typeof active.click === 'function') {
        active.click();
      }
    }
  }

  switchTab(tab) {
    this.previousTab = this.currentTab;
    this.currentTab = tab;

    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tab) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const detailsView = document.getElementById('detailsView');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');

    // Esconde a tela de detalhes ao trocar de aba principal
    if (detailsView) detailsView.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';

    if (tab === 'home') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadHome();
    } else if (tab === 'movies') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadMoviesTab();
    } else if (tab === 'series') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      this.loadSeriesTab();
    } else if (tab === 'live') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'block';
      this.loadLiveTv();
    } else if (tab === 'categories') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      // Rola até a barra de categorias
      if (categoriesBar) {
        categoriesBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (tab === 'watchlist') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'none';
      this.loadWatchlist();
    }
  }

  /* ================================================================
     GESTÃO DE PERFIS (SQLITE)
     ================================================================ */

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
      const avatarEl = document.getElementById('navProfileAvatar');
      const nameEl = document.getElementById('navProfileName');
      if (avatarEl) avatarEl.textContent = this.currentProfile.avatar || '🦊';
      if (nameEl) nameEl.textContent = this.currentProfile.name || 'Perfil';

      const recTitle = document.getElementById('recommendationsTitle');
      if (recTitle) {
        recTitle.textContent = `✨ Recomendados para Você, ${this.currentProfile.name}`;
      }
    }
  }

  openProfileModal(isManageMode = false) {
    const modal = document.getElementById('profileModal');
    const grid = document.getElementById('profileModalGrid');
    const formBox = document.getElementById('profileFormBox');
    const footerBtns = document.getElementById('profileModalFooterBtns');

    grid.style.display = 'flex';
    formBox.style.display = 'none';
    footerBtns.style.display = 'flex';
    grid.innerHTML = '';

    const avatars = ['🦊', '🍿', '🎬', '👑', '🚀', '🐱', '🦁', '🤖', '🎮', '⚡', '🥷', '💎', '🧙', '🌟', '🍕', '🐉'];

    this.profiles.forEach(p => {
      const isCurrent = this.currentProfile && String(p.id) === String(this.currentProfile.id);
      const card = document.createElement('div');
      card.className = `profile-card ${isCurrent ? 'active' : ''}`;
      card.innerHTML = `
        <div class="profile-avatar-large">
          ${p.avatar}
          ${isManageMode ? '<span class="profile-edit-badge">✏️</span>' : ''}
        </div>
        <div class="profile-name-large">${p.name}</div>
      `;

      card.onclick = () => {
        if (isManageMode) {
          this.showProfileForm(p);
        } else {
          this.currentProfile = p;
          window.currentProfile = p;
          localStorage.setItem('homeflix_active_profile', p.id);
          this.updateProfileUI();
          modal.classList.remove('open');
          this.loadContinueWatching();
          this.loadRecommendations();
        }
      };

      grid.appendChild(card);
    });

    const manageBtn = document.getElementById('manageProfilesToggleBtn');
    if (manageBtn) {
      manageBtn.textContent = isManageMode ? '✓ Concluir Edição' : '⚙️ Gerenciar Perfis';
      manageBtn.onclick = () => {
        this.openProfileModal(!isManageMode);
      };
    }

    modal.classList.add('open');
  }

  showProfileForm(profileToEdit = null) {
    const grid = document.getElementById('profileModalGrid');
    const formBox = document.getElementById('profileFormBox');
    const footerBtns = document.getElementById('profileModalFooterBtns');
    const titleEl = document.getElementById('profileFormTitle');
    const nameInput = document.getElementById('profileFormNameInput');
    const deleteBtn = document.getElementById('deleteProfileBtn');
    const avatarGrid = document.getElementById('avatarPickerGrid');

    grid.style.display = 'none';
    footerBtns.style.display = 'none';
    formBox.style.display = 'block';

    const avatars = ['🦊', '🍿', '🎬', '👑', '🚀', '🐱', '🦁', '🤖', '🎮', '⚡', '🥷', '💎', '🧙', '🌟', '🍕', '🐉'];
    this.selectedAvatar = profileToEdit?.avatar || '🦊';
    this.editingProfileId = profileToEdit ? profileToEdit.id : null;

    if (profileToEdit) {
      titleEl.textContent = `Editar Perfil: ${profileToEdit.name}`;
      nameInput.value = profileToEdit.name;
      deleteBtn.style.display = this.profiles.length > 1 ? 'inline-block' : 'none';
    } else {
      titleEl.textContent = 'Criar Novo Perfil';
      nameInput.value = '';
      deleteBtn.style.display = 'none';
    }

    avatarGrid.innerHTML = '';
    avatars.forEach(av => {
      const avBtn = document.createElement('div');
      avBtn.className = `avatar-item ${av === this.selectedAvatar ? 'selected' : ''}`;
      avBtn.textContent = av;
      avBtn.onclick = () => {
        this.selectedAvatar = av;
        avatarGrid.querySelectorAll('.avatar-item').forEach(b => b.classList.toggle('selected', b.textContent === av));
      };
      avatarGrid.appendChild(avBtn);
    });
  }

  /* ================================================================
     CARREGAMENTO DO CATÁLOGO & RECOMENDAÇÕES
     ================================================================ */

  async loadHome() {
    // 1. Carrega o catálogo completo da Home (desduplicado pelo backend)
    const homeData = await API.getHomeCatalog();

    if (homeData) {
      if (homeData.trending && homeData.trending.length > 0) {
        this.renderHero(homeData.trending[0]);
      }
      this.renderCarousel('trendingCarousel', homeData.trending || []);
      this.renderCarousel('superheroesCarousel', homeData.superheroes || []);
      this.renderCarousel('actionMoviesCarousel', homeData.action || []);
      this.renderCarousel('popularMoviesCarousel', homeData.popular_movies || []);
      this.renderCarousel('popularSeriesCarousel', homeData.popular_series || []);
      this.renderCarousel('scifiMoviesCarousel', homeData.scifi || []);
      this.renderCarousel('comedyMoviesCarousel', homeData.comedy || []);
      this.renderCarousel('horrorMoviesCarousel', homeData.horror || []);
      this.renderCarousel('thrillerMoviesCarousel', homeData.thriller || []);
      this.renderCarousel('topMoviesCarousel', homeData.top_rated || []);
      this.renderCarousel('familyMoviesCarousel', homeData.family || []);
      this.renderCarousel('animesCarousel', homeData.animes || []);
    }

    // 2. Continuar Assistindo (Quick Resume)
    await this.loadContinueWatching();

    // 3. Recomendações personalizadas
    await this.loadRecommendations();
  }

  async loadRecommendations() {
    if (!this.currentProfile) return;
    const recSection = document.getElementById('recommendationsSection');
    const recCarousel = document.getElementById('recommendationsCarousel');

    const recs = await API.getRecommendations(this.currentProfile.id);
    if (recs && recs.length > 0) {
      recSection.style.display = 'block';
      this.renderCarousel('recommendationsCarousel', recs);
    } else {
      recSection.style.display = 'none';
    }
  }

  async loadMoviesTab() {
    const popular = await API.getPopularMovies(1);
    if (popular.length > 0) this.renderHero(popular[0]);
    this.renderCarousel('trendingCarousel', popular);
    const top = await API.getTopRatedMovies(1);
    this.renderCarousel('popularMoviesCarousel', top);
    const nowPlaying = await API.getNowPlaying(1);
    this.renderCarousel('popularSeriesCarousel', nowPlaying);
  }

  async loadSeriesTab() {
    const popular = await API.getPopularSeries(1);
    if (popular.length > 0) this.renderHero(popular[0]);
    this.renderCarousel('trendingCarousel', popular);
    const top = await API.getTopRatedSeries(1);
    this.renderCarousel('popularMoviesCarousel', top);
    const animes = await API.getAnimes(1);
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
      card.setAttribute('tabindex', '0');
      const bgImg = item.backdrop_path 
        ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
        : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '');

      card.innerHTML = `
        <button class="continue-remove-btn" title="Remover da lista" aria-label="Remover">✕</button>
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

      const removeBtn = card.querySelector('.continue-remove-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await API.deleteProgress(this.currentProfile.id, item.media_id);
          card.remove();
          if (carousel.children.length === 0) {
            section.style.display = 'none';
          }
        });
      }

      card.onclick = () => {
        this.openMediaDetails(item.media_type, item.media_id, {
          resumeTime: item.position,
          season: item.season_number,
          episode: item.episode_number
        });
      };
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });

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
    document.getElementById('heroType').textContent = mediaType === 'movie' ? 'FILME' : 'SÉRIE';
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
    const section = container.closest('.media-section');
    if (!items || items.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = 'block';
    container.innerHTML = '';

    items.forEach(item => {
      const posterPath = item.poster_path || item.backdrop_path;
      if (!posterPath) return;
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
      const date = item.release_date || item.first_air_date || '';
      const year = date ? date.split('-')[0] : '';

      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0'); // Acessibilidade para controle remoto
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${posterPath}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';" />
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${year}</span>
            <span class="card-rating">★ ${rating}</span>
          </div>
        </div>
      `;

      card.onclick = () => this.openMediaDetails(mediaType, item.id);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.openMediaDetails(mediaType, item.id);
      });

      container.appendChild(card);
    });
  }

  /* ================================================================
     TELA DEDICADA DE DETALHES DO FILME / SÉRIE (SUBSTITUI O MODAL)
     ================================================================ */

  async openMediaDetails(mediaType, tmdbId, opts = {}) {
    const detailsView = document.getElementById('detailsView');
    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');

    // Esconde as outras telas e exibe a tela de detalhes completa
    heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    sectionsContainer.style.display = 'none';
    liveTvContainer.style.display = 'none';
    searchContainer.style.display = 'none';

    detailsView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Busca detalhes completos no backend com TMDB
    const details = await API.getMediaDetails(mediaType, tmdbId);
    if (!details) {
      alert('Não foi possível carregar os detalhes do título.');
      this.switchTab(this.currentTab);
      return;
    }

    const title = details.title || details.name || '';
    const tagline = details.tagline ? `"${details.tagline}"` : '';
    const overview = details.overview || 'Sinopse não disponível no momento.';
    const rating = details.vote_average ? details.vote_average.toFixed(1) : '8.8';
    const date = details.release_date || details.first_air_date || '';
    const year = date ? date.split('-')[0] : '2026';
    const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min por ep` : '');

    const backdrop = details.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
      : `https://image.tmdb.org/t/p/original${details.poster_path}`;

    const poster = details.poster_path 
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : `https://image.tmdb.org/t/p/w500${details.backdrop_path}`;

    // Popula Hero de Detalhes
    document.getElementById('detailsHeroBanner').style.backgroundImage = `url('${backdrop}')`;
    document.getElementById('detailsPosterImg').src = poster;
    document.getElementById('detailsMainTitle').textContent = title;
    document.getElementById('detailsViewTopTitle').textContent = title;
    document.getElementById('detailsTagline').textContent = tagline;
    document.getElementById('detailsRating').textContent = `★ ${rating}`;
    document.getElementById('detailsYear').textContent = year;
    document.getElementById('detailsRuntime').textContent = runtime;
    document.getElementById('detailsTypeBadge').textContent = mediaType === 'movie' ? 'FILME' : 'SÉRIE';
    document.getElementById('detailsOverview').textContent = overview;

    // Gêneros & Direção
    const genres = (details.genres || []).map(g => g.name).join(', ');
    document.getElementById('detailsGenresText').textContent = genres || 'Variados';
    const directors = (details.directors || []).join(', ');
    document.getElementById('detailsDirectorsText').textContent = directors || 'Não informado';

    // Badge de cinema CAM se for recente
    const cinemaBadge = document.getElementById('detailsCinemaBadge');
    if (cinemaBadge) {
      cinemaBadge.style.display = 'none';
      if (mediaType === 'movie' && details.release_date) {
        try {
          const relDate = new Date(details.release_date);
          const now = new Date();
          const diffDays = (now - relDate) / (1000 * 60 * 60 * 24);
          if (diffDays < 75) {
            cinemaBadge.style.display = 'block';
          }
        } catch (e) {}
      }
    }

    // Botão Voltar
    const backBtn = document.getElementById('detailsViewBackBtn');
    backBtn.onclick = () => {
      detailsView.style.display = 'none';
      this.switchTab(this.currentTab || 'home');
    };

    // Botão Trailer Oficial
    const trailerBtn = document.getElementById('detailsTrailerBtn');
    if (details.trailer_key) {
      trailerBtn.style.display = 'inline-flex';
      trailerBtn.onclick = () => {
        this.openTrailerModal(details.trailer_key, title);
      };
    } else {
      trailerBtn.style.display = 'none';
    }

    // Botão Favorito / Minha Lista
    const favBtn = document.getElementById('detailsFavBtn');
    const favBtnTop = document.getElementById('detailsViewFavBtnTop');
    const updateFavUi = (isFav) => {
      const text = isFav ? '✓ Na Minha Lista' : '➕ Minha Lista';
      favBtn.innerHTML = `<span>${isFav ? '✓' : '➕'}</span> ${isFav ? 'Na Minha Lista' : 'Minha Lista'}`;
      if (favBtnTop) favBtnTop.textContent = text;
    };

    // Checa se já é favorito
    let isFavorite = false;
    if (this.currentProfile) {
      const favs = await API.getFavorites(this.currentProfile.id);
      isFavorite = favs.some(f => String(f.media_id) === String(tmdbId));
      updateFavUi(isFavorite);
    }

    const toggleFavAction = async () => {
      if (!this.currentProfile) return;
      const res = await API.toggleFavorite({
        profile_id: this.currentProfile.id,
        media_id: String(tmdbId),
        media_type: mediaType,
        title: title,
        poster_path: details.poster_path,
        vote_average: details.vote_average
      });
      updateFavUi(res.is_favorite);
    };

    favBtn.onclick = toggleFavAction;
    if (favBtnTop) favBtnTop.onclick = toggleFavAction;

    // Botão Alternar Servidores
    const sourcesSec = document.getElementById('detailsSourcesSection');
    const toggleSourcesBtn = document.getElementById('detailsToggleSourcesBtn');
    toggleSourcesBtn.onclick = async () => {
      if (sourcesSec.style.display === 'block') {
        sourcesSec.style.display = 'none';
      } else {
        sourcesSec.style.display = 'block';
        this.loadSourcesList(mediaType, tmdbId, currentSeason, currentEpisode, title, details);
        sourcesSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Elenco Principal (Cast)
    const castGrid = document.getElementById('detailsCastGrid');
    castGrid.innerHTML = '';
    const mainCast = details.main_cast || [];
    if (mainCast.length > 0) {
      document.getElementById('detailsCastSection').style.display = 'block';
      mainCast.forEach(actor => {
        const castCard = document.createElement('div');
        castCard.className = 'cast-card';
        const photoUrl = actor.profile_path 
          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
          : 'https://images.placeholders.dev/?width=150&height=150&text=Sem+Foto&theme=dark';

        castCard.innerHTML = `
          <img class="cast-photo" src="${photoUrl}" alt="${actor.name}" loading="lazy" />
          <div class="cast-name">${actor.name}</div>
          <div class="cast-character">${actor.character || ''}</div>
        `;
        castGrid.appendChild(castCard);
      });
    } else {
      document.getElementById('detailsCastSection').style.display = 'none';
    }

    // Séries: Temporadas & Episódios
    const tvSec = document.getElementById('detailsTvSection');
    const seasonSelect = document.getElementById('detailsSeasonDropdown');
    const episodesGrid = document.getElementById('detailsEpisodesGrid');

    let currentSeason = opts.season || 1;
    let currentEpisode = opts.episode || 1;

    if (mediaType === 'tv' && details.seasons) {
      tvSec.style.display = 'block';
      seasonSelect.innerHTML = '';
      details.seasons.filter(s => s.season_number > 0).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.season_number;
        opt.textContent = `${s.name} (${s.episode_count} episódios)`;
        if (s.season_number === currentSeason) opt.selected = true;
        seasonSelect.appendChild(opt);
      });

      const loadEpisodes = async (seasonNum) => {
        episodesGrid.innerHTML = '<p style="color:#888; font-size:14px; padding:20px;">Carregando episódios...</p>';
        const sData = await API.getSeasonDetails(tmdbId, seasonNum);
        episodesGrid.innerHTML = '';
        (sData?.episodes || []).forEach(ep => {
          const epRow = document.createElement('div');
          epRow.className = 'episode-card';
          epRow.setAttribute('tabindex', '0');
          const epThumb = ep.still_path 
            ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
            : poster;

          epRow.innerHTML = `
            <img class="episode-thumb" src="${epThumb}" alt="${ep.name}" loading="lazy" />
            <div class="episode-info">
              <div class="episode-title-row">
                <span class="episode-number">EP ${ep.episode_number}</span>
                <span class="episode-name">${ep.name}</span>
                <span class="episode-time">${ep.runtime ? `${ep.runtime} min` : ''}</span>
              </div>
              <p class="episode-desc">${ep.overview || 'Sem sinopse disponível.'}</p>
            </div>
            <button class="btn btn-primary btn-sm" style="align-self:center;">▶ Assistir</button>
          `;

          epRow.onclick = () => {
            currentSeason = seasonNum;
            currentEpisode = ep.episode_number;
            this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, ep.name);
          };
          epRow.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') epRow.click();
          });

          episodesGrid.appendChild(epRow);
        });
      };

      seasonSelect.onchange = (e) => loadEpisodes(e.target.value);
      loadEpisodes(currentSeason);
    } else {
      tvSec.style.display = 'none';
    }

    // Títulos Semelhantes & Recomendações
    const recs = (details.recommendations?.results || details.similar?.results || []).filter(r => r.poster_path || r.backdrop_path);
    const similarSec = document.getElementById('detailsSimilarSection');
    const similarCarousel = document.getElementById('detailsSimilarCarousel');

    if (recs.length > 0) {
      similarSec.style.display = 'block';
      similarCarousel.innerHTML = '';
      recs.forEach(rec => {
        const rTitle = rec.title || rec.name;
        const rDate = rec.release_date || rec.first_air_date || '';
        const rYear = rDate ? rDate.split('-')[0] : '';
        const rRating = rec.vote_average ? rec.vote_average.toFixed(1) : '';

        const card = document.createElement('div');
        card.className = 'media-card';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${rec.poster_path}" alt="${rTitle}" loading="lazy" />
          <div class="media-card-info">
            <div class="media-card-title">${rTitle}</div>
            <div class="media-card-sub">
              <span>${rYear}</span>
              <span class="card-rating">★ ${rRating}</span>
            </div>
          </div>
        `;
        card.onclick = () => {
          this.openMediaDetails(mediaType, rec.id);
        };
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') card.click();
        });
        similarCarousel.appendChild(card);
      });
    } else {
      similarSec.style.display = 'none';
    }

    // Botão Principal: Assistir Agora
    const playBtn = document.getElementById('detailsPlayBtn');
    playBtn.onclick = () => {
      this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, null, opts.resumeTime);
    };

    if (opts.autoPlay) {
      this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, null, opts.resumeTime);
    }
  }

  async loadSourcesList(mediaType, tmdbId, season, episode, title, details) {
    const grid = document.getElementById('detailsSourcesGrid');
    grid.innerHTML = '<p style="color:#888;">Resolvendo servidores de alta velocidade...</p>';

    const res = await API.resolveStreams(mediaType, tmdbId, season, episode);
    const streams = res?.streams || [];
    const hevcSupported = this.player ? this.player.isHevcSupported() : false;

    grid.innerHTML = '';
    if (streams.length === 0) {
      grid.innerHTML = '<p style="color:#888;">Nenhum servidor direto encontrado para este título no momento.</p>';
      return;
    }

    streams.forEach(s => {
      const card = document.createElement('div');
      card.className = 'source-card';
      let qLabel = s.quality || 'HD 1080p';
      if (!hevcSupported && qLabel.includes('4K')) {
        qLabel += ' ⚠️ (Requer TV/HEVC)';
      }
      card.innerHTML = `
        <div class="source-info-col">
          <div class="source-quality-badge">${qLabel}</div>
          <div class="source-audio-text">${s.audio || 'Português'}</div>
          <div class="source-server-name">${s.provider || 'HomeFlix Direct CDN'}</div>
        </div>
        <button class="btn btn-primary btn-sm">▶ Reproduzir nesta Fonte</button>
      `;
      card.onclick = () => {
        this.player.play({
          mediaId: tmdbId,
          mediaType: mediaType,
          title: title,
          poster: details.poster_path,
          backdrop: details.backdrop_path,
          season: season,
          episode: episode,
          streams: streams,
          currentStreamUrl: s.url,
          isCinema: s.is_cinema
        });
      };
      grid.appendChild(card);
    });
  }

  openTrailerModal(youtubeKey, title) {
    const modal = document.getElementById('trailerModal');
    const container = document.getElementById('trailerIframeContainer');
    const titleEl = document.getElementById('trailerTitle');

    titleEl.textContent = `Trailer Oficial — ${title}`;
    container.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0&modestbranding=1" 
        title="Trailer" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;

    modal.classList.add('open');
  }

  async fetchAndPlay(mediaType, tmdbId, title, details, season = 1, episode = 1, epTitle = null, resumeTime = 0) {
    const playBtn = document.getElementById('detailsPlayBtn');
    if (playBtn) playBtn.innerHTML = '<span>⏳</span> Conectando ao melhor servidor...';

    const resolved = await API.resolveStreams(mediaType, tmdbId, season, episode);
    if (playBtn) playBtn.innerHTML = '<span>▶</span> Assistir Agora';

    const streams = resolved?.streams || [];
    let bestStream = resolved?.best_stream || (streams.length > 0 ? streams[0] : null);
    const isCinema = !!resolved?.is_cinema_version || (bestStream && bestStream.is_cinema);

    if (!bestStream) {
      alert('Nenhuma fonte de reprodução encontrada no momento para este título.');
      return;
    }

    // Se o navegador não suporta HEVC (ex: Chrome sem codec ou Linux), evita auto-selecionar 4K que causa tela preta
    const canPlayHevc = this.player ? this.player.isHevcSupported() : false;
    if (!canPlayHevc && bestStream.quality && bestStream.quality.includes('4K')) {
      const compatible1080 = streams.find(s => !s.quality.includes('4K') && s.audio === bestStream.audio)
                          || streams.find(s => !s.quality.includes('4K'));
      if (compatible1080) {
        console.log('[HomeFlix] 4K HEVC não suportado nativamente neste navegador. Auto-selecionando 1080p compatível:', compatible1080.label);
        bestStream = compatible1080;
      }
    }

    // Fecha o modal e inicia o player instantaneamente
    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal) detailsModal.classList.remove('open');

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

  /* ================================================================
     TV AO VIVO (CATÁLOGO & PLAYER FULLSCREEN COM SIDEBAR)
     ================================================================ */

  async loadLiveTv() {
    const pillsContainer = document.getElementById('liveCategoryPills');
    const channelsGrid = document.getElementById('liveChannelsGrid');

    if (this.channels.length === 0) {
      channelsGrid.innerHTML = '<p style="color:#888; padding:40px 0; text-align:center;">Carregando 179 canais ao vivo...</p>';
      const res = await API.getLiveChannels();
      this.channels = res?.channels || [];
      this.categories = res?.categories || ['Todos'];
    }

    // Botão de abrir modo TV Fullscreen
    const startLiveBtn = document.getElementById('startLivePlayerBtn');
    if (startLiveBtn) {
      startLiveBtn.onclick = () => {
        if (this.channels.length > 0) {
          const first = this.channels[0];
          this.player.play({
            mediaId: `live_${first.id}`,
            mediaType: 'live',
            title: first.name,
            episodeTitle: first.current_show,
            isLive: true,
            channel: first,
            liveChannels: this.channels,
            streams: [{ quality: 'HD 1080p', audio: 'Português', url: first.stream_url }],
            currentStreamUrl: first.stream_url
          });
          this.player.toggleSidebar(true);
        }
      };
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
      card.setAttribute('tabindex', '0');
      
      const bgImg = ch.featured_image || 'https://images.pluto.tv/channels/5f120e94a5714d00074576a1/featuredImage.jpg';
      const logoHtml = ch.logo
        ? `<img class="channel-logo-img" src="${ch.logo}" alt="${ch.name}" loading="lazy" />`
        : `<span style="font-weight:900; font-size:14px; color:#fff;">${ch.name}</span>`;

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

      const playChannel = () => {
        this.player.play({
          mediaId: `live_${ch.id}`,
          mediaType: 'live',
          title: ch.name,
          episodeTitle: ch.current_show,
          isLive: true,
          channel: ch,
          liveChannels: this.channels,
          streams: [{ quality: 'HD 1080p', audio: 'Português', url: ch.stream_url }],
          currentStreamUrl: ch.stream_url
        });
      };

      card.onclick = playChannel;
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') playChannel();
      });

      channelsGrid.appendChild(card);
    });
  }

  /* ================================================================
     BUSCA & MINHA LISTA
     ================================================================ */

  async loadWatchlist() {
    if (!this.currentProfile) return;
    const heroSection = document.getElementById('heroSection');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const searchContainer = document.getElementById('searchContainer');
    const detailsView = document.getElementById('detailsView');

    heroSection.style.display = 'none';
    sectionsContainer.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const grid = document.getElementById('searchGrid');
    titleEl.textContent = `Minha Lista — ${this.currentProfile.name}`;
    grid.innerHTML = '';

    const items = await API.getFavorites(this.currentProfile.id);
    if (items.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1; padding:40px 0; text-align:center;">Sua lista está vazia. Adicione filmes e séries clicando no botão "Minha Lista" nos detalhes do título.</p>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0');
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
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });
      grid.appendChild(card);
    });
  }

  async searchMedia(query) {
    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');
    const detailsView = document.getElementById('detailsView');

    heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    sectionsContainer.style.display = 'none';
    liveTvContainer.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const grid = document.getElementById('searchGrid');
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) searchBackBtn.style.display = 'inline-block';

    titleEl.textContent = `Resultados para "${query}"`;
    grid.innerHTML = '<p style="color:#888; grid-column:1/-1; text-align:center; padding:30px;">Pesquisando no catálogo mundial...</p>';

    const results = await API.search(query);
    grid.innerHTML = '';

    if (results.length === 0) {
      grid.innerHTML = '<p style="color:#888; grid-column:1/-1; padding:40px 0; text-align:center;">Nenhum título encontrado com este termo.</p>';
      return;
    }

    results.forEach(item => {
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '';

      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0');
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
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });
      grid.appendChild(card);
    });
  }

  setupModals() {
    // Fechar Trailer
    const trailerCloseBtn = document.getElementById('trailerCloseBtn');
    if (trailerCloseBtn) {
      trailerCloseBtn.onclick = () => {
        const modal = document.getElementById('trailerModal');
        const container = document.getElementById('trailerIframeContainer');
        modal.classList.remove('open');
        container.innerHTML = '';
      };
    }

    // Fechar Perfis
    const profileCloseBtn = document.getElementById('profileCloseBtn');
    if (profileCloseBtn) {
      profileCloseBtn.onclick = () => {
        document.getElementById('profileModal').classList.remove('open');
      };
    }

    // Botão Adicionar Perfil
    const createBtn = document.getElementById('createNewProfileBtn');
    if (createBtn) {
      createBtn.onclick = () => {
        this.showProfileForm(null);
      };
    }

    // Cancelar Perfil Form
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    if (cancelProfileBtn) {
      cancelProfileBtn.onclick = () => {
        this.openProfileModal();
      };
    }

    // Salvar Perfil (Criar ou Atualizar)
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.onclick = async () => {
        const nameInput = document.getElementById('profileFormNameInput');
        const name = nameInput.value.trim();
        if (!name) {
          alert('Por favor digite um nome para o perfil.');
          return;
        }

        if (this.editingProfileId) {
          // Atualiza perfil existente
          const res = await API.updateProfile(this.editingProfileId, name, this.selectedAvatar);
          if (res?.profile) {
            const idx = this.profiles.findIndex(p => p.id === this.editingProfileId);
            if (idx >= 0) this.profiles[idx] = res.profile;
            if (this.currentProfile?.id === this.editingProfileId) {
              this.currentProfile = res.profile;
              window.currentProfile = res.profile;
              this.updateProfileUI();
            }
          }
        } else {
          // Cria novo perfil
          const res = await API.createProfile(name, this.selectedAvatar);
          if (res?.profile) {
            this.profiles.push(res.profile);
            this.currentProfile = res.profile;
            window.currentProfile = res.profile;
            localStorage.setItem('homeflix_active_profile', res.profile.id);
            this.updateProfileUI();
          }
        }

        this.openProfileModal();
        this.loadContinueWatching();
        this.loadRecommendations();
      };
    }

    // Excluir Perfil
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');
    if (deleteProfileBtn) {
      deleteProfileBtn.onclick = async () => {
        if (!this.editingProfileId) return;
        if (confirm('Tem certeza que deseja excluir este perfil? Todos os favoritos e histórico serão apagados.')) {
          await API.deleteProfile(this.editingProfileId);
          this.profiles = this.profiles.filter(p => p.id !== this.editingProfileId);
          if (this.currentProfile?.id === this.editingProfileId) {
            this.currentProfile = this.profiles[0] || null;
            window.currentProfile = this.currentProfile;
            if (this.currentProfile) localStorage.setItem('homeflix_active_profile', this.currentProfile.id);
            this.updateProfileUI();
          }
          this.openProfileModal();
        }
      };
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new HomeFlixApp();
});
