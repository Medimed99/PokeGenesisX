/* Le rendu : WebGL2, ombres douces, éclairage d'ambiance tiré du ciel, et une chaîne d'effets
   (occlusion ambiante, halo lumineux, tonalité filmique, vignette, anticrénelage).
   Quatre niveaux de qualité, réglables à chaud. */
import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, SMAAPreset, ToneMappingEffect, ToneMappingMode,
  VignetteEffect, HueSaturationEffect, BrightnessContrastEffect } from "postprocessing";
import { N8AOPostPass } from "n8ao";
import { CorruptEffect } from "./fx/corruptfx.js";

export const QUALITY = {
  basse:   {label:"Basse",   scale:0.75, shadow:1024, shadowExt:40, ao:false, bloom:true,  smaa:false, grass:12, grassRadius:16, tallRadius:38, aniso:2},
  moyenne: {label:"Moyenne", scale:1.0,  shadow:2048, shadowExt:50, ao:false, bloom:true,  smaa:true,  grass:20, grassRadius:22, tallRadius:48, aniso:4},
  haute:   {label:"Haute",   scale:1.0,  shadow:2048, shadowExt:55, ao:true,  bloom:true,  smaa:true,  grass:28, grassRadius:30, tallRadius:58, aniso:8},
  ultra:   {label:"Ultra",   scale:1.0,  shadow:4096, shadowExt:65, ao:true,  bloom:true,  smaa:true,  grass:38, grassRadius:38, tallRadius:70, aniso:16}
};

export class Engine {
  constructor(canvas){
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas, powerPreference:"high-performance", antialias:false, stencil:false, depth:false});
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;          /* la tonalité est appliquée en fin de chaîne */
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.05, 1500);
    this.camera.rotation.order = "YXZ";
    this.clock = new THREE.Clock();
    this.qualityKey = "haute";
  }
  setupPost(q){
    const r = this.renderer;
    if(this.composer){ this.composer.dispose(); }
    const w = this.width, h = this.height;
    this.composer = new EffectComposer(r, {frameBufferType:THREE.HalfFloatType, multisampling:0});
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = null;
    if(q.ao){
      try {
        this.ao = new N8AOPostPass(this.scene, this.camera, w, h);
        this.ao.configuration.aoRadius = 1.6;
        this.ao.configuration.distanceFalloff = 0.6;
        this.ao.configuration.intensity = 2.2;
        this.ao.configuration.color = new THREE.Color(0, 0.02, 0.04);
        this.ao.setQualityMode(q === QUALITY.ultra ? "Medium" : "Low");
        this.composer.addPass(this.ao);
      } catch(e){ console.warn("occlusion ambiante indisponible", e); this.ao = null; }
    }
    const effects = [];
    if(q.bloom){ this.bloom = new BloomEffect({luminanceThreshold:0.72, luminanceSmoothing:0.25, intensity:0.85, mipmapBlur:true, radius:0.72}); effects.push(this.bloom); }
    this.hue = new HueSaturationEffect({saturation:-0.04});
    this.bc = new BrightnessContrastEffect({brightness:-0.01, contrast:0.14});
    this.tone = new ToneMappingEffect({mode:ToneMappingMode.ACES_FILMIC});
    this.vignette = new VignetteEffect({offset:0.24, darkness:0.62});
    effects.push(this.hue, this.bc, this.tone, this.vignette);
    if(q.smaa) effects.push(new SMAAEffect({preset:SMAAPreset.HIGH}));
    this.composer.addPass(new EffectPass(this.camera, ...effects));
    /* l'image abîmée : à part, car elle relit l'image voisine (décalage des couleurs) */
    this.corrupt = new CorruptEffect();
    this.composer.addPass(new EffectPass(this.camera, this.corrupt));
    this.composer.setSize(w, h);
  }
  setQuality(key){
    this.qualityKey = QUALITY[key] ? key : "haute";
    const q = QUALITY[this.qualityKey];
    this.q = q;
    this.resize(true);
    this.setupPost(q);
    return q;
  }
  resize(force){
    const w = window.innerWidth, h = window.innerHeight;
    if(!force && w === this.width && h === this.height) return;
    this.width = w; this.height = h;
    const q = this.q || QUALITY.haute;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * q.scale);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if(this.composer) this.composer.setSize(w, h);
    if(this.ao) this.ao.setSize(w, h);
  }
  /* l'exposition : lue par la tonalité filmique (uniforme toneMappingExposure de three) */
  setExposure(e){ this.renderer.toneMappingExposure = e; }
  render(dt){
    if(this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
  }
}
