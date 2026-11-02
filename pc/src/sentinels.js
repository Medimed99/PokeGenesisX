/* ============================================================
   LES SENTINELLES — deux légendaires qui tiennent les passages
   « Ce sont des légendaires qui se sont portés volontaires pour bloquer
   les passerelles, quand la corruption a commencé à passer d'un secteur
   à l'autre. » Mewtwo garde la porte de Jadielle, Électhor une zone
   désindexée à l'est. On peut s'approcher, les regarder vivre ; ils ne se
   laissent ni toucher ni capturer : trop près, ils se défont et reviennent
   plus tard.
   ============================================================ */
import * as THREE from "three";
import { heightAt, pathX } from "./world/layout.js";
import { MonModel } from "./mon/model3d.js";
import { realHeight } from "./mon/sprites.js";

const G = () => window.PCG;
const DEFS = [
  {id:150, x:() => pathX(-127), z:-127, heading:0, line:"Mewtwo. Il tient la porte de Jadielle, et il te regarde comme s'il te connaissait."},
  {id:145, x:() => 31, z:63, heading:-Math.PI / 2, line:"Électhor. Il garde la passerelle de l'est. L'air grésille autour de lui."}
];

export class Sentinels {
  constructor(game){
    this.game = game; this.list = [];
    for(const d of DEFS){
      const x = d.x(), z = d.z, pos = new THREE.Vector3(x, heightAt(x, z), z);
      const H = realHeight(d.id);
      const m = new MonModel(d.id, false, game.engine.scene, {height:H});
      m.uniforms.uGlitch.value = 1;
      game.world.colliders.push({x, z, r:Math.max(0.6, H * 0.35)});
      this.list.push({d, m, pos, heading:d.heading, base:d.heading, state:"watch", t:0, seen:false, away:0, appear:0});
    }
  }
  update(dt, t){
    const P = this.game.player.pos, cam = this.game.engine.camera, env = this.game.env;
    for(const s of this.list){
      const m = s.m, d = Math.hypot(P.x - s.pos.x, P.z - s.pos.z);
      s.t += dt;
      if(s.state === "gone"){
        /* il reviendra quand on se sera éloigné */
        s.away += dt;
        m.group.visible = false;
        if(s.away > 60 && d > 25){ s.state = "watch"; s.appear = 0; m.uniforms.uGlitch.value = 1; m.group.visible = true; }
        continue;
      }
      s.appear = Math.min(1, s.appear + dt * 0.8);
      if(s.state === "watch"){
        m.uniforms.uGlitch.value = Math.max(0, 1 - s.appear) * (1 - s.appear) + (Math.random() < dt * 0.15 ? 0.35 : 0);
        /* il te suit du regard dès que tu entres dans son champ */
        const want = d < 16 ? Math.atan2(P.x - s.pos.x, P.z - s.pos.z) : s.base;
        let dh = want - s.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        s.heading += dh * Math.min(1, dt * 2.2);
        m.setAnim("idle");
        if(d < 16 && !s.seen){
          s.seen = true;
          this.game.hud.hint(s.d.line, 6);
          this.game.glitchKick = 0.6;
        }
        if(d < 4.2){ s.state = "leave"; s.t = 0; m.setAnim("attack"); this.game.glitchKick = 1; }
      } else if(s.state === "leave"){
        /* trop près : un geste, puis il se défait en pixels */
        m.uniforms.uGlitch.value = Math.min(1, Math.max(0, s.t - 0.7) * 1.4);
        if(s.t > 1.5){ s.state = "gone"; s.away = 0; s.seen = false; }
      }
      m.groundY = heightAt(s.pos.x, s.pos.z);
      m.update(t, dt, s.pos, s.heading, cam.position, env);
    }
  }
  /* pour la caméra de l'écran titre et les tests */
  near(x, z, r){ return this.list.some(s=>s.state !== "gone" && Math.hypot(x - s.pos.x, z - s.pos.z) < r); }
}
