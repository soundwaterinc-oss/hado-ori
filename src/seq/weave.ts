// weave.ts — lookahead sequencer that clocks a world rhythm cycle, advances the chord
// progression each cycle, plays the riff ostinato, and lets the wavefunction improvise the
// solo (a field probe crossing threshold picks a scale note). This is where the parts weave.
import type { ParamState } from "../core/params";
import type { Composer } from "../music/composer";
import type { Rhythm } from "../music/rhythms";

export interface WeaveDeps {
  now: () => number;
  composer: Composer;
  rhythm: () => Rhythm;
  playChord: (freqs: number[], time: number) => void;
  playRiff: (freq: number, time: number, vel: number, dur: number) => void;
  playSolo: (freq: number, time: number, vel: number, dur: number) => void;
  soloProbe: () => { y: number; mag: number };
  tension: () => number;
  onStep: (step: number, time: number, len: number) => void;
  onChord: (rootDeg: number, freqs: number[]) => void;
  flags: () => { chord: boolean; riff: boolean; solo: boolean };
}

export class WeaveSequencer {
  running = false;
  step = 0;
  cycle = 0;
  lookahead = 0.3;
  private nextTime = 0;

  constructor(private deps: WeaveDeps) {}

  toggle(on?: boolean): void {
    this.running = on ?? !this.running;
    if (this.running) { this.step = 0; this.cycle = 0; this.nextTime = this.deps.now() + 0.1; }
  }

  schedule(p: ParamState): void {
    if (!this.running) return;
    const now = this.deps.now();
    const rhythm = this.deps.rhythm();
    const secPerBeat = 60 / (p.bpm as number);
    const stepSec = rhythm.stepBeats * secPerBeat;
    while (this.nextTime < now + this.lookahead) {
      this.fire(this.step, this.nextTime, p, rhythm, stepSec);
      this.nextTime += stepSec;
      this.step++;
      if (this.step >= rhythm.length) { this.step = 0; this.cycle++; }
    }
  }

  private fire(step: number, time: number, p: ParamState, rhythm: Rhythm, stepSec: number): void {
    const acc = rhythm.accents[step] ?? 0.25;
    const flags = this.deps.flags();
    const c = this.deps.composer;
    this.deps.onStep(step, time, rhythm.length);

    // CHORD — advance progression at the top of every `chordEvery` cycles
    if (step === 0) {
      const every = Math.max(1, Math.round(p.chordEvery as number));
      if (this.cycle % every === 0) c.advanceChord(this.deps.tension());
      if (flags.chord) {
        const freqs = c.chordFreqs(0);
        this.deps.playChord(freqs, time);
        this.deps.onChord(c.chordRoot, freqs);
      }
    }

    // RIFF — ostinato notes on this step
    if (flags.riff) {
      for (const nrec of c.riffAt(step)) {
        this.deps.playRiff(c.degToFreq(nrec.deg), time, nrec.vel, nrec.dur * stepSec * 0.95);
      }
    }

    // SOLO — the wavefunction improvises: a probe crossing threshold picks a note
    if (flags.solo) {
      const pr = this.deps.soloProbe();
      const thresh = p.soloThresh as number;
      const density = p.soloDensity as number;
      const gate = pr.mag >= thresh && Math.random() < density * (0.4 + acc);
      if (gate) {
        const deg = c.soloDegree(pr.y, acc > 0.6);
        const dur = stepSec * (1 + Math.floor(Math.random() * 2)) * 0.9;
        this.deps.playSolo(c.degToFreq(deg), time, 0.6 + acc * 0.4, dur);
      }
    }
  }
}
