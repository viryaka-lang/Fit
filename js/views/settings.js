import * as store from '../store.js';
import { PROGRAM, MESO } from '../data/programs.js';
import { position, fromKg, round } from '../engine.js';
import { esc, icon, toast, confirmDialog } from '../ui.js';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

export function renderSettings(root, _p, { refresh, install, applyTheme, navigate }) {
  const st = store.get();
  const s = st.settings;
  const pos = position(st);
  const incs = s.units === 'kg' ? [1, 2, 2.5] : [2.5, 5];
  const curInc = round(fromKg(s.incKg, s.units), 0.5);
  const seg = (name, opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) =>
    `<button role="radio" aria-checked="${String(v) === String(cur)}" class="${String(v) === String(cur) ? 'on' : ''}" data-set="${name}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const sw = (name, label, hint) => `<label class="switch-row"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span>
    <input type="checkbox" class="switch" data-toggle="${name}" ${s[name] ? 'checked' : ''}></label>`;
  const notif = 'Notification' in window ? Notification.permission : 'unsupported';

  root.innerHTML = `
    <div class="page">
      <header class="page-head">
        <a class="icon-btn" href="#/today" aria-label="Back">${icon('left')}</a>
        <div class="grow"><p class="eyebrow">Preferences</p><h1>Settings</h1></div>
      </header>

      <section class="card form">
        <h3>Training</h3>
        <div class="field"><span class="label">Program</span>
          <a class="list-row" href="#/plan"><span class="grow"><b>${esc(PROGRAM[st.program.id].name)}</b><small>${PROGRAM[st.program.id].days} days/week · block ${pos.meso}, week ${pos.week} of ${MESO.length}</small></span>${icon('right', 'faint')}</a></div>
        <div class="field"><span class="label">Experience</span>${seg('level', [['beginner', 'Under 1 year'], ['intermediate', '1 year +']], s.level)}</div>
        <div class="field"><span class="label">Restart training block</span>
          <button class="btn ghost" data-act="restart">${icon('layers')}Start a new block at week 1</button></div>
      </section>

      <section class="card form">
        <h3>Units & equipment</h3>
        <div class="field"><span class="label">Units</span>${seg('units', [['kg', 'kg'], ['lb', 'lb']], s.units)}</div>
        <div class="field"><span class="label">Smallest dumbbell jump</span>${seg('inc', incs.map((v) => [v, `${v} ${s.units}`]), curInc)}</div>
      </section>

      <section class="card form">
        <h3>Workout</h3>
        ${sw('autoRest', 'Start rest timer automatically', 'After each completed set')}
        ${sw('sound', 'Sound when rest is over')}
        ${sw('vibrate', 'Vibrate when rest is over')}
        <div class="field"><span class="label">Background alerts</span>
          ${notif === 'granted' ? '<p class="muted small">Notifications are on — you\'ll be alerted when rest ends while the app is in the background.</p>'
            : notif === 'denied' ? '<p class="muted small">Notifications are blocked in your browser settings.</p>'
            : notif === 'unsupported' ? '<p class="muted small">Notifications aren\'t supported here. On iPhone, install the app first.</p>'
            : `<button class="btn ghost" data-act="notif">${icon('sound')}Enable rest notifications</button>`}
        </div>
      </section>

      <section class="card form">
        <h3>Appearance</h3>
        ${seg('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], s.theme)}
      </section>

      <section class="card form">
        <h3>App & data</h3>
        ${standalone() ? '<p class="muted small">✓ Running as an installed app.</p>'
          : install.prompt ? `<button class="btn primary block" data-act="install">${icon('download')}Install app</button>`
          : `<p class="muted small">${isIOS() ? 'To install: tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>.' : 'To install: open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.'}</p>`}
        <p class="muted small">Your data lives only on this device. Export a backup regularly.</p>
        <div class="row gap wrap">
          <button class="btn ghost" data-act="export">${icon('download')}Export backup</button>
          <label class="btn ghost">${icon('upload')}Import backup<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        </div>
        <button class="btn danger-ghost" data-act="reset">${icon('trash')}Erase all data</button>
      </section>
      <p class="disclaimer">Hypertrophy v1.1 · Works offline. Educational guidance, not medical advice.</p>
    </div>`;

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.set) {
      const v = b.dataset.v;
      store.update((x) => {
        if (b.dataset.set === 'level') x.settings.level = v;
        if (b.dataset.set === 'theme') x.settings.theme = v;
        if (b.dataset.set === 'units') {
          x.settings.units = v;
          x.settings.incKg = v === 'kg' ? 2 : 5 * 0.45359237;
        }
        if (b.dataset.set === 'inc') x.settings.incKg = x.settings.units === 'lb' ? +v * 0.45359237 : +v;
      });
      if (b.dataset.set === 'theme') applyTheme();
      refresh();
      return;
    }
    switch (b.dataset.act) {
      case 'restart':
        if (await confirmDialog('Start a new block?', 'You\'ll go back to week 1 with fresh effort targets. History is kept.', { ok: 'Restart' })) {
          store.update((x) => { x.program.done = 0; x.program.meso = (x.program.meso || 1) + 1; x.program.startedAt = new Date().toISOString(); });
          toast('New training block started');
          refresh();
        }
        break;
      case 'notif':
        try { await Notification.requestPermission(); } catch { /* ignore */ }
        refresh();
        break;
      case 'install':
        install.prompt.prompt();
        await install.prompt.userChoice.catch(() => {});
        install.prompt = null;
        refresh();
        break;
      case 'export': {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `hypertrophy-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Backup downloaded', { icon: 'download' });
        break;
      }
      case 'reset':
        if (await confirmDialog('Erase everything?', 'All workouts, records and settings will be permanently deleted from this device.', { ok: 'Erase all', danger: true })) {
          store.reset();
          applyTheme();
          navigate('#/today');
        }
        break;
    }
  });
  root.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.dataset.toggle) { store.update((x) => { x.settings[t.dataset.toggle] = t.checked; }); return; }
    if (t.dataset.act === 'import' && t.files[0]) {
      try {
        store.importJSON(await t.files[0].text());
        applyTheme();
        toast('Backup restored');
        refresh();
      } catch (err) {
        toast(`Import failed: ${err.message}`, { icon: 'x' });
      }
    }
  });
}
