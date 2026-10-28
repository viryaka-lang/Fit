import * as store from '../store.js';
import { EX } from '../data/exercises.js';
import { MESO } from '../data/programs.js';
import { position, planWorkout, estimateMinutes, sessionStats, weeklyCounts, weekStreak, fmtW } from '../engine.js';
import { esc, icon, sheet, relDay, fmtNum } from '../ui.js';
import { startWorkout } from './workout.js';
import { openExercise, repStr } from './shared.js';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late session?' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function renderToday(root, _p, { navigate, install }) {
  const st = store.get();
  const pos = position(st);
  const u = st.settings.units;
  const plan = planWorkout(pos.program.id, pos.workout.id, pos.week, st.settings.level, st.swaps);
  const totalSets = plan.reduce((a, s) => a + s.sets, 0);
  const mins = estimateMinutes(plan);
  const counts = weeklyCounts(st.sessions, 1);
  const thisWeek = counts[0].n;
  const streak = weekStreak(st.sessions, pos.program.days);
  const recent = st.sessions.slice(-3).reverse();
  const a = st.active;
  const phase = pos.phase;

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <div><p class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>${greeting()}</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>
      </header>

      ${a ? `
      <button class="resume card" data-act="resume">
        <span class="pulse"></span>
        <span class="grow"><b>${a.pausedAt ? 'Workout paused' : 'Workout in progress'}</b><small>${esc(a.name)} · ${a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)} sets logged</small></span>
        <span class="btn sm primary">Resume${icon('right')}</span>
      </button>` : ''}

      <section class="hero card">
        <div class="hero-top">
          <span class="pill ${phase.deload ? 'calm' : ''}">Week ${pos.week} · ${phase.label}</span>
          <span class="muted small">Block ${pos.meso} · workout ${pos.day + 1} of ${pos.program.days}</span>
        </div>
        <p class="eyebrow mt-s">Next up</p>
        <h2 class="hero-title">${esc(pos.workout.name)}</h2>
        <p class="muted">${esc(pos.workout.focus)}</p>
        <div class="hero-stats">
          <div>${icon('clock')}<b>~${mins}</b><span>min</span></div>
          <div>${icon('layers')}<b>${totalSets}</b><span>sets</span></div>
          <div>${icon('bolt')}<b>${phase.rir}</b><span>RIR target</span></div>
        </div>
        ${a ? '' : `<button class="btn primary lg block mt-s" data-act="start">${icon('play')}Start workout</button>`}
        <ul class="hero-list">
          ${plan.map((s) => `
            <li><button class="hl-row" data-ex="${s.exId}">
              <span class="hl-fig" data-fig="${s.exId}" data-mode="static"></span>
              <span class="grow"><b>${esc(EX[s.exId].name)}</b><small>${s.sets} × ${repStr(s.reps)}</small></span>
              ${icon('info', 'faint')}
            </button></li>`).join('')}
        </ul>
        <p class="phase-note">${icon('info')}<span>${esc(phase.note)}</span></p>
        ${a ? '' : '<button class="link-btn" data-act="choose">Do a different workout</button>'}
      </section>

      <section class="card">
        <div class="card-head"><h3>Training block</h3><span class="muted small">${pos.done} / ${pos.total} workouts</span></div>
        <div class="meso">
          ${MESO.map((m) => `
            <div class="meso-wk ${m.week === pos.week ? 'cur' : ''} ${m.week < pos.week ? 'past' : ''}">
              <div class="meso-dots">${Array.from({ length: pos.program.days }, (_, d) => {
                const idx = (m.week - 1) * pos.program.days + d;
                return `<i class="${idx < pos.done ? 'on' : idx === pos.done ? 'next' : ''}"></i>`;
              }).join('')}</div>
              <b>W${m.week}</b><small>${m.deload ? 'Deload' : `RIR ${m.rir}`}</small>
            </div>`).join('')}
        </div>
      </section>

      <section class="tiles">
        <div class="tile"><span class="tile-l">This week</span><span class="tile-v">${thisWeek}<small>/${pos.program.days}</small></span><span class="tile-s">workouts</span></div>
        <div class="tile"><span class="tile-l">Streak</span><span class="tile-v">${streak}</span><span class="tile-s">week${streak === 1 ? '' : 's'} on target</span></div>
        <div class="tile"><span class="tile-l">Total</span><span class="tile-v">${st.sessions.length}</span><span class="tile-s">workouts</span></div>
      </section>

      ${recent.length ? `
      <section class="card">
        <div class="card-head"><h3>Recent workouts</h3><a class="small link" href="#/progress">See all</a></div>
        <ul class="list">
          ${recent.map((s) => {
            const ss = sessionStats(s, st.sessions);
            return `<li><a class="list-row" href="#/session/${s.id}">
              <span class="grow"><b>${esc(s.name)}</b><small>${relDay(s.date)} · ${ss.sets} sets · ${fmtNum(+fmtW(ss.volume, u))} ${u} volume${ss.minutes ? ` · ${ss.minutes} min` : ''}</small></span>
              ${ss.prs.length ? `<span class="pr-badge">${icon('trophy')}${ss.prs.length}</span>` : ''}${icon('right', 'faint')}
            </a></li>`;
          }).join('')}
        </ul>
      </section>` : `
      <section class="card empty">
        ${icon('flame')}
        <div><b>Your first session is waiting</b><p class="muted small">Tap any exercise above to see how it's done. Weights you log become your starting point — the app plans every session after that.</p></div>
      </section>`}

      ${install.prompt ? `<button class="card install" data-act="install">${icon('download')}<span class="grow"><b>Install the app</b><small>Full-screen, offline, one tap from your home screen</small></span>${icon('right', 'faint')}</button>` : ''}
    </div>`;

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act],[data-ex]');
    if (!b) return;
    if (b.dataset.ex) return openExercise(b.dataset.ex);
    switch (b.dataset.act) {
      case 'start': startWorkout(null, navigate); break;
      case 'resume': navigate('#/workout'); break;
      case 'install':
        install.prompt.prompt();
        await install.prompt.userChoice.catch(() => {});
        install.prompt = null;
        b.remove();
        break;
      case 'choose': {
        const s = sheet(`<h2 class="sheet-title">Choose a workout</h2>
          <p class="muted">Counts as the next workout in your block.</p>
          <div class="pick-list">${pos.program.workouts.map((w) => {
            const p = planWorkout(pos.program.id, w.id, pos.week, st.settings.level, st.swaps);
            return `<button class="pick" data-w="${w.id}">
              <span class="pick-txt"><b>${esc(w.name)}${w.id === pos.workout.id ? ' <em class="pill">Scheduled</em>' : ''}</b><small class="muted">${esc(w.focus)} · ${p.reduce((n, x) => n + x.sets, 0)} sets</small></span>${icon('right')}</button>`;
          }).join('')}</div>`, { className: 'compact' });
        s.el.addEventListener('click', (ev) => {
          const w = ev.target.closest('[data-w]');
          if (w) { s.close(); startWorkout(w.dataset.w, navigate); }
        });
        break;
      }
    }
  });
}
