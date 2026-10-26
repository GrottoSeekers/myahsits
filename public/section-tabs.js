// Long edit pages: show one section at a time instead of one long scroll.
// The row of jump links marked [data-section-tabs] becomes the tabs; each link
// points at a section by id (#details, #photos ...). Hidden sections stay in
// the page, so "Save changes" still saves everything.
// The side preview (#preview) is always visible beside the form on wide
// screens; on narrow screens, where it would sit below the form, it shows only
// on its own tab.
(function () {
  var NARROW = '(max-width: 960px)';

  function start() {
    var bar = document.querySelector('[data-section-tabs]');
    if (!bar) return;
    var links = [].slice.call(bar.querySelectorAll('a[href^="#"]'));
    var ids = links.map(function (a) { return a.getAttribute('href').slice(1); })
      .filter(function (id) { return document.getElementById(id); });
    if (ids.length < 2) return;
    var PREVIEW = ids.indexOf('preview') !== -1 ? 'preview' : '';
    var current = ids[0] === PREVIEW ? ids[1] : ids[0];
    var shown = current; // the form section on show (the preview tab keeps the last one)

    function paint(id) {
      var narrow = window.matchMedia(NARROW).matches;
      if (id !== PREVIEW) shown = id;
      ids.forEach(function (sid) {
        var el = document.getElementById(sid);
        if (sid === PREVIEW) {
          el.classList.toggle('st-hide', narrow && id !== PREVIEW);
        } else {
          el.classList.toggle('st-hide', narrow && id === PREVIEW ? true : sid !== shown);
        }
      });
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('st-on', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      current = id;
    }

    function go(id, scroll) {
      paint(id);
      if (id === PREVIEW && !window.matchMedia(NARROW).matches) {
        document.getElementById(PREVIEW).scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (scroll) {
        var top = bar.getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }

    // Any link to a section (the tabs, or "Add photos" in a welcome banner).
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (ids.indexOf(id) === -1) return;
      e.preventDefault();
      go(id, true);
      try { history.replaceState(null, '', '#' + id); } catch (err) {}
    });
    // A message shown inside a hidden section: open that section.
    document.addEventListener('invalid', function (e) {
      var sec = e.target.closest && e.target.closest('.st-hide');
      if (sec && sec.id) go(sec.id, false);
    }, true);
    window.matchMedia(NARROW).addEventListener('change', function () { paint(current); });

    // Open the tab named in the address (#photos), or the tab holding that
    // spot (a save returns to #colours, which sits inside #preview).
    var start = (location.hash || '').slice(1), target = current;
    if (ids.indexOf(start) !== -1) target = start;
    else if (start) {
      var el = document.getElementById(start);
      ids.forEach(function (sid) { var sec = document.getElementById(sid); if (el && sec.contains(el)) target = sid; });
    }
    paint(target);
    document.documentElement.classList.add('st-ready');
  }

  var css = document.createElement('style');
  css.textContent =
    '.st-hide{display:none!important}' +
    '[data-section-tabs]{position:sticky;top:var(--st-top,66px);z-index:40;background:#faf6ee;padding:10px 0;margin-top:-10px;flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none}' +
    '[data-section-tabs]::-webkit-scrollbar{display:none}' +
    '[data-section-tabs] a{flex:none}' +
    '[data-section-tabs] a.st-on{background:#2f5d45!important;border-color:#2f5d45!important;color:#fff!important}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 0); });
  else setTimeout(start, 0);
})();
