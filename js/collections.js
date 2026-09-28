// "Подборки" (Collections) panel: user-created named groups that can pull in
// any entry from any category regardless of status. Two views sharing one
// panel — an overview grid of collection cards, and a detail view (open one
// collection, browse/remove its members, add more from the whole library).
// В «Фиксе» каждая подборка выглядит как маленькая папка с язычком.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var collRepo = Diary.collectionsRepo;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;
  var R = Diary.render;

  var openId = null;      // id of the collection currently open in detail view
  var pendingNew = false; // «собрать новую» попросили с другой страницы

  // Где у папки-подборки язычок: слева, ближе к середине, справа. Отступ от края —
  // не меньше скругления папки (22px) плюс плечико (14px), иначе плечико висит над углом.
  var PACK_TAB_POS = ['--tab-left:40px', '--tab-left:36%', '--tab-left:auto;--tab-right:40px'];

  // Цвета папок-подборок идут по кругу.
  var PACK_COLORS = [
    ['#EC1864', '#FFFFFF'], ['#FFE066', '#1C1B3A'], ['#6077D4', '#FFFFFF'],
    ['#B79CF2', '#1C1B3A'], ['#DAF5F9', '#1C1B3A']
  ];

  function liveEntries(entryIds) {
    return entryIds
      .map(function (id) { return repo.getById(id); })
      .filter(function (e) { return e && !e.deletedAt; });
  }

  function countText(n) {
    return n + ' ' + utils.plural(n, ['запись', 'записи', 'записей']);
  }

  function pageVars() {
    var t = Diary.PAGE_THEME.collections;
    return '--c:' + t.c + ';--fi:' + t.fi + ';--m:#FFE066';
  }

  function headHtml(opts) {
    return '' +
      '<div class="coll-head">' +
      '<div class="coll-hero">' +
      '<div>' +
      '<div class="mono">' + opts.code + '</div>' +
      '<h1>' + esc(opts.title) + '</h1>' +
      '<p class="coll-sub">' + esc(opts.sub) + '</p>' +
      '</div>' +
      '<div class="coll-figure coll-figure--still">' + Diary.covers.figure('collections', '#EC1864') +
      '<svg class="doodle" viewBox="0 0 60 60" aria-hidden="true">' + Diary.covers.sparkle(30, 30, 26, 'currentColor') + '</svg></div>' +
      '</div>' +
      '<div class="coll-tools">' + opts.tools + '</div>' +
      '</div>';
  }

  // ==================== OVERVIEW ====================

  var THUMB_LIMIT = 6;

  function packHtml(col, i) {
    var entries = liveEntries(col.entryIds);
    var c = PACK_COLORS[i % PACK_COLORS.length];
    var peek = entries.length
      ? entries.slice(0, THUMB_LIMIT).map(R.thumbHtml).join('')
      : '<span class="folder-empty">пока пусто</span>';
    return '' +
      '<button type="button" class="pack" data-col="' + col.id + '" style="--c:' + c[0] + ';--fi:' + c[1] + ';' + PACK_TAB_POS[i % 3] + '">' +
      '<span class="pack-tab">' + countText(entries.length) + '</span>' +
      '<span class="pack-body">' +
      '<span class="pack-name">' + esc(col.name) + '</span>' +
      '<span class="pack-peek">' + peek + '</span>' +
      '</span>' +
      '</button>';
  }

  function renderOverview(app) {
    var collections = collRepo.getAll();
    var body = collections.length === 0
      ? '<div class="empty">' + Diary.covers.figure('collections', '#EC1864') + '<p>Пока нет подборок</p>' +
        '<span class="empty-hint">Соберите первую — в неё можно сложить что угодно из любых папок.</span>' +
        '<button type="button" class="btn" data-col-new>+ Собрать первую</button></div>'
      : '<div class="packs">' + collections.map(packHtml).join('') + '</div>';

    app.innerHTML = '' +
      '<section class="coll" style="' + pageVars() + '">' +
      headHtml({
        code: 'SET_00 // подборки',
        title: 'Подборки',
        sub: collections.length + ' ' + utils.plural(collections.length, ['подборка', 'подборки', 'подборок']) + ' · записи из любых папок',
        tools: '<button type="button" class="btn" data-col-new>+ Создать подборку</button>'
      }) +
      '<div class="sheet sheet--flat">' + body + '</div>' +
      '</section>';
  }

  // ==================== DETAIL ====================

  function renderDetail(app, col) {
    var entries = liveEntries(col.entryIds);
    var gridHtml = entries.length
      ? '<div class="grid">' + entries.map(function (e) {
        return '<div class="collection-item">' + R.cardHtml(e) +
          '<button type="button" class="collection-remove" data-remove="' + e.id + '" title="Убрать из подборки" aria-label="Убрать «' + esc(e.title) + '» из подборки">×</button>' +
          '</div>';
      }).join('') + '</div>'
      : '<div class="empty">' + Diary.covers.figure('collections', '#EC1864') + '<p>Подборка пуста</p>' +
        '<span class="empty-hint">Положите в неё что-нибудь из дневника.</span>' +
        '<button type="button" class="btn" data-col-edit>+ Добавить записи</button></div>';

    app.innerHTML = '' +
      '<section class="coll" style="' + pageVars() + '">' +
      headHtml({
        code: 'SET // подборка',
        title: col.name,
        sub: countText(entries.length),
        tools: '<button type="button" class="btn" data-col-edit>Изменить подборку</button>'
      }) +
      '<div class="sheet sheet--flat">' + gridHtml + '</div>' +
      '</section>';
  }

  // ==================== PUBLIC ====================

  function current() {
    return openId ? collRepo.getById(openId) : null;
  }

  function setup(app) {
    app.addEventListener('click', function (ev) {
      if (Diary.state.currentTab !== 'collections') return;
      var t = ev.target;

      if (t.closest('[data-col-new]')) { Diary.collectionModal.open(null); return; }
      var pack = t.closest('[data-col]');
      if (pack) { openId = pack.getAttribute('data-col'); render(app); window.scrollTo(0, 0); return; }

      var col = current();
      if (t.closest('[data-col-edit]') && col) { Diary.collectionModal.open(col.id); return; }

      var removeBtn = t.closest('[data-remove]');
      if (removeBtn && col) { collRepo.removeEntry(col.id, removeBtn.getAttribute('data-remove')); render(app); return; }

      var card = t.closest('.card[data-id]');
      if (card) Diary.modal.openEntry(card.getAttribute('data-id'));
    });

  }

  function render(app) {
    var col = current();
    if (col) {
      renderDetail(app, col);
    } else {
      openId = null;
      renderOverview(app);
    }
    if (pendingNew) {
      pendingNew = false;
      Diary.collectionModal.open(null);
    }
  }

  // При уходе со страницы возвращаемся к списку подборок.
  function reset() { openId = null; pendingNew = false; }

  // Открыть подборку с другой страницы (например, с полки на главной).
  function open(id) {
    openId = id;
    Diary.goToTab('collections');
  }

  // Новая подборка с другой страницы. Окно открывается не здесь, а после
  // отрисовки раздела: переход через адресную строку случается не сразу,
  // и открытое до него окно тут же закрылось бы сменой страницы.
  function create() {
    openId = null;
    pendingNew = true;
    Diary.goToTab('collections');
  }

  Diary.collections = { setup: setup, render: render, reset: reset, open: open, create: create, packHtml: packHtml };
})(window.Diary);
