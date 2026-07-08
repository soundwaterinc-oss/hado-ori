# HADŌ ORI / 波動織

The fourth HADŌ machine — a generative instrument that **weaves chord progressions, riffs
and solos** from the wavefunction, over scales and rhythms drawn from world musical
traditions, while **world geometric patterns morph** with the field. (織 ori = weaving:
the interlacing of voices, and of textile/tiling geometry.)

The time-independent Schrödinger equation is the same mathematics as a vibrating membrane,
so quantum stationary states are acoustic modes. Plant geometry (phyllotaxis / L-system /
Voronoi) shapes a potential `V`; a wave packet `ψ` evolves on it and drives everything:

- **CHORD** — a progression that advances each rhythm cycle; spectral flux picks cadence
  (return to the tonic) vs. exploration (fourths/fifths), built by stacking scale steps.
- **RIFF** — a generated ostinato in the current scale, regenerated on `↻` / key change.
- **SOLO** — improvised by the wavefunction itself: a field probe crossing `soloThresh`
  picks the next scale note; `|ψ|²` sets density and register, strong beats snap to chord tones.
- **FEEDBACK** — master RMS/centroid/flux slowly mutate the geometry (and optionally the scale).

## World scales & rhythms

~55 **scales**: Western modes, Indian ragas (Bhairav, Yaman, Todi, Marwa…), Arabic/Turkish
maqam with neutral (quarter-tone) steps (Rast, Bayati, Hijaz, Saba, Sikah…), Persian dastgah,
Japanese (In, Hirajoshi, Iwato, Kumoi…), Chinese pentatonic modes, Indonesian **gamelan**
(microtonal slendro & pelog), Ethiopian qenat, Balkan/Byzantine, flamenco. Each is stored in
cents so microtonal traditions ring true.

~18 **rhythm cycles**: Indian talas (teental 16, jhaptal 10, rupak 7, ektal 12…), Balkan
aksak (7/8, 9/8, 11/8), Afro-Cuban clave/tresillo, West-African 12/8 bell, Arabic iqa'at
(maqsum, baladi, ayoub), gamelan colotomic — with authentic accent patterns.

## Morphing ethnic visuals

Procedural **mandala / kilim / girih star / knot / kolam** patterns with adjustable
symmetry and palette (indigo, jewel, earth, ochre, mono, sunset). The wavefield warps and
lights the weave; the chord hue tints it; riff pulses brighten; solo notes spark.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite → dist/
```

Latest desktop **Chrome / Edge** (WebGL2 + `EXT_color_buffer_float`, Web Audio, WebMIDI).
Click or press Space to start.

## Play

- **Space** play/stop · **↻ regen** new riff & key · **click** field to observe + flourish ·
  **drag** to brush the potential (Shift = raise) · **R** reset field · **F** freeze mutation.
- Voice chips (chord / riff / solo) toggle each part. Tabs: PLAY / GEO / FIELD / SCALE /
  RHYTHM / VOICES / PATTERN / MUTATE / IO / INFO (concept + every parameter, EN/日本語).
- Keeps playing in the background (Web Worker clock); master gain in PLAY.

Reuses HADŌ's `core/features.ts` seam; the sequencer receives field access as injected
callbacks so `music/` and `seq/` never import `field/` or `geometry/`.
