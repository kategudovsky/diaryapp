// Google Books search adapter. Works without an API key — the public volumes
// endpoint is rate-limited per IP instead — and picks one up from
// Diary.secrets.googleBooks if that quota ever runs out.
// Registers itself into Diary.providers, so the modal uses it without knowing
// anything about Google specifically.
window.Diary = window.Diary || {};

(function (Diary) {
  var ENDPOINT = 'https://www.googleapis.com/books/v1/volumes';
  var MAX_RESULTS = 8;

  // Search results only ever carry the 128px `thumbnail`, which looks mushy
  // on a card. The same content URL serves bigger renditions through `zoom`
  // (1 = 128px, 2 = 300px, 3 = 575px); unsupported values fall back to the
  // thumbnail, so asking for 3 is safe. Also strips the fake page-curl
  // overlay Google bakes in and upgrades the link to https.
  var COVER_ZOOM = 3;

  function cleanCoverUrl(url) {
    if (!url) return null;
    var clean = url.replace(/^http:/, 'https:').replace(/&edge=curl/g, '');
    return /[?&]zoom=\d+/.test(clean)
      ? clean.replace(/([?&]zoom=)\d+/, '$1' + COVER_ZOOM)
      : clean + '&zoom=' + COVER_ZOOM;
  }

  function mapVolume(item) {
    var info = item.volumeInfo || {};
    var links = info.imageLinks || {};
    return {
      title: info.title || '',
      author: (info.authors || []).join(', '),
      cover: cleanCoverUrl(links.thumbnail || links.smallThumbnail),
      year: (info.publishedDate || '').slice(0, 4),
      externalId: item.id,
      url: info.infoLink || null
    };
  }

  function search(query) {
    var key = (Diary.secrets && Diary.secrets.googleBooks) || '';
    var url = ENDPOINT +
      '?q=' + encodeURIComponent(query) +
      '&maxResults=' + MAX_RESULTS +
      '&printType=books' +
      (key ? '&key=' + encodeURIComponent(key) : '');

    return fetch(url).then(function (res) {
      if (res.status === 429) {
        var err = new Error('quota');
        err.code = 'quota';
        throw err;
      }
      if (!res.ok) throw new Error('Google Books вернул ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.items || []).map(mapVolume).filter(function (r) { return r.title; });
    });
  }

  Diary.providers.register({
    id: 'google-books',
    label: 'Google Books',
    categories: ['book'],
    search: search
  });
})(window.Diary);
