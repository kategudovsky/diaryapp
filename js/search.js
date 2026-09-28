// Страница результатов поиска: #/search?q=…
// Ищет по названию, автору, жанрам, комментариям и цитатам во всех папках
// (те же правила, что у поиска внутри папки) и по названиям подборок.
// Как и страница категории, каркас строится один раз, а при вводе обновляются
// только результаты — поле не теряет фокус. Адрес обновляется без перехода.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;
  var R = Diary.render;

  var q = '';
  var category = 'all';
  var mounted = false;

  function hashFor(query) {
    return '#/search' + (query ? '?q=' + encodeURIComponent(query) : '');
  }

  // Перейти к результатам (из поиска в шапке по Enter).
  function go(query) {
    query = (query || '').trim();
    var hash = hashFor(query);
    if (Diary.state.currentTab === 'search' && window.location.hash === hash) {
      setQuery(query);
      return;
    }
    window.location.hash = hash;
  }

  // Где нашлось слово, если не в названии, авторе или жанре: кусочек комментария или цитаты.
  function snippet(e, query) {
    var ql = query.toLowerCase();
    if ((e.title || '').toLowerCase().indexOf(ql) > -1 ||
      (e.author || '').toLowerCase().indexOf(ql) > -1 ||
      (e.genres || []).join(' ').toLowerCase().indexOf(ql) > -1) return null;
    var pools = [['комментарий', e.comments || []], ['цитата', e.quotes || []]];
    for (var i = 0; i < pools.length; i++) {
      for (var j = 0; j < pools[i][1].length; j++) {
        var text = pools[i][1][j].text;
        var at = text.toLowerCase().indexOf(ql);
        if (at > -1) {
          var from = Math.max(0, at - 30);
          var to = Math.min(text.length, at + query.length + 40);
          return {
            kind: pools[i][0],
            html: (from > 0 ? '…' : '') + esc(text.slice(from, at)) +
              '<mark>' + esc(text.slice(at, at + query.length)) + '</mark>' +
              esc(text.slice(at + query.length, to)) + (to < text.length ? '…' : '')
          };
        }
      }
    }
    return null;
  }

  function found() {
    if (!q) return [];
    return repo.getActive()
      .filter(function (e) { return R.matchesQuery(e, q); })
      .sort(function (a, b) { return (a.title || '').localeCompare(b.title || '', 'ru'); });
  }

  function foundCollections() {
    if (!q) return [];
    var ql = q.toLowerCase();
    return Diary.collectionsRepo.getAll().filter(function (c) { return c.name.toLowerCase().indexOf(ql) > -1; });
  }

  function mount(app) {
    var p = Diary.PAGE_THEME.search;
    app.innerHTML = '' +
      '<section class="coll" style="--c:' + p.c + ';--fi:' + p.fi + '">' +
      '<div class="coll-head">' +
      '<div class="coll-hero">' +
      '<div>' +
      '<div class="mono">FIND // поиск</div>' +
      '<h1>Поиск</h1>' +
      '<p class="coll-sub" data-search-sub></p>' +
      '</div>' +
      '</div>' +
      '<form class="coll-tools search-page-form" data-search-form role="search">' +
      '<label class="field-inline field-inline--wide">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
      '<input data-search-input type="search" placeholder="Название, автор, жанр, заметка…" value="' + esc(q) + '" aria-label="Что ищем" autocomplete="off">' +
      '</label>' +
      '<button class="btn" type="submit">Найти</button>' +
      '</form>' +
      '</div>' +
      '<nav class="status-tabs" data-search-tabs aria-label="Папка"></nav>' +
      '<div class="sheet"><div data-search-results></div></div>' +
      '</section>';
    mounted = true;
    update(app);
  }

  function update(app) {
    if (!mounted || !app.querySelector('[data-search-results]')) return;
    var all = found();
    var cols = foundCollections();

    app.querySelector('[data-search-sub]').textContent = !q
      ? 'Введите слово — поищу во всех папках, заметках и цитатах.'
      : 'По запросу «' + q + '» — ' + all.length + ' ' + utils.plural(all.length, ['запись', 'записи', 'записей']) +
        (cols.length ? ' и ' + cols.length + ' ' + utils.plural(cols.length, ['подборка', 'подборки', 'подборок']) : '');

    var tabs = [['all', 'Все', 'var(--stone)', all.length]].concat(Diary.CATEGORIES.map(function (c) {
      return [c, Diary.CATEGORY_LABEL_PLURAL[c], Diary.THEME[c].c, all.filter(function (e) { return e.category === c; }).length, Diary.THEME[c].fi];
    }));
    if (category !== 'all' && !all.some(function (e) { return e.category === category; })) category = 'all';
    app.querySelector('[data-search-tabs]').innerHTML = tabs.map(function (t, i) {
      var on = category === t[0];
      var fi = t[4] && !on ? ';color:' + t[4] : '';
      return '<button type="button" class="stab' + (t[0] === 'all' ? ' stab--all' : '') + (on ? ' is-active' : '') + '" data-search-cat="' + t[0] + '"' +
        (t[3] || t[0] === 'all' ? '' : ' disabled') +
        ' style="--sc:' + t[2] + fi + ';z-index:' + (on ? 6 : 5 - i) + '" aria-pressed="' + on + '">' +
        esc(t[1]) + '<span class="count">' + t[3] + '</span></button>';
    }).join('');

    var list = category === 'all' ? all : all.filter(function (e) { return e.category === category; });
    var out = '';
    if (cols.length && category === 'all') {
      out += '<h2 class="search-section">Подборки</h2><div class="packs packs--row packs--search">' + cols.map(Diary.collections.packHtml).join('') + '</div>';
      if (list.length) out += '<h2 class="search-section">Записи</h2>';
    }
    if (list.length) {
      out += '<div class="grid">' + list.map(function (e) {
        var sn = snippet(e, q);
        return '<div class="search-item">' + R.cardHtml(e) +
          (sn ? '<p class="search-snippet"><span>' + sn.kind + '</span>' + sn.html + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (!out) {
      out = '<div class="empty">' + Diary.covers.figure('movie', '#EC1864') +
        '<p>' + (q ? 'Ничего не нашлось' : 'Что ищем?') + '</p>' +
        '<span class="empty-hint">' + (q ? 'Попробуйте другое слово — поиск идёт по названиям, авторам, жанрам, комментариям и цитатам.' : 'Например, «Мураками», «фэнтези» или слово из цитаты.') + '</span></div>';
    }
    app.querySelector('[data-search-results]').innerHTML = out;
  }

  function setQuery(query) {
    q = query;
    try { history.replaceState(null, '', hashFor(q)); } catch (e) { /* file:// в некоторых браузерах */ }
    var top = document.getElementById('globalSearchInput');
    if (top) top.value = q;
    var app = document.getElementById('app');
    var input = app.querySelector('[data-search-input]');
    if (input && input.value !== q) input.value = q;
    update(app);
  }

  function setup(app) {
    var onInput = utils.debounce(function (value) { setQuery(value.trim()); }, 200);
    app.addEventListener('input', function (ev) {
      if (Diary.state.currentTab !== 'search' || !ev.target.matches('[data-search-input]')) return;
      onInput(ev.target.value);
    });
    app.addEventListener('submit', function (ev) {
      if (!ev.target.matches('[data-search-form]')) return;
      ev.preventDefault();
      setQuery(ev.target.querySelector('[data-search-input]').value.trim());
    });
    app.addEventListener('click', function (ev) {
      if (Diary.state.currentTab !== 'search') return;
      var tab = ev.target.closest('[data-search-cat]');
      if (tab) { category = tab.getAttribute('data-search-cat'); update(app); return; }
      var pack = ev.target.closest('[data-col]');
      if (pack) { Diary.collections.open(pack.getAttribute('data-col')); return; }
      var card = ev.target.closest('.card[data-id]');
      if (card) Diary.modal.openEntry(card.getAttribute('data-id'));
    });
  }

  // Вход на страницу: запрос берётся из адреса.
  function render(app, params, opts) {
    if (params) {
      q = (params.get('q') || '').trim();
      category = 'all';
    }
    if (!mounted || (opts && opts.full) || !app.querySelector('[data-search-results]')) mount(app);
    else update(app);
    var top = document.getElementById('globalSearchInput');
    if (top) top.value = q;
  }

  function unmount() { mounted = false; }

  Diary.search = { setup: setup, render: render, unmount: unmount, go: go };
})(window.Diary);
