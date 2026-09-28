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

  var openId = null; // id of the collection currently open in detail view
  var pickerOpen = false;
  var formOpen = false;

  // Где у папки-подборки язычок: слева, ближе к середине, справа. Правый крепится
  // от края, чтобы плечико не вылезало за папку при любой ширине.
  var PACK_TAB_POS = ['--tab-left:22px', '--tab-left:34%', '--tab-left:auto;--tab-right:22px'];

  // Цвета папок-подборок идут по кругу.
  var PACK_COLORS = [
    ['#EC1864', '#FFFFFF'], ['#FFC43D', '#1C1B3A'], ['#6077D4', '#FFFFFF'],
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
    return '--c:' + t.c + ';--fi:' + t.fi + ';--m:#FFC43D';
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
      '<div class="coll-figure coll-figure--still">' + Diary.covers.figure('collections', '#FFC43D') +
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
        '<span class="empty-hint">Создайте первую, чтобы собрать тематическую коллекцию из всего, что у вас есть.</span></div>'
      : '<div class="packs">' + collections.map(packHtml).join('') + '</div>';

    app.innerHTML = '' +
      '<section class="coll" style="' + pageVars() + '">' +
      headHtml({
        code: 'SET_00 // подборки',
        title: 'Подборки',
        sub: collections.length + ' ' + utils.plural(collections.length, ['подборка', 'подборки', 'подборок']) + ' · записи из любых папок',
        tools: '<button type="button" class="btn" data-col-new>+ Создать подборку</button>' +
          '<form class="inline-form" data-col-form' + (formOpen ? '' : ' hidden') + '>' +
          '<input type="text" name="name" placeholder="Название подборки…" aria-label="Название подборки" autocomplete="off">' +
          '<button type="submit" class="btn btn--ink">Создать</button>' +
          '</form>'
      }) +
      '<div class="sheet sheet--flat">' + body + '</div>' +
      '</section>';

    if (formOpen) app.querySelector('[data-col-form] input').focus();
  }

  // ==================== DETAIL ====================

  function pickerHtml(col) {
    var all = repo.getActive();
    if (all.length === 0) {
      return '<p class="picker-empty">В хранилище пока нет записей.</p>';
    }
    return '<div class="picker"><div class="picker-head"><b>Что положить в подборку</b><span>отметьте записи</span></div>' +
      '<div class="picker-list">' + all.map(function (e) {
        var checked = col.entryIds.indexOf(e.id) !== -1 ? ' checked' : '';
        var t = Diary.THEME[e.category];
        return '<label class="picker-row">' +
          '<input type="checkbox" data-pick="' + e.id + '"' + checked + '>' +
          '<span class="picker-check" aria-hidden="true"></span>' +
          R.tinyThumbHtml(e) +
          '<span class="picker-row-title">' + esc(e.title) + '</span>' +
          '<span class="result-type" style="--c:' + t.c + ';--fi:' + t.fi + '">' + esc(Diary.CATEGORY_LABEL[e.category]) + '</span>' +
          '</label>';
      }).join('') + '</div></div>';
  }

  function renderDetail(app, col) {
    var entries = liveEntries(col.entryIds);
    var gridHtml = entries.length
      ? '<div class="grid">' + entries.map(function (e) {
        return '<div class="collection-item">' + R.cardHtml(e) +
          '<button type="button" class="collection-remove" data-remove="' + e.id + '" title="Убрать из подборки" aria-label="Убрать «' + esc(e.title) + '» из подборки">×</button>' +
          '</div>';
      }).join('') + '</div>'
      : '<div class="empty">' + Diary.covers.figure('collections', '#EC1864') + '<p>Подборка пуста</p><span class="empty-hint">Добавьте записи из вашего хранилища.</span></div>';

    app.innerHTML = '' +
      '<section class="coll" style="' + pageVars() + '">' +
      headHtml({
        code: 'SET // подборка',
        title: col.name,
        sub: countText(entries.length),
        tools: '<button type="button" class="btn" data-col-pick aria-expanded="' + pickerOpen + '">' + (pickerOpen ? 'Готово' : '+ Добавить записи') + '</button>' +
          '<button type="button" class="btn btn--ghost" data-col-delete>Удалить подборку</button>'
      }) +
      '<div class="sheet sheet--flat">' + (pickerOpen ? pickerHtml(col) : '') + gridHtml + '</div>' +
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

      if (t.closest('[data-col-new]')) { formOpen = !formOpen; render(app); return; }
      var pack = t.closest('[data-col]');
      if (pack) { openId = pack.getAttribute('data-col'); pickerOpen = false; render(app); window.scrollTo(0, 0); return; }
      if (t.closest('[data-col-back]')) { openId = null; render(app); return; }
      if (t.closest('[data-col-pick]')) { pickerOpen = !pickerOpen; render(app); return; }

      var col = current();
      if (t.closest('[data-col-delete]') && col) {
        if (!confirm('Удалить подборку «' + col.name + '»? Сами записи останутся в дневнике.')) return;
        collRepo.remove(col.id);
        openId = null;
        render(app);
        return;
      }
      var removeBtn = t.closest('[data-remove]');
      if (removeBtn && col) { collRepo.removeEntry(col.id, removeBtn.getAttribute('data-remove')); render(app); return; }

      var card = t.closest('.card[data-id]');
      if (card) Diary.modal.openEntry(card.getAttribute('data-id'));
    });

    app.addEventListener('change', function (ev) {
      if (Diary.state.currentTab !== 'collections') return;
      var box = ev.target.closest('[data-pick]');
      var col = current();
      if (!box || !col) return;
      var id = box.getAttribute('data-pick');
      var scroll = app.querySelector('.picker-list') ? app.querySelector('.picker-list').scrollTop : 0;
      if (box.checked) collRepo.addEntry(col.id, id);
      else collRepo.removeEntry(col.id, id);
      render(app);
      var list = app.querySelector('.picker-list');
      if (list) list.scrollTop = scroll;
    });

    app.addEventListener('submit', function (ev) {
      if (!ev.target.matches('[data-col-form]')) return;
      ev.preventDefault();
      var input = ev.target.querySelector('input');
      if (!input.value.trim()) return;
      var created = collRepo.add(input.value);
      formOpen = false;
      openId = created.id;
      pickerOpen = true;
      render(app);
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
  }

  // При уходе со страницы возвращаемся к списку подборок.
  function reset() { openId = null; pickerOpen = false; formOpen = false; }

  // Открыть подборку с другой страницы (например, с полки на главной).
  function open(id) {
    openId = id;
    pickerOpen = false;
    Diary.goToTab('collections');
  }

  // Открыть страницу подборок сразу с полем для новой.
  function create() {
    openId = null;
    formOpen = true;
    Diary.goToTab('collections');
  }

  Diary.collections = { setup: setup, render: render, reset: reset, open: open, create: create, packHtml: packHtml };
})(window.Diary);
