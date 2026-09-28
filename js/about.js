// Страница «О приложении»: что такое «Фикс», как устроены папки и подборки,
// где хранятся записи и откуда берутся обложки.
window.Diary = window.Diary || {};

(function (Diary) {
  var esc = Diary.utils.escapeHtml;

  function sectionHtml(title, body) {
    return '<section class="about-block"><h2>' + esc(title) + '</h2>' + body + '</section>';
  }

  function render(app) {
    var p = Diary.PAGE_THEME.about;
    var days = Diary.TRASH_RETENTION_DAYS;

    app.innerHTML = '' +
      '<section class="coll" style="--c:' + p.c + ';--fi:' + p.fi + '">' +
      '<div class="coll-head">' +
      '<div class="coll-hero">' +
      '<div>' +
      '<div class="mono">INFO // о приложении</div>' +
      '<h1>О фиксе</h1>' +
      '<p class="coll-sub"><b>Ф</b>ильмы, <b>и</b>гры, <b>к</b>ниги, <b>с</b>ериалы — всё, что зацепило, в одной картотеке.</p>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="sheet sheet--flat about">' +
      sectionHtml('Как это устроено',
        '<p>Каждая категория — отдельная папка. Внутри записи делятся на «хочу» и «готово», их можно искать, фильтровать по жанру и сортировать.</p>' +
        '<p>Подборки собирают записи из любых папок: «под плед», «посоветовать маме», «космос» — что угодно.</p>') +
      sectionHtml('Где хранятся записи',
        '<p>Всё хранится только в этом браузере, на сервер ничего не отправляется. Если очистить данные сайта или открыть «Фикс» в другом браузере, записей там не будет.</p>' +
        '<p>Удалённые записи лежат в <a href="#/trash">корзине</a> ' + days + ' дней, потом исчезают насовсем.</p>') +
      sectionHtml('Обложки и поиск по каталогам',
        '<p>При добавлении записи название можно найти в каталоге: книги — Google Books, фильмы и сериалы — Кинопоиск, игры — RAWG. Обложка и автор подставятся сами.</p>' +
        '<p>Если обложки нет, «Фикс» рисует свою открытку из названия.</p>') +
      sectionHtml('Шрифты',
        '<p>Заголовки — Nauryz Red Keds (© 2024 Red Keds), текст — Onest, подписи — JetBrains Mono и Caveat.</p>') +
      '</div>' +
      '</section>';
  }

  Diary.about = { render: render };
})(window.Diary);
