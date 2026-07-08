// timbres.ts — selectable instrument voices. spawn() builds short-lived nodes for one note
// of the chosen timbre and schedules its release. Used by all three parts (chord/riff/solo).
export const TIMBRE_IDS = ["hammond", "rhodes", "pipe", "prophet", "glocken", "pad", "voice", "noise"] as const;
export type TimbreId = typeof TIMBRE_IDS[number];

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = ctx.sampleRate * 2;
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b; return b;
}

function ampEnv(ctx: AudioContext, time: number, dur: number, atk: number, rel: number, peak: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(peak, time + atk);
  g.gain.setValueAtTime(peak, time + Math.max(atk, dur));
  g.gain.linearRampToValueAtTime(0, time + Math.max(atk, dur) + rel);
  return g;
}
function decayEnv(ctx: AudioContext, time: number, decay: number, peak: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(peak, time + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  return g;
}

// spawn one note. dest is the voice bus; level is applied there. cutoff tunes filtered timbres.
export function spawn(
  ctx: AudioContext, dest: AudioNode, id: TimbreId,
  freq: number, time: number, vel: number, dur: number, cutoff: number,
): void {
  const v = Math.max(0.02, vel);
  const stopAt = time + dur + 1.2;
  const osc = (type: OscillatorType, f: number, detune = 0): OscillatorNode => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.start(time); o.stop(stopAt); return o;
  };

  switch (id) {
    case "hammond": {
      const parts = [[1, 0.6], [2, 0.5], [3, 0.35], [4, 0.25], [6, 0.18], [8, 0.12]];
      const mix = ctx.createGain();
      for (const [h, a] of parts) { const o = osc("sine", freq * h, (h - 1) * 1.5); const g = ctx.createGain(); g.gain.value = a; o.connect(g); g.connect(mix); }
      const env = ampEnv(ctx, time, dur, 0.01, 0.08, v * 0.5);
      mix.connect(env); env.connect(dest);
      break;
    }
    case "rhodes": {
      const car = osc("sine", freq);
      const mod = osc("sine", freq * 14);
      const mg = ctx.createGain(); mg.gain.setValueAtTime(freq * 6 * v, time); mg.gain.exponentialRampToValueAtTime(freq * 0.5, time + 0.3);
      mod.connect(mg); mg.connect(car.frequency);
      const env = decayEnv(ctx, time, Math.max(0.4, dur), v * 0.7);
      car.connect(env); env.connect(dest);
      break;
    }
    case "pipe": {
      const mix = ctx.createGain();
      for (const h of [1, 2, 3, 4, 5, 6]) { const o = osc(h % 2 ? "sine" : "triangle", freq * h); const g = ctx.createGain(); g.gain.value = 0.5 / h; o.connect(g); g.connect(mix); }
      const nz = ctx.createBufferSource(); nz.buffer = noise(ctx); nz.loop = true; nz.start(time); nz.stop(stopAt);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq * 2; bp.Q.value = 3;
      const ng = ctx.createGain(); ng.gain.value = 0.04 * v; nz.connect(bp); bp.connect(ng); ng.connect(mix);
      const env = ampEnv(ctx, time, dur, 0.06, 0.12, v * 0.45);
      mix.connect(env); env.connect(dest);
      break;
    }
    case "prophet": {
      const o1 = osc("sawtooth", freq, -7); const o2 = osc("sawtooth", freq, 7);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 8;
      lp.frequency.setValueAtTime(cutoff * 2.2, time); lp.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff), time + 0.25);
      const env = ampEnv(ctx, time, dur, 0.01, 0.2, v * 0.5);
      o1.connect(lp); o2.connect(lp); lp.connect(env); env.connect(dest);
      break;
    }
    case "glocken": {
      const ratios = [1, 2.76, 5.4, 8.93];
      const mix = ctx.createGain();
      ratios.forEach((r, i) => { const o = osc("sine", freq * r); const g = ctx.createGain(); g.gain.value = (0.6 / (i + 1)) * v; const e = decayEnv(ctx, time, 0.6 / (i * 0.5 + 1), 1); o.connect(g); g.connect(e); e.connect(mix); });
      mix.connect(dest);
      break;
    }
    case "pad": {
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff;
      for (const dt of [-9, -3, 4, 10]) { const o = osc(dt % 2 ? "sawtooth" : "triangle", freq, dt); const g = ctx.createGain(); g.gain.value = 0.25; o.connect(g); g.connect(lp); }
      const env = ampEnv(ctx, time, dur, 0.35, 0.6, v * 0.45);
      lp.connect(env); env.connect(dest);
      break;
    }
    case "voice": {
      const src = osc("sawtooth", freq);
      const vib = osc("sine", 5.2); const vg = ctx.createGain(); vg.gain.value = freq * 0.01; vib.connect(vg); vg.connect(src.frequency);
      const formants = [[700, 10], [1100, 8], [2600, 6]];
      const mix = ctx.createGain();
      for (const [f, q] of formants) { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = q; src.connect(bp); bp.connect(mix); }
      const env = ampEnv(ctx, time, dur, 0.08, 0.2, v * 0.8);
      mix.connect(env); env.connect(dest);
      break;
    }
    case "noise": {
      const nz = ctx.createBufferSource(); nz.buffer = noise(ctx); nz.loop = true; nz.start(time); nz.stop(stopAt);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 12;
      const sub = osc("sine", freq); const sg = ctx.createGain(); sg.gain.value = 0.15;
      const env = ampEnv(ctx, time, dur, 0.12, 0.3, v * 0.5);
      nz.connect(bp); bp.connect(env); sub.connect(sg); sg.connect(env); env.connect(dest);
      break;
    }
  }
}
