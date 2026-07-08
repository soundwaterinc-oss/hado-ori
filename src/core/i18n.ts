// i18n.ts — EN/JP UI language. paramLabel() covers knob names; paramDesc() the INFO tab;
// t() everything else. Persisted in localStorage.
import { PARAMS, type ParamName } from "./params";

export type Lang = "EN" | "JP";
const LS_KEY = "hado.lang";
let current: Lang = (localStorage.getItem(LS_KEY) as Lang) || "EN";
export function getLang(): Lang { return current; }
export function setLang(l: Lang): void { current = l; localStorage.setItem(LS_KEY, l); }
export function toggleLang(): Lang { setLang(current === "EN" ? "JP" : "EN"); return current; }

const PARAM_JA: Partial<Record<ParamName, string>> = {
  masterGain: "マスター音量",
  geoMode: "幾何モード", geoModeA: "ハイブリッドA", geoModeB: "ハイブリッドB", seedCount: "種数",
  angleOffset: "角度オフセット", wellDepth: "井戸の深さ", wellRadius: "井戸半径",
  lsysIterations: "L反復", branchAngle: "分岐角", lsysSeed: "Lシード", cellCount: "細胞数",
  relax: "Lloyd緩和", wallWidth: "壁の幅", wallHeight: "壁の高さ", geoMix: "幾何ミックス",
  brushRadius: "ブラシ半径", brushDepth: "ブラシ深度",
  packetX: "パケットX", packetY: "パケットY", packetWidth: "パケット幅", px: "運動量X", py: "運動量Y",
  substeps: "サブステップ", damping: "減衰", boundary: "境界", modeCount: "モード数", warp: "ワープ",
  scaleId: "スケール", fRoot: "主音", chordSize: "和音の音数", autoScale: "自動スケール(flux)",
  rhythmId: "リズム", bpm: "テンポ", chordEvery: "和音/周期",
  chordOn: "コード", riffOn: "リフ", soloOn: "ソロ",
  chordLevel: "コード音量", chordCutoff: "コードカットオフ",
  riffLevel: "リフ音量", riffTone: "リフ音色",
  soloLevel: "ソロ音量", soloCutoff: "ソロカットオフ",
  soloThresh: "ソロ閾値", soloDensity: "ソロ密度",
  drive: "ドライブ", delayTime: "ディレイ時間", delayFb: "ディレイFB", reverbSize: "残響長", reverbMix: "残響量",
  fxSendChord: "FX送りコード", fxSendRiff: "FX送りリフ", fxSendSolo: "FX送りソロ",
  patternFamily: "文様", palette: "配色", symmetry: "対称数", patternScale: "文様スケール",
  morphAmt: "変容", fieldWarp: "場の歪み", lineWidth: "線幅", patternSpeed: "流れ速度",
  feedAmount: "帰還量", mutateRate: "変性レート", mutateSmooth: "変性平滑",
  rmsTarget: "RMS目標", centTarget: "重心目標", freeze: "凍結",
  midiEnable: "MIDI有効", midiCh: "MIDIチャンネル", wsRate: "WS送信レート", sendField: "場送信", fieldRate: "場レート",
  chordTimbre: "コード音色", riffTimbre: "リフ音色", soloTimbre: "ソロ音色",
  arrangeOn: "自動展開", engine: "展開エンジン", climate: "気候帯", current: "潮流", soil: "土質", weather: "天気",
  sectionBars: "セクション小節", stageBars: "ステージ小節",
};

const DESC_EN: Partial<Record<ParamName, string>> = {
  geoMode: "which plant geometry builds the potential V", geoModeA: "source A in HYBRID", geoModeB: "source B in HYBRID",
  seedCount: "number of phyllotaxis wells", angleOffset: "nudge the golden angle",
  wellDepth: "how strongly wells trap the wave", wellRadius: "size of each well",
  lsysIterations: "L-system growth depth", branchAngle: "L-system branch angle", lsysSeed: "reproducible random seed",
  cellCount: "Voronoi cell count", relax: "Lloyd relaxation passes", wallWidth: "barrier thickness",
  wallHeight: "barrier height", geoMix: "crossfade A↔B", brushRadius: "brush size", brushDepth: "dig(−)/raise(+)",
  packetX: "initial packet x", packetY: "initial packet y", packetWidth: "packet size", px: "initial momentum x", py: "initial momentum y",
  substeps: "sim steps per frame", damping: "keeps the sim stable", boundary: "reflect or absorb edges",
  modeCount: "spectral peaks tracked", warp: "spectrum → pitch curve",
  scaleId: "world scale (modes, ragas, maqam, gamelan, pentatonics…)",
  fRoot: "tonic pitch of the whole piece", chordSize: "notes stacked per chord (triad→7th…)",
  autoScale: "let spectral flux occasionally pick a new scale",
  rhythmId: "world rhythm cycle (tala, aksak, clave, iqa', bell…)",
  bpm: "tempo", chordEvery: "advance the chord every N cycles",
  chordOn: "enable the chord pad", riffOn: "enable the riff", soloOn: "enable the field-driven solo",
  chordLevel: "chord pad level", chordCutoff: "chord filter cutoff",
  riffLevel: "riff level", riffTone: "riff filter cutoff",
  soloLevel: "solo level", soloCutoff: "solo filter cutoff",
  soloThresh: "|ψ|² a probe must exceed for a solo note", soloDensity: "how freely the wavefunction solos",
  drive: "FX-send saturation", delayTime: "delay time", delayFb: "delay feedback", reverbSize: "reverb length", reverbMix: "reverb send",
  fxSendChord: "chord → FX send", fxSendRiff: "riff → FX send", fxSendSolo: "solo → FX send",
  patternFamily: "ethnic pattern: mandala / kilim / girih star / knot / kolam",
  palette: "colour scheme (indigo, jewel, earth, ochre, mono, sunset)",
  symmetry: "rotational symmetry order of the pattern", patternScale: "how many pattern repeats fit",
  morphAmt: "how much |ψ|² warps & lights the weave", fieldWarp: "how much the wavefield bends the geometry",
  lineWidth: "pattern line thickness", patternSpeed: "drift/animation speed",
  feedAmount: "depth of audio → geometry feedback (0 = off)", mutateRate: "how often geometry mutates", mutateSmooth: "smoothing of mutation",
  rmsTarget: "loudness the feedback aims for", centTarget: "brightness the feedback aims for", freeze: "pause the mutation loop",
  midiEnable: "enable WebMIDI out", midiCh: "MIDI channel", wsRate: "TouchDesigner JSON rate", sendField: "stream |ψ|² to TD", fieldRate: "TD field rate",
  chordTimbre: "instrument for the chord pad", riffTimbre: "instrument for the riff", soloTimbre: "instrument for the solo",
  arrangeOn: "auto-evolve the arrangement every section / stage",
  engine: "how factors map to development: PLANT growth · PHYSICS oscillation · GEOMETRY quantised",
  climate: "factor: tropical→busy … polar→sparse (energy & tempo)",
  current: "factor: warm / cold / gyre / upwelling (motion & solo activity)",
  soil: "factor: sand / clay / loam / volcanic (richness & pattern)",
  weather: "factor: clear / rain / storm / fog (density & space)",
  sectionBars: "cycles per section — a new variation each section",
  stageBars: "cycles per stage of the 1→5 arc (intro→climax→resolve)",
};
const DESC_JP: Partial<Record<ParamName, string>> = {
  geoMode: "ポテンシャルVを作る植物幾何", geoModeA: "HYBRIDの素材A", geoModeB: "HYBRIDの素材B",
  seedCount: "フィロタキシスの井戸数", angleOffset: "黄金角を微調整",
  wellDepth: "井戸が波を捕える強さ", wellRadius: "各井戸の大きさ",
  lsysIterations: "L-systemの成長段階", branchAngle: "L-systemの分岐角", lsysSeed: "再現用の乱数シード",
  cellCount: "ボロノイ細胞数", relax: "Lloyd緩和の回数", wallWidth: "障壁の厚み",
  wallHeight: "障壁の高さ", geoMix: "A↔Bクロスフェード", brushRadius: "ブラシ半径", brushDepth: "掘る(−)/盛る(+)",
  packetX: "初期波束X", packetY: "初期波束Y", packetWidth: "波束の大きさ", px: "初期運動量X", py: "初期運動量Y",
  substeps: "1フレームのシミュ回数", damping: "発散を防ぐ", boundary: "反射/吸収の端",
  modeCount: "追跡するスペクトルのピーク数", warp: "スペクトル→ピッチのカーブ",
  scaleId: "世界のスケール（旋法・ラーガ・マカーム・ガムラン・五音…）",
  fRoot: "曲全体の主音", chordSize: "和音に積む音数（三和音→7th…）",
  autoScale: "spectral fluxで時々スケールを変える",
  rhythmId: "世界のリズム周期（ターラ・アクサク・クラーベ・イーカー・ベル…）",
  bpm: "テンポ", chordEvery: "N周期ごとに和音を進める",
  chordOn: "コードパッドを有効化", riffOn: "リフを有効化", soloOn: "場が弾くソロを有効化",
  chordLevel: "コード音量", chordCutoff: "コードのフィルタ",
  riffLevel: "リフ音量", riffTone: "リフのフィルタ",
  soloLevel: "ソロ音量", soloCutoff: "ソロのフィルタ",
  soloThresh: "ソロ発音に必要な|ψ|²", soloDensity: "波動関数がソロを弾く自由度",
  drive: "FX送りのサチュレーション", delayTime: "ディレイ時間", delayFb: "ディレイ帰還", reverbSize: "残響の長さ", reverbMix: "残響の送り",
  fxSendChord: "コード→FX送り", fxSendRiff: "リフ→FX送り", fxSendSolo: "ソロ→FX送り",
  patternFamily: "民族文様：マンダラ/キリム/ギリー星形/組紐/コーラム",
  palette: "配色（藍・宝石・大地・黄土・モノ・夕焼け）",
  symmetry: "文様の回転対称数", patternScale: "文様の繰り返し密度",
  morphAmt: "|ψ|²が織りを歪め光らせる量", fieldWarp: "波動場が幾何を曲げる量",
  lineWidth: "文様の線の太さ", patternSpeed: "流れ・アニメ速度",
  feedAmount: "音→幾何フィードバックの深さ（0で停止）", mutateRate: "幾何が変性する頻度", mutateSmooth: "変性の平滑化",
  rmsTarget: "目標音量", centTarget: "目標の明るさ", freeze: "変性ループ停止",
  midiEnable: "WebMIDI出力を有効化", midiCh: "MIDIチャンネル", wsRate: "TD JSON送信レート", sendField: "|ψ|²をTDへ送出", fieldRate: "TD場レート",
  chordTimbre: "コードパッドの楽器", riffTimbre: "リフの楽器", soloTimbre: "ソロの楽器",
  arrangeOn: "セクション/ステージごとに展開を自動変性",
  engine: "ファクターの写像: PLANT成長 · PHYSICS振動 · GEOMETRY量子化",
  climate: "ファクター: 熱帯→密…極地→疎（エネルギー・テンポ）",
  current: "ファクター: 暖流/寒流/環流/湧昇（動き・ソロ活性）",
  soil: "ファクター: 砂/粘土/壌土/火山（豊かさ・文様）",
  weather: "ファクター: 快晴/雨/嵐/霧（密度・空間）",
  sectionBars: "1セクションの周期数——毎セクション新しい変化",
  stageBars: "1→5アークの各ステージの周期数（序→クライマックス→終）",
};
export function paramDesc(name: ParamName): string { return (current === "JP" ? DESC_JP[name] : DESC_EN[name]) ?? ""; }
export function paramLabel(name: ParamName): string {
  if (current === "JP") return PARAM_JA[name] ?? PARAMS[name].label;
  return PARAMS[name].label;
}

const STRINGS: Record<Lang, Record<string, string>> = {
  EN: {
    "tab.PERFORM": "PLAY", "tab.INFO": "INFO", "tab.GEO": "GEO", "tab.FIELD": "FIELD",
    "tab.SCALE": "SCALE", "tab.RHYTHM": "RHYTHM", "tab.TIMBRE": "TIMBRE", "tab.EVOLVE": "EVOLVE",
    "tab.VOICES": "VOICES", "tab.PATTERN": "PATTERN", "tab.MUTATE": "MUTATE", "tab.IO": "IO",
    play: "▶ play", stop: "■ stop", regen: "↻ regen", resetPsi: "reset ψ",
    save: "save", export: "export", import: "import", connect: "connect", disconnect: "disconnect", enableMidi: "enable midi",
    presetName: "preset name", macros: "MACROS", output: "OUTPUT", presets: "PRESETS",
    midiOut: "MIDI out", tdBridge: "TouchDesigner bridge",
    "v.chordOn": "chord", "v.riffOn": "riff", "v.soloOn": "solo",
    perform: "PERFORMANCE", quickPresets: "PRESETS",
    weaveNote: "chord = progression · riff = ostinato · solo = the wavefunction improvises · ↻ regen for a new riff/key",
    conceptTitle: "HADŌ ORI / 波動織 — concept",
    concept:
      "The time-independent Schrödinger equation is the same mathematics as a vibrating membrane, " +
      "so quantum stationary states are acoustic modes. Plant geometry shapes a potential V and a wave " +
      "packet ψ evolves on it. HADŌ ORI weaves three parts over a world scale and rhythm cycle: the CHORD " +
      "progression moves each cycle (spectral flux picks cadence vs. exploration), the RIFF is a generated " +
      "ostinato, and the SOLO is improvised by the wavefunction itself — a field probe crossing threshold " +
      "picks the next scale note. The visuals are world geometric patterns (mandala, kilim, girih star, knot, " +
      "kolam) that the wavefield warps and lights; the chord hue tints them, riff pulses brighten, solo notes spark.\n\n" +
      "Click the field to observe (collapse ψ) and scatter. Drag to brush the potential (Shift = raise). " +
      "Space plays; ↻ regenerates the riff & key; R resets the field; F freezes the mutation loop.",
  },
  JP: {
    "tab.PERFORM": "演奏", "tab.INFO": "説明", "tab.GEO": "幾何", "tab.FIELD": "場",
    "tab.SCALE": "音階", "tab.RHYTHM": "律動", "tab.TIMBRE": "音色", "tab.EVOLVE": "展開",
    "tab.VOICES": "声部", "tab.PATTERN": "文様", "tab.MUTATE": "変性", "tab.IO": "入出力",
    play: "▶ 再生", stop: "■ 停止", regen: "↻ 再生成", resetPsi: "場リセット",
    save: "保存", export: "書出", import: "読込", connect: "接続", disconnect: "切断", enableMidi: "MIDI有効化",
    presetName: "プリセット名", macros: "マクロ", output: "出力", presets: "プリセット",
    midiOut: "MIDI出力", tdBridge: "TouchDesigner連携",
    "v.chordOn": "コード", "v.riffOn": "リフ", "v.soloOn": "ソロ",
    perform: "演奏コントロール", quickPresets: "プリセット",
    weaveNote: "コード=進行 · リフ=オスティナート · ソロ=波動関数が即興 · ↻でリフ/調を再生成",
    conceptTitle: "HADŌ ORI / 波動織 — 概念",
    concept:
      "時間非依存シュレディンガー方程式は膜の振動と同じ数学で、量子の定常状態＝音響の固有モードです。" +
      "植物の幾何がポテンシャルVを形づくり、波束ψがその上を時間発展します。HADŌ ORI は世界の音階と" +
      "リズム周期の上で三つの声部を織ります：コード進行は周期ごとに動き（spectral flux が終止か探索かを選ぶ）、" +
      "リフは生成されたオスティナート、ソロは波動関数自身が即興します——場のプローブが閾値を超えると次の音を選ぶ。" +
      "映像は世界の幾何文様（マンダラ・キリム・ギリー星形・組紐・コーラム）で、波動場が歪め光らせ、" +
      "コードの色相が染め、リフの脈動が明滅し、ソロが火花を散らします。\n\n" +
      "キャンバスをクリックで観測（ψ収縮）＋散布。ドラッグでポテンシャルを掘る（Shiftで盛る）。" +
      "Spaceで再生、↻でリフ/調を再生成、Rで場リセット、Fで変性ループ凍結。",
  },
};
export function t(id: string): string { return STRINGS[current][id] ?? STRINGS.EN[id] ?? id; }
