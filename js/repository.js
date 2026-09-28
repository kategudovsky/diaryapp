// In-memory cache of entries + all mutations. UI code (render/modal/lists/
// trash) only ever calls into Diary.repository, never touches storage or
// localStorage directly.
window.Diary = window.Diary || {};

(function (Diary) {
  var STORAGE_KEY = Diary.DEMO ? 'mediaDiary.demo.entries.v1' : 'mediaDiary.entries.v1';
  var adapter = new Diary.storage.LocalStorageAdapter(STORAGE_KEY);
  var uid = Diary.utils.uid;

  var items = [];
  var listeners = [];
  var ready = false;

  function notify() {
    listeners.forEach(function (fn) { fn(); });
  }

  function persist() {
    return adapter.save(items);
  }

  function onChange(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  function init() {
    return adapter.load().then(function (data) {
      // Демо-режим: пустое хранилище заполняется примерами.
      if (Diary.DEMO && data.length === 0 && Diary.demoSeed) {
        data = JSON.parse(JSON.stringify(Diary.demoSeed.entries));
        adapter.save(data);
      }
      items = data;
      // Migrate entries saved while the now-removed "in_progress" status existed.
      items.forEach(function (e) {
        if (Diary.STATUS_KEYS.indexOf(e.status) === -1) e.status = 'planned';
      });
      purgeExpired({ silent: true });
      ready = true;
      notify();
      return items;
    });
  }

  function isReady() { return ready; }

  function getAll() { return items.slice(); }

  function getActive() {
    return items.filter(function (e) { return !e.deletedAt; });
  }

  function getTrashed() {
    return items.filter(function (e) { return !!e.deletedAt; });
  }

  function getById(id) {
    return items.find(function (e) { return e.id === id; }) || null;
  }

  function add(data) {
    var now = Date.now();
    var entry = {
      id: uid(),
      category: data.category,
      title: (data.title || '').trim(),
      author: (data.author || '').trim(),
      description: (data.description || '').trim(),
      cover: data.cover || null,
      genres: Array.isArray(data.genres) ? data.genres.slice() : [],
      rating: typeof data.rating === 'number' ? data.rating : 0,
      dateType: data.dateType || 'unknown',
      date: data.dateType === 'unknown' ? null : (data.date || null),
      status: data.status || 'planned',
      comments: Array.isArray(data.comments) ? data.comments.slice() : [],
      quotes: Array.isArray(data.quotes) ? data.quotes.slice() : [],
      source: data.source || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    items.unshift(entry);
    persist();
    notify();
    return entry;
  }

  function update(id, patch) {
    var entry = getById(id);
    if (!entry) return null;
    Object.keys(patch).forEach(function (k) {
      entry[k] = patch[k];
    });
    if (entry.dateType === 'unknown') entry.date = null;
    entry.updatedAt = Date.now();
    persist();
    notify();
    return entry;
  }

  function softDelete(id) {
    var entry = getById(id);
    if (!entry) return;
    entry.deletedAt = Date.now();
    persist();
    notify();
  }

  function restore(id) {
    var entry = getById(id);
    if (!entry) return;
    entry.deletedAt = null;
    persist();
    notify();
  }

  function permanentlyDelete(id) {
    items = items.filter(function (e) { return e.id !== id; });
    persist();
    notify();
  }

  function emptyTrash() {
    items = items.filter(function (e) { return !e.deletedAt; });
    persist();
    notify();
  }

  function purgeExpired(opts) {
    var now = Date.now();
    var maxAge = Diary.TRASH_RETENTION_DAYS * 86400000;
    var before = items.length;
    items = items.filter(function (e) {
      return !(e.deletedAt && (now - e.deletedAt) > maxAge);
    });
    if (items.length !== before) {
      persist();
      if (!(opts && opts.silent)) notify();
    }
  }

  // Слияние с резервной копией: записи сопоставляются по id, побеждает та,
  // что изменена позже. Поэтому импорт старой копии не затирает свежие правки,
  // а удаления переезжают сами — они мягкие, через deletedAt.
  function importItems(list) {
    var result = { added: 0, updated: 0 };
    if (!Array.isArray(list)) return result;
    list.forEach(function (incoming) {
      if (!incoming || !incoming.id) return;
      var current = getById(incoming.id);
      if (!current) {
        items.push(incoming);
        result.added++;
      } else if ((incoming.updatedAt || 0) > (current.updatedAt || 0)) {
        items[items.indexOf(current)] = incoming;
        result.updated++;
      }
    });
    if (result.added || result.updated) {
      persist();
      notify();
    }
    return result;
  }

  function addComment(entryId, text) {
    var entry = getById(entryId);
    if (!entry || !text.trim()) return null;
    var comment = { id: uid(), text: text.trim(), createdAt: Date.now() };
    entry.comments.push(comment);
    entry.updatedAt = Date.now();
    persist();
    notify();
    return comment;
  }

  function deleteComment(entryId, commentId) {
    var entry = getById(entryId);
    if (!entry) return;
    entry.comments = entry.comments.filter(function (c) { return c.id !== commentId; });
    persist();
    notify();
  }

  function addQuote(entryId, text) {
    var entry = getById(entryId);
    if (!entry || !text.trim()) return null;
    var quote = { id: uid(), text: text.trim(), createdAt: Date.now() };
    entry.quotes.push(quote);
    entry.updatedAt = Date.now();
    persist();
    notify();
    return quote;
  }

  function deleteQuote(entryId, quoteId) {
    var entry = getById(entryId);
    if (!entry) return;
    entry.quotes = entry.quotes.filter(function (q) { return q.id !== quoteId; });
    persist();
    notify();
  }

  Diary.repository = {
    init: init,
    isReady: isReady,
    onChange: onChange,
    getAll: getAll,
    getActive: getActive,
    getTrashed: getTrashed,
    getById: getById,
    add: add,
    update: update,
    softDelete: softDelete,
    restore: restore,
    permanentlyDelete: permanentlyDelete,
    emptyTrash: emptyTrash,
    purgeExpired: purgeExpired,
    importItems: importItems,
    addComment: addComment,
    deleteComment: deleteComment,
    addQuote: addQuote,
    deleteQuote: deleteQuote
  };
})(window.Diary);