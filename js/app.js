import * as store from './store.js';
import { icon, destroyFigures, hydrateFigures } from './ui.js';
import { renderToday } from './views/today.js';
import { renderPlan } from './views/plan.js';
import { renderProgress } from './views/progress.js';
import { renderLibrary } from './views/library.js';
import { renderWorkout } from './views/workout.js';
import { renderSettings } from './views/settings.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderSession } from './views/session.js';

const ROUTES = {
  today: renderToday,
  plan: renderPlan,
  progress: renderProgress,
  library: renderLibrary,
  workout: renderWorkout,
  settings: renderSettings,
  session: renderSession,
};

const view = document.getElementById('view');
let cleanup = null;
let current = '';

document.querySelectorAll('.tabbar [data-tab]').forEach((a) => {
  const name = { today: 'today', plan: 'plan', progress: 'progress', library: 'library' }[a.dataset.tab];
  a.querySelector('.tab-ic').innerHTML = icon(name);
});

export function navigate(hash, { replace = false } = {}) {
  if (location.hash === hash) return route();
  if (replace) history.replaceState(null, '', hash);
  else location.hash = hash;
  if (replace) route();
}

export function refresh() { route({ keepScroll: true }); }

function route({ keepScroll = false } = {}) {
  const st = store.get();
  let [name, ...params] = (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  if (!st.onboarded) name = 'onboarding';
  else if (!ROUTES[name]) name = 'today';
  if (name === 'workout' && !st.active) name = 'today';

  const scrollY = window.scrollY;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  destroyFigures(view);
  view.innerHTML = '';
  const sameView = current === name;
  current = name;
  document.body.dataset.view = name;
  document.querySelectorAll('.tabbar [data-tab]').forEach((a) => {
    const on = a.dataset.tab === name;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const fn = name === 'onboarding' ? renderOnboarding : ROUTES[name];
  // fresh container per route so listeners attached by a view die with it
  const root = document.createElement('div');
  view.appendChild(root);
  cleanup = fn(root, params, { navigate, refresh, install, applyTheme }) || null;
  hydrateFigures(root);
  window.scrollTo(0, keepScroll && sameView ? scrollY : 0);
}

window.addEventListener('hashchange', () => route());

// theme
export function applyTheme() {
  const t = store.get().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
applyTheme();

// install prompt
export const install = { prompt: null };
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  install.prompt = e;
  if (current === 'today' || current === 'settings') refresh();
});
window.addEventListener('appinstalled', () => { install.prompt = null; });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
  });
}
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

route();
