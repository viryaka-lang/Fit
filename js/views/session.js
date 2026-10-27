import * as store from '../store.js';
import { EX, MUSCLES, TRACKED } from '../data/exercises.js';
import { sessionStats, fmtW, fromKg, doneSets } from '../engine.js';
import { esc, icon, fmtDate, fmtNum, confirmDialog, toast } from '../ui.js';
import { openExercise } from './shared.js';

export function renderSession(root, params, { navigate }) {
  const st = store.get();
  const u = st.settings.units;
  const [id, flag] = params;
  const s = st.sessions.find((x) => x.id === id);
  if (!s) { navigate('#/today', { replace: true }); return; }
  const isNew = flag === 'new';
  const ss = sessionStats(s, st.sessions);
  const prSet = new Set(ss.prs.map((p) => p.exId));
  const muscles = TRACKED.filter((m) => ss.muscles[m]).sort((a, b) => ss.muscles[b] - ss.muscles[a]);

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <a class="icon-btn" href="${isNew ? '#/today' : '#/progress'}" aria-label="Back">${icon('left')}</a>
        <div class="grow"><p class="eyebrow">${fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>${esc(s.name)}</h1></div>
      </header>
      ${isNew ? `<section class="celebrate card">
        <div class="confetti" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
        ${icon('trophy')}<h2>Workout complete!</h2>
        <p class="muted">${ss.prs.length ? `${ss.prs.length} new personal record${ss.prs.length > 1 ? 's' : ''}. ` : ''}Recovery is when you grow — eat enough protein (~1.6 g/kg) and sleep well.</p>
      </section>` : ''}
      <section class="tiles four">
        <div class="tile"><span class="tile-l">Duration</span><span class="tile-v">${ss.minutes || '—'}</span><span class="tile-s">minutes</span></div>
        <div class="tile"><span class="tile-l">Sets</span><span class="tile-v">${ss.sets}</span><span class="tile-s">hard sets</span></div>
        <div class="tile"><span class="tile-l">Volume</span><span class="tile-v">${fmtNum(fromKg(ss.volume, u))}</span><span class="tile-s">${u} lifted</span></div>
        <div class="tile"><span class="tile-l">Records</span><span class="tile-v">${ss.prs.length}</span><span class="tile-s">new PRs</span></div>
      </section>
      ${muscles.length ? `<div class="chips mt">${muscles.map((m) => `<span class="chip">${MUSCLES[m]} · ${+ss.muscles[m].toFixed(1)}</span>`).join('')}</div>` : ''}
      <section class="card">
        ${s.exercises.map((e) => {
          const ex = EX[e.exId];
          return `<div class="sx">
            <button class="sx-head" data-ex="${e.exId}">
              <span class="slot-fig" data-fig="${e.exId}" data-mode="static"></span>
              <span class="grow"><b>${esc(ex.name)}</b>${prSet.has(e.exId) ? ` <span class="pr-badge">${icon('trophy')}PR</span>` : ''}</span>${icon('info', 'faint')}
            </button>
            <ol class="sx-sets">${doneSets(e).map((x) => `<li><span>${ex.bodyweight && !x.w ? 'Bodyweight' : `${fmtW(x.w, u)} ${u}`}</span><b>× ${x.r}</b></li>`).join('')}</ol>
          </div>`;
        }).join('')}
      </section>
      ${isNew ? `<a class="btn primary lg block" href="#/today">Done</a>` : `<button class="btn danger-ghost block" data-del>${icon('trash')}Delete workout</button>`}
    </div>`;

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ex]');
    if (b) return openExercise(b.dataset.ex);
    if (e.target.closest('[data-del]')) {
      if (!(await confirmDialog('Delete this workout?', 'It will be removed from your history and progress charts. Your training block position is not changed.', { ok: 'Delete', danger: true }))) return;
      store.update((x) => { x.sessions = x.sessions.filter((y) => y.id !== id); });
      toast('Workout deleted', { icon: 'trash' });
      navigate('#/progress');
    }
  });
}
