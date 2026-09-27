// Примеры записей для демо-режима (?demo в адресе). В обычном режиме не используются:
// репозиторий берёт их, только когда Diary.DEMO включён и демо-хранилище пустое.
window.Diary = window.Diary || {};

(function (Diary) {
  // [категория, название, автор, жанры, статус, оценка, тип даты, дата, комментарии, цитаты]
  var rows = [
    ['movie', 'Дюна: Часть вторая', '', ['Фантастика', 'Приключения'], 'done', 5, 'exact', '2026-03-02', ['Пересмотреть в IMAX ещё раз.'], []],
    ['movie', 'Прошлые жизни', '', ['Драма', 'Мелодрама'], 'done', 5, 'exact', '2026-02-14', ['Плакала весь финал.'], []],
    ['movie', 'Анора', '', ['Драма', 'Комедия'], 'done', 4, 'approx', '2026-01', [], []],
    ['movie', 'Паразиты', '', ['Триллер', 'Драма'], 'done', 5, 'approx', '2025', [], []],
    ['movie', 'Бедные-несчастные', '', ['Фэнтези', 'Комедия'], 'done', 3.5, 'exact', '2026-05-03', [], []],
    ['movie', 'Унесённые призраками', '', ['Анимация', 'Фэнтези'], 'done', 5, 'unknown', null, ['Уютное на все времена.'], []],
    ['movie', 'Всё везде и сразу', '', ['Фантастика', 'Комедия'], 'planned', 0, 'unknown', null, ['Советовали три человека подряд.'], []],
    ['movie', 'Субстанция', '', ['Ужасы'], 'planned', 0, 'unknown', null, [], []],
    ['movie', 'Ла-Ла Ленд', '', ['Мюзикл', 'Мелодрама'], 'done', 4.5, 'exact', '2026-07-19', [], []],

    ['game', 'Hades II', '', ['Роглайк', 'Экшен'], 'planned', 0, 'unknown', null, [], []],
    ['game', 'Stardew Valley', '', ['Симулятор', 'Инди'], 'done', 5, 'approx', '2025-12', ['Идеальная игра под плед.'], []],
    ["game", "Baldur's Gate 3", '', ['RPG', 'Приключения'], 'done', 4.5, 'exact', '2026-06-10', ['Играли с друзьями по пятницам.'], []],
    ['game', 'Disco Elysium', '', ['RPG'], 'done', 5, 'exact', '2026-02-25', [], ['«Мы созданы из того, что делаем, а не из того, о чём мечтаем».']],
    ['game', 'Celeste', '', ['Платформер', 'Инди'], 'done', 4, 'approx', '2026-04', [], []],
    ['game', 'Outer Wilds', '', ['Приключения', 'Головоломка'], 'planned', 0, 'unknown', null, [], []],
    ['game', 'Hollow Knight', '', ['Метроидвания'], 'planned', 0, 'unknown', null, ['Вернуться и всё-таки пройти.'], []],

    ['book', 'Мастер и Маргарита', 'Михаил Булгаков', ['Классика', 'Художественная литература'], 'done', 5, 'exact', '2026-02-01', [], ['«Никогда и ничего не просите! Никогда и ничего, и в особенности у тех, кто сильнее вас».']],
    ['book', 'Тайная история', 'Донна Тартт', ['Художественная литература', 'Триллер'], 'done', 5, 'approx', '2025-11', [], []],
    ['book', 'Цирцея', 'Мадлен Миллер', ['Фэнтези'], 'done', 4, 'exact', '2026-03-30', [], []],
    ['book', 'Проект «Аве Мария»', 'Энди Вейер', ['Фантастика'], 'done', 5, 'exact', '2026-08-14', ['Рокки — лучший персонаж года.'], []],
    ['book', 'Норвежский лес', 'Харуки Мураками', ['Художественная литература'], 'planned', 0, 'unknown', null, [], []],
    ['book', 'Сто лет одиночества', 'Габриэль Гарсиа Маркес', ['Классика'], 'planned', 0, 'unknown', null, [], []],
    ['book', 'Хоббит', 'Дж. Р. Р. Толкин', ['Фэнтези', 'Классика'], 'done', 4, 'unknown', null, [], []],

    ['series', 'Медведь', '', ['Драма', 'Комедия'], 'done', 4.5, 'exact', '2026-09-12', ['Yes, chef!'], []],
    ['series', 'Разделение', '', ['Триллер', 'Фантастика'], 'done', 5, 'exact', '2026-04-11', [], []],
    ['series', 'Сёгун', '', ['Исторический', 'Драма'], 'done', 5, 'approx', '2026-01', [], []],
    ['series', 'Дрянь', '', ['Комедия', 'Драма'], 'done', 5, 'approx', '2025', [], ['«Я не хочу быть одна».']],
    ['series', 'Аркейн', '', ['Анимация', 'Фэнтези'], 'planned', 0, 'unknown', null, [], []],
    ['series', 'Белый лотос', '', ['Драма', 'Комедия'], 'planned', 0, 'unknown', null, [], []],
    ['series', 'Офис', '', ['Комедия'], 'done', 4, 'unknown', null, ['Всегда на фоне.'], []]
  ];

  var base = Date.parse('2026-09-01T12:00:00');
  var entries = rows.map(function (r, i) {
    var created = base - (rows.length - i) * 86400000 * 2;
    function notes(list) {
      return list.map(function (text, k) { return { id: 'demo-n-' + i + '-' + k, text: text, createdAt: created }; });
    }
    return {
      id: 'demo-' + (i + 1),
      category: r[0], title: r[1], author: r[2], cover: null,
      genres: r[3], status: r[4], rating: r[5], dateType: r[6], date: r[7],
      comments: notes(r[8]), quotes: notes(r[9]),
      source: null, createdAt: created, updatedAt: created, deletedAt: null
    };
  });

  // Одна запись уже лежит в корзине — чтобы было видно, как она выглядит.
  entries.push({
    id: 'demo-trash', category: 'movie', title: 'Солнцестояние', author: '', cover: null,
    genres: ['Ужасы'], status: 'planned', rating: 0, dateType: 'unknown', date: null,
    comments: [], quotes: [], source: null,
    createdAt: base, updatedAt: base, deletedAt: Date.now() - 3 * 86400000
  });

  Diary.demoSeed = {
    entries: entries,
    collections: [
      { id: 'demo-c1', name: 'Под плед', entryIds: ['demo-6', 'demo-11', 'demo-23', 'demo-30', 'demo-9'], createdAt: base, updatedAt: base },
      { id: 'demo-c2', name: 'Космос', entryIds: ['demo-1', 'demo-20', 'demo-15'], createdAt: base, updatedAt: base },
      { id: 'demo-c3', name: 'Посоветовать маме', entryIds: ['demo-2', 'demo-17', 'demo-26'], createdAt: base, updatedAt: base }
    ]
  };
})(window.Diary);
