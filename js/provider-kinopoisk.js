// Kinopoisk search adapter for movies and series, via kinopoiskapiunofficial.tech.
// Requires a free token in Diary.secrets.kinopoisk — get one at
// kinopoiskapiunofficial.tech (the signup form there hands out a key directly,
// no RapidAPI account needed). Used instead of TMDB because themoviedb.org is
// DNS-blocked for some users.
//
// (There's a second, similarly-named service — api.kinopoisk.dev / its 2026
// rename api.poiskkino.dev, reachable via the @kinopoiskdev_bot Telegram bot —
// but it doesn't send CORS headers, so a browser can't call it directly from
// here. This unofficial one does: `Access-Control-Allow-Origin: *`.)
//
// The search-by-keyword endpoint doesn't take a type filter, so it returns
// films, series and shorts mixed together; this adapter splits them by the
// `type` field (FILM/VIDEO vs TV_SERIES/MINI_SERIES) to serve the 'movie' and
// 'series' categories.
//
// Kinopoisk's own genre words are already Russian and mostly line up with
// Diary.GENRES(movie/series) as-is (SCREEN_GENRES in constants.js) — this
// just normalises case and renames the couple that don't match verbatim.
window.Diary = window.Diary || {};

(function (Diary) {
  var ENDPOINT = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword';
  var MAX_RESULTS = 8;
  var SERIES_TYPES = { TV_SERIES: true, MINI_SERIES: true };

  var GENRE_MAP = {
    'драма': 'Драма', 'комедия': 'Комедия', 'триллер': 'Триллер', 'ужасы': 'Ужасы',
    'фантастика': 'Фантастика', 'фэнтези': 'Фэнтези', 'боевик': 'Боевик',
    'приключения': 'Приключения', 'мелодрама': 'Мелодрама', 'документальный': 'Документальный',
    'военный': 'Военный', 'история': 'Исторический', 'мюзикл': 'Мюзикл', 'музыка': 'Мюзикл',
    'биография': 'Биография', 'детектив': 'Детектив/Криминал', 'криминал': 'Детектив/Криминал',
    'мультфильм': 'Анимация', 'аниме': 'Анимация'
  };

  function mapGenres(list) {
    var seen = {};
    return (list || []).reduce(function (out, g) {
      var mapped = GENRE_MAP[(g.genre || '').toLowerCase().trim()];
      if (mapped && !seen[mapped]) { seen[mapped] = true; out.push(mapped); }
      return out;
    }, []);
  }

  function mapItem(item) {
    return {
      title: item.nameRu || item.nameEn || '',
      author: '',
      description: item.description || '',
      genres: mapGenres(item.genres),
      cover: item.posterUrl || item.posterUrlPreview || null,
      year: item.year ? String(item.year) : '',
      externalId: item.filmId ? String(item.filmId) : null,
      url: item.filmId ? 'https://www.kinopoisk.ru/film/' + item.filmId + '/' : null,
      _type: item.type
    };
  }

  function search(query, category) {
    var key = (Diary.secrets && Diary.secrets.kinopoisk) || '';
    if (!key) {
      var noKey = new Error('no kinopoisk key');
      noKey.code = 'nokey';
      return Promise.reject(noKey);
    }

    var url = ENDPOINT + '?keyword=' + encodeURIComponent(query) + '&page=1';

    return fetch(url, { headers: { 'X-API-KEY': key } }).then(function (res) {
      if (res.status === 429) {
        var quota = new Error('quota');
        quota.code = 'quota';
        throw quota;
      }
      if (res.status === 401 || res.status === 402 || res.status === 403) {
        var bad = new Error('bad kinopoisk key');
        bad.code = 'nokey';
        throw bad;
      }
      if (!res.ok) throw new Error('Kinopoisk вернул ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.films || [])
        .map(mapItem)
        .filter(function (r) {
          if (!r.title) return false;
          var isSeries = !!SERIES_TYPES[r._type];
          return category === 'series' ? isSeries : !isSeries;
        })
        .slice(0, MAX_RESULTS);
    });
  }

  Diary.providers.register({
    id: 'kinopoisk',
    label: 'Кинопоиск',
    categories: ['movie', 'series'],
    search: search
  });
})(window.Diary);
