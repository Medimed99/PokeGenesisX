/* Le monde de la Route 1 : tout ce qui est posé une fois, et ce qui vit à chaque image
   (le ciel, l'eau, l'herbe, le vent, la météo partagée avec le jeu mobile). */
import * as THREE from "three";
import { buildGrid, heightAt } from "./layout.js";
import { buildTerrain } from "./terrain.js";
import { Sky } from "./sky.js";
import { Grass } from "./grass.js";
import { Trees } from "./trees.js";
import { Lake } from "./water.js";
import { buildProps } from "./props.js";
import { Weather } from "./weather.js";
import { Corruption } from "./corruption.js";
import { Biomes, HAB_NAMES } from "./biomes/index.js";
import { Sites } from "./sites.js";
import { ensurePonds, PondsView } from "./ponds.js";
import { LOCKS, BIOMES } from "./layout.js";

export class World {
  constructor(engine){
    this.engine = engine; this.scene = engine.scene;
    this.colliders = [];
  }
  async build(quality, progress){
    const step = async (label, fn) => { if(progress) progress(label); await new Promise(r=>setTimeout(r, 0)); return fn(); };
    await step("Lecture de la zone de capture", ()=>{ buildGrid(); ensurePonds(); });
    await step("Reconstruction du sol", ()=>{ this.terrain = buildTerrain(); this.scene.add(this.terrain); });
    await step("Le ciel", ()=>{ this.sky = new Sky(this.scene, this.engine.renderer); });
    await step("Le lac", ()=>{ this.lake = new Lake(this.scene); });
    await step("Les arbres", ()=>{ this.trees = new Trees(this.scene); this.trees.build(quality); this.colliders.push(...this.trees.colliders); });
    await step("Le décor", ()=>{ this.boundary = buildProps(this.scene, this.colliders); });
    await step("L'herbe", ()=>{ this.grass = new Grass(this.scene, quality); });
    await step("Les zones désindexées", ()=>{ this.corruption = new Corruption(this.scene); });
    await step("Les biomes", ()=>{ this.biomes = new Biomes(this.scene, this.colliders); });
    await step("Les lieux des modules", ()=>{ this.sites = new Sites(this.scene, this.colliders, this.biomes.lights); });
    await step("Les eaux des biomes", ()=>{ this.ponds = new PondsView(this.scene, this.colliders, this.biomes.lights); });
    this.weather = new Weather(this.scene);
    this.setQuality(quality);
  }
  setQuality(q){
    this.sky.setShadowSize(q.shadow, q.shadowExt);
    this.grass.setQuality(q);
  }
  update(dt, t, hour, player, cam){
    const W = this.weather;
    this.sky.overcast = W.overcast; this.sky.tint = W.tint; this.sky.tintCol.copy(W.tintCol);
    this.sky.rift = this.corruption.level > 0.001 ? 0.3 + 0.7 * this.corruption.level : 0;   /* restaurée : la faille s'est refermée */
    this.sky.update(hour, t, this.focus || player);       /* l'ombre suit la scène regardée (la Tour, sinon toi) */
    this.lake.update(t, this.sky, this.scene);
    if(this.ponds) this.ponds.update(t, this.sky, this.scene);
    this.grass.uniforms.uWind.value = W.wind;
    this.grass.update(t, player);
    this.trees.update(t, W.wind);
    this.boundary.uniforms.uTime.value = t; this.boundary.uniforms.uPlayer.value.copy(player);
    W.update(dt, t, cam, this.sky.state);
    this.corruption.update(t, this.scene, player);
    /* les biomes : leurs cols fermés ou ouverts, leur lumière autour du joueur */
    if(!this._lockT || t - this._lockT > 1 || t < this._lockT){ this._lockT = t; this.refreshLocks(); }
    const A = this.biomes.update(dt, t, this.focus || player, this.sky, this.sky.state ? this.sky.state.night : 0, this.lockInfo);
    this.lampBoost = A ? A.lamp : 0;
    this.sites.update(t, dt, this.focus || player, this.sky.state ? this.sky.state.night : 0);
    W.indoor = this.biomes.mix.k === "grotte" && this.biomes.mix.w > 0.6;
    if(A && this.sky.state) this.sky.state.exp *= A.exp;
    /* l'éclairage d'ambiance suit le ciel du biome */
    const M = this.biomes.mix, sig = (M.k || "") + Math.round(M.w * 4);
    if(sig !== this._envSig){ this._envSig = sig; this.sky.lastEnvH = -99; }
  }
  /* le jeu mobile décide : tant d'espèces de Kanto au Pokédex ouvrent tel biome */
  refreshLocks(){
    const g = window.PCG; if(!g || !g.S) return;
    let have = 0; try { have = g.ref("dexCount")("kanto"); } catch(e){}
    const H = g.HABITATS || {}, need = {};
    for(const b of BIOMES){
      need[b.k] = (H[b.k] && H[b.k].need) || 0;
      const open = have >= need[b.k];
      if(open && !LOCKS[b.k] && this.lockInfo && this.onOpen) this.onOpen(b.k);
      LOCKS[b.k] = open;
    }
    this.lockInfo = {have, need};
  }
  /* où l'on est : le biome, et son nom */
  place(){ const w = this.biomes ? this.biomes.where : {k:"route"}; return {k:w.k, n:HAB_NAMES[w.k] || "Routes ouvertes"}; }
}
export { heightAt };
