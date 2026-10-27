import { EXERCISES } from '../data/exercises.js';
import { esc, icon, hydrateFigures, destroyFigures } from '../ui.js';
import { openExercise, muscleChips } from './shared.js';

const GROUPS = [
  ['all', 'All', null],
  ['chest', 'Chest', ['chest']],
  ['back', 'Back', ['lats', 'upper_back', 'traps']],
  ['shoulders', 'Shoulders', ['front_delts', 'side_delts', 'rear_delts']],
  ['arms', 'Arms', ['biceps', 'triceps', 'forearms']],
  ['legs', 'Legs', ['quads', 'glutes', 'hamstrings', 'calves']],
  ['core', 'Core', ['abs', 'lower_back']],
];

export function renderLibrary(root) {
  let group = 'all';
  let q = '';
  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <div><p class="eyebrow">${EXERCISES.length} exercises · bench + dumbbells</p><h1>Exercises</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>
      </header>
      <label class="search"><span class="sr">Search exercises</span>
        <input type="search" class="input" placeholder="Search exercises or muscles" autocomplete="off"></label>
      <div class="chips scroll" role="tablist" aria-label="Muscle group">
        ${GROUPS.map(([id, label]) => `<button role="tab" class="chip-btn ${id === group ? 'on' : ''}" data-g="${id}">${label}</button>`).join('')}
      </div>
      <div class="lib-grid"></div>
    </div>`;
  const grid = root.querySelector('.lib-grid');
  const paint = () => {
    destroyFigures(grid);
    const muscles = GROUPS.find((g) => g[0] === group)[2];
    const ql = q.toLowerCase();
    const list = EXERCISES.filter((e) =>
      (!muscles || e.primary.some((m) => muscles.includes(m))) &&
      (!ql || e.name.toLowerCase().includes(ql) || [...e.primary, ...e.secondary].some((m) => m.replace('_', ' ').includes(ql))));
    grid.innerHTML = list.length ? list.map((e) => `
      <button class="lib-card" data-ex="${e.id}">
        <span class="lib-fig" data-fig="${e.id}" data-mode="static"></span>
        <span class="lib-txt"><b>${esc(e.name)}</b><span class="chips">${muscleChips(e, 2)}</span></span>
      </button>`).join('') : '<p class="muted center">No exercises match.</p>';
    hydrateFigures(grid);
  };
  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-g]');
    if (g) { group = g.dataset.g; root.querySelectorAll('[data-g]').forEach((x) => x.classList.toggle('on', x === g)); paint(); return; }
    const c = e.target.closest('[data-ex]');
    if (c) openExercise(c.dataset.ex);
  });
  root.querySelector('input[type=search]').addEventListener('input', (e) => { q = e.target.value.trim(); paint(); });
  paint();
}
