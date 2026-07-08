// voices.ts — one Instrument per part (chord / riff / solo). Timbre is selectable per part
// (see timbres.ts); the bus gain carries the part level. Notes are polyphonic per-note.
import { spawn, type TimbreId } from "./timbres";

export class Instrument {
  readonly bus: GainNode;
  constructor(private ctx: AudioContext, out: GainNode) {
    this.bus = ctx.createGain();
    this.bus.connect(out);
  }
  setLevel(v: number): void { this.bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); }
  note(freq: number, time: number, vel: number, dur: number, timbre: TimbreId, cutoff: number): void {
    spawn(this.ctx, this.bus, timbre, freq, time, vel, dur, cutoff);
  }
}
