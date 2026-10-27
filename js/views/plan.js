import * as store from '../store.js';
import { EX, MUSCLES, TRACKED } from '../data/exercises.js';
import { PROGRAMS, PROGRAM, MESO, SCIENCE } from '../data/programs.js';
import { position, planWorkout, estimateMinutes, plannedWeeklySets, slotKey } from '../engine.js';
import { esc, icon, toast, confirmDialog } from '../ui.js';
import { openExercise, pickAlternative, repStr } from './shared.js';

export function volumeBars(values, { max = 24, band = [10, 20], showBand = true, fmt = (v) => +v.toFixed(1) } = {}) {
  const pct = (v) => `${Math.min(100, (v / max) * 100).toFixed(1)}%`;
  return `<div class="vbars" role="table" aria-label="Weekly sets per muscle">
    ${TRACKED.map((m) => {
      const v = values[m] || 0;
      const status = v >= band[0] && v <= band[1] ? 'in' : v > band[1] ? 'over' : 'under';
      return `<div class="vbar" role="row">
        <span class="vbar-l" role="rowheader">${MUSCLES[m]}</span>
        <span class="vbar-t" role="cell" title="${MUSCLES[m]}: ${fmt(v)} sets">
          ${showBand ? `<i class="vbar-band" style="left:${pct(band[0])};width:calc(${pct(band[1])} - ${pct(band[0])})"></i>` : ''}
          <i class="vbar-f ${status}" style="width:${pct(v)}"></i>
        </span>
        <span class="vbar-v" role="cell">${fmt(v)}</span>
      </div>`;
    }).join('')}
  </div>`;
}

export function renderPlan(root, _p, { refresh }) {
  const st = store.get();
  const pos = position(st);
  const prog = pos.program;
  const vol = plannedWeeklySets(prog.id, Math.min(pos.week, 4), st.settings.level, st.swaps);

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <div><p class="eyebrow">Your program</p><h1>${esc(prog.name)}</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>
      </header>

      <div class="seg wide" role="radiogroup" aria-label="Days per week">
        ${PROGRAMS.map((p) => `<button role="radio" aria-checked="${p.id === prog.id}" class="${p.id === prog.id ? 'on' : ''}" data-prog="${p.id}"><b>${p.days} days</b><small>${p.name}</small></button>`).join('')}
      </div>
      <p class="muted small mt-s">${esc(prog.description)} <span class="faint">${esc(prog.schedule)}.</span></p>

      <section class="card">
        <div class="card-head"><h3>5-week training block</h3><span class="pill">Week ${pos.week}</span></div>
        <ol class="timeline">
          ${MESO.map((m) => `<li class="${m.week === pos.week ? 'cur' : ''} ${m.week < pos.week ? 'past' : ''}">
            <span class="tl-dot"></span>
            <div><b>Week ${m.week} · ${m.label}</b> <span class="chip ${m.deload ? '' : 'pri'}">RIR ${m.rir}</span>
            <p class="muted small">${esc(m.note)}</p></div></li>`).join('')}
        </ol>
      </section>

      <h2 class="section-title">Workouts</h2>
      ${prog.workouts.map((w, wi) => {
        const plan = planWorkout(prog.id, w.id, pos.week, st.settings.level, st.swaps);
        return `
        <details class="card wcard" ${wi === pos.day ? 'open' : ''}>
          <summary>
            <span class="wcard-n">${wi + 1}</span>
            <span class="grow"><b>${esc(w.name)}${wi === pos.day ? ' <em class="pill">Next</em>' : ''}</b><small class="muted">${esc(w.focus)}</small></span>
            <span class="muted small nowrap">${plan.reduce((n, s) => n + s.sets, 0)} sets · ~${estimateMinutes(plan)}′</span>
            ${icon('down', 'chev')}
          </summary>
          <ul class="slots">
            ${plan.map((s) => {
              const swapped = st.swaps[slotKey(prog.id, w.id, s.slot)];
              return `<li class="slot">
                <button class="slot-main" data-ex="${s.exId}">
                  <span class="slot-fig" data-fig="${s.exId}" data-mode="static"></span>
                  <span class="grow"><b>${esc(EX[s.exId].name)}</b><small>${s.sets} sets × ${repStr(s.reps)} reps${swapped ? ' · <span class="accent">swapped</span>' : ''}</small></span>
                </button>
                <button class="icon-btn" data-swap="${w.id}:${s.slot}:${s.exId}" aria-label="Swap ${esc(EX[s.exId].name)}">${icon('swap')}</button>
              </li>`;
            }).join('')}
          </ul>
        </details>`;
      }).join('')}

      <section class="card">
        <div class="card-head"><h3>Weekly sets per muscle</h3><span class="muted small">planned, week ${Math.min(pos.week, 4)}</span></div>
        <p class="muted small">Direct sets count 1, indirect (secondary) sets count ½. The shaded band marks the 10–20 set range where most growth happens.</p>
        ${volumeBars(vol)}
      </section>

      <h2 class="section-title">${icon('science')}The science</h2>
      <div class="science">
        ${SCIENCE.map((s) => `
          <details class="card sci">
            <summary><b>${esc(s.title)}</b>${icon('down', 'chev')}</summary>
            <p>${esc(s.body)}</p>
            <ul class="refs">${s.refs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          </details>`).join('')}
      </div>
      <p class="disclaimer">Educational guidance, not medical advice. Stop any exercise that causes pain and consult a professional if you have an injury or health condition.</p>
    </div>`;

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.ex) return openExercise(b.dataset.ex);
    if (b.dataset.prog && b.dataset.prog !== prog.id) {
      const np = PROGRAM[b.dataset.prog];
      const ok = await confirmDialog(`Switch to ${np.name}?`, `${np.days} days per week. Your training block restarts at week 1 — your history and records are kept.`, { ok: 'Switch program' });
      if (!ok) return;
      store.update((s) => { s.program = { id: np.id, meso: (s.program.meso || 1) + (s.program.done ? 1 : 0), done: 0, startedAt: new Date().toISOString() }; });
      toast(`Switched to ${np.name}`);
      refresh();
    }
    if (b.dataset.swap) {
      const [wid, slot, exId] = b.dataset.swap.split(':');
      const res = await pickAlternative(exId, { title: 'Swap in your plan' });
      if (!res) return;
      store.update((s) => {
        const key = slotKey(prog.id, wid, +slot);
        const orig = prog.workouts.find((w) => w.id === wid).slots[+slot].ex;
        if (res.exId === orig) delete s.swaps[key];
        else s.swaps[key] = res.exId;
      });
      toast(`Swapped to ${EX[res.exId].name}`, { icon: 'swap' });
      refresh();
    }
  });
}
