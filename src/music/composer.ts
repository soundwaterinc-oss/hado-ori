// composer.ts — musical state + generation. Chord progression, riff ostinato and solo
// note choice, all in scale-degree space so any world scale works. The wavefunction
// (field features) chooses chord moves and drives the solo; feedback mutates key/scale.
import { degreeToFreq, scaleLength, chordDegrees, type Scale, SCALES } from "./scales";
import type { Rhythm } from "./rhythms";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface RiffNote { step: number; deg: number; dur: number; vel: number }

export class Composer {
  tonicHz = 110;
  scaleId = "yaman";
  chordRoot = 0;         // scale degree of the current chord root
  chordSize = 3;
  moveBias = 0.5;        // arranger: 0 = cadential, 1 = exploratory
  baseShift = 0;         // arranger: modulation (scale-degree shift of the tonal centre)
  riff: RiffNote[] = [];
  private rng = mulberry32(1);
  private seed = 1;

  get scale(): Scale { return SCALES[this.scaleId] ?? SCALES.ionian; }

  setScale(id: string): void { if (SCALES[id]) this.scaleId = id; }
  setTonic(hz: number): void { this.tonicHz = hz; }
  reseed(s: number): void { this.seed = s >>> 0; this.rng = mulberry32(this.seed); }

  // choose the next chord root; tension (0..1, from field flux) biases exploration vs cadence
  advanceChord(tension: number): void {
    const n = scaleLength(this.scaleId);
    const ex = Math.min(1, tension * 0.55 + this.moveBias * 0.6);
    if (this.rng() < (1 - ex) * 0.45) { this.chordRoot = 0; return; } // cadence to I
    const moves = ex > 0.5 ? [3, 4, -4, 1, 5, -3] : [4, -4, 3, -3, 2, 0];
    const mv = moves[Math.floor(this.rng() * moves.length)];
    this.chordRoot = ((this.chordRoot + mv) % n + n) % n;
  }

  chordFreqs(octave = 0): number[] {
    const degs = chordDegrees(this.chordRoot + this.baseShift, this.chordSize);
    return degs.map((d) => degreeToFreq(this.tonicHz, this.scaleId, d + octave * scaleLength(this.scaleId)));
  }

  degToFreq(deg: number): number { return degreeToFreq(this.tonicHz, this.scaleId, deg); }

  // build an ostinato spanning one rhythm cycle, notes on accented steps
  regenRiff(rhythm: Rhythm): void {
    this.rng = mulberry32(this.seed ^ (rhythm.length * 2654435761));
    const n = scaleLength(this.scaleId);
    this.riff = [];
    let deg = n + Math.floor(this.rng() * 3); // start ~an octave up
    for (let s = 0; s < rhythm.length; s++) {
      const acc = rhythm.accents[s];
      if (acc < 0.4 && this.rng() > 0.35) continue;
      // stepwise contour with occasional leaps
      const step = this.rng() < 0.7 ? (this.rng() < 0.5 ? 1 : -1) : (this.rng() < 0.5 ? 2 : -2);
      deg = Math.max(n - 2, Math.min(n * 2 + 2, deg + step));
      const dur = (this.rng() < 0.3 ? 2 : 1);
      this.riff.push({ step: s, deg, dur, vel: 0.5 + acc * 0.5 });
    }
    if (this.riff.length === 0) this.riff.push({ step: 0, deg: n, dur: 2, vel: 0.8 });
  }

  riffAt(step: number): RiffNote[] { return this.riff.filter((r) => r.step === step); }

  // solo degree from a probe: y → register, strong beats snap to a chord tone
  soloDegree(probeY: number, strong: boolean): number {
    const n = scaleLength(this.scaleId);
    let deg = Math.round(n + probeY * (n * 1.6)); // ~1.6 octaves above tonic
    if (strong) {
      const tones = chordDegrees(this.chordRoot, this.chordSize).map((d) => ((d % n) + n) % n);
      // snap to nearest chord tone within the octave
      const within = ((deg % n) + n) % n;
      let best = tones[0], bd = 99;
      for (const tt of tones) { const d = Math.min(Math.abs(within - tt), n - Math.abs(within - tt)); if (d < bd) { bd = d; best = tt; } }
      deg = deg - within + best;
    }
    return deg + this.baseShift;
  }
}
