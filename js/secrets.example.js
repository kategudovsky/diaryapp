// TEMPLATE — copy this file to js/secrets.js and paste your own keys there.
// js/secrets.js is the file the app actually loads, and it is gitignored.
//
// Heads up: this is a buildless client-side app, so whatever lands here is
// downloaded by the browser and readable by anyone who opens the page. Keeping
// keys in their own file makes them easy to exclude from version control and
// to swap per machine — it does not hide them from the page itself. If this
// ever goes on the open web, move the calls behind a small proxy that holds
// the keys server-side.
//
// Where each key comes from:
//   googleBooks — console.cloud.google.com/apis/credentials (enable "Books API")
//   kinopoisk   — kinopoiskapiunofficial.tech -> sign up, key is issued right away
//   rawg        — rawg.io/apidocs -> Get API key (the signup form asks for a
//                 website URL, but doesn't actually verify it)
//
// An empty string just disables catalog lookup for that category; everything
// else keeps working and entries can still be typed in by hand.
window.Diary = window.Diary || {};

(function (Diary) {
  Diary.secrets = {
    googleBooks: '',
    kinopoisk: '',
    rawg: ''
  };
})(window.Diary);
