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
  // Цвет папки, цвет текста на ней, цвет фигуры, цвет клетки фона страницы
  // и код для язычков. Логике это не нужно — только интерфейсу.
  Diary.THEME = {
    movie:  { code: 'FILM', c: '#EC1864', fi: '#FFFFFF', m: '#FFC43D', grid: 'rgba(255, 255, 255,.16)' },
    game:   { code: 'GAME', c: '#FFC43D', fi: '#1C1B3A', m: '#EC1864', grid: 'rgba(28, 27, 58,.08)' },
    book:   { code: 'BOOK', c: '#6077D4', fi: '#FFFFFF', m: '#DAF5F9', grid: 'rgba(255, 255, 255,.1)' },
    series: { code: 'SER',  c: '#B79CF2', fi: '#1C1B3A', m: '#EC1864', grid: 'rgba(28, 27, 58,.08)' }
  };

  // Страницы, которые не относятся к одной категории.
  Diary.PAGE_THEME = {
    collections: { c: '#6077D4', fi: '#FFFFFF', grid: 'rgba(255, 255, 255,.14)' },
    trash:       { c: '#B79CF2', fi: '#1C1B3A', grid: 'rgba(28, 27, 58,.08)' },
    about:       { c: '#FFC43D', fi: '#1C1B3A', grid: 'rgba(28, 27, 58,.08)' },
    search:      { c: '#DAF5F9', fi: '#1C1B3A', grid: 'rgba(96, 119, 212, .15)' }
  };

  Diary.STATUS_COLOR = { planned: '#FFC43D', done: '#DAF5F9' };

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
