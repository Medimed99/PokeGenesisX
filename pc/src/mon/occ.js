/* Ce qui se trouve entre la caméra et l'équipe s'efface en trame (la Brèche, à la troisième personne) :
   arbres, rochers, ennemis. Uniformes partagés, mis à jour à chaque image par la Brèche. */
import * as THREE from "three";
export const OCC = {uEye:{value:new THREE.Vector3()}, uFocus:{value:new THREE.Vector3()}, uT:{value:0}};
export const OCC_GLSL = `
uniform vec3 uEye, uFocus;
float occH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void occTest(vec3 wp, float on){
  if(on < 0.5) return;
  vec3 ab = uFocus - uEye; float L = dot(ab, ab);
  float tt = clamp(dot(wp - uEye, ab) / max(L, 0.001), 0.0, 1.0);
  float dd = length(wp - (uEye + ab * tt));
  float k = tt < 0.9 ? (1.0 - smoothstep(0.8, 1.9, dd)) * 0.85 : 0.0;
  k = max(k, 1.0 - smoothstep(1.4, 3.2, length(wp - uEye)));
  if(occH(floor(gl_FragCoord.xy)) < k) discard;
}`;
