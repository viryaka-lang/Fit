# Hypertrophy — bench & dumbbell training (PWA)

An installable, offline-first fitness app for building muscle with only an
**adjustable bench and dumbbells**. It gives you an evidence-based program,
tells you what weight and reps to hit every set, illustrates every exercise,
and tracks your progress.

No build step, no dependencies, no account: plain HTML/CSS/ES modules, and your
data stays on your device (`localStorage`, with JSON export/import).

## Features

- **Three programs** (pick by days per week)
  - 3 days — Full Body A/B/C
  - 4 days — Upper/Lower *(recommended)*
  - 5 days — Upper/Lower + Push/Pull/Legs
- **5-week training blocks**: effort ramps from 3 → 0–1 reps in reserve, isolation
  volume rises in weeks 3–4, then a deload week.
- **Automatic progression (double progression)**: when every set reaches the top
  of the rep range you're told to add the smallest dumbbell jump; otherwise beat
  last time by a rep. Drops the weight if you fell below the range.
- **Guided workout mode**: one exercise at a time, big steppers for weight/reps,
  last-time reference, warm-up sets, auto rest timer with sound, vibration and
  background notification, screen kept awake, swap any exercise.
- **26 illustrated exercises**: animated figures (1 s lift / 2 s lower tempo),
  front/back muscle map, step-by-step cues, common mistakes, the reasoning behind
  each choice, and alternatives.
- **Progress tracking**: estimated 1RM trend per exercise, personal records,
  consistency calendar, weekly hard sets per muscle vs. the 10–20 set target,
  body-weight log, full workout history.
- **PWA**: installable, works fully offline, light/dark themes, respects
  reduced-motion.

## The science behind the plan

| Principle | How the app applies it | Key sources |
|---|---|---|
| Weekly volume drives growth | ~10–20 hard sets / muscle / week (direct = 1, indirect = ½) | Schoenfeld 2017; Pelland 2024 |
| Frequency | Every muscle trained ≥ 2× per week | Schoenfeld 2016 |
| Proximity to failure | Sets end 0–3 reps in reserve, decreasing through the block | Refalo 2023; Robinson 2024 |
| Load / rep range | 6–12 reps for compounds, 10–20 for isolations — all effective near failure | Schoenfeld 2017; Lopez 2021 |
| Long muscle lengths | Stretch-focused choices: incline curls, overhead extensions, RDLs, deep squats, flyes | Maeo 2021/2023; Pedrosa 2022; Kubo 2019 |
| Progressive overload | Double progression | Plotkin 2022 |
| Rest | 1.5–3 min, longer for compounds | Schoenfeld 2016 |
| Fatigue management | Deload every 5th week | Bell 2023 |

The in-app **Plan → The science** section explains each point.

## Run locally

Any static file server works (service workers need `http://localhost` or HTTPS):

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

Tests (Node 20+): `npm test`

`tools/figures.html` renders every exercise's start/end pose side by side —
handy when editing poses in `js/data/exercises.js`.

## Deploy & install

The included GitHub Actions workflow (`.github/workflows/pages.yml`) runs the
tests and deploys to **GitHub Pages** on every push to `main`. Enable it once in
*Settings → Pages → Source: GitHub Actions*. All paths are relative, so it works
from a sub-path like `https://<user>.github.io/<repo>/`.

Install: on Android/desktop Chrome use **Install app**; on iPhone open in Safari →
**Share → Add to Home Screen**.

When you change files, bump `VERSION` in `sw.js` so installed copies update.

## Project layout

```
index.html, manifest.webmanifest, sw.js
css/app.css                 design tokens (light/dark) and all styles
js/app.js                   router, theme, install prompt, SW registration
js/store.js                 persisted state (weights stored in kg)
js/engine.js                pure logic: plan, progression, stats (unit-tested)
js/figure.js                pose renderer: forward + 2-bone IK, animation
js/musclemap.js             front/back muscle map
js/charts.js                SVG line chart with crosshair tooltip
js/data/exercises.js        exercise library, poses, cues
js/data/programs.js         programs, mesocycle, science notes
js/views/*.js               screens
tests/engine.test.js        node:test unit tests
```

*Educational guidance, not medical advice.*
