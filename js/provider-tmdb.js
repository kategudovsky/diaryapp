// TMDB search adapter, serving both movies and series. Requires a free key in
// Diary.secrets.tmdb (themoviedb.org -> Settings -> API -> API Key, v3 auth).
// Registers for two categories and picks the endpoint from the one it is
// handed, since TMDB keeps films and shows apart.
window.Diary = window.Diary || {};

(function (Diary) {
  var BASE = 'https://api.themoviedb.org/3';
  // Posters are a fixed 2:3, so w500 lands right on a ~260px card at 2x.
  var IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
  var MAX_RESULTS = 8;

  var PATH_FOR = { movie: '/search/movie', series: '/search/tv' };

  // TMDB names the same fields differently for films and shows.
  function mapResult(item, category) {
    var date = category === 'series' ? item.first_air_date : item.release_date;
    return {
      title: (category === 'series' ? item.name : item.title) || '',
      author: '',
      cover: item.poster_path ? IMAGE_BASE + item.poster_path : null,
      year: (date || '').slice(0, 4),
      externalId: item.id ? String(item.id) : null,
      url: item.id ? 'https://www.themoviedb.org/' + (category === 'series' ? 'tv' : 'movie') + '/' + item.id : null
    };
  }

  function search(query, category) {
    var key = (Diary.secrets && Diary.secrets.tmdb) || '';
    if (!key) {
      var noKey = new Error('no tmdb key');
      noKey.code = 'nokey';
      return Promise.reject(noKey);
    }

    var path = PATH_FOR[category] || PATH_FOR.movie;
    var url = BASE + path +
      '?api_key=' + encodeURIComponent(key) +
      '&query=' + encodeURIComponent(query) +
      '&language=ru-RU' +
      '&include_adult=false';

    return fetch(url).then(function (res) {
      if (res.status === 429) {
        var quota = new Error('quota');
        quota.code = 'quota';
        throw quota;
      }
      if (res.status === 401) {
        var bad = new Error('bad tmdb key');
        bad.code = 'nokey';
        throw bad;
      }
      if (!res.ok) throw new Error('TMDB вернул ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.results || [])
        .slice(0, MAX_RESULTS)
        .map(function (item) { return mapResult(item, category); })
        .filter(function (r) { return r.title; });
    });
  }

  Diary.providers.register({
    id: 'tmdb',
    label: 'TMDB',
    categories: ['movie', 'series'],
    search: search
  });
})(window.Diary);
