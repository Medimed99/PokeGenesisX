/* L'image elle-même est abîmée : un léger décalage des couleurs sur les bords, du grain,
   des lignes de balayage à peine visibles — et, quand la corruption s'approche (une zone,
   MissingNo, un Pokémon Altéré), des bandes qui glissent, des blocs déplacés, des pixels morts. */
import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

const frag = `
uniform float uAmount, uTear, uTime, uGrain, uCalm;
uniform vec2 uRes;
float hh(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
/* les déchirures : des bandes qui glissent, des blocs déplacés (on relit l'image ailleurs) */
vec2 tearUv(vec2 uv){
  if(uTear <= 0.001) return uv;
  float f = floor(uTime * 24.0);
  float band = floor(uv.y * 30.0 + hh(vec2(f, 1.0)) * 4.0);
  if(hh(vec2(band, f)) < uTear * 0.42) uv.x += (hh(vec2(band, f + 7.0)) - 0.5) * 0.1 * uTear;
  vec2 blk = floor(uv * vec2(16.0, 9.0));
  float b = hh(blk + f * 1.3);
  if(b < uTear * 0.07) uv += (vec2(hh(blk + 2.0), hh(blk + 5.0)) - 0.5) * 0.06 * uTear;
  return uv;
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 dir = uv - 0.5;
  float r = length(dir);
  float off = (0.0012 + uAmount * 0.0032) * r * r * 4.0 + uTear * 0.009;
  vec2 o = dir * off + vec2(uTear * 0.004, 0.0);
  vec2 u = tearUv(uv);
  vec3 c = vec3(texture2D(inputBuffer, u + o).r, texture2D(inputBuffer, u).g, texture2D(inputBuffer, u - o).b);
  /* étalonnage : un peu moins de couleur, des ombres froides */
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 0.86);
  c += vec3(-0.006, 0.002, 0.012) * (1.0 - smoothstep(0.0, 0.45, l));
  /* lignes de balayage, très légères */
  c *= 1.0 - (0.02 + uAmount * 0.03) * (0.5 + 0.5 * sin(uv.y * uRes.y * 1.4));
  /* le grain */
  c += (hh(uv * uRes + fract(uTime * 13.7) * 91.0) - 0.5) * uGrain;
  /* des pixels morts pendant une déchirure */
  if(uTear > 0.25 && uCalm < 0.5){
    vec2 px = floor(uv * vec2(96.0, 54.0));
    float d = hh(px + floor(uTime * 20.0));
    if(d < (uTear - 0.3) * 0.01) c = mix(vec3(0.21, 0.94, 0.84), vec3(1.0, 0.24, 0.5), step(0.5, hh(px + 4.0)));
  }
  outputColor = vec4(c, inputColor.a);
}`;

export class CorruptEffect extends Effect {
  constructor(){
    super("CorruptEffect", frag, {
      attributes:EffectAttribute.CONVOLUTION,
      uniforms:new Map([["uAmount", new Uniform(0.3)], ["uTear", new Uniform(0)], ["uTime", new Uniform(0)],
        ["uGrain", new Uniform(0.022)], ["uCalm", new Uniform(0)], ["uRes", new Uniform(new Vector2(1280, 720))]])
    });
  }
  setSize(w, h){ this.uniforms.get("uRes").value.set(w, h); }
  set(amount, tear, time, calm){
    const U = this.uniforms;
    U.get("uAmount").value = amount;
    U.get("uTear").value = calm ? Math.min(tear, 0.12) : tear;
    U.get("uTime").value = time;
    U.get("uCalm").value = calm ? 1 : 0;
  }
}
