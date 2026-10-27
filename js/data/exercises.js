// Exercise library — adjustable bench + dumbbells only.
// Poses: p0 = start / lengthened position, p1 = end of the lifting phase.
// Angles are in degrees, SVG convention (0 = right, 90 = down, -90 = up).

export const MUSCLES = {
  chest: 'Chest',
  front_delts: 'Front delts',
  side_delts: 'Side delts',
  rear_delts: 'Rear delts',
  lats: 'Lats',
  upper_back: 'Upper back',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  abs: 'Abs',
  lower_back: 'Lower back',
};

// Muscles shown in weekly volume tracking (others are counted but not targeted).
export const TRACKED = ['chest', 'lats', 'upper_back', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];

const FLAT = (x = 45, w = 115) => ({ type: 'flat', x, w });

// Lying supine on a flat bench, head to the left.
const SUPINE = { hip: [130, 136], t: 180, ankle: [174, 184], ft: 0 };
// Standing, facing right.
const STAND = { hip: [110, 99], t: -90, l: [90, 90, 0] };
// Front view standing.
const FRONT = { view: 'front', hip: [110, 99], t: -90, l: [91, 90, 90], ll: [1, 1, 0.35] };
// Chest supported on an incline bench (35°), facing right.
const PRONE_INCLINE = { hip: [102, 132], t: -35, ankle: [40, 175], ft: 65, hd: 5 };
// One hand + one knee on a flat bench, facing right.
const ROW_BASE = {
  hip: [80, 99], t: -10, hd: 12,
  l2: [90, 180, 180], ankle: [96, 184], ft: 0,
  a2: [88, 92], db2: false,
};

export const EXERCISES = [
  // ------------------------------------------------------------- CHEST
  {
    id: 'db_bench', name: 'Dumbbell Bench Press', primary: ['chest'], secondary: ['front_delts', 'triceps'],
    type: 'compound', reps: [6, 10], rest: 150,
    cues: [
      'Shoulder blades pinched and pressed into the bench, small arch, feet planted.',
      'Lower for ~2 s until the dumbbells sit level with your chest — get a deep stretch.',
      'Elbows ~45° from your torso, forearms vertical.',
      'Press up and slightly in; stop just short of locking out.',
    ],
    mistakes: ['Bouncing out of the bottom', 'Flaring elbows to 90°', 'Cutting range of motion short'],
    why: 'Dumbbells allow a deeper stretch than a barbell; training at long muscle lengths appears to favour hypertrophy.',
    fig: {
      props: [FLAT()],
      p0: { ...SUPINE, a: [-90, -90], al: [-0.4, 1], db: 'end' },
      p1: { ...SUPINE, a: [-90, -90], al: [1, 1], db: 'end' },
    },
  },
  {
    id: 'incline_press', name: 'Incline Dumbbell Press', primary: ['chest', 'front_delts'], secondary: ['triceps'],
    type: 'compound', reps: [8, 12], rest: 150,
    cues: [
      'Set the bench to 30°; steeper shifts work to the shoulders.',
      'Keep shoulder blades back and down throughout.',
      'Lower until the dumbbells reach upper-chest level, feel the stretch.',
      'Press straight up over the shoulders.',
    ],
    mistakes: ['Bench too steep (45°+)', 'Shoulders rolling forward at the top'],
    why: 'A low incline adds emphasis to the clavicular (upper) chest while keeping strong pressing mechanics.',
    fig: {
      props: [{ type: 'incline', x: 125, a: 30, dir: -1 }],
      p0: { hip: [130, 136], t: 210, ankle: [182, 184], ft: 0, a: [-90, -90], al: [-0.4, 1], db: 'end' },
      p1: { hip: [130, 136], t: 210, ankle: [182, 184], ft: 0, a: [-90, -90], al: [1, 1], db: 'end' },
    },
  },
  {
    id: 'db_fly', name: 'Dumbbell Fly', primary: ['chest'], secondary: ['front_delts'],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Soft, fixed bend in the elbows — hug a big tree.',
      'Open the arms slowly until you feel a strong stretch across the chest.',
      'Bring the dumbbells together over the chest by squeezing the pecs.',
      'Use lighter weight than you think; the stretch is the point.',
    ],
    mistakes: ['Turning it into a press', 'Dropping too fast into the stretch'],
    why: 'Flyes load the chest hardest in the stretched position — a strong hypertrophy stimulus with little triceps fatigue.',
    fig: {
      ground: false,
      props: [{ type: 'top', x: 110, y1: 44, y2: 150 }],
      p0: { view: 'front', hip: [110, 128], t: -90, l: [70, 90, 80], ll: [1, 0.15, 0.9], a: [0, -8], al: [1, 1], db: 'side', dbA: 90 },
      p1: { view: 'front', hip: [110, 128], t: -90, l: [70, 90, 80], ll: [1, 0.15, 0.9], a: [0, -8], al: [-0.3, -0.25], db: 'side', dbA: 90 },
    },
  },
  {
    id: 'deficit_pushup', name: 'Deficit Push-up (on dumbbells)', primary: ['chest'], secondary: ['triceps', 'front_delts', 'abs'],
    type: 'compound', reps: [8, 20], rest: 120, bodyweight: true,
    cues: [
      'Grip two hex dumbbells so your chest can sink below your hands.',
      'Body in one straight line, glutes squeezed.',
      'Lower until you feel a deep chest stretch, then push the floor away.',
      'Add a backpack or elevate feet when you exceed 20 reps.',
    ],
    mistakes: ['Hips sagging', 'Half reps', 'Head poking forward'],
    why: 'Push-ups produce similar chest growth to bench pressing at matched effort; the deficit adds range of motion.',
    fig: (() => {
      const pose = (th) => {
        const ankle = [27, 175];
        const hip = [ankle[0] + Math.cos(th * Math.PI / 180) * 85, ankle[1] + Math.sin(th * Math.PI / 180) * 85];
        return { hip, t: th, l: [th + 180, th + 180, 100], hand: [154, 177], eb: 1, hd: 8, db: 'end', dbOff: [0, 5] };
      };
      return { p0: pose(-6), p1: pose(-22) };
    })(),
  },

  // -------------------------------------------------------------- BACK
  {
    id: 'one_arm_row', name: 'One-Arm Dumbbell Row', primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'],
    type: 'compound', reps: [8, 12], rest: 120, unilateral: true,
    cues: [
      'Hand and knee on the bench, back flat and parallel to the floor.',
      'Let the dumbbell hang and the shoulder blade stretch forward at the bottom.',
      'Drive the elbow back towards your hip, not straight up.',
      'Pause briefly at the top, lower under control.',
    ],
    mistakes: ['Twisting the torso to heave the weight', 'Shrugging instead of rowing'],
    why: 'Pulling the elbow toward the hip through a full range heavily loads the lats; the bench removes lower-back fatigue.',
    fig: {
      props: [FLAT(30, 120)], benchBack: true,
      p0: { ...ROW_BASE, a: [90, 90], db: 'side' },
      p1: { ...ROW_BASE, a: [196, 95], db: 'side' },
      hl: [],
    },
  },
  {
    id: 'cs_row', name: 'Chest-Supported Row', primary: ['upper_back', 'lats'], secondary: ['rear_delts', 'biceps'],
    type: 'compound', reps: [8, 12], rest: 120,
    cues: [
      'Lie face down on a 30–45° incline, chest on the pad.',
      'Arms hang straight; let the shoulder blades spread apart.',
      'Row the elbows back and squeeze the blades together.',
      'Keep your chest glued to the pad — no body English.',
    ],
    mistakes: ['Lifting the chest off the pad', 'Rushing the lowering phase'],
    why: 'Supporting the chest takes the lower back out of the movement so the upper back can be trained close to failure.',
    fig: {
      props: [{ type: 'incline', x: 100, a: 35, dir: 1, len: 72, seat: 22 }],
      p0: { ...PRONE_INCLINE, a: [90, 90], db: 'end' },
      p1: { ...PRONE_INCLINE, a: [192, 96], db: 'end' },
    },
  },
  {
    id: 'pullover', name: 'Dumbbell Pullover', primary: ['lats', 'chest'], secondary: ['triceps'],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Lie on the bench holding one dumbbell by the top plate with both hands.',
      'Keep a slight, fixed elbow bend.',
      'Lower the weight behind your head until you feel the lats and chest stretch.',
      'Pull it back over your chest, ribs down.',
    ],
    mistakes: ['Bending and straightening the elbows (turns into a triceps extension)', 'Flaring the ribcage'],
    why: 'One of the few free-weight lifts that loads the lats in a fully stretched, overhead position.',
    fig: {
      props: [FLAT()],
      p0: { ...SUPINE, a: [195, 186], db: 'along', dbOff: [-4, 0] },
      p1: { ...SUPINE, a: [275, 270], db: 'along', dbOff: [0, -4] },
    },
  },
  {
    id: 'shrug', name: 'Dumbbell Shrug', primary: ['traps'], secondary: ['forearms'],
    type: 'isolation', reps: [10, 15], rest: 75,
    cues: [
      'Stand tall, dumbbells at your sides.',
      'Shrug straight up towards your ears — no rolling.',
      'Hold the top for a second, lower fully.',
    ],
    mistakes: ['Rolling the shoulders', 'Using the legs to bounce'],
    why: 'Direct trap work; heavy rows already train the mid-traps, so this is an optional add-on.',
    fig: {
      p0: { ...FRONT, a: [86, 89], db: 'end', shr: 0 },
      p1: { ...FRONT, a: [86, 89], db: 'end', shr: 8 },
    },
  },

  // --------------------------------------------------------- SHOULDERS
  {
    id: 'seated_press', name: 'Seated Dumbbell Shoulder Press', primary: ['front_delts'], secondary: ['side_delts', 'triceps'],
    type: 'compound', reps: [8, 12], rest: 120,
    cues: [
      'Bench upright (75–90°), back against the pad.',
      'Start with the dumbbells at ear level, forearms vertical.',
      'Press up until arms are nearly straight, dumbbells close but not clashing.',
      'Lower all the way back to ear level.',
    ],
    mistakes: ['Arching the lower back off the pad', 'Partial reps at the top only'],
    why: 'A heavy compound for the delts; seated and back-supported for stability so you can push close to failure safely.',
    fig: {
      props: [{ type: 'frontSeat', x: 110, top: 66 }],
      p0: { view: 'front', hip: [110, 137], t: -90, l: [40, 88, 90], ll: [0.25, 1, 0.4], a: [12, -88], db: 'side', dbA: 0 },
      p1: { view: 'front', hip: [110, 137], t: -90, l: [40, 88, 90], ll: [0.25, 1, 0.4], a: [-72, -84], db: 'side', dbA: 0 },
    },
  },
  {
    id: 'lateral_raise', name: 'Lateral Raise', primary: ['side_delts'], secondary: ['traps'],
    type: 'isolation', reps: [12, 20], rest: 75,
    cues: [
      'Slight forward lean, soft elbows.',
      'Raise out to the sides, leading with the elbows, to shoulder height.',
      'Think "push the dumbbells away" rather than up.',
      'Control the way down — 2 seconds.',
    ],
    mistakes: ['Swinging with momentum', 'Shrugging the weight up with the traps'],
    why: 'Side delts are what make shoulders look wide; they respond well to high volume and higher reps.',
    fig: {
      p0: { ...FRONT, a: [80, 84], db: 'end' },
      p1: { ...FRONT, a: [-3, 6], db: 'end' },
      hl: [],
    },
  },
  {
    id: 'rear_delt', name: 'Chest-Supported Rear-Delt Fly', primary: ['rear_delts'], secondary: ['upper_back'],
    type: 'isolation', reps: [12, 20], rest: 75,
    cues: [
      'Lie face down on a low incline bench.',
      'Arms hang down, palms facing each other, slight elbow bend.',
      'Sweep the arms out wide and back — imagine pulling them apart.',
      'Keep the shoulder blades from fully squeezing; let the rear delts do the work.',
    ],
    mistakes: ['Using too much weight and rowing it', 'Shrugging'],
    why: 'Rear delts get little stimulus from pressing; isolating them balances the shoulder and improves posture.',
    fig: {
      ground: false,
      props: [{ type: 'top', x: 110, y1: 34, y2: 152 }],
      p0: { view: 'front', hip: [110, 110], t: -90, l: [93, 90, 90], ll: [0.9, 0.9, 0.3], a: [0, 0], al: [0.12, 0.1], db: 'side', dbA: 90, face: 'back' },
      p1: { view: 'front', hip: [110, 110], t: -90, l: [93, 90, 90], ll: [0.9, 0.9, 0.3], a: [-2, 4], al: [1, 1], db: 'side', dbA: 90, face: 'back' },
    },
  },

  // ----------------------------------------------------------- BICEPS
  {
    id: 'incline_curl', name: 'Incline Dumbbell Curl', primary: ['biceps'], secondary: ['forearms'],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Bench at 45–60°, let the arms hang straight down behind your torso.',
      'Keep the elbows pointing at the floor as you curl.',
      'Squeeze at the top, then lower fully to a big stretch.',
    ],
    mistakes: ['Elbows drifting forward', 'Cutting the bottom of the rep'],
    why: 'The arm hangs behind the body, stretching the long head of the biceps — great for growth.',
    fig: {
      props: [{ type: 'incline', x: 122, a: 55, dir: -1 }],
      p0: { hip: [128, 136], t: 235, ankle: [185, 184], ft: 0, a: [92, 90], db: 'end' },
      p1: { hip: [128, 136], t: 235, ankle: [185, 184], ft: 0, a: [96, -58], db: 'end' },
      hl: ['ua'],
    },
  },
  {
    id: 'hammer_curl', name: 'Hammer Curl', primary: ['biceps', 'forearms'], secondary: [],
    type: 'isolation', reps: [10, 15], rest: 75,
    cues: [
      'Palms facing each other (neutral grip) the whole time.',
      'Elbows stay pinned at your sides.',
      'Curl up, squeeze, lower slowly for 2 seconds.',
    ],
    mistakes: ['Swinging the torso', 'Letting the elbows travel forward'],
    why: 'Neutral grip emphasises the brachialis and brachioradialis — thickness for the upper arm and forearm.',
    fig: {
      p0: { ...STAND, a: [92, 90], db: 'side' },
      p1: { ...STAND, a: [96, -68], db: 'side' },
      hl: ['ua'],
    },
  },
  {
    id: 'spider_curl', name: 'Spider Curl', primary: ['biceps'], secondary: ['forearms'],
    type: 'isolation', reps: [10, 15], rest: 75,
    cues: [
      'Lie chest-down on an incline bench, arms hanging straight down.',
      'Keep the upper arms vertical; only the forearms move.',
      'Curl to a hard squeeze, lower all the way.',
    ],
    mistakes: ['Swinging the upper arm', 'Partial reps'],
    why: 'Removes all momentum and keeps tension high in the shortened position — a great complement to incline curls.',
    fig: {
      props: [{ type: 'incline', x: 100, a: 35, dir: 1, len: 72, seat: 22 }],
      p0: { ...PRONE_INCLINE, a: [90, 90], db: 'end' },
      p1: { ...PRONE_INCLINE, a: [90, -62], db: 'end' },
      hl: ['ua'],
    },
  },

  // ---------------------------------------------------------- TRICEPS
  {
    id: 'oh_ext', name: 'Overhead Triceps Extension', primary: ['triceps'], secondary: [],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Sit on an upright bench, hold one dumbbell under the top plate with both hands.',
      'Upper arms point at the ceiling, elbows in.',
      'Lower the weight behind your head into a deep stretch.',
      'Extend to just short of lockout.',
    ],
    mistakes: ['Elbows flaring wide', 'Arching the lower back'],
    why: 'Overhead extensions grew the triceps ~40% more than pushdowns in a direct comparison (Maeo 2023), thanks to the long-head stretch.',
    fig: {
      props: [{ type: 'incline', x: 120, a: 84, dir: -1, len: 78 }],
      p0: { hip: [126, 136], t: -96, ankle: [178, 184], ft: 0, a: [-100, 112], db: 'along', dbOff: [-2, 4], hd: -6 },
      p1: { hip: [126, 136], t: -96, ankle: [178, 184], ft: 0, a: [-100, 266], db: 'along', dbOff: [0, -4], hd: -6 },
      hl: ['ua'],
    },
  },
  {
    id: 'skull_crusher', name: 'Dumbbell Skull Crusher', primary: ['triceps'], secondary: [],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Lie on a flat bench, dumbbells over your shoulders, palms facing each other.',
      'Let the upper arms angle slightly back toward your head.',
      'Bend only at the elbows, lowering the dumbbells beside your head.',
      'Extend back up without locking out hard.',
    ],
    mistakes: ['Moving the upper arms', 'Elbows flaring out'],
    why: 'Angling the arms back keeps tension on the long head at the stretch.',
    fig: {
      props: [FLAT()],
      p0: { ...SUPINE, a: [-108, 160], db: 'side' },
      p1: { ...SUPINE, a: [-108, 262], db: 'side' },
      hl: ['ua'],
    },
  },
  {
    id: 'kickback', name: 'Triceps Kickback', primary: ['triceps'], secondary: [],
    type: 'isolation', reps: [12, 20], rest: 60, unilateral: true,
    cues: [
      'Hand and knee on the bench, back flat.',
      'Upper arm stays parallel to the floor, tight to your side.',
      'Extend the elbow fully, squeeze the triceps for a second.',
    ],
    mistakes: ['Dropping the upper arm', 'Swinging the weight'],
    why: 'Hardest at full extension — a good finisher alongside overhead work.',
    fig: {
      hlNear: true,
      props: [FLAT(30, 120)], benchBack: true,
      p0: { ...ROW_BASE, a: [190, 92], db: 'side' },
      p1: { ...ROW_BASE, a: [190, 186], db: 'side' },
      hl: ['ua'],
    },
  },

  // ------------------------------------------------------------- LEGS
  {
    id: 'goblet_squat', name: 'Goblet Squat', primary: ['quads', 'glutes'], secondary: ['abs'],
    type: 'compound', reps: [8, 12], rest: 150,
    cues: [
      'Hold one dumbbell vertically against your chest.',
      'Feet shoulder-width, toes slightly out. Elevate heels on plates if mobility is limited.',
      'Sit down between your heels, knees travel forward over the toes.',
      'Go as deep as you can with a neutral back, drive up through the whole foot.',
    ],
    mistakes: ['Heels lifting', 'Knees caving in', 'Stopping above parallel'],
    why: 'Deep squats grow the quads and glutes more than partial squats (Kubo 2019).',
    fig: {
      p0: { hip: [80, 150], t: -63, ankle: [112, 184], ft: 0, a: [62, -78], db: 'side', dbA: 90, dbOff: [3, 7] },
      p1: { hip: [107, 100], t: -87, ankle: [112, 184], ft: 0, a: [62, -78], db: 'side', dbA: 90, dbOff: [3, 7] },
      hl: ['th'],
    },
  },
  {
    id: 'bulgarian', name: 'Bulgarian Split Squat', primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    type: 'compound', reps: [8, 12], rest: 120, unilateral: true,
    cues: [
      'Rear foot laces-down on the bench, front foot a long stride ahead.',
      'Drop the back knee straight down toward the floor.',
      'Lean the torso slightly forward for more glutes, stay upright for more quads.',
      'Drive through the front heel and mid-foot.',
    ],
    mistakes: ['Front foot too close to the bench', 'Pushing off the back leg'],
    why: 'Very high loading of quads and glutes at long lengths, with modest loads — perfect when dumbbells are your heaviest tool.',
    fig: {
      hlNear: true,
      props: [FLAT(10, 68)],
      p0: { hip: [100, 140], t: -80, ankle: [140, 184], ft: 0, ankle2: [70, 141], ft2: 165, a: [90, 90], db: 'end' },
      p1: { hip: [112, 104], t: -84, ankle: [140, 184], ft: 0, ankle2: [70, 141], ft2: 165, a: [90, 90], db: 'end' },
      hl: ['th'],
    },
  },
  {
    id: 'step_up', name: 'Dumbbell Step-up', primary: ['quads', 'glutes'], secondary: [],
    type: 'compound', reps: [8, 12], rest: 120, unilateral: true,
    cues: [
      'Whole foot on the bench, shin roughly vertical.',
      'Lean forward slightly and drive up through the front leg only.',
      'Lower slowly — the eccentric is where most of the work happens.',
    ],
    mistakes: ['Pushing off the back foot', 'Knee caving in'],
    why: 'A knee-friendly single-leg quad and glute builder.',
    fig: {
      hlNear: true,
      vb: '0 -34 220 234',
      props: [FLAT(122, 90)],
      p0: { hip: [110, 102], t: -80, ankle: [142, 141], ft: 0, ankle2: [100, 184], ft2: 0, a: [90, 90], db: 'end' },
      p1: { hip: [139, 57], t: -87, ankle: [142, 141], ft: 0, ankle2: [128, 122], ft2: 30, a: [90, 90], db: 'end' },
      hl: ['th'],
    },
  },
  {
    id: 'rdl', name: 'Dumbbell Romanian Deadlift', primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'forearms'],
    type: 'compound', reps: [8, 12], rest: 150,
    cues: [
      'Soft knees, push the hips straight back.',
      'Dumbbells slide down the front of your thighs, back stays flat.',
      'Go until you feel a strong hamstring stretch (usually mid-shin).',
      'Squeeze glutes to stand tall.',
    ],
    mistakes: ['Rounding the lower back', 'Squatting the weight down', 'Dumbbells drifting away from the legs'],
    why: 'Loads the hamstrings at long lengths — strongly linked to hamstring growth.',
    fig: {
      p0: { hip: [86, 108], t: -16, hd: 10, ankle: [112, 184], ft: 0, a: [90, 90], db: 'end' },
      p1: { hip: [108, 100], t: -88, ankle: [112, 184], ft: 0, a: [90, 90], db: 'end' },
      hl: ['th'],
    },
  },
  {
    id: 'hip_thrust', name: 'Dumbbell Hip Thrust', primary: ['glutes'], secondary: ['hamstrings'],
    type: 'compound', reps: [10, 15], rest: 120,
    cues: [
      'Upper back on the edge of the bench, dumbbell on your hip crease (use a pad).',
      'Feet flat, shins vertical at the top.',
      'Tuck the chin and ribs, drive hips up until the body is flat.',
      'Squeeze the glutes for a second at the top.',
    ],
    mistakes: ['Arching the lower back at the top', 'Feet too far out'],
    why: 'Maximal glute tension at full hip extension; complements stretch-focused lifts like RDLs and split squats.',
    fig: {
      props: [FLAT(-10, 82)],
      p0: { hip: [100, 168], sh: [61, 134], ankle: [155, 184], ft: 0, handAt: 'hip', handOff: [0, -18], eb: -1, db: 'end' },
      p1: { hip: [110, 138], sh: [61, 134], ankle: [155, 184], ft: 0, handAt: 'hip', handOff: [0, -18], eb: -1, db: 'end' },
    },
  },
  {
    id: 'leg_curl', name: 'Dumbbell Lying Leg Curl', primary: ['hamstrings'], secondary: ['calves'],
    type: 'isolation', reps: [10, 15], rest: 90,
    cues: [
      'Lie face down, knees just off the end of the bench.',
      'Squeeze one dumbbell between your feet (have a partner place it, or start light).',
      'Curl the heels toward your glutes, keep hips pressed down.',
      'Lower slowly to straight legs.',
    ],
    mistakes: ['Hips lifting off the bench', 'Dropping the weight quickly'],
    why: 'Knee-flexion work trains the short head of the biceps femoris, which hip-hinges like RDLs miss.',
    fig: {
      props: [FLAT(40, 112)],
      p0: { hip: [128, 136], t: 180, l: [0, 2, 92], a: [105, 75], al: [1, 1], face: -1, db: 'side', dbAt: 'foot' },
      p1: { hip: [128, 136], t: 180, l: [0, -100, -12], a: [105, 75], al: [1, 1], face: -1, db: 'side', dbAt: 'foot' },
      hl: ['th'],
    },
  },
  {
    id: 'calf_raise', name: 'Single-Leg Calf Raise', primary: ['calves'], secondary: [],
    type: 'isolation', reps: [10, 20], rest: 60, unilateral: true,
    cues: [
      'Ball of the foot on a step, dumbbell in the same-side hand, hold something for balance.',
      'Lower the heel as far as possible and pause 1–2 s in the stretch.',
      'Rise onto the big toe as high as you can.',
    ],
    mistakes: ['Bouncing at the bottom', 'Bending the knee to cheat'],
    why: 'Calves respond best to deep stretches with pauses — most of the growth comes from the bottom half.',
    fig: {
      vb: '0 -14 220 214', hlNear: true,
      props: [{ type: 'step', x: 116, w: 70, h: 22 }],
      p0: { hip: [112, 90], t: -90, ankle: [111.5, 174.8], ft: -25, l2: [94, 168, 168], a: [90, 90], a2: [90, 90], db: 'end', db2: false },
      p1: { hip: [113, 74], t: -90, ankle: [112.9, 158.8], ft: 35, l2: [94, 168, 168], a: [90, 90], a2: [90, 90], db: 'end', db2: false },
      hl: ['sh'],
    },
  },
  {
    id: 'seated_calf', name: 'Seated Calf Raise', primary: ['calves'], secondary: [],
    type: 'isolation', reps: [12, 20], rest: 60,
    cues: [
      'Sit on the bench end, balls of the feet on a step, dumbbell on your knees.',
      'Lower the heels fully and pause.',
      'Raise as high as possible.',
    ],
    mistakes: ['Short range of motion'],
    why: 'Bent-knee calf raises bias the soleus, which makes up much of the calf\'s mass.',
    fig: {
      props: [FLAT(10, 80), { type: 'step', x: 106, w: 70, h: 18 }],
      p0: { hip: [70, 136], t: -90, ankle: [109, 177.5], ft: -20, handAt: 'knee', handOff: [2, -16], eb: 1, db: 'side', dbA: 0, dbOff: [0, 2] },
      p1: { hip: [70, 136], t: -90, ankle: [110, 164], ft: 30, handAt: 'knee', handOff: [2, -16], eb: 1, db: 'side', dbA: 0, dbOff: [0, 2] },
      hl: ['sh'],
    },
  },

  // -------------------------------------------------------------- ABS
  {
    id: 'leg_raise', name: 'Bench Leg Raise', primary: ['abs'], secondary: [],
    type: 'isolation', reps: [10, 20], rest: 60, bodyweight: true,
    cues: [
      'Lie on the bench, grip it behind your head.',
      'Press the lower back flat, legs nearly straight.',
      'Raise the legs to vertical and curl the hips slightly off the bench.',
      'Lower slowly without arching. Hold a dumbbell between the feet to progress.',
    ],
    mistakes: ['Arching the lower back', 'Swinging'],
    why: 'Direct ab work — the abs are trained by compounds only moderately.',
    fig: {
      props: [FLAT(40, 100)],
      p0: { hip: [130, 136], t: 180, l: [6, 6, -60], a: [192, 105] },
      p1: { hip: [127, 132], t: 184, l: [-88, -90, -170], a: [192, 105] },
    },
  },
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Alternatives: exercises that train this one's primary muscles — first those
// sharing a primary muscle, then those hitting it as a secondary — by overlap.
export function alternatives(id) {
  const ex = EX[id];
  const hits = (list) => list.filter((m) => ex.primary.includes(m)).length;
  return EXERCISES.filter((e) => e.id !== id)
    .map((e) => ({ e, score: hits(e.primary) * 4 + hits(e.secondary) + (hits(e.primary) && e.type === ex.type ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}
