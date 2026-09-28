// Главная: титульный лист «фикс» и четыре вертикальные папки категорий.
// Клик по обложке в папке открывает запись, по остальной папке — переходит в категорию.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;
  var R = Diary.render;

  var THUMB_LIMIT = 9;
  var TAB_TOPS = [36, 170, 304, 438];
  var YEAR = new Date().getFullYear();

  function themeVars(cat) {
    var t = Diary.THEME[cat];
    return '--c:' + t.c + ';--fi:' + t.fi + ';--m:' + t.m;
  }

  function doneThisYear(list) {
    return list.filter(function (e) {
      return e.status === 'done' && e.dateType !== 'unknown' && e.date && e.date.indexOf(String(YEAR)) === 0;
    }).length;
  }

  // Крупные цифры по каждой папке: сколько просмотрено, пройдено, прочитано.
  function statTileHtml(cat, active) {
    var t = Diary.THEME[cat];
    var done = active.filter(function (e) { return e.category === cat && e.status === 'done'; }).length;
    return '<a class="stat-tile" href="#/' + cat + '" style="' + themeVars(cat) + '">' +
      '<span class="stat-top">' + Diary.DONE_WORD[cat] + '</span>' +
      '<span class="stat-num">' + done + '</span>' +
      '<span class="stat-bottom">' + utils.plural(done, Diary.CATEGORY_FORMS[cat]) + '</span>' +
      '<span class="stat-fig">' + Diary.covers.figure(cat, t.m) + '</span>' +
      '</a>';
  }

  function titleSheetHtml(active) {
    var collections = Diary.collectionsRepo.getAll().length;
    var planned = active.filter(function (e) { return e.status === 'planned'; }).length;
    // Заброшенное — отдельная строка, не прибавляется ни к завершённому, ни к планам.
    var dropped = active.filter(function (e) { return e.status === 'dropped'; }).length;

    return '' +
      '<article class="folder folder--title" style="--c:#FFFFFF;--fi:#1C1B3A;z-index:10">' +
      '<div class="folder-tab" aria-hidden="true"><small>FILE_00 //</small>архив</div>' +
      '<div class="folder-body title-sheet">' +
      '<div class="mono">FILE_00 // идея фикс · ' + YEAR + '</div>' +
      '<div class="title-row">' +
      '<h1>фикс</h1>' +
      '<span class="title-deco" aria-hidden="true">' + Diary.covers.figure('series', '#FFE066') + Diary.covers.figure('movie', '#B79CF2') + '</span>' +
      '</div>' +
      '<p class="decode">' + Diary.CATEGORIES.map(function (cat) {
        var label = Diary.CATEGORY_LABEL_PLURAL[cat];
        return '<span style="' + themeVars(cat) + '"><b>' + label.charAt(0) + '</b>' + esc(label.slice(1).toLowerCase()) + '</span>';
      }).join('') + '</p>' +
      '<p class="lead">Всё, что посмотрено, прочитано и пройдено — разложено по папкам.</p>' +
      '<section class="big-stats" aria-label="Статистика">' +
      Diary.CATEGORIES.map(function (cat) { return statTileHtml(cat, active); }).join('') +
      '</section>' +
      '<div class="stats">' +
      // Стикеры красим цветами статусов: завершённое зелёным, планы голубым,
      // заброшенное тёмным — чтобы на главной и в папке они читались одинаково.
      '<span class="sticker" style="--s:#FFE066">' + active.length + ' ' + utils.plural(active.length, ['запись', 'записи', 'записей']) + '</span>' +
      '<span class="sticker" style="--s:' + Diary.STATUS_COLOR.done + '">' + doneThisYear(active) + ' завершено за ' + YEAR + '</span>' +
      '<span class="sticker" style="--s:' + Diary.STATUS_COLOR.planned + '">' + planned + ' в планах</span>' +
      (dropped ? '<span class="sticker" style="--s:' + Diary.STATUS_COLOR.dropped + ';color:' + Diary.STATUS_INK.dropped + '">' + dropped + ' заброшено</span>' : '') +
      '<a class="sticker sticker--link" href="#/collections" style="--s:#6077D4;color:#FFFFFF">' + collections + ' ' + utils.plural(collections, ['подборка', 'подборки', 'подборок']) + ' →</a>' +
      '</div>' +
      '</div>' +
      '</article>';
  }

  function folderHtml(cat, i, active) {
    var t = Diary.THEME[cat];
    var label = Diary.CATEGORY_LABEL_PLURAL[cat];
    var code = t.code + '_0' + (i + 1);
    var list = active
      .filter(function (e) { return e.category === cat; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
    var done = list.filter(function (e) { return e.status === 'done'; }).length;

    var peek = list.length
      ? list.slice(0, THUMB_LIMIT).map(R.thumbHtml).join('')
      : '<span class="folder-empty">пока пусто</span>';

    return '' +
      '<article class="folder" data-category="' + cat + '" style="' + themeVars(cat) + ';--tab-top:' + TAB_TOPS[i] + 'px;z-index:' + (9 - i) + '">' +
      '<a class="folder-tab" href="#/' + cat + '"><small>' + code + ' //</small>' + esc(label) + '</a>' +
      '<div class="folder-body" data-go="' + cat + '" role="link" tabindex="0" aria-label="Открыть папку «' + esc(label) + '»">' +
      '<h2 class="folder-vtitle">' + esc(label.toLowerCase()) + '</h2>' +
      '<div class="folder-main">' +
      '<div class="mono">' + code + ' // ' + list.length + ' ' + utils.plural(list.length, Diary.CATEGORY_FORMS[cat]) + '</div>' +
      '<div class="folder-peek">' + peek + '</div>' +
      '<div class="folder-foot"><span>' + Diary.DONE_WORD[cat] + ': ' + done + '</span><span class="open">открыть →</span></div>' +
      '</div>' +
      '<span class="folder-figure">' + Diary.covers.figure(cat, t.m) + '</span>' +
      '</div>' +
      '</article>';
  }

  // Полка подборок под папками: маленькие папки-подборки и кнопка «новая».
  function collectionsShelfHtml() {
    var cols = Diary.collectionsRepo.getAll();
    return '' +
      '<section class="home-collections" aria-label="Подборки">' +
      '<div class="home-collections-head">' +
      '<div><div class="mono">SET // подборки</div><h2>Подборки</h2></div>' +
      '<a class="home-collections-all" href="#/collections">все подборки →</a>' +
      '</div>' +
      '<div class="packs packs--row">' +
      cols.map(Diary.collections.packHtml).join('') +
      '<button type="button" class="pack-new" data-col-create><span aria-hidden="true">+</span>Новая подборка</button>' +
      '</div>' +
      '</section>';
  }

  function setup(app) {
    app.addEventListener('click', function (ev) {
      if (Diary.state.currentTab !== 'home') return;
      var pack = ev.target.closest('[data-col]');
      if (pack) { Diary.collections.open(pack.getAttribute('data-col')); return; }
      if (ev.target.closest('[data-col-create]')) { Diary.collections.create(); return; }
      var thumb = ev.target.closest('.mini-cover[data-id]');
      if (thumb) { Diary.modal.openEntry(thumb.getAttribute('data-id')); return; }
      var body = ev.target.closest('[data-go]');
      if (body) Diary.goToTab(body.getAttribute('data-go'));
    });
    app.addEventListener('keydown', function (ev) {
      if (Diary.state.currentTab !== 'home' || ev.key !== 'Enter') return;
      var body = ev.target.closest('[data-go]');
      if (body) Diary.goToTab(body.getAttribute('data-go'));
    });
  }

  function render(app) {
    var active = repo.getActive();
    app.innerHTML = '<section class="shelf" aria-label="Папки коллекций">' +
      titleSheetHtml(active) +
      Diary.CATEGORIES.map(function (cat, i) { return folderHtml(cat, i, active); }).join('') +
      '</section>' +
      collectionsShelfHtml();
  }

  Diary.home = { setup: setup, render: render };
})(window.Diary);
