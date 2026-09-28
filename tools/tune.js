const fs = require("fs");
const out = require("child_process").execSync("node brdps.js", {cwd:"/home/claude/pcg"}).toString();
const idx = {};
for(const l of out.trim().split("\n")){ const m = l.match(/^(\w+).*indice ([\d.]+)/); if(m) idx[m[1]] = +m[2]; }
const p = "/home/claude/pcg/src/59a-breche-attacks.js";
let s = fs.readFileSync(p, "utf8");
const TARGET = 1.1, changes = [];
s = s.replace(/const BR_KIND = \{([\s\S]*?)\};/, (all, body)=>{
  const nb = body.replace(/(\w+):\{dmg:([\d.]+),cd:([\d.]+)\}/g, (m, k, d, cd)=>{
    if(!idx[k]) return m;
    const f = Math.max(0.35, Math.min(3, TARGET / idx[k]));
    const nd = Math.round(+d * f * 10) / 10;
    changes.push(`${k} ${d} → ${nd}`);
    return `${k}:{dmg:${nd},cd:${cd}}`;
  });
  return "const BR_KIND = {" + nb + "};";
});
fs.writeFileSync(p, s);
console.log(changes.join(" · "));
