/* ============================================================
   37f — LA MISE EN SCÈNE
   Chaque scène du récit se joue sur le plateau (37d), dans un lieu
   peint (37e). Le texte ne change pas : on ajoute ce qu'on VOIT.

   Le metteur en scène (directStory) fait le gros du travail seul :
   · le LIEU de la scène, et Porygon-Z qui s'y tient — projeté dans le
     présent (un programme qu'on affiche), solide dans les souvenirs ;
   · ses HUMEURS jouées avec le corps (un saut de joie, une douleur, un
     temps d'arrêt), et son portrait au-dessus de la boîte de dialogue ;
   · les SOUVENIRS : la mémoire se défragmente, le lieu d'alors apparaît
     au sépia, avec ses trous ; l'archiviste d'alors s'y tient — une
     forme de pixels, jamais un visage ;
   · la FAILLE : MissingNo prend corps à sa première réplique.

   La table STAGE ajoute, scène par scène, ce que le metteur en scène ne
   peut pas deviner : qui entre, qui bouge, ce qu'on montre au mur.
     set    le lieu du présent              {k, v, light, cam}
     pz     où se tient Porygon-Z           {at, dir, enter}
     cast   ce qui est là dès le début      [temps]
     pre    avant la réplique n             {n:[temps]}
     with   juste avant qu'elle s'affiche   {n:[temps]}
     sync   pendant qu'elle s'affiche       {n:[temps]}  (joués à la suite)
     voice  répliques dites hors champ      [n]
     end    après la dernière               [temps]
     mem    le souvenir                     {set, holes, defrag, cast, pz, exit}
     back   au retour du souvenir           [temps]
   ============================================================ */

/* ---------- ce que la mise en scène sait du joueur ---------- */
/* après ÉCRIRE, Porygon-Z est un Pokémon : il n'est plus projeté */
function pzReal(){ try { return !!(S && S.saga && S.saga.end === "write"); } catch(e){ return false; } }
const stHasPmd = id => typeof PMD_META !== "undefined" && !!PMD_META[id];
function stFirstMon(){ try { const id = S.flags && S.flags.firstMon; if(id && POKE[id] && stHasPmd(id)) return id; } catch(e){} return 19; }
function stBuddyMon(){ try { const id = (S.buddy && S.buddy.id) || S.team[0]; if(id && POKE[id] && stHasPmd(id)) return id; } catch(e){} return 25; }
function stShinyMon(){
  try { const ids = Object.keys(S.dex).map(Number).filter(id=>S.dex[id].shiny && stHasPmd(id)).sort((a, b)=>((S.dex[b].h || {}).t || 0) - ((S.dex[a].h || {}).t || 0));
    if(ids.length) return ids[0]; } catch(e){}
  return 25;
}
function stFirstBoss(){ try { const b = (S.bosses || [])[0]; const id = b ? +String(b).split(":")[1] : 0; if(id && stHasPmd(id)) return id; } catch(e){} return 146; }
function stRecentNames(n){
  try { return Object.keys(S.dex).map(Number).filter(id=>POKE[id]).sort((a, b)=>((S.dex[b].h || {}).t || 0) - ((S.dex[a].h || {}).t || 0)).slice(0, n).map(id=>POKE[id].name); }
  catch(e){ return []; }
}
/* « Défragmentation… 3 blocs récupérés. » : le nombre de blocs, pour l'écran de défragmentation */
function stDefragN(sc){
  const l = (sc.lines || []).find(x=>x.w === "sys" && /fragmentation/i.test(x.t));
  if(!l) return null;
  const m = l.t.match(/(\d+)\s+blocs?/); return m ? +m[1] : /bloc/.test(l.t) ? 1 : 0;
}
const stMask = () => typeof pzMask === "function" ? pzMask() : "▒▒▒▒";

/* ============================================================
   LA TABLE DES SCÈNES
   ============================================================ */
const STAGE = {
  /* --- Acte I --- */
  first_catch: () => {
    const m = stFirstMon();
    return {
      set:{k:"terminal"},
      pre:{0:[{t:"put", id:"m", kind:"mon", mon:m, at:"left", dir:"right", enter:"assemble", wait:1100},
              {t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", mood:"Joyous"},
              {t:"move", id:"pz", to:[0.48, 0.63], speed:60, face:"left", wait:false}],
           1:[{t:"move", id:"pz", to:"pz", speed:40, face:"down", wait:false}],
           2:[{t:"wl", id:"tag", k:"tag", follow:"m", dy:-6, text:"N° " + String(m).padStart(3, "0") + " · LISIBLE"}],
           3:[{t:"wl", id:"tag", on:false},
              {t:"wl", id:"file", k:"file", at:"file", lines:["001  Un utilisateur. Un vrai.", "002  Il s'appelle {nom}.", "003  {first} est revenu. Lisible."]}]},
      end:[{t:"wl", id:"file", on:false}]
    };
  },
  beat_early: () => ({
    set:{k:"terminal"},
    pre:{1:[{t:"plat", st:{integSeq:[8.4, 6.1, 4.2, 2.9, 1.7, 0.6, 0, 0, 0.3, 1.1, 2.2, 3.0], integStep:0.42}}],
         2:[{t:"wl", id:"file", k:"log", at:"file", title:"captures.log", lines:()=>stRecentNames(3).map((n, i)=>"capture " + String(i + 1).padStart(3, "0") + " · " + n)}]},
    end:[{t:"wl", id:"file", on:false}]
  }),
  missingno_1: () => ({
    set:{k:"route", v:"day"},
    pre:{0:[{t:"fx", k:"noise", lv:1}, {t:"light", k:"dim", ms:1600}],
         1:[{t:"put", id:"mn", kind:"mn", at:"grass", enter:"assemble"}, {t:"light", k:"rift", ms:500},
            {t:"cam", to:"grass", z:1.5, dy:-26, ms:1200}],
         3:[{t:"cam", to:[0.55, 0.6], z:1, ms:700}],
         4:[{t:"fx", k:"shake", lv:2, ms:450}],
         5:[{t:"wl", id:"err", k:"win", cls:"err", follow:"mn", dy:-4, text:"ENTITE SANS INDEX · N° 000"}],
         6:[{t:"wl", id:"err", on:false}, {t:"gone", id:"mn", how:"cut"}, {t:"fx", k:"noise", on:false}, {t:"light", k:"none", ms:300}, {t:"fx", k:"flash", lv:1}],
         7:[{t:"face", id:"pz", dir:"down"}],
         9:[{t:"set", k:"cote", cut:true}, {t:"put", id:"walker", kind:"swarm", pal:"gb", at:"walkA", enter:"cut", rate:0.05}, {t:"move", id:"walker", to:"walkB", speed:9, wait:false}],
         10:[{t:"plat", st:{mnL:1}}],
         11:[{t:"set", k:"route", v:"day", light:"dim", cut:true}, {t:"fx", k:"rgb", lv:1, ms:500}]},
    with:{3:[{t:"move", id:"pz", to:[0.5, 0.74], speed:80, face:"up", wait:false}]},
    voice:[9, 10],
    end:[{t:"fx", k:"noise", on:false}]
  }),
  kanto_half: () => ({
    set:{k:"strates"},
    pre:{0:[{t:"plat", st:{hi:"kanto"}}],
         2:[{t:"plat", st:{hi:"", eyes:1}}],
         3:[{t:"wl", id:"dg", k:"tag", at:[0.5, 0.2], text:"DATA GUARDIANS"}],
         4:[{t:"wl", id:"dg", on:false}, {t:"wl", id:"log", k:"log", at:[0.5, 0.18], title:"journal du système",
             lines:["> verrou 01 : posté", "> verrou 02 : posté", "> verrou 03 : posté", "!> motif : à la demande de l'utilisateur"]}],
         5:[{t:"wl", id:"log", on:false}]}
  }),
  guardian_first: () => ({
    set:{k:"tour", cam:{at:"viewTop"}},
    cast:[{t:"put", id:"g", kind:"mon", mon:146, at:"top", enter:"cut", sil:"#1a0c10", eyes:"#ffb070"}],
    pz:{at:"pz", dir:"up"},
    pre:{1:[{t:"cam", to:"view", ms:2600}],
         2:[{t:"cam", to:"viewTop", ms:3200}, {t:"anim", id:"g", sil:false, eyes:false}],
         3:[{t:"cam", to:"view", ms:1600}]},
    with:{2:[{t:"emote", id:"pz", e:"sweat"}]}
  }),
  boss_first_done: () => {
    const g = stFirstBoss();
    return {
      set:{k:"tour", cam:{at:"viewTop"}},
      cast:[{t:"put", id:"g", kind:"mon", mon:g, at:"top", enter:"cut"}],
      pz:{at:[0.72, 0.2], dir:"left"},
      pre:{0:[{t:"plat", st:{open:1}}, {t:"fx", k:"flash", lv:1}],
           1:[{t:"move", id:"g", to:[0.42, 0.185], speed:9, wait:false}],
           3:[{t:"face", id:"g", dir:"down"}, {t:"wait", ms:900}],
           4:[{t:"gone", id:"g", how:"fade", ms:1100}, {t:"put", id:"crack", kind:"prop", prop:"crack", at:[0.46, 0.2], enter:"cut", data:{len:40}}, {t:"fx", k:"glitch", lv:1, ms:420}],
           5:[{t:"move", id:"pz", to:[0.8, 0.2], speed:40, face:"left", wait:false}]}
    };
  },
  pz_mem1: () => ({
    set:{k:"terminal"},
    pre:{0:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), mood:"Stunned"}]},
    mem:{set:{k:"labo", v:"souvenir", cam:{at:"monitor", z:1.5}}, holes:14,
         cast:[{t:"put", id:"pz", kind:"pz", at:"back", dir:"down", enter:"cut"},
               {t:"cam", to:[0.5, 0.6], z:1, ms:2400, wait:false},
               {t:"put", id:"self", kind:"swarm", at:"spot", enter:"form", wait:1600}]},
    with:{4:[{t:"emote", id:"pz", e:"note"}],
          7:[{t:"wl", id:"file", k:"file", at:"file", lines:["…", "— CHOSES PAS FORMIDABLES DU TOUT —", "001  « Tu comptes vraiment tout ? »", "     (c'était ma voix)"]}]},
    end:[{t:"wl", id:"file", on:false}]
  }),
  kanto_done: () => ({
    set:{k:"noyau", v:"kanto", st:{free:0}},
    cast:[{t:"put", id:"g", kind:"mon", mon:150, at:"guard", enter:"cut", dir:"right"}],
    pre:{0:[{t:"plat", st:{free:1}}, {t:"fx", k:"flash", lv:1}, {t:"anim", id:"g", a:"charge"}, {t:"gone", id:"g", how:"fade", ms:1600, wait:false}],
         3:[{t:"wl", id:"log", k:"log", at:[0.5, 0.2], title:"journal d'exécution · PORYGON-Z",
             lines:["[??/??] je compte extrêmement bien.", "[??/??] il rit quand la Ball rebondit.", "[??/??] ne pas oublier : choses_formidables.txt", "!entrées datées d'avant ma compilation"]}],
         5:[{t:"wl", id:"log", on:false}]},
    with:{1:[{t:"emote", id:"pz", e:"bin"}], 5:[{t:"emote", id:"pz", e:"…"}]}
  }),
  pz_mem2: () => {
    const m = stFirstMon();
    return {
      set:{k:"terminal"},
      mem:{set:{k:"route", v:"dusk", sep:0.6}, holes:9,
           cast:[{t:"put", id:"self", kind:"swarm", at:"throw", enter:"cut"},
                 {t:"put", id:"m", kind:"mon", mon:m, at:"catch", dir:"left", enter:"cut"},
                 {t:"put", id:"pz", kind:"pz", at:[0.74, 0.58], dir:"down-left", enter:"cut"},
                 {t:"wl", id:"cnt", k:"count", cls:"mem", at:[0.2, 0.15], title:"INTEGRITE", text:"40 %"}]},
      with:{2:[{t:"swarm", id:"self", do:"unstable", ms:1400}]},
      pre:{3:[{t:"ball", from:"self", to:"m", catch:true, ms:800}, {t:"hop", id:"m", n:1, h:7}],
           6:[{t:"wl", id:"cnt", k:"count", follow:"pz", dy:-10, title:"INTONATION", text:"97 %"}],
           7:[{t:"wl", id:"cnt", k:"count", follow:"pz", dy:-10, title:"CE QUI RESTE", text:"3 %"}],
           8:[{t:"wl", id:"cnt", on:false}]}
    };
  },
  johto_mid: () => ({
    set:{k:"sauvegardes", light:"dim"},
    pre:{0:[{t:"put", id:"pz", kind:"pz", at:[-0.1, 0.66], holo:!pzReal(), to:"center", speed:34, face:"up"}],
         1:[{t:"plat", st:{lit:0, litStep:0.2}}],
         2:[{t:"plat", st:{lit:11, flipAt:2.2}}],
         4:[{t:"plat", st:{lit:11, zero:1, pz:1}}]}
  }),
  pz_mem3: () => ({
    set:{k:"terminal"},
    pre:{0:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), mood:"Determined"},
            {t:"move", id:"pz", to:[0.5, 0.7], speed:40, face:"down"}, {t:"cam", to:[0.5, 0.62], z:1.5, ms:900}],
         7:[{t:"gone", id:"self", how:"scatter"}, {t:"plat", holes:12}, {t:"put", id:"self2", kind:"swarm", at:"spot", enter:"form", seed:"b", wait:1700}],
         8:[{t:"gone", id:"self2", how:"scatter"}, {t:"plat", holes:20}, {t:"put", id:"self3", kind:"swarm", at:"spot", enter:"form", seed:"c", wait:1700}, {t:"fx", k:"glitch", lv:1, ms:260}]},
    mem:{set:{k:"labo", v:"souvenir"}, holes:7, defrag:false,
         cast:[{t:"put", id:"pz", kind:"pz", at:"back", dir:"down", enter:"cut"}]},
    sync:{5:[{t:"wait", ms:900}, {t:"put", id:"self", kind:"swarm", at:"spot", enter:"form", wait:1700}]},
    back:[{t:"cam", to:[0.5, 0.55], z:1, ms:10}],
    with:{10:[{t:"tremble", id:"pz", ms:600}]}
  }),
  pz_mem4: () => ({
    set:{k:"terminal"},
    mem:{set:{k:"ciel", sep:0.42}, holes:4,
         cast:[{t:"put", id:"self", kind:"swarm", at:"left", enter:"cut"},
               {t:"put", id:"pz", kind:"pz", at:"pz", dir:"up", enter:"cut"},
               {t:"wl", id:"cnt", k:"count", cls:"mem", at:[0.5, 0.12], title:"INTEGRITE", text:"100 %"}],
         /* le noir, un temps, avant que le souvenir ne lâche */
         exit:[{t:"wait", ms:1400}, {t:"fx", k:"glitch", lv:1, ms:220}]},
    with:{4:[{t:"face", id:"pz", dir:"left"}]},
    sync:{5:[{t:"wait", ms:1200}, {t:"gone", id:"self", how:"scatter"}, {t:"wait", ms:500}, {t:"face", id:"pz", dir:"down"},
             {t:"erase", ms:5200, from:100, to:0, lbl:"cnt"}]},
    pre:{8:[{t:"fx", k:"glitch", lv:1, ms:240}]}
  }),
  johto_done: () => ({
    set:{k:"noyau", v:"johto", st:{free:0}},
    cast:[{t:"put", id:"g", kind:"mon", mon:249, at:"guard", enter:"cut"}],
    pre:{0:[{t:"plat", st:{free:1}}, {t:"fx", k:"flash", lv:1}, {t:"gone", id:"g", how:"fade", ms:1500, wait:false}],
         1:[{t:"light", k:"rift", ms:400}, {t:"put", id:"mn", kind:"mn", at:[0.32, 0.62], enter:"assemble"}, {t:"fx", k:"shake", lv:2, ms:500}],
         5:[{t:"gone", id:"mn", how:"tear"}, {t:"light", k:"none", ms:900}, {t:"wait", ms:900}]},
    with:{3:[{t:"anim", id:"pz", a:"attack"}, {t:"tremble", id:"mn", ms:600}], 6:[{t:"face", id:"pz", dir:"down"}]}
  }),
  pz_twist: () => ({
    set:{k:"terminal"},
    pre:{0:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), mood:"Stunned"}],
         4:[{t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"]}],
         6:[{t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:1}, {t:"fx", k:"flash", lv:2}]},
    mem:{set:{k:"ciel", sep:0.3}, holes:0,
         cast:[{t:"put", id:"self", kind:"swarm", at:"left", enter:"cut", rate:0.05},
               {t:"put", id:"pz", kind:"pz", at:"pz", dir:"up", enter:"cut"}],
         exit:[{t:"fx", k:"glitch", lv:2, ms:520}, {t:"fx", k:"shake", lv:1, ms:300}]},
    sync:{5:[{t:"swarm", id:"self", do:"unstable", ms:3600},
             {t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:0}, {t:"wait", ms:900},
             {t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:1}, {t:"wait", ms:700},
             {t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:0}, {t:"wait", ms:1300},
             {t:"wl", id:"q", k:"sysq", at:"q", text:"> Cohérence atteinte. Que souhaitez-vous faire ?", opts:["CONFIRMER", "EFFACER"], sel:1}]}
  }),

  /* --- Acte III --- */
  hoenn_mid: () => ({
    set:{k:"hoenn", st:{trace:0}, cam:{at:[0.5, 0.3]}},
    pz:{at:"left", dir:"right"},
    pre:{0:[{t:"cam", to:[0.5, 0.56], ms:2600, wait:false}],
         1:[{t:"plat", st:{trace:1}}],
         2:[{t:"move", id:"pz", to:[0.56, 0.66], speed:22, face:"right", wait:false}, {t:"letters", at:"letters", text:()=>pzName(), spread:14}],
         3:[{t:"move", id:"pz", to:[0.62, 0.62], speed:16, face:"up-right", wait:false}],
         5:[{t:"letters", on:false}, {t:"face", id:"pz", dir:"down"}]}
  }),
  pz_mem5: () => ({
    set:{k:"terminal"},
    mem:{set:{k:"route", v:"day", sep:0.7}, holes:6, defrag:false,
         cast:[{t:"put", id:"self", kind:"swarm", at:"throw", enter:"cut"}]},
    sync:{1:[{t:"ball", from:"self", to:"grass", miss:true, ms:700}, {t:"swarm", id:"self", do:"unstable", ms:1300}, {t:"wait", ms:1500},
             {t:"set", k:"route", v:"day", cut:true}, {t:"put", id:"self", kind:"swarm", at:"left", enter:"cut"},
             {t:"put", id:"mk", kind:"mon", mon:129, at:"right", dir:"left", enter:"cut", anim:"hurt", loop:true}, {t:"emote", id:"self", e:"…"}, {t:"wait", ms:1900},
             {t:"set", k:"forage", light:"dark", cut:true}, {t:"put", id:"self", kind:"swarm", at:"center", enter:"cut", rate:0.18}, {t:"wait", ms:1500}],
          2:[{t:"set", k:"route", v:"day", cut:true},
             {t:"put", id:"a", kind:"swarm", at:[0.24, 0.66], enter:"cut", seed:"a", alpha:0.6},
             {t:"put", id:"b", kind:"swarm", at:[0.38, 0.69], enter:"cut", seed:"b", alpha:0.75},
             {t:"put", id:"c", kind:"swarm", at:[0.5, 0.72], enter:"cut", seed:"c"},
             {t:"wait", ms:500},
             {t:"par", beats:[{t:"ball", from:"a", to:"grass", miss:true, ms:600}, {t:"ball", from:"b", to:"grass", miss:true, ms:600}, {t:"ball", from:"c", to:"grass", miss:true, ms:600}]},
             {t:"wait", ms:500},
             {t:"par", beats:[{t:"move", id:"a", to:[0.46, 0.64], speed:14}, {t:"move", id:"b", to:[0.5, 0.67], speed:14}, {t:"move", id:"c", to:[0.54, 0.7], speed:14}]}]},
    back:[],
    pre:{4:[{t:"put", id:"hole", kind:"swarm", at:[0.32, 0.7], enter:"form", hollow:true, rate:0.02, wait:1400}],
         6:[{t:"gone", id:"hole", how:"scatter", wait:false}]}
  }),
  hoenn_done: () => ({
    set:{k:"noyau", v:"hoenn", st:{free:0}},
    cast:[{t:"put", id:"g", kind:"mon", mon:384, at:[0.34, 0.6], enter:"cut", dir:"right"}],
    pre:{0:[{t:"plat", st:{free:1}}, {t:"fx", k:"flash", lv:1}],
         1:[{t:"face", id:"g", to:"pz"}],
         2:[{t:"gone", id:"g", how:"fade", ms:1500, wait:false}, {t:"cam", to:"below", z:1.5, ms:1600}, {t:"plat", st:{free:1, crack:1}}],
         4:[{t:"cam", to:[0.5, 0.55], z:1, ms:1000}],
         5:[{t:"move", id:"pz", to:"spot", speed:40, face:"down"}]},
    with:{1:[{t:"hop", id:"g", n:1, h:6}]}
  }),
  pz_mem6: () => ({
    set:{k:"terminal"},
    pre:{0:[{t:"defrag", n:0, ms:2600}],
         1:[{t:"wl", id:"cnt", k:"count", at:[0.26, 0.36], title:"MEMOIRE DE TRAVAIL", text:"98 %"}],
         3:[{t:"wl", id:"cnt", on:false}, {t:"face", id:"pz", dir:"down"}, {t:"cam", to:[0.62, 0.7], z:1.5, ms:1200}],
         4:[{t:"cam", to:[0.5, 0.55], z:1, ms:800},
            {t:"wl", id:"file", k:"file", at:"file", title:"choses_formidables.txt",
             lines:()=>["C.01  " + stMask() + " ▒▒▒▒▒▒▒▒▒▒", "C.04  " + stMask() + " ▒▒▒▒▒ ▒▒▒▒", "C.09  ▒▒▒▒▒▒▒▒ " + stMask(), "…", (typeof fmt === "function" ? fmt(pzLineCount()) : pzLineCount()) + "  {nom} est revenu."]}],
         5:[{t:"wl", id:"file", on:false}]}
  }),

  /* --- Acte IV --- */
  finale_gate: () => ({
    set:{k:"labo", v:"clean", light:"clean", cam:{at:"monitor", z:1.5}},
    mn:false,
    pre:{0:[{t:"fx", k:"flash", lv:1}],
         2:[{t:"cam", to:[0.5, 0.52], z:1, ms:3200, wait:false}],
         4:[{t:"cam", to:"spot", z:1.5, dy:-18, ms:2600, wait:false}],
         5:[{t:"put", id:"crack", kind:"prop", prop:"crack", at:"spot", enter:"cut", data:{len:36}}, {t:"fx", k:"noise", lv:1}],
         6:[{t:"light", k:"rift", ms:400}, {t:"fx", k:"glitch", lv:2, ms:600}],
         7:[{t:"move", id:"pz", to:[0.62, 0.69], speed:40, face:"left", wait:false}]},
    with:{3:[{t:"face", id:"pz", dir:"left"}], 4:[{t:"face", id:"pz", dir:"down"}]},
    end:[{t:"fx", k:"noise", on:false}]
  }),
  epilogue_write: () => ({
    set:{k:"labo", v:"warm", light:"warm"},
    pz:{at:"center"},
    pre:{0:[{t:"wl", id:"file", k:"file", at:"file", lines:["…", "« Aujourd'hui, {nom} a écrit au lieu d'effacer. »"]}],
         2:[{t:"wl", id:"file", on:false}],
         3:[{t:"put", id:"sh", kind:"mon", mon:133, variant:"s", at:[1.1, 0.68], to:[-0.15, 0.7], speed:30, enter:"cut"}],
         4:[{t:"wl", id:"hp", k:"tag", follow:"pz", dy:-8, text:"PV 85 / 85"}],
         5:[{t:"wl", id:"hp", on:false}]},
    with:{4:[{t:"anim", id:"pz", a:"rotate"}]}
  }),

  /* --- les connexions suivantes --- */
  cy_e_open: () => ({
    set:{k:"terminal", st:{integ:0}},
    pz:{at:"pz"},
    pre:{0:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:true, anim:"laying", loop:true, enter:"fade"}],
         2:[{t:"cam", to:"pz", z:1.5, dy:-14, ms:2200, wait:false}],
         3:[{t:"anim", id:"pz", a:"wake", wait:true}, {t:"cam", to:[0.5, 0.55], z:1, ms:600}],
         7:[{t:"wl", id:"file", k:"file", at:"file", lines:()=>["PROTÉGÉ EN ÉCRITURE", "propriétaire : " + stMask(), "4 212 lignes"]}]},
    end:[{t:"wl", id:"file", on:false}]
  }),
  cy_e_page: () => ({
    set:{k:"page", sep:0.5, mem:true, st:{lines:0}},
    pre:{1:[{t:"plat", st:{lines:3}}], 2:[{t:"plat", st:{lines:6}}], 3:[{t:"plat", st:{lines:9}}], 4:[{t:"plat", st:{lines:9, sig:1}}]},
    end:[{t:"mem", on:false}]
  }),
  cy_e_mid: () => ({
    set:{k:"terminal"},
    pre:{1:[{t:"put", id:"r", kind:"mon", mon:19, at:"left", dir:"right", enter:"fade"}, {t:"hop", id:"r", n:2, h:5}],
         3:[{t:"gone", id:"r", how:"fade", wait:false},
            {t:"wl", id:"q", k:"sysq", at:[0.5, 0.3], text:"> Que souhaitez-vous faire ?", opts:["EFFACER", "ÉCRIRE"], sel:1}]},
    end:[{t:"wl", id:"q", on:false}]
  }),
  cy_w_open: () => ({
    set:{k:"labo", v:"warm", light:"warm"},
    pre:{3:[{t:"put", id:"sm", kind:"prop", prop:"smudge", at:[0.5, 0.45], enter:"fade"}],
         4:[{t:"put", id:"prof", kind:"prop", prop:"prof", at:"prof", enter:"fade", data:{glitch:0.12}}]}
  }),
  cy_w_prof: () => ({
    set:{k:"labo", v:"warm", light:"warm", st:{bar:12}, cam:{at:"monitor", z:1.5}},
    pre:{0:[{t:"wait", ms:600}],
         1:[{t:"cam", to:[0.5, 0.54], z:1, ms:1400}, {t:"put", id:"prof", kind:"prop", prop:"prof", at:"prof", enter:"fade"}],
         2:[{t:"anim", id:"prof", data:{glitch:0.25}}],
         4:[{t:"anim", id:"prof", data:{glitch:0}}]},
    sync:{4:[{t:"wait", ms:900}, {t:"plat", st:{bar:12, barTo:100, barMs:3200}}]},
    with:{5:[{t:"hop", id:"pz", n:2, h:7}]}
  }),

  /* --- moments --- */
  pz_egg: () => ({
    set:{k:"terminal"},
    pre:{0:[{t:"put", id:"egg", kind:"prop", prop:"egg", at:"egg", enter:"assemble"}],
         2:[{t:"move", id:"pz", to:[0.44, 0.7], speed:30, face:"up-left", wait:false}],
         3:[{t:"wl", id:"file", k:"file", at:[0.3, 0.3], lines:["…", "une entité sans nom. ce n'est pas grave."]}]},
    end:[{t:"wl", id:"file", on:false}]
  }),
  pz_treasure: () => ({
    set:{k:"forage", light:"dim"},
    cast:[{t:"put", id:"o", kind:"prop", prop:"treasure", at:"obj", enter:"fade"}],
    pre:{3:[{t:"face", id:"pz", dir:"up"}]}
  }),
  pz_buddy: () => {
    const m = stBuddyMon();
    return {
      set:{k:"route", v:"day"},
      cast:[{t:"put", id:"bd", kind:"mon", mon:m, at:[0.36, 0.7], dir:"down", enter:"cut"}],
      pre:{2:[{t:"move", id:"bd", to:[0.6, 0.72], speed:30, face:"up-right"}],
           3:[{t:"face", id:"bd", dir:"down"}, {t:"hop", id:"bd", n:1, h:5}]}
    };
  },
  pz_region_full: () => ({
    set:{k:"route", v:"day", light:"clean"},
    with:{4:[{t:"tremble", id:"pz", flicker:true, ms:700}]}
  }),
  pz_first_guardian_fail: () => ({
    set:{k:"tour", cam:{at:"view"}},
    pre:{1:[{t:"wl", id:"t", k:"tag", at:[0.5, 0.86], text:"LE TYPE AVANT LE NIVEAU"}], 2:[{t:"wl", id:"t", on:false}]}
  }),
  pz_shiny: () => ({
    set:{k:"route", v:"day"},
    cast:[{t:"put", id:"sh", kind:"mon", mon:stShinyMon(), variant:"s", at:"grass", dir:"down-left", enter:"fade"}],
    with:{2:[{t:"emote", id:"sh", e:"spark"}]}
  }),
  pz_fail: () => ({
    set:{k:"terminal"},
    with:{0:[{t:"anim", id:"pz", a:"rotate"}, {t:"emote", id:"pz", e:"spiral"}]},
    pre:{1:[{t:"wl", id:"c", k:"count", at:[0.3, 0.36], title:"ECHECS D'AFFILEE", text:"10"}], 2:[{t:"wl", id:"c", on:false}]}
  }),
  pz_box: () => ({
    set:{k:"terminal"},
    cast:[{t:"put", id:"box", kind:"prop", prop:"box", at:[0.36, 0.66], enter:"assemble"}],
    with:{2:[{t:"move", id:"box", to:[0.42, 0.68], speed:10, wait:false}]}
  }),

  /* --- la faille : six rencontres --- */
  rift_1: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    with:{0:[{t:"wl", id:"hex", k:"tag", cls:"wl-hex", follow:"mn", dy:-6, text:"3F 00 00 A9"}]}, pre:{1:[{t:"wl", id:"hex", on:false}]}}),
  rift_2: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    with:{0:[{t:"letters", at:[0.36, 0.38], text:"RECOMMENCE", spread:6, clear:true, ms:4200}]}}),
  rift_3: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    with:{0:[{t:"letters", at:[0.36, 0.38], text:()=>pzName(), spread:5, ms:4600}]}}),
  rift_4: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    pre:{1:[{t:"wl", id:"q", k:"sysq", at:"up", text:"POURQUOI TU RÉPARES ?"}], 3:[{t:"wl", id:"q", on:false}]}}),
  rift_5: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    with:{1:[{t:"tremble", id:"pz", flicker:true, ms:1600}], 2:[{t:"face", id:"pz", dir:"down"}]}}),
  rift_6: () => ({set:{k:"faille"}, cast:[{t:"put", id:"pz", kind:"pz", at:"pz", holo:!pzReal(), dir:"left", enter:"fade"}],
    pre:{1:[{t:"wl", id:"m", k:"tag", cls:"wl-masks", at:[0.36, 0.3], text:()=>Array.from({length:Math.max(1, sagaConn() - 1)}, ()=>stMask()).join("\n")}],
         2:[{t:"tremble", id:"mn", ms:900}],
         3:[{t:"wl", id:"m", on:false}]}})
};

/* ============================================================
   LE METTEUR EN SCÈNE
   ============================================================ */
function directStory(sc){
  const lines = sc.lines || [];
  const whos = new Set(lines.map(l=>l.w || ""));
  const rift = /^rift_/.test(sc.id || "");
  const major = rift || MAJOR_SCENES.has(sc.id);
  const hasBad = whos.has("bad"), hasProf = whos.has("prof");
  const f = STAGE[sc.id];
  let ST = {};
  try { ST = (typeof f === "function" ? f(sc) : f) || {}; } catch(e){ ST = {}; }
  const real = pzReal();
  const universe = hasBad ? {k:"faille"} : hasProf ? {k:"labo", v:"warm"} : {k:"terminal"};
  const set0 = Object.assign({}, universe, ST.set || {}, {t:"set", cut:true});
  const beats = [], on = new Map();
  /* qui est sur le plateau : on suit les entrées, les sorties, et les changements de lieu */
  const scan = list => {
    for(const b of list){
      if(b.t === "put") on.set(b.id, b.kind);
      else if(b.t === "gone") on.delete(b.id);
      else if(b.t === "set" && b.keep !== true){ const keep = b.keep || []; for(const id of [...on.keys()]) if(!keep.includes(id)) on.delete(id); }
      else if((b.t === "plat" && b.on === false) || (b.t === "fx" && b.k === "blackout")) on.clear();
      else if(b.t === "par" || b.t === "seq") scan(b.beats);
    }
  };
  const track = list => { if(!list || !list.length) return; scan(list); beats.push(...list); };
  const has = kind => [...on.values()].includes(kind);
  if(major) beats.push({t:"bars", on:true});
  const title = rift ? "LA FAILLE"
    : (typeof STORY_TITLES !== "undefined" && STORY_TITLES[sc.id]) ? STORY_TITLES[sc.id].toUpperCase() : null;
  if(major && title)
    beats.push({t:"card", text:title,
      sub: rift ? `MissingNo · étape ${sc.id.split("_")[1]} / ${RIFT_ARC.length}` : sc.mem ? "mémoire de Porygon-Z"
         : hasBad ? "signal non indexé" : /^cy_/.test(sc.id || "") ? "connexion n° " + (typeof sagaConn === "function" ? sagaConn() : 12) : "journal de l'Archiviste",
      hold:1600});
  track([set0]);
  if(set0.mem) beats.push({t:"mem", on:true});
  track(ST.cast);
  const pzAt = (ST.pz && ST.pz.at) || "pz";
  const pzPut = mood => ({t:"put", id:"pz", kind:"pz", at:pzAt, dir:(ST.pz && ST.pz.dir) || "down", holo:!real,
    enter:(ST.pz && ST.pz.enter) || (major ? "assemble" : "fade"), mood:mood || "Normal"});
  const voice = new Set(ST.voice || []);
  let memOn = !!set0.mem, badSeen = false, sysSeen = false, inMem = false;
  lines.forEach((l, i)=>{
    if(ST.pre && ST.pre[i]) track(ST.pre[i]);
    /* une réplique réservée à une autre réponse que la tienne */
    if(l.when && typeof storyWhen === "function" && !storyWhen(l.when)) return;
    /* une question de Porygon-Z : il est déjà en scène, il attend */
    if(l.q){ if(typeof STORY_Q !== "undefined" && STORY_Q[l.q]) beats.push(storyQBeat(l.q)); return; }
    const w = l.w || "";
    /* le souvenir : la mémoire se défragmente, le lieu d'alors apparaît, au sépia */
    if(l.mem && !inMem){
      inMem = true;
      const M = ST.mem || {};
      const n = M.defrag !== undefined ? M.defrag : stDefragN(sc);
      const covered = n !== false && n !== null;
      if(covered) beats.push({t:"defrag", n:n || 0});
      else beats.push({t:"sfx", k:"wobble"}, {t:"fx", k:"flash", lv:1});
      track([Object.assign({k:"labo", v:"souvenir"}, M.set || {}, {t:"set", mem:true, cut:covered, holes:M.holes || 0})]);
      beats.push({t:"mem", on:true});
      track(M.cast);
    }
    /* le retour au présent : le souvenir se déchire, la console revient */
    if(!l.mem && inMem){
      inMem = false;
      const M = ST.mem || {};
      beats.push(...(M.exit || [{t:"fx", k:"glitch", lv:1, ms:260}]));
      beats.push({t:"mem", on:false});
      track([Object.assign({}, set0, {mem:false, cut:true, holes:0})]);
      track(ST.back);
    }
    /* les voix prennent corps sur le plateau */
    if(w === "pz" && !voice.has(i)){
      if(!on.has("pz")) track([inMem ? {t:"put", id:"pz", kind:"pz", at:(ST.mem && ST.mem.pz && ST.mem.pz.at) || "back", dir:"down", enter:"fade", mood:l.m || "Normal"} : pzPut(l.m)]);
      else if(l.m) beats.push({t:"mood", id:"pz", mood:l.m});
    }
    if(w === "past" && !has("swarm") && sc.id !== "cy_e_page") track([{t:"put", id:"self", kind:"swarm", at:inMem ? "spot" : "left", enter:"form", wait:1200}]);
    if(w === "prof" && !on.has("prof")) track([{t:"put", id:"prof", kind:"prop", prop:"prof", at:"prof", enter:"fade"}]);
    if(w === "bad"){
      /* la faille prend corps à sa première réplique */
      if(!badSeen){
        badSeen = true;
        if(!has("mn") && ST.mn !== false) track([{t:"put", id:"mn", kind:"mn", at:ST.mn || "mn", enter:"assemble"}]);
        beats.push({t:"fx", k:"glitch", lv:2, ms:600});
      } else beats.push({t:"fx", k:"rgb", lv:1, ms:380});
    }
    if(w === "sys" && !sysSeen){ sysSeen = true; beats.push({t:"fx", k:"flash", lv:1}); }
    if(l.bad) beats.push({t:"fx", k:"shake", lv:1, ms:350});
    if(ST.with && ST.with[i]) track(ST.with[i]);
    const say = {t:"say", who:(w in CINE_WHO) ? w : "", text:l.t, corrupt:w === "bad" ? 0.05 : 0, mem:!!l.mem || (memOn && !inMem && !!set0.mem)};
    if(w === "pz" && voice.has(i) && l.m) say.mood = l.m;
    if(ST.sync && ST.sync[i]){ scan(ST.sync[i]); beats.push({t:"par", beats:[say, {t:"seq", beats:ST.sync[i]}]}); }
    else beats.push(say);
    if(ST.after && ST.after[i]) track(ST.after[i]);
  });
  if(inMem) beats.push({t:"mem", on:false});
  track(ST.end);
  /* chacun s'en va ; le lieu reste, le temps du fondu de sortie */
  const left = [...on.keys()];
  if(left.length) track(left.map(id=>({t:"gone", id, how:"fade", wait:false})).concat([{t:"wait", ms:520}]));
  return {id:sc.id, title, shots:[{beats}]};
}
