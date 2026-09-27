// Search-provider interface for future catalog lookups (Google Books, IMDb,
// Kinopoisk). Not wired into the UI yet — this only fixes the shape so that
// hooking up a real API later doesn't require touching the entry schema or
// the modal code, just registering an adapter here.
//
// A provider is an object: { id: string, categories: string[],
//   search: function(query, category) -> Promise<Array<{ title, cover, author,
//   year, externalId, url }>> }
//
// `category` is passed because one provider can serve several of them and may
// need different endpoints per category (TMDB: movie vs tv).
//
// Entries already carry an optional `source` field
// ({ provider, externalId, url }) reserved for whichever result the user
// eventually picks from a provider search.
window.Diary = window.Diary || {};

(function (Diary) {
  var registry = {};

  function register(provider) {
    registry[provider.id] = provider;
  }

  function get(id) {
    return registry[id] || null;
  }

  function listForCategory(category) {
    return Object.keys(registry)
      .map(function (id) { return registry[id]; })
      .filter(function (p) { return p.categories.indexOf(category) !== -1; });
  }

  Diary.providers = {
    register: register,
    get: get,
    listForCategory: listForCategory
  };
})(window.Diary);