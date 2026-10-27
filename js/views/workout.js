import * as store from '../store.js';
import { EX, MUSCLES } from '../data/exercises.js';
import { PROGRAM, MESO } from '../data/programs.js';
import { planWorkout, position, suggest, fmtW, toKg, fromKg, round, doneSets, slotKey } from '../engine.js';
import { esc, icon, toast, haptic, fmtTime, hydrateFigures, destroyFigures, sheet, confirmDialog } from '../ui.js';
import { openExercise, pickAlternative, repStr, restStr } from './shared.js';
import { beep, notify, unlockAudio, keepAwake } from '../timer.js';

// ------------------------------------------------------------ lifecycle
function buildEntry(st, exId, slot, target, sessionId) {
  const sg = suggest(st.sessions, exId, target, st.settings.incKg, sessionId);
  return {
    exId, slot, target,
    sets: Array.from({ length: target.sets }, (_, i) => ({ w: sg.weight, r: sg.reps[i] ?? sg.reps[0], done: false })),
  };
}

export function startWorkout(workoutId, navigate) {
  const st = store.get();
  const pos = position(st);
  const wid = workoutId || pos.workout.id;
  const w = pos.program.workouts.find((x) => x.id === wid);
  const plan = planWorkout(pos.program.id, wid, pos.week, st.settings.level, st.swaps);
  const id = store.uid();
  const deload = !!MESO[pos.week - 1].deload;
  unlockAudio();
  store.update((s) => {
    s.active = {
      id, date: new Date().toISOString(), programId: pos.program.id, workoutId: wid, name: w.name,
      week: pos.week, meso: pos.meso, cur: 0, rest: null,
      exercises: plan.map((p) => buildEntry(st, p.exId, p.slot, { sets: p.sets, reps: p.reps, rir: p.rir, rest: p.rest, deload }, id)),
    };
  });
  navigate('#/workout');
}

function finish(navigate) {
  const st = store.get();
  const a = st.active;
  const session = { ...a, end: new Date().toISOString() };
  delete session.cur;
  delete session.rest;
  session.exercises = session.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
    .filter((e) => e.sets.length);
  store.update((s) => {
    s.active = null;
    if (!session.exercises.length) return;
    s.sessions.push(session);
    if (session.programId === s.program.id && session.meso === (s.program.meso || 1)) {
      s.program.done = (s.program.done || 0) + 1;
      const p = PROGRAM[s.program.id];
      if (s.program.done >= p.days * MESO.length) {
        s.program.done = 0;
        s.program.meso = (s.program.meso || 1) + 1;
      }
    }
  });
  keepAwake(false);
  if (!session.exercises.length) { toast('Workout discarded — no sets logged', { icon: 'x' }); navigate('#/today'); return; }
  navigate(`#/session/${session.id}/new`);
}

// ---------------------------------------------------------------- view
export function renderWorkout(root, _params, { navigate }) {
  const st = () => store.get();
  const A = () => st().active;
  const u = st().settings.units;
  const incDisp = round(fromKg(st().settings.incKg, u), 0.25) || (u === 'kg' ? 2 : 5);
  let tick = null, restTimeout = null;

  keepAwake(true);
  const onVis = () => { if (document.visibilityState === 'visible') { keepAwake(true); paintRest(); } };
  document.addEventListener('visibilitychange', onVis);

  root.innerHTML = `
    <div class="wk">
      <header class="wk-top">
        <button class="icon-btn" data-act="minimize" aria-label="Back to Today">${icon('down')}</button>
        <div class="wk-title"><b>${esc(A().name)}</b><span class="wk-clock" aria-label="Elapsed time">0:00</span></div>
        <button class="btn sm primary" data-act="finish">Finish</button>
      </header>
      <div class="wk-strip" role="tablist" aria-label="Exercises"></div>
      <div class="wk-main"></div>
      <div class="rest" hidden>
        <div class="rest-bar"><i></i></div>
        <div class="rest-inner">
          <div class="rest-info"><span class="rest-label">Rest</span><span class="rest-time">0:00</span></div>
          <div class="rest-actions">
            <button class="btn sm ghost" data-act="rest-minus" aria-label="Subtract 15 seconds">−15</button>
            <button class="btn sm ghost" data-act="rest-plus" aria-label="Add 15 seconds">+15</button>
            <button class="btn sm" data-act="rest-skip">Skip ${icon('skip')}</button>
          </div>
        </div>
      </div>
    </div>`;

  const strip = root.querySelector('.wk-strip');
  const main = root.querySelector('.wk-main');
  const restEl = root.querySelector('.rest');
  const clock = root.querySelector('.wk-clock');

  // ---------------------------------------------------------- strip
  function paintStrip() {
    const a = A();
    strip.innerHTML = a.exercises.map((e, i) => {
      const n = e.sets.filter((s) => s.done).length;
      const state = n >= e.sets.length ? 'done' : n ? 'partial' : '';
      return `<button role="tab" aria-selected="${i === a.cur}" class="wk-chip ${i === a.cur ? 'cur' : ''} ${state}" data-goto="${i}">
        <span class="wk-chip-n">${state === 'done' ? icon('check') : i + 1}</span><span class="wk-chip-t">${esc(EX[e.exId].name)}</span>
        <span class="wk-chip-p">${n}/${e.sets.length}</span></button>`;
    }).join('');
    const cur = strip.querySelector('.cur');
    if (cur) strip.scrollTo({ left: cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2, behavior: 'smooth' });
  }

  // -------------------------------------------------------- exercise
  function paintMain() {
    destroyFigures(main);
    const a = A();
    const e = a.exercises[a.cur];
    const ex = EX[e.exId];
    const t = e.target;
    const sg = suggest(st().sessions, e.exId, t, st().settings.incKg, a.id);
    const firstCompound = a.exercises.findIndex((x) => EX[x.exId].type === 'compound');
    const warm = a.cur === firstCompound && !ex.bodyweight && sg.weight > 0 && !t.deload;
    const prev = sg.prev;
    const badge = { increase: ['up', 'Go heavier'], reps: ['', 'Add reps'], decrease: ['down', 'Adjust'], deload: ['', 'Deload'], new: ['', 'New'] }[sg.kind];
    main.innerHTML = `
      <section class="wk-ex">
        <div class="wk-fig card">
          <div class="wk-fig-svg" data-fig="${ex.id}"></div>
          <div class="wk-fig-btns">
            <button class="icon-btn glass" data-act="info" aria-label="How to do ${esc(ex.name)}">${icon('info')}</button>
            <button class="icon-btn glass" data-act="swap" aria-label="Swap exercise">${icon('swap')}</button>
          </div>
          <span class="wk-fig-n">${a.cur + 1} / ${a.exercises.length}</span>
        </div>
        <div class="wk-head">
          <h1>${esc(ex.name)}</h1>
          <p class="muted">${ex.primary.map((m) => MUSCLES[m]).join(' · ')}${ex.unilateral ? ' · <b>each side</b>' : ''}</p>
        </div>
        <div class="targets">
          <div><b>${t.sets}</b><span>sets</span></div>
          <div><b>${repStr(t.reps)}</b><span>reps</span></div>
          <div><b>${t.rir}</b><span>reps in reserve</span></div>
          <div><b>${fmtTime(t.rest)}</b><span>rest</span></div>
        </div>
        <div class="coach ${badge[0]}">
          <span class="coach-badge">${sg.kind === 'increase' ? icon('bolt') : sg.kind === 'deload' ? icon('clock') : icon('progress')}${badge[1]}</span>
          <p>${esc(sg.text)}</p>
          ${prev ? `<p class="coach-prev">Last time: <b>${ex.bodyweight && !prev.weight ? '' : `${fmtW(prev.weight, u)} ${u} × `}${prev.reps.join(', ')}</b></p>` : ''}
        </div>
        ${warm ? `<details class="warm"><summary>${icon('flame')}Warm-up sets <small>tap to view</small></summary>
          <p>Before your working sets: <b>${fmtW(round(sg.weight * 0.5, st().settings.incKg || 1), u)} ${u} × 10</b>, then <b>${fmtW(round(sg.weight * 0.75, st().settings.incKg || 1), u)} ${u} × 5</b>. Rest ~1 min. Warm-ups don't count as sets.</p></details>` : ''}
        <div class="sets" role="table" aria-label="Sets">
          <div class="set-row set-hdr" role="row">
            <span role="columnheader">Set</span><span role="columnheader">${ex.bodyweight ? `+${u}` : `${u} / DB`}</span><span role="columnheader">Reps</span><span role="columnheader"><span class="sr">Done</span></span>
          </div>
          <div class="set-rows"></div>
        </div>
        <div class="row gap set-tools">
          <button class="btn ghost sm" data-act="add-set">${icon('plus')}Add set</button>
          ${e.sets.length > 1 ? `<button class="btn ghost sm" data-act="rm-set">${icon('minus')}Remove set</button>` : ''}
        </div>
        <div class="wk-nav">
          <button class="btn ghost" data-act="prev" ${a.cur === 0 ? 'disabled' : ''}>${icon('left')}Previous</button>
          ${a.cur < a.exercises.length - 1
            ? `<button class="btn" data-act="next">Next${icon('right')}</button>`
            : `<button class="btn primary" data-act="finish">Finish workout${icon('check')}</button>`}
        </div>
        <p class="effort-hint">${icon('info')}<span><b>Reps in reserve (RIR)</b> = how many more reps you could have done with good form. RIR ${esc(t.rir)} means stop ${t.deload ? 'well short of failure' : `with about ${t.rir} rep${t.rir === '1' ? '' : 's'} left`}.</span></p>
      </section>`;
    hydrateFigures(main);
    paintSets();
  }

  function paintSets() {
    const a = A();
    const e = a.exercises[a.cur];
    const ex = EX[e.exId];
    const nextIdx = e.sets.findIndex((s) => !s.done);
    const rows = main.querySelector('.set-rows');
    rows.innerHTML = e.sets.map((s, i) => `
      <div class="set-row ${s.done ? 'done' : ''} ${i === nextIdx ? 'next' : ''}" role="row" data-i="${i}">
        <span class="set-n" role="cell">${i + 1}</span>
        <span class="stepper" role="cell">
          <button class="step" data-step="w" data-d="-1" aria-label="Decrease weight">${icon('minus')}</button>
          <input inputmode="decimal" type="text" data-field="w" aria-label="Weight set ${i + 1}" value="${s.w == null ? '' : fmtW(s.w, u)}" placeholder="${ex.bodyweight ? '0' : '—'}">
          <button class="step" data-step="w" data-d="1" aria-label="Increase weight">${icon('plus')}</button>
        </span>
        <span class="stepper" role="cell">
          <button class="step" data-step="r" data-d="-1" aria-label="Decrease reps">${icon('minus')}</button>
          <input inputmode="numeric" type="text" data-field="r" aria-label="Reps set ${i + 1}" value="${s.r ?? ''}">
          <button class="step" data-step="r" data-d="1" aria-label="Increase reps">${icon('plus')}</button>
        </span>
        <span role="cell"><button class="tick ${s.done ? 'on' : ''}" data-act="tick" aria-pressed="${s.done}" aria-label="${s.done ? 'Undo' : 'Complete'} set ${i + 1}">${icon('check')}</button></span>
      </div>`).join('');
  }

  const setVal = (i, field, val) => {
    store.update((s) => {
      const e = s.active.exercises[s.active.cur];
      e.sets[i][field] = val;
      // carry a weight change forward to the following sets that aren't done yet
      if (field === 'w') for (let j = i + 1; j < e.sets.length; j++) if (!e.sets[j].done) e.sets[j].w = val;
    });
  };

  // ------------------------------------------------------------ rest
  function startRest(sec) {
    if (!st().settings.autoRest) return;
    store.update((s) => { s.active.rest = { end: Date.now() + sec * 1000, total: sec }; });
    scheduleRestAlert();
    paintRest();
  }
  function scheduleRestAlert() {
    clearTimeout(restTimeout);
    const r = A()?.rest;
    if (!r) return;
    restTimeout = setTimeout(restDone, Math.max(0, r.end - Date.now()));
  }
  function restDone() {
    const s = st();
    if (!s.active?.rest) return;
    store.update((x) => { x.active.rest = null; });
    if (s.settings.sound) beep();
    if (s.settings.vibrate) haptic([220, 120, 220]);
    if (document.visibilityState !== 'visible') notify('Rest over — next set!', `${EX[s.active.exercises[s.active.cur].exId].name}`);
    paintRest();
  }
  function paintRest() {
    const r = A()?.rest;
    if (!r) { restEl.hidden = true; document.body.classList.remove('resting'); return; }
    const left = (r.end - Date.now()) / 1000;
    if (left <= 0) { restDone(); return; }
    restEl.hidden = false;
    document.body.classList.add('resting');
    restEl.querySelector('.rest-time').textContent = fmtTime(left);
    restEl.querySelector('.rest-bar i').style.transform = `scaleX(${Math.max(0, left / r.total)})`;
    restEl.classList.toggle('ending', left <= 10);
  }

  // ----------------------------------------------------------- events
  root.addEventListener('click', async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    unlockAudio();
    const a = A();
    if (b.dataset.goto != null) { store.update((s) => { s.active.cur = +b.dataset.goto; }); paintStrip(); paintMain(); window.scrollTo(0, 0); return; }
    const row = b.closest('.set-row');
    const i = row ? +row.dataset.i : -1;
    const e = a.exercises[a.cur];
    if (b.dataset.step) {
      const s = e.sets[i];
      if (b.dataset.step === 'w') {
        const cur = s.w == null ? 0 : fromKg(s.w, u);
        const v = Math.max(0, round(cur + +b.dataset.d * incDisp, 0.25));
        setVal(i, 'w', toKg(v, u));
      } else {
        setVal(i, 'r', Math.max(0, (s.r || 0) + +b.dataset.d));
      }
      haptic(6);
      paintSets();
      return;
    }
    switch (b.dataset.act) {
      case 'tick': {
        const s = e.sets[i];
        if (!s.done) {
          if (s.w == null && !EX[e.exId].bodyweight) { toast('Enter the weight you used first', { icon: 'info' }); row.querySelector('[data-field=w]').focus(); return; }
          if (!s.r) { toast('Enter your reps', { icon: 'info' }); return; }
        }
        store.update((x) => {
          const st2 = x.active.exercises[x.active.cur].sets[i];
          st2.done = !st2.done;
          if (st2.w == null) st2.w = 0;
          st2.t = st2.done ? Date.now() : undefined;
        });
        haptic(st().active.exercises[a.cur].sets[i].done ? [10, 40, 18] : 8);
        const ex2 = A().exercises[a.cur];
        const allDone = ex2.sets.every((x) => x.done);
        const lastEx = a.cur === a.exercises.length - 1;
        if (ex2.sets[i].done && !(allDone && lastEx)) startRest(e.target.rest);
        paintSets();
        paintStrip();
        if (ex2.sets[i].done && allDone) {
          if (!lastEx) {
            toast(`${EX[e.exId].name} complete`);
            setTimeout(() => { store.update((s) => { s.active.cur = Math.min(s.active.cur + 1, s.active.exercises.length - 1); }); paintStrip(); paintMain(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 650);
          } else {
            toast('Last set done — tap Finish when ready', { icon: 'trophy' });
          }
        }
        break;
      }
      case 'add-set':
        store.update((s) => {
          const ee = s.active.exercises[s.active.cur];
          const last = ee.sets[ee.sets.length - 1];
          ee.sets.push({ w: last?.w ?? null, r: last?.r ?? ee.target.reps[0], done: false });
        });
        paintMain();
        break;
      case 'rm-set':
        store.update((s) => {
          const ee = s.active.exercises[s.active.cur];
          const idx = ee.sets.map((x) => x.done).lastIndexOf(false);
          ee.sets.splice(idx >= 0 ? idx : ee.sets.length - 1, 1);
        });
        paintMain();
        paintStrip();
        break;
      case 'prev': case 'next':
        store.update((s) => { s.active.cur += b.dataset.act === 'next' ? 1 : -1; });
        paintStrip(); paintMain(); window.scrollTo(0, 0);
        break;
      case 'info': openExercise(e.exId); break;
      case 'swap': {
        if (e.sets.some((x) => x.done)) { toast('Sets already logged — finish this exercise or remove its sets first', { icon: 'info' }); return; }
        const res = await pickAlternative(e.exId, { rememberOption: true });
        if (!res) return;
        store.update((s) => {
          const ac = s.active;
          const old = ac.exercises[ac.cur];
          const nex = EX[res.exId];
          const target = { ...old.target, reps: nex.reps, rest: nex.rest };
          ac.exercises[ac.cur] = buildEntry(s, res.exId, old.slot, target, ac.id);
          if (res.remember && ac.programId === s.program.id) s.swaps[slotKey(ac.programId, ac.workoutId, old.slot)] = res.exId;
        });
        paintStrip(); paintMain();
        toast(`Swapped to ${EX[res.exId].name}`, { icon: 'swap' });
        break;
      }
      case 'rest-plus': case 'rest-minus':
        store.update((s) => {
          if (!s.active.rest) return;
          const d = b.dataset.act === 'rest-plus' ? 15 : -15;
          s.active.rest.end += d * 1000;
          s.active.rest.total = Math.max(s.active.rest.total + Math.max(0, d), 15);
        });
        scheduleRestAlert(); paintRest();
        break;
      case 'rest-skip':
        store.update((s) => { s.active.rest = null; }); clearTimeout(restTimeout); paintRest();
        break;
      case 'minimize': navigate('#/today'); break;
      case 'finish': openFinish(); break;
    }
  });

  root.addEventListener('change', (ev) => {
    const inp = ev.target.closest('input[data-field]');
    if (!inp) return;
    const i = +inp.closest('.set-row').dataset.i;
    const raw = inp.value.replace(',', '.').trim();
    if (inp.dataset.field === 'w') {
      const v = parseFloat(raw);
      setVal(i, 'w', raw === '' || Number.isNaN(v) ? null : toKg(Math.max(0, v), u));
    } else {
      const v = parseInt(raw, 10);
      setVal(i, 'r', Number.isNaN(v) ? 0 : Math.max(0, Math.min(100, v)));
    }
    syncInputs();
  });

  // Update input values in place (re-rendering here would swallow a tap on
  // the ✓ button that caused this input to blur).
  function syncInputs() {
    const e = A().exercises[A().cur];
    main.querySelectorAll('.set-rows .set-row').forEach((row) => {
      const s = e.sets[+row.dataset.i];
      if (!s) return;
      row.querySelector('[data-field=w]').value = s.w == null ? '' : fmtW(s.w, u);
      row.querySelector('[data-field=r]').value = s.r ?? '';
    });
  }
  root.addEventListener('focusin', (ev) => { if (ev.target.matches('input[data-field]')) ev.target.select(); });

  function openFinish() {
    const a = A();
    const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
    const done = a.exercises.reduce((n, e) => n + doneSets(e).length, 0);
    const s = sheet(`
      <h2 class="sheet-title">${done === total ? 'Great work!' : 'Finish workout?'}</h2>
      <p class="muted">${done} of ${total} sets logged.${done < total ? ' Unlogged sets will be skipped.' : ''}</p>
      <div class="col gap mt">
        <button class="btn primary lg" data-f="save" ${done ? '' : 'disabled'}>${icon('check')}Save workout</button>
        <button class="btn ghost" data-close>Keep training</button>
        <button class="btn danger-ghost" data-f="discard">${icon('trash')}Discard workout</button>
      </div>`, { className: 'compact' });
    s.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-f]');
      if (!b) return;
      if (b.dataset.f === 'save') { s.close(); clearTimeout(restTimeout); finish(navigate); }
      if (b.dataset.f === 'discard') {
        s.close();
        if (await confirmDialog('Discard this workout?', 'All sets logged in this session will be lost.', { ok: 'Discard', danger: true })) {
          clearTimeout(restTimeout);
          store.update((x) => { x.active = null; });
          keepAwake(false);
          navigate('#/today');
        }
      }
    });
  }

  paintStrip();
  paintMain();
  scheduleRestAlert();
  paintRest();
  const startT = new Date(A().date).getTime();
  const paintClock = () => { clock.textContent = fmtTime((Date.now() - startT) / 1000); };
  paintClock();
  tick = setInterval(() => { if (!A()) return; paintClock(); paintRest(); }, 250);

  return () => {
    clearInterval(tick);
    clearTimeout(restTimeout);
    document.removeEventListener('visibilitychange', onVis);
    document.body.classList.remove('resting');
    keepAwake(false);
  };
}
