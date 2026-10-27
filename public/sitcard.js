// Sit cards shared by Browse sits and Saved (see sitcard.css).
// window.sitCard(sit, saved) -> HTML; window.sitCardWire(root) wires photos and hearts.
(function () {
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
  window.sitCard = function (s, saved, i) {
    var pics = (s.photos && s.photos.length ? s.photos : []).slice(0, 5);
    var track = pics.length
      ? '<div class="sc-track">' + pics.map(function (p, k) { return '<img src="' + esc(p) + '" alt="" loading="' + (k ? 'lazy' : 'eager') + '" />'; }).join('') + '</div>'
      : '<div class="sc-noimg">' + esc((s.owner || 'M').charAt(0)) + '</div>';
    return '<a href="/listings/' + esc(s.id) + '" class="sc" style="animation-delay:' + Math.min(i || 0, 8) * 40 + 'ms">' +
      '<div class="sc-pics">' + track +
        (s.badge ? '<span class="sc-badge">' + esc(s.badge) + '</span>' : '') +
        (s.canSave ? '<button type="button" class="sc-heart" data-heart="' + esc(s.id) + '" aria-pressed="' + (saved ? 'true' : 'false') + '" aria-label="Save this sit">' + HEART + '</button>' : '') +
        (pics.length > 1 ? '<button type="button" class="sc-nav l" data-nav="-1" aria-label="Previous photo">&#8249;</button><button type="button" class="sc-nav r" data-nav="1" aria-label="Next photo">&#8250;</button><div class="sc-dots">' + pics.map(function (_, k) { return '<i' + (k ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '') +
        (s.pic ? '<img class="sc-host" src="' + esc(s.pic) + '" alt="" />' : '') +
      '</div>' +
      '<div class="sc-body">' +
        '<div class="sc-top"><span>' + esc(s.location || 'Somewhere lovely') + '</span><span>' + (s.rating ? '★ ' + esc(s.rating) : esc(s.nights)) + '</span></div>' +
        '<p class="sc-title">' + esc(s.title) + '</p>' +
        (s.petLine ? '<span class="sc-line">' + esc(s.petLine) + '</span>' : '') +
        '<span class="sc-when"><b>' + esc(s.short) + '</b> · ' + esc(s.nights) + '</span>' +
      '</div></a>';
  };
  window.sitCardWire = function (root) {
    root.querySelectorAll('.sc').forEach(function (card) {
      var track = card.querySelector('.sc-track');
      var dots = card.querySelectorAll('.sc-dots i');
      if (track && dots.length) {
        track.addEventListener('scroll', function () {
          var k = Math.round(track.scrollLeft / track.clientWidth);
          dots.forEach(function (d, n) { d.classList.toggle('on', n === k); });
        }, { passive: true });
      }
      card.querySelectorAll('[data-nav]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          track.scrollBy({ left: track.clientWidth * Number(b.getAttribute('data-nav')), behavior: 'smooth' });
        });
      });
      var h = card.querySelector('[data-heart]');
      if (h) h.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var on = h.getAttribute('aria-pressed') !== 'true';
        h.setAttribute('aria-pressed', String(on));
        h.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300 });
        fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: on ? 'save' : 'unsave', listing_id: h.getAttribute('data-heart') }) })
          .then(function (r) { if (!r.ok) h.setAttribute('aria-pressed', String(!on)); })
          .catch(function () { h.setAttribute('aria-pressed', String(!on)); });
        document.dispatchEvent(new CustomEvent('sitcard:saved', { detail: { id: h.getAttribute('data-heart'), on: on } }));
      });
    });
  };
})();
