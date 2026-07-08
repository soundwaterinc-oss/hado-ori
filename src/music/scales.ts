// scales.ts — a rich library of world scales, each as ascending cents within an octave
// (microtonal where the tradition is, e.g. maqam neutral steps, gamelan slendro/pelog).
export interface Scale { name: string; region: string; cents: number[] }

export const SCALES: Record<string, Scale> = {
  // ── Western modes & common ──────────────────────────────────────────
  ionian:      { name: "Ionian (major)", region: "West", cents: [0,200,400,500,700,900,1100] },
  dorian:      { name: "Dorian", region: "West", cents: [0,200,300,500,700,900,1000] },
  phrygian:    { name: "Phrygian", region: "West", cents: [0,100,300,500,700,800,1000] },
  lydian:      { name: "Lydian", region: "West", cents: [0,200,400,600,700,900,1100] },
  mixolydian:  { name: "Mixolydian", region: "West", cents: [0,200,400,500,700,900,1000] },
  aeolian:     { name: "Aeolian (minor)", region: "West", cents: [0,200,300,500,700,800,1000] },
  locrian:     { name: "Locrian", region: "West", cents: [0,100,300,500,600,800,1000] },
  harmonicMin: { name: "Harmonic minor", region: "West", cents: [0,200,300,500,700,800,1100] },
  melodicMin:  { name: "Melodic minor", region: "West", cents: [0,200,300,500,700,900,1100] },
  majorPent:   { name: "Major pentatonic", region: "West", cents: [0,200,400,700,900] },
  minorPent:   { name: "Minor pentatonic", region: "West", cents: [0,300,500,700,1000] },
  blues:       { name: "Blues", region: "West", cents: [0,300,500,600,700,1000] },
  wholeTone:   { name: "Whole tone", region: "West", cents: [0,200,400,600,800,1000] },

  // ── Indian raga (thaat, 12-TET approximation) ───────────────────────
  bhairav:     { name: "Bhairav", region: "India", cents: [0,100,400,500,700,800,1100] },
  yaman:       { name: "Yaman (Kalyan)", region: "India", cents: [0,200,400,600,700,900,1100] },
  bhairavi:    { name: "Bhairavi", region: "India", cents: [0,100,300,500,700,800,1000] },
  todi:        { name: "Todi", region: "India", cents: [0,100,300,600,700,800,1100] },
  marwa:       { name: "Marwa", region: "India", cents: [0,100,400,600,700,900,1100] },
  kafi:        { name: "Kafi", region: "India", cents: [0,200,300,500,700,900,1000] },
  asavari:     { name: "Asavari", region: "India", cents: [0,200,300,500,700,800,1000] },
  khamaj:      { name: "Khamaj", region: "India", cents: [0,200,400,500,700,900,1000] },

  // ── Arabic / Turkish maqam (neutral = ~quarter tones) ───────────────
  rast:        { name: "Rast", region: "Maqam", cents: [0,200,350,500,700,900,1050] },
  bayati:      { name: "Bayati", region: "Maqam", cents: [0,150,300,500,700,800,1000] },
  hijaz:       { name: "Hijaz", region: "Maqam", cents: [0,100,400,500,700,800,1000] },
  saba:        { name: "Saba", region: "Maqam", cents: [0,150,300,400,700,800,1000] },
  nahawand:    { name: "Nahawand", region: "Maqam", cents: [0,200,300,500,700,800,1100] },
  kurd:        { name: "Kurd", region: "Maqam", cents: [0,100,300,500,700,800,1000] },
  ajam:        { name: "Ajam", region: "Maqam", cents: [0,200,400,500,700,900,1100] },
  sikah:       { name: "Sikah", region: "Maqam", cents: [0,150,350,500,650,850,1000] },
  huzam:       { name: "Huzam", region: "Maqam", cents: [0,150,350,400,700,800,1050] },

  // ── Persian dastgah (approx) ────────────────────────────────────────
  shur:        { name: "Shur", region: "Persia", cents: [0,150,300,500,700,800,1000] },
  homayoun:    { name: "Homayoun", region: "Persia", cents: [0,150,400,500,700,800,1000] },
  chahargah:   { name: "Chahargah", region: "Persia", cents: [0,150,400,500,700,850,1100] },

  // ── Japanese ────────────────────────────────────────────────────────
  inSen:       { name: "In / Insen", region: "Japan", cents: [0,100,500,700,1000] },
  yoSen:       { name: "Yo", region: "Japan", cents: [0,200,500,700,900] },
  hirajoshi:   { name: "Hirajoshi", region: "Japan", cents: [0,200,300,700,800] },
  iwato:       { name: "Iwato", region: "Japan", cents: [0,100,500,600,1000] },
  kumoi:       { name: "Kumoi", region: "Japan", cents: [0,200,300,700,900] },
  ritsu:       { name: "Ritsu", region: "Japan", cents: [0,200,500,700,900,1000] },

  // ── Chinese pentatonic modes ────────────────────────────────────────
  gong:        { name: "Gong", region: "China", cents: [0,200,400,700,900] },
  shang:       { name: "Shang", region: "China", cents: [0,200,500,700,1000] },
  jiao:        { name: "Jiao", region: "China", cents: [0,300,500,800,1000] },
  zhi:         { name: "Zhi", region: "China", cents: [0,200,400,700,900] },
  yu:          { name: "Yu", region: "China", cents: [0,300,500,700,1000] },

  // ── Indonesian gamelan (microtonal) ─────────────────────────────────
  slendro:     { name: "Slendro", region: "Gamelan", cents: [0,240,480,720,960] },
  pelog:       { name: "Pelog (7)", region: "Gamelan", cents: [0,120,270,540,670,785,945] },
  pelogSelisir:{ name: "Pelog selisir", region: "Gamelan", cents: [0,120,270,670,785] },

  // ── Ethiopian qenat (pentatonic) ────────────────────────────────────
  tizitaMaj:   { name: "Tizita (major)", region: "Ethiopia", cents: [0,200,400,700,900] },
  tizitaMin:   { name: "Tizita (minor)", region: "Ethiopia", cents: [0,200,300,700,800] },
  bati:        { name: "Bati", region: "Ethiopia", cents: [0,400,500,700,1100] },
  ambassel:    { name: "Ambassel", region: "Ethiopia", cents: [0,100,500,700,800] },
  anchihoye:   { name: "Anchihoye", region: "Ethiopia", cents: [0,100,500,600,1000] },

  // ── Balkan / Eastern Europe / Iberia ────────────────────────────────
  hungarianMin:{ name: "Hungarian minor", region: "Balkan", cents: [0,200,300,600,700,800,1100] },
  doubleHarm:  { name: "Double harmonic (Byz.)", region: "Balkan", cents: [0,100,400,500,700,800,1100] },
  romanian:    { name: "Romanian minor", region: "Balkan", cents: [0,200,300,600,700,900,1000] },
  ukrainian:   { name: "Ukrainian Dorian", region: "Balkan", cents: [0,200,300,600,700,900,1000] },
  phrygianDom: { name: "Phrygian dominant", region: "Iberia", cents: [0,100,400,500,700,800,1000] },
};

export const SCALE_IDS = Object.keys(SCALES);

// degree (can exceed scale length → octave wrap). Returns frequency in Hz.
export function degreeToFreq(tonicHz: number, scaleId: string, degree: number): number {
  const sc = SCALES[scaleId] ?? SCALES.ionian;
  const n = sc.cents.length;
  const oct = Math.floor(degree / n);
  const idx = ((degree % n) + n) % n;
  const cents = sc.cents[idx] + oct * 1200;
  return tonicHz * Math.pow(2, cents / 1200);
}

export function scaleLength(scaleId: string): number {
  return (SCALES[scaleId] ?? SCALES.ionian).cents.length;
}

// Stack "thirds" in scale-degree space to build a chord on a root degree.
export function chordDegrees(rootDegree: number, size: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < size; i++) out.push(rootDegree + i * 2);
  return out;
}
