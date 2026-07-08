// voices.ts — the three woven parts: chord pad, riff pluck, solo lead. Frequencies come
// from the Composer (any world scale); envelopes/timbre are subtractive.
import type { ParamState } from "../core/params";

// ── CHORD: detuned-saw pad, retriggered on chord change ─────────────────
export class ChordVoice {
  private active: { osc: OscillatorNode; g: GainNode }[] = [];
  private filter: BiquadFilterNode;
  private bus: GainNode;
  constructor(private ctx: AudioContext, out: GainNode) {
    this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass";
    this.bus = ctx.createGain();
    this.bus.connect(this.filter); this.filter.connect(out);
  }
  play(freqs: number[], time: number, p: ParamState): void {
    const ctx = this.ctx;
    const rel = p.chordRelease as number;
    // fade & retire old voices
    for (const v of this.active) {
      v.g.gain.cancelScheduledValues(time);
      v.g.gain.setValueAtTime(v.g.gain.value, time);
      v.g.gain.linearRampToValueAtTime(0, time + rel);
      v.osc.stop(time + rel + 0.05);
    }
    this.active = [];
    this.filter.frequency.setTargetAtTime(p.chordCutoff as number, time, 0.05);
    const atk = p.chordAttack as number;
    const lvl = (p.chordLevel as number) / Math.max(1, freqs.length);
    freqs.forEach((f, i) => {
      for (let d = 0; d < 2; d++) {
        const osc = ctx.createOscillator(); osc.type = "sawtooth";
        osc.frequency.value = f; osc.detune.value = (d === 0 ? -6 : 6) + (i - 1) * 2;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(lvl * 0.5, time + atk);
        const pan = ctx.createStereoPanner(); pan.pan.value = (i - (freqs.length - 1) / 2) * 0.4;
        osc.connect(g); g.connect(pan); pan.connect(this.bus);
        osc.start(time);
        this.active.push({ osc, g });
      }
    });
  }
}

// ── RIFF: short plucked tone ────────────────────────────────────────────
export class RiffVoice {
  constructor(private ctx: AudioContext, private out: GainNode) {}
  note(freq: number, time: number, vel: number, dur: number, p: ParamState): void {
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = freq; o2.detune.value = 5;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    const cut = (p.riffTone as number);
    lp.frequency.setValueAtTime(cut * 2.5, time);
    lp.frequency.exponentialRampToValueAtTime(Math.max(200, cut), time + 0.12);
    const decay = Math.min(dur, p.riffDecay as number);
    const g = ctx.createGain();
    const lvl = (p.riffLevel as number) * vel * 0.5;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(lvl, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.05, decay));
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.out);
    o1.start(time); o2.start(time); o1.stop(time + decay + 0.05); o2.stop(time + decay + 0.05);
  }
}

// ── SOLO: monophonic lead with glide + vibrato ──────────────────────────
export class SoloVoice {
  private osc: OscillatorNode;
  private filter: BiquadFilterNode;
  private amp: GainNode;
  private vib: OscillatorNode;
  private vibGain: GainNode;
  constructor(ctx: AudioContext, out: GainNode) {
    this.osc = ctx.createOscillator(); this.osc.type = "sawtooth"; this.osc.frequency.value = 440;
    this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass"; this.filter.Q.value = 6;
    this.amp = ctx.createGain(); this.amp.gain.value = 0;
    this.vib = ctx.createOscillator(); this.vib.type = "sine"; this.vib.frequency.value = 5.5;
    this.vibGain = ctx.createGain(); this.vibGain.gain.value = 0;
    this.vib.connect(this.vibGain); this.vibGain.connect(this.osc.detune);
    this.osc.connect(this.filter); this.filter.connect(this.amp); this.amp.connect(out);
    this.osc.start(); this.vib.start();
  }
  note(freq: number, time: number, vel: number, dur: number, p: ParamState): void {
    const glide = p.soloGlide as number;
    this.osc.frequency.setTargetAtTime(freq, time, Math.max(0.001, glide * 0.3));
    this.vibGain.gain.setTargetAtTime((p.soloVib as number) * 20, time + 0.05, 0.1);
    this.filter.frequency.setTargetAtTime(p.soloCutoff as number, time, 0.03);
    const lvl = (p.soloLevel as number) * vel;
    const a = this.amp.gain;
    a.cancelScheduledValues(time);
    a.setValueAtTime(a.value, time);
    a.linearRampToValueAtTime(lvl, time + 0.02);
    a.setTargetAtTime(0.0001, time + dur * 0.7, dur * 0.4);
  }
}
