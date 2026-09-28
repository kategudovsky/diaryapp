// UI-only state: current tab and per-category filter/sort selections.
// Nothing here is persisted — it resets on reload, unlike repository data.
window.Diary = window.Diary || {};

(function (Diary) {
  var TABS = ['home'].concat(Diary.CATEGORIES, ['collections', 'trash', 'about', 'search']);

  function freshCategoryFilters() {
    return {
      search: '',
      status: 'all',   // 'all' | one of STATUS_KEYS | 'someday'
      genre: 'all',
      sort: 'date_desc'
    };
  }

  var state = {
    currentTab: 'home',
    filters: {} // category -> freshCategoryFilters()
  };

  Diary.CATEGORIES.forEach(function (cat) {
    state.filters[cat] = freshCategoryFilters();
  });

  Diary.state = state;
  Diary.TABS = TABS;
})(window.Diary);