import * as store from '../store.js';
import { EX, MUSCLES, alternatives } from '../data/exercises.js';
import { exerciseHistory, fmtW, fromKg } from '../engine.js';
import { muscleMap } from '../musclemap.js';
import { lineChart } from '../charts.js';
import { esc, icon, sheet, fmtDate, hydrateFigures, destroyFigures } from '../ui.js';

export const muscleChips = (ex, max = 99) =>
  [...ex.primary.map((m) => `<span class="chip pri">${MUSCLES[m]}</span>`), ...ex.secondary.map((m) => `<span class="chip">${MUSCLES[m]}</span>`)]
    .slice(0, max).join('');

export const repStr = (r) => `${r[0]}–${r[1]}`;
export const restStr = (sec) => (sec >= 120 ? `${+(sec / 60).toFixed(1)} min` : `${sec} s`);

function exerciseHTML(ex) {
  const st = store.get();
  const u = st.settings.units;
  const hist = exerciseHistory(st.sessions, ex.id);
  const alts = alternatives(ex.id).slice(0, 6);
  const bw = ex.bodyweight;
  return `
    <div class="ex-hero" data-fig="${ex.id}"></div>
    <div class="ex-head">
      <h2 class="sheet-title">${esc(ex.name)}</h2>
      <div class="chips">${muscleChips(ex)}</div>
      <div class="ex-meta">
        <span>${icon('layers')}${ex.type === 'compound' ? 'Compound' : 'Isolation'}</span>
        <span>${icon('timer')}Rest ${restStr(ex.rest)}</span>
        <span>${icon('bolt')}${repStr(ex.reps)} reps</span>
        ${ex.unilateral ? `<span>${icon('swap')}Each side</span>` : ''}
      </div>
    </div>
    <div class="tempo-note">${icon('clock')}<span>Animation shows the tempo: <b>1 s up</b>, brief pause, <b>2 s down</b>.</span></div>
    <section class="sec">
      <h3 class="label">How to</h3>
      <ol class="cues">${ex.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
    </section>
    <section class="sec">
      <h3 class="label">Avoid</h3>
      <ul class="avoid">${ex.mistakes.map((c) => `<li>${icon('x')}<span>${esc(c)}</span></li>`).join('')}</ul>
    </section>
    <section class="sec grid-2">
      <div>
        <h3 class="label">Muscles worked</h3>
        ${muscleMap({ primary: ex.primary, secondary: ex.secondary })}
        <div class="legend"><span><i class="sw pri"></i>Primary</span><span><i class="sw sec"></i>Secondary</span></div>
      </div>
      <div>
        <h3 class="label">Why it's in the plan</h3>
        <p class="why">${esc(ex.why)}</p>
      </div>
    </section>
    ${hist.length ? `
    <section class="sec">
      <h3 class="label">${bw ? 'Best reps' : 'Estimated 1-rep max'} <small class="muted">· ${hist.length} session${hist.length > 1 ? 's' : ''}</small></h3>
      ${hist.length > 1 ? '<div class="ex-chart"></div>' : ''}
      <div class="hist-rows">
        ${hist.slice(-5).reverse().map((h) => `
          <div class="hist-row"><span class="muted">${fmtDate(h.date)}</span>
          <span>${bw && !h.top.w ? '' : `${fmtW(h.top.w, u)} ${u} × `}${h.top.r}</span>
          <span class="muted">${h.sets} sets</span></div>`).join('')}
      </div>
    </section>` : ''}
    ${alts.length ? `
    <section class="sec">
      <h3 class="label">Alternatives</h3>
      <div class="alt-row">${alts.map((a) => `
        <button class="alt" data-open-ex="${a.id}">
          <span class="alt-fig" data-fig="${a.id}" data-mode="static"></span>
          <span>${esc(a.name)}</span>
        </button>`).join('')}</div>
    </section>` : ''}`;
}

export function openExercise(exId) {
  let chart = null;
  const fill = (s, id) => {
    chart && chart.destroy();
    destroyFigures(s.el);
    const ex = EX[id];
    s.el.innerHTML = exerciseHTML(ex);
    hydrateFigures(s.el);
    const c = s.el.querySelector('.ex-chart');
    if (c) {
      const st = store.get();
      const u = st.settings.units;
      const hist = exerciseHistory(st.sessions, id);
      const bw = ex.bodyweight && hist.every((h) => !h.top.w);
      chart = lineChart(c, hist.map((h) => ({
        x: h.date, y: bw ? h.top.r : fromKg(h.e1rm, u), label: bw ? '' : `${fmtW(h.top.w, u)}×${h.top.r}`,
      })), { format: (v) => (bw ? `${Math.round(v)}` : `${Math.round(v * 10) / 10}`), unit: bw ? 'reps' : u, label: `${ex.name} progress` });
    }
    s.el.parentElement.scrollTop = 0;
  };
  const s = sheet('', { className: 'tall', onClose: () => chart && chart.destroy() });
  fill(s, exId);
  s.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-ex]');
    if (b) fill(s, b.dataset.openEx);
  });
  return s;
}

/** Pick an alternative exercise. Resolves to { exId, remember } or null. */
export function pickAlternative(exId, { rememberOption = false, title = 'Swap exercise' } = {}) {
  return new Promise((resolve) => {
    let result = null;
    const ex = EX[exId];
    const alts = alternatives(exId);
    const s = sheet(`
      <h2 class="sheet-title">${esc(title)}</h2>
      <p class="muted">Replacing <b>${esc(ex.name)}</b>. These train the same muscles.</p>
      ${rememberOption ? `<label class="switch-row"><span>Use this swap in my plan from now on</span><input type="checkbox" class="switch" data-remember checked></label>` : ''}
      <div class="pick-list">${alts.map((a) => `
        <button class="pick" data-pick="${a.id}">
          <span class="pick-fig" data-fig="${a.id}" data-mode="static"></span>
          <span class="pick-txt"><b>${esc(a.name)}</b><span class="chips">${muscleChips(a, 3)}</span></span>
          ${icon('right')}
        </button>`).join('')}</div>`, { onClose: () => resolve(result) });
    s.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      result = { exId: b.dataset.pick, remember: !!s.el.querySelector('[data-remember]')?.checked };
      s.close();
    });
  });
}
