// Bootstraps the app: routing between pages, the global search in the top bar,
// the trash button, and re-rendering whatever is visible whenever the
// repository changes.
// Текущая страница хранится в Diary.state.currentTab и дублируется в адресе
// (#/movie, #/collections…), чтобы работали кнопка «назад» и ссылки.
window.Diary = window.Diary || {};

(function (Diary) {
  var state = Diary.state;
  var repo = Diary.repository;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;

  var app;

  function isCategory(tab) { return Diary.CATEGORIES.indexOf(tab) !== -1; }

  // Параметры из адреса вида #/search?q=… — нужны странице поиска.
  var hashParams = new URLSearchParams('');

  function tabFromHash() {
    var parts = (window.location.hash || '').replace(/^#\/?/, '').split('?');
    hashParams = new URLSearchParams(parts[1] || '');
    return Diary.TABS.indexOf(parts[0]) !== -1 ? parts[0] : 'home';
  }

  // Цвет страницы: кремовый на главной, цвет папки внутри категории.
  function applyPageTheme(tab) {
    // Переменные ставим на <html>, а не на <body>: полоса прокрутки страницы
    // принадлежит корню документа и берёт цвета оттуда.
    var root = document.documentElement;
    var t = isCategory(tab) ? Diary.THEME[tab] : Diary.PAGE_THEME[tab];
    document.body.dataset.view = tab === 'home' ? 'home' : 'collection';
    if (t) {
      root.style.setProperty('--page', t.c);
      root.style.setProperty('--grid', t.grid);
      root.style.setProperty('--page-fi', t.fi);
    } else {
      ['--page', '--grid', '--page-fi'].forEach(function (p) { root.style.removeProperty(p); });
    }
  }

  function renderCurrentTab(opts) {
    var tab = state.currentTab;
    if (tab === 'home') Diary.home.render(app);
    else if (isCategory(tab)) Diary.category.render(app, tab, opts);
    else if (tab === 'collections') Diary.collections.render(app);
    else if (tab === 'trash') Diary.trash.render(app);
    else if (tab === 'about') Diary.about.render(app);
    else if (tab === 'search') Diary.search.render(app, opts && opts.full ? hashParams : null, opts);
  }

  function switchTab(tab) {
    // Смена страницы (в том числе кнопкой «назад» в браузере) закрывает окна.
    if (Diary.modal.isOpen()) Diary.modal.close();
    if (Diary.collectionModal.isOpen()) Diary.collectionModal.close();
    if (state.currentTab === 'collections' && tab !== 'collections') Diary.collections.reset();
    state.currentTab = tab;
    Diary.category.unmount();
    Diary.search.unmount();
    if (tab !== 'search') document.getElementById('globalSearchInput').value = '';
    applyPageTheme(tab);
    renderCurrentTab({ full: true });
    updateNav();
    Diary.footer.render();
    updateTrashFab();
    window.scrollTo(0, 0);
  }

  // Переход из кода: меняем адрес, а отрисовку делает обработчик hashchange.
  function goToTab(tab) {
    var hash = tab === 'home' ? '#/' : '#/' + tab;
    if (window.location.hash === hash || (tab === 'home' && !window.location.hash)) switchTab(tab);
    else window.location.hash = hash;
  }

  Diary.goToTab = goToTab;

  // Активный раздел в шапке. Страницы категорий и корзина относятся к «Все фиксы».
  function updateNav() {
    var tab = state.currentTab;
    var section = tab === 'collections' || tab === 'about' ? tab : tab === 'search' ? null : 'home';
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (a) {
      var on = a.getAttribute('data-nav') === section;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  // ---- кнопка корзины в правом нижнем углу ----
  // Счётчик удалённых записей. На компьютере кнопка живёт в правой полосе, куда
  // не заходит контент. Над тёмным футером она становится белой; нижняя строка
  // футера оставляет справа место под кнопку.

  function updateTrashFab() {
    var fab = document.getElementById('trashFab');
    var count = repo.getTrashed().length;
    var badge = fab.querySelector('.trash-fab-count');
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count === 0;
    fab.setAttribute('aria-label', 'Корзина' + (count ? ', записей: ' + count : ''));
    var here = state.currentTab === 'trash';
    fab.classList.toggle('is-active', here);
    if (here) fab.setAttribute('aria-current', 'page'); else fab.removeAttribute('aria-current');
    positionTrashFab();
  }

  function positionTrashFab() {
    var fab = document.getElementById('trashFab');
    var sheet = document.querySelector('#siteFooter .footer-sheet');
    if (!sheet) return;
    var r = fab.getBoundingClientRect();
    var s = sheet.getBoundingClientRect();
    var cy = r.top + r.height / 2;
    fab.classList.toggle('is-on-footer', cy > s.top && r.left < s.right);
  }

  // ---- тост ----
  var toastTimer = null;
  Diary.toast = function (msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  };

  // ---- поиск в верхней панели: по всем активным записям сразу ----
  function setupGlobalSearch() {
    var input = document.getElementById('globalSearchInput');
    var results = document.getElementById('globalSearchResults');

    function hide() { results.hidden = true; }

    input.addEventListener('input', utils.debounce(function () {
      var q = input.value.trim();
      if (!q) { hide(); return; }
      var found = repo.getActive().filter(function (e) { return Diary.render.matchesQuery(e, q); }).slice(0, 8);
      results.innerHTML = found.length
        ? found.map(function (e) {
          var t = Diary.THEME[e.category];
          return '<button type="button" class="result" data-open="' + e.id + '">' +
            Diary.render.tinyThumbHtml(e) +
            '<span class="now-text"><b>' + esc(e.title) + '</b><small>' + esc(Diary.render.statusLabel(e)) + ' · ' + esc(Diary.render.dateBadge(e)) + '</small></span>' +
            '<span class="result-type" style="--c:' + t.c + ';--fi:' + t.fi + '">' + esc(Diary.CATEGORY_LABEL[e.category]) + '</span>' +
            '</button>';
        }).join('')
        : '<p class="result-empty">Ничего не нашлось</p>';
      var total = repo.getActive().filter(function (e) { return Diary.render.matchesQuery(e, q); }).length;
      results.innerHTML += '<button type="button" class="result result--all" data-search-all>' +
        (total ? 'Все результаты — ' + total + ' ' + utils.plural(total, ['запись', 'записи', 'записей']) : 'Открыть поиск') +
        ' <span aria-hidden="true">→</span></button>';
      results.hidden = false;
    }, 120));

    input.addEventListener('keydown', function (ev) {
      // Enter — страница со всеми результатами; подсказки открываются кликом.
      if (ev.key === 'Enter') {
        ev.preventDefault();
        hide();
        input.blur();
        Diary.search.go(input.value);
      }
      if (ev.key === 'Escape') hide();
    });

    results.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-search-all]')) return;
      hide();
      Diary.search.go(input.value);
    });

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search')) hide();
    });
  }

  function init() {
    app = document.getElementById('app');

    // Шрифт заголовков лежит в fonts/. Если он нашёлся — ослабляем трекинг под него.
    if (document.fonts && document.fonts.load) {
      document.fonts.load('1em NauryzRedKeds').then(function (faces) {
        if (faces.length) document.documentElement.classList.add('has-display-font');
      }).catch(function () {});
    }

    Diary.home.setup(app);
    Diary.category.setup(app);
    Diary.collections.setup(app);
    Diary.trash.setup(app);
    Diary.search.setup(app);
    Diary.footer.setup();
    Diary.modal.setup();
    Diary.collectionModal.setup();
    Diary.backup.setup();
    setupGlobalSearch();

    // Общие действия: открыть запись и «добавить» — работают на любой странице.
    document.addEventListener('click', function (ev) {
      var open = ev.target.closest('[data-open]');
      if (open) {
        document.getElementById('globalSearchResults').hidden = true;
        Diary.modal.openEntry(open.getAttribute('data-open'));
        return;
      }
      var add = ev.target.closest('[data-action="add"]');
      if (add) {
        var cat = add.getAttribute('data-category') || (isCategory(state.currentTab) ? state.currentTab : 'movie');
        Diary.modal.openEntry(null, cat);
      }
    });

    window.addEventListener('hashchange', function () { switchTab(tabFromHash()); });
    window.addEventListener('scroll', positionTrashFab, { passive: true });
    window.addEventListener('resize', positionTrashFab);

    // Клик по разделу, в котором уже находишься (например, «Подборки» изнутри
    // подборки), возвращает к началу раздела — адрес при этом не меняется.
    document.querySelector('.mainnav').addEventListener('click', function (ev) {
      var link = ev.target.closest('[data-nav]');
      if (!link || link.getAttribute('href') !== window.location.hash) return;
      ev.preventDefault();
      if (state.currentTab === 'collections') Diary.collections.reset();
      switchTab(link.getAttribute('data-nav'));
    });

    repo.onChange(function () {
      if (!repo.isReady()) return;
      renderCurrentTab();
      Diary.footer.render();
      updateTrashFab();
    });

    // Подборки меняются из окна подборки, то есть мимо страницы — поэтому
    // перерисовываемся по событию хранилища, а не по клику.
    Diary.collectionsRepo.onChange(function () {
      if (!repo.isReady()) return;
      renderCurrentTab();
    });

    Promise.all([repo.init(), Diary.collectionsRepo.init()]).then(function () {
      switchTab(tabFromHash());
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.Diary);
