// Dashboards: cards fade up as they come into view, numbers count up, and the
// live preview is scaled to fit its frame.
(() => {
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const els = qa('.dg-card, .db-card, .dp, .db-next, [data-rv]');
  els.forEach((el) => el.classList.add('rv'));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.filter((e) => e.isIntersecting).forEach((e, i) => { e.target.style.setProperty('--d', Math.min(i * 0.07, 0.5) + 's'); e.target.classList.add('in'); io.unobserve(e.target); });
  }, { threshold: 0.1 }) : null;
  els.forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  // count up the first time a number is seen
  qa('[data-count]').forEach((b) => {
    const m = /^(\d+(?:\.\d+)?)(.*)$/.exec(b.dataset.count || '');
    if (!m || !('IntersectionObserver' in window)) return;
    const o = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      const end = parseFloat(m[1]), dp = (m[1].split('.')[1] || '').length; let t0 = null;
      const step = (now) => { if (t0 === null) t0 = now; const k = Math.min(1, Math.max(0, (now - t0) / 1300)), e = 1 - Math.pow(1 - k, 3); b.textContent = (end * e).toFixed(dp) + m[2]; if (k < 1) requestAnimationFrame(step); };
      setTimeout(() => { b.textContent = b.dataset.count; }, 1600);
      requestAnimationFrame(step);
    });
    o.observe(b);
  });
  // fit the laptop preview to its frame
  const fit = () => qa('.dp-laptop .dp-screen').forEach((s) => s.style.setProperty('--k', String(s.clientWidth / 1280)));
  fit(); window.addEventListener('resize', fit);
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-tab]')) setTimeout(fit, 50); });
})();
