/* progressive enhancement for the prerendered pages: live GitHub star count + copy buttons. Everything works without it. */
(function () {
  var API = 'https://api.github.com/repos/GovinduSasanka/opus-motion-library';
  var KEY = 'mgl:stars';
  var els = document.querySelectorAll('[data-star-count]');
  function fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  }
  function show(n) {
    for (var i = 0; i < els.length; i++) els[i].textContent = '★ ' + fmt(n);
  }
  try {
    var c = JSON.parse(localStorage.getItem(KEY) || 'null');
    var fresh = false;
    if (c && typeof c.n === 'number') {
      show(c.n);
      fresh = Date.now() - c.t < 3600000;
    }
    if (!fresh) {
      fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (j && typeof j.stargazers_count === 'number') {
            show(j.stargazers_count);
            try { localStorage.setItem(KEY, JSON.stringify({ n: j.stargazers_count, t: Date.now() })); } catch (e) {}
          }
        })
        .catch(function () {});
    }
  } catch (e) {}
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[data-copy]');
    if (!b) return;
    var pre = b.closest('.snippet').querySelector('pre');
    var done = function () { var t = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = t; }, 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(done, function () {});
  });
})();
