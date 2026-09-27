// Storage layer. Everything above this file talks to Diary.repository, never
// to localStorage directly — that keeps a future swap to a remote/synced
// backend (own API, Firebase, etc.) to a single place: write a new adapter
// with the same load()/save() Promise-based contract and hand it to the
// repository instead of LocalStorageAdapter.
window.Diary = window.Diary || {};

(function (Diary) {
  function LocalStorageAdapter(key) {
    this.key = key;
  }

  LocalStorageAdapter.prototype.load = function () {
    var raw = null;
    try { raw = localStorage.getItem(this.key); } catch (e) { raw = null; }
    var data = [];
    try { data = raw ? JSON.parse(raw) : []; } catch (e) { data = []; }
    return Promise.resolve(Array.isArray(data) ? data : []);
  };

  LocalStorageAdapter.prototype.save = function (items) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
      return Promise.resolve(true);
    } catch (e) {
      return Promise.reject(e);
    }
  };

  Diary.storage = {
    LocalStorageAdapter: LocalStorageAdapter
  };
})(window.Diary);