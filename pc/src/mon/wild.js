/* ============================================================
   LES POKÉMON SAUVAGES DE LA ROUTE 1
   Chaque apparition est tirée par le jeu mobile lui-même
   (newEncounter : habitat, heure, météo, leurres, hordes, la traque,
   la vedette du jour, MissingNo…) : les mêmes chances, les mêmes
   effets. Ici, elle prend corps : un Pokémon se matérialise (les
   données se restaurent), se cache dans les hautes herbes qui
   frémissent, bondit quand on approche, flâne, nous regarde, fuit.
   ============================================================ */
import * as THREE from "three";
import { MonSprite, realHeight } from "./sprites.js";
import { makeMon, preloadMon, has3D } from "./model3d.js";
/* les modèles 3D dont l'attente et la marche sont un vol (papillons, guêpes, fantômes, Électhor) */
const HOVER3D = [12, 15, 41, 42, 92, 93, 145, 146, 144, 151];
import { ROUTE1, LAKE1 } from "../data/models3d.js";
import { heightAt, tallGrassAt, inWater, lakeShore, WATER_Y, BOUNDS, GRASS_PATCHES, pathDist, PATH_W } from "../world/layout.js";
import { RUSTLE_N } from "../world/grass.js";
import { clamp } from "../util.js";

const MAX = 8, NEAR = 16, FAR = 52, DESPAWN = 78;
const G = () => window.PCG;

/* la Route 1 a ses habitants : le jeu mobile tire la rareté (et le chromatique, le niveau),
   la route choisit l'espèce de même rareté parmi les siennes. MissingNo et les légendaires
   restent ce qu'ils sont. */
export function routeSpecies(spec, pool){
  const g = G();
  if(!spec || spec.missing || !g || pool.includes(spec.id)) return spec;
  const P = g.POKE[spec.id];
  if(!P || P.leg || spec.rar >= 5) return spec;
  let best = null, bd = 99;
  const byRar = pool.filter(id=>g.POKE[id] && g.POKE[id].rar === spec.rar);
  const cand = byRar.length ? byRar : pool;
  if(!byRar.length) for(const id of pool){ const d = Math.abs(g.POKE[id].rar - spec.rar); if(d < bd){ bd = d; best = id; } }
  const id = byRar.length ? cand[Math.floor(Math.random() * cand.length)] : best;
  return Object.assign(spec, {id, rar:g.POKE[id].rar, featured:false});
}

export class Wild {
  constructor(game){
    this.game = game; this.list = []; this.nextSpawn = 1.5; this.rustleUsed = new Array(RUSTLE_N).fill(null);
    this.emotes = [];
  }
  /* le tirage du jeu mobile, comme si l'on était sur la Route 1 (Kanto, routes ou bords d'eau) */
  roll(hab){
    const g = G(); if(!g || typeof window.newEncounter !== "function") return null;
    const S = g.S, keep = {region:S.region, habitat:S.habitat, capMode:S.capMode, ENC:g.ENC};
    let spec = null;
    try {
      S.region = "kanto"; S.habitat = hab; S.capMode = "classic"; g.ENC = null;
      spec = window.newEncounter();
    } catch(e){ console.warn("apparition", e); }
    finally { g.ENC = keep.ENC; S.region = keep.region; S.habitat = keep.habitat; S.capMode = keep.capMode; }
    return spec ? routeSpecies(Object.assign({}, spec), hab === "eaux" ? LAKE1 : ROUTE1) : null;
  }
  spot(player, hidden){
    for(let k = 0; k < 40; k++){
      let x, z;
      if(hidden){
        const near = GRASS_PATCHES.filter(p=>{ const d = Math.hypot(p.x - player.x, p.z - player.z); return d > 10 && d < FAR + 6; });
        if(!near.length) return null;
        const p = near[Math.floor(Math.random() * near.length)], a = Math.random() * Math.PI * 2, r = Math.random() * p.r * 0.75;
        x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r;
        if(tallGrassAt(x, z) < 0.65) continue;
      } else {
        const a = Math.random() * Math.PI * 2, d = NEAR + Math.random() * (FAR - NEAR);
        x = player.x + Math.cos(a) * d; z = player.z + Math.sin(a) * d;
        if(tallGrassAt(x, z) > 0.3) continue;
      }
      if(x < BOUNDS.x0 + 2 || x > BOUNDS.x1 - 2 || z < BOUNDS.z0 + 3 || z > BOUNDS.z1 - 3) continue;
      const CZo = this.game.world.corruption;
      if(CZo && CZo.inCore(x, z)) continue;                 /* rien ne vit au cœur d'une zone désindexée */
      if(inWater(x, z)) continue;
      if(this.list.some(e=>Math.hypot(e.pos.x - x, e.pos.z - z) < 4)) continue;
      if(this.game.world.colliders.some(c=>Math.hypot(c.x - x, c.z - z) < c.r + 0.8)) continue;
      return {x, z};
    }
    return null;
  }
  spawn(player){
    const hidden = Math.random() < 0.62;
    const at = this.spot(player, hidden);
    if(!at) return;
    const hab = lakeShore(at.x, at.z) > 0.3 ? "eaux" : "route";
    const spec = this.roll(hab);
    if(!spec) return;
    const group = [spec];
    /* une horde : le jeu l'a décidée, on la montre d'un coup */
    const H = G().ref("HORDE");
    if(spec.horde && H && H.left > 0){
      for(let i = 0; i < 6 && G().ref("HORDE") && G().ref("HORDE").left > 0; i++){ const s = this.roll(hab); if(s) group.push(s); }
    }
    group.forEach((s, i)=>{
      const a = i / group.length * Math.PI * 2, r = i ? 1.6 + Math.random() : 0;
      const x = at.x + Math.cos(a) * r, z = at.z + Math.sin(a) * r;
      if(inWater(x, z)) return;
      this.add(s, x, z, hidden && tallGrassAt(x, z) > 0.5);
    });
  }
  add(spec, x, z, hidden){
    const scene = this.game.engine.scene;
    const missing = !!spec.missing;
    const id = missing ? 0 : spec.id;
    if(!missing) preloadMon(id, spec.shiny);
    const H = missing ? 1.8 : realHeight(id);
    const g = G();
    const types = missing ? [] : g.POKE[id].types;
    /* en l'air : en 3D, seulement ceux dont les animations volent (un oiseau qui « marche » en l'air
       serait absurde) ; en sprite, les types Vol, une fois sur deux */
    const flyer = has3D(id, spec.shiny) ? HOVER3D.includes(id) : (types.includes(3) && H < 2.2 && Math.random() < 0.55);
    const e = {spec, id, H, pos:new THREE.Vector3(x, heightAt(x, z), z), heading:Math.random() * Math.PI * 2,
      state:hidden ? "hidden" : "idle", timer:1 + Math.random() * 3, target:null, hidden, flyer, alt:flyer ? 0.7 + Math.random() * 1.2 : 0,
      born:this.game.t, appear:0, speed:clamp(0.7 + H * 0.7, 0.7, 2.6) * (flyer ? 1.4 : 1), noticed:false, rustle:-1, gone:0, tag:missing ? "missing" : ""};
    e.sprite = missing ? this.missingSprite(scene) : makeMon(id, spec.shiny, scene, {height:H});
    e.sprite.uniforms.uGlitch.value = 1;
    if(missing) this.game.glitchKick = 1;                  /* MissingNo arrive : l'image se déchire */
    this.list.push(e);
    if(hidden) this.claimRustle(e);
    return e;
  }
  /* MissingNo : la fêlure du jeu mobile, debout dans l'herbe */
  missingSprite(scene){
    const s = new MonSprite(1, false, scene, {height:1.8});
    const img = new Image(); img.src = (typeof window.MISSING_SPRITE !== "undefined" ? window.MISSING_SPRITE : "") || (G().ref("MISSING_SPRITE") || "");
    const tex = new THREE.Texture(img); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    img.onload = () => { tex.needsUpdate = true; };
    s.update = function(t, dt, pos){
      this.group.position.copy(pos);
      this.uniforms.uTime.value = t;
      this.uniforms.uMap.value = tex; this.uniforms.uRect.value.set(0, 0, 1, 1);
      this.uniforms.uSize.value.set(1.4, 1.8); this.uniforms.uOffset.value.set(-0.5, 0);
      this.uniforms.uGlitch.value = 0.25 + 0.2 * Math.sin(t * 9);
      this.mesh.visible = img.complete && img.naturalWidth > 0;
      this.width = 1.3; this.drawH = 1.8;
      this.shadow.scale.set(1.4, 1, 1);
    };
    return s;
  }
  claimRustle(e){
    const i = this.rustleUsed.findIndex(x=>!x);
    if(i < 0) return;
    this.rustleUsed[i] = e; e.rustle = i;
  }
  releaseRustle(e){
    if(e.rustle < 0) return;
    this.game.world.grass.setRustle(e.rustle, 0, -999, 0, 0);
    this.rustleUsed[e.rustle] = null; e.rustle = -1;
  }
  emote(e, kind){ this.emotes.push({e, kind, t:this.game.t}); }
  remove(e){
    this.releaseRustle(e);
    e.sprite.dispose();
    this.list = this.list.filter(x=>x !== e);
    if(this.game.capture && this.game.capture.target === e) this.game.capture.target = null;
  }
  pickWander(e, far){
    for(let k = 0; k < 12; k++){
      const a = Math.random() * Math.PI * 2, d = (far ? 6 : 2) + Math.random() * (far ? 8 : 6);
      const x = e.pos.x + Math.cos(a) * d, z = e.pos.z + Math.sin(a) * d;
      if(x < BOUNDS.x0 + 2 || x > BOUNDS.x1 - 2 || z < BOUNDS.z0 + 3 || z > BOUNDS.z1 - 3 || inWater(x, z)) continue;
      if(this.game.world.colliders.some(c=>Math.hypot(c.x - x, c.z - z) < c.r + 0.5)) continue;
      if(Math.abs(heightAt(x, z) - heightAt(e.pos.x, e.pos.z)) > 1.6) continue;
      return {x, z};
    }
    return null;
  }
  update(dt, t, player, cam, env){
    /* de nouvelles apparitions, tant que la route n'est pas pleine */
    this.nextSpawn -= dt;
    if(this.nextSpawn <= 0 && this.list.length < MAX && !this.game.paused){
      this.nextSpawn = 2.5 + Math.random() * 3.5;
      this.spawn(player);
    }
    for(const e of this.list.slice()){
      const d = Math.hypot(e.pos.x - player.x, e.pos.z - player.z);
      if(e.state === "gone"){ this.remove(e); continue; }
      /* trop loin, trop vieux, pas en cours de capture : il s'en va */
      const busy = this.game.capture && this.game.capture.holding === e;
      if(!busy && (d > DESPAWN || (t - e.born > 170 && d > 25))){ this.remove(e); continue; }
      const U = e.sprite.uniforms;
      if(e.state !== "fled" && e.state !== "caught"){ e.appear = Math.min(1, e.appear + dt * 1.4); U.uGlitch.value = e.tag === "missing" ? U.uGlitch.value : (1 - e.appear) * (1 - e.appear); }
      this.think(e, dt, t, player, d);
      /* dans l'eau peu profonde, il se tient à la surface */
      const gy = inWater(e.pos.x, e.pos.z) ? Math.max(heightAt(e.pos.x, e.pos.z), WATER_Y - 0.12) : heightAt(e.pos.x, e.pos.z);
      e.sprite.groundY = gy;
      const hop = e.hop ? Math.max(0, Math.sin(Math.min(1, (t - e.hop) / 0.45) * Math.PI)) * 0.55 : 0;
      e.pos.y = gy + (e.flyer ? e.alt + Math.sin(t * 2.4 + e.born) * 0.12 : 0) + hop;
      /* sorti de l'eau au bout de la ligne : il saute en arc jusqu'à la rive */
      if(e.leap){
        if(!e.leap.to) e.leap.to = e.pos.clone();
        const k = (t - e.leap.t) / 0.75;
        if(k < 1){
          e.pos.lerpVectors(e.leap.from, e.leap.to, k);
          e.pos.y = e.leap.from.y + (e.leap.to.y - e.leap.from.y) * k + Math.sin(Math.PI * k) * (1.6 + e.H * 0.4);
          e.sprite.groundY = undefined;
        } else { e.pos.copy(e.leap.to); if(e.leap.emote) this.emote(e, "!"); e.leap = null; if(this.game.audio) this.game.audio.land(9); }
      }
      /* débusqué (ou visé), il se devine à travers l'herbe */
      const tgt = this.game.capture && this.game.capture.target === e;
      e.sprite.xray = (tgt || (d < 26 && (e.state === "alert" || e.state === "idle" || e.state === "walk" || e.state === "flee"))) ? (tgt ? 1 : 0.7) : 0;
      if(e.state !== "caught") e.sprite.update(t, dt, e.pos, e.heading, cam.position, env);
      /* l'herbe frémit au-dessus d'un Pokémon caché */
      if(e.rustle >= 0) this.game.world.grass.setRustle(e.rustle, e.pos.x, gy, e.pos.z, e.state === "hidden" ? 0.9 + 0.35 * Math.sin(t * 3) : 0.7);
    }
  }
  think(e, dt, t, player, d){
    const face = (x, z) => { e.heading = Math.atan2(x - e.pos.x, z - e.pos.z); };
    const S = e.sprite;
    switch(e.state){
      case "hidden":
        S.setAnim("idle");
        /* on s'approche : il jaillit des herbes, un « ! » au-dessus */
        if(d < 7.5 || this.game.capture.target === e){
          e.state = "alert"; e.hop = t; e.timer = 2.2; face(player.x, player.z); this.emote(e, "!");
          if(this.game.audio) this.game.audio.rustle(e.pos, 1);
        } else if(Math.random() < dt * 0.4 && this.game.audio) this.game.audio.rustle(e.pos, 0.35);
        break;
      case "idle":
        /* la nuit, ceux qui le peuvent dorment ; on les réveille en approchant */
        S.setAnim(S.is3D && this.game.world.sky.state && this.game.world.sky.state.night > 0.6 && !e.noticed ? "sleep" : "idle");
        e.timer -= dt;
        if(d < 6 && !e.noticed){ e.noticed = true; e.state = "alert"; e.timer = 1.8; face(player.x, player.z); this.emote(e, "?"); break; }
        if(e.timer <= 0){ e.target = this.pickWander(e); e.state = e.target ? "walk" : "idle"; e.timer = 2 + Math.random() * 4; }
        break;
      case "walk": {
        S.setAnim(e.speed > 2.2 ? "run" : "walk");
        if(!e.target){ e.state = "idle"; break; }
        const dx = e.target.x - e.pos.x, dz = e.target.z - e.pos.z, L = Math.hypot(dx, dz);
        if(L < 0.3){ e.state = "idle"; e.timer = 1.5 + Math.random() * 3.5; break; }
        e.heading = Math.atan2(dx, dz);
        const v = e.speed * dt;
        e.pos.x += dx / L * Math.min(v, L); e.pos.z += dz / L * Math.min(v, L);
        if(d < 6 && !e.noticed){ e.noticed = true; e.state = "alert"; e.timer = 1.8; face(player.x, player.z); this.emote(e, "?"); }
        break;
      }
      case "alert":
        S.setAnim("idle");
        face(player.x, player.z);
        e.timer -= dt;
        if(e.timer <= 0){
          e.hidden = false; this.releaseRustle(e);
          e.target = this.pickWander(e); e.state = e.target ? "walk" : "idle"; e.timer = 3;
        }
        /* un pas de course juste à côté : il recule */
        if(d < 2.2 && this.game.player.speed > 5.5){ e.target = this.pickWander(e, true); if(e.target){ e.state = "walk"; e.speed *= 1.6; } }
        break;
      case "held":                   /* dans la Ball : le module de capture s'en occupe */
        break;
      case "fled": {
        /* désindexé : il file, puis se défait en pixels */
        S.setAnim("run");
        const ax = e.pos.x - player.x, az = e.pos.z - player.z, L = Math.hypot(ax, az) || 1;
        e.heading = Math.atan2(ax, az);
        e.pos.x += ax / L * e.speed * 2.2 * dt; e.pos.z += az / L * e.speed * 2.2 * dt;
        e.gone += dt;
        S.uniforms.uGlitch.value = Math.min(1, e.gone / 1.1);
        if(e.gone > 1.2) e.state = "gone";
        break;
      }
    }
  }
  /* celui qu'on vise : le plus proche du réticule, à portée */
  pick(cam, maxDist = 32){
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    let best = null, bestScore = 1e9;
    for(const e of this.list){
      if(e.state === "fled" || e.state === "gone" || e.state === "held" || e.state === "caught") continue;
      const c = new THREE.Vector3(e.pos.x, e.pos.y + (e.sprite.drawH || e.H) * 0.5, e.pos.z);
      const to = c.clone().sub(cam.position), dist = to.length();
      if(dist > maxDist || dist < 0.5) continue;
      const ang = dir.angleTo(to);
      const tol = Math.atan2(Math.max(0.45, (e.sprite.drawH || e.H) * 0.6), dist) + 0.035;
      if(ang > tol) continue;
      const score = ang / tol + dist * 0.01;
      if(score < bestScore){ bestScore = score; best = e; }
    }
    return best;
  }
  clear(){ for(const e of this.list.slice()) this.remove(e); }
}
