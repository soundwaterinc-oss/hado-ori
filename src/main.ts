// main.ts — HADŌ ORI startup + loops. The wavefield generates chord/riff/solo over a world
// scale & rhythm; the field also morphs an ethnic-geometry pattern; feedback grows both.
import "./ui/style.css";
import { defaultState, defaultSettings, type ParamName } from "./core/params";
import { features } from "./core/features";
import {
  BUILTIN_PRESETS, loadUserPresets, saveUserPreset, applyPreset,
  exportJSON, importJSON,
} from "./core/preset";
import { QuantumField, type PatternState } from "./field/schrodinger";
import { Probes } from "./field/probes";
import { Spectrum } from "./field/spectrum";
import { Potential } from "./geometry/potential";
import { AudioEngine } from "./audio/engine";
import { Mutator } from "./feedback/mutate";
import { MidiOut } from "./io/midi";
import { TdBridge } from "./io/tdBridge";
import { OriUI, type UIHooks } from "./ui/layout";
import { WeaveSequencer } from "./seq/weave";
import { Composer } from "./music/composer";
import { RHYTHMS } from "./music/rhythms";
import { scaleLength } from "./music/scales";

const FAMILIES = ["MANDALA", "KILIM", "GIRIH", "KNOT", "KOLAM"];
const PALETTES = ["indigo", "jewel", "earth", "ochre", "mono", "sunset"];

const state = defaultState();
const settings = defaultSettings();

let field: QuantumField;
let potential: Potential;
let fieldMax = 1e-6;
const spectrum = new Spectrum();
const probes = new Probes();
const audio = new AudioEngine();
const mutator = new Mutator();
const midi = new MidiOut();
const td = new TdBridge();
const composer = new Composer();

// visual music state (decays each frame)
let patternHue = 0.5;
let pulse = 0;
let soloFlash = 0;
let chordName = "";

function rhythm(): typeof RHYTHMS[string] { return RHYTHMS[state.rhythmId as string] ?? RHYTHMS.teental; }
function rebakeGeometry(): void { field.uploadV(potential.bake(state)); }
function syncMusic(): void {
  composer.setScale(state.scaleId as string);
  composer.setTonic(state.fRoot as number);
  composer.chordSize = state.chordSize as number;
}
function regen(): void {
  composer.reseed((Math.random() * 1e9) >>> 0);
  composer.advanceChord(0.5);
  composer.regenRiff(rhythm());
}

// strongest probe → drives the solo
function soloProbe(): { y: number; mag: number } {
  let best = { y: 0.5, mag: 0 };
  for (const pr of features.probes) {
    const m = pr.p / fieldMax;
    if (m > best.mag) best = { y: pr.y, mag: Math.min(1, m) };
  }
  return best;
}

const seq = new WeaveSequencer({
  now: () => audio.now,
  composer,
  rhythm,
  playChord: (freqs, time) => { audio.chord.play(freqs, time, state); pulse = Math.max(pulse, 0.6); },
  playRiff: (freq, time, vel, dur) => { audio.riff.note(freq, time, vel, dur, state); pulse = Math.min(1, pulse + 0.35); },
  playSolo: (freq, time, vel, dur) => {
    audio.solo.note(freq, time, vel, dur, state); soloFlash = 1;
    midi.noteOn(freq, vel, dur, state.midiCh as number);
  },
  soloProbe,
  tension: () => Math.min(1, features.analysis.flux * 0.6),
  onStep: (step, time) => {
    const delay = Math.max(0, (time - audio.now) * 1000);
    window.setTimeout(() => ui.setStepCursor(step), delay);
  },
  onChord: (root) => {
    patternHue = (root / Math.max(1, scaleLength(state.scaleId as string))) % 1;
    chordName = `deg ${root + 1}`;
  },
  flags: () => ({ chord: state.chordOn as boolean, riff: state.riffOn as boolean, solo: state.soloOn as boolean }),
});

// ── UI hooks ──────────────────────────────────────────────────────────
const GEO_PARAMS = new Set<ParamName>([
  "geoMode", "geoModeA", "geoModeB", "seedCount", "angleOffset", "wellDepth", "wellRadius",
  "lsysIterations", "branchAngle", "lsysSeed", "cellCount", "relax", "wallWidth", "wallHeight", "geoMix",
]);

function observe(x: number, y: number): void {
  void audio.resume();
  field.collapse(x, y, 0.05);
  // a manual solo flourish at the clicked height
  const deg = composer.soloDegree(y, true);
  const t = audio.now;
  audio.solo.note(composer.degToFreq(deg), t, 0.85, 0.4, state);
  soloFlash = 1;
  features.collapse = { x, y, localV: 0, nearestMode: 0 };
  td.sendEvent("collapse", { x, y, pitch: composer.degToFreq(deg), vel: 0.85 });
}

const hooks: UIHooks = {
  onParamChange: (name) => {
    if (GEO_PARAMS.has(name)) rebakeGeometry();
    if (name === "scaleId") { syncMusic(); composer.regenRiff(rhythm()); }
    if (name === "rhythmId") { composer.regenRiff(rhythm()); ui.setCycleLength(rhythm().length); }
    if (name === "fRoot") composer.setTonic(state.fRoot as number);
    if (name === "chordSize") composer.chordSize = state.chordSize as number;
  },
  onObserve: (x, y) => observe(x, y),
  onBrush: (x, y, raise) => {
    potential.brush.paint(x, y, state.brushRadius as number, state.brushDepth as number, raise);
    rebakeGeometry();
  },
  onReset: () => { field.reset(state); spectrum.snapshot(field); },
  onTogglePlay: () => { void audio.resume(); seq.toggle(); ui.setPlaying(seq.running); },
  onRegen: () => regen(),
  presetSave: (n) => saveUserPreset(n, state),
  presetLoad: (n) => {
    const all = [...BUILTIN_PRESETS, ...loadUserPresets()];
    const p = all.find((x) => x.name === n);
    if (!p) return;
    Object.assign(state, applyPreset(p));
    ui.refreshAll(); rebakeGeometry(); syncMusic(); composer.regenRiff(rhythm()); ui.setCycleLength(rhythm().length);
  },
  presetList: () => [...BUILTIN_PRESETS, ...loadUserPresets()].map((p) => p.name),
  exportJSON: () => {
    const blob = new Blob([exportJSON(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "hado-ori.json"; a.click();
  },
  importJSON: (text) => {
    try { Object.assign(state, importJSON(text)); ui.refreshAll(); rebakeGeometry(); syncMusic(); composer.regenRiff(rhythm()); ui.setCycleLength(rhythm().length); }
    catch { ui.setWarn("import failed"); }
  },
  midiEnable: () => { void midi.enable(); },
  midiSelect: (id) => midi.select(id),
  midiDevices: () => midi.devices,
  tdConnect: (url) => { settings.wsUrl = url; td.connect(url); },
  tdDisconnect: () => td.disconnect(),
};

const root = document.getElementById("app")!;
const ui = new OriUI(root, state, seq, hooks);

field = new QuantumField(ui.canvas, settings.gridSize);
potential = new Potential(field.gridSize);
rebakeGeometry();
field.reset(state);
spectrum.snapshot(field);
probes.layout(12);
syncMusic();
composer.regenRiff(rhythm());
ui.setCycleLength(rhythm().length);

mutator.onRebake = () => rebakeGeometry();
mutator.onWarn = (m) => ui.setWarn(m);
td.onStatus = (s) => ui.setTdStatus(`TD: ${s}`, s === "open" ? "ok" : s === "error" ? "err" : "");

const wake = (): void => { void audio.resume(); };
window.addEventListener("pointerdown", wake, { once: true });
window.addEventListener("keydown", wake, { once: true });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); void audio.resume(); seq.toggle(); ui.setPlaying(seq.running); }
  else if (e.key === "r" || e.key === "R") { field.reset(state); spectrum.snapshot(field); }
  else if (e.key === "f" || e.key === "F") { state.freeze = !(state.freeze as boolean); ui.refreshAll(); }
});

function resize(): void {
  const stage = ui.canvas.parentElement!;
  const px = Math.max(64, Math.min(stage.clientWidth, stage.clientHeight) - 8);
  ui.canvas.style.width = px + "px";
  ui.canvas.style.height = px + "px";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ui.canvas.width = Math.floor(px * dpr);
  ui.canvas.height = Math.floor(px * dpr);
}
window.addEventListener("resize", resize);
resize();

// ── background-resilient logic loop (Web Worker metronome) ──
const workerSrc =
  "let ms=16,t=null;onmessage=e=>{const d=e.data;" +
  "if(d.cmd==='config')ms=d.ms;" +
  "else if(d.cmd==='next')t=setTimeout(()=>postMessage(0),ms);" +
  "else if(d.cmd==='stop'){clearTimeout(t);t=null;}};";
const clockWorker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: "application/javascript" })));

let lastLogic = performance.now();
function logic(): void {
  const now = performance.now();
  let dt = (now - lastLogic) / 1000; lastLogic = now; dt = Math.min(0.5, dt);
  const frames = Math.max(1, Math.min(4, Math.round(dt / 0.016)));
  for (let k = 0; k < frames; k++) { field.step(state, potential.vmax); spectrum.accumulate(field); }
  features.t = now / 1000;
  features.modes = spectrum.update(now, state.modeCount as number, state.fRoot as number, state.warp as number);
  probes.sample(field, features.probes);
  let mx = 1e-6; const d = field.reducedData;
  for (let i = 0; i < d.length; i += 4) if (d[i] > mx) mx = d[i];
  fieldMax = mx;
  seq.schedule(state);
  audio.update(dt, features, state, now);
  mutator.update(dt, features.analysis, state);
  midi.sendCC(features, state, now);
  td.sendState(features, state, now);
  td.sendField(field.reducedData, state, now);
}
clockWorker.onmessage = () => { try { logic(); } catch (err) { console.error(err); } clockWorker.postMessage({ cmd: "next" }); };
clockWorker.postMessage({ cmd: "next" });
document.addEventListener("visibilitychange", () => {
  seq.lookahead = document.hidden ? 1.4 : 0.3;
  clockWorker.postMessage({ cmd: "config", ms: document.hidden ? 80 : 16 });
});

// ── render loop (ethnic pattern morphed by ψ) ──────────────────────────
let lastRender = performance.now();
function frame(): void {
  const now = performance.now();
  const rdt = Math.min(0.1, (now - lastRender) / 1000); lastRender = now;
  pulse = Math.max(0, pulse - rdt * 2.5);
  soloFlash = Math.max(0, soloFlash - rdt * 3);

  const ps: PatternState = {
    family: Math.max(0, FAMILIES.indexOf(state.patternFamily as string)),
    palette: Math.max(0, PALETTES.indexOf(state.palette as string)),
    sym: state.symmetry as number,
    scale: state.patternScale as number,
    morph: state.morphAmt as number,
    fieldWarp: state.fieldWarp as number,
    line: state.lineWidth as number,
    speed: state.patternSpeed as number,
    time: now / 1000,
    hue: patternHue,
    pulse,
    solo: soloFlash,
  };
  field.renderPattern(ps, ui.canvas.width, ui.canvas.height);
  ui.setMeter(features.analysis.rms);
  ui.setHud(`${state.scaleId} · ${state.rhythmId} · ${chordName} · ${seq.running ? "▶" : "■"}${state.freeze ? " · FROZEN" : ""}`);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
