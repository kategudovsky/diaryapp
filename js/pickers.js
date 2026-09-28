// Самодельные поля выбора: выпадающий список и календарь.
// Нужны потому, что список нативного <select> и календарь <input type="date">
// рисует сама операционная система — ни шрифт, ни цвета, ни форму им задать
// нельзя. Поэтому и то, и другое собрано здесь из обычных кнопок.
// Наружу торчат getValue()/setValue(), так что вызывающий код работает с ними
// почти как с обычным полем.
window.Diary = window.Diary || {};

(function (Diary) {
  var utils = Diary.utils;
  var esc = utils.escapeHtml;

  // Открытой держим не больше одной панели на всё окно: вторая закрывает первую.
  var openPicker = null;

  // Клик мимо панели закрывает её. Проверять это через ev.target.closest('.pick')
  // в обработчике на document нельзя: перелистывание месяца перерисовывает панель
  // прямо во время клика, кнопка успевает вылететь из DOM, и closest() у оторванного
  // узла уже ничего не находит — панель закрывалась сама. Поэтому клики внутри
  // помечает сама панель, а document только читает пометку.
  var clickedInside = false;

  document.addEventListener('click', function () {
    if (clickedInside) { clickedInside = false; return; }
    if (openPicker) openPicker.close();
  });

  // Escape сначала закрывает панель и только потом — окно записи, поэтому
  // stopImmediatePropagation: обработчик модалки висит на том же document.
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !openPicker) return;
    var picker = openPicker;
    picker.close();
    picker.focusTrigger();
    ev.stopImmediatePropagation();
  });

  var CARET = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%231C1B3A' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")";

  // Кнопка-триггер плюс панель под ней — общая часть списка и календаря.
  function makeShell(mount, opts) {
    mount.classList.add('pick');
    mount.innerHTML = '' +
      '<button type="button" class="pick-btn" aria-haspopup="true" aria-expanded="false"' +
      (opts.ariaLabel ? ' aria-label="' + esc(opts.ariaLabel) + '"' : '') + '>' +
      (opts.icon || '') +
      '<span class="pick-value"></span>' +
      '<span class="pick-caret" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="pick-panel" hidden></div>';

    var trigger = mount.querySelector('.pick-btn');
    var panel = mount.querySelector('.pick-panel');
    trigger.querySelector('.pick-caret').style.backgroundImage = CARET;

    var shell = {
      trigger: trigger,
      panel: panel,
      isOpen: function () { return !panel.hidden; },
      open: function () {
        if (openPicker && openPicker !== shell) openPicker.close();
        panel.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        openPicker = shell;
        if (opts.onOpen) opts.onOpen();
      },
      close: function () {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        if (openPicker === shell) openPicker = null;
      },
      focusTrigger: function () { trigger.focus({ preventScroll: true }); },
      setLabel: function (text, isPlaceholder) {
        mount.querySelector('.pick-value').textContent = text;
        mount.classList.toggle('is-empty', !!isPlaceholder);
      }
    };

    trigger.addEventListener('click', function () {
      if (shell.isOpen()) shell.close(); else shell.open();
    });
    mount.addEventListener('click', function () { clickedInside = true; });
    return shell;
  }

  // ---- выпадающий список ----
  // options: [{ value, label }]. Пустое значение — обычный пункт списка,
  // им же сбрасывают выбор («Без месяца»).
  function dropdown(mount, opts) {
    var value = opts.value == null ? '' : String(opts.value);
    var shell = makeShell(mount, {
      ariaLabel: opts.ariaLabel,
      onOpen: function () {
        var on = shell.panel.querySelector('.is-on');
        if (on) on.scrollIntoView({ block: 'nearest' });
      }
    });
    mount.classList.add('pick--list');
    shell.panel.setAttribute('role', 'listbox');

    function currentLabel() {
      for (var i = 0; i < opts.options.length; i++) {
        var o = opts.options[i];
        if (String(o.value) === value && String(o.value) !== '') return o.label;
      }
      return null;
    }

    function sync() {
      var label = currentLabel();
      shell.setLabel(label || opts.placeholder || '', !label);
      shell.panel.innerHTML = opts.options.map(function (o) {
        var on = String(o.value) === value;
        return '<button type="button" class="pick-opt' + (on ? ' is-on' : '') + '" role="option"' +
          ' aria-selected="' + on + '" data-value="' + esc(o.value) + '">' + esc(o.label) + '</button>';
      }).join('');
    }

    shell.panel.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.pick-opt');
      if (!btn) return;
      value = btn.getAttribute('data-value');
      sync();
      shell.close();
      shell.focusTrigger();
      if (opts.onChange) opts.onChange(value);
    });

    sync();
    return {
      getValue: function () { return value; },
      setValue: function (v) { value = v == null ? '' : String(v); sync(); }
    };
  }

  // ---- календарь ----

  var WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  var CAL_ICON = '<svg class="pick-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>';

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function parseIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) } : null;
  }

  // Неделя начинается с понедельника, а getDay() считает воскресенье нулём.
  function firstColumn(y, m) { return (new Date(y, m - 1, 1).getDay() + 6) % 7; }
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  function calendar(mount, opts) {
    var value = parseIso(opts.value) ? opts.value : '';
    var now = new Date();
    var todayIso = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());

    function startView() {
      var p = parseIso(value);
      return p ? { y: p.y, m: p.m } : { y: now.getFullYear(), m: now.getMonth() + 1 };
    }
    var view = startView();

    var shell = makeShell(mount, {
      ariaLabel: opts.ariaLabel,
      icon: CAL_ICON,
      // Открыли заново — показываем месяц выбранной даты, а не тот, до которого долистали.
      onOpen: function () { view = startView(); renderPanel(); }
    });
    mount.classList.add('pick--date');

    function syncLabel() {
      var text = value ? utils.formatDate('exact', value) : (opts.placeholder || 'Выберите день');
      shell.setLabel(text, !value);
    }

    function renderPanel() {
      var total = daysInMonth(view.y, view.m);
      var blanks = firstColumn(view.y, view.m);
      var cells = '';
      for (var b = 0; b < blanks; b++) cells += '<span class="cal-blank" aria-hidden="true"></span>';
      for (var d = 1; d <= total; d++) {
        var iso = view.y + '-' + pad2(view.m) + '-' + pad2(d);
        var weekend = (blanks + d - 1) % 7 >= 5;
        cells += '<button type="button" class="cal-day' +
          (iso === value ? ' is-on' : '') +
          (iso === todayIso ? ' is-today' : '') +
          (weekend ? ' is-weekend' : '') +
          '" data-date="' + iso + '"' + (iso === value ? ' aria-current="date"' : '') + '>' + d + '</button>';
      }

      shell.panel.innerHTML = '' +
        '<div class="cal-head">' +
        '<button type="button" class="cal-nav" data-step="-1" aria-label="Предыдущий месяц">‹</button>' +
        '<b class="cal-title">' + esc(Diary.MONTHS_RU[view.m - 1]) + ' ' + view.y + '</b>' +
        '<button type="button" class="cal-nav" data-step="1" aria-label="Следующий месяц">›</button>' +
        '</div>' +
        '<div class="cal-week" aria-hidden="true">' + WEEKDAYS.map(function (w) {
          return '<span>' + w + '</span>';
        }).join('') + '</div>' +
        '<div class="cal-grid">' + cells + '</div>' +
        '<div class="cal-foot">' +
        '<button type="button" class="cal-link" data-today>Сегодня</button>' +
        '<button type="button" class="cal-link" data-clear' + (value ? '' : ' hidden') + '>Очистить</button>' +
        '</div>';
    }

    function pick(iso) {
      value = iso;
      syncLabel();
      shell.close();
      shell.focusTrigger();
      if (opts.onChange) opts.onChange(value);
    }

    shell.panel.addEventListener('click', function (ev) {
      var nav = ev.target.closest('.cal-nav');
      if (nav) {
        var step = parseInt(nav.getAttribute('data-step'), 10);
        var m = view.m + step;
        view = { y: view.y + Math.floor((m - 1) / 12), m: ((m - 1) % 12 + 12) % 12 + 1 };
        renderPanel();
        return;
      }
      if (ev.target.closest('[data-today]')) { pick(todayIso); return; }
      if (ev.target.closest('[data-clear]')) { pick(''); return; }
      var day = ev.target.closest('.cal-day');
      if (day) pick(day.getAttribute('data-date'));
    });

    syncLabel();
    renderPanel();
    return {
      getValue: function () { return value; },
      setValue: function (v) { value = parseIso(v) ? v : ''; view = startView(); syncLabel(); renderPanel(); }
    };
  }

  Diary.pickers = { dropdown: dropdown, calendar: calendar };
})(window.Diary);
