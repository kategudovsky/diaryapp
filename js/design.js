// Два дизайна: «дофаминовый» (яркий, по умолчанию) и «стандартный» (монохром
// на тёплой бумаге). Стили стандартного — в css/standard.css, все под
// html[data-design="standard"]. Здесь — цвета, которые интерфейс берёт из JS:
// папки, страницы, статусы. Объекты меняются на месте, поэтому модули, которые
// уже держат ссылку на Diary.THEME и т. п., видят новые значения сразу.
// Выбор хранится в браузере; атрибут на <html> ставит ещё скрипт в <head>,
// чтобы страница не мигала ярким дизайном при загрузке.
window.Diary = window.Diary || {};

(function (Diary) {
  var KEY = 'fiks.design';
  var INK = '#23201C';
  var PAPER = '#F3EFE9';

  function copy(o) { return JSON.parse(JSON.stringify(o)); }

  var dopamine = {
    THEME: copy(Diary.THEME),
    PAGE_THEME: copy(Diary.PAGE_THEME),
    STATUS_COLOR: copy(Diary.STATUS_COLOR),
    STATUS_INK: copy(Diary.STATUS_INK)
  };

  function monoTheme(src) {
    var out = {};
    Object.keys(src).forEach(function (k) {
      out[k] = Object.assign({}, src[k], { c: PAPER, fi: INK, m: INK, grid: 'transparent' });
    });
    return out;
  }

  var standard = {
    THEME: monoTheme(dopamine.THEME),
    PAGE_THEME: monoTheme(dopamine.PAGE_THEME),
    // Статусы в стандартном — только текстом и обводкой; «Заброшено» светлее.
    STATUS_COLOR: { planned: 'transparent', done: 'transparent', dropped: 'transparent' },
    STATUS_INK: { planned: INK, done: INK, dropped: '#8A8178' }
  };

  function fill(target, src) {
    Object.keys(target).forEach(function (k) { delete target[k]; });
    Object.keys(src).forEach(function (k) { target[k] = copy(src[k]); });
  }

  function read() {
    try { return localStorage.getItem(KEY) === 'standard' ? 'standard' : 'dopamine'; } catch (e) { return 'dopamine'; }
  }

  var current = null;

  function apply(name) {
    current = name === 'standard' ? 'standard' : 'dopamine';
    var set = current === 'standard' ? standard : dopamine;
    fill(Diary.THEME, set.THEME);
    fill(Diary.PAGE_THEME, set.PAGE_THEME);
    fill(Diary.STATUS_COLOR, set.STATUS_COLOR);
    fill(Diary.STATUS_INK, set.STATUS_INK);
    document.documentElement.setAttribute('data-design', current);
  }

  function set(name) {
    try { localStorage.setItem(KEY, name); } catch (e) { /* без хранилища — только до перезагрузки */ }
    apply(name);
  }

  apply(read());

  Diary.design = {
    get: function () { return current; },
    isStandard: function () { return current === 'standard'; },
    set: set
  };
})(window.Diary);
