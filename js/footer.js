// Футер — последний лист картотеки: язычок сверху, название с расшифровкой,
// где хранятся данные, корзина и переключатель дизайна (стандартный появится позже).
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
      '<a class="footer-link" href="#/trash">Корзина' + (trashed ? '<span class="footer-count">' + trashed + '</span>' : '') + '</a>' +
      '</div>' +

      '<div class="footer-col">' +
      '<h3 class="footer-label">Дизайн</h3>' +
      '<div class="design-switch" role="radiogroup" aria-label="Дизайн">' +
      '<button type="button" role="radio" aria-checked="true" class="is-on">Дофаминовый</button>' +
      '<button type="button" role="radio" aria-checked="false" disabled title="Скоро">Стандартный<small>скоро</small></button>' +
      '</div>' +
      '</div>' +

      '</div>' +
      '<div class="footer-bottom">' +
      '<span>© ' + YEAR + ' фикс</span>' +
      '<a href="#/about">О приложении</a>' +
      '</div>' +
      '</div>';
  }

  function setup() { render(); }

  Diary.footer = { setup: setup, render: render };
})(window.Diary);
