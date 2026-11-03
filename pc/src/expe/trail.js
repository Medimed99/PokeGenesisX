/* ============================================================
   L'EXPÉDITION EN 3D · LE TRACÉ
   Sur la carte (M), un clic sur un nœud trace la route qui y mène
   (le jeu mobile la calcule déjà : EXP_PEEK). Dans le secteur, cette
   route se suit au sol : une ligne de petits points de lumière, de
   l'équipe jusqu'au nœud choisi, en passant par les nœuds du chemin ;
   une pulsation la parcourt vers la destination. Discret, mais on le
   suit sans regarder la carte.
   ============================================================ */
import * as THREE from "three";

const G = () => window.PCG;
const ref = n => { try { return G().ref(n); } catch(e){ return undefined; } };
const MAX = 400, STEP = 1.05;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
const BASE = new THREE.Color("#ffc857");   /* doré : à ne pas confondre avec les sentiers allumés (blancs) */

/* la route vers le nœud examiné : à chaque palier, le nœud du chemin le plus proche de la destination */
export function routeTo(run, pk){
  if(!run || !run.map || !pk || !run.map[pk.y] || !run.map[pk.y][pk.i] || pk.y <= run.row) return null;
  const K = (y, i) => y + ":" + i, last = run.map.length - 1, start = run.row + 1;
  const reach = new Set(); let front = (run.avail || []).map(i=>[start, i]);
  while(front.length){
    const nx = [];
    for(const [y, i] of front){ if(reach.has(K(y, i)) || !run.map[y] || !run.map[y][i]) continue; reach.add(K(y, i)); if(y < last) for(const j of run.map[y][i].next) nx.push([y + 1, j]); }
    front = nx;
  }
  if(!reach.has(K(pk.y, pk.i))) return null;
  const path = new Set([K(pk.y, pk.i)]);
  for(let y = pk.y - 1; y >= start; y--) run.map[y].forEach((n, i)=>{ if(reach.has(K(y, i)) && n.next.some(j=>path.has(K(y + 1, j)))) path.add(K(y, i)); });
  const goalC = run.map[pk.y][pk.i].c, out = [];
  let opts = (run.avail || []).slice();
  for(let y = start; y <= pk.y; y++){
    const cand = opts.filter(i=>path.has(K(y, i)));
    if(!cand.length) return null;
    cand.sort((a, b)=>Math.abs(run.map[y][a].c - goalC) - Math.abs(run.map[y][b].c - goalC));
    const i = cand[0]; out.push({y, i});
    opts = run.map[y][i].next.slice();
  }
  return out;
}

export class XTrail {
  constructor(scene){
    this.mat = new THREE.MeshBasicMaterial({color:"#ffffff", transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
    /* des chevrons à plat, pointés vers la destination (les sentiers allumés, eux, sont des points blancs) */
    const sh = new THREE.Shape();
    sh.moveTo(-0.24, -0.14); sh.lineTo(0, 0.08); sh.lineTo(0.24, -0.14); sh.lineTo(0.24, -0.01); sh.lineTo(0, 0.21); sh.lineTo(-0.24, -0.01); sh.closePath();
    this.mesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), this.mat, MAX);
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.renderOrder = 2;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, new THREE.Color()); this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    /* au bout : un anneau qui respire sur le nœud choisi */
    this.goal = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.32, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color:"#ffc857", transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    this.goal.visible = false; scene.add(this.goal);
    this.dots = []; this.len = 0;
  }
  clear(){ this.mesh.count = 0; this.dots = []; this.goal.visible = false; }
  /* des points tous les 85 cm le long des étapes, posés sur le sol */
  set(pts, ground){
    const d = this.dots = []; let acc = 0.9; this.len = 0;
    for(let k = 1; k < pts.length; k++){
      const a = pts[k - 1], b = pts[k], L = Math.hypot(b.x - a.x, b.z - a.z);
      /* (on s'arrête au bord de chaque nœud, on repart de l'autre côté : le tracé ne passe pas sur ce qui s'y trouve) */
      const cut0 = k === 1 ? 0 : 1.6, cut1 = 1.6;
      /* (un peu à côté du sentier, pour ne pas se confondre avec ses points) */
      const yaw = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI, ox = (b.z - a.z) / (L || 1) * 0.42, oz = -(b.x - a.x) / (L || 1) * 0.42;
      while(acc < L - cut1 && d.length < MAX){ if(acc > cut0){ const f = acc / L, x = a.x + (b.x - a.x) * f + ox, z = a.z + (b.z - a.z) * f + oz; d.push({x, z, y:ground(x, z) + 0.06, s:this.len + acc, yaw}); } acc += STEP; }
      this.len += L; acc -= L; if(acc < 0) acc = 0;
    }
    this.total = d.length ? d[d.length - 1].s : 0;
    const g = pts[pts.length - 1];
    this.goal.position.set(g.x, ground(g.x, g.z) + 0.07, g.z); this.goal.visible = true;
  }
  update(t, dt, calm){
    const d = this.dots, M = this.mesh;
    M.count = d.length;
    const s0 = d.length ? d[0].s : 0;
    for(let i = 0; i < d.length; i++){
      const q = d[i], u = q.s - s0;
      /* une vague qui file vers la destination ; près de l'équipe, les points s'estompent */
      const wave = calm ? 0.5 : 0.5 + 0.5 * Math.cos((u - t * 7) * 0.32);
      const b = (0.32 + 0.68 * Math.pow(wave, 3)) * Math.min(1, 0.35 + u / 3);
      _m.compose(_p.set(q.x, q.y, q.z), _q.setFromAxisAngle(UP, q.yaw), _s.setScalar(0.9 + 0.3 * Math.pow(wave, 3)));
      M.setMatrixAt(i, _m); M.setColorAt(i, _c.copy(BASE).multiplyScalar(b));
    }
    M.instanceMatrix.needsUpdate = true; if(M.instanceColor) M.instanceColor.needsUpdate = true;
    if(this.goal.visible){ this.goal.material.opacity = calm ? 0.6 : 0.4 + 0.3 * Math.sin(t * 3); this.goal.scale.setScalar(calm ? 1 : 1 + 0.05 * Math.sin(t * 3)); }
  }
}
