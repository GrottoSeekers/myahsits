// Phone "jump to" bar for long public pages (owner pages, sit pages).
// Markup: <nav data-page-dock data-items="about:About,pets:Pets,contact:Get in touch*"></nav>
// Each item is sectionId:Label; a trailing * marks the main button. Items whose
// section is not on the page are left out. The bar shows on screens up to
// 1000px wide, once the visitor has scrolled past the top of the page.
(function () {
  var nav = document.querySelector('[data-page-dock]');
  if (!nav) return;
  var items = (nav.getAttribute('data-items') || '').split(',').map(function (s) {
    var i = s.indexOf(':'); var label = s.slice(i + 1).trim(); var main = /\*$/.test(label);
    return { id: s.slice(0, i).trim(), label: main ? label.slice(0, -1) : label, main: main };
  }).filter(function (it) { return it.id && document.getElementById(it.id); });
  if (items.length < 2) return;
  nav.setAttribute('aria-label', 'On this page');
  nav.innerHTML = items.map(function (it) {
    return '<a href="#' + it.id + '"' + (it.main ? ' class="pd-main"' : '') + '>' + it.label.replace(/</g, '&lt;') + '</a>';
  }).join('');

  var css = document.createElement('style');
  css.textContent =
    '[data-page-dock]{display:none}' +
    '@media (max-width:1000px){' +
    '[data-page-dock]{display:flex;position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:205;gap:4px;padding:6px;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border:1px solid rgba(110,84,56,.22);border-radius:50px;box-shadow:0 12px 32px rgba(44,26,14,.18);transform:translateY(140%);transition:transform .3s ease}' +
    '[data-page-dock].on{transform:none}' +
    '[data-page-dock] a{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;padding:0 6px;border-radius:50px;font-family:Montserrat,sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:#5c3d20;text-decoration:none;white-space:nowrap}' +
    '[data-page-dock] a.pd-main{flex:1.4;background:#2f5d45;color:#fff}' +
    'body{padding-bottom:84px}}' +
    '';
  document.head.appendChild(css);

  var tick = function () { nav.classList.toggle('on', window.scrollY > 360); };
  window.addEventListener('scroll', tick, { passive: true });
  tick();
})();
