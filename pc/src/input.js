/* Clavier, souris, verrouillage du pointeur. Les touches suivent la disposition physique
   (KeyW = Z sur un clavier AZERTY) : ZQSD et WASD marchent tous les deux. */
export class Input {
  constructor(canvas){
    this.canvas = canvas; this.keys = new Set(); this.pressed = new Set(); this.mouse = {dx:0, dy:0, left:false, right:false, wheel:0};
    this.clicks = []; this.locked = false; this.enabled = true;
    this.sens = 1;
    addEventListener("keydown", e => {
      if(!this.enabled) return;
      if(e.code === "Tab" || (this.locked && (e.code === "Space" || e.code.startsWith("Arrow")))) e.preventDefault();
      if(!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener("keyup", e => { this.keys.delete(e.code); });
    addEventListener("blur", () => { this.keys.clear(); this.mouse.left = this.mouse.right = false; });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.canvas;
      if(!this.locked){ this.keys.clear(); this.mouse.left = this.mouse.right = false; }
      if(this.onLockChange) this.onLockChange(this.locked);
    });
    document.addEventListener("mousemove", e => {
      if(!this.locked) return;
      /* certains navigateurs envoient un saut énorme au verrouillage : on l'ignore */
      if(Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      this.mouse.dx += e.movementX; this.mouse.dy += e.movementY;
    });
    canvas.addEventListener("mousedown", e => {
      if(!this.locked) return;
      if(e.button === 0){ this.mouse.left = true; this.clicks.push("left"); }
      if(e.button === 2){ this.mouse.right = true; this.clicks.push("right"); }
    });
    addEventListener("mouseup", e => { if(e.button === 0) this.mouse.left = false; if(e.button === 2) this.mouse.right = false; });
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    addEventListener("wheel", e => { if(this.locked) this.mouse.wheel += Math.sign(e.deltaY); }, {passive:true});
  }
  lock(){ try { const p = this.canvas.requestPointerLock({unadjustedMovement:true}); if(p && p.catch) p.catch(()=>{ try { this.canvas.requestPointerLock(); } catch(e){} }); } catch(e){ try { this.canvas.requestPointerLock(); } catch(e2){} } }
  unlock(){ if(document.pointerLockElement) document.exitPointerLock(); }
  down(code){ return this.keys.has(code); }
  hit(code){ return this.pressed.has(code); }
  consumeLook(){ const d = {x:this.mouse.dx * this.sens, y:this.mouse.dy * this.sens}; this.mouse.dx = this.mouse.dy = 0; return d; }
  consumeWheel(){ const w = this.mouse.wheel; this.mouse.wheel = 0; return w; }
  consumeClicks(){ const c = this.clicks; this.clicks = []; return c; }
  endFrame(){ this.pressed.clear(); }
}
