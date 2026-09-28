// Футер — последний лист картотеки: язычок сверху, название с расшифровкой,
// где хранятся данные и переключатель дизайна.
window.Diary = window.Diary || {};

(function (Diary) {
  var repo = Diary.repository;
  var utils = Diary.utils;

  var YEAR = new Date().getFullYear();

  function el() { return document.getElementById('siteFooter'); }

  function render() {
    var footer = el();
    if (!footer) return;
    var trashed = repo.getTrashed().length;
    var total = repo.getActive().length;

    footer.innerHTML = '' +
      '<div class="footer-sheet">' +
      '<div class="footer-tab">FILE_99 // о фиксе</div>' +
      '<div class="footer-grid">' +

      '<div class="footer-col footer-brand">' +
      '<a class="footer-word" href="#/">фикс</a>' +
      '<p class="footer-decode"><b>ф</b>ильмы · <b>и</b>гры · <b>к</b>ниги · <b>с</b>ериалы</p>' +
      '<p class="footer-muted">Личный дневник того, что посмотрено, прочитано и пройдено.</p>' +
      '</div>' +

      '<div class="footer-col">' +
      '<h3 class="footer-label">Данные</h3>' +
      '<p>' + total + ' ' + utils.plural(total, ['запись', 'записи', 'записей']) + ' хранятся в этом браузере. Если очистить данные сайта, они пропадут.</p>' +
      (trashed ? '<p class="footer-muted">В корзине ' + trashed + ' ' + utils.plural(trashed, ['запись', 'записи', 'записей']) + ' — кнопка в правом нижнем углу.</p>' : '') +
      '<div class="backup-actions">' +
      '<button type="button" class="btn btn--small" data-backup="export">Скачать копию</button>' +
      '<button type="button" class="backup-import" data-backup="import">Загрузить копию</button>' +
      '</div>' +
      '</div>' +

      '<div class="footer-col">' +
      '<h3 class="footer-label">Дизайн</h3>' +
      '<div class="design-switch" role="radiogroup" aria-label="Дизайн">' +
      ['dopamine', 'standard'].map(function (d) {
        var on = Diary.design.get() === d;
        return '<button type="button" role="radio" data-design-set="' + d + '" aria-checked="' + on + '"' + (on ? ' class="is-on"' : '') + '>' + (d === 'dopamine' ? 'Дофаминовый' : 'Стандартный') + '</button>';
      }).join('') +
      '</div>' +
      '</div>' +

      '</div>' +
      '<div class="footer-bottom">' +
      '<span>© ' + YEAR + ' фикс</span>' +
      '<a href="#/about">О приложении</a>' +
      '</div>' +
      '</div>';
  }

  // Переключение дизайна: запоминаем выбор и перерисовываем текущую страницу
  // на том же месте прокрутки.
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-design-set]');
    if (!b) return;
    var d = b.getAttribute('data-design-set');
    if (d === Diary.design.get()) return;
    var y = window.scrollY;
    Diary.design.set(d);
    Diary.refresh();
    window.scrollTo(0, y);
  });

  function setup() { render(); }

  Diary.footer = { setup: setup, render: render };
})(window.Diary);
