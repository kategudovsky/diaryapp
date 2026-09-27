// Главная: титульный лист «фикс» и четыре вертикальные папки категорий.
// Клик по обложке в папке открывает запись, по остальной папке — переходит в категорию.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;
  var R = Diary.render;

  var THUMB_LIMIT = 9;
  var RECENT_LIMIT = 4;
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

  function titleSheetHtml(active) {
    var recent = active.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, RECENT_LIMIT);
    var collections = Diary.collectionsRepo.getAll().length;

    var recentHtml = recent.length
      ? '<ul>' + recent.map(function (e) {
        return '<li><button class="now-item" data-open="' + e.id + '" type="button">' +
          R.tinyThumbHtml(e) +
          '<span class="now-text"><b>' + esc(e.title) + '</b>' +
          '<small>' + esc(Diary.CATEGORY_LABEL[e.category].toLowerCase()) + ' · ' + esc(R.statusLabel(e).toLowerCase()) + ' · ' + esc(R.dateBadge(e)) + '</small></span>' +
          '</button></li>';
      }).join('') + '</ul>'
      : '<p class="now-empty">Здесь появится всё, что вы добавите.</p>';

    return '' +
      '<article class="folder folder--title" style="--c:#FFF1DD;--fi:#2B1810;z-index:10">' +
      '<div class="folder-tab" aria-hidden="true"><small>FILE_00 //</small>архив</div>' +
      '<div class="folder-body title-sheet">' +
      '<div class="mono">FILE_00 // идея фикс · ' + YEAR + '</div>' +
      '<h1>фикс</h1>' +
      '<p class="decode">' + Diary.CATEGORIES.map(function (cat) {
        var label = Diary.CATEGORY_LABEL_PLURAL[cat];
        return '<span style="' + themeVars(cat) + '"><b>' + label.charAt(0) + '</b>' + esc(label.slice(1).toLowerCase()) + '</span>';
      }).join('') + '</p>' +
      '<p class="lead">Всё, что посмотрено, прочитано и пройдено — разложено по папкам.</p>' +
      '<div class="mascot-row">' +
      Diary.CATEGORIES.map(function (cat, i) {
        return '<a href="#/' + cat + '" class="mascot-link" style="--d:' + (i * 0.15) + 's" aria-label="' + esc(Diary.CATEGORY_LABEL_PLURAL[cat]) + '">' +
          Diary.covers.mascot(cat, Diary.THEME[cat].c, { wave: i === 2 }) + '</a>';
      }).join('') +
      '<span class="hand-note" aria-hidden="true">выбирай папку →</span>' +
      '</div>' +
      '<section class="now"><h3>Недавно добавлено</h3>' + recentHtml + '</section>' +
      '<div class="stats">' +
      '<span class="sticker" style="--s:#C9F04B">' + active.length + ' ' + utils.plural(active.length, ['запись', 'записи', 'записей']) + '</span>' +
      '<span class="sticker" style="--s:#FF9ACB">' + doneThisYear(active) + ' за ' + YEAR + '</span>' +
      '<span class="sticker" style="--s:#FFD23F">' + active.filter(function (e) { return e.status === 'planned'; }).length + ' в планах</span>' +
      '<a class="sticker sticker--link" href="#/collections" style="--s:#C7B4F7">' + collections + ' ' + utils.plural(collections, ['подборка', 'подборки', 'подборок']) + ' →</a>' +
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
      '<span class="folder-mascot">' + Diary.covers.mascot(cat, t.m) + '</span>' +
      '</div>' +
      '</article>';
  }

  function setup(app) {
    app.addEventListener('click', function (ev) {
      if (Diary.state.currentTab !== 'home') return;
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
      '</section>';
  }

  Diary.home = { setup: setup, render: render };
})(window.Diary);
