// Страница категории: шапка папки, язычки статусов, поиск, жанр, сортировка и сетка.
// Каркас строится один раз при входе в категорию (mount), а при изменении
// фильтров или данных обновляются только счётчики и сетка (update) —
// так поле поиска не теряет фокус.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var state = Diary.state;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;

  var YEAR = new Date().getFullYear();
  var mounted = null; // категория, для которой сейчас построен каркас

  function themeVars(cat) {
    var t = Diary.THEME[cat];
    return '--c:' + t.c + ';--fi:' + t.fi + ';--m:' + t.m;
  }

  function sideTabsHtml(except) {
    return '<nav class="side-tabs" aria-label="Другие папки">' +
      Diary.CATEGORIES.filter(function (c) { return c !== except; }).map(function (c) {
        return '<a class="side-tab" href="#/' + c + '" style="' + themeVars(c) + '">' + esc(Diary.CATEGORY_LABEL_PLURAL[c]) + '</a>';
      }).join('') +
      '</nav>';
  }

  function subtitle(all, cat) {
    var done = all.filter(function (e) { return e.status === 'done'; });
    var thisYear = done.filter(function (e) { return e.dateType !== 'unknown' && e.date && e.date.indexOf(String(YEAR)) === 0; }).length;
    var rated = all.filter(function (e) { return e.rating > 0; });
    var avg = rated.length ? (rated.reduce(function (s, e) { return s + e.rating; }, 0) / rated.length).toFixed(1).replace('.', ',') : null;
    return all.length + ' ' + utils.plural(all.length, Diary.CATEGORY_FORMS[cat]) +
      ' · ' + Diary.DONE_WORD[cat] + ' ' + done.length + (thisYear ? ' (' + thisYear + ' за ' + YEAR + ')' : '') +
      (avg ? ' · средняя оценка ' + avg : '');
  }

  function mount(app, cat) {
    var t = Diary.THEME[cat];
    var f = state.filters[cat];
    var genreOptions = '<option value="all">Все жанры</option>' + Diary.GENRES[cat].map(function (g) {
      return '<option value="' + esc(g) + '"' + (f.genre === g ? ' selected' : '') + '>' + esc(g) + '</option>';
    }).join('');
    var sorts = [['date_desc', 'Сначала новые'], ['date_asc', 'Сначала старые'], ['rating_desc', 'По оценке'], ['title_asc', 'По названию А–Я']];

    app.innerHTML = '' +
      '<section class="coll" style="' + themeVars(cat) + '">' +
      '<div class="coll-head">' +
      '<a class="back" href="#/">← все папки</a>' +
      '<div class="coll-hero">' +
      '<div>' +
      '<div class="mono">' + t.code + '_0' + (Diary.CATEGORIES.indexOf(cat) + 1) + ' // папка</div>' +
      '<h1>' + esc(Diary.CATEGORY_LABEL_PLURAL[cat]) + '</h1>' +
      '<p class="coll-sub" data-sub></p>' +
      '</div>' +
      '<div class="coll-mascot">' + Diary.covers.mascot(cat, t.m, { wave: true }) +
      '<svg class="doodle" viewBox="0 0 60 60" aria-hidden="true">' + Diary.covers.sparkle(30, 30, 26, 'currentColor') + '</svg></div>' +
      '</div>' +
      '<div class="coll-tools">' +
      '<label class="field-inline">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
      '<input data-filter="search" type="search" placeholder="Название, жанр, заметки…" value="' + esc(f.search) + '" aria-label="Искать в папке">' +
      '</label>' +
      '<label class="select"><span class="sr">Жанр</span><select data-filter="genre">' + genreOptions + '</select></label>' +
      '<label class="select"><span class="sr">Сортировка</span><select data-filter="sort">' + sorts.map(function (s) {
        return '<option value="' + s[0] + '"' + (f.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>';
      }).join('') + '</select></label>' +
      '<button class="btn" data-action="add" data-category="' + cat + '" type="button"><span aria-hidden="true">+</span> В папку</button>' +
      '</div>' +
      '</div>' +
      '<nav class="status-tabs" data-status-tabs aria-label="Статус"></nav>' +
      '<div class="sheet"><div class="grid" data-grid></div></div>' +
      '</section>' +
      sideTabsHtml(cat);

    mounted = cat;
    update(app);
  }

  function update(app) {
    var cat = mounted;
    if (!cat) return;
    var all = repo.getActive().filter(function (e) { return e.category === cat; });
    var f = state.filters[cat];

    app.querySelector('[data-sub]').textContent = subtitle(all, cat);

    var tabs = [['all', 'Все', '#FFFFFF']].concat(Diary.STATUS_KEYS.map(function (k) {
      return [k, Diary.STATUS_LABEL[cat][k], Diary.STATUS_COLOR[k]];
    }));
    app.querySelector('[data-status-tabs]').innerHTML = tabs.map(function (tab, i) {
      var n = tab[0] === 'all' ? all.length : all.filter(function (e) { return e.status === tab[0]; }).length;
      var on = f.status === tab[0];
      return '<button type="button" class="stab' + (on ? ' is-active' : '') + '" data-status="' + tab[0] + '" style="--sc:' + tab[2] + ';z-index:' + (on ? 6 : 5 - i) + '" aria-pressed="' + on + '">' +
        esc(tab[1]) + '<span class="count">' + n + '</span></button>';
    }).join('');

    Diary.render.renderGrid(app.querySelector('[data-grid]'), Diary.render.filterAndSort(all, f), all, cat);
  }

  function setup(app) {
    app.addEventListener('click', function (ev) {
      if (!mounted || state.currentTab !== mounted) return;
      var tab = ev.target.closest('[data-status]');
      if (tab) { state.filters[mounted].status = tab.getAttribute('data-status'); update(app); return; }
      var card = ev.target.closest('.card[data-id]');
      if (card) Diary.modal.openEntry(card.getAttribute('data-id'));
    });

    var onSearch = utils.debounce(function () { update(app); }, 150);
    app.addEventListener('input', function (ev) {
      if (!mounted || !ev.target.matches('[data-filter="search"]')) return;
      state.filters[mounted].search = ev.target.value;
      onSearch();
    });
    app.addEventListener('change', function (ev) {
      if (!mounted) return;
      var key = ev.target.getAttribute && ev.target.getAttribute('data-filter');
      if (key === 'genre' || key === 'sort') { state.filters[mounted][key] = ev.target.value; update(app); }
    });
  }

  function render(app, cat, opts) {
    if (mounted === cat && !(opts && opts.full) && app.querySelector('[data-grid]')) update(app);
    else mount(app, cat);
  }

  function unmount() { mounted = null; }

  Diary.category = { setup: setup, render: render, unmount: unmount, sideTabsHtml: sideTabsHtml };
})(window.Diary);
