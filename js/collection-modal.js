// Окно подборки: название, выбор записей и сохранение — всё в одном месте.
// Раньше это жило в строке инструментов над листом: поле для названия
// выезжало по кнопке, записи отмечались в панели внутри листа, а «сохранения»
// не было вовсе — каждая галочка сразу меняла подборку. Было непонятно, куда
// писать и чем всё заканчивается.
//
// Здесь черновик: правки живут в памяти и уезжают в хранилище только по
// «Сохранить». Поэтому новая подборка не появляется в списке, пока её не
// сохранили, а закрытие окна ничего не меняет.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var collRepo = Diary.collectionsRepo;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;
  var R = Diary.render;

  var overlay, modalEl;

  var editingId = null;   // null — собираем новую
  var draftPicked = [];   // id записей в порядке добавления
  var listOrder = [];     // порядок строк списка, см. buildListOrder()
  var searchQuery = '';

  function isOpen() { return overlay && !overlay.hidden; }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('has-modal');
  }

  function pickedCountText() {
    if (draftPicked.length === 0) return 'пока ничего';
    return 'выбрано ' + draftPicked.length;
  }

  // Порядок строк считается один раз при открытии: уже выбранные сверху,
  // чтобы открыв подборку, сразу видеть её состав. Пересчитывать его на каждой
  // галочке нельзя — строки прыгали бы под курсором.
  function buildListOrder() {
    var rest = repo.getActive().filter(function (e) { return draftPicked.indexOf(e.id) === -1; });
    listOrder = draftPicked.concat(rest.map(function (e) { return e.id; }));
  }

  function listHtml() {
    var rows = listOrder
      .map(function (id) { return repo.getById(id); })
      .filter(function (e) { return e && !e.deletedAt; });
    if (rows.length === 0) {
      return '<p class="picker-empty">В дневнике пока нет записей — сначала положите что-нибудь в папки.</p>';
    }
    var shown = rows.filter(function (e) { return R.matchesQuery(e, searchQuery); });
    if (shown.length === 0) {
      return '<p class="picker-empty">Ничего не нашлось. Попробуйте другое слово.</p>';
    }
    return shown.map(function (e) {
      var checked = draftPicked.indexOf(e.id) !== -1 ? ' checked' : '';
      var t = Diary.THEME[e.category];
      return '<label class="picker-row">' +
        '<input type="checkbox" data-pick="' + e.id + '"' + checked + '>' +
        '<span class="picker-check" aria-hidden="true"></span>' +
        R.tinyThumbHtml(e) +
        '<span class="picker-row-title">' + esc(e.title) + '</span>' +
        '<span class="result-type" style="--c:' + t.c + ';--fi:' + t.fi + '">' + esc(Diary.CATEGORY_LABEL[e.category]) + '</span>' +
        '</label>';
    }).join('');
  }

  function syncList() {
    modalEl.querySelector('#colList').innerHTML = listHtml();
    modalEl.querySelector('#colPicked').textContent = pickedCountText();
  }

  function build(col) {
    var t = Diary.PAGE_THEME.collections;
    modalEl.style.setProperty('--c', t.c);
    modalEl.style.setProperty('--fi', t.fi);

    modalEl.innerHTML = '' +
      '<div class="sheet-tab">' + (col ? 'SET // подборка' : 'SET // новая подборка') + '</div>' +
      '<button type="button" class="close" id="colClose" aria-label="Закрыть">×</button>' +
      '<form class="sheet-inner col-form" id="colForm" novalidate>' +

      '<div class="add-head">' +
      '<h2>' + (col ? 'Подборка' : 'Новая подборка') + '</h2>' +
      '<span class="hand-note">' + (col ? 'поправим!' : 'соберём вместе!') + '</span>' +
      '</div>' +

      '<div class="field">' +
      '<label class="label" for="colName">Название</label>' +
      '<input type="text" id="colName" placeholder="Например, «Под плед»" autocomplete="off">' +
      '</div>' +

      '<div class="field">' +
      '<span class="label">Что в подборке <span class="field-hint" id="colPicked"></span></span>' +
      '<label class="field-inline field-inline--wide">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
      '<input type="search" id="colSearch" placeholder="Найти запись по названию, автору, жанру…" aria-label="Поиск записи">' +
      '</label>' +
      '<div class="picker-list" id="colList"></div>' +
      '</div>' +

      '<div class="edit-actions">' +
      '<button type="button" class="link-danger" id="colDelete"' + (col ? '' : ' hidden') + '>Удалить подборку</button>' +
      '<button type="submit" class="btn btn--big">Сохранить →</button>' +
      '</div>' +
      '</form>';

    var nameInput = modalEl.querySelector('#colName');
    nameInput.value = col ? col.name : '';
    syncList();

    modalEl.querySelector('#colClose').addEventListener('click', close);

    nameInput.addEventListener('input', function () {
      nameInput.classList.remove('is-invalid');
    });

    var onSearch = utils.debounce(function () { syncList(); }, 150);
    modalEl.querySelector('#colSearch').addEventListener('input', function (ev) {
      searchQuery = ev.target.value;
      onSearch();
    });

    // Галочки правят только черновик — в хранилище всё уедет по «Сохранить».
    modalEl.querySelector('#colList').addEventListener('change', function (ev) {
      var box = ev.target.closest('[data-pick]');
      if (!box) return;
      var id = box.getAttribute('data-pick');
      var at = draftPicked.indexOf(id);
      if (box.checked && at === -1) draftPicked.push(id);
      else if (!box.checked && at !== -1) draftPicked.splice(at, 1);
      modalEl.querySelector('#colPicked').textContent = pickedCountText();
    });

    modalEl.querySelector('#colDelete').addEventListener('click', function () {
      if (!editingId) return;
      Diary.collections.askDelete(col || collRepo.getById(editingId)).then(function (gone) { if (gone) close(); });
    });

    modalEl.querySelector('#colForm').addEventListener('submit', handleSubmit);
    nameInput.focus({ preventScroll: true });
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    var nameInput = modalEl.querySelector('#colName');
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.classList.add('is-invalid');
      nameInput.focus();
      return;
    }

    if (editingId) {
      collRepo.rename(editingId, name);
      collRepo.setEntries(editingId, draftPicked);
      close();
      Diary.toast('Подборка сохранена');
      return;
    }

    var created = collRepo.add(name);
    collRepo.setEntries(created.id, draftPicked);
    close();
    Diary.toast('Подборка «' + created.name + '» собрана');
    // Сразу показываем, что получилось.
    Diary.collections.open(created.id);
  }

  // id === null — новая подборка.
  function open(id) {
    var col = id ? collRepo.getById(id) : null;
    if (id && !col) return;
    editingId = col ? col.id : null;
    draftPicked = col ? col.entryIds.filter(function (entryId) {
      var e = repo.getById(entryId);
      return e && !e.deletedAt;
    }) : [];
    searchQuery = '';
    buildListOrder();
    overlay.hidden = false;
    overlay.scrollTop = 0;
    document.body.classList.add('has-modal');
    build(col);
  }

  function setup() {
    overlay = document.getElementById('collectionOverlay');
    modalEl = document.getElementById('collectionModal');

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.classList.contains('modal-backdrop')) close();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && isOpen()) close();
    });
  }

  Diary.collectionModal = { setup: setup, open: open, isOpen: isOpen, close: close };
})(window.Diary);
