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

export class World {
  constructor(engine){
    this.engine = engine; this.scene = engine.scene;
    this.colliders = [];
  }
  async build(quality, progress){
    const step = async (label, fn) => { if(progress) progress(label); await new Promise(r=>setTimeout(r, 0)); return fn(); };
    await step("Lecture du secteur : Route 1", ()=>buildGrid());
    await step("Reconstruction du sol", ()=>{ this.terrain = buildTerrain(); this.scene.add(this.terrain); });
    await step("Le ciel", ()=>{ this.sky = new Sky(this.scene, this.engine.renderer); });
    await step("Le lac", ()=>{ this.lake = new Lake(this.scene); });
    await step("Les arbres", ()=>{ this.trees = new Trees(this.scene); this.trees.build(quality); this.colliders.push(...this.trees.colliders); });
    await step("Le décor", ()=>{ this.boundary = buildProps(this.scene, this.colliders); });
    await step("L'herbe", ()=>{ this.grass = new Grass(this.scene, quality); });
    await step("Les zones désindexées", ()=>{ this.corruption = new Corruption(this.scene); });
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
    this.grass.uniforms.uWind.value = W.wind;
    this.grass.update(t, player);
    this.trees.update(t, W.wind);
    this.boundary.uniforms.uTime.value = t; this.boundary.uniforms.uPlayer.value.copy(player);
    W.update(dt, t, cam, this.sky.state);
    this.corruption.update(t, this.scene, player);
  }
}
export { heightAt };
