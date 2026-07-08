// pattern.ts — procedural world-geometry patterns (mandala / kilim / girih star / knot /
// kolam) that morph with the wavefield: |ψ|² & phase warp and light the weave; the chord
// hue tints it; riff pulses brighten; solo notes spark. Symmetry order is a control.
export const PATTERN_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uPsi;
uniform float uPsiScale;
uniform float uTime;
uniform int uPattern;      // 0 mandala 1 kilim 2 girih 3 knot 4 kolam
uniform int uPalette;
uniform float uSym;        // symmetry order N
uniform float uScale;
uniform float uMorph;
uniform float uFieldWarp;
uniform float uLine;
uniform float uSpeed;
uniform float uHue;        // chord-driven base hue 0..1
uniform float uPulse;      // riff pulse
uniform float uSolo;       // solo flash

const float PI = 3.14159265;

vec3 hsv(float h, float s, float v){
  vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
  vec3 p = abs(fract(vec3(h) + k)*6.0 - 3.0);
  return v * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), s);
}

vec2 kaleido(vec2 p, float n){
  float a = atan(p.y, p.x);
  float r = length(p);
  float seg = 2.0*PI/n;
  a = mod(a, seg);
  a = abs(a - seg*0.5);
  return vec2(cos(a), sin(a))*r;
}
mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }
float tri(float x){ return abs(fract(x)-0.5)*2.0; }

float mandala(vec2 q, float t, float N, float lw){
  vec2 k = kaleido(q, N);
  float r = length(k);
  float rings = 0.5 + 0.5*sin(r*3.0 - t*2.0);
  float pet = 0.5 + 0.5*cos(atan(k.y, k.x)*N);
  float g = rings*pet + 0.4*(0.5+0.5*sin(r*7.0));
  return smoothstep(0.55-lw, 0.55+lw, g);
}
float kilim(vec2 q, float t, float lw){
  vec2 g = fract(q*0.5) - 0.5;
  float diamond = abs(g.x) + abs(g.y);
  float d = smoothstep(0.42-lw, 0.42, diamond) * (1.0 - smoothstep(0.5, 0.5+lw, diamond));
  float zz = tri(q.x*0.5 + floor(q.y+0.5)*0.5);
  float band = smoothstep(0.5-lw, 0.5, zz);
  return max(d, band*0.7);
}
float girih(vec2 q, float t, float N, float lw){
  vec2 k = kaleido(q, N);
  float star = 0.5 + 0.5*cos(atan(k.y,k.x)*N + length(k)*2.0 - t);
  float lines = 0.0;
  for(int i=0;i<3;i++){
    vec2 s = rot(float(i)*PI/3.0 + t*0.05) * q;
    lines = max(lines, 1.0 - smoothstep(0.0, lw, abs(tri(s.x)-0.5)));
  }
  float ring = 1.0 - smoothstep(lw, lw*2.0, abs(fract(length(q))-0.5));
  return clamp(max(lines, max(smoothstep(0.72-lw,0.72+lw,star), ring*0.6)), 0.0, 1.0);
}
float knot(vec2 q, float t, float lw){
  vec2 a = rot(0.7854)*q;
  float w1 = sin(a.x*PI + sin(a.y*PI + t));
  float w2 = sin(a.y*PI + sin(a.x*PI - t));
  float over = step(0.0, sin(a.x*PI)*sin(a.y*PI));
  float s1 = 1.0 - smoothstep(0.0, lw, abs(w1));
  float s2 = 1.0 - smoothstep(0.0, lw, abs(w2));
  return mix(max(s1*0.5,s2), max(s2*0.5,s1), over);
}
float kolam(vec2 q, float t, float lw){
  vec2 c = floor(q) + 0.5;
  vec2 d = q - c;
  float dot = 1.0 - smoothstep(0.06, 0.12, length(d));
  float loop = 1.0 - smoothstep(lw, lw*2.0, abs(length(d) - (0.35 + 0.05*sin(t + c.x + c.y))));
  return max(dot, loop);
}

vec3 palette(int id, float base){
  // returns background colour; line colour comes from hue
  if(id==0) return mix(vec3(0.02,0.03,0.10), vec3(0.04,0.06,0.18), base); // indigo
  if(id==1) return mix(vec3(0.05,0.02,0.09), vec3(0.10,0.03,0.14), base); // jewel
  if(id==2) return mix(vec3(0.08,0.05,0.03), vec3(0.14,0.09,0.05), base); // earth
  if(id==3) return mix(vec3(0.10,0.07,0.02), vec3(0.16,0.11,0.04), base); // ochre
  if(id==4) return mix(vec3(0.03,0.03,0.03), vec3(0.09,0.09,0.09), base); // mono
  return mix(vec3(0.10,0.03,0.04), vec3(0.18,0.06,0.03), base);            // sunset
}

void main(){
  vec2 p = (vUv - 0.5) * 2.0;
  float t = uTime * uSpeed;

  // wavefield warp + local light
  vec2 ps = texture(uPsi, vUv).rg;
  float mag = clamp(dot(ps, ps) * uPsiScale, 0.0, 1.0);
  float ph = atan(ps.y, ps.x);
  p += uFieldWarp * (0.6 * vec2(cos(ph), sin(ph)) * mag + 0.15*vec2(sin(uTime*0.3), cos(uTime*0.23)));

  vec2 q = p * uScale;
  float m;
  if(uPattern==0) m = mandala(q, t, uSym, uLine);
  else if(uPattern==1) m = kilim(q, t, uLine);
  else if(uPattern==2) m = girih(q, t, uSym, uLine);
  else if(uPattern==3) m = knot(q, t, uLine);
  else m = kolam(q, t, uLine);

  // morph: blend the pattern edges with the field probability
  m = mix(m, m*(0.4+0.9*mag), uMorph);
  m = clamp(m + uPulse*0.25*mag, 0.0, 1.0);

  vec3 bg = palette(uPalette, 0.3 + 0.4*mag);
  float mono = (uPalette==4) ? 1.0 : 0.0;
  vec3 lineCol = hsv(fract(uHue + 0.02*ph/PI), mix(0.75, 0.0, mono), 1.0);
  vec3 col = mix(bg, lineCol, m);
  col += uSolo * m * vec3(1.0, 0.95, 0.8) * 0.6;      // solo spark
  col += mag * 0.06;                                    // faint field glow
  frag = vec4(col, 1.0);
}`;
