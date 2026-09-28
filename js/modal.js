// Entry modal with two modes:
//  - 'view'  — read-only detail view opened by clicking an existing card.
//              Empty fields (no author/genres/cover/rating/date/notes) are
//              simply omitted rather than shown blank.
//  - 'edit'  — the full form, opened directly by "+ Добавить" for a
//              new entry, or via the "Редактировать" button from view mode
//              for an existing one.
// Each mode fully rebuilds the modal's markup and rewires its own event
// listeners, so switching modes mid-session (view -> edit -> view) is just
// calling the other render function with the same editingId.
// Внешне окно — лист в папке: цветная рамка категории и язычок с кодом.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;
  var R = Diary.render;

  function esc(s) { return utils.escapeHtml(s); }

  var overlay, modalEl;
  var editingId = null; // id of the entry being viewed/edited; null while creating

  // ---- edit-mode working state ----
  var selectedCategory = 'movie';
  var selectedGenres = [];
  var selectedStatus = 'planned';
  var selectedDateType = 'unknown';
  var coverData = null;
  var ratingPicker = null;
  // Comments/quotes typed in before a brand-new entry has been saved (and
  // thus has no id yet); folded into the entry itself on first save.
  var draftComments = [];
  var draftQuotes = [];
  // Which catalog result (if any) the current form was filled from.
  var pendingSource = null;
  var lookupResults = [];

  function setTheme(category) {
    var t = Diary.THEME[category];
    modalEl.style.setProperty('--c', t.c);
    modalEl.style.setProperty('--fi', t.fi);
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.classList.remove('has-modal');
  }

  function isOpen() { return overlay && !overlay.hidden; }

  // ==================== VIEW MODE ====================

  function notesHtml(items, kind) {
    return items.map(function (item) {
      return kind === 'quote'
        ? '<blockquote class="quote-card">' + esc(item.text) + '</blockquote>'
        : '<p class="note-card">' + esc(item.text) + '</p>';
    }).join('');
  }

  function renderView() {
    var entry = repo.getById(editingId);
    if (!entry) { closeModal(); return; }
    setTheme(entry.category);

    var t = Diary.THEME[entry.category];
    var dateBadge = R.dateBadge(entry);
    var genres = entry.genres || [];
    var source = entry.source && entry.source.url
      ? '<a class="source-link" href="' + esc(entry.source.url) + '" target="_blank" rel="noopener">карточка в каталоге ↗</a>'
      : '';

    modalEl.innerHTML = '' +
      '<div class="sheet-tab">' + t.code + ' // ' + esc(dateBadge) + '</div>' +
      '<button type="button" class="close" id="modalCloseBtn" aria-label="Закрыть">×</button>' +
      '<div class="sheet-inner detail">' +
      '<div class="detail-cover">' + R.coverInner(entry) + '</div>' +
      '<div class="detail-info">' +
      '<div class="chips">' +
      '<span class="chip chip--static chip--cat">' + esc(Diary.CATEGORY_LABEL[entry.category]) + '</span>' +
      '<span class="chip chip--static is-on" style="--sc:' + Diary.STATUS_COLOR[entry.status] + '">' + esc(R.statusLabel(entry)) + '</span>' +
      '</div>' +
      '<h2>' + esc(entry.title) + '</h2>' +
      (entry.category === 'book' && entry.author ? '<p class="detail-sub">' + esc(entry.author) + '</p>' : '') +
      (genres.length ? '<div class="tags">' + genres.map(function (g, i) {
        return '<span class="tag tag--static" style="--tc:' + TAG_COLORS[i % TAG_COLORS.length] + '">' + esc(g) + '</span>';
      }).join('') + '</div>' : '') +
      '<div class="detail-grid">' +
      (entry.rating > 0 ? '<div class="field"><span class="label">Оценка</span>' + Diary.stars.staticStarsHtml(entry.rating, 28) + '</div>' : '') +
      '<div class="field"><span class="label">Когда</span><span class="detail-value">' + esc(dateBadge) + '</span></div>' +
      '</div>' +
      (entry.comments && entry.comments.length ? '<div class="field"><span class="label">Комментарии</span><div class="notes-list">' + notesHtml(entry.comments, 'comment') + '</div></div>' : '') +
      (entry.quotes && entry.quotes.length ? '<div class="field"><span class="label">Цитаты</span><div class="notes-list">' + notesHtml(entry.quotes, 'quote') + '</div></div>' : '') +
      source +
      '<div class="detail-actions">' +
      '<button type="button" class="btn" id="editBtn">Редактировать</button>' +
      '<button type="button" class="link-danger" id="deleteBtn">В корзину</button>' +
      '</div>' +
      '</div>' +
      '</div>';

    modalEl.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
    modalEl.querySelector('#editBtn').addEventListener('click', function () { renderEdit(); });
    modalEl.querySelector('#deleteBtn').addEventListener('click', function () {
      if (!confirm('Переместить запись в корзину?')) return;
      repo.softDelete(editingId);
      closeModal();
      Diary.toast('Запись в корзине — её можно восстановить ' + Diary.TRASH_RETENTION_DAYS + ' дней');
    });
    modalEl.querySelector('#editBtn').focus({ preventScroll: true });
  }

  var TAG_COLORS = ['#FFC43D', '#B79CF2', '#DAF5F9'];

  // ==================== EDIT MODE ====================

  function buildEditMarkup() {
    var categoryChips = Diary.CATEGORIES.map(function (cat) {
      var t = Diary.THEME[cat];
      return '<button type="button" class="chip chip--type" data-category="' + cat + '" style="--c:' + t.c + ';--fi:' + t.fi + '">' + esc(Diary.CATEGORY_LABEL[cat]) + '</button>';
    }).join('');

    var monthOptions = '<option value="">Месяц (необязательно)</option>' +
      Diary.MONTHS_RU.map(function (m, i) {
        return '<option value="' + (i + 1) + '">' + esc(m) + '</option>';
      }).join('');

    modalEl.innerHTML = '' +
      '<div class="sheet-tab">' + (editingId ? 'EDIT // редактирование' : 'NEW // новая запись') + '</div>' +
      '<button type="button" class="close" id="modalCloseBtn" aria-label="Закрыть">×</button>' +
      '<form class="sheet-inner edit-form" id="entryForm" novalidate>' +

      '<div class="edit-side">' +
      '<div class="field">' +
      '<span class="label">Обложка</span>' +
      '<div class="detail-cover" id="coverPreview"></div>' +
      '<div class="cover-actions">' +
      '<button type="button" class="btn btn--small" id="uploadBtn">Загрузить</button>' +
      '<input type="file" id="coverInput" accept="image/*" hidden>' +
      '<button type="button" class="link-danger" id="removeCoverBtn" hidden>Убрать</button>' +
      '</div>' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Оценка</span>' +
      '<div id="ratingPicker"></div>' +
      '</div>' +
      '</div>' +

      '<div class="edit-main">' +
      '<div class="add-head">' +
      '<h2>' + (editingId ? 'Редактировать' : 'Положить в папку') + '</h2>' +
      '<span class="hand-note">' + (editingId ? 'поправим!' : 'что-то новенькое!') + '</span>' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Категория</span>' +
      '<div class="chips type-chips" id="categoryPicker" role="group" aria-label="Категория">' + categoryChips + '</div>' +
      '</div>' +
      '<div class="field field--lookup">' +
      '<label class="label" for="f_title">Название <span class="lookup-status" id="lookupStatus"></span></label>' +
      '<input type="text" id="f_title" required autocomplete="off" placeholder="Начните вводить — поищу в каталоге">' +
      '<div class="lookup-results" id="lookupResults"></div>' +
      '</div>' +
      '<div class="field" id="authorField">' +
      '<label class="label" for="f_author">Автор</label>' +
      '<input type="text" id="f_author">' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Статус</span>' +
      '<div class="chips" id="statusPicker" role="group" aria-label="Статус"></div>' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Жанр</span>' +
      '<div class="chips chips--small" id="genrePicker" role="group" aria-label="Жанр"></div>' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Дата</span>' +
      '<div class="chips chips--small" id="dateTypePicker" role="group" aria-label="Тип даты">' +
      '<button type="button" class="chip" data-datetype="exact" style="--sc:#DAF5F9">Точная</button>' +
      '<button type="button" class="chip" data-datetype="approx" style="--sc:#DAF5F9">Примерная</button>' +
      '<button type="button" class="chip" data-datetype="unknown" style="--sc:#DAF5F9">Без даты</button>' +
      '</div>' +
      '<div class="date-inputs" id="dateInputsExact">' +
      '<input type="date" id="f_date_exact" aria-label="Дата">' +
      '</div>' +
      '<div class="date-inputs" id="dateInputsApprox">' +
      '<input type="number" id="f_date_year" placeholder="Год" min="1800" max="2100" aria-label="Год">' +
      '<label class="select"><select id="f_date_month" aria-label="Месяц">' + monthOptions + '</select></label>' +
      '</div>' +
      '</div>' +
      '</div>' + // end edit-main

      '<div class="edit-notes" id="commentsQuotesSection">' +
      '<div class="field">' +
      '<span class="label">Комментарии</span>' +
      '<div class="notes-list" id="commentsList"></div>' +
      '<div class="add-row"><input type="text" id="newCommentInput" placeholder="Что запомнилось?" aria-label="Новый комментарий"><button type="button" class="btn btn--small" id="addCommentBtn">Добавить</button></div>' +
      '</div>' +
      '<div class="field">' +
      '<span class="label">Цитаты</span>' +
      '<div class="notes-list" id="quotesList"></div>' +
      '<div class="add-row"><input type="text" id="newQuoteInput" placeholder="Любимая фраза" aria-label="Новая цитата"><button type="button" class="btn btn--small" id="addQuoteBtn">Добавить</button></div>' +
      '</div>' +
      '</div>' +

      '<div class="edit-actions">' +
      '<button type="button" class="link-danger" id="deleteBtn" hidden>В корзину</button>' +
      '<button type="submit" class="btn btn--big">Сохранить →</button>' +
      '</div>' +
      '</form>';
  }

  function syncCategoryPicker() {
    Array.prototype.forEach.call(modalEl.querySelectorAll('#categoryPicker button'), function (b) {
      var on = b.getAttribute('data-category') === selectedCategory;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    modalEl.querySelector('#authorField').hidden = selectedCategory !== 'book';
    setTheme(selectedCategory);
    syncCoverPreview();
  }

  function syncGenrePicker() {
    var list = Diary.GENRES[selectedCategory];
    var picker = modalEl.querySelector('#genrePicker');
    picker.innerHTML = list.map(function (g) {
      var on = selectedGenres.indexOf(g) !== -1;
      return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" style="--sc:#FFC43D" data-genre="' + esc(g) + '" aria-pressed="' + on + '">' + esc(g) + '</button>';
    }).join('');
  }

  function syncStatusPicker() {
    var labels = Diary.STATUS_LABEL[selectedCategory];
    var picker = modalEl.querySelector('#statusPicker');
    picker.innerHTML = Diary.STATUS_KEYS.map(function (key) {
      var on = key === selectedStatus;
      return '<button type="button" class="chip' + (on ? ' is-on' : '') + '" style="--sc:' + Diary.STATUS_COLOR[key] + '" data-status="' + key + '" aria-pressed="' + on + '">' + esc(labels[key]) + '</button>';
    }).join('');
  }

  function syncDateTypePicker() {
    Array.prototype.forEach.call(modalEl.querySelectorAll('#dateTypePicker button'), function (b) {
      var on = b.getAttribute('data-datetype') === selectedDateType;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    modalEl.querySelector('#dateInputsExact').hidden = selectedDateType !== 'exact';
    modalEl.querySelector('#dateInputsApprox').hidden = selectedDateType !== 'approx';
  }

  // Без картинки показываем «открытку», которая получится из текущего названия.
  function syncCoverPreview() {
    var el = modalEl.querySelector('#coverPreview');
    if (!el) return;
    var title = modalEl.querySelector('#f_title') ? modalEl.querySelector('#f_title').value.trim() : '';
    el.innerHTML = R.coverInner({ category: selectedCategory, title: title || 'Без названия', cover: coverData });
    modalEl.querySelector('#removeCoverBtn').hidden = !coverData;
  }

  // ---- catalog lookup (Google Books, TMDB, RAWG) ----

  // The lookup row only appears for categories that actually have a provider
  // registered, so adding more providers later needs no change here.
  function currentProvider() {
    var list = Diary.providers.listForCategory(selectedCategory);
    return list.length ? list[0] : null;
  }

  // Categories without a provider simply never produce results; the title
  // field itself is always present.
  function syncLookupVisibility() {
    clearLookupResults();
  }

  function clearLookupResults() {
    lookupResults = [];
    var box = modalEl.querySelector('#lookupResults');
    if (box) box.innerHTML = '';
    setLookupStatus('');
  }

  function setLookupStatus(text) {
    var el = modalEl.querySelector('#lookupStatus');
    if (el) el.textContent = text;
  }

  function renderLookupResults() {
    var box = modalEl.querySelector('#lookupResults');
    if (!box) return;
    box.innerHTML = lookupResults.map(function (r, i) {
      var thumb = r.cover
        ? '<span class="now-thumb"><span class="cover-img" style="background-image:url(\'' + esc(r.cover) + '\')"></span></span>'
        : '<span class="now-thumb">' + Diary.covers.cover({ category: selectedCategory, title: r.title }, { text: false }) + '</span>';
      var sub = [r.author, r.year].filter(Boolean).join(' · ');
      return '<button type="button" class="result lookup-item" data-index="' + i + '">' +
        thumb +
        '<span class="now-text">' +
        '<b>' + esc(r.title) + '</b>' +
        (sub ? '<small>' + esc(sub) + '</small>' : '') +
        '</span>' +
        '</button>';
    }).join('');
  }

  function runLookup(query) {
    var provider = currentProvider();
    if (!provider || query.trim().length < 2) { clearLookupResults(); return; }
    setLookupStatus('ищу…');
    provider.search(query.trim(), selectedCategory).then(function (results) {
      lookupResults = results;
      if (results.length === 0) {
        setLookupStatus('ничего не нашлось');
        modalEl.querySelector('#lookupResults').innerHTML = '';
        return;
      }
      setLookupStatus('');
      renderLookupResults();
    }).catch(function (err) {
      lookupResults = [];
      var box = modalEl.querySelector('#lookupResults');
      if (box) box.innerHTML = '';
      var code = err && err.code;
      setLookupStatus(
        code === 'nokey' ? 'нужен ключ — см. js/secrets.js'
          : code === 'quota' ? 'лимит запросов исчерпан — см. js/secrets.js'
            : 'не удалось загрузить');
    });
  }

  function applyLookupResult(result) {
    var provider = currentProvider();
    modalEl.querySelector('#f_title').value = result.title;
    if (selectedCategory === 'book' && result.author) {
      modalEl.querySelector('#f_author').value = result.author;
    }
    if (result.cover) coverData = result.cover;
    syncCoverPreview();
    pendingSource = {
      provider: provider ? provider.id : null,
      externalId: result.externalId || null,
      url: result.url || null
    };
    clearLookupResults();
  }

  function renderNotesList(container, items, kind) {
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="notes-empty">Пока нет записей.</p>';
      return;
    }
    container.innerHTML = items.map(function (it) {
      return '<div class="' + (kind === 'quote' ? 'quote-card' : 'note-card') + ' note-editable" data-id="' + it.id + '">' +
        '<span>' + esc(it.text) + '</span>' +
        '<button type="button" class="note-delete" data-kind="' + kind + '" data-id="' + it.id + '" aria-label="Удалить">×</button>' +
        '</div>';
    }).join('');
  }

  function renderCommentsAndQuotes() {
    var comments, quotes;
    if (editingId) {
      var entry = repo.getById(editingId);
      if (!entry) return;
      comments = entry.comments;
      quotes = entry.quotes;
    } else {
      comments = draftComments;
      quotes = draftQuotes;
    }
    renderNotesList(modalEl.querySelector('#commentsList'), comments, 'comment');
    renderNotesList(modalEl.querySelector('#quotesList'), quotes, 'quote');
  }

  function collectDate() {
    if (selectedDateType === 'unknown') return null;
    if (selectedDateType === 'exact') {
      return modalEl.querySelector('#f_date_exact').value || null;
    }
    var year = modalEl.querySelector('#f_date_year').value.trim();
    var month = modalEl.querySelector('#f_date_month').value;
    if (!year) return null;
    return month ? (year + '-' + String(month).padStart(2, '0')) : year;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    var titleInput = modalEl.querySelector('#f_title');
    var title = titleInput.value.trim();
    if (!title) {
      titleInput.classList.add('is-invalid');
      titleInput.focus();
      return;
    }

    var data = {
      category: selectedCategory,
      title: title,
      author: selectedCategory === 'book' ? modalEl.querySelector('#f_author').value.trim() : '',
      cover: coverData,
      genres: selectedGenres.slice(),
      rating: ratingPicker ? ratingPicker.getValue() : 0,
      dateType: selectedDateType,
      date: collectDate(),
      status: selectedStatus,
      source: pendingSource
    };

    var wasNew = !editingId;
    if (editingId) {
      repo.update(editingId, data);
    } else {
      data.comments = draftComments;
      data.quotes = draftQuotes;
      var created = repo.add(data);
      editingId = created.id;
    }

    if (wasNew) {
      closeModal();
      Diary.toast('Положено в папку «' + Diary.CATEGORY_LABEL_PLURAL[selectedCategory] + '»');
    } else {
      renderView();
    }
  }

  function renderEdit(defaultCategory) {
    var entry = editingId ? repo.getById(editingId) : null;

    if (!entry) {
      draftComments = [];
      draftQuotes = [];
    }

    selectedCategory = entry ? entry.category : (defaultCategory || 'movie');
    selectedGenres = entry ? (entry.genres || []).slice() : [];
    selectedStatus = entry ? entry.status : 'planned';
    selectedDateType = entry ? (entry.dateType || 'unknown') : 'unknown';
    coverData = entry ? (entry.cover || null) : null;
    pendingSource = entry ? (entry.source || null) : null;

    buildEditMarkup();

    var form = modalEl.querySelector('#entryForm');

    if (entry) {
      modalEl.querySelector('#f_title').value = entry.title || '';
      modalEl.querySelector('#f_author').value = entry.author || '';
      modalEl.querySelector('#deleteBtn').hidden = false;
    }

    syncCategoryPicker();
    syncGenrePicker();
    syncStatusPicker();
    syncDateTypePicker();
    syncCoverPreview();
    syncLookupVisibility();

    if (entry && selectedDateType === 'exact') {
      modalEl.querySelector('#f_date_exact').value = entry.date || '';
    } else if (entry && selectedDateType === 'approx') {
      var parts = (entry.date || '').split('-');
      modalEl.querySelector('#f_date_year').value = parts[0] || '';
      modalEl.querySelector('#f_date_month').value = parts[1] ? String(parseInt(parts[1], 10)) : '';
    }

    ratingPicker = Diary.stars.renderPicker(modalEl.querySelector('#ratingPicker'), entry ? (entry.rating || 0) : 0, function () {});
    renderCommentsAndQuotes();

    modalEl.querySelector('#categoryPicker').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button'); if (!btn) return;
      var newCategory = btn.getAttribute('data-category');
      if (newCategory === selectedCategory) return;
      var newGenreList = Diary.GENRES[newCategory];
      selectedCategory = newCategory;
      selectedGenres = selectedGenres.filter(function (g) { return newGenreList.indexOf(g) !== -1; });
      syncCategoryPicker();
      syncGenrePicker();
      syncStatusPicker();
      syncLookupVisibility();
    });

    var titleInput = modalEl.querySelector('#f_title');
    titleInput.addEventListener('input', utils.debounce(function (ev) {
      runLookup(ev.target.value);
    }, 400));
    titleInput.addEventListener('input', utils.debounce(function () {
      titleInput.classList.remove('is-invalid');
      if (!coverData) syncCoverPreview();
    }, 250));

    modalEl.querySelector('#lookupResults').addEventListener('click', function (ev) {
      var btn = ev.target.closest('.lookup-item');
      if (!btn) return;
      var result = lookupResults[parseInt(btn.getAttribute('data-index'), 10)];
      if (result) applyLookupResult(result);
    });

    modalEl.querySelector('#genrePicker').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button'); if (!btn) return;
      var g = btn.getAttribute('data-genre');
      var idx = selectedGenres.indexOf(g);
      if (idx === -1) selectedGenres.push(g); else selectedGenres.splice(idx, 1);
      syncGenrePicker();
    });

    modalEl.querySelector('#statusPicker').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button'); if (!btn) return;
      selectedStatus = btn.getAttribute('data-status');
      syncStatusPicker();
    });

    modalEl.querySelector('#dateTypePicker').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button'); if (!btn) return;
      selectedDateType = btn.getAttribute('data-datetype');
      syncDateTypePicker();
    });

    modalEl.querySelector('#uploadBtn').addEventListener('click', function () {
      modalEl.querySelector('#coverInput').click();
    });
    modalEl.querySelector('#removeCoverBtn').addEventListener('click', function () {
      coverData = null;
      syncCoverPreview();
    });
    modalEl.querySelector('#coverInput').addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      utils.readFileAsResizedDataUrl(file, 400).then(function (dataUrl) {
        coverData = dataUrl;
        syncCoverPreview();
      }).catch(function () {
        alert('Не удалось загрузить изображение.');
      });
    });

    function addNote(kind) {
      var input = modalEl.querySelector(kind === 'comment' ? '#newCommentInput' : '#newQuoteInput');
      if (!input.value.trim()) return;
      if (editingId) {
        if (kind === 'comment') repo.addComment(editingId, input.value);
        else repo.addQuote(editingId, input.value);
      } else {
        (kind === 'comment' ? draftComments : draftQuotes).push({ id: utils.uid(), text: input.value.trim(), createdAt: Date.now() });
      }
      input.value = '';
      renderCommentsAndQuotes();
      input.focus();
    }
    modalEl.querySelector('#addCommentBtn').addEventListener('click', function () { addNote('comment'); });
    modalEl.querySelector('#addQuoteBtn').addEventListener('click', function () { addNote('quote'); });
    // Enter в поле заметки добавляет её, а не отправляет всю форму.
    modalEl.querySelector('#newCommentInput').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); addNote('comment'); }
    });
    modalEl.querySelector('#newQuoteInput').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); addNote('quote'); }
    });

    modalEl.querySelector('#commentsQuotesSection').addEventListener('click', function (ev) {
      var btn = ev.target.closest('.note-delete');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var kind = btn.getAttribute('data-kind');
      if (editingId) {
        if (kind === 'comment') repo.deleteComment(editingId, id);
        else repo.deleteQuote(editingId, id);
      } else if (kind === 'comment') {
        draftComments = draftComments.filter(function (c) { return c.id !== id; });
      } else {
        draftQuotes = draftQuotes.filter(function (q) { return q.id !== id; });
      }
      renderCommentsAndQuotes();
    });

    modalEl.querySelector('#deleteBtn').addEventListener('click', function () {
      if (!editingId) return;
      if (!confirm('Переместить запись в корзину?')) return;
      repo.softDelete(editingId);
      closeModal();
      Diary.toast('Запись в корзине — её можно восстановить ' + Diary.TRASH_RETENTION_DAYS + ' дней');
    });

    modalEl.querySelector('#modalCloseBtn').addEventListener('click', function () {
      if (editingId) renderView();
      else closeModal();
    });

    form.addEventListener('submit', handleSubmit);
    titleInput.focus({ preventScroll: true });
  }

  // ==================== PUBLIC API ====================

  function openEntry(id, defaultCategory) {
    editingId = id || null;
    overlay.hidden = false;
    overlay.scrollTop = 0;
    document.body.classList.add('has-modal');
    if (editingId) {
      renderView();
    } else {
      renderEdit(defaultCategory);
    }
  }

  function setup() {
    overlay = document.getElementById('entryOverlay');
    modalEl = document.getElementById('entryModal');

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.classList.contains('modal-backdrop')) closeModal();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && isOpen()) closeModal();
    });
  }

  Diary.modal = { setup: setup, openEntry: openEntry, isOpen: isOpen, close: closeModal };
})(window.Diary);
