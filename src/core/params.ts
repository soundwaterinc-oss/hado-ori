// params.ts — single source of truth (drives UI, preset, TD send).
// HADŌ ORI / 波動織 — chords, riffs & solos generated from the wavefield, over world
// scales & rhythms, with morphing ethnic-geometry visuals.
import { SCALE_IDS, SCALE_LABELS } from "../music/scales";
import { RHYTHM_IDS } from "../music/rhythms";
import { TIMBRE_IDS } from "../audio/timbres";
import { ENGINES, CLIMATES, CURRENTS, SOILS, WEATHERS } from "../music/arranger";

export type ParamTab = "PERFORM" | "GEO" | "FIELD" | "SCALE" | "RHYTHM" | "TIMBRE" | "VOICES"
  | "EVOLVE" | "PATTERN" | "MUTATE" | "IO" | "INFO";

export interface NumberParam { kind: "number"; tab: ParamTab; label: string; min: number; max: number; def: number; step?: number; unit?: string }
export interface EnumParam { kind: "enum"; tab: ParamTab; label: string; options: readonly string[]; def: string; labels?: Record<string, string> }
export interface BoolParam { kind: "bool"; tab: ParamTab; label: string; def: boolean }
export type ParamDef = NumberParam | EnumParam | BoolParam;

const n = (tab: ParamTab, label: string, min: number, max: number, def: number, step?: number, unit?: string): NumberParam =>
  ({ kind: "number", tab, label, min, max, def, step, unit });
const e = (tab: ParamTab, label: string, options: readonly string[], def: string, labels?: Record<string, string>): EnumParam =>
  ({ kind: "enum", tab, label, options, def, labels });
const b = (tab: ParamTab, label: string, def: boolean): BoolParam => ({ kind: "bool", tab, label, def });

export const PARAMS = {
  // ── PERFORM ──────────────────────────────────────────────────────────
  masterGain: n("PERFORM", "master gain", 0, 1.5, 0.9, 0.01),

  // ── GEO ──────────────────────────────────────────────────────────────
  geoMode: e("GEO", "geo mode", ["PHYLLO", "LSYS", "VORO", "HYBRID"], "PHYLLO"),
  geoModeA: e("GEO", "hybrid A", ["PHYLLO", "LSYS", "VORO"], "PHYLLO"),
  geoModeB: e("GEO", "hybrid B", ["PHYLLO", "LSYS", "VORO"], "VORO"),
  seedCount: n("GEO", "seeds", 8, 256, 89, 1),
  angleOffset: n("GEO", "angle offset", -3, 3, 0, 0.01, "°"),
  wellDepth: n("GEO", "well depth", 0, 1, 0.55, 0.01),
  wellRadius: n("GEO", "well radius", 0.01, 0.1, 0.03, 0.001),
  lsysIterations: n("GEO", "L iterations", 1, 5, 3, 1),
  branchAngle: n("GEO", "branch angle", 15, 40, 25.7, 0.1, "°"),
  lsysSeed: n("GEO", "L seed", 1, 9999, 1, 1),
  cellCount: n("GEO", "cells", 8, 128, 32, 1),
  relax: n("GEO", "Lloyd relax", 0, 8, 2, 1),
  wallWidth: n("GEO", "wall width", 0.005, 0.04, 0.012, 0.001),
  wallHeight: n("GEO", "wall height", 0, 1, 0.7, 0.01),
  geoMix: n("GEO", "geo mix", 0, 1, 0, 0.01),
  brushRadius: n("GEO", "brush radius", 0.01, 0.1, 0.04, 0.001),
  brushDepth: n("GEO", "brush depth", -1, 1, -0.5, 0.01),

  // ── FIELD ────────────────────────────────────────────────────────────
  packetX: n("FIELD", "packet x", 0, 1, 0.5, 0.001),
  packetY: n("FIELD", "packet y", 0, 1, 0.5, 0.001),
  packetWidth: n("FIELD", "packet width", 0.02, 0.2, 0.09, 0.001),
  px: n("FIELD", "momentum x", -40, 40, 7, 0.1),
  py: n("FIELD", "momentum y", -40, 40, 4, 0.1),
  substeps: n("FIELD", "substeps", 1, 32, 8, 1),
  damping: n("FIELD", "damping", 0, 0.02, 0.002, 0.0001),
  boundary: e("FIELD", "boundary", ["reflect", "absorb"], "reflect"),
  modeCount: n("FIELD", "modes", 1, 16, 6, 1),
  warp: n("FIELD", "warp", 0.3, 2.0, 0.8, 0.01),

  // ── SCALE ────────────────────────────────────────────────────────────
  scaleId: e("SCALE", "scale", SCALE_IDS, "yaman", SCALE_LABELS),
  fRoot: n("SCALE", "tonic", 55, 330, 110, 1, "Hz"),
  chordSize: n("SCALE", "chord tones", 2, 5, 3, 1),
  autoScale: b("SCALE", "auto scale (flux)", false),

  // ── RHYTHM ───────────────────────────────────────────────────────────
  rhythmId: e("RHYTHM", "rhythm", RHYTHM_IDS, "teental"),
  bpm: n("RHYTHM", "bpm", 40, 220, 96, 1),
  chordEvery: n("RHYTHM", "chord / cycles", 1, 4, 1, 1),

  // ── TIMBRE ───────────────────────────────────────────────────────────
  chordTimbre: e("TIMBRE", "chord timbre", TIMBRE_IDS, "pad"),
  riffTimbre: e("TIMBRE", "riff timbre", TIMBRE_IDS, "rhodes"),
  soloTimbre: e("TIMBRE", "solo timbre", TIMBRE_IDS, "prophet"),

  // ── EVOLVE (auto arrangement) ────────────────────────────────────────
  arrangeOn: b("EVOLVE", "auto evolve", true),
  engine: e("EVOLVE", "engine", ENGINES, "PLANT"),
  climate: e("EVOLVE", "climate", CLIMATES, "temperate"),
  current: e("EVOLVE", "current", CURRENTS, "warm"),
  soil: e("EVOLVE", "soil", SOILS, "loam"),
  weather: e("EVOLVE", "weather", WEATHERS, "clear"),
  sectionBars: n("EVOLVE", "section bars", 4, 32, 16, 1),
  stageBars: n("EVOLVE", "stage bars", 8, 64, 32, 1),

  // ── VOICES ───────────────────────────────────────────────────────────
  chordOn: b("VOICES", "chord on", true),
  riffOn: b("VOICES", "riff on", true),
  soloOn: b("VOICES", "solo on", true),
  chordLevel: n("VOICES", "chord level", 0, 1, 0.4, 0.01),
  chordCutoff: n("VOICES", "chord cutoff", 200, 8000, 1600, 10, "Hz"),
  riffLevel: n("VOICES", "riff level", 0, 1, 0.5, 0.01),
  riffTone: n("VOICES", "riff tone", 300, 8000, 2200, 10, "Hz"),
  soloLevel: n("VOICES", "solo level", 0, 1, 0.5, 0.01),
  soloCutoff: n("VOICES", "solo cutoff", 300, 9000, 2600, 10, "Hz"),
  soloThresh: n("VOICES", "solo gate", 0, 1, 0.4, 0.01),
  soloDensity: n("VOICES", "solo density", 0, 1, 0.55, 0.01),
  drive: n("VOICES", "drive", 0, 1, 0.1, 0.01),
  delayTime: n("VOICES", "delay time", 20, 1200, 360, 1, "ms"),
  delayFb: n("VOICES", "delay fb", 0, 0.85, 0.32, 0.01),
  reverbSize: n("VOICES", "reverb size", 1, 8, 3, 0.1, "s"),
  reverbMix: n("VOICES", "reverb mix", 0, 1, 0.24, 0.01),
  fxSendChord: n("VOICES", "fx send chord", 0, 1, 0.3, 0.01),
  fxSendRiff: n("VOICES", "fx send riff", 0, 1, 0.35, 0.01),
  fxSendSolo: n("VOICES", "fx send solo", 0, 1, 0.4, 0.01),

  // ── PATTERN (visual) ─────────────────────────────────────────────────
  patternFamily: e("PATTERN", "pattern", ["MANDALA", "KILIM", "GIRIH", "KNOT", "KOLAM"], "GIRIH"),
  palette: e("PATTERN", "palette", ["indigo", "jewel", "earth", "ochre", "mono", "sunset"], "jewel"),
  symmetry: n("PATTERN", "symmetry", 3, 12, 8, 1),
  patternScale: n("PATTERN", "scale", 1, 16, 6, 0.1),
  morphAmt: n("PATTERN", "morph", 0, 1, 0.5, 0.01),
  fieldWarp: n("PATTERN", "field warp", 0, 1, 0.4, 0.01),
  lineWidth: n("PATTERN", "line width", 0.02, 0.5, 0.16, 0.01),
  patternSpeed: n("PATTERN", "drift speed", 0, 2, 0.4, 0.01),

  // ── MUTATE ───────────────────────────────────────────────────────────
  feedAmount: n("MUTATE", "feed amount", 0, 1, 0.3, 0.01),
  mutateRate: n("MUTATE", "mutate rate", 0.1, 2, 0.4, 0.01, "Hz"),
  mutateSmooth: n("MUTATE", "mutate smooth", 1, 10, 4, 0.1, "s"),
  rmsTarget: n("MUTATE", "rms target", -48, 0, -18, 0.5, "dB"),
  centTarget: n("MUTATE", "cent target", 200, 4000, 1200, 10, "Hz"),
  freeze: b("MUTATE", "freeze", false),

  // ── IO ───────────────────────────────────────────────────────────────
  midiEnable: b("IO", "midi enable", false),
  midiCh: n("IO", "midi ch", 1, 16, 1, 1),
  wsRate: n("IO", "ws rate", 10, 60, 30, 1, "fps"),
  sendField: b("IO", "send field", false),
  fieldRate: n("IO", "field rate", 5, 30, 15, 1, "fps"),
} as const satisfies Record<string, ParamDef>;

export type ParamName = keyof typeof PARAMS;
export type ParamValue = number | string | boolean;
export type ParamState = Record<ParamName, ParamValue>;

export function defaultState(): ParamState {
  const s = {} as ParamState;
  for (const key of Object.keys(PARAMS) as ParamName[]) s[key] = PARAMS[key].def;
  return s;
}

export interface Settings { gridSize: number; wsUrl: string; midiDeviceId: string }
export function defaultSettings(): Settings {
  return { gridSize: 256, wsUrl: "ws://localhost:9980", midiDeviceId: "" };
}
