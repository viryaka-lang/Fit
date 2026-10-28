// Pure training logic: scheduling, progression and stats. No DOM access, so
// it can be unit-tested in Node.
import { EX, TRACKED } from './data/exercises.js';
import { PROGRAM, MESO } from './data/programs.js';

export const LB = 0.45359237;
export const toKg = (w, unit) => (unit === 'lb' ? w * LB : w);
export const fromKg = (kg, unit) => (unit === 'lb' ? kg / LB : kg);
export const round = (n, step = 0.25) => Math.round(n / step) * step;
export function fmtW(kg, unit) {
  if (kg == null || Number.isNaN(kg)) return '—';
  const v = round(fromKg(kg, unit), unit === 'lb' ? 0.5 : 0.25);
  return `${+v.toFixed(2)}`;
}

export const slotKey = (pid, wid, i) => `${pid}:${wid}:${i}`;

export function setsFor(slot, week, level) {
  const ex = EX[slot.ex];
  let n = slot.sets;
  if (level === 'beginner' && n >= 3) n -= 1;
  const m = MESO[week - 1];
  if (m.deload) return Math.max(1, Math.ceil(n / 2));
  if (ex.type === 'isolation' && level !== 'beginner') n += m.extraIso;
  return n;
}

export function planWorkout(programId, workoutId, week, level = 'intermediate', swaps = {}) {
  const p = PROGRAM[programId];
  const w = p.workouts.find((x) => x.id === workoutId);
  const m = MESO[week - 1];
  return w.slots.map((slot, i) => {
    const exId = swaps[slotKey(programId, workoutId, i)] || slot.ex;
    const ex = EX[exId];
    return {
      slot: i,
      exId,
      sets: setsFor({ ...slot, ex: exId }, week, level),
      reps: slot.reps && exId === slot.ex ? slot.reps : ex.reps,
      rir: m.rir,
      rest: ex.rest,
    };
  });
}

// Where are we in the mesocycle? Progress advances per completed workout,
// so missed days never break the plan.
export function position(state) {
  const p = PROGRAM[state.program.id];
  const done = state.program.done || 0;
  const week = Math.min(MESO.length, Math.floor(done / p.days) + 1);
  const day = done % p.days;
  return { program: p, week, day, meso: state.program.meso || 1, done, total: p.days * MESO.length, workout: p.workouts[day], phase: MESO[week - 1] };
}

export function estimateMinutes(plan) {
  let sec = 300; // warm-up
  for (const s of plan) sec += s.sets * (40 + s.rest) + 60;
  return Math.round(sec / 60 / 5) * 5;
}

// ------------------------------------------------------------ progression
export const doneSets = (entry) => (entry?.sets || []).filter((s) => s.done && s.r > 0);

export function lastEntry(sessions, exId, beforeId) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.id === beforeId) continue;
    for (const e of s.exercises) if (e.exId === exId && doneSets(e).length) return { session: s, entry: e };
  }
  return null;
}

/**
 * Double progression. Returns the suggested weight (kg) and reps per set.
 * target: { sets, reps:[lo,hi], deload }
 * incKg: smallest weight jump in kg (per dumbbell).
 */
export function suggest(sessions, exId, target, incKg, beforeId) {
  const [lo, hi] = target.reps;
  const last = lastEntry(sessions, exId, beforeId);
  const ex = EX[exId];
  if (!last) {
    return {
      kind: 'new', weight: ex.bodyweight ? 0 : null, reps: Array(target.sets).fill(Math.round((lo + hi) / 2)),
      text: ex.bodyweight
        ? `First time — aim for ${lo}–${hi} reps per set.`
        : `First time — choose a weight you could lift ~${hi} times, then stop at ${Math.round((lo + hi) / 2)}–${hi} reps.`,
    };
  }
  const sets = doneSets(last.entry);
  const counts = {};
  for (const s of sets) counts[s.w] = (counts[s.w] || 0) + 1;
  // working weight = the heaviest weight used for at least half the sets (fallback: heaviest)
  const weights = Object.keys(counts).map(Number).sort((a, b) => b - a);
  const w = weights.find((x) => counts[x] >= sets.length / 2) ?? weights[0];
  const atW = sets.filter((s) => s.w === w);
  const prev = { weight: w, reps: atW.map((s) => s.r), date: last.session.date };

  if (target.deload) {
    return { kind: 'deload', weight: w, reps: Array(target.sets).fill(lo), prev, text: `Deload — same weight, ${lo} easy reps. Leave plenty in the tank.` };
  }
  const allTop = atW.length >= Math.min(target.sets, sets.length) && atW.every((s) => s.r >= hi);
  if (allTop) {
    if (ex.bodyweight && w === 0) {
      return { kind: 'increase', weight: 0, reps: Array(target.sets).fill(hi), prev, text: `You topped the range. Add load (dumbbell/backpack) or slow the lowering to 3–4 s.` };
    }
    return { kind: 'increase', weight: w + incKg, reps: Array(target.sets).fill(lo), prev, text: `Every set hit ${hi} reps — time to go heavier.` };
  }
  const avg = atW.reduce((a, s) => a + s.r, 0) / atW.length;
  if (avg < lo - 1 && w - incKg > 0) {
    return { kind: 'decrease', weight: w - incKg, reps: Array(target.sets).fill(lo), prev, text: `Last time fell below ${lo} reps — drop slightly and own the range.` };
  }
  const reps = Array.from({ length: target.sets }, (_, i) => {
    const r = atW[i]?.r ?? atW[atW.length - 1].r;
    return Math.min(hi, Math.max(lo, r + 1));
  });
  return { kind: 'reps', weight: w, reps, prev, text: `Same weight — beat last time by one rep per set.` };
}

// ------------------------------------------------------------------- stats
export const e1rm = (w, r) => (r > 0 ? w * (1 + Math.min(r, 20) / 30) : 0);

export function bestSet(sets) {
  let best = null;
  for (const s of sets) {
    const v = e1rm(s.w, s.r);
    if (!best || v > best.v || (v === best.v && s.r > best.r)) best = { ...s, v };
  }
  return best;
}

export function exerciseHistory(sessions, exId) {
  const out = [];
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.exId !== exId) continue;
      const sets = doneSets(e);
      if (!sets.length) continue;
      const b = bestSet(sets);
      out.push({
        date: s.date, sessionId: s.id, e1rm: b.v, top: { w: b.w, r: b.r },
        volume: sets.reduce((a, x) => a + x.w * x.r, 0), reps: sets.reduce((a, x) => a + x.r, 0), sets: sets.length,
      });
    }
  }
  return out;
}

export function sessionStats(session, allSessions) {
  let sets = 0, volume = 0, reps = 0;
  const prs = [];
  const muscles = {};
  const before = allSessions.filter((s) => s.id !== session.id && s.date < session.date);
  for (const e of session.exercises) {
    const ds = doneSets(e);
    if (!ds.length) continue;
    sets += ds.length;
    reps += ds.reduce((a, s) => a + s.r, 0);
    volume += ds.reduce((a, s) => a + s.w * s.r, 0);
    addMuscles(muscles, e.exId, ds.length);
    const prevBest = exerciseHistory(before, e.exId).reduce((m, h) => Math.max(m, EX[e.exId].bodyweight && !h.top.w ? h.top.r : h.e1rm), 0);
    const b = bestSet(ds);
    const val = EX[e.exId].bodyweight && !b.w ? b.r : b.v;
    if (prevBest > 0 && val > prevBest + 1e-6) prs.push({ exId: e.exId, w: b.w, r: b.r });
  }
  const dur = session.end ? Math.max(1, Math.round((new Date(session.end) - new Date(session.date) - (session.pausedMs || 0)) / 60000)) : 0;
  return { sets, volume, reps, prs, muscles, minutes: dur };
}

// Active training time of a workout in ms, excluding time spent paused.
export function elapsedMs(w, now = Date.now()) {
  const end = w.end ? new Date(w.end).getTime() : now;
  const paused = (w.pausedMs || 0) + (w.pausedAt ? end - w.pausedAt : 0);
  return Math.max(0, end - new Date(w.date).getTime() - paused);
}

export function addMuscles(acc, exId, n) {
  const ex = EX[exId];
  for (const m of ex.primary) acc[m] = (acc[m] || 0) + n;
  for (const m of ex.secondary) acc[m] = (acc[m] || 0) + n * 0.5;
  return acc;
}

export function plannedWeeklySets(programId, week, level, swaps) {
  const acc = {};
  for (const w of PROGRAM[programId].workouts) {
    for (const s of planWorkout(programId, w.id, week, level, swaps)) addMuscles(acc, s.exId, s.sets);
  }
  return Object.fromEntries(TRACKED.map((m) => [m, acc[m] || 0]));
}

export function weekStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function weeklySets(sessions, ref = new Date()) {
  const start = weekStart(ref).getTime();
  const end = start + 7 * 864e5;
  const acc = {};
  for (const s of sessions) {
    const t = new Date(s.date).getTime();
    if (t < start || t >= end) continue;
    for (const e of s.exercises) {
      const n = doneSets(e).length;
      if (n) addMuscles(acc, e.exId, n);
    }
  }
  return Object.fromEntries(TRACKED.map((m) => [m, acc[m] || 0]));
}

// Count of completed workouts per ISO week for the last `weeks` weeks (oldest first).
export function weeklyCounts(sessions, weeks = 16, ref = new Date()) {
  const ws = weekStart(ref).getTime();
  const out = Array.from({ length: weeks }, (_, i) => ({ start: new Date(ws - (weeks - 1 - i) * 7 * 864e5), n: 0 }));
  for (const s of sessions) {
    const idx = weeks - 1 - Math.floor((ws - weekStart(s.date).getTime()) / (7 * 864e5));
    if (idx >= 0 && idx < weeks) out[idx].n++;
  }
  return out;
}

// Consecutive weeks (ending this or last week) with at least `target` sessions.
export function weekStreak(sessions, target, ref = new Date()) {
  const counts = weeklyCounts(sessions, 104, ref);
  let i = counts.length - 1;
  if (counts[i].n < target) i--; // current week still in progress
  let n = 0;
  for (; i >= 0 && counts[i].n >= target; i--) n++;
  return n;
}
