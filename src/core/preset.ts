// preset.ts — named presets (localStorage) + JSON export/import of full state.
import { PARAMS, defaultState, type ParamName, type ParamState } from "./params";

const LS_KEY = "hado.presets.v1";

export interface Preset {
  name: string;
  params: Partial<Record<ParamName, number | string | boolean>>;
}

export const BUILTIN_PRESETS: Preset[] = [
  {
    name: "Yaman raga",
    params: { scaleId: "yaman", rhythmId: "teental", fRoot: 110, bpm: 88, chordEvery: 2,
      patternFamily: "MANDALA", palette: "indigo", symmetry: 8, geoMode: "PHYLLO",
      soloDensity: 0.5, reverbMix: 0.3, feedAmount: 0.3 },
  },
  {
    name: "Hijaz bazaar",
    params: { scaleId: "hijaz", rhythmId: "maqsum", fRoot: 98, bpm: 104, chordEvery: 1,
      patternFamily: "GIRIH", palette: "jewel", symmetry: 8, geoMode: "VORO", cellCount: 40,
      soloDensity: 0.6, reverbMix: 0.24, feedAmount: 0.35 },
  },
  {
    name: "Gamelan",
    params: { scaleId: "slendro", rhythmId: "lancaran", fRoot: 120, bpm: 76, chordEvery: 2,
      patternFamily: "KILIM", palette: "earth", geoMode: "LSYS", lsysIterations: 4,
      chordLevel: 0.35, soloDensity: 0.45, reverbMix: 0.3, feedAmount: 0.4 },
  },
  {
    name: "Aksak knot",
    params: { scaleId: "hungarianMin", rhythmId: "aksak9", fRoot: 92, bpm: 120, chordEvery: 1,
      patternFamily: "KNOT", palette: "sunset", geoMode: "HYBRID", soloDensity: 0.7,
      soloCutoff: 3400, reverbMix: 0.2, feedAmount: 0.45 },
  },
];

export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    return [];
  }
}

export function saveUserPreset(name: string, state: ParamState): void {
  const presets = loadUserPresets().filter((p) => p.name !== name);
  presets.push({ name, params: { ...state } });
  localStorage.setItem(LS_KEY, JSON.stringify(presets));
}

export function deleteUserPreset(name: string): void {
  const presets = loadUserPresets().filter((p) => p.name !== name);
  localStorage.setItem(LS_KEY, JSON.stringify(presets));
}

// Apply a preset onto a fresh default so missing keys fall back cleanly.
export function applyPreset(preset: Preset): ParamState {
  const state = defaultState();
  for (const key of Object.keys(preset.params) as ParamName[]) {
    if (key in PARAMS) state[key] = preset.params[key]!;
  }
  return state;
}

export function exportJSON(state: ParamState): string {
  return JSON.stringify({ format: "hado-preset-1", params: state }, null, 2);
}

export function importJSON(text: string): ParamState {
  const parsed = JSON.parse(text) as { params?: Record<string, unknown> };
  const state = defaultState();
  const src = parsed.params ?? {};
  for (const key of Object.keys(PARAMS) as ParamName[]) {
    if (key in src) state[key] = src[key] as number | string | boolean;
  }
  return state;
}
