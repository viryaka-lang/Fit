// Minimal SVG charts: single-series line chart with area wash, end label,
// crosshair + tooltip; rendered responsively into a container.
import { fmtDate } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent && parent.appendChild(e);
  return e;
};

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || step0;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return ticks;
}

/**
 * points: [{ x: Date|string, y: number, label?: string }]
 * opts: { format(y) -> string, height, unit }
 */
export function lineChart(container, points, opts = {}) {
  const fmt = opts.format || ((v) => v.toFixed(1));
  const H = opts.height || 190;
  container.classList.add('chart');
  const draw = () => {
    container.innerHTML = '';
    const W = Math.max(260, container.clientWidth || 320);
    const m = { t: 14, r: 46, b: 26, l: 38 };
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': opts.label || 'Line chart' }, container);
    const pts = points.map((p) => ({ ...p, t: new Date(p.x).getTime() }));
    if (!pts.length) return;
    const ys = pts.map((p) => p.y);
    const ticks = niceTicks(Math.min(...ys) * 0.97, Math.max(...ys) * 1.02);
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    let t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    if (t0 === t1) { t0 -= 864e5 * 3; t1 += 864e5 * 3; }
    const X = (t) => m.l + ((t - t0) / (t1 - t0)) * (W - m.l - m.r);
    const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);

    const grid = mk('g', { class: 'ch-grid' }, svg);
    for (const v of ticks) {
      mk('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }, grid);
      const tx = mk('text', { x: m.l - 6, y: Y(v) + 3.5, class: 'ch-tick', 'text-anchor': 'end' }, grid);
      tx.textContent = +v.toFixed(1);
    }
    // x labels: first and last date
    const xl = (t, anchor) => {
      const tx = mk('text', { x: X(t), y: H - 7, class: 'ch-tick', 'text-anchor': anchor }, svg);
      tx.textContent = fmtDate(t, { day: 'numeric', month: 'short' });
    };
    xl(pts[0].t, 'start');
    if (pts.length > 1) xl(pts[pts.length - 1].t, 'end');

    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
    if (pts.length > 1) {
      mk('path', { d: `${d}L${X(pts[pts.length - 1].t)},${H - m.b}L${X(pts[0].t)},${H - m.b}Z`, class: 'ch-area' }, svg);
      mk('path', { d, class: 'ch-line' }, svg);
    }
    for (const p of pts) mk('circle', { cx: X(p.t), cy: Y(p.y), r: pts.length > 24 ? 0 : 2.5, class: 'ch-dot' }, svg);
    const last = pts[pts.length - 1];
    mk('circle', { cx: X(last.t), cy: Y(last.y), r: 4.5, class: 'ch-end' }, svg);
    const el = mk('text', { x: X(last.t) + 8, y: Y(last.y) + 4, class: 'ch-endlabel' }, svg);
    el.textContent = fmt(last.y);

    // crosshair + tooltip
    const cross = mk('line', { class: 'ch-cross', y1: m.t, y2: H - m.b, x1: -10, x2: -10 }, svg);
    const hover = mk('circle', { r: 5, class: 'ch-end', cx: -10, cy: -10 }, svg);
    const tip = document.createElement('div');
    tip.className = 'ch-tip';
    container.appendChild(tip);
    const hit = mk('rect', { x: m.l - 10, y: 0, width: W - m.l - m.r + 20, height: H, fill: 'transparent', tabindex: 0 }, svg);
    let idx = pts.length - 1;
    const show = (i) => {
      idx = Math.max(0, Math.min(pts.length - 1, i));
      const p = pts[idx];
      const x = X(p.t), y = Y(p.y);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x);
      hover.setAttribute('cx', x); hover.setAttribute('cy', y);
      tip.innerHTML = '<b></b><span></span>';
      tip.querySelector('b').textContent = fmt(p.y) + (opts.unit ? ` ${opts.unit}` : '');
      tip.querySelector('span').textContent = `${fmtDate(p.t)}${p.label ? ' · ' + p.label : ''}`;
      tip.style.opacity = 1;
      const tw = tip.offsetWidth;
      tip.style.left = `${Math.min(W - tw - 4, Math.max(4, x - tw / 2))}px`;
      tip.style.top = `${Math.max(0, y - 52)}px`;
    };
    const hide = () => {
      tip.style.opacity = 0;
      cross.setAttribute('x1', -10); cross.setAttribute('x2', -10);
      hover.setAttribute('cx', -10);
    };
    const nearest = (clientX) => {
      const r = svg.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * W;
      let best = 0, bd = Infinity;
      pts.forEach((p, i) => { const dd = Math.abs(X(p.t) - x); if (dd < bd) { bd = dd; best = i; } });
      return best;
    };
    hit.addEventListener('pointermove', (e) => show(nearest(e.clientX)));
    hit.addEventListener('pointerdown', (e) => show(nearest(e.clientX)));
    hit.addEventListener('pointerleave', hide);
    hit.addEventListener('focus', () => show(idx));
    hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { show(idx - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(idx + 1); e.preventDefault(); }
    });
  };
  draw();
  let lastW = container.clientWidth;
  const ro = new ResizeObserver(() => {
    if (Math.abs(container.clientWidth - lastW) > 4) { lastW = container.clientWidth; draw(); }
  });
  ro.observe(container);
  return { destroy: () => ro.disconnect() };
}
