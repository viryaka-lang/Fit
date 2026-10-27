// Training programs for an adjustable bench + dumbbells.
// Every muscle is trained ~2×/week with ~10–20 weekly hard sets, which is
// where the dose-response evidence for hypertrophy is strongest.

const s = (ex, sets, reps) => ({ ex, sets, ...(reps ? { reps } : {}) });

export const PROGRAMS = [
  {
    id: 'fb3',
    name: 'Full Body',
    days: 3,
    tagline: '3 days · ~50 min',
    schedule: 'e.g. Mon · Wed · Fri',
    description: 'Every major muscle 3× per week with moderate per-session volume. Best if you are newer to lifting or short on days.',
    workouts: [
      {
        id: 'A', name: 'Full Body A', focus: 'Chest · Back · Quads · Hams',
        slots: [s('db_bench', 3, [6, 10]), s('one_arm_row', 3), s('goblet_squat', 3), s('rdl', 3), s('lateral_raise', 3), s('oh_ext', 2)],
      },
      {
        id: 'B', name: 'Full Body B', focus: 'Upper chest · Upper back · Legs · Arms',
        slots: [s('incline_press', 3), s('cs_row', 3), s('bulgarian', 3), s('leg_curl', 3), s('incline_curl', 3), s('calf_raise', 3)],
      },
      {
        id: 'C', name: 'Full Body C', focus: 'Shoulders · Lats · Glutes · Arms',
        slots: [s('seated_press', 3), s('pullover', 2), s('db_fly', 2), s('hip_thrust', 3), s('step_up', 2), s('lateral_raise', 2), s('hammer_curl', 2), s('skull_crusher', 2)],
      },
    ],
  },
  {
    id: 'ul4',
    name: 'Upper / Lower',
    days: 4,
    tagline: '4 days · ~55 min',
    schedule: 'e.g. Mon · Tue · Thu · Fri',
    description: 'The best all-round split for most lifters: each muscle twice a week, enough recovery between sessions, and room for more volume.',
    recommended: true,
    workouts: [
      {
        id: 'UA', name: 'Upper A', focus: 'Chest · Lats · Delts · Arms',
        slots: [s('db_bench', 3, [6, 10]), s('one_arm_row', 3), s('seated_press', 2), s('lateral_raise', 3), s('rear_delt', 2), s('incline_curl', 3), s('oh_ext', 3)],
      },
      {
        id: 'LA', name: 'Lower A', focus: 'Quads · Hamstrings · Calves',
        slots: [s('goblet_squat', 3), s('rdl', 3), s('bulgarian', 2), s('leg_curl', 3), s('calf_raise', 3), s('leg_raise', 2)],
      },
      {
        id: 'UB', name: 'Upper B', focus: 'Upper chest · Upper back · Delts · Arms',
        slots: [s('incline_press', 3), s('cs_row', 3), s('db_fly', 2), s('pullover', 2), s('rear_delt', 2), s('lateral_raise', 3), s('hammer_curl', 2), s('skull_crusher', 2)],
      },
      {
        id: 'LB', name: 'Lower B', focus: 'Glutes · Quads · Hamstrings',
        slots: [s('bulgarian', 3), s('hip_thrust', 3), s('step_up', 2), s('leg_curl', 3), s('seated_calf', 3), s('leg_raise', 2)],
      },
    ],
  },
  {
    id: 'ulppl5',
    name: 'Upper / Lower + PPL',
    days: 5,
    tagline: '5 days · ~50 min',
    schedule: 'e.g. Mon · Tue · Wed · Fri · Sat',
    description: 'Higher weekly volume for experienced lifters who recover well. Each muscle is still hit twice a week.',
    workouts: [
      {
        id: 'U', name: 'Upper', focus: 'Upper chest · Lats · Delts · Arms',
        slots: [s('incline_press', 3), s('one_arm_row', 3), s('seated_press', 2), s('lateral_raise', 3), s('hammer_curl', 2), s('oh_ext', 2)],
      },
      {
        id: 'L', name: 'Lower', focus: 'Quads · Hamstrings · Calves',
        slots: [s('goblet_squat', 3), s('rdl', 3), s('leg_curl', 3), s('calf_raise', 3), s('leg_raise', 2)],
      },
      {
        id: 'PU', name: 'Push', focus: 'Chest · Shoulders · Triceps',
        slots: [s('db_bench', 3, [6, 10]), s('seated_press', 3), s('db_fly', 3), s('lateral_raise', 3), s('skull_crusher', 3)],
      },
      {
        id: 'PL', name: 'Pull', focus: 'Back · Rear delts · Biceps',
        slots: [s('cs_row', 3), s('pullover', 3), s('rear_delt', 3), s('shrug', 2), s('incline_curl', 3), s('spider_curl', 2)],
      },
      {
        id: 'LG', name: 'Legs', focus: 'Glutes · Quads · Hamstrings',
        slots: [s('bulgarian', 3), s('hip_thrust', 3), s('step_up', 2), s('leg_curl', 3), s('seated_calf', 3)],
      },
    ],
  },
];

export const PROGRAM = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

// 5-week mesocycle: effort ramps up (fewer reps in reserve), then a deload.
export const MESO = [
  { week: 1, label: 'Base', rir: '3', rirNum: 3, extraIso: 0, note: 'Find your working weights. Stop each set with ~3 reps left in the tank.' },
  { week: 2, label: 'Build', rir: '2', rirNum: 2, extraIso: 0, note: 'Add a rep or a little weight. ~2 reps in reserve.' },
  { week: 3, label: 'Build', rir: '1–2', rirNum: 1.5, extraIso: 1, note: 'One extra set on isolation lifts. 1–2 reps in reserve.' },
  { week: 4, label: 'Peak', rir: '0–1', rirNum: 0.5, extraIso: 1, note: 'Hardest week: last set of each exercise close to failure.' },
  { week: 5, label: 'Deload', rir: '4+', rirNum: 4, deload: true, extraIso: 0, note: 'Half the sets, same weights, easy effort. Recover so the next block can push harder.' },
];

export const SCIENCE = [
  {
    title: 'Volume: 10–20 hard sets per muscle per week',
    body: 'Muscle growth rises with weekly set volume, with diminishing returns at the high end. Most lifters grow well on roughly 10–20 sets per muscle per week; this plan sits in that range and adds isolation sets as the block progresses.',
    refs: ['Schoenfeld et al., 2017 — J Sports Sci (dose-response meta-analysis)', 'Pelland et al., 2024 — SportRxiv (volume & frequency meta-regression)'],
  },
  {
    title: 'Frequency: each muscle twice a week',
    body: 'Splitting weekly volume across at least two sessions performs at least as well as once-a-week "bro splits", and keeps each session\'s quality high.',
    refs: ['Schoenfeld et al., 2016 — Sports Med (training frequency meta-analysis)'],
  },
  {
    title: 'Effort: finish sets 0–3 reps from failure',
    body: 'Hypertrophy depends on sets being genuinely hard. Training close to failure (but not always to it) gives nearly all the growth with less fatigue. Reps in reserve (RIR) decrease across the block.',
    refs: ['Refalo et al., 2023 — Sports Med (proximity to failure)', 'Robinson et al., 2024 — Sports Med (RIR dose-response)'],
  },
  {
    title: 'Rep ranges: anywhere from ~6 to 30 works',
    body: 'Light and heavy loads build similar muscle when taken close to failure. We use 6–12 reps on big lifts for efficiency and 10–20 on isolation work, which suits dumbbells perfectly.',
    refs: ['Schoenfeld et al., 2017 — J Strength Cond Res (low vs high load)', 'Lopez et al., 2021 — MSSE (load meta-analysis)'],
  },
  {
    title: 'Long muscle lengths: prioritise the stretch',
    body: 'Exercises that load a muscle in its lengthened position (incline curls, overhead extensions, RDLs, deep squats, flyes) tend to produce more growth. Exercise choices and cues emphasise a full, controlled stretch.',
    refs: ['Maeo et al., 2021 & 2023 — overhead vs neutral triceps / seated vs prone curls', 'Pedrosa et al., 2022 — Eur J Sport Sci (lengthened partials)', 'Kubo et al., 2019 — Eur J Appl Physiol (squat depth)'],
  },
  {
    title: 'Progressive overload: double progression',
    body: 'Work within a rep range. When every set reaches the top of the range at the target effort, add the smallest weight increment and start again at the bottom. The app does this maths for you.',
    refs: ['Plotkin et al., 2022 — PeerJ (load vs rep progression)'],
  },
  {
    title: 'Rest 1.5–3 minutes',
    body: 'Longer rest between sets preserves performance and total volume, which improves growth compared with very short rests — especially on compound lifts.',
    refs: ['Schoenfeld et al., 2016 — J Strength Cond Res (rest intervals)', 'Singer et al., 2024 — (rest interval meta-analysis)'],
  },
  {
    title: 'Deload every 5th week',
    body: 'A planned easier week dissipates fatigue so you can keep progressing. Volume drops by half while the weights stay the same.',
    refs: ['Bell et al., 2023 — Sports Med Open (deloading practices)'],
  },
];
