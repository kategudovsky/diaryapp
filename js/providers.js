// Search-provider interface for future catalog lookups (Google Books, IMDb,
// Kinopoisk). Not wired into the UI yet — this only fixes the shape so that
// hooking up a real API later doesn't require touching the entry schema or
// the modal code, just registering an adapter here.
//
// A provider is an object: { id: string, categories: string[],
//   search: function(query, category) -> Promise<Array<{ title, cover, author,
//   description, genres, year, externalId, url }>>,
//   fetchDetails: function(externalId) -> Promise<{ description }> (optional) }
//
// `description` and `genres` are optional — a provider that can't cheaply
// supply one on a list/search call (e.g. RAWG, whose search endpoint omits
// description) can just leave it out; the modal only autofills a field when a
// result carries it. `genres` must already be values from Diary.GENRES[category]
// — mapping a provider's own taxonomy onto ours is the provider's job.
//
// `fetchDetails` is an extra escape hatch for data that's only on a
// per-item detail endpoint, not the search/list one (RAWG's description).
// The modal calls it after the user picks a result, not on every keystroke.
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