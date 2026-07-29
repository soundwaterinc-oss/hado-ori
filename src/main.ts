// main.ts — HADŌ ORI startup + loops. The wavefield generates chord/riff/solo over a world
// scale & rhythm; the field also morphs an ethnic-geometry pattern; feedback grows both.
import "./ui/style.css";
import { PARAMS, defaultState, defaultSettings, type ParamName } from "./core/params";
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
import { Arranger } from "./music/arranger";
import { RHYTHMS } from "./music/rhythms";
import { scaleLength } from "./music/scales";
import type { TimbreId } from "./audio/timbres";

declare global {
  interface Window {
    registerElSystemaInstrument?: (config: {
      id: string;
      audioContext?: AudioContext;
      outputNode?: AudioNode;
      sharedAnalyser?: AnalyserNode;
      onPlay?: () => void;
      onStop?: () => void;
      onSetParam?: (name: string, value: number) => void;
      onLoadPreset?: (preset: Record<string, unknown>) => void;
      onSnapshot?: () => Record<string, unknown>;
    }) => unknown;
  }
}

const FAMILIES = ["MANDALA", "KILIM", "GIRIH", "KNOT", "KOLAM"];
const PALETTES = ["indigo", "jewel", "earth", "ochre", "mono", "sunset"];

const state = defaultState();
const settings = defaultSettings();
const FIELD_ON = /[?&#]field/.test(location.href);

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
const arranger = new Arranger();

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * clamp01(t);
}

function setNumberParam(name: ParamName, value: number): void {
  const def = PARAMS[name];
  if (def.kind !== "number") return;
  state[name] = Math.min(def.max, Math.max(def.min, value));
}

// visual music state (decays each frame)
let patternHue = 0.5;
let pulse = 0;
let soloFlash = 0;
let chordName = "";
let stageInfo = "";

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
  playChord: (freqs, time, dur) => {
    for (const f of freqs) audio.chord.note(f, time, 0.7, dur, state.chordTimbre as TimbreId, state.chordCutoff as number);
    pulse = Math.max(pulse, 0.6);
  },
  playRiff: (freq, time, vel, dur) => {
    audio.riff.note(freq, time, vel, dur, state.riffTimbre as TimbreId, state.riffTone as number);
    pulse = Math.min(1, pulse + 0.35);
  },
  playSolo: (freq, time, vel, dur) => {
    audio.solo.note(freq, time, vel, dur, state.soloTimbre as TimbreId, state.soloCutoff as number);
    soloFlash = 1;
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

function applyParams(patch: Partial<Record<ParamName, number | string | boolean>>): void {
  let needsRebake = false;
  let needsRhythm = false;
  let needsScale = false;
  for (const key of Object.keys(patch) as ParamName[]) {
    if (!(key in PARAMS)) continue;
    const def = PARAMS[key];
    const value = patch[key];
    if (value === undefined) continue;
    if (def.kind === "number" && typeof value === "number") {
      state[key] = Math.min(def.max, Math.max(def.min, value));
    } else if (def.kind === "bool" && typeof value === "boolean") {
      state[key] = value;
    } else if (def.kind === "enum" && typeof value === "string" && def.options.includes(value)) {
      state[key] = value;
    } else {
      continue;
    }
    if (GEO_PARAMS.has(key)) needsRebake = true;
    if (key === "scaleId") needsScale = true;
    if (key === "rhythmId") needsRhythm = true;
    if (key === "fRoot") composer.setTonic(state.fRoot as number);
    if (key === "chordSize") composer.chordSize = state.chordSize as number;
  }
  ui.refreshAll();
  if (needsRebake) rebakeGeometry();
  if (needsScale) {
    syncMusic();
    composer.regenRiff(rhythm());
  }
  if (needsRhythm || needsScale) ui.setCycleLength(rhythm().length);
}

function snapshotState(): Record<string, unknown> {
  return { ...state };
}

function loadSnapshot(preset: Record<string, unknown>): void {
  const src = preset && typeof preset === "object" && preset.params && typeof preset.params === "object"
    ? preset.params as Record<string, unknown>
    : preset;
  applyParams(src as Partial<Record<ParamName, number | string | boolean>>);
}

function elsysMacro(name: string, value: number): void {
  const v = clamp01(value);
  switch (name) {
    case "macro.a":
      applyParams({
        chordLevel: lerp(0.12, 0.65, v),
        riffLevel: lerp(0.1, 0.8, v),
        soloDensity: lerp(0.08, 0.95, v),
        soloThresh: lerp(0.8, 0.18, v),
      });
      break;
    case "macro.b":
      applyParams({
        wellDepth: lerp(0.18, 0.96, v),
        wellRadius: lerp(0.012, 0.08, v),
        geoMix: lerp(0, 1, v),
        fieldWarp: lerp(0.05, 0.95, v),
        morphAmt: lerp(0.08, 0.9, v),
      });
      break;
    case "macro.c":
      applyParams({
        chordCutoff: lerp(400, 4200, v),
        soloCutoff: lerp(700, 5200, v),
        drive: lerp(0.02, 0.5, v),
        delayFb: lerp(0.08, 0.58, v),
        reverbMix: lerp(0.06, 0.45, v),
      });
      break;
    case "volume":
      setNumberParam("masterGain", v);
      ui.refreshAll();
      break;
    default:
      break;
  }
}

function registerFieldBridge(): void {
  if (!FIELD_ON || typeof window.registerElSystemaInstrument !== "function") return;
  window.registerElSystemaInstrument({
    id: "hado-ori",
    audioContext: audio.ctx,
    outputNode: audio.masterOut,
    sharedAnalyser: audio.analyser.input,
    onPlay: () => {
      void audio.resume();
      seq.toggle(true);
      ui.setPlaying(true);
    },
    onStop: () => {
      seq.toggle(false);
      ui.setPlaying(false);
    },
    onSetParam: (name, value) => elsysMacro(name, value),
    onLoadPreset: (preset) => loadSnapshot(preset),
    onSnapshot: () => snapshotState(),
  });
}

function observe(x: number, y: number): void {
  void audio.resume();
  field.collapse(x, y, 0.05);
  // a manual solo flourish at the clicked height
  const deg = composer.soloDegree(y, true);
  const t = audio.now;
  audio.solo.note(composer.degToFreq(deg), t, 0.85, 0.4, state.soloTimbre as TimbreId, state.soloCutoff as number);
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
registerFieldBridge();

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
  if (state.arrangeOn as boolean) {
    const info = arranger.update(seq.cycle, state, composer, {
      engine: state.engine as string, climate: state.climate as string,
      current: state.current as string, soil: state.soil as string, weather: state.weather as string,
    });
    if (info) {
      composer.regenRiff(rhythm());
      if (info.rhythmChanged) ui.setCycleLength(rhythm().length);
      ui.refreshAll();
      stageInfo = `stage ${info.stage} · sec ${info.section}`;
    }
  }
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
  ui.setHud(`${state.scaleId} · ${state.rhythmId} · ${chordName}${stageInfo ? " · " + stageInfo : ""} · ${seq.running ? "▶" : "■"}${state.freeze ? " · FROZEN" : ""}`);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
