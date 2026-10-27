import * as store from '../store.js';
import { PROGRAMS } from '../data/programs.js';
import { icon, hydrateFigures, destroyFigures } from '../ui.js';

export function renderOnboarding(root, _params, { navigate }) {
  const draft = { program: 'ul4', level: 'intermediate', units: 'kg', inc: 2 };
  let step = 0;

  const steps = [
    () => `
      <div class="ob-hero">
        <div class="ob-fig" data-fig="incline_curl"></div>
      </div>
      <h1 class="ob-title">Build muscle with a bench and dumbbells</h1>
      <p class="muted ob-lead">An evidence-based hypertrophy program that tells you exactly what to lift today — and how to beat last time.</p>
      <ul class="ob-points">
        <li>${icon('science')}<span><b>Science-based plan</b> — 10–20 weekly sets per muscle, each trained twice a week.</span></li>
        <li>${icon('bolt')}<span><b>Automatic progression</b> — weight and rep targets every session.</span></li>
        <li>${icon('progress')}<span><b>Track progress</b> — strength trends, weekly volume, personal records.</span></li>
      </ul>`,
    () => `
      <p class="eyebrow">Step 1 of 2</p>
      <h1 class="ob-title">How many days a week can you train?</h1>
      <div class="choice-list" role="radiogroup" aria-label="Training days">
        ${PROGRAMS.map((p) => `
          <button class="choice ${draft.program === p.id ? 'on' : ''}" role="radio" aria-checked="${draft.program === p.id}" data-prog="${p.id}">
            <span class="choice-big">${p.days}</span>
            <span class="choice-txt"><b>${p.name}${p.recommended ? ' <em class="pill">Recommended</em>' : ''}</b><small>${p.description}</small></span>
          </button>`).join('')}
      </div>`,
    () => `
      <p class="eyebrow">Step 2 of 2</p>
      <h1 class="ob-title">A little about you</h1>
      <h3 class="label">Lifting experience</h3>
      <div class="seg" role="radiogroup" aria-label="Experience">
        <button role="radio" aria-checked="${draft.level === 'beginner'}" class="${draft.level === 'beginner' ? 'on' : ''}" data-level="beginner">Under 1 year</button>
        <button role="radio" aria-checked="${draft.level === 'intermediate'}" class="${draft.level === 'intermediate' ? 'on' : ''}" data-level="intermediate">1 year +</button>
      </div>
      <p class="hint">Beginners start with slightly fewer sets — you grow fast on less.</p>
      <h3 class="label">Units</h3>
      <div class="seg" role="radiogroup" aria-label="Units">
        <button role="radio" aria-checked="${draft.units === 'kg'}" class="${draft.units === 'kg' ? 'on' : ''}" data-units="kg">Kilograms</button>
        <button role="radio" aria-checked="${draft.units === 'lb'}" class="${draft.units === 'lb' ? 'on' : ''}" data-units="lb">Pounds</button>
      </div>
      <h3 class="label">Smallest dumbbell jump</h3>
      <div class="seg" role="radiogroup" aria-label="Weight increment">
        ${(draft.units === 'kg' ? [1, 2, 2.5] : [2.5, 5]).map((v) => `<button role="radio" aria-checked="${draft.inc === v}" class="${draft.inc === v ? 'on' : ''}" data-inc="${v}">${v} ${draft.units}</button>`).join('')}
      </div>
      <p class="hint">Used when the app tells you to go heavier. Check your dumbbell set.</p>`,
  ];

  const draw = () => {
    destroyFigures(root);
    root.innerHTML = `<div class="onboarding">
      <div class="ob-progress">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="ob-body">${steps[step]()}</div>
      <div class="ob-actions">
        ${step > 0 ? `<button class="btn ghost" data-back>${icon('left')}Back</button>` : '<span></span>'}
        <button class="btn primary lg" data-next>${step === steps.length - 1 ? "Let's train" : 'Continue'}${icon('right')}</button>
      </div>
    </div>`;
    hydrateFigures(root);
  };

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.prog) draft.program = b.dataset.prog;
    if (b.dataset.level) draft.level = b.dataset.level;
    if (b.dataset.units) { draft.units = b.dataset.units; draft.inc = draft.units === 'kg' ? 2 : 5; }
    if (b.dataset.inc) draft.inc = +b.dataset.inc;
    if (b.hasAttribute('data-back')) step--;
    if (b.hasAttribute('data-next')) {
      if (step < steps.length - 1) step++;
      else {
        store.update((s) => {
          s.onboarded = true;
          s.settings.level = draft.level;
          s.settings.units = draft.units;
          s.settings.incKg = draft.units === 'lb' ? draft.inc * 0.45359237 : draft.inc;
          s.program = { id: draft.program, meso: 1, done: 0, startedAt: new Date().toISOString() };
        });
        navigate('#/today');
        return;
      }
    }
    draw();
  });
  draw();
}
