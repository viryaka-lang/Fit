import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest, planWorkout, position, e1rm, sessionStats, plannedWeeklySets, weekStreak, toKg, fromKg, elapsedMs } from '../js/engine.js';
import { PROGRAMS } from '../js/data/programs.js';
import { EX, EXERCISES, alternatives } from '../js/data/exercises.js';

const session = (id, date, exId, sets) => ({ id, date, name: 'x', exercises: [{ exId, sets: sets.map(([w, r]) => ({ w, r, done: true })) }] });
const target = { sets: 3, reps: [8, 12] };

test('every program slot references a real exercise', () => {
  for (const p of PROGRAMS) for (const w of p.workouts) for (const s of w.slots) assert.ok(EX[s.ex], `${p.id}/${w.id}: ${s.ex}`);
});

test('every exercise has poses, cues and at least one alternative', () => {
  for (const e of EXERCISES) {
    assert.ok(e.fig.p0 && e.fig.p1, e.id);
    assert.ok(e.cues.length >= 3, e.id);
    assert.ok(alternatives(e.id).length >= 1, e.id);
  }
});

test('first time: no weight suggestion', () => {
  const s = suggest([], 'db_bench', target, 2);
  assert.equal(s.kind, 'new');
  assert.equal(s.weight, null);
  assert.equal(s.reps.length, 3);
});

test('double progression: add weight when every set hits the top of the range', () => {
  const s = suggest([session('a', '2026-01-01', 'db_bench', [[20, 12], [20, 12], [20, 12]])], 'db_bench', target, 2);
  assert.equal(s.kind, 'increase');
  assert.equal(s.weight, 22);
  assert.deepEqual(s.reps, [8, 8, 8]);
});

test('double progression: add a rep per set otherwise', () => {
  const s = suggest([session('a', '2026-01-01', 'db_bench', [[20, 10], [20, 9], [20, 8]])], 'db_bench', target, 2);
  assert.equal(s.kind, 'reps');
  assert.equal(s.weight, 20);
  assert.deepEqual(s.reps, [11, 10, 9]);
});

test('reps below the range suggest a lighter weight', () => {
  const s = suggest([session('a', '2026-01-01', 'db_bench', [[30, 5], [30, 5], [30, 4]])], 'db_bench', target, 2);
  assert.equal(s.kind, 'decrease');
  assert.equal(s.weight, 28);
});

test('deload keeps weight and drops reps to the bottom of the range', () => {
  const s = suggest([session('a', '2026-01-01', 'db_bench', [[20, 12], [20, 12]])], 'db_bench', { ...target, deload: true }, 2);
  assert.equal(s.kind, 'deload');
  assert.equal(s.weight, 20);
});

test('mesocycle: deload halves sets, weeks 3–4 add isolation sets', () => {
  const w1 = planWorkout('ul4', 'UA', 1);
  const w3 = planWorkout('ul4', 'UA', 3);
  const w5 = planWorkout('ul4', 'UA', 5);
  const bench = (p) => p.find((x) => x.exId === 'db_bench').sets;
  const lat = (p) => p.find((x) => x.exId === 'lateral_raise').sets;
  assert.equal(bench(w1), 3);
  assert.equal(bench(w3), 3);
  assert.equal(lat(w3), lat(w1) + 1);
  assert.equal(bench(w5), 2);
  assert.ok(w5.every((s) => s.rir === '4+'));
});

test('swaps replace the exercise and use its rep range', () => {
  const p = planWorkout('ul4', 'UA', 1, 'intermediate', { 'ul4:UA:0': 'deficit_pushup' });
  assert.equal(p[0].exId, 'deficit_pushup');
  assert.deepEqual(p[0].reps, EX.deficit_pushup.reps);
});

test('position advances by completed workouts', () => {
  const pos = position({ program: { id: 'ul4', done: 5, meso: 1 } });
  assert.equal(pos.week, 2);
  assert.equal(pos.day, 1);
  assert.equal(pos.workout.id, 'LA');
});

test('planned weekly volume lands in a sensible range for key muscles', () => {
  for (const p of PROGRAMS) {
    const v = plannedWeeklySets(p.id, 1, 'intermediate', {});
    for (const m of ['chest', 'lats', 'quads', 'hamstrings', 'glutes']) {
      assert.ok(v[m] >= 6 && v[m] <= 24, `${p.id} ${m}=${v[m]}`);
    }
  }
});

test('PR detection compares against earlier sessions', () => {
  const s1 = session('a', '2026-01-01T10:00:00Z', 'db_bench', [[20, 10]]);
  const s2 = session('b', '2026-01-03T10:00:00Z', 'db_bench', [[22, 10]]);
  assert.equal(sessionStats(s1, [s1, s2]).prs.length, 0);
  assert.equal(sessionStats(s2, [s1, s2]).prs.length, 1);
});

test('e1rm and unit conversion', () => {
  assert.equal(e1rm(30, 0), 0);
  assert.ok(Math.abs(e1rm(100, 10) - 133.33) < 0.01);
  assert.ok(Math.abs(fromKg(toKg(45, 'lb'), 'lb') - 45) < 1e-9);
});

test('week streak counts consecutive weeks hitting the target', () => {
  const ref = new Date('2026-03-18T12:00:00'); // Wednesday
  const days = ['2026-03-02', '2026-03-04', '2026-03-09', '2026-03-11', '2026-03-16'];
  const ss = days.map((d, i) => ({ id: String(i), date: `${d}T10:00:00`, exercises: [] }));
  assert.equal(weekStreak(ss, 2, ref), 2);
});

test('paused time is excluded from elapsed time and session duration', () => {
  const start = Date.parse('2026-01-01T10:00:00Z');
  const w = { date: new Date(start).toISOString(), pausedMs: 5 * 60000 };
  assert.equal(elapsedMs(w, start + 20 * 60000), 15 * 60000);
  // currently paused since minute 18: clock stays frozen at 13 min
  assert.equal(elapsedMs({ ...w, pausedAt: start + 18 * 60000 }, start + 30 * 60000), 13 * 60000);
  const s = { id: 'x', date: w.date, end: new Date(start + 50 * 60000).toISOString(), pausedMs: 10 * 60000, exercises: [] };
  assert.equal(sessionStats(s, [s]).minutes, 40);
});
