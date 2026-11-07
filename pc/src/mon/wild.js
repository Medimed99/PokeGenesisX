/* ============================================================
   LES POKÉMON SAUVAGES DE LA ROUTE 1
   Chaque apparition est tirée par le jeu mobile lui-même
   (newEncounter : habitat, heure, météo, leurres, hordes, la traque,
   la vedette du jour, MissingNo…) : les mêmes chances, les mêmes
   effets. Ici, elle prend corps : un Pokémon se matérialise (les
   données se restaurent), se cache dans les hautes herbes qui
   frémissent, bondit quand on approche.
   Et il vit sa vie : il flâne, renifle le sol, regarde autour de lui,
   joue (des bonds, une pirouette), fait la sieste (la nuit surtout),
   se secoue, creuse (les types Sol), va boire au lac, tourne en l'air
   (ceux qui volent) ; il s'entraîne — une vraie capacité de son type,
   qui marque le sol (moves.js) — et se dispute parfois avec un voisin.
   Chacun a son caractère : le curieux s'approche et renifle, le
   timide file se cacher, le hardi tire un coup de semonce à tes
   pieds, le joueur gambade, le calme te regarde, le dormeur bâille.
   Rien de tout cela ne change la partie : c'est pour le voir.
   ============================================================ */
import * as THREE from "three";
import { MonSprite, realHeight } from "./sprites.js";
import { makeMon, preloadMon, has3D } from "./model3d.js";
import { ShinyAura } from "./shinyfx.js";
import { placeSpecies } from "./endemic.js";
import { rollRegion } from "./region.js";
import { WildMoves } from "./moves.js";
import { updateMarks, addMark, MKK } from "../world/marks.js";
/* les modèles 3D dont l'attente et la marche sont un vol (papillons, guêpes, fantômes, Électhor) */
const HOVER3D = [12, 15, 41, 42, 49, 81, 82, 92, 93, 109, 110, 142, 144, 145, 146, 151,
  /* Johto */ 163, 164, 165, 166, 169, 176, 187, 188, 189, 193, 198, 200, 201, 207, 227, 249, 250, 251,
  /* Hoenn */ 267, 269, 276, 277, 278, 279, 284, 291, 292, 329, 330, 333, 334, 337, 338, 343, 344, 353, 355, 358, 374, 375, 380, 381, 384, 385];
import { heightAt, tallGrassAt, inWater, lakeShore, WATER_Y, BOUNDS, GRASS_PATCHES, BIOME_PATCHES, pathDist, PATH_W, walkable, regionAt, lavaAt } from "../world/layout.js";
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
    this.moves = new WildMoves(game);
    this.nextMoveT = 6;               /* une capacité de temps en temps, quelque part près de soi */
  }
  /* une animation : pas pendant qu'une autre, jouée une fois (une attaque, la joie), n'est pas finie */
  setA(e, a){ if(this.game.t < (e.busyAnim || 0)) return; e.sprite.setAnim(a); }
  once(e, a){ const S = e.sprite; if(!S.playOnce){ S.setAnim(a); return; } const d = S.playOnce(a, 1); e.busyAnim = this.game.t + d * 0.95; }
  /* ---------- le caractère : tiré au hasard, penché par les types ---------- */
  temperOf(id, types){
    const w = {curious:2, shy:1.8, bold:1.1, calm:1.5, playful:1.2, sleepy:0.6}, has = t=>types.includes(t);
    if(has(10) || has(2) || has(16) || has(17)) w.bold += 2.2;
    if(has(5) || has(6)){ w.bold += 0.8; w.calm += 1.2; }
    if(has(9)) w.calm += 1.2;
    if(has(18) || has(1) || has(11)){ w.curious += 1.4; w.playful += 1; }
    if(has(7) || has(8) || has(14)) w.shy += 1.6;
    if(has(12)){ w.calm += 0.8; w.sleepy += 0.5; }
    if([143, 79, 80, 96, 97, 39, 40, 287, 288].includes(id)) w.sleepy += 5;
    let tot = 0; for(const k in w) tot += w[k];
    let x = Math.random() * tot; for(const k in w){ x -= w[k]; if(x <= 0) return k; }
    return "calm";
  }
  /* la capacité qu'il lance : celle de son premier type, parfois du second */
  moveType(e){ const ty = e.types || []; return ty.length > 1 && Math.random() < 0.3 ? ty[1] : (ty[0] || 1); }
  /* le tirage du jeu mobile, dans la région choisie sur la grande carte (region.js ; le mélange en tire une à chaque fois) */
  roll(hab){
    const g = G(); if(!g || typeof window.newEncounter !== "function") return null;
    const S = g.S, keep = {region:S.region, habitat:S.habitat, capMode:S.capMode, ENC:g.ENC};
    let spec = null;
    try {
      S.region = rollRegion(); S.habitat = hab; S.capMode = "classic"; g.ENC = null;
      spec = window.newEncounter();
      spec = placeSpecies(spec && Object.assign({}, spec), hab);     /* chacun chez soi (endemic.js) */
    } catch(e){ console.warn("apparition", e); }
    finally { g.ENC = keep.ENC; S.region = keep.region; S.habitat = keep.habitat; S.capMode = keep.capMode; }
    /* les 386 ont leur modèle 3D : la route reprend le tirage du jeu mobile tel quel */
    return spec ? Object.assign({}, spec) : null;
  }
  spot(player, hidden){
    for(let k = 0; k < 40; k++){
      let x, z;
      if(hidden){
        /* les hautes herbes de la zone, les fougères de la Sylve, les roseaux des Nappes, les herbes sèches des Ruines */
        const near = GRASS_PATCHES.concat(BIOME_PATCHES).filter(p=>{ const d = Math.hypot(p.x - player.x, p.z - player.z); return d > 10 && d < FAR + 6; });
        if(!near.length) return null;
        const p = near[Math.floor(Math.random() * near.length)], a = Math.random() * Math.PI * 2, r = Math.random() * p.r * 0.75;
        x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r;
        if(tallGrassAt(x, z) < 0.65) continue;
      } else {
        const a = Math.random() * Math.PI * 2, d = NEAR + Math.random() * (FAR - NEAR);
        x = player.x + Math.cos(a) * d; z = player.z + Math.sin(a) * d;
        if(tallGrassAt(x, z) > 0.3) continue;
      }
      if(!walkable(x, z) || !walkable(x + 2, z) || !walkable(x - 2, z) || !walkable(x, z + 2) || !walkable(x, z - 2)) continue;
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
    let hidden = Math.random() < 0.62;
    let at = this.spot(player, hidden);
    if(!at && hidden){ hidden = false; at = this.spot(player, false); }     /* (pas d'herbes près d'ici : la Cavité, le Foyer) */
    if(!at) return;
    /* le biome où il apparaît : le jeu mobile tire dans cet habitat */
    const reg = regionAt(at.x, at.z);
    const hab = reg && reg !== "route" ? reg : lakeShore(at.x, at.z) > 0.3 ? "eaux" : "route";
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
      if(inWater(x, z) || lavaAt(x, z) > 0.05 || !walkable(x, z)) return;
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
    const e = {spec, id, H, types, temper:missing ? "calm" : this.temperOf(id, types), pose:{tilt:0, roll:0, spin:0, squash:1}, moveCD:0,
      pos:new THREE.Vector3(x, heightAt(x, z), z), heading:Math.random() * Math.PI * 2,
      state:hidden ? "hidden" : "idle", timer:1 + Math.random() * 3, target:null, hidden, flyer, alt:flyer ? 0.7 + Math.random() * 1.2 : 0,
      born:this.game.t, appear:0, speed:clamp(0.7 + H * 0.7, 0.7, 2.6) * (flyer ? 1.4 : 1), noticed:false, rustle:-1, gone:0, tag:missing ? "missing" : ""};
    e.sprite = missing ? this.missingSprite(scene) : makeMon(id, spec.shiny, scene, {height:H});
    e.sprite.uniforms.uGlitch.value = 1;
    /* un chromatique : sa splendeur (shinyfx.js) */
    if(spec.shiny && !missing) e.aura = new ShinyAura(scene, this.game.world.biomes && this.game.world.biomes.lights);
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
    if(e.act && e.act.duel) this.endDuel(e.act.duel);
    if(e.aura){ e.aura.dispose(); e.aura = null; }
    e.sprite.dispose();
    this.list = this.list.filter(x=>x !== e);
    if(this.game.capture && this.game.capture.target === e) this.game.capture.target = null;
  }
  pickWander(e, far){
    for(let k = 0; k < 12; k++){
      const a = Math.random() * Math.PI * 2, d = (far ? 6 : 2) + Math.random() * (far ? 8 : 6);
      const x = e.pos.x + Math.cos(a) * d, z = e.pos.z + Math.sin(a) * d;
      if(!walkable(x, z) || inWater(x, z) || lavaAt(x, z) > 0.05 || regionAt(x, z) !== regionAt(e.pos.x, e.pos.z)) continue;
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
      this.nextSpawn = this.quick > 0 ? (this.quick--, 0.5 + Math.random() * 0.6) : 2.5 + Math.random() * 3.5;
      this.spawn(player);
    }
    for(const e of this.list.slice()){
      const d = Math.hypot(e.pos.x - player.x, e.pos.z - player.z);
      if(e.state === "gone"){ this.remove(e); continue; }
      /* trop loin, trop vieux, pas en cours de capture : il s'en va */
      const busy = this.game.capture && this.game.capture.holding === e;
      if(!busy && (d > DESPAWN || (t - e.born > 170 && d > 25))){ this.remove(e); continue; }
      const U = e.sprite.uniforms;
      if(e.state !== "fled" && e.state !== "unwrite" && e.state !== "caught"){ e.appear = Math.min(1, e.appear + dt * 1.4); U.uGlitch.value = e.tag === "missing" ? U.uGlitch.value : (1 - e.appear) * (1 - e.appear); }
      this.think(e, dt, t, player, d);
      this.body(e, dt, t);
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
      /* un chromatique rayonne ; la première fois qu'on le voit, l'éclat des jeux d'origine */
      if(e.aura){
        const st = e.state, off = st === "held" || st === "caught" || st === "fled" || st === "unwrite" || st === "gone";
        const mode = off ? "off" : st === "hidden" ? "hidden" : "full";
        if(mode === "full" && !e.shinySeen && d < 30 && e.appear > 0.8){
          e.shinySeen = true; e.aura.flare(t);
          const P = G() && G().POKE[e.id];
          if(this.game.hud) this.game.hud.hint(`✦ <b>${P ? P.name : "Un Pokémon"} chromatique</b> ✦`, 4);
        }
        const h = e.sprite.drawH || e.H;
        e.aura.update(t, dt, e.pos, h, e.sprite.width || h * 0.8, mode, gy);
        const SU = e.sprite.uniforms;
        if(SU.uShine){ SU.uShine.value = e.aura.k; SU.uShineY.value = e.pos.y; SU.uShineH.value = h; }
      }
      /* l'herbe frémit au-dessus d'un Pokémon caché */
      if(e.rustle >= 0) this.game.world.grass.setRustle(e.rustle, e.pos.x, gy, e.pos.z, e.state === "hidden" ? 0.9 + 0.35 * Math.sin(t * 3) : 0.7);
    }
    this.moves.update(dt, t, cam);
    updateMarks(t);
  }
  /* ---------- le corps : la pose, le recul d'un coup reçu, l'éclair blanc, la lueur rose d'un Choc Mental ---------- */
  body(e, dt, t){
    const S = e.sprite, P = e.pose, U = S.uniforms;
    const off = e.state === "held" || e.state === "caught" || e.state === "fled" || e.state === "unwrite" || e.state === "gone";
    if(off){ P.tilt = P.roll = P.spin = 0; P.squash = 1; }
    const k = Math.min(1, dt * 9);
    if(S.is3D){
      S.tilt += (P.tilt - S.tilt) * k; S.roll += (P.roll - S.roll) * Math.min(1, dt * 18); S.spin = P.spin;
      S.squash += ((e.stompK ? 1 - e.stompK * 0.18 : P.squash) - S.squash) * Math.min(1, dt * 14);
    }
    /* reset pour l'image suivante : chaque activité redonne sa pose */
    P.tilt = 0; P.roll = 0; P.spin = 0; P.squash = 1;
    if(e.knock){ const q = (t - e.knock.t) / 0.3; if(q < 1 && !off){ const v = 2.4 * (1 - q) * dt; e.pos.x += e.knock.x * v; e.pos.z += e.knock.z * v; } else e.knock = null; }
    if(e.flashT !== undefined && !off){ const f = Math.max(0, 1 - (t - e.flashT) / 0.28); U.uFlash.value = f * 0.85; if(f <= 0) e.flashT = undefined; }
    if(U.uTintC){ const pk = e.psyK || 0; if(pk > 0.001 || U.uTintC.value.w > 0.001){ U.uTintC.value.set(1, 0.45, 0.9, pk * 0.32 * (0.8 + 0.2 * Math.sin(t * 20))); e.psyK = Math.max(0, pk - dt * 1.5); } }
  }
  think(e, dt, t, player, d){
    const face = (x, z) => { e.heading = Math.atan2(x - e.pos.x, z - e.pos.z); };
    const S = e.sprite;
    /* on s'éloigne : il oubliera qu'il nous a vu */
    if(e.noticed && d > 16){ e.forget = (e.forget || 0) + dt; if(e.forget > 12){ e.noticed = false; e.forget = 0; } } else e.forget = 0;
    switch(e.state){
      case "hidden":
        this.setA(e, "idle");
        /* on s'approche : il jaillit des herbes, un « ! » au-dessus */
        if(d < 7.5 || this.game.capture.target === e){
          e.state = "alert"; e.hop = t; e.timer = 1.6; face(player.x, player.z); this.emote(e, "!"); e.noticed = true;
          if(this.game.audio) this.game.audio.rustle(e.pos, 1);
        } else if(Math.random() < dt * 0.4 && this.game.audio) this.game.audio.rustle(e.pos, 0.35);
        break;
      case "idle": {
        this.setA(e, "idle");
        e.timer -= dt;
        if(d < 6.5 && !e.noticed){ this.notice(e, t, player); break; }
        if(e.timer <= 0) this.choose(e, t, player, d);
        break;
      }
      case "walk": {
        this.setA(e, e.speed > 2.2 || e.run ? "run" : "walk");
        if(!e.target){ e.state = "idle"; break; }
        const dx = e.target.x - e.pos.x, dz = e.target.z - e.pos.z, L = Math.hypot(dx, dz);
        if(L < 0.3){ e.state = "idle"; e.timer = 1.5 + Math.random() * 3.5; e.run = false; if(e.hideAfter){ e.hideAfter = false; this.hideAgain(e); } break; }
        e.heading = Math.atan2(dx, dz);
        const v = e.speed * (e.run ? 1.7 : 1) * dt;
        e.pos.x += dx / L * Math.min(v, L); e.pos.z += dz / L * Math.min(v, L);
        if(d < 6.5 && !e.noticed){ this.notice(e, t, player); }
        break;
      }
      case "alert":
        this.setA(e, "idle");
        face(player.x, player.z);
        e.timer -= dt;
        if(e.timer <= 0){ e.hidden = false; this.releaseRustle(e); this.react(e, t, player, d); }
        /* un pas de course juste à côté : il recule */
        if(d < 2.2 && this.game.player.speed > 5.5){ e.target = this.pickWander(e, true); if(e.target){ e.state = "walk"; e.run = true; } }
        break;
      case "act":
        this.act(e, dt, t, player, d);
        break;
      case "held":                   /* dans la Ball : le module de capture s'en occupe */
        break;
      case "unwrite": {
        /* la région change : il se défait en pixels sur place, les uns après les autres */
        this.setA(e, "idle");
        e.gone += dt; const k = Math.max(0, e.gone - e.unDelay);
        S.uniforms.uGlitch.value = Math.min(1, k / 0.7);
        if(k > 0.8) e.state = "gone";
        break;
      }
      case "fled": {
        /* désindexé : il file, puis se défait en pixels */
        this.setA(e, "run");
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
  /* il nous voit : « ? » ; il dort : il sursaute */
  notice(e, t, player){
    e.noticed = true; e.state = "alert"; e.timer = 1.4; e.heading = Math.atan2(player.x - e.pos.x, player.z - e.pos.z);
    this.emote(e, e.temper === "bold" ? "!" : "?");
  }
  /* ---------- ce qu'il fait de lui-même ---------- */
  choose(e, t, player, d){
    const sky = this.game.world.sky, night = sky && sky.state && sky.state.night > 0.6;
    const ty = e.types || [], W = [];
    const add = (k, w) => { if(w > 0) W.push([k, w]); };
    const canMove = e.tag !== "missing" && d < 48 && t > this.nextMoveT && t > e.moveCD && !inWater(e.pos.x, e.pos.z);
    const partner = canMove && d < 40 ? this.list.find(o=>o !== e && o.state === "idle" && o.tag !== "missing" && !o.flyer && !e.flyer && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 16 && t > o.moveCD) : null;
    add("wander", 3);
    add("sniff", e.flyer ? 0 : 1.5);
    add("look", 1.1);
    add("play", (e.temper === "playful" ? 1.8 : 0.45) * (e.H < 1.3 ? 1.4 : 0.8) * (e.flyer ? 0 : 1));
    add("nap", e.flyer ? 0 : night ? 2.4 : e.temper === "sleepy" ? 1.8 : 0.2);
    add("shake", e.flyer ? 0 : 0.55);
    add("dig", ty.includes(5) && !e.flyer ? 1.3 : 0);
    add("drink", !e.flyer && lakeShore(e.pos.x, e.pos.z) > 0.05 && Math.hypot(e.pos.x - player.x, e.pos.z - player.z) > 6 ? 1.2 : 0);
    add("circle", e.flyer ? 2.6 : 0);
    add("train", canMove ? 2.2 + (e.temper === "bold" ? 1.2 : 0) : 0);
    add("spar", partner ? 2.6 : 0);
    let tot = 0; for(const w of W) tot += w[1];
    let x = Math.random() * tot, k = "wander";
    for(const w of W){ x -= w[1]; if(x <= 0){ k = w[0]; break; } }
    if(k === "wander"){ e.target = this.pickWander(e); e.state = e.target ? "walk" : "idle"; e.timer = 2 + Math.random() * 4; return; }
    if(k === "spar"){ this.startDuel(e, partner, t); return; }
    if(k === "train"){ if(!this.train(e, t, player)){ e.timer = 1; } return; }
    this.begin(e, k, t);
  }
  begin(e, k, t, o = {}){
    const dur = {sniff:2.5 + Math.random() * 2, look:2.6, play:2.2, nap:12 + Math.random() * 18, shake:1.1, dig:3.2, drink:9, circle:7, approach:9, flee:6, warn:4, yawn:1.6}[k] || 2;
    e.state = "act"; e.act = Object.assign({k, t0:t, dur, h0:e.heading}, o);
    const S = e.sprite;
    if(k === "play"){ this.emote(e, "♪"); this.once(e, "happy"); }
    if(k === "nap"){ e.act.zz = t + 1; }
    if(k === "shake" && this.game.audio) this.game.audio.burst({freq:1800, q:0.6, dur:0.4, vol:0.05 * this.game.audio.spatial(e.pos).att, attack:0.05});
    if(k === "drink"){ e.act.spot = this.shoreSpot(e); if(!e.act.spot){ e.state = "idle"; e.timer = 1; } }
    if(k === "circle"){ e.act.c = e.pos.clone(); e.act.a = Math.random() * 6.28; e.act.rad = 2.5 + Math.random() * 2.5; e.act.alt0 = e.alt; }
  }
  end(e, t){
    if(e.act && e.act.k === "circle") e.alt = e.act.alt0 || e.alt;
    e.act = null; e.state = "idle"; e.timer = 1.5 + Math.random() * 3.5; e.run = false;
  }
  /* un point du bord du lac, pour aller boire */
  shoreSpot(e){
    for(let k = 0; k < 16; k++){
      const a = k / 16 * Math.PI * 2;
      for(let r = 1; r < 14; r += 0.7){
        const x = e.pos.x + Math.cos(a) * r, z = e.pos.z + Math.sin(a) * r;
        if(inWater(x, z)){ const bx = e.pos.x + Math.cos(a) * (r - 0.9), bz = e.pos.z + Math.sin(a) * (r - 0.9);
          if(walkable(bx, bz) && !inWater(bx, bz)) return {x:bx, z:bz, wx:x, wz:z}; break; }
      }
    }
    return null;
  }
  /* il s'entraîne : un point du sol devant lui, de côté pour qu'on voie bien */
  train(e, t, player, at){
    let tgt = at;
    if(!tgt){
      for(let k = 0; k < 10 && !tgt; k++){
        const a = e.heading + (Math.random() - 0.5) * 2.4, dd = 3.6 + Math.random() * 2.6 + e.H * 0.6;
        const x = e.pos.x + Math.sin(a) * dd, z = e.pos.z + Math.cos(a) * dd;
        if(Math.hypot(x - player.x, z - player.z) < 3.2 || !walkable(x, z)) continue;
        if(Math.abs(heightAt(x, z) - heightAt(e.pos.x, e.pos.z)) > 2) continue;
        if(this.game.world.colliders.some(c=>Math.hypot(c.x - x, c.z - z) < c.r + 0.3)) continue;
        tgt = {x, z};
      }
    }
    if(!tgt) return false;
    const type = this.moveType(e);
    e.heading = Math.atan2(tgt.x - e.pos.x, tgt.z - e.pos.z);
    e.state = "act"; e.act = {k:"move", t0:t, dur:0.5, tgt, type, fired:false};
    e.moveCD = t + 18 + Math.random() * 20;
    this.nextMoveT = t + 6 + Math.random() * 7;
    return true;
  }
  /* ---------- deux sauvages se disputent : chacun son tour, trois ou quatre coups ---------- */
  startDuel(a, b, t){
    const duel = {a, b, turn:Math.random() < 0.5 ? 0 : 1, next:t + 1.4, n:0, max:3 + Math.floor(Math.random() * 2), t0:t, over:false};
    for(const e of [a, b]){ e.state = "act"; e.act = {k:"duel", t0:t, dur:20, duel}; e.moveCD = t + 30; }
    this.nextMoveT = t + 14;
    this.emote(a, "💢"); setTimeout(()=>this.emote(b, "💢"), 300);
  }
  endDuel(duel, t = this.game.t){
    if(duel.over) return; duel.over = true;
    const win = Math.random() < 0.5 ? duel.a : duel.b, lose = win === duel.a ? duel.b : duel.a;
    for(const e of [duel.a, duel.b]){ if(e.state === "act" && e.act && e.act.duel === duel) this.end(e, t); }
    if(win.state === "idle"){ this.once(win, "happy"); this.emote(win, "♪"); }
    if(lose.state === "idle"){ this.emote(lose, "…"); lose.target = this.pickWander(lose, true); if(lose.target){ lose.state = "walk"; lose.run = true; } }
  }
  /* ---------- ce qu'il fait quand il nous a vus : selon son caractère ---------- */
  react(e, t, player, d){
    const T = e.temper;
    if(T === "curious" && d < 14 && !e.flyer){ this.begin(e, "approach", t); return; }
    if(T === "playful"){ this.begin(e, "play", t); return; }
    if(T === "shy"){
      this.emote(e, "…");
      const ax = e.pos.x - player.x, az = e.pos.z - player.z, L = Math.hypot(ax, az) || 1;
      for(let k = 0; k < 10; k++){
        const a = Math.atan2(ax / L, az / L) + (Math.random() - 0.5) * 1.4, dd = 7 + Math.random() * 6, x = e.pos.x + Math.sin(a) * dd, z = e.pos.z + Math.cos(a) * dd;
        if(!walkable(x, z) || inWater(x, z) || lavaAt(x, z) > 0.05) continue;
        e.target = {x, z}; e.state = "walk"; e.run = true; e.timer = 3; e.hideAfter = tallGrassAt(x, z) > 0.6; return;
      }
    }
    if(T === "bold" && e.tag !== "missing" && d > 4 && d < 22 && t > e.moveCD - 10){
      /* un coup de semonce : au sol, entre lui et toi, jamais sur toi */
      this.emote(e, "💢");
      const f = Math.max(0.3, Math.min(0.62, 1 - 3.2 / d)), x = e.pos.x + (player.x - e.pos.x) * f, z = e.pos.z + (player.z - e.pos.z) * f;
      if(this.train(e, t, player, {x, z})){ e.act.delay = 0.7; this.nextMoveT = Math.max(this.nextMoveT, t + 5); return; }
    }
    if(T === "sleepy"){ this.begin(e, "yawn", t); return; }
    /* calme : il nous regarde encore un peu, puis retourne à ses affaires */
    e.target = this.pickWander(e); e.state = e.target ? "walk" : "idle"; e.timer = 2.5;
  }
  /* le Pokémon timide arrivé dans les hautes herbes s'y cache de nouveau */
  hideAgain(e){ if(tallGrassAt(e.pos.x, e.pos.z) > 0.6){ e.state = "hidden"; e.hidden = true; this.claimRustle(e); } }
  /* ---------- les activités ---------- */
  act(e, dt, t, player, d){
    const A = e.act, S = e.sprite, P = e.pose; if(!A){ e.state = "idle"; return; }
    const k = (t - A.t0) / A.dur, face = (x, z) => { e.heading = Math.atan2(x - e.pos.x, z - e.pos.z); };
    const M = this.moves, lo = typeof window.calmFx === "function" && window.calmFx();
    switch(A.k){
      case "sniff": {
        /* il baisse la tête vers le sol, renifle par petits coups */
        this.setA(e, "idle"); P.tilt = 0.34 * Math.min(1, k * 5) * Math.min(1, (1 - k) * 5) + Math.sin(t * 11) * 0.05;
        if(Math.random() < dt * 2 && !lo){ const m = M.mouth(e); M.dust.emit({x:m.x, y:heightAt(m.x, m.z) + 0.05, z:m.z, vx:(Math.random() - 0.5) * 0.6, vy:0.5, life:0.7, s0:0.08, s1:0.25, c:"#b8a888", a:0.4, k:2}); }
        break;
      }
      case "look": this.setA(e, "idle"); e.heading = A.h0 + Math.sin(k * Math.PI * 2) * 0.95; P.tilt = -0.06; break;
      case "play": {
        /* des bonds, et une pirouette au deuxième */
        const hop = Math.floor((t - A.t0) / 0.55);
        if(hop !== A.hop && hop < 3){ A.hop = hop; e.hop = t; if(this.game.audio) this.game.audio.burst({freq:2600, q:0.8, dur:0.06, vol:0.04 * this.game.audio.spatial(e.pos).att}); }
        if(hop === 1){ const q = ((t - A.t0) - 0.55) / 0.5; P.spin = Math.min(1, Math.max(0, q)) * Math.PI * 2; }
        this.setA(e, "idle");
        break;
      }
      case "nap": {
        this.setA(e, "sleep"); P.squash = 0.93 + Math.sin(t * 1.7) * 0.025; P.tilt = 0.05;
        if(t > A.zz){ A.zz = t + 2.6; this.emote(e, "z"); }
        /* un pas trop près, une course : il sursaute */
        if(d < 3.2 || (d < 9 && this.game.player.speed > 5.5)){ e.hop = t; this.end(e, t); this.notice(e, t, player); this.emote(e, "!"); return; }
        if(k >= 1 && this.game.world.sky.state && this.game.world.sky.state.night > 0.6 && Math.random() < 0.6) A.t0 = t;    /* la nuit, il se rendort */
        break;
      }
      case "yawn": this.setA(e, "idle"); P.tilt = -0.25 * Math.sin(Math.min(1, k) * Math.PI); if(k >= 1){ this.begin(e, "nap", t); return; } break;
      case "shake": {
        /* il se secoue comme au sortir de l'eau */
        this.setA(e, "idle"); P.roll = 0.3 * Math.sin(t * 34) * (1 - k);
        if(!A.fx && !lo){ A.fx = 1; const wet = inWater(e.pos.x, e.pos.z) || (G() && G().S.weather === "pluie") || (e.types || []).includes(11);
          M.dust.burst(M.chest(e), wet ? 18 : 10, {spd:2.6, up:0.6, grav:wet ? 9 : 1, life:wet ? 0.6 : 1, s:wet ? 0.08 : 0.25, cols:wet ? ["#cfefff", "#ffffff"] : ["#c8b898", "#b8a888"], k:wet ? 4 : 2, a:wet ? 0.85 : 0.35, cone:0.3}); }
        break;
      }
      case "dig": {
        /* il gratte le sol : la terre vole derrière lui, un trou reste */
        this.setA(e, "walk"); P.tilt = 0.42 + Math.sin(t * 16) * 0.06;
        if(Math.random() < dt * 14 && !lo){ const m = M.mouth(e), bx = -Math.sin(e.heading), bz = -Math.cos(e.heading);
          M.dust.emit({x:m.x, y:heightAt(m.x, m.z) + 0.1, z:m.z, vx:bx * 2.5 + (Math.random() - 0.5), vy:2.4 + Math.random(), vz:bz * 2.5 + (Math.random() - 0.5), grav:9, life:0.8, s:0.1, c:"#6a5440", a:0.9, k:8, floor:heightAt(m.x, m.z)}); }
        if(!A.mk && k > 0.5){ A.mk = 1; const m = M.mouth(e); addMark(MKK.scuff, m.x, m.z, 0.9, t); addMark(MKK.crack, m.x, m.z, 0.55, t, {life:40}); }
        break;
      }
      case "drink": {
        const sp = A.spot; if(!sp){ this.end(e, t); return; }
        const L = Math.hypot(sp.x - e.pos.x, sp.z - e.pos.z);
        if(L > 0.35 && !A.at){ this.setA(e, "walk"); face(sp.x, sp.z); const v = e.speed * dt; e.pos.x += (sp.x - e.pos.x) / L * Math.min(v, L); e.pos.z += (sp.z - e.pos.z) / L * Math.min(v, L); if(t - A.t0 > 7) this.end(e, t); break; }
        if(!A.at){ A.at = t; A.dur = (t - A.t0) + 4; }
        this.setA(e, "idle"); face(sp.wx, sp.wz); P.tilt = 0.5 + Math.sin(t * 6) * 0.04;
        if(Math.random() < dt * 1.6 && this.game.world.lake) this.game.world.lake.ripple(sp.wx, sp.wz, t, 0.35);
        break;
      }
      case "circle": {
        /* ceux qui volent : un grand cercle, plus haut */
        this.setA(e, "walk"); A.a += dt * (e.speed / A.rad) * 0.9;
        const x = A.c.x + Math.cos(A.a) * A.rad, z = A.c.z + Math.sin(A.a) * A.rad;
        if(walkable(x, z)){ e.heading = Math.atan2(x - e.pos.x, z - e.pos.z); e.pos.x = x; e.pos.z = z; }
        e.alt = (A.alt0 || 1) + Math.sin(Math.min(1, k) * Math.PI) * 2.2; P.roll = -0.3;
        break;
      }
      case "approach": {
        /* le curieux : il s'approche, renifle, et ça lui plaît */
        const stop = 2.2 + e.H * 0.5, L = Math.hypot(player.x - e.pos.x, player.z - e.pos.z);
        face(player.x, player.z);
        if(!A.at && L > stop){ this.setA(e, "walk"); const v = e.speed * 0.8 * dt; e.pos.x += (player.x - e.pos.x) / L * Math.min(v, L - stop); e.pos.z += (player.z - e.pos.z) / L * Math.min(v, L - stop); if(t - A.t0 > 6) this.end(e, t); break; }
        if(!A.at){ A.at = t; A.dur = (t - A.t0) + 3; }
        this.setA(e, "idle"); const q = t - A.at;
        if(q < 1.6) P.tilt = 0.25 + Math.sin(t * 12) * 0.06;
        else if(!A.love){ A.love = 1; this.emote(e, "♥"); this.once(e, "happy"); e.hop = t; }
        break;
      }
      case "move": {
        /* il s'entraîne (ou nous prévient) : il se tourne, prend son élan, lance */
        face(A.tgt.x, A.tgt.z); this.setA(e, "idle");
        if(!A.fired && t - A.t0 >= (A.delay || 0.2)){
          A.fired = true; const m = M.play(e, A.type, A.tgt, null);
          A.dur = (t - A.t0) + Math.max(1.4, (m.rel - t) + 1.6);
        }
        if(A.fired && k >= 0.85 && !A.proud){ A.proud = 1; if(e.temper === "bold" || Math.random() < 0.4){ this.once(e, "happy"); } }
        break;
      }
      case "duel": {
        const D = A.duel, o = D.a === e ? D.b : D.a;
        if(D.over){ this.end(e, t); return; }
        if(!o || o.state !== "act" || !o.act || o.act.duel !== D){ this.endDuel(D, t); return; }
        const L = Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z), want = 3.4 + (e.H + o.H) * 0.35;
        face(o.pos.x, o.pos.z);
        if(L > want + 0.4 && !M.busy(e)){ this.setA(e, "walk"); const v = e.speed * dt; e.pos.x += (o.pos.x - e.pos.x) / L * Math.min(v, L - want); e.pos.z += (o.pos.z - e.pos.z) / L * Math.min(v, L - want); }
        else if(!M.busy(e)) this.setA(e, "idle");
        /* chacun son tour ; celui qui frappe est le premier des deux dans la liste du duel */
        if(e === D.a && t >= D.next && L < want + 1.2 && !M.busy(D.a) && !M.busy(D.b)){
          const att = D.turn ? D.b : D.a, vic = D.turn ? D.a : D.b;
          M.play(att, this.moveType(att), vic.pos, vic);
          D.turn = 1 - D.turn; D.n++; D.next = t + 2.2 + Math.random() * 0.6;
          if(D.n > D.max) D.next = t + 2;
        }
        if(e === D.a && D.n > D.max && t >= D.next){ this.endDuel(D, t); return; }
        if(t - D.t0 > 24){ this.endDuel(D, t); return; }
        return;
      }
      case "flee": break;
    }
    if(k >= 1) this.end(e, t);
  }
  /* celui qu'on vise : le plus proche du réticule, à portée */
  pick(cam, maxDist = 32){
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    let best = null, bestScore = 1e9;
    for(const e of this.list){
      if(e.state === "fled" || e.state === "unwrite" || e.state === "gone" || e.state === "held" || e.state === "caught") continue;
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
  /* la région de la zone change (la grande carte) : ceux d'ici s'effacent, les nouveaux arrivent vite */
  rewrite(){
    const busy = e => (this.game.capture && this.game.capture.holding === e) || e.state === "held" || e.state === "caught";
    let i = 0;
    for(const e of this.list){
      if(busy(e)) continue;
      if(e.act && e.act.duel) e.act.duel.over = true;
      e.state = "unwrite"; e.gone = 0; e.unDelay = 0.15 + (i++) * 0.12 + Math.random() * 0.1; e.act = null;
    }
    this.nextSpawn = Math.min(this.nextSpawn, 1.2 + i * 0.12); this.quick = 4;
  }
}
