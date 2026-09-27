// Trash tab: soft-deleted entries with a restore action and a countdown to
// permanent removal. Repository.purgeExpired() already runs on init(); we
// also call it whenever this tab renders so the countdown never lags.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;
  var esc = utils.escapeHtml;

  function setup(app) {
    app.addEventListener('click', function (ev) {
      if (Diary.state.currentTab !== 'trash') return;
      var t = ev.target;
      if (t.closest('[data-empty-trash]')) {
        if (repo.getTrashed().length === 0) return;
        if (!confirm('Удалить все записи в корзине навсегда? Это действие нельзя отменить.')) return;
        repo.emptyTrash();
        return;
      }
      var restoreBtn = t.closest('[data-action="restore"]');
      if (restoreBtn) {
        repo.restore(restoreBtn.getAttribute('data-id'));
        Diary.toast('Запись вернулась в папку');
        return;
      }
      var deleteBtn = t.closest('[data-action="delete-forever"]');
      if (deleteBtn && confirm('Удалить эту запись навсегда? Это действие нельзя отменить.')) {
        repo.permanentlyDelete(deleteBtn.getAttribute('data-id'));
      }
    });
  }

  function trashCardHtml(entry) {
    var daysLeft = Math.max(0, Diary.TRASH_RETENTION_DAYS - utils.daysBetween(entry.deletedAt, Date.now()));
    var t = Diary.THEME[entry.category];
    return '' +
      '<div class="card card--trash" data-id="' + entry.id + '">' +
      '<span class="cover">' + Diary.render.coverInner(entry) +
      '<span class="status-pill" style="--sc:#FFF6E8">' + (daysLeft > 0 ? 'ещё ' + daysLeft + ' ' + utils.plural(daysLeft, ['день', 'дня', 'дней']) : 'удаляется…') + '</span>' +
      '</span>' +
      '<span class="card-meta">' +
      '<span class="card-code"><span class="dot" style="--c:' + t.c + '"></span>' + esc(Diary.CATEGORY_LABEL[entry.category]) + '</span>' +
      '<h3>' + esc(entry.title) + '</h3>' +
      '<span class="trash-actions">' +
      '<button type="button" class="btn btn--small" data-action="restore" data-id="' + entry.id + '">Восстановить</button>' +
      '<button type="button" class="link-danger" data-action="delete-forever" data-id="' + entry.id + '">Удалить навсегда</button>' +
      '</span>' +
      '</span>' +
      '</div>';
  }

  function render(app) {
    repo.purgeExpired();
    var trashed = repo.getTrashed().sort(function (a, b) { return b.deletedAt - a.deletedAt; });
    var p = Diary.PAGE_THEME.trash;
    var days = Diary.TRASH_RETENTION_DAYS;

    var body = trashed.length === 0
      ? '<div class="empty">' + Diary.covers.mascot('book', '#1E5A3A') + '<p>Корзина пуста</p><span class="empty-hint">Удалённые записи будут появляться здесь.</span></div>'
      : '<div class="grid">' + trashed.map(trashCardHtml).join('') + '</div>';

    app.innerHTML = '' +
      '<section class="coll" style="--c:' + p.c + ';--fi:' + p.fi + '">' +
      '<div class="coll-head">' +
      '<a class="back" href="#/">← все папки</a>' +
      '<div class="coll-hero">' +
      '<div>' +
      '<div class="mono">BIN // корзина</div>' +
      '<h1>Корзина</h1>' +
      '<p class="coll-sub">Удалённые записи хранятся здесь ' + days + ' ' + utils.plural(days, ['день', 'дня', 'дней']) + ', затем удаляются навсегда.</p>' +
      '</div>' +
      '<div class="coll-mascot">' + Diary.covers.mascot('book', '#1E5A3A', { wave: true }) + '</div>' +
      '</div>' +
      '<div class="coll-tools">' +
      '<button type="button" class="btn btn--ghost" data-empty-trash' + (trashed.length ? '' : ' disabled') + '>Очистить корзину</button>' +
      '</div>' +
      '</div>' +
      '<div class="sheet sheet--flat">' + body + '</div>' +
      '</section>' +
      Diary.category.sideTabsHtml(null);
  }

  Diary.trash = { setup: setup, render: render };
})(window.Diary);
