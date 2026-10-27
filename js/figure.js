// Pose-based exercise illustrations.
// Each exercise defines two poses (p0 = start, p1 = end of the concentric
// phase). A pose is a small set of joint angles / anchor points that is
// resolved with forward + 2-bone inverse kinematics, so limbs keep their
// length while animating and feet/hands can stay planted.

const NS = 'http://www.w3.org/2000/svg';
const RAD = Math.PI / 180;
const LEN = { torso: 50, neck: 17, ua: 29, fa: 26, th: 43, sh: 42, ft: 16 };
const GROUND = 190;
const BENCH_Y = 147;

const dir = (a, l = 1) => [Math.cos(a * RAD) * l, Math.sin(a * RAD) * l];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
const angle = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) / RAD;

function ik(p, t, l1, l2, bend = 1) {
  const dx = t[0] - p[0], dy = t[1] - p[1];
  let d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(l1 - l2) + 1e-3, Math.min(d, l1 + l2 - 1e-3));
  const base = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const a1 = base + bend * a;
  const j = [p[0] + Math.cos(a1) * l1, p[1] + Math.sin(a1) * l1];
  const a2 = Math.atan2(t[1] - j[1], t[0] - j[0]);
  return { j, end: [j[0] + Math.cos(a2) * l2, j[1] + Math.sin(a2) * l2], a2: a2 / RAD };
}

function lerp(a, b, t) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => lerp(v, b[i], t));
  return t < 0.5 ? a : b;
}

export function lerpPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = lerp(a[k], b[k], t);
  return out;
}

const mirrorA = (a) => (a == null ? a : a.map((v, i) => (i < 3 ? 180 - v : v)));

function limb(root, angles, scale, target, bend, l1, l2, at) {
  if (target) {
    const r = ik(root, target, l1 * scale[0], l2 * scale[1], bend);
    return { j: r.j, end: r.end, a2: r.a2 };
  }
  const j = add(root, dir(angles[0], l1 * scale[0]));
  return { j, end: add(j, dir(angles[1], l2 * scale[1])), a2: angles[1] };
}

// Resolve an (interpolated) pose spec into drawable joint positions.
export function resolve(s) {
  const front = s.view === 'front';
  const hip = s.hip;
  const t = s.sh ? angle(hip, s.sh) : s.t;
  const shC = add(hip, dir(t, LEN.torso * (s.tl ?? 1)));
  const head = add(shC, dir(t + (s.hd || 0), LEN.neck * (s.tl ?? 1)));
  const n = dir(t + 90);
  let shN = shC, shF = shC, hipN = hip, hipF = hip;
  if (front) {
    shN = add(shC, [n[0] * 17, n[1] * 17]);
    shF = add(shC, [-n[0] * 17, -n[1] * 17]);
    hipN = add(hip, [n[0] * 9, n[1] * 9]);
    hipF = add(hip, [-n[0] * 9, -n[1] * 9]);
  }
  if (s.shr) { shN = [shN[0], shN[1] - s.shr]; shF = [shF[0], shF[1] - s.shr]; }
  const cx = hip[0];
  const mirX = (p) => (p ? [2 * cx - p[0], p[1]] : p);

  // legs
  const legSpec = (far) => {
    if (!far) return { l: s.l, ll: s.ll || [1, 1, 1], ankle: s.ankle, ft: s.ft, kb: s.kb ?? -1 };
    if (s.l2 || s.ankle2) return { l: s.l2, ll: s.ll2 || s.ll || [1, 1, 1], ankle: s.ankle2, ft: s.ft2 ?? s.ft, kb: s.kb2 ?? s.kb ?? -1 };
    if (front) return { l: mirrorA(s.l), ll: s.ll || [1, 1, 1], ankle: mirX(s.ankle), ft: s.ft == null ? s.ft : 180 - s.ft, kb: -(s.kb ?? -1) };
    return legSpec(false);
  };
  const legs = [false, true].map((far) => {
    const L = legSpec(far);
    const root = far ? hipF : hipN;
    const r = limb(root, L.l, L.ll, L.ankle, L.kb, LEN.th, LEN.sh);
    const ftA = L.ft ?? (L.l ? L.l[2] : 0);
    const toe = add(r.end, dir(ftA, LEN.ft * (L.ll[2] ?? 1)));
    return { hip: root, knee: r.j, ankle: r.end, toe };
  });
  const pts = { hip, knee: legs[0].knee, ankle: legs[0].ankle, toe: legs[0].toe, sh: shN };

  const armSpec = (far) => {
    const at = s.handAt ? add(pts[s.handAt], s.handOff || [0, 0]) : null;
    if (!far) return { a: s.a, al: s.al || [1, 1], hand: s.hand || at, eb: s.eb ?? 1 };
    if (s.a2 || s.hand2) return { a: s.a2, al: s.al2 || [1, 1], hand: s.hand2, eb: s.eb2 ?? s.eb ?? 1 };
    if (front) return { a: mirrorA(s.a), al: s.al || [1, 1], hand: mirX(s.hand || at), eb: -(s.eb ?? 1) };
    return armSpec(false);
  };
  const arms = [false, true].map((far) => {
    const A = armSpec(far);
    const root = far ? shF : shN;
    const r = limb(root, A.a, A.al, A.hand, A.eb, LEN.ua, LEN.fa);
    return { sh: root, el: r.j, wr: r.end, fa: r.a2 };
  });

  return { front, t, hip, shC, head, shN, shF, hipN, hipF, legs, arms, hd: s.hd || 0 };
}

// ---------------------------------------------------------------- drawing
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function propsMarkup(fig) {
  let out = '';
  if (fig.ground !== false) out += `<line class="fg-ground" x1="6" y1="${GROUND}" x2="214" y2="${GROUND}"/>`;
  for (const p of fig.props || []) out += propMarkup(p);
  return out;
}

function line(a, b, cls, w) {
  return `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"${w ? ` stroke-width="${w}"` : ''}/>`;
}

function propMarkup(p) {
  const y = p.y ?? BENCH_Y;
  if (p.type === 'flat') {
    const { x, w } = p;
    return `<g class="fg-bench">
      ${line([x + 16, y + 6], [x + 16, GROUND - 2], 'fg-frame', 5)}
      ${line([x + w - 16, y + 6], [x + w - 16, GROUND - 2], 'fg-frame', 5)}
      ${line([x + 6, GROUND - 2], [x + 26, GROUND - 2], 'fg-frame', 4)}
      ${line([x + w - 26, GROUND - 2], [x + w - 6, GROUND - 2], 'fg-frame', 4)}
      <rect class="fg-pad" x="${x}" y="${y}" width="${w}" height="8" rx="4"/></g>`;
  }
  if (p.type === 'incline') {
    const a = p.a, d = p.dir ?? -1, len = p.len ?? 82, seat = p.seat ?? 34;
    const u = d < 0 ? dir(180 + a) : dir(-a);
    let nrm = [-u[1], u[0]];
    if (nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
    const P = [p.x, y];
    const E = add(P, [u[0] * len, u[1] * len]);
    const o = (q, k) => add(q, [nrm[0] * k, nrm[1] * k]);
    const sx = p.x - d * seat;
    const mid = add(P, [u[0] * len * 0.55, u[1] * len * 0.55]);
    const footA = Math.min(p.x, sx) - 6, footB = Math.max(p.x, sx) + 6;
    const strutFoot = [mid[0] + d * 0, GROUND - 2];
    return `<g class="fg-bench">
      ${line([(p.x + sx) / 2, y + 6], [(p.x + sx) / 2, GROUND - 2], 'fg-frame', 5)}
      ${line(o(mid, 7), strutFoot, 'fg-frame', 4)}
      ${line([Math.min(footA, strutFoot[0] - 8), GROUND - 2], [Math.max(footB, strutFoot[0] + 8), GROUND - 2], 'fg-frame', 4)}
      ${line(o(P, 4), o(E, 4), 'fg-padl', 8)}
      ${line([p.x, y + 4], [sx, y + 4], 'fg-padl', 8)}</g>`;
  }
  if (p.type === 'frontSeat') {
    const { x } = p;
    const top = p.top ?? 62;
    return `<g class="fg-bench">
      <rect class="fg-pad" x="${x - 16}" y="${top}" width="32" height="${y - top}" rx="5"/>
      ${line([x - 22, y + 6], [x - 22, GROUND - 2], 'fg-frame', 5)}
      ${line([x + 22, y + 6], [x + 22, GROUND - 2], 'fg-frame', 5)}
      <rect class="fg-pad" x="${x - 28}" y="${y}" width="56" height="9" rx="4"/></g>`;
  }
  if (p.type === 'top') {
    const w = p.w ?? 34;
    return `<g class="fg-bench"><rect class="fg-pad" x="${p.x - w / 2}" y="${p.y1}" width="${w}" height="${p.y2 - p.y1}" rx="6"/>
      ${line([p.x, p.y1 + 8], [p.x, p.y2 - 8], 'fg-seam', 1.5)}</g>`;
  }
  if (p.type === 'step') {
    return `<rect class="fg-step" x="${p.x}" y="${GROUND - p.h}" width="${p.w}" height="${p.h}" rx="2"/>`;
  }
  return '';
}

const SEG_W = { ua: 10.5, fa: 8.5, th: 15, sh: 11, ft: 7 };

function buildFigure(svg, fig, cls = '') {
  const g = el('g', { class: `fg-body ${cls}` }, svg);
  const front = fig.p0.view === 'front';
  const hl = new Set(fig.hl || []);
  const mk = (seg, far, side) => el('line', {
    class: `fg-seg ${far ? 'fg-far' : 'fg-near'}${hl.has(seg) && !(side && fig.hlNear) ? ' fg-hl' : ''}`,
    'stroke-width': SEG_W[seg],
  });
  const parts = { legs: [], arms: [] };
  for (const far of [false, true]) {
    const f = far && !front;
    parts.legs.push({ th: mk('th', f, far), sh: mk('sh', f, far), ft: mk('ft', f, far) });
    const db = fig.p0.db && !(far && fig.p0.db2 === false);
    const dbg = db ? el('g', { class: `fg-db ${far && !front ? 'fg-far' : ''}` }) : null;
    if (dbg) {
      if (fig.p0.db === 'end') {
        el('circle', { r: 7.5, class: 'fg-plate' }, dbg);
        el('circle', { r: 2.6, class: 'fg-hub' }, dbg);
      } else {
        el('line', { x1: -8, y1: 0, x2: 8, y2: 0, class: 'fg-handle' }, dbg);
        el('rect', { x: -12, y: -7.5, width: 5.5, height: 15, rx: 1.6, class: 'fg-plate' }, dbg);
        el('rect', { x: 6.5, y: -7.5, width: 5.5, height: 15, rx: 1.6, class: 'fg-plate' }, dbg);
      }
    }
    parts.arms.push({
      ua: mk('ua', f, far), fa: mk('fa', f, far),
      hand: el('circle', { r: 4.3, class: `fg-hand ${far && !front ? 'fg-far' : 'fg-near'}` }), db: dbg,
    });
  }
  parts.torso = el('path', { class: `fg-torso${hl.has('torso') ? ' fg-hl' : ''}` });
  parts.neck = el('line', { class: 'fg-neck', 'stroke-width': 9 });
  parts.head = el('circle', { r: 10.5, class: 'fg-head' });
  parts.eyes = [el('circle', { r: 1.6, class: 'fg-eye' }), el('circle', { r: 1.6, class: 'fg-eye' })];

  const bench = el('g', {});
  bench.innerHTML = propsMarkup(fig);
  const benchBack = front || fig.benchBack;
  const add2 = (...es) => es.forEach((e) => e && g.appendChild(e));
  const legEls = (L) => [L.th, L.sh, L.ft];
  const armEls = (A) => [A.ua, A.fa, A.hand, A.db];
  if (benchBack) svg.insertBefore(bench, g);
  if (front) {
    add2(...legEls(parts.legs[1]), ...legEls(parts.legs[0]), parts.neck, parts.torso, parts.head, ...parts.eyes);
    add2(...armEls(parts.arms[1]), ...armEls(parts.arms[0]));
  } else {
    add2(...legEls(parts.legs[1]), ...armEls(parts.arms[1]));
    if (!benchBack) g.appendChild(bench);
    add2(parts.neck, parts.torso, parts.head, ...parts.eyes, ...legEls(parts.legs[0]), ...armEls(parts.arms[0]));
  }

  const setLine = (e, a, b) => {
    e.setAttribute('x1', a[0].toFixed(1)); e.setAttribute('y1', a[1].toFixed(1));
    e.setAttribute('x2', b[0].toFixed(1)); e.setAttribute('y2', b[1].toFixed(1));
  };

  return function update(spec) {
    const r = resolve(spec);
    r.legs.forEach((L, i) => {
      setLine(parts.legs[i].th, L.hip, L.knee);
      setLine(parts.legs[i].sh, L.knee, L.ankle);
      setLine(parts.legs[i].ft, L.ankle, L.toe);
    });
    r.arms.forEach((A, i) => {
      const P = parts.arms[i];
      setLine(P.ua, A.sh, A.el);
      setLine(P.fa, A.el, A.wr);
      P.hand.setAttribute('cx', A.wr[0].toFixed(1));
      P.hand.setAttribute('cy', A.wr[1].toFixed(1));
      if (P.db) {
        let pos = A.wr;
        let a = spec.dbA ?? (spec.db === 'along' ? A.fa : A.fa + 90);
        if (spec.dbAt === 'foot') { const L = r.legs[i]; pos = L.toe; a = angle(L.ankle, L.toe) + 90; }
        if (spec.dbOff) pos = add(pos, spec.dbOff);
        P.db.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)}) rotate(${a.toFixed(1)})`);
      }
    });
    // torso
    const u = dir(r.t), n = [-u[1], u[0]];
    let pts;
    if (r.front) {
      const k = (p, s) => add(p, [n[0] * s, n[1] * s]);
      const shrY = spec.shr || 0;
      const sN = add(k(r.shC, -20), [0, 0]), sF = k(r.shC, 20);
      pts = [k(r.hip, -13), add(sN, [0, -shrY]), add(sF, [0, -shrY]), k(r.hip, 13)];
      // waist taper
      const wN = k(add(r.hip, dir(r.t, 22 * (spec.tl ?? 1))), -15.5), wF = k(add(r.hip, dir(r.t, 22 * (spec.tl ?? 1))), 15.5);
      pts = [pts[0], wN, pts[1], pts[2], wF, pts[3]];
    } else {
      const k = (p, s) => add(p, [n[0] * s, n[1] * s]);
      const chest = add(r.hip, dir(r.t, 34 * (spec.tl ?? 1)));
      pts = [k(r.hip, -9.5), k(chest, -11.5), k(r.shC, -9), k(r.shC, 9), k(chest, 11), k(r.hip, 10)];
    }
    parts.torso.setAttribute('d', 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z');
    setLine(parts.neck, r.shC, r.head);
    parts.head.setAttribute('cx', r.head[0].toFixed(1));
    parts.head.setAttribute('cy', r.head[1].toFixed(1));
    // face cue
    const face = spec.face ?? (r.front ? 'front' : 1);
    const hu = dir(r.t + r.hd);
    if (face === 'front') {
      const hn = [-hu[1], hu[0]];
      [-1, 1].forEach((sgn, i) => {
        const p = add(r.head, [hu[0] * 2 + hn[0] * 3.8 * sgn, hu[1] * 2 + hn[1] * 3.8 * sgn]);
        parts.eyes[i].setAttribute('cx', p[0].toFixed(1)); parts.eyes[i].setAttribute('cy', p[1].toFixed(1));
        parts.eyes[i].style.display = '';
      });
    } else if (face === 'back') {
      parts.eyes.forEach((e) => (e.style.display = 'none'));
    } else {
      const fd = dir(r.t + r.hd + 90 * face);
      const p = add(r.head, [fd[0] * 5.5 + hu[0] * 2.5, fd[1] * 5.5 + hu[1] * 2.5]);
      parts.eyes[0].setAttribute('cx', p[0].toFixed(1)); parts.eyes[0].setAttribute('cy', p[1].toFixed(1));
      parts.eyes[0].style.display = '';
      parts.eyes[1].style.display = 'none';
    }
  };
}

const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
// timeline: hold start, concentric (1s), hold top, eccentric (2s)
const PHASES = [600, 1000, 450, 2000];
const CYCLE = PHASES.reduce((a, b) => a + b, 0);

function phaseT(ms) {
  let t = ms % CYCLE;
  if (t < PHASES[0]) return 0;
  t -= PHASES[0];
  if (t < PHASES[1]) return ease(t / PHASES[1]);
  t -= PHASES[1];
  if (t < PHASES[2]) return 1;
  t -= PHASES[2];
  return 1 - ease(t / PHASES[3]);
}

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Mount an exercise illustration into `container`.
 * mode: 'animate' | 'static' (ghosted start pose + solid end pose)
 */
export function mountFigure(container, exercise, { mode = 'animate', label } = {}) {
  const fig = exercise.fig;
  container.innerHTML = '';
  const svg = el('svg', {
    viewBox: fig.vb || '0 0 220 200', class: 'figure', role: 'img',
    'aria-label': label || `Illustration of ${exercise.name}`,
  }, container);
  if (mode === 'static' || reducedMotion()) {
    const ghost = buildFigure(svg, fig, 'fg-ghost');
    ghost(fig.p0);
    // props are drawn once; remove the duplicate set from the second build
    const main = buildFigure(svg, { ...fig, props: [], ground: false }, '');
    main(fig.p1);
    return { destroy() { container.innerHTML = ''; } };
  }
  const update = buildFigure(svg, fig);
  let raf = 0, visible = true, start = performance.now() - PHASES[0] * 0.5;
  update(fig.p0);
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    update(lerpPose(fig.p0, fig.p1, phaseT(now - start)));
    raf = requestAnimationFrame(frame);
  };
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(svg);
  }
  raf = requestAnimationFrame(frame);
  return {
    destroy() { cancelAnimationFrame(raf); io && io.disconnect(); container.innerHTML = ''; },
  };
}
