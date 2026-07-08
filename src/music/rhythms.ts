// rhythms.ts — world rhythmic cycles. Each step lasts stepBeats beats; accents[] (0..1)
// weight velocity and where chords/riffs land. Lengths vary (talas, aksak, clave, iqa').
export interface Rhythm { name: string; region: string; stepBeats: number; length: number; accents: number[] }

const A = (len: number, strong: number[], mid: number[] = []): number[] => {
  const a = new Array(len).fill(0.25);
  for (const i of mid) a[i] = 0.6;
  for (const i of strong) a[i] = 1;
  return a;
};

export const RHYTHMS: Record<string, Rhythm> = {
  straight16:  { name: "Straight 16", region: "West", stepBeats: 0.25, length: 16, accents: A(16, [0, 8], [4, 12]) },
  straight8:   { name: "Straight 8", region: "West", stepBeats: 0.5, length: 8, accents: A(8, [0], [4]) },
  waltz:       { name: "Waltz 3/4", region: "West", stepBeats: 0.5, length: 6, accents: A(6, [0], [2, 4]) },
  tresillo:    { name: "Tresillo", region: "Cuba", stepBeats: 0.5, length: 8, accents: A(8, [0, 3, 6]) },
  sonClave:    { name: "Son clave", region: "Cuba", stepBeats: 0.25, length: 16, accents: A(16, [0, 3, 6, 10, 12]) },
  // Indian talas (matras as 16th steps)
  teental:     { name: "Teental (16)", region: "India", stepBeats: 0.25, length: 16, accents: A(16, [0], [4, 8, 12]) },
  jhaptal:     { name: "Jhaptal (10)", region: "India", stepBeats: 0.25, length: 10, accents: A(10, [0], [2, 5, 7]) },
  rupak:       { name: "Rupak (7)", region: "India", stepBeats: 0.25, length: 7, accents: A(7, [3, 5], [0]) },
  dadra:       { name: "Dadra (6)", region: "India", stepBeats: 0.25, length: 6, accents: A(6, [0], [3]) },
  ektal:       { name: "Ektal (12)", region: "India", stepBeats: 0.25, length: 12, accents: A(12, [0], [4, 8]) },
  // Balkan aksak (eighth pulses)
  aksak7:      { name: "Aksak 7/8", region: "Balkan", stepBeats: 0.5, length: 7, accents: A(7, [0], [2, 4]) },
  aksak9:      { name: "Aksak 9/8", region: "Balkan", stepBeats: 0.5, length: 9, accents: A(9, [0], [2, 4, 6]) },
  aksak11:     { name: "Aksak 11/8", region: "Balkan", stepBeats: 0.5, length: 11, accents: A(11, [0], [2, 4, 7, 9]) },
  // Arabic iqa'at (dum/tek over 8)
  maqsum:      { name: "Maqsum", region: "Arab", stepBeats: 0.5, length: 8, accents: A(8, [0, 4], [1, 3, 6]) },
  baladi:      { name: "Baladi", region: "Arab", stepBeats: 0.5, length: 8, accents: A(8, [0, 1, 4], [6]) },
  ayoub:       { name: "Ayoub", region: "Arab", stepBeats: 0.5, length: 8, accents: A(8, [0, 3], [5]) },
  // West African 12/8 bell
  bembe:       { name: "Bembé (12/8)", region: "Africa", stepBeats: 1 / 3, length: 12, accents: A(12, [0, 4, 7], [2, 9, 11]) },
  // Gamelan colotomic
  lancaran:    { name: "Lancaran", region: "Gamelan", stepBeats: 0.25, length: 16, accents: A(16, [0], [4, 8, 12]) },
};

export const RHYTHM_IDS = Object.keys(RHYTHMS);
