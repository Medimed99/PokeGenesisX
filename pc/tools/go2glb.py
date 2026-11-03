#!/usr/bin/env python3
"""Convertit un modèle Pokémon GO (paquet Unity « pmNNN_assets_all.bundle ») en glTF binaire animé.

Les paquets se trouvent dans le dépôt ChicoEevee/Pokemon-GO-AssetBundles (dossier Pokemon/).
Les modèles restent la propriété de Niantic / Nintendo / The Pokémon Company / Game Freak ;
ce jeu de fan ne les vend ni ne les revendique.

Utilisation : python3 -I go2glb.py <paquet.bundle> <sortie.glb> [<dossier des textures chromatiques> | -] [<paquet _shared>]

Ce que fait le script :
  - relit la hiérarchie du prefab normal (pas le chromatique), ses maillages skinnés,
    leurs poids, leurs matrices de liaison et leurs textures ;
  - décode les clips Mecanim (courbes « streamed » en polynômes cubiques, « dense »
    échantillonnées, « constant ») et les rééchantillonne à 30 images/s ;
  - passe du repère main gauche d'Unity au repère main droite du glTF (x inversé) ;
  - les yeux de Pokémon GO vivent dans une planche à part (_FaceTex) : les triangles des
    yeux (v > 1) deviennent une primitive à part, texturée par cette planche ;
  - renomme les clips : idle, walk, run, attack, attack2, hurt, faint, happy, land.
  - écrit à côté, si demandé, les textures du chromatique (une par matériau, même nom).
"""
import io, json, math, struct, sys, zlib
import numpy as np
import UnityPy
from UnityPy.helpers.MeshHelper import MeshHandler

FPS = 30
CLIPS = [  # nom dans le jeu ← noms possibles dans Pokémon GO (premier trouvé)
    ("idle", ["ba10_waitA01", "kw01_wait01", "ba10_waitB01"]),
    ("walk", ["fi20_walk01", "fi21_run01"]),
    ("run", ["fi21_run01", "fi20_walk01"]),
    ("attack", ["ba20_buturi01", "ba21_tokusyu01"]),
    ("attack2", ["ba21_tokusyu01", "ba20_buturi01"]),
    ("hurt", ["ba30_damageS01"]),
    ("faint", ["ba41_down01"]),
    ("happy", ["kw32_happyA01", "kw32_happyB01", "kw32_happyC01"]),
    ("land", ["ba01_landA01", "ba01_landB01"]),
]


def tt(o):
    return o.read_typetree()


def main(src, dst, shiny_dir=None, extra=()):
    env = UnityPy.load(src, *extra)  # le paquet « _shared » porte parfois le maillage, les clips, les textures
    objs = {o.path_id: o for o in env.objects}
    by_type = {}
    for o in env.objects:
        by_type.setdefault(o.type.name, []).append(o)
    T = {pid: tt(o) for pid, o in objs.items() if o.type.name in ("Transform", "GameObject", "SkinnedMeshRenderer", "Material", "Animator")}

    def go_of(tr):
        return T[tr["m_GameObject"]["m_PathID"]]

    tr_of_go = {}
    for pid, t in T.items():
        if objs[pid].type.name == "Transform":
            tr_of_go[t["m_GameObject"]["m_PathID"]] = pid

    def descendants(tp):
        out = [tp]
        for c in T[tp]["m_Children"]:
            out += descendants(c["m_PathID"])
        return out

    smrs = [o.path_id for o in by_type.get("SkinnedMeshRenderer", [])]
    mat_name = lambda pid: T[pid]["m_Name"] if pid in T else ""

    # le prefab normal : l'Animator dont les rendus n'utilisent pas de matériau « _SHINY »
    best = None
    for a in by_type.get("Animator", []):
        root_tr = tr_of_go[T[a.path_id]["m_GameObject"]["m_PathID"]]
        sub = set(descendants(root_tr))
        mine = [s for s in smrs if tr_of_go[T[s]["m_GameObject"]["m_PathID"]] in sub]
        shiny = any("SHINY" in mat_name(m["m_PathID"]).upper() for s in mine for m in T[s]["m_Materials"])
        if not mine:
            continue
        cand = (shiny, root_tr, mine)
        if best is None or (best[0] and not shiny):
            best = cand
    if best is None:
        raise SystemExit("aucun prefab animé")
    _, root_tr, my_smrs = best
    # le prefab chromatique : des matériaux « _SHINY », les mêmes maillages ; ses rendus appariés par maillage
    mesh_of = lambda smr: T[smr]["m_Mesh"]["m_PathID"]
    shiny_smrs = []
    for a in by_type.get("Animator", []):
        rt = tr_of_go[T[a.path_id]["m_GameObject"]["m_PathID"]]
        if rt == root_tr:
            continue
        sub = set(descendants(rt))
        theirs = [s for s in smrs if tr_of_go[T[s]["m_GameObject"]["m_PathID"]] in sub]
        if not any("SHINY" in mat_name(m["m_PathID"]).upper() for s in theirs for m in T[s]["m_Materials"]):
            continue
        bym = {mesh_of(s): s for s in theirs}
        if all(mesh_of(s) in bym for s in my_smrs):
            shiny_smrs = [bym[mesh_of(s)] for s in my_smrs]
            break

    # ---- nœuds
    order = descendants(root_tr)
    nidx = {tp: i for i, tp in enumerate(order)}
    paths = {}

    def walk(tp, prefix):
        paths[tp] = prefix
        for c in T[tp]["m_Children"]:
            cp = c["m_PathID"]
            nm = go_of(T[cp])["m_Name"]
            walk(cp, (prefix + "/" if prefix else "") + nm)
    walk(root_tr, "")
    hash2node = {zlib.crc32(p.encode("utf-8")) & 0xffffffff: nidx[tp] for tp, p in paths.items()}

    bin_ = bytearray()
    views, accs = [], []

    def add(arr, comp, typ, target=None, minmax=False, normalized=False):
        arr = np.ascontiguousarray(arr)
        while len(bin_) % 4:
            bin_.append(0)
        off = len(bin_)
        bin_.extend(arr.tobytes())
        v = {"buffer": 0, "byteOffset": off, "byteLength": arr.nbytes}
        if target:
            v["target"] = target
        views.append(v)
        count = arr.shape[0]
        a = {"bufferView": len(views) - 1, "componentType": comp, "count": int(count), "type": typ}
        if normalized:
            a["normalized"] = True
        if minmax:
            flat = arr.reshape(count, -1)
            a["min"] = [float(x) for x in flat.min(0)]
            a["max"] = [float(x) for x in flat.max(0)]
        accs.append(a)
        return len(accs) - 1

    nodes = []
    for tp in order:
        t = T[tp]
        p, q, s = t["m_LocalPosition"], t["m_LocalRotation"], t["m_LocalScale"]
        n = {"name": go_of(t)["m_Name"],
             "translation": [-p["x"], p["y"], p["z"]],
             "rotation": [q["x"], -q["y"], -q["z"], q["w"]],
             "scale": [s["x"], s["y"], s["z"]]}
        ch = [nidx[c["m_PathID"]] for c in t["m_Children"] if c["m_PathID"] in nidx]
        if ch:
            n["children"] = ch
        nodes.append(n)

    # ---- textures, matériaux
    images, textures, materials = [], [], []
    tex_index = {}

    img_cache = {}

    def image(pid):
        if pid not in img_cache:
            img_cache[pid] = objs[pid].read().image.convert("RGBA")
        return img_cache[pid]

    def texture(pid, im=None):
        if pid in tex_index:
            return tex_index[pid]
        im = image(pid) if im is None else im
        buf = io.BytesIO()
        im.save(buf, "PNG")
        data = np.frombuffer(buf.getvalue(), dtype=np.uint8)
        bv_off = len(bin_)
        add(data, 5121, "SCALAR")
        accs.pop()  # une image n'a pas d'accesseur, seulement sa vue
        images.append({"bufferView": len(views) - 1, "mimeType": "image/png"})
        textures.append({"source": len(images) - 1, "sampler": 0})
        tex_index[pid] = len(textures) - 1
        return tex_index[pid]

    def tex_of(mt, key):
        for k, v in mt["m_SavedProperties"]["m_TexEnvs"]:
            if k == key and v["m_Texture"]["m_PathID"] in objs:  # (une texture d'un autre paquet : on s'en passe)
                return v["m_Texture"]["m_PathID"]
        return None

    def floats(mt):
        return dict(mt["m_SavedProperties"]["m_Floats"])

    mat_cache = {}
    shiny_tex = {}  # nom du matériau du jeu → texture du chromatique

    eye_recipes = {}  # nom du matériau → (pid planche, pid peau, boîte, couleurs de peau échantillonnées)

    def material(mpid, kind, eye=None):
        key = (mpid, kind)
        if key in mat_cache:
            return mat_cache[key]
        mt = T[mpid]
        f = floats(mt)
        tpid = tex_of(mt, "_FaceTex" if kind == "eye" else "_MainTex")
        name = f"{kind}{len(materials)}"
        m = {"name": name, "pbrMetallicRoughness": {"metallicFactor": 0.0, "roughnessFactor": 0.85}}
        if tpid and kind == "eye":
            box, skin_uv = eye
            eye_recipes[name] = (tpid, tex_of(mt, "_MainTex"), box, skin_uv)
            m["pbrMetallicRoughness"]["baseColorTexture"] = {"index": texture(("eye", name), bake_eye(image(tpid), image(tex_of(mt, "_MainTex")), box, skin_uv))}
        elif tpid:
            m["pbrMetallicRoughness"]["baseColorTexture"] = {"index": texture(tpid)}
        transparent = kind == "eye" or f.get("_useTexAlpha", 0) > 0 or f.get("_Mode", 0) >= 2 or f.get("_DstBlend", 0) > 0
        if kind == "eye":
            pass  # yeux opaques : la planche est posée sur la peau
        elif transparent:
            m["alphaMode"] = "BLEND"
            m["doubleSided"] = True
        if f.get("_Cull", 2) == 0:
            m["doubleSided"] = True
        materials.append(m)
        mat_cache[key] = len(materials) - 1
        return mat_cache[key]

    # ---- maillages skinnés
    meshes, skins = [], []
    for si, s in enumerate(my_smrs):
        st = T[s]
        mesh = objs[st["m_Mesh"]["m_PathID"]].read()
        h = MeshHandler(mesh)
        h.process()
        V = np.array(h.m_Vertices, dtype=np.float32)[:, :3]
        V[:, 0] *= -1
        N = np.array(h.m_Normals, dtype=np.float32)[:, :3] if h.m_Normals else None
        if N is not None:
            N[:, 0] *= -1
            nl = np.linalg.norm(N, axis=1, keepdims=True)
            N = N / np.maximum(nl, 1e-8)
        UV = np.array(h.m_UV0, dtype=np.float32)[:, :2] if h.m_UV0 else np.zeros((len(V), 2), np.float32)
        nv = len(V)
        J = np.zeros((nv, 4), np.uint16)
        W = np.zeros((nv, 4), np.float32)
        if h.m_BoneIndices:
            ji = np.array([list(x)[:4] if hasattr(x, "__len__") else [x] for x in h.m_BoneIndices], dtype=np.int64)
            J[:, :ji.shape[1]] = ji
        if h.m_BoneWeights:
            wi = np.array([list(x)[:4] if hasattr(x, "__len__") else [x] for x in h.m_BoneWeights], dtype=np.float32)
            W[:, :wi.shape[1]] = wi
        else:
            W[:, 0] = 1.0  # un seul os par sommet : poids implicite
        ws = W.sum(1, keepdims=True)
        W = np.where(ws > 0, W / np.maximum(ws, 1e-8), np.array([1, 0, 0, 0], np.float32))
        eye_v = UV[:, 1] > 1.0
        uv_body = UV.copy()
        uv_body[:, 1] = 1.0 - uv_body[:, 1]
        # les yeux pointent dans la planche avec un décalage entier (v + 1, parfois u + 1 aussi) : on le retire
        uv_eye = UV - np.floor(UV + 1e-4)
        uv_eye[:, 1] = 1.0 - uv_eye[:, 1]
        uv_mix = np.where(eye_v[:, None], uv_eye, uv_body).astype(np.float32)

        a_pos = add(V, 5126, "VEC3", 34962, minmax=True)
        a_nrm = add(N, 5126, "VEC3", 34962) if N is not None else None
        a_uv = add(uv_mix, 5126, "VEC2", 34962)
        a_j = add(J, 5123, "VEC4", 34962)
        a_w = add(W, 5126, "VEC4", 34962)
        attrs = {"POSITION": a_pos, "TEXCOORD_0": a_uv, "JOINTS_0": a_j, "WEIGHTS_0": a_w}
        if a_nrm is not None:
            attrs["NORMAL"] = a_nrm
        prims = []
        tris = h.get_triangles()
        eye_info = None
        if eye_v.any() and (~eye_v).any():
            ev = np.where(eye_v)[0]
            bv = np.where(~eye_v)[0]
            near = []
            for i in ev:
                d = np.linalg.norm(V[bv] - V[i], axis=1)
                near += list(bv[np.argsort(d)[:3]])
            skin_uv = uv_body[np.array(near)]
            u = uv_eye[ev]
            box = (float(u[:, 0].min()), float(u[:, 1].min()), float(u[:, 0].max()), float(u[:, 1].max()))
            eye_info = (box, skin_uv)
            # UV des yeux ramenées dans la planche recadrée
            bw, bh = max(box[2] - box[0], 1e-6), max(box[3] - box[1], 1e-6)
            m0 = 0.04
            rem = uv_eye.copy()
            rem[:, 0] = m0 + (1 - 2 * m0) * (uv_eye[:, 0] - box[0]) / bw
            rem[:, 1] = m0 + (1 - 2 * m0) * (uv_eye[:, 1] - box[1]) / bh
            uv_mix[eye_v] = rem[eye_v]
            v = views[accs[a_uv]["bufferView"]]
            bin_[v["byteOffset"]:v["byteOffset"] + v["byteLength"]] = uv_mix.astype(np.float32).tobytes()
        mats = st["m_Materials"]
        for k, sub in enumerate(tris):
            if not sub:
                continue
            I = np.array(sub, dtype=np.uint32).reshape(-1, 3)[:, [0, 2, 1]]  # sens inversé avec x
            mpid = mats[min(k, len(mats) - 1)]["m_PathID"]
            is_eye = eye_v[I].any(1)
            for kind, sel in (("body", ~is_eye), ("eye", is_eye)):
                part = I[sel]
                if not len(part):
                    continue
                if kind == "eye" and (eye_info is None or not tex_of(T[mpid], "_FaceTex") or not tex_of(T[mpid], "_MainTex")):
                    kind = "body"
                mi = material(mpid, kind, eye_info if kind == "eye" else None)
                ai = add(part.reshape(-1).astype(np.uint32 if len(V) > 65535 else np.uint16), 5125 if len(V) > 65535 else 5123, "SCALAR", 34963)
                prims.append({"attributes": attrs, "indices": ai, "material": mi})
        meshes.append({"name": mesh.m_Name, "primitives": prims})

        bones = [b["m_PathID"] for b in st["m_Bones"]]
        S = np.diag([-1.0, 1, 1, 1])
        ibm = []
        for bp in mesh.m_BindPose:
            M = np.array([[getattr(bp, f"e{r}{c}") for c in range(4)] for r in range(4)])
            M = S @ M @ S
            ibm.append(M.T.reshape(-1))  # colonne d'abord
        a_ibm = add(np.array(ibm, dtype=np.float32), 5126, "MAT4")
        skins.append({"joints": [nidx[b] for b in bones], "inverseBindMatrices": a_ibm, "skeleton": 0})
        nodes[nidx[tr_of_go[st["m_GameObject"]["m_PathID"]]]].update({"mesh": len(meshes) - 1, "skin": len(skins) - 1})

    # textures du chromatique : même ordre de rendus et de matériaux
    if shiny_dir is not None and shiny_smrs:
        pairs = {}
        for s, z in zip(my_smrs, shiny_smrs):
            for m0, m1 in zip(T[s]["m_Materials"], T[z]["m_Materials"]):
                for kind, key in (("body", "_MainTex"), ("eye", "_FaceTex")):
                    if (m0["m_PathID"], kind) in mat_cache:
                        t0, t1 = tex_of(T[m0["m_PathID"]], key), tex_of(T[m1["m_PathID"]], key)
                        if t0 and t1 and t0 != t1:
                            pairs[materials[mat_cache[(m0["m_PathID"], kind)]]["name"]] = t1
        for name, tpid in pairs.items():
            image(tpid).save(f"{shiny_dir}/{name}.png")
            shiny_tex[name] = f"{name}.png"
        # yeux : même planche, peau chromatique
        for s0, z in zip(my_smrs, shiny_smrs):
            for m0, m1 in zip(T[s0]["m_Materials"], T[z]["m_Materials"]):
                if (m0["m_PathID"], "eye") not in mat_cache:
                    continue
                name = materials[mat_cache[(m0["m_PathID"], "eye")]]["name"]
                _, _, box, skin_uv = eye_recipes[name]
                e1, b1 = tex_of(T[m1["m_PathID"]], "_FaceTex"), tex_of(T[m1["m_PathID"]], "_MainTex")
                e0, b0 = eye_recipes[name][0], eye_recipes[name][1]
                if (e1, b1) != (e0, b0) and e1 and b1:
                    bake_eye(image(e1), image(b1), box, skin_uv).save(f"{shiny_dir}/{name}.png")
                    shiny_tex[name] = f"{name}.png"

    # ---- animations
    clips = {}
    for o in by_type.get("AnimationClip", []):
        t = tt(o)
        clips[t["m_Name"]] = t
    animations = []
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            parent[c] = i
    rest_pts = []
    for mesh_i, m in enumerate(meshes):
        a = accs[m["primitives"][0]["attributes"]["POSITION"]]
        rest_pts += [a["min"], a["max"]]
    rest_pts = np.array(rest_pts)
    reach = 3.0 * max(1e-3, float(np.linalg.norm(rest_pts.max(0) - rest_pts.min(0))))
    skin_joints = [set(s["joints"]) for s in skins]
    far_skins_joints = set()
    # le maillage principal (le plus d'os) ne se replie jamais, même en partie
    main_joints = max(skin_joints, key=len) if skin_joints else set()
    subtree = {}

    def fill(i):
        acc = {i}
        for c in nodes[i].get("children", []):
            acc |= fill(c)
        subtree[i] = acc
        return acc
    fill(0)
    hidden_log = []
    for game_name, cands in CLIPS:
        src_name = next((c for c in cands if c in clips), None)
        if not src_name:
            continue
        times, tracks = clip_tracks(clips[src_name], hash2node)
        if not tracks:
            continue
        # os projetés au loin (ex. les lianes de Germignon hors de l'attaque, dont Pokémon GO cache le rendu) : on les replie
        far = far_joints(nodes, parent, tracks, len(times), reach)
        if far:
            # on replie le plus haut ancêtre dont le sous-arbre ne porte que des os « lointains » ou sans maillage :
            # tout ce qui pend dessous se ramasse en un point, près du corps
            folded = set()
            for j in far:
                top = None
                k = j
                while k in parent:
                    sub = subtree[k]
                    if any(sub & (js - far_skins_joints) for js in other_joint_sets(skin_joints, far)) or sub & main_joints or k == 0 or parent.get(k) == 0:
                        break
                    top = k
                    k = parent[k]
                if top is not None and top not in folded:
                    folded.add(top)
            for top in folded:
                if not any(a in folded for a in ancestors(top, parent)):
                    tracks[(top, "scale")] = np.zeros((len(times), 3))
                    hidden_log.append((game_name, nodes[top]["name"]))
        a_time = add(times, 5126, "SCALAR", minmax=True)
        channels, samplers = [], []
        for (node, path), out in sorted(tracks.items()):
            a_out = add(out.astype(np.float32), 5126, "VEC4" if path == "rotation" else "VEC3")
            samplers.append({"input": a_time, "output": a_out, "interpolation": "LINEAR"})
            channels.append({"sampler": len(samplers) - 1, "target": {"node": node, "path": path}})
        animations.append({"name": game_name, "channels": channels, "samplers": samplers})

    gltf = {
        "asset": {"version": "2.0", "generator": "pcg go2glb"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": nodes, "meshes": meshes, "skins": skins,
        "materials": materials, "textures": textures, "images": images,
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "accessors": accs, "bufferViews": views, "animations": animations,
        "buffers": [{"byteLength": len(bin_)}],
    }
    if not images:
        for k in ("images", "textures", "samplers"):
            gltf.pop(k)
    js = json.dumps(gltf, separators=(",", ":")).encode()
    while len(js) % 4:
        js += b" "
    while len(bin_) % 4:
        bin_.append(0)
    out = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_))
    out += struct.pack("<II", len(js), 0x4E4F534A) + js
    out += struct.pack("<II", len(bin_), 0x004E4942) + bytes(bin_)
    with open(dst, "wb") as fh:
        fh.write(out)
    return {"nodes": len(nodes), "meshes": len(meshes), "anims": [a["name"] for a in animations], "shiny": shiny_tex, "hidden": hidden_log}


def ancestors(i, parent):
    out = []
    while i in parent:
        i = parent[i]
        out.append(i)
    return out


def other_joint_sets(skin_joints, far):
    """Les os des maillages qui restent visibles (aucun de leurs os n'est lointain)."""
    return [js for js in skin_joints if not (js & far)]


def quat_mat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def far_joints(nodes, parent, tracks, nf, reach):
    """Les nœuds dont la position (dans le repère du modèle) part au-delà de « reach » sur une image du clip."""
    far = set()
    order = []
    seen = set()

    def visit(i):
        if i in seen:
            return
        if i in parent:
            visit(parent[i])
        seen.add(i)
        order.append(i)
    for i in range(len(nodes)):
        visit(i)
    for f in range(0, nf, max(1, nf // 8)):
        world = {}
        for i in order:
            n = nodes[i]
            t = tracks.get((i, "translation"), None)
            r = tracks.get((i, "rotation"), None)
            s = tracks.get((i, "scale"), None)
            t = t[f] if t is not None else n["translation"]
            r = r[f] if r is not None else n["rotation"]
            s = s[f] if s is not None else n["scale"]
            M = np.eye(4)
            M[:3, :3] = quat_mat(r) * np.array(s)[None, :]
            M[:3, 3] = t
            world[i] = world[parent[i]] @ M if i in parent else M
            if i in parent and np.linalg.norm(world[i][:3, 3]) > reach:
                far.add(i)
    return far


def bake_eye(atlas, skin, box, skin_uv):
    """Recadre la planche des yeux sur la case utilisée et la pose sur la couleur de peau voisine."""
    from PIL import Image
    W, H = atlas.size
    x0, y0, x1, y1 = box
    bw, bh = (x1 - x0), (y1 - y0)
    m0 = 0.04
    # la boîte, élargie de la marge, en pixels de la planche
    X0 = x0 - bw * m0 / (1 - 2 * m0); X1 = x1 + bw * m0 / (1 - 2 * m0)
    Y0 = y0 - bh * m0 / (1 - 2 * m0); Y1 = y1 + bh * m0 / (1 - 2 * m0)
    crop = atlas.crop((int(X0 * W), int(Y0 * H), max(int(X0 * W) + 1, int(round(X1 * W))), max(int(Y0 * H) + 1, int(round(Y1 * H)))))
    sw, sh = skin.size
    px = np.array(skin)
    cols = []
    for u, v in skin_uv:
        cols.append(px[min(sh - 1, max(0, int((v % 1.0) * sh))), min(sw - 1, max(0, int((u % 1.0) * sw)))][:3])
    bg = tuple(int(c) for c in np.median(np.array(cols), axis=0)) + (255,)
    size = (max(32, crop.width), max(32, crop.height))
    out = Image.new("RGBA", size, bg)
    out.alpha_composite(crop.resize(size))
    return out.convert("RGB")


def clip_tracks(t, hash2node):
    mc = t["m_MuscleClip"]
    data = mc["m_Clip"]["data"]
    start, stop = float(mc["m_StartTime"]), float(mc["m_StopTime"])
    dur = max(stop - start, 1.0 / FPS)
    nf = max(2, int(round(dur * FPS)) + 1)
    times = np.linspace(0, dur, nf).astype(np.float32)
    ts = times + start

    # courbes « streamed » : clés (temps, 4 coefficients) par courbe
    raw = data["m_StreamedClip"]["data"]
    ns = data["m_StreamedClip"]["curveCount"]
    keys = [[] for _ in range(ns)]
    b = struct.pack("<%dI" % len(raw), *raw)
    p = 0
    while p < len(b):
        tm, n = struct.unpack_from("<fi", b, p)
        p += 8
        for _ in range(n):
            idx, c0, c1, c2, c3 = struct.unpack_from("<iffff", b, p)
            p += 20
            if math.isfinite(tm) and 0 <= idx < ns:
                keys[idx].append((tm, c0, c1, c2, c3))
    dense = data["m_DenseClip"]
    nd = dense["m_CurveCount"]
    dfc = dense["m_FrameCount"]
    darr = np.array(dense["m_SampleArray"], dtype=np.float64).reshape(max(dfc, 1), nd) if nd and dfc else None
    const = data["m_ConstantClip"]["data"]
    total = ns + nd + len(const)

    def curve(i):
        if i < ns:
            ks = keys[i]
            if not ks:
                return np.zeros(nf)
            kt = np.array([k[0] for k in ks])
            j = np.clip(np.searchsorted(kt, ts, side="right") - 1, 0, len(ks) - 1)
            C = np.array([k[1:] for k in ks])[j]
            dt = np.clip(ts - kt[j], 0, None)
            last = j == len(ks) - 1
            dt = np.where(last, 0, dt)
            return ((C[:, 0] * dt + C[:, 1]) * dt + C[:, 2]) * dt + C[:, 3]
        i -= ns
        if i < nd:
            ft = (ts - dense["m_BeginTime"]) * dense["m_SampleRate"]
            f0 = np.clip(np.floor(ft).astype(int), 0, dfc - 1)
            f1 = np.clip(f0 + 1, 0, dfc - 1)
            w = np.clip(ft - f0, 0, 1)
            return darr[f0, i] * (1 - w) + darr[f1, i] * w
        i -= nd
        return np.full(nf, const[i])

    tracks = {}
    ci = 0
    for g in t["m_ClipBindingConstant"]["genericBindings"]:
        attr = g["attribute"]
        size = 4 if attr == 2 else 3
        if g["typeID"] != 4 or attr not in (1, 2, 3, 4):
            # courbe non gérée (matériau, etc.) : on saute sa taille
            ci += 1 if g["typeID"] != 4 else size
            continue
        if ci + size > total:
            break
        vals = np.stack([curve(ci + k) for k in range(size)], 1)
        ci += size
        node = hash2node.get(g["path"] & 0xffffffff)
        if node is None:
            continue
        if attr == 1:
            out = vals.copy()
            out[:, 0] *= -1
            path = "translation"
        elif attr == 2:
            out = np.stack([vals[:, 0], -vals[:, 1], -vals[:, 2], vals[:, 3]], 1)
            out /= np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-8)
            for k in range(1, len(out)):
                if np.dot(out[k], out[k - 1]) < 0:
                    out[k] *= -1
            path = "rotation"
        elif attr == 3:
            out = vals
            path = "scale"
        else:
            out = euler_to_quat(vals)
            path = "rotation"
        tracks[(node, path)] = out.astype(np.float64)
    return times, tracks


def euler_to_quat(e):
    """Unity : degrés, ordre ZXY ; puis passage en main droite."""
    out = []
    for x, y, z in np.radians(e):
        cx, sx = math.cos(x / 2), math.sin(x / 2)
        cy, sy = math.cos(y / 2), math.sin(y / 2)
        cz, sz = math.cos(z / 2), math.sin(z / 2)
        # q = qy * qx * qz
        qw = cy * cx * cz + sy * sx * sz
        qx = cy * sx * cz + sy * cx * sz
        qy = sy * cx * cz - cy * sx * sz
        qz = cy * cx * sz - sy * sx * cz
        out.append([qx, -qy, -qz, qw])
    return np.array(out)


if __name__ == "__main__":
    a = sys.argv[1:]
    print(json.dumps(main(a[0], a[1], a[2] if len(a) > 2 and a[2] != "-" else None, a[3:])))
