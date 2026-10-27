import * as store from '../store.js';
import { EX } from '../data/exercises.js';
import {
  position, weeklySets, plannedWeeklySets, weeklyCounts, weekStreak, sessionStats, exerciseHistory,
  fmtW, fromKg, toKg, weekStart,
} from '../engine.js';
import { lineChart } from '../charts.js';
import { muscleMap } from '../musclemap.js';
import { esc, icon, fmtDate, relDay, fmtNum, toast } from '../ui.js';
import { volumeBars } from './plan.js';

export function renderProgress(root, _p, { refresh }) {
  const st = store.get();
  const u = st.settings.units;
  const pos = position(st);
  const charts = [];
  const sessions = st.sessions;
  const stats = sessions.map((s) => ({ s, ss: sessionStats(s, sessions) }));
  const month = Date.now() - 30 * 864e5;
  const prs30 = stats.filter((x) => new Date(x.s.date) >= month).reduce((n, x) => n + x.ss.prs.length, 0);
  const done = weeklySets(sessions);
  const planned = plannedWeeklySets(pos.program.id, Math.min(pos.week, 4), st.settings.level, st.swaps);
  const heat = Object.fromEntries(Object.keys(done).map((m) => [m, planned[m] ? Math.min(1, done[m] / Math.max(10, planned[m])) : null]));

  // exercises with history, most recent first
  const exIds = [];
  for (let i = sessions.length - 1; i >= 0; i--) for (const e of sessions[i].exercises) if (!exIds.includes(e.exId)) exIds.push(e.exId);
  let sel = exIds[0];

  // consistency grid: 7 rows × 16 weeks
  const WEEKS = 16;
  const start = new Date(weekStart(new Date()).getTime() - (WEEKS - 1) * 7 * 864e5);
  const days = new Map();
  for (const s of sessions) {
    const d = new Date(s.date); d.setHours(0, 0, 0, 0);
    days.set(d.getTime(), (days.get(d.getTime()) || 0) + 1);
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const t = new Date(start.getTime() + (w * 7 + d) * 864e5);
      const n = days.get(t.getTime()) || 0;
      cells.push(`<i class="${n ? 'on' : ''} ${t > today ? 'future' : ''}" style="grid-column:${w + 1};grid-row:${d + 1}" title="${fmtDate(t)}${n ? ` — ${n} workout${n > 1 ? 's' : ''}` : ''}"></i>`);
    }
  }
  const counts = weeklyCounts(sessions, WEEKS);
  const streak = weekStreak(sessions, pos.program.days);
  const bw = [...st.bodyweight].sort((a, b) => a.date.localeCompare(b.date));

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <div><p class="eyebrow">Progress</p><h1>Your gains</h1></div>
        <a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>
      </header>

      <section class="tiles four">
        <div class="tile"><span class="tile-l">Workouts</span><span class="tile-v">${sessions.length}</span><span class="tile-s">all time</span></div>
        <div class="tile"><span class="tile-l">This week</span><span class="tile-v">${counts[WEEKS - 1].n}<small>/${pos.program.days}</small></span><span class="tile-s">sessions</span></div>
        <div class="tile"><span class="tile-l">Streak</span><span class="tile-v">${streak}</span><span class="tile-s">weeks on target</span></div>
        <div class="tile"><span class="tile-l">Records</span><span class="tile-v">${prs30}</span><span class="tile-s">PRs in 30 days</span></div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Consistency</h3><span class="muted small">last ${WEEKS} weeks</span></div>
        <div class="cal" aria-label="Training days over the last ${WEEKS} weeks">${cells.join('')}</div>
        <div class="cal-foot muted small"><span>${fmtDate(start, { day: 'numeric', month: 'short' })}</span><span>Today</span></div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Strength</h3><span class="muted small">estimated 1-rep max</span></div>
        ${exIds.length ? `
          <div class="chips scroll" role="tablist" aria-label="Exercise">${exIds.map((id) => `<button role="tab" class="chip-btn ${id === sel ? 'on' : ''}" data-sel="${id}">${esc(EX[id].name)}</button>`).join('')}</div>
          <div class="strength"></div>` : `<p class="muted small">Log your first workout to see strength trends here. We estimate your 1-rep max from every set (Epley formula) so you can compare sets with different reps.</p>`}
      </section>

      <section class="card">
        <div class="card-head"><h3>This week's volume</h3><span class="muted small">hard sets per muscle</span></div>
        <div class="vol-grid">
          <div class="vol-map">${muscleMap({ heat })}<p class="muted small center">Brighter = closer to this week's plan</p></div>
          ${volumeBars(done)}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Body weight</h3>${bw.length ? `<span class="muted small">${fmtW(bw[bw.length - 1].kg, u)} ${u} latest</span>` : ''}</div>
        <form class="bw-form row gap" autocomplete="off">
          <label class="sr" for="bw-in">Body weight in ${u}</label>
          <input id="bw-in" class="input grow" inputmode="decimal" placeholder="Today's weight (${u})">
          <button class="btn primary" type="submit">${icon('plus')}Log</button>
        </form>
        ${bw.length > 1 ? '<div class="bw-chart"></div>' : '<p class="muted small mt-s">Weigh in a couple of times a week, same time of day. For lean muscle gain aim for roughly +0.25–0.5% body weight per week.</p>'}
      </section>

      <section class="card">
        <div class="card-head"><h3>History</h3><span class="muted small">${sessions.length} workout${sessions.length === 1 ? '' : 's'}</span></div>
        ${sessions.length ? `<ul class="list">${stats.slice().reverse().slice(0, 50).map(({ s, ss }) => `
          <li><a class="list-row" href="#/session/${s.id}">
            <span class="date-badge"><b>${new Date(s.date).getDate()}</b><small>${new Date(s.date).toLocaleDateString(undefined, { month: 'short' })}</small></span>
            <span class="grow"><b>${esc(s.name)}</b><small>${relDay(s.date)} · ${ss.sets} sets · ${fmtNum(fromKg(ss.volume, u))} ${u}${ss.minutes ? ` · ${ss.minutes} min` : ''}</small></span>
            ${ss.prs.length ? `<span class="pr-badge">${icon('trophy')}${ss.prs.length}</span>` : ''}${icon('right', 'faint')}
          </a></li>`).join('')}</ul>` : '<p class="muted small">No workouts yet.</p>'}
      </section>
    </div>`;

  function paintStrength() {
    const box = root.querySelector('.strength');
    if (!box) return;
    charts.forEach((c) => c.destroy());
    charts.length = 0;
    const ex = EX[sel];
    const hist = exerciseHistory(sessions, sel);
    const bwOnly = ex.bodyweight && hist.every((h) => !h.top.w);
    const first = hist[0], last = hist[hist.length - 1];
    const val = (h) => (bwOnly ? h.top.r : fromKg(h.e1rm, u));
    const change = hist.length > 1 ? ((val(last) - val(first)) / val(first)) * 100 : 0;
    box.innerHTML = `
      <div class="str-head">
        <div><span class="str-v">${bwOnly ? last.top.r : `${(Math.round(fromKg(last.e1rm, u) * 10) / 10)}`}</span><span class="muted"> ${bwOnly ? 'reps' : u}</span></div>
        ${hist.length > 1 ? `<span class="delta ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% since ${fmtDate(first.date, { day: 'numeric', month: 'short' })}</span>` : '<span class="muted small">Log again to see a trend</span>'}
      </div>
      ${hist.length > 1 ? '<div class="str-chart"></div>' : ''}
      <table class="tbl">
        <thead><tr><th>Date</th><th>Best set</th><th>Sets</th><th>${bwOnly ? 'Reps' : 'e1RM'}</th></tr></thead>
        <tbody>${hist.slice(-6).reverse().map((h) => `<tr><td>${fmtDate(h.date, { day: 'numeric', month: 'short' })}</td>
          <td>${bwOnly ? '' : `${fmtW(h.top.w, u)} × `}${h.top.r}</td><td>${h.sets}</td><td>${bwOnly ? h.reps : fmtW(h.e1rm, u)}</td></tr>`).join('')}</tbody>
      </table>`;
    const c = box.querySelector('.str-chart');
    if (c) charts.push(lineChart(c, hist.map((h) => ({ x: h.date, y: val(h), label: bwOnly ? '' : `${fmtW(h.top.w, u)}×${h.top.r}` })), {
      format: (v) => `${Math.round(v * 10) / 10}`, unit: bwOnly ? 'reps' : u, label: `${ex.name} estimated 1RM over time`,
    }));
  }
  paintStrength();

  const bc = root.querySelector('.bw-chart');
  if (bc) charts.push(lineChart(bc, bw.map((b) => ({ x: b.date, y: fromKg(b.kg, u) })), { format: (v) => `${Math.round(v * 10) / 10}`, unit: u, label: 'Body weight over time', height: 160 }));

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sel]');
    if (!b) return;
    sel = b.dataset.sel;
    root.querySelectorAll('[data-sel]').forEach((x) => x.classList.toggle('on', x === b));
    paintStrength();
  });
  root.querySelector('.bw-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseFloat(root.querySelector('#bw-in').value.replace(',', '.'));
    if (!(v > 20 && v < 700)) { toast('Enter a valid weight', { icon: 'info' }); return; }
    const date = new Date().toISOString().slice(0, 10);
    store.update((s) => {
      s.bodyweight = s.bodyweight.filter((x) => x.date !== date);
      s.bodyweight.push({ date, kg: toKg(v, u) });
    });
    toast('Body weight logged');
    refresh();
  });
  return () => charts.forEach((c) => c.destroy());
}
