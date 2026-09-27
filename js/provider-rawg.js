// RAWG search adapter for games. Requires a free key in Diary.secrets.rawg
// (rawg.io/apidocs -> Get API key).
//
// Caveat worth knowing: RAWG's free tier exposes `background_image`, which is
// landscape key art rather than portrait box art. In the 2:3 cover frame it
// letterboxes rather than filling — accurate to what the API actually offers,
// and a cover can always be replaced by hand afterwards.
window.Diary = window.Diary || {};

(function (Diary) {
  var ENDPOINT = 'https://api.rawg.io/api/games';
  var MAX_RESULTS = 8;

  function mapGame(item) {
    return {
      title: item.name || '',
      author: '',
      cover: item.background_image || null,
      year: (item.released || '').slice(0, 4),
      externalId: item.id ? String(item.id) : null,
      url: item.slug ? 'https://rawg.io/games/' + item.slug : null
    };
  }

  function search(query) {
    var key = (Diary.secrets && Diary.secrets.rawg) || '';
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

  Diary.providers.register({
    id: 'rawg',
    label: 'RAWG',
    categories: ['game'],
    search: search
  });
})(window.Diary);
