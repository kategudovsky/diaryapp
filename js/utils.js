// Small shared helpers with no dependencies on app state.
window.Diary = window.Diary || {};

(function (Diary) {
  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  // Formats an entry's date according to its dateType: 'exact' | 'approx' | 'unknown'.
  function formatDate(dateType, date) {
    if (dateType === 'unknown' || !date) return '';
    if (dateType === 'exact') {
      var parts = date.split('-');
      if (parts.length === 3) {
        return parts[2] + ' ' + monthShort(parseInt(parts[1], 10)) + ' ' + parts[0];
      }
      return date;
    }
    if (dateType === 'approx') {
      var p = date.split('-');
      if (p.length === 2) return monthShort(parseInt(p[1], 10)) + ' ' + p[0];
      return date; // year only
    }
    return date;
  }

  function monthShort(m) {
    var short = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return short[clamp(m - 1, 0, 11)];
  }

  function daysBetween(a, b) {
    return Math.floor((b - a) / 86400000);
  }

  function readFileAsResizedDataUrl(file, maxWidth) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('read failed')); };
      reader.onload = function (e) {
        var img = new Image();
        img.onerror = function () { reject(new Error('decode failed')); };
        img.onload = function () {
          var scale = Math.min(1, maxWidth / img.width);
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Русское множественное число: plural(5, ['фильм', 'фильма', 'фильмов']) -> 'фильмов'.
  function plural(n, forms) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
    return forms[2];
  }

  Diary.utils = {
    plural: plural,
    uid: uid,
    escapeHtml: escapeHtml,
    clamp: clamp,
    debounce: debounce,
    formatDate: formatDate,
    daysBetween: daysBetween,
    readFileAsResizedDataUrl: readFileAsResizedDataUrl
  };
})(window.Diary);