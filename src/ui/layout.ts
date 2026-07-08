// layout.ts — HADŌ ORI UI: tabs + square canvas (morphing ethnic pattern) + cycle bar +
// voice toggles/transport + macro column + PLAY/INFO tabs. i18n EN/JP, toggled live.
import { PARAMS, type ParamName, type ParamState, type ParamTab } from "../core/params";
import { makeControl } from "./knob";
import { WeaveSequencer } from "../seq/weave";
import { t, getLang, toggleLang, paramLabel, paramDesc } from "../core/i18n";

const TABS: ParamTab[] = ["PERFORM", "SCALE", "RHYTHM", "TIMBRE", "EVOLVE", "VOICES", "PATTERN", "GEO", "FIELD", "MUTATE", "IO", "INFO"];
const PARAM_TABS: ParamTab[] = ["SCALE", "RHYTHM", "TIMBRE", "EVOLVE", "VOICES", "PATTERN", "GEO", "FIELD", "MUTATE", "IO"];
const MACROS: ParamName[] = ["chordLevel", "riffLevel", "soloLevel", "reverbMix"];
const PERFORM_MACROS: ParamName[] = ["soloDensity", "soloCutoff", "chordCutoff", "reverbMix", "bpm", "morphAmt"];

export interface UIHooks {
  onParamChange: (name: ParamName) => void;
  onObserve: (x: number, y: number) => void;
  onBrush: (x: number, y: number, raise: boolean) => void;
  onReset: () => void;
  onTogglePlay: () => void;
  onRegen: () => void;
  presetSave: (name: string) => void;
  presetLoad: (name: string) => void;
  presetList: () => string[];
  exportJSON: () => void;
  importJSON: (text: string) => void;
  midiEnable: () => void;
  midiSelect: (id: string) => void;
  midiDevices: () => { id: string; name: string }[];
  tdConnect: (url: string) => void;
  tdDisconnect: () => void;
}

type Refreshable = HTMLElement & { refresh?: () => void; relabel?: () => void };
const MAXCELLS = 16;

export class OriUI {
  canvas: HTMLCanvasElement;
  private root: HTMLElement;
  private cells: HTMLElement[] = [];
  private cycleLen = 16;
  private controls: Refreshable[] = [];
  private meterBar!: HTMLElement;
  private hud!: HTMLElement;
  private warnEl!: HTMLElement;
  private playBtn: HTMLElement | null = null;
  private performPlay: HTMLElement | null = null;
  private voiceChips: { name: ParamName; el: HTMLElement }[] = [];
  private langBtn!: HTMLElement;
  private playing = false;
  private tdStatus!: HTMLElement;
  private midiSel!: HTMLSelectElement;
  private presetSel!: HTMLSelectElement;

  constructor(root: HTMLElement, private state: ParamState, _seq: WeaveSequencer, private hooks: UIHooks) {
    this.root = root;
    root.innerHTML = "";
    const left = div("left");
    const right = div("right");
    root.append(left, right);

    const tabsbar = div("tabsbar");
    const panels: Record<string, HTMLElement> = {};
    const tabBtns: HTMLElement[] = [];
    left.appendChild(tabsbar);

    const stage = div("stage");
    this.canvas = document.createElement("canvas");
    this.canvas.id = "glcanvas";
    this.hud = div("hud");
    this.warnEl = div("warn");
    stage.append(this.canvas, this.hud, this.warnEl);

    const panelHost = div("panelhost");
    panelHost.style.cssText = "flex:0 0 auto;max-height:36vh;overflow-y:auto;";
    for (const tab of TABS) {
      const panel = document.createElement("div");
      panel.className = "panel" + (tab === "IO" ? " io" : tab === "MUTATE" ? " mutate" : "");
      this.buildPanel(panel, tab);
      panels[tab] = panel;
      panelHost.appendChild(panel);
      const btn = div("tabbtn");
      btn.dataset.i18n = "tab." + tab;
      btn.textContent = t("tab." + tab);
      btn.addEventListener("click", () => {
        for (const b of tabBtns) b.classList.remove("active");
        btn.classList.add("active");
        for (const p of Object.values(panels)) p.classList.remove("active");
        panel.classList.add("active");
      });
      tabBtns.push(btn);
      tabsbar.appendChild(btn);
    }
    this.langBtn = div("tabbtn lang");
    this.langBtn.textContent = getLang() === "EN" ? "日本語" : "EN";
    this.langBtn.addEventListener("click", () => {
      toggleLang();
      this.langBtn.textContent = getLang() === "EN" ? "日本語" : "EN";
      this.applyLanguage();
    });
    tabsbar.appendChild(this.langBtn);

    left.append(panelHost, stage, this.buildTransport(), this.buildCycleBar());
    tabBtns[0].classList.add("active");
    panels[TABS[0]].classList.add("active");

    this.buildRight(right);
    this.bindCanvas();
  }

  private buildPanel(panel: HTMLElement, tab: ParamTab): void {
    if (tab === "INFO") { this.buildInfo(panel); return; }
    if (tab === "PERFORM") { this.buildPerform(panel); return; }
    for (const key of Object.keys(PARAMS) as ParamName[]) {
      if (PARAMS[key].tab !== tab) continue;
      const c = makeControl(key, this.state, this.hooks.onParamChange) as Refreshable;
      this.controls.push(c);
      panel.appendChild(c);
    }
    if (tab === "IO") this.buildIO(panel);
    if (tab === "VOICES") {
      const note = div("status"); note.dataset.i18n = "weaveNote"; note.textContent = t("weaveNote");
      panel.appendChild(note);
    }
  }

  private addControl(panel: HTMLElement, name: ParamName, big: boolean): void {
    const c = makeControl(name, this.state, this.hooks.onParamChange) as Refreshable;
    if (big) c.classList.add("big");
    this.controls.push(c);
    panel.appendChild(c);
  }

  private buildPerform(panel: HTMLElement): void {
    panel.classList.add("perform");
    const tr = div("perform-transport");
    this.performPlay = button("play", () => this.hooks.onTogglePlay());
    this.performPlay.classList.add("big", "play");
    tr.append(this.performPlay, mkbutton2(t("regen"), () => this.hooks.onRegen()));
    panel.appendChild(tr);

    this.addControl(panel, "masterGain", true);
    for (const m of PERFORM_MACROS) this.addControl(panel, m, true);
    panel.appendChild(this.buildXY("soloDensity", "soloCutoff"));

    panel.appendChild(header("quickPresets"));
    const pr = div("perform-presets");
    for (const nm of this.hooks.presetList().slice(0, 8)) pr.appendChild(mkbutton2(nm, () => this.hooks.presetLoad(nm)));
    panel.appendChild(pr);
  }

  private buildXY(xName: ParamName, yName: ParamName): HTMLElement {
    const xp = PARAMS[xName] as { min: number; max: number };
    const yp = PARAMS[yName] as { min: number; max: number };
    const pad = div("xypad");
    const dot = div("xydot");
    pad.appendChild(dot);
    const place = (): void => {
      const x = ((this.state[xName] as number) - xp.min) / (xp.max - xp.min);
      const y = ((this.state[yName] as number) - yp.min) / (yp.max - yp.min);
      dot.style.left = `${x * 100}%`; dot.style.bottom = `${y * 100}%`;
    };
    place();
    let drag = false;
    const move = (e: PointerEvent): void => {
      if (!drag) return;
      const r = pad.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height));
      this.state[xName] = xp.min + x * (xp.max - xp.min);
      this.state[yName] = yp.min + y * (yp.max - yp.min);
      place();
      this.hooks.onParamChange(xName); this.hooks.onParamChange(yName);
    };
    pad.addEventListener("pointerdown", (e) => { drag = true; move(e); });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", () => { drag = false; });
    (pad as Refreshable).refresh = place;
    this.controls.push(pad as Refreshable);
    const wrap = div("ctl xywrap");
    const lab = document.createElement("label");
    const nameSpan = document.createElement("span");
    const setLab = (): void => { nameSpan.textContent = `XY · ${paramLabel(xName)} / ${paramLabel(yName)}`; };
    setLab(); lab.appendChild(nameSpan);
    wrap.append(lab, pad);
    (wrap as Refreshable).relabel = setLab;
    this.controls.push(wrap as Refreshable);
    return wrap;
  }

  private buildInfo(panel: HTMLElement): void {
    panel.classList.add("info");
    const title = document.createElement("h4"); title.dataset.i18n = "conceptTitle"; title.textContent = t("conceptTitle");
    const con = div("concept"); con.dataset.i18n = "concept"; con.textContent = t("concept");
    panel.append(title, con);
    for (const tab of PARAM_TABS) {
      panel.appendChild(header("tab." + tab));
      for (const key of Object.keys(PARAMS) as ParamName[]) {
        if (PARAMS[key].tab !== tab) continue;
        const row = div("inforow");
        const nm = document.createElement("span"); nm.className = "in-name"; nm.dataset.i18nParam = key; nm.textContent = paramLabel(key);
        const ds = document.createElement("span"); ds.className = "in-desc"; ds.dataset.i18nDesc = key; ds.textContent = paramDesc(key);
        row.append(nm, ds); panel.appendChild(row);
      }
    }
  }

  private buildIO(panel: HTMLElement): void {
    const midiWrap = div("ctl");
    const midiBtn = button("enableMidi", () => { this.hooks.midiEnable(); setTimeout(() => this.refreshMidiDevices(), 400); });
    this.midiSel = document.createElement("select"); this.midiSel.className = "enumsel";
    this.midiSel.addEventListener("change", () => this.hooks.midiSelect(this.midiSel.value));
    midiWrap.append(labelEl("midiOut"), midiBtn, this.midiSel);
    panel.appendChild(midiWrap);
    const tdWrap = div("ctl");
    const url = document.createElement("input"); url.className = "txt"; url.value = "ws://localhost:9980";
    const row = div("row");
    row.append(button("connect", () => this.hooks.tdConnect(url.value)), button("disconnect", () => this.hooks.tdDisconnect()));
    this.tdStatus = div("status"); this.tdStatus.textContent = "TD: idle (dormant)";
    tdWrap.append(labelEl("tdBridge"), url, row, this.tdStatus);
    panel.appendChild(tdWrap);
  }

  private buildTransport(): HTMLElement {
    const bar = div("transport");
    this.playBtn = button("play", () => this.hooks.onTogglePlay());
    this.playBtn.classList.add("play");
    const regen = button("regen", () => this.hooks.onRegen());
    const reset = button("resetPsi", () => this.hooks.onReset());
    bar.append(this.playBtn, regen, reset);
    this.voiceChips = [];
    for (const name of ["chordOn", "riffOn", "soloOn"] as ParamName[]) {
      const chip = div("chip");
      chip.dataset.i18n = "v." + name;
      chip.textContent = t("v." + name);
      chip.addEventListener("click", () => {
        this.state[name] = !(this.state[name] as boolean);
        this.syncChips(); this.hooks.onParamChange(name);
      });
      this.voiceChips.push({ name, el: chip });
      bar.appendChild(chip);
    }
    this.syncChips();
    return bar;
  }

  private syncChips(): void {
    for (const c of this.voiceChips) c.el.classList.toggle("on", this.state[c.name] as boolean);
  }

  private buildCycleBar(): HTMLElement {
    const bar = div("cyclebar");
    for (let i = 0; i < MAXCELLS; i++) { const cell = div("ccell"); this.cells.push(cell); bar.appendChild(cell); }
    return bar;
  }

  private buildRight(right: HTMLElement): void {
    right.appendChild(header("macros"));
    for (const m of MACROS) this.addControl(right, m, false);
    this.meterBar = div("bar");
    const meter = div("meter"); meter.appendChild(this.meterBar);
    right.append(header("output"), meter);

    this.presetSel = document.createElement("select"); this.presetSel.className = "enumsel";
    this.refreshPresets();
    this.presetSel.addEventListener("change", () => this.hooks.presetLoad(this.presetSel.value));
    const nameIn = document.createElement("input"); nameIn.className = "txt"; nameIn.dataset.i18nPh = "presetName"; nameIn.placeholder = t("presetName");
    const row1 = div("row");
    row1.append(button("save", () => { if (nameIn.value) { this.hooks.presetSave(nameIn.value); this.refreshPresets(); } }), button("export", () => this.hooks.exportJSON()));
    const importInput = document.createElement("input"); importInput.type = "file"; importInput.accept = ".json"; importInput.style.display = "none";
    importInput.addEventListener("change", async () => { const f = importInput.files?.[0]; if (f) this.hooks.importJSON(await f.text()); });
    const row2 = div("row"); row2.append(button("import", () => importInput.click()));
    right.append(header("presets"), this.presetSel, nameIn, row1, row2, importInput);
  }

  private bindCanvas(): void {
    const toXY = (e: PointerEvent): [number, number] => {
      const r = this.canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    let down = false, moved = false, shift = false;
    this.canvas.addEventListener("pointerdown", (e) => { down = true; moved = false; shift = e.shiftKey; });
    this.canvas.addEventListener("pointermove", (e) => { if (!down) return; moved = true; const [x, y] = toXY(e); this.hooks.onBrush(x, y, shift); });
    this.canvas.addEventListener("pointerup", (e) => { const [x, y] = toXY(e); if (!moved) this.hooks.onObserve(x, y); down = false; });
  }

  // ── live updates ────────────────────────────────────────────────────
  setMeter(rms: number): void { this.meterBar.style.width = `${Math.min(100, rms * 300)}%`; }
  setHud(text: string): void { this.hud.textContent = text; }
  setWarn(text: string): void { this.warnEl.textContent = text; }
  setPlaying(on: boolean): void {
    this.playing = on;
    for (const b of [this.playBtn, this.performPlay]) {
      if (!b) continue;
      b.textContent = t(on ? "stop" : "play");
      b.classList.toggle("active", on);
    }
  }
  setCycleLength(n: number): void {
    this.cycleLen = n;
    this.cells.forEach((c, i) => c.classList.toggle("void", i >= n));
  }
  setStepCursor(step: number): void {
    this.cells.forEach((c, i) => c.classList.toggle("cursor", i === step && i < this.cycleLen));
  }
  setTdStatus(text: string, cls = ""): void { this.tdStatus.textContent = text; this.tdStatus.className = "status " + cls; }
  refreshAll(): void { for (const c of this.controls) c.refresh?.(); this.syncChips(); }

  applyLanguage(): void {
    this.root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n!); });
    this.root.querySelectorAll<HTMLInputElement>("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh!); });
    this.root.querySelectorAll<HTMLElement>("[data-i18n-param]").forEach((el) => { el.textContent = paramLabel(el.dataset.i18nParam as ParamName); });
    this.root.querySelectorAll<HTMLElement>("[data-i18n-desc]").forEach((el) => { el.textContent = paramDesc(el.dataset.i18nDesc as ParamName); });
    for (const c of this.controls) c.relabel?.();
    this.setPlaying(this.playing);
  }

  refreshMidiDevices(): void {
    const devs = this.hooks.midiDevices();
    this.midiSel.innerHTML = "";
    for (const d of devs) { const o = document.createElement("option"); o.value = d.id; o.textContent = d.name; this.midiSel.appendChild(o); }
  }
  private refreshPresets(): void {
    const list = this.hooks.presetList();
    this.presetSel.innerHTML = "";
    for (const nm of list) { const o = document.createElement("option"); o.value = nm; o.textContent = nm; this.presetSel.appendChild(o); }
  }
}

function div(cls: string): HTMLElement { const d = document.createElement("div"); d.className = cls; return d; }
function mkbutton2(text: string, on: () => void): HTMLElement {
  const b = document.createElement("button"); b.className = "btn"; b.textContent = text; b.addEventListener("click", on); return b;
}
function button(id: string, on: () => void): HTMLElement {
  const b = document.createElement("button"); b.className = "btn"; b.dataset.i18n = id; b.textContent = t(id); b.addEventListener("click", on); return b;
}
function labelEl(id: string): HTMLElement {
  const l = document.createElement("label"); const s = document.createElement("span"); s.dataset.i18n = id; s.textContent = t(id); l.appendChild(s); return l;
}
function header(id: string): HTMLElement {
  const h = document.createElement("h4"); h.dataset.i18n = id; h.textContent = t(id); return h;
}
