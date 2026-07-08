// engine.ts — AudioContext graph for HADŌ ORI: chord / riff / solo buses → shared FX
// (delay + reverb) → master gain → limiter → analyser → out.
import type { HadoFeatures } from "../core/features";
import type { ParamState } from "../core/params";
import { FxChain } from "./fx";
import { Instrument } from "./voices";
import { Analyser } from "./analyser";

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly chord: Instrument;
  readonly riff: Instrument;
  readonly solo: Instrument;
  readonly analyser: Analyser;
  private fx: FxChain;
  private master: GainNode;
  private masterSum: GainNode;
  private limiter: DynamicsCompressorNode;
  private chordBus: GainNode;
  private riffBus: GainNode;
  private soloBus: GainNode;
  private sendChord: GainNode;
  private sendRiff: GainNode;
  private sendSolo: GainNode;
  started = false;

  constructor() {
    this.ctx = new AudioContext({ sampleRate: 48000, latencyHint: "interactive" });
    const ctx = this.ctx;
    this.fx = new FxChain(ctx);
    this.analyser = new Analyser(ctx);
    this.masterSum = ctx.createGain();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;

    this.chordBus = ctx.createGain();
    this.riffBus = ctx.createGain();
    this.soloBus = ctx.createGain();
    this.sendChord = ctx.createGain();
    this.sendRiff = ctx.createGain();
    this.sendSolo = ctx.createGain();
    for (const [bus, send] of [
      [this.chordBus, this.sendChord], [this.riffBus, this.sendRiff], [this.soloBus, this.sendSolo],
    ] as [GainNode, GainNode][]) {
      bus.connect(this.masterSum);
      bus.connect(send); send.connect(this.fx.input);
    }
    this.fx.output.connect(this.masterSum);

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.ratio.value = 20; this.limiter.threshold.value = -3;
    this.limiter.attack.value = 0.003; this.limiter.release.value = 0.15;
    this.masterSum.connect(this.limiter); this.limiter.connect(this.master);
    this.master.connect(this.analyser.input); this.analyser.input.connect(ctx.destination);

    this.chord = new Instrument(ctx, this.chordBus);
    this.riff = new Instrument(ctx, this.riffBus);
    this.solo = new Instrument(ctx, this.soloBus);
  }

  async resume(): Promise<void> {
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.started = true;
  }
  get now(): number { return this.ctx.currentTime; }

  update(_dt: number, features: HadoFeatures, p: ParamState, nowMs: number): void {
    if (!this.started) return;
    this.master.gain.setTargetAtTime(p.masterGain as number, this.now, 0.02);
    this.fx.update(p);
    this.chord.setLevel(p.chordLevel as number);
    this.riff.setLevel(p.riffLevel as number);
    this.solo.setLevel(p.soloLevel as number);
    this.sendChord.gain.value = p.fxSendChord as number;
    this.sendRiff.gain.value = p.fxSendRiff as number;
    this.sendSolo.gain.value = p.fxSendSolo as number;
    this.analyser.update(nowMs);
    features.analysis = this.analyser.out;
  }
}
