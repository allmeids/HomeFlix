// Garantir título oficial e renovação ativa de favicon na aba
document.title = 'HOMEFLIX';
try {
  const _favLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
  _favLink.type = 'image/png';
  _favLink.rel = 'shortcut icon';
  _favLink.href = '/static/icons/favicon-32x32.png?v=' + Date.now();
  document.head.appendChild(_favLink);
} catch (e) {}

const CATALOG_AVATARS = [
  { id: 'wednesday', name: 'Wandinha Addams', img: '/static/avatars/wednesday.png' },
  { id: 'enid', name: 'Enid Sinclair', img: '/static/avatars/enid.png' },
  { id: 'thing', name: 'Mãozinha (Thing)', img: '/static/avatars/thing.png' },
  { id: 'eleven', name: 'Eleven (Stranger Things)', img: '/static/avatars/eleven.png' },
  { id: 'dustin', name: 'Dustin Henderson', img: '/static/avatars/dustin.png' },
  { id: 'eddie', name: 'Eddie Munson', img: '/static/avatars/eddie.png' },
  { id: 'steve', name: 'Steve Harrington', img: '/static/avatars/steve.png' },
  { id: 'hopper', name: 'Jim Hopper', img: '/static/avatars/hopper.png' },
  { id: 'gihun', name: 'Seong Gi-hun (Round 6)', img: '/static/avatars/gihun.png' },
  { id: 'frontman', name: 'Líder Mascarado (Round 6)', img: '/static/avatars/frontman.png' },
  { id: 'masked_soldier', name: 'Soldado Mascarado (Round 6)', img: '/static/avatars/masked_soldier.png' },
  { id: 'younghee', name: 'Boneca Batatinha 123', img: '/static/avatars/younghee.png' },
  { id: 'dali_mask', name: 'Máscara de Dalí', img: '/static/avatars/dali_mask.png' },
  { id: 'professor', name: 'Professor (La Casa de Papel)', img: '/static/avatars/professor.png' },
  { id: 'berlin', name: 'Berlim (La Casa de Papel)', img: '/static/avatars/berlin.png' },
  { id: 'geralt', name: 'Geralt de Rívia (The Witcher)', img: '/static/avatars/geralt.png' },
  { id: 'ciri', name: 'Ciri (The Witcher)', img: '/static/avatars/ciri.png' },
  { id: 'yennefer', name: 'Yennefer de Vengerberg', img: '/static/avatars/yennefer.png' },
  { id: 'jinx', name: 'Jinx (Arcane)', img: '/static/avatars/jinx.png' },
  { id: 'vi', name: 'Vi (Arcane)', img: '/static/avatars/vi.png' },
  { id: 'luffy', name: 'Luffy (One Piece)', img: '/static/avatars/luffy.png' },
  { id: 'zoro', name: 'Zoro (One Piece)', img: '/static/avatars/zoro.png' }
];

const ONBOARDING_TITLES = [
  { id: 'action', title: 'Ação & Aventura', genre: 'action', poster: 'https://image.tmdb.org/t/p/w300/gh4cZbhZxyTbgxQPxD0dOudNPTn.jpg' },
  { id: 'animes', title: 'Animes & Sagas', genre: 'anime_sagas,animes', poster: 'https://image.tmdb.org/t/p/w300/kbkuYkaFsDwL6cyMgnBf77LczEo.jpg' },
  { id: 'superheroes', title: 'Heróis Marvel & DC', genre: 'superheroes', poster: 'https://image.tmdb.org/t/p/w300/74xTEgt7R36Fpooo50r9T25onhq.jpg' },
  { id: 'scifi', title: 'Ficção Científica', genre: 'scifi', poster: 'https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg' },
  { id: 'comedy', title: 'Comédia', genre: 'comedy', poster: 'https://image.tmdb.org/t/p/w300/wxeqfC221YMptRRdzxlijAh7q8l.jpg' },
  { id: 'horror', title: 'Terror & Suspense', genre: 'horror,thriller', poster: 'https://image.tmdb.org/t/p/w300/9PFonBhy4cQy7Jz20NpMygczOkv.jpg' },
  { id: 'family', title: 'Animação & Família', genre: 'family', poster: 'https://image.tmdb.org/t/p/w300/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg' },
  { id: 'series', title: 'Séries Viciantes', genre: 'popular_series', poster: 'https://image.tmdb.org/t/p/w300/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
  { id: 'top_rated', title: 'Clássicos & Cults', genre: 'top_rated', poster: 'https://image.tmdb.org/t/p/w300/74xTEgt7R36Fpooo50r9T25onhq.jpg' }
];

class HomeFlixApp {
  constructor() {
    this.currentTab = 'home';
    this.previousTab = 'home';
    this._loadToken = 0;
    this.profiles = [];
    this.currentProfile = null;
    this.heroItem = null;
    this.heroItems = [];
    this.heroCurrentIndex = 0;
    this.heroTimer = null;
    this.channels = [];
    this.categories = [];
    this.selectedLiveCategory = 'Todos';
    this.selectedAvatar = 'spiderman';
    this.editingProfileId = null;

    this.avatarCatalog = null;
    this.avatarMap = new Map();
    this.loadAvatarCatalog();

    this.currentCategory = 'action';
    this.categoryPage = 1;
    this.allCategoriesList = [];
    this.categoryLoading = false;

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
    this.loadHome();

    // Se já havia um perfil selecionado anteriormente nesta máquina/navegador, retoma diretamente
    const savedProfileId = localStorage.getItem('homeflix_active_profile');
    const matchedProfile = savedProfileId ? this.profiles.find(p => String(p.id) === String(savedProfileId)) : null;

    if (matchedProfile) {
      this.selectProfile(matchedProfile);
    } else {
      this.openProfileGate();
    }
  }

  setupPwa() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (const reg of regs) reg.unregister();
      });
    }
    // Suporte ao botão voltar do navegador / mouse / controle remoto
    window.addEventListener('popstate', () => {
      if (this.player && this.player.overlay && this.player.overlay.classList.contains('open')) {
        this.player.close();
        return;
      }
      const detailsView = document.getElementById('detailsView');
      if (detailsView && detailsView.style.display !== 'none') {
        detailsView.style.display = 'none';
        document.body.classList.remove('in-details-view');
        this.closeSearch();
        this.switchTab('home');
        return;
      }
      const searchContainer = document.getElementById('searchContainer');
      if (searchContainer && searchContainer.style.display !== 'none') {
        this.closeSearch();
        return;
      }
      this.switchTab('home');
    });
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

    // Logo click - Sempre retorna para o Início limpando qualquer view aberta
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
      navLogo.addEventListener('click', () => {
        const detailsView = document.getElementById('detailsView');
        if (detailsView) detailsView.style.display = 'none';
        document.body.classList.remove('in-details-view');
        this.closeSearch();
        this.switchTab('home');
      });
    }

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        const detailsView = document.getElementById('detailsView');
        if (detailsView) detailsView.style.display = 'none';
        document.body.classList.remove('in-details-view');
        if (tab === 'home') {
          this.closeSearch();
        }
        this.switchTab(tab);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          item.click();
        }
      });
    });

    // Profile button & Dropdown Menu na Topbar (Estilo Netflix / Prime Video)
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.setAttribute('tabindex', '0');
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleProfileDropdown();
      });
      profileBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          this.toggleProfileDropdown();
        }
      });
    }

    // Fecha o dropdown se clicar fora
    document.addEventListener('click', (e) => {
      const container = document.getElementById('profileMenuContainer');
      if (container && !container.contains(e.target)) {
        this.closeProfileDropdown();
      }
    });

    // Itens do Dropdown do Perfil
    const dropdownHistoryBtn = document.getElementById('dropdownHistoryBtn');
    if (dropdownHistoryBtn) {
      dropdownHistoryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeProfileDropdown();
        this.openWatchHistoryModal();
      });
    }

    const dropdownSwitchBtn = document.getElementById('dropdownSwitchProfileBtn');
    if (dropdownSwitchBtn) {
      dropdownSwitchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeProfileDropdown();
        this.openProfileModal(false, false);
      });
    }

    const dropdownManageBtn = document.getElementById('dropdownManageProfilesBtn');
    if (dropdownManageBtn) {
      dropdownManageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeProfileDropdown();
        this.openProfileModal(true, false);
      });
    }

    // Search em Tempo Real (Desktop & Mobile)
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchClearBtn = document.getElementById('mobileSearchClearBtn');
    let debounceTimer;

    const handleSearchInput = (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      if (searchInput && e.target !== searchInput) searchInput.value = e.target.value;
      if (mobileSearchInput && e.target !== mobileSearchInput) mobileSearchInput.value = e.target.value;
      if (mobileSearchClearBtn) {
        mobileSearchClearBtn.style.display = q.length > 0 ? 'inline-flex' : 'none';
      }
      if (q.length >= 2) {
        debounceTimer = setTimeout(() => this.searchMedia(q), 280);
      } else if (q.length === 0) {
        this.closeSearch();
      }
    };

    if (searchInput) searchInput.addEventListener('input', handleSearchInput);
    if (mobileSearchInput) mobileSearchInput.addEventListener('input', handleSearchInput);
    if (mobileSearchClearBtn) {
      mobileSearchClearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (mobileSearchInput) mobileSearchInput.value = '';
        mobileSearchClearBtn.style.display = 'none';
        this.closeSearch();
      });
    }

    // Botão Voltar da Busca
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) {
      searchBackBtn.onclick = () => {
        this.closeSearch();
        this.switchTab(this.previousTab && this.previousTab !== 'search' ? this.previousTab : 'home');
      };
    }

    // Configuração da Bottom Navigation Bar Mobile Oficial da Netflix
    const bottomNav = document.getElementById('netflixMobileBottomNav');
    if (bottomNav) {
      bottomNav.querySelectorAll('.nflx-bottom-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          if (tab) {
            bottomNav.querySelectorAll('.nflx-bottom-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.switchTab(tab);
          } else if (btn.id === 'bottomNavSearch') {
            bottomNav.querySelectorAll('.nflx-bottom-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.openSearchPage();
          } else if (btn.id === 'bottomNavProfile') {
            this.openProfileModal(false, false);
          }
        });
      });
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
      if (profileModal && (profileModal.classList.contains('active') || profileModal.classList.contains('open'))) {
        if (key === 'Escape' || key === 'Backspace') {
          e.preventDefault();
          const formBox = document.getElementById('profileFormBox');
          const cancelBtn = document.getElementById('cancelProfileBtn');
          const closeBtn = document.getElementById('profileCloseBtn');
          if (formBox && formBox.style.display !== 'none' && cancelBtn) {
            cancelBtn.click();
          } else if (!this.isProfileGateMode && closeBtn) {
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
    const isCategoriesTab = this.currentTab === 'categories';
    const isSearchTab = this.currentTab === 'search' || (document.getElementById('searchContainer') && document.getElementById('searchContainer').style.display !== 'none');

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
    } else if (isCategoriesTab) {
      const catPills = Array.from(document.querySelectorAll('#categoriesFilterPills .category-pill'));
      if (catPills.length) contentZones.push({ el: document.getElementById('categoriesFilterPills'), items: catPills, type: 'carousel' });

      const catCards = Array.from(document.querySelectorAll('#categoryGrid .media-card'));
      if (catCards.length) contentZones.push({ el: document.getElementById('categoryGrid'), items: catCards, type: 'grid' });

      const loadMoreBtn = document.getElementById('categoryLoadMoreBtn');
      if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
        contentZones.push({ el: document.getElementById('categoryLoadMoreBox'), items: [loadMoreBtn], type: 'row' });
      }
    } else if (isSearchTab) {
      const searchItems = Array.from(document.querySelectorAll('#searchGrid .media-card'));
      if (searchItems.length) contentZones.push({ el: document.getElementById('searchGrid'), items: searchItems, type: 'grid' });

      const similarItems = Array.from(document.querySelectorAll('#searchSimilarGrid .media-card'));
      if (similarItems.length) contentZones.push({ el: document.getElementById('searchSimilarGrid'), items: similarItems, type: 'grid' });
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

    // Sincroniza também a Bottom Navigation Bar oficial mobile
    const bottomNav = document.getElementById('netflixMobileBottomNav');
    if (bottomNav) {
      bottomNav.querySelectorAll('.nflx-bottom-nav-item').forEach(b => {
        if (b.dataset.tab === tab) {
          b.classList.add('active');
        } else if (b.dataset.tab) {
          b.classList.remove('active');
        }
      });
    }

    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const detailsView = document.getElementById('detailsView');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const searchContainer = document.getElementById('searchContainer');

    // Esconde a tela de detalhes e views dedicadas ao trocar de aba principal
    document.body.classList.remove('in-details-view');
    if (detailsView) detailsView.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (collectionsContainer) collectionsContainer.style.display = 'none';
    if (categoriesContainer) categoriesContainer.style.display = 'none';

    // Helper para aplicar transição suave nas telas
    const showWithFade = (el) => {
      if (!el) return;
      el.classList.remove('tab-view-fade');
      void el.offsetWidth; // trigger reflow
      el.classList.add('tab-view-fade');
    };

    // Aplica visibilidade e títulos estritos por aba (elimina filmes na aba de séries e vice-versa)
    this.applyTabSectionVisibility(tab);

    if (tab === 'home') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      showWithFade(heroSection);
      showWithFade(sectionsContainer);
      this.loadHome();
    } else if (tab === 'movies') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      showWithFade(heroSection);
      showWithFade(sectionsContainer);
      this.loadMoviesTab();
    } else if (tab === 'series') {
      heroSection.style.display = 'flex';
      if (categoriesBar) categoriesBar.style.display = 'block';
      sectionsContainer.style.display = 'flex';
      liveTvContainer.style.display = 'none';
      showWithFade(heroSection);
      showWithFade(sectionsContainer);
      this.loadSeriesTab();
    } else if (tab === 'live') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'block';
      showWithFade(liveTvContainer);
      this.loadLiveTv();
    } else if (tab === 'collections') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'none';
      if (collectionsContainer) {
        collectionsContainer.style.display = 'block';
        showWithFade(collectionsContainer);
      }
      this.loadCollectionsPage();
    } else if (tab === 'categories') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'none';
      if (categoriesContainer) {
        categoriesContainer.style.display = 'block';
        showWithFade(categoriesContainer);
      }
      this.loadCategoriesPage();
    } else if (tab === 'watchlist') {
      heroSection.style.display = 'none';
      if (categoriesBar) categoriesBar.style.display = 'none';
      sectionsContainer.style.display = 'none';
      liveTvContainer.style.display = 'none';
      this.loadWatchlist();
    }
  }

  applyTabSectionVisibility(tab) {
    const movieSections = [
      'superheroesSection',
      'actionMoviesSection',
      'popularMoviesSection',
      'scifiMoviesSection',
      'comedyMoviesSection',
      'horrorMoviesSection',
      'thrillerMoviesSection',
      'familyMoviesSection'
    ];
    const seriesSections = [
      'popularSeriesSection',
      'animeSagasSection',
      'animeHitsSection',
      'animesSection'
    ];

    const trendingTitle = document.getElementById('trendingTitle');
    const popularMoviesTitle = document.getElementById('popularMoviesTitle');
    const popularSeriesTitle = document.getElementById('popularSeriesTitle');
    const topMoviesTitle = document.getElementById('topMoviesTitle');
    const secTop = document.getElementById('topMoviesSection');

    const recSec = document.getElementById('recommendationsSection');

    if (tab === 'series') {
      // 1. Oculta compulsoriamente com !important e limpa HTML de todas as seções de filmes (adeus Vingadores/cinema)
      movieSections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) {
          sec.style.setProperty('display', 'none', 'important');
          const carousel = sec.querySelector('.media-carousel');
          if (carousel) carousel.innerHTML = '';
        }
      });
      // Oculta recomendações mistas da home na aba de séries
      if (recSec) recSec.style.setProperty('display', 'none', 'important');

      // 2. Exibe com !important seções de séries
      seriesSections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.style.setProperty('display', 'block', 'important');
      });
      if (secTop) secTop.style.setProperty('display', 'block', 'important');

      if (trendingTitle) trendingTitle.textContent = 'Séries em Alta no HomeFlix';
      if (popularSeriesTitle) popularSeriesTitle.textContent = 'Séries Populares';
      if (topMoviesTitle) topMoviesTitle.textContent = 'Séries Mais Bem Avaliadas';

    } else if (tab === 'movies') {
      // 1. Oculta com !important e limpa HTML de seções de séries
      seriesSections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) {
          sec.style.setProperty('display', 'none', 'important');
          const carousel = sec.querySelector('.media-carousel');
          if (carousel) carousel.innerHTML = '';
        }
      });
      // Oculta recomendações mistas na aba de filmes (filmes já têm categorias próprias)
      if (recSec) recSec.style.setProperty('display', 'none', 'important');

      // 2. Exibe seções de filmes
      movieSections.forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.style.setProperty('display', 'block', 'important');
      });
      if (secTop) secTop.style.setProperty('display', 'block', 'important');

      if (trendingTitle) trendingTitle.textContent = 'Filmes em Alta no Cinema & Streaming';
      if (popularMoviesTitle) popularMoviesTitle.textContent = 'Grandes Sucessos do Cinema';
      if (topMoviesTitle) topMoviesTitle.textContent = 'Filmes Mais Bem Avaliados';

    } else {
      // Home: todas as seções ativas, incluindo recomendações personalizadas
      if (recSec) recSec.style.setProperty('display', 'block', 'important');
      [...movieSections, ...seriesSections].forEach(id => {
        const sec = document.getElementById(id);
        if (sec) sec.style.setProperty('display', 'block', 'important');
      });
      if (secTop) secTop.style.setProperty('display', 'block', 'important');

      if (trendingTitle) trendingTitle.textContent = 'Em Alta no HomeFlix';
      if (popularMoviesTitle) popularMoviesTitle.textContent = 'Grandes Sucessos do Cinema';
      if (popularSeriesTitle) popularSeriesTitle.textContent = 'Séries Populares';
      if (topMoviesTitle) topMoviesTitle.textContent = 'Mais Bem Avaliados';
    }
  }

  /* ================================================================
     GESTÃO DE PERFIS (SQLITE)
     ================================================================ */

  async loadProfiles() {
    this.profiles = (await API.getProfiles()) || [];
    // Não entra direto no perfil de ninguém ao entrar no sistema (estilo Netflix)
    this.currentProfile = null;
    window.currentProfile = null;
    this.updateProfileUI();
  }

  async loadAvatarCatalog() {
    try {
      const res = await fetch(`/static/avatars/catalog.json?v=${Date.now()}`);
      if (res.ok) {
        this.avatarCatalog = await res.json();
        if (this.avatarCatalog && this.avatarCatalog.categories) {
          // Higienização estrita: remove qualquer menção residual de nomes externos
          this.avatarCatalog.categories.forEach(c => {
            if (c.name && /netflix/i.test(c.name)) {
              c.name = c.name.replace(/netflix/gi, '').trim() || 'Os Clássicos';
            }
          });
        }
        if (this.avatarCatalog && this.avatarCatalog.avatars) {
          this.avatarCatalog.avatars.forEach(av => {
            if (av.category_name && /netflix/i.test(av.category_name)) {
              av.category_name = av.category_name.replace(/netflix/gi, '').trim() || 'Os Clássicos';
            }
            this.avatarMap.set(av.id, av);
          });
        }
      }
    } catch (e) {
      console.warn('[HomeFlix] Falha ao carregar catalog.json de avatares:', e);
    }
  }

  async getAvatarCatalog() {
    if (this.avatarCatalog) return this.avatarCatalog;
    await this.loadAvatarCatalog();
    return this.avatarCatalog || { categories: [], avatars: CATALOG_AVATARS };
  }

  getAvatarVisual(avatarKey, name = 'P') {
    // 1. Catálogo em memória (291 avatares)
    if (this.avatarMap && this.avatarMap.has(avatarKey)) {
      const av = this.avatarMap.get(avatarKey);
      return { isImage: true, url: av.img, name: av.name };
    }
    // 2. Catálogo estático padrão
    const found = CATALOG_AVATARS.find(a => a.id === avatarKey);
    if (found) {
      return { isImage: true, url: found.img, name: found.name };
    }
    // 3. URLs absolutas ou estáticas diretas
    if (avatarKey && (avatarKey.startsWith('http') || avatarKey.startsWith('/'))) {
      return { isImage: true, url: avatarKey, name: name };
    }
    // 4. Se for ID de categoria de avatar (ex: stranger_things_eleven)
    if (avatarKey && avatarKey.includes('_') && !avatarKey.startsWith('avatar-')) {
      return { isImage: true, url: `/static/avatars/${avatarKey}.png`, name: name };
    }
    // Fallback legado de gradiente
    const palette = {
      'avatar-1': 'linear-gradient(135deg, #e50914 0%, #8b0000 100%)',
      'avatar-2': 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      'avatar-3': 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      'avatar-4': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'avatar-5': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'avatar-6': 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      'avatar-7': 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
      'avatar-8': 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
    };
    const initial = (name || 'P').trim().charAt(0).toUpperCase();
    const bg = palette[avatarKey] || palette['avatar-1'];
    return { isImage: false, initial, bg, name };
  }

  updateProfileUI() {
    const avatarEl = document.getElementById('navProfileAvatar');
    const nameEl = document.getElementById('navProfileName');
    if (this.currentProfile) {
      const visual = this.getAvatarVisual(this.currentProfile.avatar, this.currentProfile.name);
      if (avatarEl) {
        if (visual.isImage) {
          avatarEl.textContent = '';
          avatarEl.style.background = `url('${visual.url}') center/cover no-repeat`;
          avatarEl.style.borderRadius = '50%';
          avatarEl.style.border = '2px solid rgba(255,255,255,0.4)';
        } else {
          avatarEl.textContent = visual.initial;
          avatarEl.style.background = visual.bg;
          avatarEl.style.color = '#fff';
          avatarEl.style.fontWeight = '800';
          avatarEl.style.borderRadius = '4px';
          avatarEl.style.border = 'none';
        }
        avatarEl.style.display = 'inline-flex';
        avatarEl.style.alignItems = 'center';
        avatarEl.style.justifyContent = 'center';
        avatarEl.style.width = '26px';
        avatarEl.style.height = '26px';
        avatarEl.style.fontSize = '12px';
      }
      if (nameEl) nameEl.textContent = this.currentProfile.name || 'Perfil';

      const bottomAvatar = document.getElementById('bottomNavAvatarImg');
      if (bottomAvatar) {
        if (visual.isImage) {
          bottomAvatar.style.backgroundImage = `url('${visual.url}')`;
          bottomAvatar.textContent = '';
        } else {
          bottomAvatar.style.background = visual.bg;
          bottomAvatar.textContent = visual.initial;
          bottomAvatar.style.color = '#fff';
          bottomAvatar.style.display = 'flex';
          bottomAvatar.style.alignItems = 'center';
          bottomAvatar.style.justifyContent = 'center';
          bottomAvatar.style.fontSize = '11px';
        }
      }

      const recTitle = document.getElementById('recommendationsTitle');
      if (recTitle) {
        recTitle.textContent = `Recomendados para Você, ${this.currentProfile.name}`;
      }
    } else {
      if (avatarEl) {
        avatarEl.textContent = 'P';
        avatarEl.style.background = '#333';
        avatarEl.style.color = '#fff';
        avatarEl.style.fontWeight = '700';
        avatarEl.style.border = 'none';
      }
      if (nameEl) nameEl.textContent = 'Entrar';
    }
  }

  toggleProfileDropdown() {
    const menu = document.getElementById('profileDropdownMenu');
    const btn = document.getElementById('profileBtn');
    if (!menu) return;

    if (menu.style.display === 'block') {
      this.closeProfileDropdown();
    } else {
      this.renderDropdownProfiles();
      menu.style.display = 'block';
      if (btn) btn.classList.add('menu-open');
    }
  }

  closeProfileDropdown() {
    const menu = document.getElementById('profileDropdownMenu');
    const btn = document.getElementById('profileBtn');
    if (menu) menu.style.display = 'none';
    if (btn) btn.classList.remove('menu-open');
  }

  async renderDropdownProfiles() {
    const list = document.getElementById('dropdownProfilesList');
    if (!list) return;

    if (!this.profiles || this.profiles.length === 0) {
      this.profiles = (await API.getProfiles()) || [];
    }

    list.innerHTML = '';
    this.profiles.forEach(p => {
      const isCurrent = this.currentProfile && String(p.id) === String(this.currentProfile.id);
      const visual = this.getAvatarVisual(p.avatar, p.name);

      const item = document.createElement('div');
      item.className = `dropdown-profile-item ${isCurrent ? 'active' : ''}`;
      
      const avatarHtml = visual.isImage 
        ? `<div class="dropdown-profile-avatar" style="background: url('${visual.url}') center/cover no-repeat;"></div>`
        : `<div class="dropdown-profile-avatar" style="background: ${visual.bg}; color: #fff;">${visual.initial}</div>`;

      item.innerHTML = `
        ${avatarHtml}
        <span class="dropdown-profile-name">${p.name}</span>
        ${isCurrent ? '<span class="dropdown-profile-check">✓</span>' : ''}
      `;

      item.onclick = (e) => {
        e.stopPropagation();
        this.closeProfileDropdown();
        if (!isCurrent) {
          this.selectProfile(p);
        }
      };

      list.appendChild(item);
    });
  }

  openProfileGate() {
    this.openProfileModal(false, true);
  }

  selectProfile(p) {
    this.currentProfile = p;
    window.currentProfile = p;
    localStorage.setItem('homeflix_active_profile', p.id);
    this.updateProfileUI();

    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
    this.isProfileGateMode = false;

    // Se o perfil ainda não realizou o onboarding (gostos favoritos estilo Netflix), exibe o modal
    if (!p.onboarded) {
      this.openOnboardingModal(p);
    }

    // Carrega o conteúdo personalizado do perfil escolhido
    this.loadContinueWatching();
    this.loadRecommendations();

    // Rota direta e obrigatória para a Home 2026 oficial ao selecionar o perfil
    this.switchTab('home');
    this.loadHome();
  }

  async openProfileModal(isManageMode = false, isGateMode = false) {
    this.isProfileGateMode = isGateMode;
    this.isManageMode = isManageMode;
    const modal = document.getElementById('profileModal');
    const selectView = document.getElementById('profileSelectView');
    const editView = document.getElementById('profileEditView');
    const avatarPickerView = document.getElementById('profileAvatarPickerView');
    const grid = document.getElementById('profileModalGrid');
    const closeBtn = document.getElementById('profileCloseBtn');
    const heading = document.getElementById('profileModalHeading');
    const manageBtn = document.getElementById('manageProfilesToggleBtn');

    if (!modal || !grid) return;

    // Garante que a tela comece na lista de perfis
    if (selectView) selectView.style.display = 'flex';
    if (editView) editView.style.display = 'none';
    if (avatarPickerView) avatarPickerView.style.display = 'none';

    // Botão Fechar/Voltar (só exibido se já estiver logado e não for portão inicial)
    if (closeBtn) {
      closeBtn.style.display = (this.currentProfile && !isGateMode) ? 'block' : 'none';
      closeBtn.onclick = () => {
        modal.classList.remove('open');
        modal.style.display = 'none';
      };
    }

    // Título oficial Netflix
    if (heading) {
      heading.textContent = isManageMode ? 'Gerenciar perfis:' : 'Quem está assistindo?';
    }

    // Botão inferior oficial Netflix
    if (manageBtn) {
      manageBtn.textContent = isManageMode ? 'Concluído' : 'Gerenciar perfis';
      manageBtn.className = isManageMode ? 'btn-outline-netflix done-btn' : 'btn-outline-netflix';
      manageBtn.onclick = () => {
        this.openProfileModal(!isManageMode, isGateMode);
      };
    }

    if (!this.profiles || this.profiles.length === 0) {
      grid.innerHTML = '<div style="color:#aaa; padding:20px; text-align:center;">Carregando perfis...</div>';
      this.profiles = (await API.getProfiles()) || [];
    }

    grid.innerHTML = '';
    if (this.profiles.length === 0) {
      this.showProfileForm(null);
      modal.style.display = 'flex';
      modal.classList.add('open');
      return;
    }

    this.profiles.forEach(p => {
      const isCurrent = this.currentProfile && String(p.id) === String(this.currentProfile.id);
      const visual = this.getAvatarVisual(p.avatar, p.name);
      const card = document.createElement('div');
      card.className = `profile-card ${isManageMode ? 'manage-mode' : ''} ${isCurrent ? 'active' : ''}`;
      card.setAttribute('tabindex', '0');
      
      const pencilOverlayHtml = isManageMode ? `
        <div class="profile-manage-pencil-overlay">
          <div class="profile-pencil-circle">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path fill="#ffffff" fill-rule="evenodd" d="M19.121 1.707a3 3 0 0 0-4.242 0l-1.586 1.586-.707.707-11 11A2 2 0 0 0 1 16.414V21a2 2 0 0 0 2 2h4.586A2 2 0 0 0 9 22.414l11-11 .707-.707 1.586-1.586a3 3 0 0 0 0-4.242zM15.586 7 14 5.414l-11 11V19a2 2 0 0 1 2 2h2.586l11-11L17 8.414 6.707 18.707l-1.414-1.414zm.707-3.879a1 1 0 0 1 1.414 0l3.172 3.172a1 1 0 0 1 0 1.414L20 8.586 15.414 4z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      ` : '';

      const avatarContent = visual.isImage 
        ? `<div class="profile-avatar-large" style="background: url('${visual.url}') center/cover no-repeat;">
             ${pencilOverlayHtml}
           </div>`
        : `<div class="profile-avatar-large" style="background: ${visual.bg}; color: #ffffff; font-family: 'Inter', sans-serif; font-weight: 800;">
             <span>${visual.initial}</span>
             ${pencilOverlayHtml}
           </div>`;

      card.innerHTML = `
        ${avatarContent}
        <div class="profile-name-large">${p.name}</div>
      `;

      const onSelect = () => {
        if (isManageMode) {
          this.showProfileForm(p);
        } else {
          this.selectProfile(p);
        }
      };

      card.onclick = onSelect;
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onSelect();
      });

      grid.appendChild(card);
    });

    if (!isManageMode && this.profiles.length < 6) {
      const addCard = document.createElement('div');
      addCard.className = 'profile-card profile-card-add';
      addCard.setAttribute('tabindex', '0');
      addCard.innerHTML = `
        <div class="profile-avatar-large">
          <div class="add-icon-circle">+</div>
        </div>
        <div class="profile-name-large">Adicionar perfil</div>
      `;
      addCard.onclick = () => this.showProfileForm(null);
      addCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.showProfileForm(null);
      });
      grid.appendChild(addCard);
    }

    modal.style.display = 'flex';
    modal.classList.add('open');

    // Auto-focus no primeiro perfil
    setTimeout(() => {
      const firstCard = grid.querySelector('.profile-card');
      if (firstCard) firstCard.focus();
    }, 80);
  }

  async showProfileForm(profileToEdit = null) {
    const selectView = document.getElementById('profileSelectView');
    const editView = document.getElementById('profileEditView');
    const avatarPickerView = document.getElementById('profileAvatarPickerView');
    const titleEl = document.getElementById('profileEditTitle');
    const nameInput = document.getElementById('profileFormNameInput');
    const deleteBtn = document.getElementById('deleteProfileBtn');
    const previewEl = document.getElementById('profileAvatarPreview');
    const avatarTrigger = document.getElementById('profileAvatarEditTrigger');
    const avatarPickerBackBtn = document.getElementById('avatarPickerBackBtn');

    if (selectView) selectView.style.display = 'none';
    if (avatarPickerView) avatarPickerView.style.display = 'none';
    if (editView) editView.style.display = 'block';

    this.selectedAvatar = profileToEdit?.avatar || 'stranger_things_s1_eleven';
    this.editingProfileId = profileToEdit ? profileToEdit.id : null;

    if (profileToEdit) {
      if (titleEl) titleEl.textContent = 'Editar perfil';
      if (nameInput) nameInput.value = profileToEdit.name;
      if (deleteBtn) deleteBtn.style.display = this.profiles.length > 1 ? 'inline-block' : 'none';
    } else {
      if (titleEl) titleEl.textContent = 'Adicionar perfil';
      if (nameInput) nameInput.value = '';
      if (deleteBtn) deleteBtn.style.display = 'none';
    }

    const updatePreview = () => {
      if (!previewEl) return;
      const visual = this.getAvatarVisual(this.selectedAvatar, nameInput ? (nameInput.value || 'P') : 'P');
      if (visual.isImage) {
        previewEl.textContent = '';
        previewEl.style.background = `url('${visual.url}') center/cover no-repeat`;
      } else {
        previewEl.textContent = visual.initial;
        previewEl.style.background = visual.bg;
      }
    };
    updatePreview();

    if (nameInput) {
      nameInput.oninput = () => {
        updatePreview();
      };
    }

    // Ao clicar no avatar da tela de edição: abre o catálogo com 291 avatares
    if (avatarTrigger) {
      avatarTrigger.onclick = () => {
        this.openAvatarPickerView(updatePreview);
      };
    }

    if (avatarPickerBackBtn) {
      avatarPickerBackBtn.onclick = () => {
        if (avatarPickerView) avatarPickerView.style.display = 'none';
        if (editView) editView.style.display = 'block';
      };
    }

    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 60);
  }

  async openAvatarPickerView(onAvatarSelectedCallback) {
    const editView = document.getElementById('profileEditView');
    const avatarPickerView = document.getElementById('profileAvatarPickerView');
    const sectionsContainer = document.getElementById('avatarPickerSectionsContainer');
    const profileSubtitle = document.getElementById('avatarPickerProfileSubtitle');
    const currentBadge = document.getElementById('avatarPickerCurrentBadge');
    const nameInput = document.getElementById('profileFormNameInput');

    if (editView) editView.style.display = 'none';
    if (avatarPickerView) avatarPickerView.style.display = 'flex';

    // Rola para o topo do canvas
    const gateRoot = document.getElementById('netflixProfileGate');
    if (gateRoot) gateRoot.scrollTo({ top: 0, behavior: 'instant' });

    // Atualiza o subtítulo "Para [Nome]" e o avatar atual
    const profileName = (nameInput && nameInput.value.trim()) || 'Você';
    if (profileSubtitle) profileSubtitle.textContent = `Para ${profileName}`;

    if (currentBadge) {
      const visual = this.getAvatarVisual(this.selectedAvatar, profileName);
      if (visual.isImage) {
        currentBadge.style.backgroundImage = `url('${visual.url}')`;
        currentBadge.textContent = '';
      } else {
        currentBadge.style.background = visual.bg;
        currentBadge.textContent = visual.initial;
        currentBadge.style.display = 'flex';
        currentBadge.style.alignItems = 'center';
        currentBadge.style.justifyContent = 'center';
        currentBadge.style.fontSize = '12px';
        currentBadge.style.color = '#fff';
      }
    }

    const catalog = await this.getAvatarCatalog();
    const categories = catalog.categories || [];

    const renderCardHtml = (av) => {
      const isSelected = av.id === this.selectedAvatar || av.img === this.selectedAvatar;
      return `
        <button type="button" class="nflx-avatar-item-btn ${isSelected ? 'selected' : ''}" data-id="${av.id}" title="${av.name}" aria-label="${av.name}">
          <img src="${av.img}" loading="lazy" decoding="async" class="nflx-avatar-item-img" alt="${av.name}" />
        </button>
      `;
    };

    if (sectionsContainer) {
      let html = '';
      categories.forEach(cat => {
        if (!cat.items || cat.items.length === 0) return;
        html += `
          <div class="nflx-avatar-rail" id="nflxRail_${cat.id}">
            <h2 class="nflx-avatar-rail-title">${cat.name}</h2>
            <div class="nflx-avatar-track-wrapper">
              <button type="button" class="nflx-avatar-nav-arrow prev" data-track-id="nflxTrack_${cat.id}" aria-label="Rolar para esquerda">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><path fill="currentColor" fill-rule="evenodd" d="M15.414 19.414L8.707 12.707a1 1 0 010-1.414l6.707-6.707 1.414 1.414L10.828 12l5.999 5.999-1.413 1.415z"></path></svg>
              </button>
              <div class="nflx-avatar-track" id="nflxTrack_${cat.id}">
                ${cat.items.map(av => renderCardHtml(av)).join('')}
              </div>
              <button type="button" class="nflx-avatar-nav-arrow next" data-track-id="nflxTrack_${cat.id}" aria-label="Rolar para direita">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none"><path fill="currentColor" fill-rule="evenodd" d="M8.586 4.586l6.707 6.707a1 1 0 010 1.414l-6.707 6.707-1.414-1.414L13.172 12 7.172 6.001l1.414-1.415z"></path></svg>
              </button>
            </div>
          </div>
        `;
      });
      sectionsContainer.innerHTML = html;

      sectionsContainer.onclick = (e) => {
        const itemBtn = e.target.closest('.nflx-avatar-item-btn');
        if (itemBtn) {
          const avatarId = itemBtn.dataset.id;
          if (avatarId) {
            this.selectedAvatar = avatarId;
            if (onAvatarSelectedCallback) onAvatarSelectedCallback();
            if (avatarPickerView) avatarPickerView.style.display = 'none';
            if (editView) editView.style.display = 'block';
          }
          return;
        }

        const navArrow = e.target.closest('.nflx-avatar-nav-arrow');
        if (navArrow) {
          const trackId = navArrow.dataset.trackId;
          const track = document.getElementById(trackId);
          if (track) {
            const isPrev = navArrow.classList.contains('prev');
            track.scrollBy({ left: isPrev ? -450 : 450, behavior: 'smooth' });
          }
        }
      };
    }
  }


  async loadHome(retryCount = 0) {
    const token = ++this._loadToken;
    this.applyTabSectionVisibility('home');

    // 1. Carrega o catálogo completo da Home (desduplicado pelo backend)
    const homeData = await API.getHomeCatalog();

    // Se o usuário trocou de aba enquanto baixava os dados da home, aborta imediatamente!
    if (this.currentTab !== 'home' || this._loadToken !== token) {
      console.log('[HomeFlix] Descartando carga da Home pois aba ativa agora é:', this.currentTab);
      return;
    }

    if (!homeData) {
      if (retryCount < 8) {
        console.warn(`[HomeFlix] Catálogo ainda não respondeu. Reconectando ao servidor em 1.5s (tentativa ${retryCount + 1}/8)...`);
        setTimeout(() => this.loadHome(retryCount + 1), 1500);
      } else {
        const heroTitle = document.getElementById('heroTitle');
        const heroOverview = document.getElementById('heroOverview');
        const ratingEl = document.getElementById('heroRating');
        const yearEl = document.getElementById('heroYear');
        const typeEl = document.getElementById('heroType');
        if (heroTitle) heroTitle.textContent = 'Servidor HomeFlix Offline';
        if (heroOverview) heroOverview.textContent = 'Certifique-se de que o servidor HomeFlix está em execução (execute ./start.sh ou abra pelo menu).';
        if (ratingEl) ratingEl.style.display = 'none';
        if (yearEl) yearEl.style.display = 'none';
        if (typeEl) typeEl.style.display = 'none';
      }
      return;
    }

    if (homeData.trending && homeData.trending.length > 0) {
      this.setupHeroSlideshow(homeData.trending);
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
    this.renderCarousel('animeSagasCarousel', homeData.anime_sagas || []);
    this.renderCarousel('animeHitsCarousel', homeData.anime_hits || []);
    this.renderCarousel('animesCarousel', homeData.animes || []);

    // 2. Continuar Assistindo (Quick Resume)
    await this.loadContinueWatching();

    // 3. Recomendações personalizadas
    await this.loadRecommendations();
  }

  async refreshCatalog() {
    try {
      console.log('[HomeFlix] Atualizando catálogo e novidades em segundo plano...');
      await API.refreshCatalog();
      if (this.currentTab === 'home') {
        await this.loadHome();
      } else if (this.currentTab === 'movies') {
        await this.loadMoviesTab();
      } else if (this.currentTab === 'series') {
        await this.loadSeriesTab();
      } else if (this.currentTab === 'categories') {
        await this.loadCategoriesTab();
      }
      console.log('[HomeFlix] Catálogo atualizado com sucesso.');
    } catch (err) {
      console.warn('[HomeFlix] Erro ao sincronizar catálogo em segundo plano:', err);
    }
  }

  showToast(msg, duration = 3500) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.style.cssText = 'position: fixed; bottom: 35px; left: 50%; transform: translateX(-50%); background: rgba(20, 20, 28, 0.96); border: 1px solid rgba(255, 255, 255, 0.15); color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; z-index: 99999; box-shadow: 0 10px 30px rgba(0,0,0,0.6); pointer-events: none; transition: opacity 0.3s ease; display: flex; align-items: center; gap: 8px;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
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
    const token = ++this._loadToken;
    this.applyTabSectionVisibility('movies');

    // Limpa o Hero se atualmente for uma série para não misturar no topo
    if (this.heroItem && (this.heroItem.media_type === 'tv' || !this.heroItem.title)) {
      this.pauseHeroSlideshow();
      const heroType = document.getElementById('heroType');
      if (heroType) {
        heroType.textContent = 'FILME';
        heroType.style.display = 'inline-block';
      }
    }

    try {
      const [popular, top, nowPlaying, superheroes, action] = await Promise.all([
        API.getPopularMovies(1),
        API.getTopRatedMovies(1),
        API.getNowPlaying(1),
        API.getCategoryItems('superheroes', 1),
        API.getCategoryItems('action', 1)
      ]);

      if (this.currentTab !== 'movies' || this._loadToken !== token) return;

      (popular || []).forEach(it => { it.media_type = 'movie'; });
      (top || []).forEach(it => { it.media_type = 'movie'; });
      (nowPlaying || []).forEach(it => { it.media_type = 'movie'; });

      if (popular && popular.length > 0) {
        this.setupHeroSlideshow(popular);
      }

      this.renderCarousel('trendingCarousel', popular || []);
      this.renderCarousel('popularMoviesCarousel', nowPlaying || []);
      this.renderCarousel('topMoviesCarousel', top || []);
      if (superheroes && superheroes.results) {
        this.renderCarousel('superheroesCarousel', superheroes.results);
      }
      if (action && action.results) {
        this.renderCarousel('actionMoviesCarousel', action.results);
      }
    } catch (e) {
      console.error('[HomeFlix] Erro ao carregar aba de filmes:', e);
    }
  }

  async loadSeriesTab() {
    const token = ++this._loadToken;
    this.applyTabSectionVisibility('series');

    // Limpa imediatamente o Hero se for filme (elimina banner dos Vingadores/filmes na aba de séries)
    if (this.heroItem && (this.heroItem.media_type === 'movie' || this.heroItem.title)) {
      this.pauseHeroSlideshow();
      const heroType = document.getElementById('heroType');
      if (heroType) {
        heroType.textContent = 'SÉRIE';
        heroType.style.display = 'inline-block';
      }
    }

    try {
      const [popular, top, animes, sagaAnimes, animeHits] = await Promise.all([
        API.getPopularSeries(1),
        API.getTopRatedSeries(1),
        API.getAnimes(1),
        API.getAnimeSagas(1),
        API.getAnimeHits(1)
      ]);

      if (this.currentTab !== 'series' || this._loadToken !== token) return;

      // Garante media_type 'tv' em todos os itens da aba de séries
      (popular || []).forEach(it => { it.media_type = 'tv'; });
      (top || []).forEach(it => { it.media_type = 'tv'; });
      (animes || []).forEach(it => { it.media_type = 'tv'; });
      (sagaAnimes || []).forEach(it => { it.media_type = 'tv'; });
      (animeHits || []).forEach(it => { it.media_type = 'tv'; });

      if (popular && popular.length > 0) {
        this.setupHeroSlideshow(popular);
      }

      this.renderCarousel('trendingCarousel', popular || []);
      this.renderCarousel('popularSeriesCarousel', (popular || []).slice(6));
      this.renderCarousel('topMoviesCarousel', top || []);
      this.renderCarousel('animeSagasCarousel', sagaAnimes && sagaAnimes.length ? sagaAnimes : (animes || []));
      this.renderCarousel('animeHitsCarousel', animeHits && animeHits.length ? animeHits : (animes || []));
      this.renderCarousel('animesCarousel', animes || []);
    } catch (e) {
      console.error('[HomeFlix] Erro ao carregar aba de séries:', e);
    }
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
    const secTitle = section.querySelector('.section-title');
    if (secTitle && this.currentProfile) {
      secTitle.textContent = `Continuar assistindo como ${this.currentProfile.name}`;
    }
    carousel.innerHTML = '';

    items.forEach(item => {
      const pct = item.duration > 0 ? (item.position / item.duration) * 100 : 0;
      const card = document.createElement('div');
      card.className = 'continue-netflix-card';

      // Pôster vertical oficial de alta fidelidade
      const posterImg = item.poster_path 
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : (item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : 'https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark');

      const isTv = item.media_type === 'tv';
      const labelText = isTv ? `T${item.season_number || 1}:E${item.episode_number || 1}` : 'Filme';

      card.innerHTML = `
        <div class="continue-poster-wrap">
          <img class="continue-poster-img" src="${posterImg}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';" />
          <div class="continue-center-play" title="Retomar reprodução" aria-label="Retomar">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 3.5l14 8.5-14 8.5v-17z"/></svg>
          </div>
          <div class="continue-progress-track">
            <div class="continue-progress-bar" style="width: ${Math.max(5, Math.min(100, pct))}%;"></div>
          </div>
        </div>
        <div class="continue-card-actions">
          <button type="button" class="continue-action-btn continue-action-info" title="Mais informações (${item.title})" aria-label="Informações">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" cy="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
          <button type="button" class="continue-action-btn continue-action-remove" title="Remover de Continuar Assistindo" aria-label="Remover">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;

      // Clique no pôster / play retoma a reprodução instantaneamente
      const posterWrap = card.querySelector('.continue-poster-wrap');
      if (posterWrap) {
        posterWrap.onclick = (e) => {
          e.stopPropagation();
          this.openMediaDetails(item.media_type, item.media_id, {
            resumeTime: item.position,
            season: item.season_number,
            episode: item.episode_number,
            autoPlay: true
          });
        };
      }

      // Botão (i) abre a página de detalhes completos
      const infoBtn = card.querySelector('.continue-action-info');
      if (infoBtn) {
        infoBtn.onclick = (e) => {
          e.stopPropagation();
          this.openMediaDetails(item.media_type, item.media_id, {
            resumeTime: item.position,
            season: item.season_number,
            episode: item.episode_number
          });
        };
      }

      // Botão (X) remove da lista de continuar assistindo com transição suave
      const removeBtn = card.querySelector('.continue-action-remove');
      if (removeBtn) {
        removeBtn.onclick = async (e) => {
          e.stopPropagation();
          card.classList.add('removing');
          await API.deleteProgress(this.currentProfile.id, item.media_id);
          setTimeout(() => {
            card.remove();
            if (carousel.children.length === 0) {
              section.style.display = 'none';
            }
          }, 250);
          this.showToast('Título removido de Continuar Assistindo');
        };
      }

      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          posterWrap.click();
        }
      });

      carousel.appendChild(card);
    });
  }

  setupHeroSlideshow(items) {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
    this.heroItems = (items || []).filter(it => it && (it.backdrop_path || it.poster_path)).slice(0, 6);
    if (!this.heroItems.length) return;
    this.heroCurrentIndex = 0;
    this.renderHero(this.heroItems[0], 0);

    const heroSection = document.getElementById('heroSection');
    if (heroSection && !heroSection._hasHoverListeners) {
      heroSection._hasHoverListeners = true;
      heroSection.addEventListener('mouseenter', () => this.pauseHeroSlideshow());
      heroSection.addEventListener('mouseleave', () => this.resumeHeroSlideshow());
    }

    this.resumeHeroSlideshow();
  }

  pauseHeroSlideshow() {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }

  resumeHeroSlideshow() {
    this.pauseHeroSlideshow();
    if (this.heroItems && this.heroItems.length > 1) {
      this.heroTimer = setInterval(() => {
        this.nextHeroSlide();
      }, 7500);
    }
  }

  nextHeroSlide() {
    if (!this.heroItems || !this.heroItems.length) return;
    this.heroCurrentIndex = (this.heroCurrentIndex + 1) % this.heroItems.length;
    this.renderHero(this.heroItems[this.heroCurrentIndex], this.heroCurrentIndex);
  }

  goToHeroSlide(idx) {
    if (!this.heroItems || idx < 0 || idx >= this.heroItems.length) return;
    this.heroCurrentIndex = idx;
    this.renderHero(this.heroItems[idx], idx);
    this.resumeHeroSlideshow();
  }

  renderHero(item, activeIndex = 0) {
    if (!item) return;
    this.heroItem = item;
    const hero = document.getElementById('heroSection');
    const title = item.title || item.name || 'Destaque';
    const overview = item.overview || 'Sem sinopse disponível.';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
    const date = item.release_date || item.first_air_date || '';
    const year = date ? date.split('-')[0] : '';
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

    const backdrop = item.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : `https://image.tmdb.org/t/p/original${item.poster_path}`;

    hero.style.backgroundImage = `url('${backdrop}')`;
    document.getElementById('heroTitle').textContent = title;

    const ratingEl = document.getElementById('heroRating');
    const yearEl = document.getElementById('heroYear');
    const typeEl = document.getElementById('heroType');

    if (ratingEl) {
      if (rating) {
        ratingEl.style.display = 'inline-block';
        ratingEl.textContent = `★ ${rating}`;
      } else {
        ratingEl.style.display = 'none';
      }
    }

    if (yearEl) {
      if (year) {
        yearEl.style.display = 'inline-block';
        yearEl.textContent = year;
      } else {
        yearEl.style.display = 'none';
      }
    }

    if (typeEl) {
      typeEl.style.display = 'inline-block';
      typeEl.textContent = mediaType === 'movie' ? 'FILME' : 'SÉRIE';
    }

    const maturityEl = document.getElementById('heroMaturityBadge');
    if (maturityEl) {
      maturityEl.textContent = item.adult ? 'A18' : (rating >= 7.8 ? 'A16' : 'A14');
    }

    const soundBtn = document.getElementById('heroSoundBtn');
    if (soundBtn && !soundBtn._initialized) {
      soundBtn._initialized = true;
      let isMuted = false;
      soundBtn.onclick = () => {
        isMuted = !isMuted;
        soundBtn.innerHTML = isMuted 
          ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
          : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
        soundBtn.title = isMuted ? 'Áudio desativado' : 'Áudio ativado';
      };
    }

    document.getElementById('heroOverview').textContent = overview;

    document.getElementById('heroPlayBtn').onclick = () => {
      if (this.player && typeof this.player.enterFullscreenWithOrientation === 'function') {
        this.player.enterFullscreenWithOrientation();
      }
      this.openMediaDetails(mediaType, item.id, { autoPlay: true });
    };

    document.getElementById('heroInfoBtn').onclick = () => {
      this.openMediaDetails(mediaType, item.id);
    };

    // Renderiza os dots indicadores do slideshow
    const indicators = document.getElementById('heroIndicators');
    if (indicators && this.heroItems && this.heroItems.length > 1) {
      indicators.innerHTML = '';
      this.heroItems.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `hero-dot ${idx === activeIndex ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Destaque ${idx + 1}`);
        dot.onclick = () => this.goToHeroSlide(idx);
        indicators.appendChild(dot);
      });
    } else if (indicators) {
      indicators.innerHTML = '';
    }
  }

  renderCarousel(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const section = container.closest('.media-section');

    const movieCarousels = [
      'superheroesCarousel',
      'actionMoviesCarousel',
      'popularMoviesCarousel',
      'scifiMoviesCarousel',
      'comedyMoviesCarousel',
      'horrorMoviesCarousel',
      'thrillerMoviesCarousel',
      'familyMoviesCarousel'
    ];
    const seriesCarousels = [
      'popularSeriesCarousel',
      'animeSagasCarousel',
      'animeHitsCarousel',
      'animesCarousel'
    ];

    // Se estiver na aba Séries, bloqueia categoricamente qualquer carrossel de cinema/filmes
    if (this.currentTab === 'series' && movieCarousels.includes(containerId)) {
      if (section) section.style.setProperty('display', 'none', 'important');
      container.innerHTML = '';
      return;
    }

    // Se estiver na aba Filmes, bloqueia carrosséis de séries
    if (this.currentTab === 'movies' && seriesCarousels.includes(containerId)) {
      if (section) section.style.setProperty('display', 'none', 'important');
      container.innerHTML = '';
      return;
    }

    if (!items || items.length === 0) {
      if (section) section.style.setProperty('display', 'none', 'important');
      return;
    }
    if (section) section.style.setProperty('display', 'block', 'important');
    container.innerHTML = '';

    items.forEach(item => {
      const posterPath = item.poster_path || item.backdrop_path;
      if (!posterPath) return;
      const title = item.title || item.name || '';
      const mediaType = (this.currentTab === 'series') ? 'tv' : (item.media_type || (item.first_air_date ? 'tv' : (item.title ? 'movie' : 'tv')));
      const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
      const date = item.release_date || item.first_air_date || '';
      const year = date ? date.split('-')[0] : '';

      const isUpcoming = (item.release_date && new Date(item.release_date) > new Date());
      const isInTheaters = !isUpcoming && item.release_date && (() => {
        const rd = new Date(item.release_date);
        const diff = (new Date() - rd) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 75;
      })();

      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0'); // Acessibilidade para controle remoto
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${posterPath}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';" />
        ${isUpcoming ? '<span class="card-badge-upcoming">EM BREVE</span>' : (isInTheaters ? '<span class="card-badge-cinema">NO CINEMA</span>' : '')}
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${year}</span>
            <span class="card-rating">★ ${rating}</span>
          </div>
        </div>
      `;

      card.onclick = () => this.openMediaDetails(mediaType, item.id, { title });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          this.openMediaDetails(mediaType, item.id, { title });
        }
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
    document.body.classList.add('in-details-view');
    if (heroSection) heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    if (sectionsContainer) sectionsContainer.style.display = 'none';
    if (liveTvContainer) liveTvContainer.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';

    try {
      if (!history.state || history.state.view !== 'details' || history.state.id !== tmdbId) {
        history.pushState({ view: 'details', id: tmdbId }, '');
      }
    } catch (_) {}

    // Limpa imediatamente o conteúdo do título anterior para evitar dados obsoletos em tela
    const heroBannerEl = document.getElementById('detailsHeroBanner');
    const posterImgEl = document.getElementById('detailsPosterImg');
    const mainTitleEl = document.getElementById('detailsMainTitle');
    const topTitleEl = document.getElementById('detailsViewTopTitle');
    const taglineEl = document.getElementById('detailsTagline');
    const ratingEl = document.getElementById('detailsRating');
    const yearEl = document.getElementById('detailsYear');
    const runtimeEl = document.getElementById('detailsRuntime');
    const typeBadgeEl = document.getElementById('detailsTypeBadge');
    const overviewEl = document.getElementById('detailsOverview');
    const genresEl = document.getElementById('detailsGenresText');
    const directorsEl = document.getElementById('detailsDirectorsText');
    const castGridEl = document.getElementById('detailsCastGrid');
    const castSectionEl = document.getElementById('detailsCastSection');
    const tvSectionEl = document.getElementById('detailsTvSection');
    const episodesGridEl = document.getElementById('detailsEpisodesGrid');
    const seasonSelectEl = document.getElementById('detailsSeasonDropdown');
    const cinemaBadgeEl = document.getElementById('detailsCinemaBadge');
    const upcomingNoticeEl = document.getElementById('detailsUpcomingNotice');
    const trailerBtnEl = document.getElementById('detailsTrailerBtn');
    const similarSecEl = document.getElementById('detailsSimilarSection');
    const similarCarouselEl = document.getElementById('detailsSimilarCarousel');

    const posterSkeletonEl = document.getElementById('detailsPosterSkeleton');
    const posterFallbackEl = document.getElementById('detailsPosterFallback');
    const fallbackTitleEl = document.getElementById('detailsFallbackTitle');

    if (heroBannerEl) heroBannerEl.style.backgroundImage = 'none';
    if (posterSkeletonEl) posterSkeletonEl.style.display = 'block';
    if (posterFallbackEl) posterFallbackEl.style.display = 'none';
    if (posterImgEl) {
      posterImgEl.style.opacity = '0';
      posterImgEl.removeAttribute('src');
    }
    if (mainTitleEl) mainTitleEl.textContent = opts.title || 'Carregando...';
    if (topTitleEl) topTitleEl.textContent = opts.title || 'HomeFlix';
    if (taglineEl) taglineEl.textContent = '';
    if (ratingEl) ratingEl.textContent = '★ --';
    if (yearEl) yearEl.textContent = '----';
    if (runtimeEl) runtimeEl.textContent = '';
    if (typeBadgeEl) typeBadgeEl.textContent = mediaType === 'movie' ? 'FILME' : 'SÉRIE';
    if (overviewEl) overviewEl.textContent = 'Carregando sinopse e detalhes oficiais...';
    if (genresEl) genresEl.textContent = '...';
    if (directorsEl) directorsEl.textContent = '...';
    if (castGridEl) castGridEl.innerHTML = '';
    if (castSectionEl) castSectionEl.style.display = 'none';
    if (tvSectionEl) tvSectionEl.style.display = 'none';
    if (episodesGridEl) episodesGridEl.innerHTML = '';
    if (seasonSelectEl) seasonSelectEl.innerHTML = '';
    if (cinemaBadgeEl) cinemaBadgeEl.style.display = 'none';
    if (upcomingNoticeEl) upcomingNoticeEl.style.display = 'none';
    if (trailerBtnEl) trailerBtnEl.style.display = 'none';
    if (similarSecEl) similarSecEl.style.display = 'none';
    if (similarCarouselEl) similarCarouselEl.innerHTML = '';

    detailsView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Busca detalhes completos no backend com TMDB
    const details = await API.getMediaDetails(mediaType, tmdbId);
    if (!details) {
      alert('Não foi possível carregar os detalhes do título.');
      this.switchTab(this.previousTab || 'home');
      return;
    }

    // Auto-correção de tipo se for detectada como série
    const isTvShow = mediaType === 'tv' || !!(details.number_of_seasons && details.number_of_seasons > 0) || !!(details.seasons && details.seasons.length > 0) || !!details.first_air_date;
    if (isTvShow) {
      mediaType = 'tv';
    }

    const title = details.title || details.name || opts.title || '';
    const tagline = details.tagline ? `"${details.tagline}"` : '';
    const overview = details.overview || 'Sinopse não disponível no momento.';
    const rating = details.vote_average ? details.vote_average.toFixed(1) : '8.8';
    const date = details.release_date || details.first_air_date || '';
    const year = date ? date.split('-')[0] : '2026';
    const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min por ep` : '');

    const backdrop = details.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
      : (details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : '');

    const poster = details.poster_path 
      ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
      : (details.backdrop_path ? `https://image.tmdb.org/t/p/w500${details.backdrop_path}` : null);

    // Popula Hero de Detalhes
    if (heroBannerEl && backdrop) heroBannerEl.style.backgroundImage = `url('${backdrop}')`;

    // Carregamento resiliente do pôster com fallback cinematográfico
    if (fallbackTitleEl) fallbackTitleEl.textContent = title;
    if (poster && posterImgEl) {
      posterImgEl.onload = () => {
        if (posterSkeletonEl) posterSkeletonEl.style.display = 'none';
        if (posterFallbackEl) posterFallbackEl.style.display = 'none';
        posterImgEl.style.opacity = '1';
      };
      posterImgEl.onerror = () => {
        if (posterSkeletonEl) posterSkeletonEl.style.display = 'none';
        posterImgEl.style.display = 'none';
        if (posterFallbackEl) posterFallbackEl.style.display = 'flex';
      };
      posterImgEl.style.display = 'block';
      posterImgEl.src = poster;
    } else {
      if (posterSkeletonEl) posterSkeletonEl.style.display = 'none';
      if (posterImgEl) posterImgEl.style.display = 'none';
      if (posterFallbackEl) posterFallbackEl.style.display = 'flex';
    }

    if (mainTitleEl) mainTitleEl.textContent = title;
    if (topTitleEl) topTitleEl.textContent = title;
    if (taglineEl) taglineEl.textContent = tagline;
    if (ratingEl) ratingEl.textContent = `★ ${rating}`;
    if (yearEl) yearEl.textContent = year;
    if (runtimeEl) runtimeEl.textContent = runtime;
    if (typeBadgeEl) typeBadgeEl.textContent = mediaType === 'movie' ? 'FILME' : 'SÉRIE';
    if (overviewEl) overviewEl.textContent = overview;

    // Gêneros & Direção
    const genres = (details.genres || []).map(g => g.name).join(', ');
    if (genresEl) genresEl.textContent = genres || 'Variados';
    const directors = (details.directors || []).join(', ');
    if (directorsEl) directorsEl.textContent = directors || 'Não informado';

    // Badge de cinema CAM / Em Exibição nos Cinemas
    const isInTheaters = details.is_in_theaters || (details.release_date && (() => {
      const rd = new Date(details.release_date);
      const diffDays = (new Date() - rd) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < 75;
    })());

    if (cinemaBadgeEl) {
      if (isInTheaters) {
        cinemaBadgeEl.style.display = 'flex';
        cinemaBadgeEl.innerHTML = '🎬 Em Exibição nos Cinemas';
        cinemaBadgeEl.title = 'Filme em cartaz. Transmissões online podem conter imagens gravadas de sala (CAM).';
      } else {
        cinemaBadgeEl.style.display = 'none';
      }
    }

    // Banner de Filme Ainda Não Lançado / Em Breve nos Cinemas
    const isUpcoming = details.is_unreleased || (details.release_date && new Date(details.release_date) > new Date()) || ["In Production", "Post Production", "Planned"].includes(details.status);

    if (upcomingNoticeEl) {
      if (isUpcoming) {
        upcomingNoticeEl.style.display = 'flex';
        let releaseStr = 'Em breve';
        if (details.release_date) {
          const parts = details.release_date.split('-');
          if (parts.length === 3) releaseStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        document.getElementById('detailsUpcomingHeading').textContent = `📅 Estreia nos Cinemas: ${releaseStr}`;
        document.getElementById('detailsUpcomingSub').textContent = `Este filme ainda não estreou. Assista ao trailer oficial com exclusividade!`;
      } else {
        upcomingNoticeEl.style.display = 'none';
      }
    }

    // Botão Voltar (Círculo Moderno)
    const backBtn = document.getElementById('detailsViewBackBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        detailsView.style.display = 'none';
        document.body.classList.remove('in-details-view');
        this.closeSearch();
        this.switchTab(this.previousTab || 'home');
      };
    }

    // Botão Trailer Oficial
    if (trailerBtnEl) {
      if (details.trailer_key) {
        trailerBtnEl.style.display = 'inline-flex';
        if (isUpcoming) {
          trailerBtnEl.className = 'btn btn-primary btn-lg';
          trailerBtnEl.innerHTML = '<span>🎬</span> Assistir Trailer Oficial';
        } else {
          trailerBtnEl.className = 'btn btn-secondary btn-lg';
          trailerBtnEl.innerHTML = 'Assistir Trailer';
        }
        trailerBtnEl.onclick = () => {
          this.openTrailerModal(details.trailer_key, title);
        };
      } else {
        trailerBtnEl.style.display = 'none';
      }
    }

    // Botão Favorito / Minha Lista
    const favBtn = document.getElementById('detailsFavBtn');
    const updateFavUi = (isFav) => {
      if (favBtn) favBtn.innerHTML = `<span>${isFav ? '✓' : '+'}</span> ${isFav ? 'Na Minha Lista' : 'Minha Lista'}`;
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

    if (favBtn) favBtn.onclick = toggleFavAction;

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
            <div class="episode-number-col">${ep.episode_number}</div>
            <div class="episode-thumb-col">
              <img class="episode-thumb" src="${epThumb}" alt="${ep.name}" loading="lazy" />
              <div class="episode-play-icon">▶</div>
            </div>
            <div class="episode-info">
              <div class="episode-title-row">
                <span class="episode-name">${ep.name}</span>
                <span class="episode-time">${ep.runtime ? `${ep.runtime}min` : ''}</span>
              </div>
              <p class="episode-desc">${ep.overview || 'Sem sinopse disponível.'}</p>
            </div>
          `;

          epRow.onclick = () => {
            currentSeason = seasonNum;
            currentEpisode = ep.episode_number;
            if (this.player && typeof this.player.enterFullscreenWithOrientation === 'function') {
              this.player.enterFullscreenWithOrientation();
            }
            this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, ep.name);
          };
          epRow.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') epRow.click();
          });

          episodesGrid.appendChild(epRow);
        });
      };

      seasonSelect.onchange = (e) => {
        currentSeason = Number(e.target.value);
        currentEpisode = 1;
        if (this.activeDetailsMedia) {
          this.activeDetailsMedia.season = currentSeason;
          this.activeDetailsMedia.episode = currentEpisode;
          this.updateDetailsPlayButton(mediaType, tmdbId, title, details, currentSeason, currentEpisode);
        }
        loadEpisodes(currentSeason);
      };
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

    // Registra mídia ativa dos detalhes para atualizações dinâmicas
    this.activeDetailsMedia = { mediaType, tmdbId, title, details, season: currentSeason, episode: currentEpisode };

    // Botão Principal: Continuar Assistindo vs Assistir Agora
    await this.updateDetailsPlayButton(mediaType, tmdbId, title, details, currentSeason, currentEpisode, opts.resumeTime);

    if (opts.autoPlay) {
      this.fetchAndPlay(mediaType, tmdbId, title, details, currentSeason, currentEpisode, null, opts.resumeTime);
    }
  }

  async updateDetailsPlayButton(mediaType, tmdbId, title, details, season = 1, episode = 1, forceResumeTime = null) {
    const playBtn = document.getElementById('detailsPlayBtn');
    if (!playBtn) return;

    let resumeTime = (forceResumeTime !== null && forceResumeTime !== undefined) ? Number(forceResumeTime) : 0;
    let savedProgress = null;

    if (!resumeTime && this.currentProfile?.id) {
      savedProgress = await API.getMediaProgress(this.currentProfile.id, tmdbId, season, episode);
      if (savedProgress && savedProgress.position > 15) {
        const isNearEnd = savedProgress.duration > 0 && (savedProgress.position / savedProgress.duration) > 0.95;
        if (!isNearEnd) {
          resumeTime = savedProgress.position;
        }
      }
    }

    const isUpcoming = details.is_unreleased || (details.release_date && new Date(details.release_date) > new Date()) || ["In Production", "Post Production", "Planned"].includes(details.status);
    if (isUpcoming) {
      playBtn.style.display = 'none';
      return;
    } else {
      playBtn.style.display = 'inline-flex';
    }

    if (resumeTime > 15) {
      const min = Math.floor(resumeTime / 60);
      let remText = '';
      if (savedProgress?.duration && savedProgress.duration > resumeTime) {
        const remMin = Math.round((savedProgress.duration - resumeTime) / 60);
        remText = ` • ${remMin}m restantes`;
      }
      playBtn.innerHTML = `<span>▶</span> Continuar Assistindo${remText ? `<small style="font-size:12px; font-weight:normal; opacity:0.85; margin-left:6px;">${remText}</small>` : ''}`;
      playBtn.title = `Continuar aos ${min} min`;
      playBtn.onclick = () => {
        if (this.player && typeof this.player.enterFullscreenWithOrientation === 'function') {
          this.player.enterFullscreenWithOrientation();
        }
        this.fetchAndPlay(mediaType, tmdbId, title, details, season, episode, null, resumeTime);
      };
    } else {
      playBtn.innerHTML = `<span>▶</span> Assistir Agora`;
      playBtn.title = `Iniciar reprodução`;
      playBtn.onclick = () => {
        if (this.player && typeof this.player.enterFullscreenWithOrientation === 'function') {
          this.player.enterFullscreenWithOrientation();
        }
        this.fetchAndPlay(mediaType, tmdbId, title, details, season, episode, null, 0);
      };
    }
  }

  onPlayerClose() {
    if (document.body.classList.contains('in-details-view') && this.activeDetailsMedia) {
      const { mediaType, tmdbId, title, details, season, episode } = this.activeDetailsMedia;
      this.updateDetailsPlayButton(mediaType, tmdbId, title, details, season, episode);
    }
  }

  async loadSourcesList(mediaType, tmdbId, season, episode, title, details) {
    const grid = document.getElementById('detailsSourcesGrid');
    grid.innerHTML = '<p style="color:#888;">Resolvendo servidores de alta velocidade...</p>';

    const res = await API.resolveStreams(mediaType, tmdbId, season, episode);
    const streams = res?.streams || [];

    grid.innerHTML = '';
    if (streams.length === 0) {
      grid.innerHTML = '<p style="color:#888;">Nenhum servidor direto encontrado para este título no momento.</p>';
      return;
    }

    streams.forEach(s => {
      const card = document.createElement('div');
      card.className = 'source-card';
      const qLabel = s.quality || 'HD 1080p';
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
    // 1. Abre imediatamente o player com feedback visual cinematográfico e status de carregamento
    if (this.player && typeof this.player.preparePlayback === 'function') {
      this.player.preparePlayback({
        title,
        mediaType,
        season,
        episode,
        episodeTitle: epTitle,
        backdrop: details?.backdrop_path || details?.poster_path
      });
    }

    const playBtn = document.getElementById('detailsPlayBtn');
    if (playBtn) playBtn.innerHTML = 'Conectando ao melhor servidor...';

    const resolved = await API.resolveStreams(mediaType, tmdbId, season, episode);
    if (this.player && typeof this.player.setLoadingProgress === 'function') {
      this.player.setLoadingProgress(70);
    }
    if (playBtn) {
      this.updateDetailsPlayButton(mediaType, tmdbId, title, details, season, episode, resumeTime);
    }

    const streams = resolved?.streams || [];
    let bestStream = resolved?.best_stream || (streams.length > 0 ? streams[0] : null);
    const isCinema = !!resolved?.is_cinema_version || (bestStream && bestStream.is_cinema);

    if (!bestStream) {
      if (this.player && typeof this.player.showErrorScreen === 'function') {
        this.player.showErrorScreen('Nenhuma transmissão disponível no momento para este título.');
      } else {
        this.showToast('Nenhuma transmissão disponível no momento para este título.');
      }
      return;
    }

    // Fecha o modal e inicia o player instantaneamente
    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal) detailsModal.classList.remove('open');

    this.player.play({
      mediaId: tmdbId,
      mediaType: mediaType,
      title: title,
      overview: details?.overview || null,
      poster: details.poster_path,
      backdrop: details.backdrop_path,
      season: season,
      episode: episode,
      episodeTitle: epTitle,
      initialTime: resumeTime,
      streams: streams,
      currentStreamUrl: bestStream.url,
      isCinema: isCinema,
      onNextEpisode: mediaType === 'tv' ? () => {
        const nextEpNum = Number(season ? episode : 1) + 1;
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast(`🍿 Iniciando Próximo Episódio (EP ${nextEpNum})...`, 3000);
        }
        this.fetchAndPlay(mediaType, tmdbId, title, details, season, nextEpNum, null, 0);
      } : null
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

    const liveLeft = document.getElementById('liveNavLeft');
    const liveRight = document.getElementById('liveNavRight');
    if (liveLeft && liveRight && !this._liveNavBound) {
      this._liveNavBound = true;
      liveLeft.onclick = () => {
        pillsContainer.scrollBy({ left: -280, behavior: 'smooth' });
      };
      liveRight.onclick = () => {
        pillsContainer.scrollBy({ left: 280, behavior: 'smooth' });
      };
    }

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
    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const searchContainer = document.getElementById('searchContainer');
    const detailsView = document.getElementById('detailsView');

    heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    sectionsContainer.style.display = 'none';
    if (liveTvContainer) liveTvContainer.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const subEl = document.getElementById('searchSub');
    if (subEl) subEl.textContent = '';
    const grid = document.getElementById('searchGrid');
    const backBtn = document.getElementById('searchBackBtn');
    if (backBtn) backBtn.style.display = 'none';

    if (!this.currentProfile) {
      await this.loadProfiles();
    }

    if (!this.currentProfile) {
      titleEl.textContent = 'Minha Lista';
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <p style="color: #aaa; margin-bottom: 16px; font-size: 16px;">Nenhum perfil ativo selecionado.</p>
          <button class="btn btn-primary" onclick="window.app.openProfileModal()">Escolher Perfil</button>
        </div>
      `;
      return;
    }

    titleEl.textContent = `Minha Lista — ${this.currentProfile.name}`;
    grid.innerHTML = '<div style="color: #aaa; grid-column: 1/-1; text-align: center; padding: 40px;">Carregando sua lista...</div>';

    const items = await API.getFavorites(this.currentProfile.id);
    if (!items || items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 70px 20px;">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 14px; opacity: 0.6; display: block;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <h3 style="font-size: 22px; margin-bottom: 8px; color: #fff; font-weight: 700;">Sua lista está vazia</h3>
          <p style="color: #888; max-width: 460px; margin: 0 auto 24px; font-size: 14px; line-height: 1.6;">
            Adicione filmes e séries clicando no botão "Minha Lista" nos detalhes de qualquer título.
          </p>
          <button class="btn btn-primary" id="watchlistExploreBtn">Explorar Catálogo</button>
        </div>
      `;
      const expBtn = document.getElementById('watchlistExploreBtn');
      if (expBtn) {
        expBtn.onclick = () => {
          const homeTab = document.querySelector('.nav-links .nav-item[data-tab="home"]');
          if (homeTab) homeTab.click();
        };
      }
      return;
    }

    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0');
      const posterUrl = item.poster_path 
        ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
        : 'https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';

      card.innerHTML = `
        <button class="continue-remove-btn" title="Remover da Minha Lista" aria-label="Remover">✕</button>
        <img class="media-card-poster" src="${posterUrl}" alt="${item.title}" loading="lazy" />
        <div class="media-card-info">
          <div class="media-card-title">${item.title}</div>
          <div class="media-card-sub">
            <span>${item.media_type === 'movie' ? 'Filme' : 'Série'}</span>
            <span class="card-rating">${item.vote_average ? `★ ${Number(item.vote_average).toFixed(1)}` : ''}</span>
          </div>
        </div>
      `;

      const removeBtn = card.querySelector('.continue-remove-btn');
      if (removeBtn) {
        removeBtn.onclick = async (e) => {
          e.stopPropagation();
          await API.toggleFavorite({
            profile_id: this.currentProfile.id,
            media_id: String(item.media_id),
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            vote_average: item.vote_average
          });
          card.remove();
          if (grid.children.length === 0) {
            this.loadWatchlist();
          }
        };
      }

      card.onclick = () => this.openMediaDetails(item.media_type, item.media_id);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });
      grid.appendChild(card);
    });
  }

  closeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) mobileSearchInput.value = '';
    const mobileClear = document.getElementById('mobileSearchClearBtn');
    if (mobileClear) mobileClear.style.display = 'none';
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) searchContainer.style.display = 'none';
    const detailsView = document.getElementById('detailsView');
    if (detailsView) detailsView.style.display = 'none';
    document.body.classList.remove('in-details-view');
    this.switchTab('home');
  }

  openSearchPage() {
    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const detailsView = document.getElementById('detailsView');
    const searchContainer = document.getElementById('searchContainer');

    if (heroSection) heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    if (sectionsContainer) sectionsContainer.style.display = 'none';
    if (liveTvContainer) liveTvContainer.style.display = 'none';
    if (categoriesContainer) categoriesContainer.style.display = 'none';
    if (collectionsContainer) collectionsContainer.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    document.body.classList.remove('in-details-view');

    if (searchContainer) searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const subEl = document.getElementById('searchStatusSubtitle');
    if (backBtn) backBtn.style.display = (this.previousTab && this.previousTab !== 'search') ? 'inline-flex' : 'none';
    if (titleEl) titleEl.textContent = 'Explorar & Buscar';
    if (subEl) subEl.textContent = 'Digite o nome de filmes, séries, atores ou gêneros para pesquisar em tempo real.';

    const mobileInp = document.getElementById('mobileSearchInput');
    const deskInp = document.getElementById('searchInput');
    if (window.innerWidth <= 768 && mobileInp) {
      setTimeout(() => mobileInp.focus(), 150);
    } else if (deskInp) {
      setTimeout(() => deskInp.focus(), 150);
    }
  }

  /* ================================================================
     TELA DEDICADA DE COLEÇÕES ESTILO DISNEY+ (EXPLORE / BRAND TILES)
     ================================================================ */

  async loadCollectionsPage() {
    const hubView = document.getElementById('collectionsHubView');
    const colDetailView = document.getElementById('collectionDetailView');
    const backBtnCol = document.getElementById('backToHubBtnCol');

    if (backBtnCol) {
      backBtnCol.onclick = () => {
        if (colDetailView) colDetailView.style.display = 'none';
        if (hubView) hubView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    if (hubView) hubView.style.display = 'block';
    if (colDetailView) colDetailView.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'instant' });

    const colGrid = document.getElementById('collectionsCardsGrid');
    if (colGrid && (!this.collectionsList || this.collectionsList.length === 0)) {
      colGrid.innerHTML = '<div style="color:#aaa; grid-column:1/-1; text-align:center; padding:40px;">Carregando coleções...</div>';
      this.collectionsList = (await API.getCollections()) || [];
      this.renderCollectionsGrid(this.collectionsList);
    } else if (colGrid && colGrid.children.length === 0 && this.collectionsList) {
      this.renderCollectionsGrid(this.collectionsList);
    }
  }

  renderCollectionsGrid(collections) {
    const colGrid = document.getElementById('collectionsCardsGrid');
    if (!colGrid) return;
    colGrid.innerHTML = '';

    const BRAND_NAMES = {
      mcu: 'MARVEL STUDIOS',
      star_wars: 'STAR WARS',
      spider_man: 'SPIDER-MAN',
      batman: 'BATMAN',
      harry_potter: 'HARRY POTTER',
      dragon_ball: 'DRAGON BALL',
      saint_seiya: 'CAVALEIROS DO ZODÍACO',
      naruto: 'NARUTO',
      transformers: 'TRANSFORMERS',
      dc_comics: 'DC UNIVERSE',
      john_wick: 'JOHN WICK',
      mission_impossible: 'MISSÃO: IMPOSSÍVEL',
      matrix: 'THE MATRIX',
      x_men: 'X-MEN',
      fast_furious: 'VELOZES & FURIOSOS',
      lord_of_the_rings: 'SENHOR DOS ANÉIS',
      shrek: 'SHREK',
      jurassic: 'JURASSIC WORLD'
    };

    collections.forEach(c => {
      const card = document.createElement('div');
      card.className = 'disney-collection-card';
      card.setAttribute('tabindex', '0');
      const backdropUrl = c.backdrop ? `https://image.tmdb.org/t/p/w780${c.backdrop}` : '';
      const brandName = BRAND_NAMES[c.key] || c.title.replace(/^Coleção\s+/i, '').toUpperCase();

      card.innerHTML = `
        <div class="disney-card-bg" style="${backdropUrl ? `background-image: url('${backdropUrl}')` : ''}"></div>
        <div class="disney-card-overlay"></div>
        <div class="disney-brand-content">
          <div class="disney-brand-title">${brandName}</div>
          <div class="disney-brand-sub">COLLECTION</div>
        </div>
      `;

      card.onclick = () => this.openCollection(c.key);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });
      colGrid.appendChild(card);
    });
  }

  async openCollection(collectionKey) {
    const hubView = document.getElementById('collectionsHubView');
    const colDetailView = document.getElementById('collectionDetailView');
    const banner = document.getElementById('collectionHeroBanner');
    const titleEl = document.getElementById('colHeroTitle');
    const subEl = document.getElementById('colHeroSub');
    const itemsGrid = document.getElementById('collectionItemsGrid');

    if (hubView) hubView.style.display = 'none';
    if (colDetailView) colDetailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (itemsGrid) {
      itemsGrid.innerHTML = '<div style="color:#aaa; grid-column:1/-1; text-align:center; padding:60px 20px;">Carregando coleção...</div>';
    }

    const data = await API.getCollection(collectionKey);
    if (!data) {
      if (itemsGrid) itemsGrid.innerHTML = '<div style="color:#f87171; grid-column:1/-1; text-align:center;">Não foi possível carregar a coleção.</div>';
      return;
    }

    if (banner && data.backdrop) {
      banner.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${data.backdrop}')`;
    }
    if (titleEl) titleEl.textContent = data.title;
    if (subEl) subEl.textContent = data.subtitle || '';

    if (itemsGrid) {
      itemsGrid.innerHTML = '';
      data.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'chronological-media-card';
        card.setAttribute('tabindex', '0');
        const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';
        const year = item.release_date ? item.release_date.split('-')[0] : '';
        const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : '';

        card.innerHTML = `
          <div class="chrono-order-badge">${item.order}º</div>
          <div class="chrono-poster-box">
            <img src="${posterUrl}" alt="${item.title}" loading="lazy" />
            <div class="chrono-play-overlay">▶</div>
          </div>
          <div class="chrono-info-box">
            <div class="chrono-card-title">${item.title}</div>
            <div class="chrono-meta-row">
              <span class="chrono-year">${year}</span>
              ${rating ? `<span class="chrono-rating">★ ${rating}</span>` : ''}
              <span class="chrono-type">${item.media_type === 'tv' ? 'Série' : 'Filme'}</span>
            </div>
            ${item.chronological_note ? `<div class="chrono-note">${item.chronological_note}</div>` : ''}
          </div>
        `;

        card.onclick = () => this.openMediaDetails(item.media_type, item.tmdb_id);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') card.click();
        });
        itemsGrid.appendChild(card);
      });
    }
  }

  /* ================================================================
     TELA DEDICADA DE CATEGORIAS ESTILO NETFLIX (SPOTLIGHT + TRACK + GRID)
     ================================================================ */

  async loadCategoriesPage() {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 1. Carrega lista de categorias se ainda não estiver carregada
    if (!this.allCategoriesList || this.allCategoriesList.length === 0) {
      this.allCategoriesList = (await API.getCategories()) || [];
    }

    const validCat = this.allCategoriesList.some(c => c.key === this.currentCategory);
    if (!validCat && this.allCategoriesList.length > 0) {
      this.currentCategory = this.allCategoriesList[0].key;
    }

    // 2. Renderiza os tiles horizontais da barra de categorias estilo Netflix
    const track = document.getElementById('netflixCategoriesTrack');
    if (track && track.children.length === 0) {
      this.renderNetflixCategoriesTrack();
    } else if (track) {
      this.updateActiveCategoryTile();
    }

    // 3. Carrega os títulos da categoria selecionada
    await this.selectCategory(this.currentCategory || 'action');
  }

  renderNetflixCategoriesTrack() {
    const track = document.getElementById('netflixCategoriesTrack');
    if (!track) return;
    track.innerHTML = '';

    const leftBtn = document.getElementById('netflixCatNavLeft');
    const rightBtn = document.getElementById('netflixCatNavRight');
    if (leftBtn && rightBtn && !this._netflixCatNavBound) {
      this._netflixCatNavBound = true;
      leftBtn.onclick = () => track.scrollBy({ left: -320, behavior: 'smooth' });
      rightBtn.onclick = () => track.scrollBy({ left: 320, behavior: 'smooth' });
    }

    this.allCategoriesList.forEach(cat => {
      const tile = document.createElement('div');
      tile.className = `netflix-category-tile ${cat.key === this.currentCategory ? 'active' : ''}`;
      tile.setAttribute('data-key', cat.key);
      tile.setAttribute('tabindex', '0');
      tile.innerHTML = `
        <div class="netflix-category-tile-bg"></div>
        <span class="netflix-category-tile-name">${cat.title}</span>
      `;

      tile.onclick = () => this.selectCategory(cat.key);
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tile.click();
      });
      track.appendChild(tile);
    });
  }

  updateActiveCategoryTile() {
    const track = document.getElementById('netflixCategoriesTrack');
    if (!track) return;
    track.querySelectorAll('.netflix-category-tile').forEach(tile => {
      const isAct = tile.getAttribute('data-key') === this.currentCategory;
      tile.classList.toggle('active', isAct);
      if (isAct) {
        tile.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  async selectCategory(categoryKey) {
    this.currentCategory = categoryKey;
    this.updateActiveCategoryTile();

    const catInfo = this.allCategoriesList?.find(c => c.key === categoryKey);
    const heroTitle = document.getElementById('netflixCatHeroTitle');
    const heroDesc = document.getElementById('netflixCatHeroDesc');
    const heroBg = document.getElementById('netflixCatHeroBg');
    const heroActions = document.getElementById('netflixCatHeroActions');
    const heroPlayBtn = document.getElementById('netflixCatHeroPlayBtn');
    const heroInfoBtn = document.getElementById('netflixCatHeroInfoBtn');
    const catalogTitle = document.getElementById('netflixCatCatalogTitle');
    const grid = document.getElementById('categoryGrid');
    const loadMoreBox = document.getElementById('categoryLoadMoreBox');
    const loadMoreBtn = document.getElementById('categoryLoadMoreBtn');

    if (heroTitle && catInfo) heroTitle.textContent = catInfo.title;
    if (heroDesc && catInfo) heroDesc.textContent = catInfo.description || '';
    if (catalogTitle && catInfo) catalogTitle.textContent = `${catInfo.title} em Destaque`;

    if (grid) {
      grid.innerHTML = '<div style="color:#aaa; grid-column:1/-1; text-align:center; padding:50px 20px;">Carregando títulos da categoria...</div>';
    }

    this.categoryPage = 1;
    this.categoryLoading = true;
    const catData = await API.getCategoryItems(categoryKey, 1);
    this.categoryLoading = false;

    if (!grid) return;
    grid.innerHTML = '';

    const items = catData?.results || [];
    if (items.length === 0) {
      grid.innerHTML = '<div style="color:#aaa; grid-column:1/-1; text-align:center; padding:50px 20px;">Nenhum título encontrado nesta categoria no momento.</div>';
      if (loadMoreBox) loadMoreBox.style.display = 'none';
      if (heroBg) heroBg.style.backgroundImage = 'none';
      if (heroActions) heroActions.style.display = 'none';
      return;
    }

    // Atualiza o spotlight hero com o primeiro item em destaque
    const topItem = items[0];
    if (topItem && heroBg) {
      const topBackdrop = topItem.backdrop_path || topItem.poster_path;
      if (topBackdrop) {
        heroBg.style.backgroundImage = `url('https://image.tmdb.org/t/p/w1280${topBackdrop}')`;
      }
      if (heroActions && heroPlayBtn && heroInfoBtn) {
        heroActions.style.display = 'flex';
        const mType = topItem.media_type || (topItem.title ? 'movie' : 'tv');
        heroPlayBtn.onclick = () => this.playMediaDirect(mType, topItem.id);
        heroInfoBtn.onclick = () => this.openMediaDetails(mType, topItem.id);
      }
    }

    // Renderiza os cards da categoria
    this.renderCategoryItems(items);

    if (loadMoreBox) {
      loadMoreBox.style.display = items.length >= 12 ? 'block' : 'none';
    }
    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Carregar Mais Títulos';
      loadMoreBtn.onclick = async () => {
        if (!this.categoryLoading) {
          this.categoryLoading = true;
          loadMoreBtn.textContent = 'Carregando mais títulos...';
          this.categoryPage += 1;
          const nextData = await API.getCategoryItems(this.currentCategory, this.categoryPage);
          this.categoryLoading = false;
          loadMoreBtn.textContent = 'Carregar Mais Títulos';
          const nextItems = nextData?.results || [];
          if (nextItems.length > 0) {
            this.renderCategoryItems(nextItems);
          } else {
            loadMoreBox.style.display = 'none';
          }
        }
      };
    }
  }

  renderCategoryItems(items) {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;

    items.forEach(item => {
      const posterPath = item.poster_path || item.backdrop_path;
      if (!posterPath) return;
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : '';
      const date = item.release_date || item.first_air_date || '';
      const year = date ? date.split('-')[0] : '';

      const isUpcoming = (item.release_date && new Date(item.release_date) > new Date());
      const isInTheaters = !isUpcoming && item.release_date && (() => {
        const rd = new Date(item.release_date);
        const diff = (new Date() - rd) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 75;
      })();

      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${posterPath}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';" />
        ${isUpcoming ? '<span class="card-badge-upcoming">EM BREVE</span>' : (isInTheaters ? '<span class="card-badge-cinema">NO CINEMA</span>' : '')}
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${mediaType === 'movie' ? 'Filme' : 'Série'} • ${year}</span>
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

  /* ================================================================
     BUSCA INTELIGENTE EM TEMPO REAL COM SUGESTÕES & SEMELHANTES
     ================================================================ */

  async searchMedia(query) {
    const heroSection = document.getElementById('heroSection');
    const categoriesBar = document.getElementById('categoriesBarWrapper');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const liveTvContainer = document.getElementById('liveTvContainer');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const searchContainer = document.getElementById('searchContainer');
    const detailsView = document.getElementById('detailsView');

    heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    sectionsContainer.style.display = 'none';
    liveTvContainer.style.display = 'none';
    if (categoriesContainer) categoriesContainer.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    searchContainer.style.display = 'block';

    const titleEl = document.getElementById('searchTitle');
    const subEl = document.getElementById('searchStatusSubtitle');
    const grid = document.getElementById('searchGrid');
    const searchBackBtn = document.getElementById('searchBackBtn');
    const similarSec = document.getElementById('searchSimilarSection');
    const similarGrid = document.getElementById('searchSimilarGrid');
    const similarTitle = document.getElementById('searchSimilarTitle');

    if (searchBackBtn) searchBackBtn.style.display = 'inline-flex';
    if (similarSec) similarSec.style.display = 'none';

    titleEl.textContent = `Resultados para "${query}"`;
    if (subEl) subEl.textContent = 'Pesquisando em tempo real...';
    grid.innerHTML = '<p style="color:#aaa; grid-column:1/-1; text-align:center; padding:35px 20px;">Buscando no catálogo mundial do HomeFlix...</p>';

    const data = await API.search(query);
    const results = data?.results || [];
    const similar = data?.similar || [];
    const matchedVia = data?.matched_via;

    grid.innerHTML = '';

    const renderCard = (item, isSuggestion = false) => {
      const posterPath = item.poster_path || item.backdrop_path;
      if (!posterPath) return null;
      const title = item.title || item.name || '';
      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
      const rating = item.vote_average ? Number(item.vote_average).toFixed(1) : '';
      const date = item.release_date || item.first_air_date || '';
      const year = date ? date.split('-')[0] : '';

      const isUpcoming = (item.release_date && new Date(item.release_date) > new Date());
      const isInTheaters = !isUpcoming && item.release_date && (() => {
        const rd = new Date(item.release_date);
        const diff = (new Date() - rd) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 75;
      })();

      const card = document.createElement('div');
      card.className = 'media-card';
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <img class="media-card-poster" src="https://image.tmdb.org/t/p/w342${posterPath}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='https://images.placeholders.dev/?width=342&height=513&text=HomeFlix&theme=dark';" />
        ${isUpcoming ? '<span class="card-badge-upcoming">EM BREVE</span>' : (isInTheaters ? '<span class="card-badge-cinema">NO CINEMA</span>' : (isSuggestion ? '<span class="suggestion-badge">Semelhante</span>' : ''))}
        <div class="media-card-info">
          <div class="media-card-title">${title}</div>
          <div class="media-card-sub">
            <span>${mediaType === 'movie' ? 'Filme' : 'Série'} • ${year}</span>
            <span class="card-rating">★ ${rating}</span>
          </div>
        </div>
      `;
      card.onclick = () => this.openMediaDetails(mediaType, item.id);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });
      return card;
    };

    if (results.length > 0) {
      if (subEl) {
        subEl.textContent = `${results.length} título(s) encontrado(s)${matchedVia && matchedVia !== 'direto' ? ` • ${matchedVia}` : ''}`;
      }
      results.forEach(item => {
        const card = renderCard(item, false);
        if (card) grid.appendChild(card);
      });

      // Se temos títulos semelhantes para complementar a busca (ex: poucos resultados exatos)
      if (similar.length > 0 && similarSec && similarGrid) {
        similarSec.style.display = 'block';
        if (similarTitle) similarTitle.textContent = `Você Também Pode Gostar (Títulos Semelhantes)`;
        similarGrid.innerHTML = '';
        similar.forEach(item => {
          const card = renderCard(item, true);
          if (card) similarGrid.appendChild(card);
        });
      }
    } else {
      // Nenhum resultado exato encontrado! Estilo Netflix: Mostra semelhantes e sugestões direto no grid!
      if (subEl) {
        subEl.innerHTML = `Não encontramos correspondência exata para <strong>"${query}"</strong>. Confira estas sugestões e títulos semelhantes:`;
      }

      if (similar.length > 0) {
        similar.forEach(item => {
          const card = renderCard(item, true);
          if (card) grid.appendChild(card);
        });
      } else {
        grid.innerHTML = '<p style="color:#888; grid-column:1/-1; padding:40px 0; text-align:center;">Nenhum título encontrado com este termo.</p>';
      }
    }
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
        this.openProfileModal(false, this.isProfileGateMode);
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
          this.openProfileModal(false, this.isProfileGateMode);
        } else {
          // Cria novo perfil
          const res = await API.createProfile(name, this.selectedAvatar);
          if (res?.profile) {
            this.profiles.push(res.profile);
            this.selectProfile(res.profile);
            return;
          }
          this.openProfileModal(false, this.isProfileGateMode);
        }
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
            this.currentProfile = null;
            window.currentProfile = null;
            this.updateProfileUI();
          }
          this.openProfileModal(false, this.isProfileGateMode);
        }
      };
    }

    // Fechar Histórico
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    if (historyCloseBtn) {
      historyCloseBtn.onclick = () => {
        const modal = document.getElementById('historyModal');
        if (modal) {
          modal.classList.remove('open');
          modal.style.display = 'none';
        }
      };
    }

    const historyModalBackdrop = document.getElementById('historyModal');
    if (historyModalBackdrop) {
      historyModalBackdrop.addEventListener('click', (e) => {
        if (e.target === historyModalBackdrop) {
          historyModalBackdrop.classList.remove('open');
          historyModalBackdrop.style.display = 'none';
        }
      });
    }

    // Limpar Histórico
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.onclick = async () => {
        const prof = this.currentProfile || (this.profiles && this.profiles[0]);
        if (!prof) return;
        if (confirm('Deseja realmente limpar todo o histórico de títulos assistidos deste perfil?')) {
          await API.clearWatchHistory(prof.id);
          this.openWatchHistoryModal();
          this.loadContinueWatching();
          this.showToast('Histórico limpo com sucesso.');
        }
      };
    }
  }

  /* ================================================================
     MODAL DE HISTÓRICO DE ASSISTIDOS DO PERFIL
     ================================================================ */

  async openWatchHistoryModal() {
    const prof = this.currentProfile || (this.profiles && this.profiles[0]);
    if (!prof) return;
    const modal = document.getElementById('historyModal');
    const grid = document.getElementById('historyGrid');
    const subEl = document.getElementById('historyModalSub');
    if (!modal || !grid) return;

    modal.style.display = 'flex';
    modal.classList.add('open');
    grid.innerHTML = '<div style="color: #aaa; padding: 30px; text-align: center; grid-column: 1/-1;">Carregando histórico...</div>';
    if (subEl) subEl.textContent = `Títulos assistidos recentemente por ${prof.name}`;

    const items = await API.getWatchHistory(prof.id);
    grid.innerHTML = '';

    if (!items || items.length === 0) {
      grid.innerHTML = `
        <div style="color: #aaa; text-align: center; padding: 40px 20px; grid-column: 1/-1;">
          <div style="font-size: 36px; margin-bottom: 12px; opacity: 0.6;">⏳</div>
          <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">Nenhum título no histórico</div>
          <p style="font-size: 13px; color: #888; max-width: 360px; margin: 0 auto 20px;">Você ainda não assistiu a nenhum filme ou episódio neste perfil. Explore nosso catálogo para começar!</p>
          <button class="btn btn-primary" onclick="const m = document.getElementById('historyModal'); if(m){ m.classList.remove('open'); m.style.display='none'; }">Explorar Catálogo</button>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const poster = item.poster_path 
        ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w200${item.poster_path}`)
        : 'https://images.placeholders.dev/?width=200&height=300&text=HomeFlix&theme=dark';

      const progressPercent = (item.duration > 0 && item.position > 0)
        ? Math.min(100, Math.round((item.position / item.duration) * 100))
        : 0;

      const isSeries = item.media_type === 'tv' || item.season_number > 1 || item.episode_number > 1;
      const subtitle = isSeries 
        ? `T${item.season_number || 1}:E${item.episode_number || 1}${item.episode_title ? ` • ${item.episode_title}` : ''}`
        : 'Filme';

      const timeFormatted = item.position > 0 
        ? `${Math.floor(item.position / 60)} min assistidos (${progressPercent}%)`
        : 'Iniciado';

      card.innerHTML = `
        <img class="history-card-poster" src="${poster}" alt="${item.title}" />
        <div class="history-card-info">
          <div class="history-card-title">${item.title}</div>
          <div class="history-card-meta">${subtitle} • ${timeFormatted}</div>
          <div class="history-progress-track">
            <div class="history-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div class="history-card-actions">
            <button class="history-action-play">▶ Continuar</button>
            <button class="history-action-remove" title="Remover do histórico">✕ Remover</button>
          </div>
        </div>
      `;

      const playBtn = card.querySelector('.history-action-play');
      playBtn.onclick = () => {
        modal.classList.remove('open');
        modal.style.display = 'none';
        this.openMediaDetails(item.media_type, item.media_id, {
          resumeTime: item.position,
          season: item.season_number,
          episode: item.episode_number
        });
      };

      const removeBtn = card.querySelector('.history-action-remove');
      removeBtn.onclick = async () => {
        await API.deleteHistoryItem(this.currentProfile.id, item.media_id);
        card.remove();
        if (grid.children.length === 0) {
          this.openWatchHistoryModal();
        }
        this.loadContinueWatching();
      };

      grid.appendChild(card);
    });
  }

  /* ================================================================
     MODAL DE ONBOARDING (TASTE PICKER ESTILO NETFLIX)
     ================================================================ */

  openOnboardingModal(profile) {
    const modal = document.getElementById('onboardingModal');
    const grid = document.getElementById('onboardingGrid');
    const badge = document.getElementById('onboardingCounterBadge');
    const submitBtn = document.getElementById('onboardingSubmitBtn');
    const skipBtn = document.getElementById('onboardingSkipBtn');
    if (!modal || !grid) return;

    modal.style.display = 'flex';
    grid.innerHTML = '';

    const selectedGenres = new Set();

    const updateCounter = () => {
      const count = selectedGenres.size;
      if (count >= 3) {
        badge.textContent = `Perfeito! ${count} categorias selecionadas`;
        badge.classList.add('ready');
        submitBtn.disabled = false;
      } else {
        badge.textContent = `Selecione pelo menos 3 (${count} selecionado${count === 1 ? '' : 's'})`;
        badge.classList.remove('ready');
        submitBtn.disabled = true;
      }
    };
    updateCounter();

    ONBOARDING_TITLES.forEach(t => {
      const card = document.createElement('div');
      card.className = 'onboarding-card';
      card.style.backgroundImage = `url('${t.poster}')`;
      card.innerHTML = `
        <div class="check-icon">✓</div>
        <div class="onboarding-card-title">${t.title}</div>
      `;

      card.onclick = () => {
        if (selectedGenres.has(t.genre)) {
          selectedGenres.delete(t.genre);
          card.classList.remove('selected');
        } else {
          selectedGenres.add(t.genre);
          card.classList.add('selected');
        }
        updateCounter();
      };

      grid.appendChild(card);
    });

    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Configurando seu catálogo...';
      const genresStr = Array.from(selectedGenres).join(',');
      await API.saveOnboarding(profile.id, genresStr);
      profile.onboarded = 1;
      profile.preferred_genres = genresStr;
      modal.style.display = 'none';
      this.showToast('✨ Catálogo personalizado com sucesso com base nas suas escolhas!', 4000);
      this.loadRecommendations();
      this.loadHome();
    };

    skipBtn.onclick = async () => {
      await API.saveOnboarding(profile.id, 'action,anime_sagas,comedy,popular_series');
      profile.onboarded = 1;
      modal.style.display = 'none';
      this.loadHome();
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new HomeFlixApp();
});
