// Simplified front/back body map. Each muscle region is tagged so it can be
// tinted for primary / secondary involvement or by a 0–1 intensity value.

const mirror = (d, cx) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(2 * cx - +x).toFixed(1)},${y}`);

// shapes are drawn for the left side of each figure and mirrored
const FRONT_CX = 50, BACK_CX = 150;
const SHAPES = {
  front: [
    ['side_delts', 'M31,35 C25,37 23,45 24,52 C27,49 30,45 32,41 Z'],
    ['front_delts', 'M40,33 C34,32 30,35 30,40 C29,45 27,49 26,53 C31,51 36,46 39,41 Z'],
    ['chest', 'M49,37 C44,35 40,36 39,41 C37,46 38,52 42,55 C45,57 49,56 49,53 Z'],
    ['traps', 'M45,26 C43,29 40,31 37,32 C41,33 44,33 46,32 Z'],
    ['biceps', 'M30,55 C26,58 25,65 26,70 C28,72 31,71 32,67 C33,62 33,57 30,55 Z'],
    ['forearms', 'M26,74 C23,79 22,87 23,93 C25,94 27,93 28,90 C30,84 30,78 29,74 Z'],
    ['abs', 'M49,58 C45,58 43,60 43,64 L43,84 C43,89 46,93 49,94 Z'],
    ['quads', 'M44,99 C39,104 37,116 38,128 C39,134 42,137 45,135 C48,128 49,115 48,104 Z'],
    ['calves', 'M40,146 C37,151 37,160 38,168 C40,170 42,168 42,164 C43,158 43,151 40,146 Z'],
  ],
  back: [
    ['side_delts', 'M131,35 C125,37 123,45 124,52 C127,49 130,45 132,41 Z'],
    ['rear_delts', 'M140,34 C134,32 130,35 130,40 C129,45 127,49 126,53 C131,51 136,46 139,41 Z'],
    ['traps', 'M150,25 C147,29 142,31 137,33 C142,35 145,40 147,46 L150,58 Z'],
    ['upper_back', 'M146,47 C142,41 139,40 137,43 C137,48 140,53 145,55 L149,58 Z'],
    ['lats', 'M137,47 C134,54 135,63 139,72 C142,78 146,81 149,82 L149,64 C146,61 141,56 137,47 Z'],
    ['triceps', 'M130,55 C126,58 125,65 126,70 C128,72 131,71 132,67 C133,62 133,57 130,55 Z'],
    ['forearms', 'M126,74 C123,79 122,87 123,93 C125,94 127,93 128,90 C130,84 130,78 129,74 Z'],
    ['lower_back', 'M149,84 C146,83 144,85 144,88 L145,94 C146,95 148,95 149,94 Z'],
    ['glutes', 'M149,96 C143,94 138,97 137,103 C137,109 141,113 147,112 C149,111 149,108 149,104 Z'],
    ['hamstrings', 'M144,115 C139,118 138,126 139,133 C140,137 143,138 145,136 C147,130 148,122 147,116 Z'],
    ['calves', 'M141,143 C137,148 137,157 139,165 C141,168 144,166 144,161 C145,154 145,147 141,143 Z'],
  ],
};

function silhouette(cx) {
  const L = (d) => `<path d="${d}"/><path d="${mirror(d, cx)}"/>`;
  const o = cx - 50;
  const p = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${+x + o},${y}`);
  return `<g class="mm-base">
    <circle cx="${cx}" cy="15" r="9"/>
    <rect x="${cx - 4.5}" y="21" width="9" height="9" rx="3"/>
    ${L(p('M50,28 C44,28 36,30 31,33 C25,36 23,44 23,52 L22,60 C21,72 20,84 21,96 L27,96 C29,86 31,76 32,66 L35,56 C36,64 37,76 38,90 C37,94 37,98 37,100 C35,114 35,130 37,142 C36,154 36,166 38,178 L45,178 C45,166 46,154 45,142 C47,130 49,116 50,104 Z'))}
  </g>`;
}

export function muscleMap({ primary = [], secondary = [], heat = null, className = '' } = {}) {
  const fill = (m) => {
    if (heat) {
      const v = heat[m];
      if (v == null) return 'class="mm-off"';
      return `class="mm-heat" style="opacity:${(0.18 + 0.82 * Math.max(0, Math.min(1, v))).toFixed(2)}"`;
    }
    if (primary.includes(m)) return 'class="mm-pri"';
    if (secondary.includes(m)) return 'class="mm-sec"';
    return 'class="mm-off"';
  };
  const regions = (list, cx) =>
    list.map(([m, d]) => `<g data-m="${m}" ${fill(m)}><path d="${d}"/><path d="${mirror(d, cx)}"/></g>`).join('');
  return `<svg class="musclemap ${className}" viewBox="14 2 172 194" role="img" aria-label="Muscles worked">
    ${silhouette(FRONT_CX)}${silhouette(BACK_CX)}
    ${regions(SHAPES.front, FRONT_CX)}${regions(SHAPES.back, BACK_CX)}
    <text x="${FRONT_CX}" y="190" class="mm-label">Front</text><text x="${BACK_CX}" y="190" class="mm-label">Back</text>
  </svg>`;
}
