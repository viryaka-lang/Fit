// App state persisted in localStorage. Weights are always stored in kg.
const KEY = 'hypertrophy.v1';

const DEFAULTS = () => ({
  v: 1,
  onboarded: false,
  settings: { units: 'kg', incKg: 2, level: 'intermediate', theme: 'auto', sound: true, vibrate: true, autoRest: true },
  program: { id: 'ul4', meso: 1, done: 0, startedAt: new Date().toISOString() },
  swaps: {},
  sessions: [],
  active: null,
  bodyweight: [],
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const s = JSON.parse(raw);
    const d = DEFAULTS();
    return { ...d, ...s, settings: { ...d.settings, ...s.settings }, program: { ...d.program, ...s.program } };
  } catch {
    return DEFAULTS();
  }
}

export const get = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save', e);
  }
  listeners.forEach((fn) => fn(state));
}

export function update(fn) {
  fn(state);
  save();
}

export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export function exportJSON() {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importJSON(text) {
  const s = JSON.parse(text);
  if (!s || !Array.isArray(s.sessions) || !s.settings) throw new Error('Not a valid backup file');
  const d = DEFAULTS();
  state = { ...d, ...s, settings: { ...d.settings, ...s.settings }, program: { ...d.program, ...s.program }, onboarded: true };
  delete state.exportedAt;
  save();
}

export function reset() {
  state = DEFAULTS();
  save();
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
