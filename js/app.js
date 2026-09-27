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

  function tabFromHash() {
    var tab = (window.location.hash || '').replace(/^#\/?/, '');
    return Diary.TABS.indexOf(tab) !== -1 ? tab : 'home';
  }

  // Цвет страницы: кремовый на главной, цвет папки внутри категории.
  function applyPageTheme(tab) {
    var body = document.body;
    var t = isCategory(tab) ? Diary.THEME[tab] : Diary.PAGE_THEME[tab];
    body.dataset.view = tab === 'home' ? 'home' : 'collection';
    if (t) {
      body.style.setProperty('--page', t.c);
      body.style.setProperty('--grid', t.grid);
      body.style.setProperty('--page-fi', t.fi);
    } else {
      ['--page', '--grid', '--page-fi'].forEach(function (p) { body.style.removeProperty(p); });
    }
  }

  function renderCurrentTab(opts) {
    var tab = state.currentTab;
    if (tab === 'home') Diary.home.render(app);
    else if (isCategory(tab)) Diary.category.render(app, tab, opts);
    else if (tab === 'collections') Diary.collections.render(app);
    else if (tab === 'trash') Diary.trash.render(app);
  }

  function switchTab(tab) {
    if (state.currentTab === 'collections' && tab !== 'collections') Diary.collections.reset();
    state.currentTab = tab;
    Diary.category.unmount();
    applyPageTheme(tab);
    renderCurrentTab({ full: true });
    updateTrashButton();
    window.scrollTo(0, 0);
  }

  // Переход из кода: меняем адрес, а отрисовку делает обработчик hashchange.
  function goToTab(tab) {
    var hash = tab === 'home' ? '#/' : '#/' + tab;
    if (window.location.hash === hash || (tab === 'home' && !window.location.hash)) switchTab(tab);
    else window.location.hash = hash;
  }

  Diary.goToTab = goToTab;

  function updateTrashButton() {
    var btn = document.getElementById('trashBtn');
    var count = repo.getTrashed().length;
    var badge = btn.querySelector('.trash-count');
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count === 0;
    btn.classList.toggle('is-active', state.currentTab === 'trash');
    btn.setAttribute('aria-label', 'Корзина' + (count ? ', записей: ' + count : ''));
    document.getElementById('collectionsLink').classList.toggle('is-active', state.currentTab === 'collections');
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
      results.hidden = false;
    }, 120));

    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        var first = results.querySelector('[data-open]');
        if (first) first.click();
      }
      if (ev.key === 'Escape') hide();
    });

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('.search')) hide();
    });
  }

  function init() {
    app = document.getElementById('app');

    Diary.home.setup(app);
    Diary.category.setup(app);
    Diary.collections.setup(app);
    Diary.trash.setup(app);
    Diary.modal.setup();
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

    document.getElementById('trashBtn').addEventListener('click', function () { goToTab('trash'); });

    window.addEventListener('hashchange', function () { switchTab(tabFromHash()); });

    repo.onChange(function () {
      if (!repo.isReady()) return;
      renderCurrentTab();
      updateTrashButton();
    });

    Promise.all([repo.init(), Diary.collectionsRepo.init()]).then(function () {
      switchTab(tabFromHash());
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.Diary);
