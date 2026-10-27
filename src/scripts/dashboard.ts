// Client behaviour shared by the sitter and owner dashboards:
// tab switching, copy share link, navigation loader, unread-message badge + toasts.
// Hooks: [data-tab], [data-panel], [data-share], [data-copy],
// [data-loader], [data-msg-badge], [data-msg-toasts].

function initTabs() {
  const tabBtns = Array.from(document.querySelectorAll<HTMLElement>('[data-tab]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
  const setTab = (id: string) => {
    tabBtns.forEach((b) => {
      const on = b.dataset.tab === id;
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    panels.forEach((p) => {
      const key = p.dataset.panel;
      p.style.display = key === id ? (key === 'dashboard' ? 'flex' : 'block') : 'none';
    });
  };
  // Messages and Profile open the real pages (the inbox and the profile
  // editor) rather than a placeholder panel.
  const isOwner = location.pathname.startsWith('/owner');
  const goTo: Record<string, string> = {
    messages: '/messages',
    profile: isOwner ? '/owner/profile/edit' : '/profile/edit',
  };
  // ?tab=sits (from the shared header on other pages) opens that panel.
  const fromUrl = new URLSearchParams(location.search).get('tab');
  if (fromUrl && fromUrl !== 'messages' && fromUrl !== 'profile' && panels.some((p) => p.dataset.panel === fromUrl)) setTab(fromUrl);
  tabBtns.forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.tab!;
      if (goTo[id]) {
        setTab(id);
        document.querySelector<HTMLElement>('[data-loader]')?.style.setProperty('opacity', '1');
        window.location.href = goTo[id];
        return;
      }
      setTab(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }),
  );
}

function initCopy() {
  const btn = document.querySelector<HTMLElement>('[data-copy]');
  let t: ReturnType<typeof setTimeout>;
  btn?.addEventListener('click', () => {
    const input = document.querySelector<HTMLInputElement>('[data-share]');
    if (input) {
      input.select();
      navigator.clipboard?.writeText(input.value);
    }
    btn.textContent = 'Copied!';
    clearTimeout(t);
    t = setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  });
}

function initLoader() {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  let hideT: ReturnType<typeof setTimeout>;
  const show = () => {
    if (!loader) return;
    loader.style.opacity = '1';
    loader.style.pointerEvents = 'all';
    clearTimeout(hideT);
    hideT = setTimeout(() => { loader.style.opacity = '0'; loader.style.pointerEvents = 'none'; }, 1600);
  };
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
    a.addEventListener('click', (e) => {
      const m = e as MouseEvent;
      if (m.metaKey || m.ctrlKey || m.shiftKey) return;
      show();
    });
  });
}

function initUnread() {
  const seen = new Set<string>();
  let first = true;
  const esc = (s: string) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  const ping = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };
  const toast = (m: any) => {
    const box = document.querySelector('[data-msg-toasts]');
    if (!box) return;
    const s = m.sender || {};
    const av = s.profile_pic
      ? '<img src="' + esc(s.profile_pic) + '" class="msg-toast-avatar" />'
      : '<div class="msg-toast-avatar-ph">' + esc((s.name || '?').charAt(0).toUpperCase()) + '</div>';
    const t = document.createElement('a');
    t.href = '/messages/' + m.conversation_id;
    t.className = 'msg-toast';
    t.innerHTML = av + '<div class="msg-toast-body"><div class="msg-toast-name">' + esc(s.name || 'Someone') +
      '</div><div class="msg-toast-preview">' + esc((m.body || '').slice(0, 80)) + '</div></div>';
    box.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, 5000);
  };
  const badge = (n: number) => {
    const el = document.querySelector<HTMLElement>('[data-msg-badge]');
    if (!el) return;
    if (n > 0) { el.textContent = n > 99 ? '99+' : String(n); el.style.display = 'inline-flex'; }
    else el.style.display = 'none';
  };
  const check = async () => {
    try {
      const res = await fetch('/api/messages/unread');
      const data = await res.json();
      badge(data.count || 0);
      if (data.messages) {
        if (!first) {
          const fresh = data.messages.filter((m: any) => !seen.has(m.id));
          if (fresh.length) { ping(); fresh.slice(0, 3).forEach(toast); }
        }
        data.messages.forEach((m: any) => seen.add(m.id));
      }
      first = false;
    } catch {}
  };
  check();
  setInterval(check, 8000);
}

export function initDashboard() {
  initTabs();
  initCopy();
  initLoader();
  initUnread();
}
