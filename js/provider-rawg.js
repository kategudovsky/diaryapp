// RAWG search adapter for games. Requires a free key in Diary.secrets.rawg
// (rawg.io/apidocs -> Get API key).
//
// Caveat worth knowing: RAWG's free tier exposes `background_image`, which is
// landscape key art rather than portrait box art. In the 2:3 cover frame it
// letterboxes rather than filling — accurate to what the API actually offers,
// and a cover can always be replaced by hand afterwards.
//
// The search/list endpoint carries `genres` (English, RAWG's own taxonomy)
// and `tags` (a much longer free-form list) but no description — that's only
// on the per-game detail endpoint, so fetchDetails() below hits it once,
// when the user actually picks a result, not on every keystroke.
window.Diary = window.Diary || {};

(function (Diary) {
  var ENDPOINT = 'https://api.rawg.io/api/games';
  var MAX_RESULTS = 8;

  var GENRE_MAP = {
    action: 'Экшен', rpg: 'RPG', adventure: 'Приключения', strategy: 'Стратегия',
    simulation: 'Симулятор', puzzle: 'Головоломка', platformer: 'Платформер',
    racing: 'Гонки', sports: 'Спортивная', indie: 'Инди'
  };
  // Genres RAWG doesn't have as a top-level genre — they only show up as tags.
  var TAG_MAP = {
    horror: 'Хоррор', roguelike: 'Роглайк', metroidvania: 'Метроидвания',
    'visual-novel': 'Визуальная новелла'
  };

  function mapGenres(item) {
    var seen = {};
    var out = [];
    (item.genres || []).forEach(function (g) {
      var mapped = GENRE_MAP[g.slug];
      if (mapped && !seen[mapped]) { seen[mapped] = true; out.push(mapped); }
    });
    (item.tags || []).forEach(function (t) {
      var mapped = TAG_MAP[t.slug];
      if (mapped && !seen[mapped]) { seen[mapped] = true; out.push(mapped); }
    });
    return out;
  }

  function mapGame(item) {
    return {
      title: item.name || '',
      author: '',
      genres: mapGenres(item),
      cover: item.background_image || null,
      year: (item.released || '').slice(0, 4),
      externalId: item.id ? String(item.id) : null,
      url: item.slug ? 'https://rawg.io/games/' + item.slug : null
    };
  }

  function apiKey() { return (Diary.secrets && Diary.secrets.rawg) || ''; }

  function search(query) {
    var key = apiKey();
    if (!key) {
      var noKey = new Error('no rawg key');
      noKey.code = 'nokey';
      return Promise.reject(noKey);
    }

    var url = ENDPOINT +
      '?key=' + encodeURIComponent(key) +
      '&search=' + encodeURIComponent(query) +
      '&page_size=' + MAX_RESULTS;

    return fetch(url).then(function (res) {
      if (res.status === 429) {
        var quota = new Error('quota');
        quota.code = 'quota';
        throw quota;
      }
      if (res.status === 401 || res.status === 403) {
        var bad = new Error('bad rawg key');
        bad.code = 'nokey';
        throw bad;
      }
      if (!res.ok) throw new Error('RAWG вернул ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.results || []).map(mapGame).filter(function (r) { return r.title; });
    });
  }

  // RAWG сваливает в description_raw всё подряд — сюжет, особенности, состав
  // изданий, — иногда за 2000 символов. Берём только первый абзац: абзацы там
  // разделены одиночным переносом строки, пустых строк между ними обычно нет.
  var DESCRIPTION_LIMIT = 600;

  function firstParagraph(text) {
    var para = String(text || '').trim().split(/\r?\n/)[0].trim();
    if (para.length <= DESCRIPTION_LIMIT) return para;
    // Изредка весь текст идёт одним абзацем — тогда режем по концу предложения.
    var cut = para.slice(0, DESCRIPTION_LIMIT);
    var lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    return lastStop > 0 ? cut.slice(0, lastStop + 1) : cut.trim() + '…';
  }

  function fetchDetails(externalId) {
    var key = apiKey();
    if (!key || !externalId) return Promise.resolve(null);
    var url = ENDPOINT + '/' + encodeURIComponent(externalId) + '?key=' + encodeURIComponent(key);
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('RAWG вернул ' + res.status);
      return res.json();
    }).then(function (data) {
      return { description: firstParagraph(data.description_raw) };
    });
  }

  Diary.providers.register({
    id: 'rawg',
    label: 'RAWG',
    categories: ['game'],
    search: search,
    fetchDetails: fetchDetails
  });
})(window.Diary);
