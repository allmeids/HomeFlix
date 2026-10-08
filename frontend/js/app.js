const CATALOG_AVATARS = [
  { id: 'mario', name: 'Mario', img: 'https://image.tmdb.org/t/p/w200/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg' },
  { id: 'spiderman', name: 'Homem-Aranha', img: 'https://image.tmdb.org/t/p/w200/gh4cZbhZxyTbgxQPxD0dOudNPTn.jpg' },
  { id: 'batman', name: 'Batman', img: 'https://image.tmdb.org/t/p/w200/74xTEgt7R36Fpooo50r9T25onhq.jpg' },
  { id: 'deadpool', name: 'Deadpool', img: 'https://image.tmdb.org/t/p/w200/cJFqqiDYprqExaXatu4AaoMzDG2.jpg' },
  { id: 'wednesday', name: 'Wandinha', img: 'https://image.tmdb.org/t/p/w200/9PFonBhy4cQy7Jz20NpMygczOkv.jpg' },
  { id: 'eleven', name: 'Eleven', img: 'https://image.tmdb.org/t/p/w200/49WJfeN0moxb9IPfGn8AIqMGskD.jpg' },
  { id: 'goku', name: 'Goku (Dragon Ball)', img: 'https://image.tmdb.org/t/p/w200/kbkuYkaFsDwL6cyMgnBf77LczEo.jpg' },
  { id: 'luffy', name: 'Luffy (One Piece)', img: 'https://image.tmdb.org/t/p/w200/aesLt9fsKSA6KCgGxA60VVxjtLk.jpg' },
  { id: 'naruto', name: 'Naruto', img: 'https://image.tmdb.org/t/p/w200/nRJmByfK9XdtOY73VArcN8KpKVs.jpg' },
  { id: 'tanjiro', name: 'Tanjiro', img: 'https://image.tmdb.org/t/p/w200/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg' },
  { id: 'seiya', name: 'Seiya (Cavaleiros)', img: 'https://image.tmdb.org/t/p/w200/e4cC6W5sSAKE8lQYRBTqU9jfdya.jpg' },
  { id: 'geralt', name: 'Geralt de Rívia', img: 'https://image.tmdb.org/t/p/w200/uJ1kQWTY1nElMcrrbHtDitbV85K.jpg' },
  { id: 'walter', name: 'Walter White', img: 'https://image.tmdb.org/t/p/w200/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg' },
  { id: 'ironman', name: 'Homem de Ferro', img: 'https://image.tmdb.org/t/p/w200/78lPtwv72eTNqFW9COBYI0dWDJa.jpg' },
  { id: 'toystory', name: 'Toy Story (Woody)', img: 'https://image.tmdb.org/t/p/w200/686F0CEPmI4ZXjFbWtIHQOBwnfI.jpg' },
  { id: 'shrek', name: 'Shrek', img: 'https://image.tmdb.org/t/p/w200/wxeqfC221YMptRRdzxlijAh7q8l.jpg' }
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
        if (this.currentTab === 'home') {
          this.refreshCatalog();
        } else {
          this.switchTab('home');
        }
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

    // Search em Tempo Real (Live Search Estilo Netflix)
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const q = e.target.value.trim();
      if (q.length >= 2) {
        debounceTimer = setTimeout(() => this.searchMedia(q), 280);
      } else if (q.length === 0) {
        this.closeSearch();
      }
    });

    // Botão Voltar da Busca
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) {
      searchBackBtn.onclick = () => this.closeSearch();
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

  getAvatarVisual(avatarKey, name = 'P') {
    const found = CATALOG_AVATARS.find(a => a.id === avatarKey);
    if (found) {
      return { isImage: true, url: found.img, name: found.name };
    }
    if (avatarKey && (avatarKey.startsWith('http') || avatarKey.startsWith('/'))) {
      return { isImage: true, url: avatarKey, name: name };
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
      modal.classList.remove('profile-gate-screen');
    }
    this.isProfileGateMode = false;

    // Se o perfil ainda não realizou o onboarding (gostos favoritos estilo Netflix), exibe o modal
    if (!p.onboarded) {
      this.openOnboardingModal(p);
    }

    // Carrega o conteúdo personalizado do perfil escolhido
    this.loadContinueWatching();
    this.loadRecommendations();

    const activeNav = document.querySelector('.nav-links .nav-item.active');
    if (activeNav && activeNav.dataset.tab === 'watchlist') {
      this.loadWatchlist();
    }
  }

  async openProfileModal(isManageMode = false, isGateMode = false) {
    this.isProfileGateMode = isGateMode;
    const modal = document.getElementById('profileModal');
    const grid = document.getElementById('profileModalGrid');
    const formBox = document.getElementById('profileFormBox');
    const footerBtns = document.getElementById('profileModalFooterBtns');
    const closeBtn = document.getElementById('profileCloseBtn');
    const gateLogo = document.getElementById('profileGateLogo');
    const heading = modal.querySelector('.profile-modal-heading');
    const sub = modal.querySelector('.profile-modal-sub');

    if (isGateMode) {
      modal.classList.add('profile-gate-screen');
      if (closeBtn) closeBtn.style.display = 'none';
      if (gateLogo) gateLogo.style.display = 'flex';
      if (heading) heading.textContent = 'Quem está assistindo?';
      if (sub) sub.textContent = 'Escolha seu perfil para começar a assistir suas séries e filmes';
    } else {
      modal.classList.remove('profile-gate-screen');
      if (closeBtn) closeBtn.style.display = 'block';
      if (gateLogo) gateLogo.style.display = 'none';
      if (heading) heading.textContent = 'Quem está assistindo?';
      if (sub) sub.textContent = 'Troque de perfil ou gerencie suas preferências';
    }

    grid.style.display = 'flex';
    formBox.style.display = 'none';
    footerBtns.style.display = 'flex';
    
    if (!this.profiles || this.profiles.length === 0) {
      grid.innerHTML = '<div style="color:#aaa; padding:20px; text-align:center;">Carregando perfis...</div>';
      this.profiles = (await API.getProfiles()) || [];
    }

    grid.innerHTML = '';
    if (this.profiles.length === 0) {
      this.showProfileForm(null);
      modal.classList.add('open');
      return;
    }

    this.profiles.forEach(p => {
      const isCurrent = this.currentProfile && String(p.id) === String(this.currentProfile.id);
      const visual = this.getAvatarVisual(p.avatar, p.name);
      const card = document.createElement('div');
      card.className = `profile-card ${isCurrent ? 'active' : ''}`;
      card.setAttribute('tabindex', '0');
      
      const avatarContent = visual.isImage 
        ? `<div class="profile-avatar-large" style="background: url('${visual.url}') center/cover no-repeat; border-radius: 14px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.6);">
             ${isManageMode ? '<span class="profile-edit-badge" style="font-size: 10px; font-weight: 700; background: rgba(0,0,0,0.85); color: #fff; border-radius: 4px; padding: 2px 4px;">EDIT</span>' : ''}
           </div>`
        : `<div class="profile-avatar-large" style="background: ${visual.bg}; color: #ffffff; font-family: 'Inter', sans-serif; font-weight: 800; border-radius: 14px;">
             <span>${visual.initial}</span>
             ${isManageMode ? '<span class="profile-edit-badge" style="font-size: 10px; font-weight: 700; background: rgba(0,0,0,0.85); color: #fff; border-radius: 4px; padding: 2px 4px;">EDIT</span>' : ''}
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
          <span>+</span>
        </div>
        <div class="profile-name-large">Adicionar</div>
      `;
      addCard.onclick = () => this.showProfileForm(null);
      addCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.showProfileForm(null);
      });
      grid.appendChild(addCard);
    }

    const manageBtn = document.getElementById('manageProfilesToggleBtn');
    if (manageBtn) {
      manageBtn.textContent = isManageMode ? 'Concluído' : 'Gerenciar perfis';
      manageBtn.onclick = () => {
        this.openProfileModal(!isManageMode, isGateMode);
      };
    }

    const createBtn = document.getElementById('createNewProfileBtn');
    if (createBtn) {
      createBtn.onclick = () => this.showProfileForm(null);
    }



    modal.classList.add('open');

    // Auto-focus no primeiro perfil
    setTimeout(() => {
      const firstCard = grid.querySelector('.profile-card');
      if (firstCard) firstCard.focus();
    }, 80);
  }

  showProfileForm(profileToEdit = null) {
    const grid = document.getElementById('profileModalGrid');
    const formBox = document.getElementById('profileFormBox');
    const footerBtns = document.getElementById('profileModalFooterBtns');
    const titleEl = document.getElementById('profileFormTitle');
    const nameInput = document.getElementById('profileFormNameInput');
    const deleteBtn = document.getElementById('deleteProfileBtn');
    const avatarGrid = document.getElementById('avatarPickerGrid');
    const previewEl = document.getElementById('profileAvatarPreview');

    grid.style.display = 'none';
    footerBtns.style.display = 'none';
    formBox.style.display = 'block';

    this.selectedAvatar = profileToEdit?.avatar || 'spiderman';
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

    const updatePreview = () => {
      if (!previewEl) return;
      const visual = this.getAvatarVisual(this.selectedAvatar, nameInput.value || 'P');
      if (visual.isImage) {
        previewEl.textContent = '';
        previewEl.style.background = `url('${visual.url}') center/cover no-repeat`;
        previewEl.style.border = '2px solid var(--accent-red)';
      } else {
        previewEl.textContent = visual.initial;
        previewEl.style.background = visual.bg;
      }
    };
    updatePreview();

    avatarGrid.innerHTML = '';
    CATALOG_AVATARS.forEach(av => {
      const avBtn = document.createElement('div');
      avBtn.className = `avatar-catalog-item ${av.id === this.selectedAvatar ? 'selected' : ''}`;
      avBtn.style.backgroundImage = `url('${av.img}')`;
      avBtn.title = av.name;

      avBtn.onclick = () => {
        this.selectedAvatar = av.id;
        avatarGrid.querySelectorAll('.avatar-catalog-item').forEach(b => b.classList.remove('selected'));
        avBtn.classList.add('selected');
        updatePreview();
      };
      avatarGrid.appendChild(avBtn);
    });

    nameInput.oninput = () => {
      updatePreview();
    };
  }

  /* ================================================================
     CARREGAMENTO DO CATÁLOGO & RECOMENDAÇÕES
     ================================================================ */

  async loadHome(retryCount = 0) {
    // 1. Carrega o catálogo completo da Home (desduplicado pelo backend)
    const homeData = await API.getHomeCatalog();

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
    const popular = await API.getPopularMovies(1);
    if (popular.length > 0) this.setupHeroSlideshow(popular);
    this.renderCarousel('trendingCarousel', popular);
    const top = await API.getTopRatedMovies(1);
    this.renderCarousel('popularMoviesCarousel', top);
    const nowPlaying = await API.getNowPlaying(1);
    this.renderCarousel('popularSeriesCarousel', nowPlaying);
  }

  async loadSeriesTab() {
    const popular = await API.getPopularSeries(1);
    if (popular.length > 0) this.setupHeroSlideshow(popular);
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

    document.getElementById('heroOverview').textContent = overview;

    document.getElementById('heroPlayBtn').onclick = () => {
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
    document.body.classList.add('in-details-view');
    heroSection.style.display = 'none';
    if (categoriesBar) categoriesBar.style.display = 'none';
    sectionsContainer.style.display = 'none';
    liveTvContainer.style.display = 'none';
    searchContainer.style.display = 'none';

    detailsView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'instant' });

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

    // Badge de cinema CAM / Em Exibição nos Cinemas
    const cinemaBadge = document.getElementById('detailsCinemaBadge');
    const isInTheaters = details.is_in_theaters || (details.release_date && (() => {
      const rd = new Date(details.release_date);
      const diffDays = (new Date() - rd) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays < 75;
    })());

    if (cinemaBadge) {
      if (isInTheaters) {
        cinemaBadge.style.display = 'flex';
        cinemaBadge.innerHTML = '🎬 Em Exibição nos Cinemas';
        cinemaBadge.title = 'Filme em cartaz. Transmissões online podem conter imagens gravadas de sala (CAM).';
      } else {
        cinemaBadge.style.display = 'none';
      }
    }

    // Banner de Filme Ainda Não Lançado / Em Breve nos Cinemas
    const isUpcoming = details.is_unreleased || (details.release_date && new Date(details.release_date) > new Date()) || ["In Production", "Post Production", "Planned"].includes(details.status);
    const upcomingNotice = document.getElementById('detailsUpcomingNotice');
    const toggleSourcesBtn = document.getElementById('detailsToggleSourcesBtn');

    if (upcomingNotice) {
      if (isUpcoming) {
        upcomingNotice.style.display = 'flex';
        let releaseStr = 'Em breve';
        if (details.release_date) {
          const parts = details.release_date.split('-');
          if (parts.length === 3) releaseStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        document.getElementById('detailsUpcomingHeading').textContent = `📅 Estreia nos Cinemas: ${releaseStr}`;
        document.getElementById('detailsUpcomingSub').textContent = `Este filme ainda não estreou. Assista ao trailer oficial com exclusividade!`;
      } else {
        upcomingNotice.style.display = 'none';
      }
    }

    // Botão Voltar
    const backBtn = document.getElementById('detailsViewBackBtn');
    backBtn.onclick = () => {
      detailsView.style.display = 'none';
      document.body.classList.remove('in-details-view');
      this.switchTab(this.currentTab || 'home');
    };

    // Botão Trailer Oficial
    const trailerBtn = document.getElementById('detailsTrailerBtn');
    if (details.trailer_key) {
      trailerBtn.style.display = 'inline-flex';
      // Se ainda não estreou, torna o Trailer o botão principal de destaque
      if (isUpcoming) {
        trailerBtn.className = 'btn btn-primary btn-lg';
        trailerBtn.innerHTML = '<span>🎬</span> Assistir Trailer Oficial';
      } else {
        trailerBtn.className = 'btn btn-secondary btn-lg';
        trailerBtn.innerHTML = 'Assistir Trailer';
      }
      trailerBtn.onclick = () => {
        this.openTrailerModal(details.trailer_key, title);
      };
    } else {
      trailerBtn.style.display = 'none';
    }

    if (toggleSourcesBtn) {
      toggleSourcesBtn.style.display = isUpcoming ? 'none' : 'inline-flex';
    }

    // Botão Favorito / Minha Lista
    const favBtn = document.getElementById('detailsFavBtn');
    const favBtnTop = document.getElementById('detailsViewFavBtnTop');
    const updateFavUi = (isFav) => {
      const text = isFav ? 'Na Minha Lista' : '+ Minha Lista';
      favBtn.innerHTML = `<span>${isFav ? '✓' : '+'}</span> ${isFav ? 'Na Minha Lista' : 'Minha Lista'}`;
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
    if (toggleSourcesBtn) {
      toggleSourcesBtn.onclick = async () => {
        if (sourcesSec && sourcesSec.style.display === 'block') {
          sourcesSec.style.display = 'none';
        } else {
          if (sourcesSec) sourcesSec.style.display = 'block';
          this.loadSourcesList(mediaType, tmdbId, currentSeason, currentEpisode, title, details);
          if (sourcesSec) sourcesSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }

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
        this.fetchAndPlay(mediaType, tmdbId, title, details, season, episode, null, resumeTime);
      };
    } else {
      playBtn.innerHTML = `<span>▶</span> Assistir Agora`;
      playBtn.title = `Iniciar reprodução`;
      playBtn.onclick = () => {
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
    const playBtn = document.getElementById('detailsPlayBtn');
    if (playBtn) playBtn.innerHTML = 'Conectando ao melhor servidor...';

    const resolved = await API.resolveStreams(mediaType, tmdbId, season, episode);
    if (playBtn) {
      this.updateDetailsPlayButton(mediaType, tmdbId, title, details, season, episode, resumeTime);
    }

    const streams = resolved?.streams || [];
    let bestStream = resolved?.best_stream || (streams.length > 0 ? streams[0] : null);
    const isCinema = !!resolved?.is_cinema_version || (bestStream && bestStream.is_cinema);

    if (!bestStream) {
      this.showToast('Nenhuma transmissão disponível no momento para este título.');
      return;
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
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) searchContainer.style.display = 'none';
    this.switchTab(this.previousTab || 'home');
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

    if (searchBackBtn) searchBackBtn.style.display = 'inline-block';
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
        if (modal) modal.style.display = 'none';
      };
    }

    // Limpar Histórico
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.onclick = async () => {
        if (!this.currentProfile) return;
        if (confirm('Deseja realmente limpar todo o histórico de títulos assistidos deste perfil?')) {
          await API.clearWatchHistory(this.currentProfile.id);
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
    if (!this.currentProfile) return;
    const modal = document.getElementById('historyModal');
    const grid = document.getElementById('historyGrid');
    const subEl = document.getElementById('historyModalSub');
    if (!modal || !grid) return;

    modal.style.display = 'flex';
    grid.innerHTML = '<div style="color: #aaa; padding: 30px; text-align: center; grid-column: 1/-1;">Carregando histórico...</div>';
    if (subEl) subEl.textContent = `Títulos assistidos recentemente por ${this.currentProfile.name}`;

    const items = await API.getWatchHistory(this.currentProfile.id);
    grid.innerHTML = '';

    if (!items || items.length === 0) {
      grid.innerHTML = `
        <div style="color: #aaa; text-align: center; padding: 40px 20px; grid-column: 1/-1;">
          <div style="font-size: 36px; margin-bottom: 12px; opacity: 0.6;">⏳</div>
          <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px;">Nenhum título no histórico</div>
          <p style="font-size: 13px; color: #888; max-width: 360px; margin: 0 auto 20px;">Você ainda não assistiu a nenhum filme ou episódio neste perfil. Explore nosso catálogo para começar!</p>
          <button class="btn btn-primary" onclick="document.getElementById('historyModal').style.display='none'">Explorar Catálogo</button>
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
