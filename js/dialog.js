// Окно подтверждения в стиле «Фикса» вместо системного confirm():
// Diary.confirm({ title, text, ok, cancel, danger }) → Promise<boolean>.
// Открывается поверх всего, в том числе поверх окна записи; Esc и клик
// мимо окна — это «нет». Фокус ставится на безопасную кнопку.
window.Diary = window.Diary || {};

(function (Diary) {
  var esc = Diary.utils.escapeHtml;
  var root = null;
  var resolveCurrent = null;
  var returnFocus = null;

  function finish(answer) {
    if (!root || root.hidden) return;
    root.hidden = true;
    root.innerHTML = '';
    document.removeEventListener('keydown', onKey, true);
    var done = resolveCurrent;
    resolveCurrent = null;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    if (done) done(answer);
  }

  // Слушаем в фазе захвата и гасим Esc, чтобы он не закрыл заодно окно записи под нами.
  function onKey(ev) {
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); finish(false); }
    if (ev.key === 'Tab') {
      var buttons = root.querySelectorAll('button');
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  }

  function confirmDialog(opts) {
    if (!root) root = document.getElementById('confirmRoot');
    if (resolveCurrent) finish(false);
    returnFocus = document.activeElement;
    root.innerHTML = '' +
      '<div class="confirm-backdrop" data-confirm="no"></div>' +
      '<div class="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmText">' +
      '<h2 id="confirmTitle">' + esc(opts.title) + '</h2>' +
      (opts.text ? '<p id="confirmText">' + esc(opts.text) + '</p>' : '') +
      '<div class="confirm-actions">' +
      '<button type="button" class="btn btn--ghost" data-confirm="no">' + esc(opts.cancel || 'Отмена') + '</button>' +
      '<button type="button" class="btn' + (opts.danger ? ' btn--danger' : '') + '" data-confirm="yes">' + esc(opts.ok || 'Да') + '</button>' +
      '</div>' +
      '</div>';
    root.hidden = false;
    document.addEventListener('keydown', onKey, true);
    root.querySelector('[data-confirm="no"].btn').focus({ preventScroll: true });
    return new Promise(function (resolve) { resolveCurrent = resolve; });
  }

  document.addEventListener('click', function (ev) {
    if (!root || root.hidden) return;
    var b = ev.target.closest('[data-confirm]');
    if (b && root.contains(b)) finish(b.getAttribute('data-confirm') === 'yes');
  });

  Diary.confirm = confirmDialog;
})(window.Diary);
