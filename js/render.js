// Card markup + per-category grid rendering (filter, search, sort).
// Обложка без картинки рисуется генератором из covers.js.
window.Diary = window.Diary || {};

(function (Diary) {
  var utils = Diary.utils;
  var esc = utils.escapeHtml;

  function matchesStatusFilter(entry, filterValue) {
    if (filterValue === 'all') return true;
    return entry.status === filterValue;
  }

  // Поиск по названию, автору, жанрам, комментариям и цитатам.
  function matchesQuery(e, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return true;
    return (e.title || '').toLowerCase().indexOf(q) > -1 ||
      (e.author || '').toLowerCase().indexOf(q) > -1 ||
      (e.genres || []).join(' ').toLowerCase().indexOf(q) > -1 ||
      (e.comments || []).some(function (c) { return c.text.toLowerCase().indexOf(q) > -1; }) ||
      (e.quotes || []).some(function (c) { return c.text.toLowerCase().indexOf(q) > -1; });
  }

  function filterAndSort(list, filters) {
    var result = list.slice();

    if (filters.status && filters.status !== 'all') {
      result = result.filter(function (e) { return matchesStatusFilter(e, filters.status); });
    }
    if (filters.genre && filters.genre !== 'all') {
      result = result.filter(function (e) { return e.genres && e.genres.indexOf(filters.genre) !== -1; });
    }
    if (filters.search && filters.search.trim()) {
      result = result.filter(function (e) { return matchesQuery(e, filters.search); });
    }

    var sort = filters.sort || 'date_desc';
    result.sort(function (a, b) {
      if (sort === 'date_desc') return (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt;
      if (sort === 'date_asc') return (a.date || '').localeCompare(b.date || '') || a.createdAt - b.createdAt;
      if (sort === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '', 'ru');
      return 0;
    });
    return result;
  }

  function dateBadge(entry) {
    return entry.dateType === 'unknown' ? 'когда-то' : utils.formatDate(entry.dateType, entry.date);
  }

  function statusLabel(entry) {
    return Diary.STATUS_LABEL[entry.category][entry.status];
  }

  // Картинка обложки (загруженная или из каталога) либо сгенерированная «открытка».
  // У игр RAWG отдаёт горизонтальный арт — он вписывается целиком, а не обрезается.
  function coverInner(entry, opts) {
    if (entry.cover) {
      return '<span class="cover-img' + (entry.category === 'game' ? ' cover-img--contain' : '') +
        '" style="background-image:url(\'' + esc(entry.cover) + '\')" role="img" aria-label="' + esc(entry.title) + '"></span>';
    }
    return Diary.covers.cover(entry, opts);
  }

  function coverHtml(entry) {
    return '<span class="cover">' + coverInner(entry) + '</span>';
  }

  // Маленькая обложка — в папках на главной и в подборках.
  function thumbHtml(entry, i) {
    var rot = ((i || 0) % 3 - 1) * 2.5;
    return '<span class="mini-cover" data-id="' + entry.id + '" style="--rot:' + rot + 'deg">' + coverInner(entry) + '</span>';
  }

  // Совсем маленькая — в списках (недавнее, поиск, выбор записей).
  function tinyThumbHtml(entry) {
    return '<span class="now-thumb">' + coverInner(entry, { text: false }) + '</span>';
  }

  function cardHtml(entry) {
    var genresStr = (entry.genres || []).join(', ');
    var sub = entry.category === 'book' && entry.author ? entry.author : genresStr;
    return '' +
      '<button type="button" class="card" data-id="' + entry.id + '">' +
      '<span class="cover">' + coverInner(entry) +
      '<span class="status-pill" style="--sc:' + Diary.STATUS_COLOR[entry.status] + '">' + esc(statusLabel(entry)) + '</span>' +
      '</span>' +
      '<span class="card-meta">' +
      '<span class="card-code">' + esc(dateBadge(entry)) + '</span>' +
      '<h3>' + esc(entry.title) + '</h3>' +
      (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') +
      (entry.rating > 0 ? Diary.stars.staticStarsHtml(entry.rating) : '') +
      '</span>' +
      '</button>';
  }

  function emptyStateHtml(hasAny, category) {
    var mascot = Diary.covers.mascot(category || 'movie', category ? Diary.THEME[category].m : '#CFD72A');
    if (!hasAny) {
      return '<div class="empty">' + mascot + '<p>Пока пусто</p><span class="empty-hint">Добавьте первую запись — дневник начнётся с неё.</span>' +
        '<button class="btn" data-action="add"' + (category ? ' data-category="' + category + '"' : '') + ' type="button">+ Положить первое</button></div>';
    }
    return '<div class="empty">' + mascot + '<p>Ничего не нашлось</p><span class="empty-hint">Попробуйте изменить поиск или фильтры.</span></div>';
  }

  function renderGrid(container, list, allList, category) {
    if (list.length === 0) {
      container.innerHTML = emptyStateHtml(allList.length > 0, category);
      return;
    }
    container.innerHTML = list.map(cardHtml).join('');
  }

  Diary.render = {
    matchesStatusFilter: matchesStatusFilter,
    matchesQuery: matchesQuery,
    filterAndSort: filterAndSort,
    dateBadge: dateBadge,
    statusLabel: statusLabel,
    cardHtml: cardHtml,
    coverHtml: coverHtml,
    coverInner: coverInner,
    thumbHtml: thumbHtml,
    tinyThumbHtml: tinyThumbHtml,
    emptyStateHtml: emptyStateHtml,
    renderGrid: renderGrid
  };
})(window.Diary);
