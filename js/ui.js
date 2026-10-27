import { mountFigure } from './figure.js';
import { EX } from './data/exercises.js';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const P = {
  today: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  plan: '<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4"/>',
  progress: '<path d="M4 19.5h16"/><path d="M5 15l4.5-5 3.5 3 6-7"/><path d="M15 6h4v4"/>',
  library: '<path d="M5 4.5h4v15H5zM10.5 4.5h4v15h-4z"/><path d="M16 5.5l3.5-1 3 14-3.5 1z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  swap: '<path d="M7 4L3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  down: '<path d="M5 9l7 7 7-7"/>',
  trophy: '<path d="M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H4.5a3 3 0 0 0 3.5 4M16 6.5h3.5a3 3 0 0 1-3.5 4M12 13.5v4M8.5 20.5h7M9.5 17.5h5v3h-5z"/>',
  flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.6 2.7-5.6 3.8-8.8.6 2 1.8 3 2.7 3.4.4-2.6 1.6-4.8 3.5-6.4-.3 3 1 5.2 2.4 7.2 1 1.4 1.6 2.9 1.6 4.6 0 3.6-2.5 6.2-7.5 6.2z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15"/>',
  upload: '<path d="M12 15.5v-11M7 9l5-5 5 5M4.5 19.5h15"/>',
  more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  skip: '<path d="M6 5l9 7-9 7zM18 5v14"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0L13 11.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  bolt: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
  science: '<path d="M9.5 3.5h5M10.5 3.5v6l-5.2 8.6a1.6 1.6 0 0 0 1.4 2.4h10.6a1.6 1.6 0 0 0 1.4-2.4l-5.2-8.6v-6M7.5 14.5h9"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  layers: '<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M3.5 12L12 16.5 20.5 12M3.5 16L12 20.5 20.5 16"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

// ------------------------------------------------------------- figures
const mounted = new WeakMap();
export function hydrateFigures(root) {
  root.querySelectorAll('[data-fig]').forEach((node) => {
    if (mounted.has(node)) return;
    const ex = EX[node.dataset.fig];
    if (!ex) return;
    mounted.set(node, mountFigure(node, ex, { mode: node.dataset.mode || 'animate' }));
  });
}
export function destroyFigures(root) {
  root.querySelectorAll('[data-fig]').forEach((node) => {
    const m = mounted.get(node);
    if (m) { m.destroy(); mounted.delete(node); }
  });
}

// --------------------------------------------------------------- toast
let toastTimer;
export function toast(msg, { icon: ic = 'check' } = {}) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }
  t.innerHTML = `${icon(ic)}<span></span>`;
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// --------------------------------------------------------------- sheet
let openSheets = [];
export function sheet(html, { onClose, className = '', onMount } = {}) {
  const wrap = document.createElement('div');
  wrap.className = `sheet-wrap ${className}`;
  wrap.innerHTML = `<div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grip" data-close aria-hidden="true"></div>
      <button class="icon-btn sheet-x" data-close aria-label="Close">${icon('x')}</button>
      <div class="sheet-body">${html}</div>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('no-scroll');
  const api = {
    el: wrap.querySelector('.sheet-body'),
    close() {
      if (!wrap.isConnected) return;
      wrap.classList.remove('open');
      destroyFigures(wrap);
      openSheets = openSheets.filter((s) => s !== api);
      if (!openSheets.length) document.body.classList.remove('no-scroll');
      setTimeout(() => wrap.remove(), 260);
      document.removeEventListener('keydown', onKey);
      onClose && onClose();
    },
  };
  const onKey = (e) => { if (e.key === 'Escape' && openSheets[openSheets.length - 1] === api) api.close(); };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });
  // swipe down on the grip to dismiss
  const sh = wrap.querySelector('.sheet');
  let y0 = null;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    const dy = e.touches[0].clientY - y0;
    if (dy > 0) sh.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sh.addEventListener('touchend', (e) => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0;
    sh.style.transform = '';
    y0 = null;
    if (dy > 110) api.close();
  });
  openSheets.push(api);
  requestAnimationFrame(() => wrap.classList.add('open'));
  hydrateFigures(wrap);
  onMount && onMount(api);
  setTimeout(() => wrap.querySelector('.sheet-x')?.focus({ preventScroll: true }), 50);
  return api;
}

export function confirmDialog(title, body, { ok = 'Confirm', danger = false } = {}) {
  return new Promise((resolve) => {
    let result = false;
    const s = sheet(`<h2 class="sheet-title">${esc(title)}</h2><p class="muted">${esc(body)}</p>
      <div class="row gap mt">
        <button class="btn ghost grow" data-close>Cancel</button>
        <button class="btn ${danger ? 'danger' : 'primary'} grow" data-ok>${esc(ok)}</button>
      </div>`, { className: 'compact', onClose: () => resolve(result) });
    s.el.querySelector('[data-ok]').addEventListener('click', () => { result = true; s.close(); });
  });
}

export function haptic(pattern = 12) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* unsupported */ }
}

export const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString(undefined, opts);

export const fmtTime = (sec) => {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};

export const fmtNum = (n) =>
  n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : Math.round(n).toLocaleString();

export function relDay(d) {
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  const n = Math.round((b - a) / 864e5);
  if (n === 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return `${n} days ago`;
  return fmtDate(d);
}
