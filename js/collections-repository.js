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

  Diary.collectionsRepo = {
    init: init,
    onChange: onChange,
    getAll: getAll,
    getById: getById,
    add: add,
    remove: remove,
    addEntry: addEntry,
    removeEntry: removeEntry
  };
})(window.Diary);