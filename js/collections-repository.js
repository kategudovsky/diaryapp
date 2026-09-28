// Storage/CRUD for user-created collections — named groups of arbitrary
// entries from any category, independent of status or type. Mirrors
// repository.js's adapter pattern but is a separate top-level entity, not a
// sub-concern of a single entry (unlike comments/quotes).
window.Diary = window.Diary || {};

(function (Diary) {
  var STORAGE_KEY = Diary.DEMO ? 'mediaDiary.demo.collections.v1' : 'mediaDiary.collections.v1';
  var adapter = new Diary.storage.LocalStorageAdapter(STORAGE_KEY);
  var uid = Diary.utils.uid;

  var items = [];
  var listeners = [];

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
        data = JSON.parse(JSON.stringify(Diary.demoSeed.collections));
        adapter.save(data);
      }
      items = data;
      notify();
      return items;
    });
  }

  function getAll() { return items.slice(); }

  function getById(id) {
    return items.find(function (c) { return c.id === id; }) || null;
  }

  function add(name) {
    var now = Date.now();
    var collection = {
      id: uid(),
      name: (name || '').trim() || 'Без названия',
      entryIds: [],
      createdAt: now,
      updatedAt: now
    };
    items.unshift(collection);
    persist();
    notify();
    return collection;
  }

  // Окно подборки правит черновик и присылает всё разом по «Сохранить»,
  // поэтому здесь — переименование и замена состава целиком.
  function rename(id, name) {
    var c = getById(id);
    var trimmed = (name || '').trim();
    if (!c || !trimmed || trimmed === c.name) return c;
    c.name = trimmed;
    c.updatedAt = Date.now();
    persist();
    notify();
    return c;
  }

  function setEntries(id, entryIds) {
    var c = getById(id);
    if (!c || !Array.isArray(entryIds)) return c;
    c.entryIds = entryIds.slice();
    c.updatedAt = Date.now();
    persist();
    notify();
    return c;
  }

  function remove(id) {
    items = items.filter(function (c) { return c.id !== id; });
    persist();
    notify();
  }

  function addEntry(collectionId, entryId) {
    var c = getById(collectionId);
    if (!c || c.entryIds.indexOf(entryId) !== -1) return;
    c.entryIds.push(entryId);
    c.updatedAt = Date.now();
    persist();
    notify();
  }

  function removeEntry(collectionId, entryId) {
    var c = getById(collectionId);
    if (!c) return;
    c.entryIds = c.entryIds.filter(function (id) { return id !== entryId; });
    c.updatedAt = Date.now();
    persist();
    notify();
  }

  // Слияние с резервной копией — по тем же правилам, что и у записей:
  // сопоставление по id, побеждает подборка с более поздним updatedAt.
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

  Diary.collectionsRepo = {
    init: init,
    onChange: onChange,
    getAll: getAll,
    getById: getById,
    add: add,
    rename: rename,
    setEntries: setEntries,
    remove: remove,
    addEntry: addEntry,
    removeEntry: removeEntry,
    importItems: importItems
  };
})(window.Diary);