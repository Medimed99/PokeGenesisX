/* ============================================================
   LES SONS DE LA ROUTE
   Tout est synthétisé (aucun fichier) : les pas selon le sol (herbe,
   terre, hautes herbes, sable), le froissement des herbes où un
   Pokémon se cache, le souffle du lancer, la Ball qui rebondit et
   tremble ; et l'ambiance — le vent, les oiseaux le jour, les
   grillons la nuit, la pluie, le clapotis près du lac.
   ============================================================ */
export class Audio {
  constructor(game){
    this.game = game; this.ok = false; this.vol = 0.8;
    const unlock = () => { this.init(); };
    addEventListener("pointerdown", unlock, {capture:true});
    addEventListener("keydown", unlock, {capture:true});
  }
  init(){
    if(this.ctx){ if(this.ctx.state === "suspended") this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if(!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
      for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
      this.amb = {};
      this.loop("wind", 420, 0.0, "lowpass");
      this.loop("rain", 5200, 0.0, "lowpass");
      this.loop("water", 700, 0.0, "bandpass");
      /* le bourdonnement de l'archive : deux sinusoïdes graves qui battent l'une contre l'autre */
      const dg = this.ctx.createGain(); dg.gain.value = 0; dg.connect(this.master);
      for(const [f, v] of [[55, 0.6], [55.7, 0.5], [82.4, 0.25]]){
        const o = this.ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = this.ctx.createGain(); g.gain.value = v; o.connect(g); g.connect(dg); o.start();
      }
      this.amb.drone = {g:dg};
      this.ok = true;
    } catch(e){ this.ok = false; }
  }
  setVolume(v){ this.vol = v; if(this.master) this.master.gain.value = v; }
  loop(name, freq, vol, type){
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.7;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start();
    this.amb[name] = {s, f, g};
  }
  /* un bruit filtré, court : pas, froissements, chocs */
  burst({freq = 2000, q = 1, dur = 0.08, vol = 0.2, type = "bandpass", pan = 0, attack = 0.004, sweep = 0}){
    if(!this.ok) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if(sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq * sweep), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    s.connect(f); f.connect(g); g.connect(p); p.connect(this.master);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  tone({freq = 440, to = 0, dur = 0.15, vol = 0.12, type = "sine", pan = 0, delay = 0}){
    if(!this.ok) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if(to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = pan;
    o.connect(g); g.connect(p); p.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  }
  /* la position d'un son par rapport à la tête : gauche/droite, et l'atténuation */
  spatial(pos){
    const cam = this.game.engine.camera, dx = pos.x - cam.position.x, dz = pos.z - cam.position.z, d = Math.hypot(dx, dz) || 1;
    const yaw = this.game.player.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return {pan:(dx * rx + dz * rz) / d * 0.85, att:Math.max(0, 1 - d / 40)};
  }
  step(surface, run){
    const k = run ? 1.25 : 1;
    if(surface === "path") this.burst({freq:900 + Math.random() * 300, q:0.8, dur:0.09, vol:0.16 * k, type:"bandpass"});
    else if(surface === "tall"){ this.burst({freq:3200, q:0.6, dur:0.22, vol:0.12 * k, attack:0.03}); }
    else if(surface === "sand") this.burst({freq:500, q:0.5, dur:0.12, vol:0.12 * k, type:"lowpass"});
    else this.burst({freq:2300 + Math.random() * 600, q:0.7, dur:0.08, vol:0.09 * k});
  }
  land(v){ this.burst({freq:300, q:0.6, dur:0.18, vol:Math.min(0.35, v * 0.03), type:"lowpass"}); }
  rustle(pos, k){ const s = this.spatial(pos); if(s.att <= 0) return; this.burst({freq:3600, q:0.5, dur:0.35, vol:0.14 * k * s.att, pan:s.pan, attack:0.06}); }
  whoosh(){ this.burst({freq:600, q:1.2, dur:0.32, vol:0.18, sweep:4, attack:0.03}); }
  bounce(pos){ const s = this.spatial(pos); this.tone({freq:160, to:70, dur:0.12, vol:0.22 * Math.max(0.2, s.att), pan:s.pan}); this.burst({freq:2500, q:2, dur:0.03, vol:0.08 * s.att, pan:s.pan}); }
  click(pos){ const s = pos ? this.spatial(pos) : {pan:0, att:1}; this.tone({freq:1300, to:900, dur:0.05, vol:0.08 * Math.max(0.3, s.att), type:"square", pan:s.pan}); }
  absorb(){ this.tone({freq:300, to:1600, dur:0.38, vol:0.09, type:"sawtooth"}); this.tone({freq:620, to:2400, dur:0.4, vol:0.05, type:"sine"}); }
  caught(){ [0, 0.09, 0.18].forEach((d, i)=>this.tone({freq:[1046, 1318, 1568][i], dur:0.35, vol:0.08, type:"triangle", delay:d})); }
  splash(pos, k = 1){ const s = pos ? this.spatial(pos) : {pan:0, att:1}; this.burst({freq:1400, q:0.6, dur:0.4, vol:0.2 * k * Math.max(0.3, s.att), pan:s.pan, attack:0.01, sweep:0.4}); }
  plop(pos){ const s = pos ? this.spatial(pos) : {pan:0, att:1}; this.tone({freq:900, to:380, dur:0.09, vol:0.12 * Math.max(0.3, s.att), pan:s.pan}); }
  /* une déchirure de l'image : des bips carrés, un souffle haché */
  glitch(k = 1){
    if(!this.ok) return;
    const n = 2 + Math.floor(Math.random() * 4 * k);
    for(let i = 0; i < n; i++) this.tone({freq:200 + Math.random() * 2400, dur:0.015 + Math.random() * 0.04, vol:0.035 * k, type:"square", pan:Math.random() * 1.4 - 0.7, delay:i * 0.025});
    this.burst({freq:6000, q:0.4, dur:0.06 + 0.08 * k, vol:0.06 * k, type:"highpass", attack:0.002});
  }
  update(dt, t){
    if(!this.ok) return;
    const g = this.game, S = window.PCG && window.PCG.S, night = g.world.sky.state ? g.world.sky.state.night : 0;
    const rain = S && S.weather === "pluie";
    const cam = g.engine.camera.position;
    const lakeD = Math.hypot(cam.x + 30, cam.z + 32);
    const quiet = g.mode === "title" ? 0.5 : g.mode === "terminal" ? 0.25 : 1;
    const set = (n, v) => { const a = this.amb[n]; if(a) a.g.gain.setTargetAtTime(v * quiet, this.ctx.currentTime, 0.4); };
    set("wind", 0.05 + 0.04 * Math.sin(t * 0.13) + (g.world.weather.wind - 1) * 0.04);
    set("rain", rain ? 0.22 : 0);
    set("water", Math.max(0, 1 - lakeD / 26) * 0.12);
    const C = g.world.corruption, near = C ? C.near(cam.x, cam.z) : 0;
    set("drone", 0.025 + 0.03 * (C ? C.level : 1) + 0.09 * near);
    if(quiet < 1 && g.mode === "terminal") return;
    /* près d'une zone : des crépitements de données */
    if(near > 0.05 && Math.random() < dt * 9 * near){
      this.tone({freq:3000 + Math.random() * 5000, dur:0.006, vol:0.03 * near, type:"square", pan:Math.random() * 1.6 - 0.8});
    }
    /* peu d'oiseaux : un appel isolé, de loin en loin ; les grillons la nuit */
    if(Math.random() < dt * (night > 0.5 ? 0 : rain ? 0.02 : 0.12) * (1 - near)){
      const f = 1800 + Math.random() * 1600, pan = Math.random() * 1.6 - 0.8, n = 1 + Math.floor(Math.random() * 2);
      for(let i = 0; i < n; i++) this.tone({freq:f, to:f * (0.82 + Math.random() * 0.1), dur:0.12 + Math.random() * 0.08, vol:0.016, pan, delay:i * 0.24});
    }
    if(night > 0.5 && Math.random() < dt * 2.2){
      const pan = Math.random() * 1.6 - 0.8;
      for(let i = 0; i < 3; i++) this.tone({freq:4400 + Math.random() * 200, dur:0.03, vol:0.012, type:"triangle", pan, delay:i * 0.05});
    }
  }
}
