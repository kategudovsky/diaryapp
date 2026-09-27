// Shared constants: categories, statuses, predefined genre lists.
window.Diary = window.Diary || {};

(function (Diary) {
  // Порядок совпадает с названием: Ф-И-К-С.
  Diary.CATEGORIES = ['movie', 'game', 'book', 'series'];

  Diary.CATEGORY_LABEL = {
    movie: 'Фильм',
    series: 'Сериал',
    game: 'Игра',
    book: 'Книга'
  };

  Diary.CATEGORY_LABEL_PLURAL = {
    movie: 'Фильмы',
    series: 'Сериалы',
    game: 'Игры',
    book: 'Книги'
  };

  Diary.STATUS_KEYS = ['planned', 'done'];

  Diary.STATUS_LABEL = {
    movie: { planned: 'Хочу посмотреть', done: 'Просмотрено' },
    series: { planned: 'Хочу посмотреть', done: 'Просмотрено' },
    game: { planned: 'Хочу поиграть', done: 'Пройдено' },
    book: { planned: 'Хочу прочитать', done: 'Прочитано' }
  };

  var SCREEN_GENRES = [
    'Драма', 'Комедия', 'Триллер', 'Ужасы', 'Фантастика', 'Фэнтези',
    'Детектив/Криминал', 'Боевик', 'Приключения', 'Мелодрама',
    'Анимация', 'Документальный', 'Военный', 'Исторический', 'Мюзикл', 'Биография'
  ];

  Diary.GENRES = {
    movie: SCREEN_GENRES.slice(),
    series: SCREEN_GENRES.slice(),
    game: [
      'Экшен', 'RPG', 'Приключения', 'Стратегия', 'Симулятор', 'Головоломка',
      'Платформер', 'Хоррор', 'Гонки', 'Спортивная', 'Визуальная новелла',
      'Метроидвания', 'Роглайк', 'Инди'
    ],
    book: [
      'Художественная литература', 'Фантастика', 'Фэнтези', 'Детектив', 'Триллер',
      'Нон-фикшн', 'Биография', 'Поэзия', 'Классика', 'Ужасы', 'Романтика',
      'История', 'Психология', 'Саморазвитие', 'Комикс/Манга'
    ]
  };

  Diary.TRASH_RETENTION_DAYS = 15;

  // ---- Оформление «Фикса» ----
  // Цвет папки, цвет текста на ней, цвет талисмана, цвет клетки фона страницы
  // и код для язычков. Логике это не нужно — только интерфейсу.
  Diary.THEME = {
    movie:  { code: 'FILM', c: '#FF5B37', fi: '#FFF6E8', m: '#FFD23F', grid: 'rgba(255,246,232,.16)' },
    game:   { code: 'GAME', c: '#C9F04B', fi: '#2B1810', m: '#8B5CF6', grid: 'rgba(43,24,16,.08)' },
    book:   { code: 'BOOK', c: '#1E5A3A', fi: '#FFF6E8', m: '#FF9ACB', grid: 'rgba(255,246,232,.1)' },
    series: { code: 'SER',  c: '#FF9ACB', fi: '#2B1810', m: '#FF5B37', grid: 'rgba(43,24,16,.08)' }
  };

  // Страницы, которые не относятся к одной категории.
  Diary.PAGE_THEME = {
    collections: { c: '#C7B4F7', fi: '#2B1810', grid: 'rgba(43,24,16,.08)' },
    trash:       { c: '#FFB59A', fi: '#2B1810', grid: 'rgba(43,24,16,.08)' }
  };

  Diary.STATUS_COLOR = { planned: '#FFD23F', done: '#C7B4F7' };

  // Формы для «12 фильмов», «3 игры» и т. п.
  Diary.CATEGORY_FORMS = {
    movie: ['фильм', 'фильма', 'фильмов'],
    game: ['игра', 'игры', 'игр'],
    book: ['книга', 'книги', 'книг'],
    series: ['сериал', 'сериала', 'сериалов']
  };

  // Короткое «сделано» для счётчиков на папках.
  Diary.DONE_WORD = { movie: 'просмотрено', game: 'пройдено', book: 'прочитано', series: 'просмотрено' };

  // ?demo в адресе — отдельное хранилище с примерами, настоящие записи не трогаются.
  Diary.DEMO = /[?&]demo\b/.test(window.location.search) || window.DIARY_FORCE_DEMO === true;

  Diary.DATE_TYPES = ['exact', 'approx', 'unknown'];

  Diary.MONTHS_RU = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
  ];
})(window.Diary);
