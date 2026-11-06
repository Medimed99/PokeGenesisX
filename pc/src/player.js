/* L'archiviste, à la première personne : marcher, courir, sauter, regarder. On suit le sol,
   on ne gravit pas une corniche (on la descend d'un saut), on contourne les arbres et les
   rochers, on n'entre pas dans le lac. Le pas se balance, et on entend le sol. */
import * as THREE from "three";
import { heightAt, inWater, BOUNDS, tallGrassAt, pathDist, PATH_W, onBeach, walkable } from "./world/layout.js";
import { clamp, damp } from "./util.js";

export const EYE = 1.62;
const WALK = 4.3, RUN = 7.2, ACCEL = 14, GRAV = 22, JUMP = 6.2, STEP = 0.42;

export class Player {
  constructor(camera, colliders){
    this.cam = camera; this.colliders = colliders;
    this.pos = new THREE.Vector3(3, 0, 140);
    this.pos.y = heightAt(this.pos.x, this.pos.z);
    this.vel = new THREE.Vector3(); this.yaw = 0; this.pitch = -0.04; this.ground = true;
    this.bob = 0; this.bobAmp = 0; this.stepDist = 0; this.landKick = 0; this.fov = 72; this.zoom = 0;
    this.onStep = null; this.onLand = null; this.frozen = false; this.speed = 0;
  }
  surface(){
    if(tallGrassAt(this.pos.x, this.pos.z) > 0.5) return "tall";
    if(pathDist(this.pos.x, this.pos.z) < PATH_W) return "path";
    if(onBeach(this.pos.x, this.pos.z)) return "sand";
    return "grass";
  }
  blocked(x, z, fromY){
    if(!walkable(x, z)) return true;                       /* la zone, les biomes ouverts, leurs cols */
    if(inWater(x, z)) return true;
    /* une marche trop haute : la corniche, vue d'en bas */
    if(heightAt(x, z) - fromY > STEP) return true;
    return false;
  }
  update(dt, input, look){
    if(!this.frozen){
      this.yaw -= look.x * 0.0022;
      this.pitch = clamp(this.pitch - look.y * 0.0022, -1.45, 1.45);
    }
    const f = new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw)), r = new THREE.Vector2(Math.cos(this.yaw), -Math.sin(this.yaw));
    let mx = 0, mz = 0;
    if(!this.frozen){
      if(input.down("KeyW") || input.down("ArrowUp")) { mx += f.x; mz += f.y; }
      if(input.down("KeyS") || input.down("ArrowDown")) { mx -= f.x; mz -= f.y; }
      if(input.down("KeyD") || input.down("ArrowRight")) { mx += r.x; mz += r.y; }
      if(input.down("KeyA") || input.down("ArrowLeft")) { mx -= r.x; mz -= r.y; }
    }
    const len = Math.hypot(mx, mz);
    const run = input.down("ShiftLeft") || input.down("ShiftRight");
    const tall = this.surface() === "tall";
    const speed = (run ? RUN : WALK) * (tall ? 0.82 : 1) * (this.slow || 1);
    const tx = len ? mx / len * speed : 0, tz = len ? mz / len * speed : 0;
    const a = this.ground ? ACCEL : ACCEL * 0.25;
    this.vel.x = damp(this.vel.x, tx, a, dt); this.vel.z = damp(this.vel.z, tz, a, dt);
    if(this.ground && input.hit("Space") && !this.frozen){ this.vel.y = JUMP; this.ground = false; }
    this.vel.y -= GRAV * dt;
    /* déplacement horizontal, axe par axe, pour glisser le long des obstacles */
    const fromY = this.pos.y;
    let nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    const footY = this.ground ? fromY : Math.max(fromY, heightAt(this.pos.x, this.pos.z));
    if(this.blocked(nx, this.pos.z, footY)) nx = this.pos.x;
    if(this.blocked(nx, nz, footY)) nz = this.pos.z;
    for(const c of this.colliders){
      const dx = nx - c.x, dz = nz - c.z, rr = c.r + 0.35, d2 = dx * dx + dz * dz;
      if(d2 < rr * rr && d2 > 1e-6){ const d = Math.sqrt(d2), push = (rr - d); nx += dx / d * push; nz += dz / d * push; }
    }
    if(this.blocked(nx, nz, footY)){ nx = this.pos.x; nz = this.pos.z; }
    const moved = Math.hypot(nx - this.pos.x, nz - this.pos.z);
    this.pos.x = nx; this.pos.z = nz;
    this.speed = moved / Math.max(dt, 1e-4);
    /* vertical : suivre le sol, tomber d'une corniche */
    const gy = heightAt(this.pos.x, this.pos.z);
    this.pos.y += this.vel.y * dt;
    if(this.pos.y <= gy){
      if(!this.ground && this.vel.y < -7){ this.landKick = Math.min(0.22, -this.vel.y * 0.018); if(this.onLand) this.onLand(-this.vel.y); }
      this.pos.y = gy; this.vel.y = 0; this.ground = true;
    } else if(this.ground && this.pos.y - gy < 0.35 && this.vel.y <= 0){
      this.pos.y = gy; this.vel.y = 0;             /* collé au sol en descente douce */
    } else this.ground = false;
    /* le balancement du pas, et le bruit des pas */
    const sp = Math.hypot(this.vel.x, this.vel.z);
    this.bobAmp = damp(this.bobAmp, this.ground ? clamp(sp / RUN, 0, 1) : 0, 8, dt);
    this.bob += dt * (5.4 + sp * 0.9);
    if(this.ground && sp > 0.6){
      this.stepDist += moved;
      const stride = run ? 1.55 : 1.15;
      if(this.stepDist > stride){ this.stepDist = 0; if(this.onStep) this.onStep(this.surface(), run); }
    }
    this.landKick = damp(this.landKick, 0, 9, dt);
    /* la caméra */
    const bobY = Math.sin(this.bob * 2) * 0.045 * this.bobAmp - this.landKick;
    const bobX = Math.cos(this.bob) * 0.03 * this.bobAmp;
    this.cam.position.set(this.pos.x + r.x * bobX, this.pos.y + EYE + bobY, this.pos.z + r.y * bobX);
    this.cam.rotation.set(this.pitch, this.yaw, Math.cos(this.bob) * 0.006 * this.bobAmp);
    const targetFov = this.fov * (1 - this.zoom * 0.28) + (run && sp > 5 ? 4 : 0);
    if(Math.abs(this.cam.fov - targetFov) > 0.05){ this.cam.fov = damp(this.cam.fov, targetFov, 9, dt); this.cam.updateProjectionMatrix(); }
  }
  forward(out){ return out.set(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)); }
}
