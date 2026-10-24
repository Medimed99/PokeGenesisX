"""Telecharge les images que build_cardart.py attend et que le depot ne contient pas
(le dossier sprites/ n'est pas versionne ; les atlas produits, eux, le sont).

  sprites/cards/{serie}_{id}.png    faces des sprites d'epoque (deja presentes)
  sprites/cards/{serie}b_{id}.png   dos des sprites Rouge/Bleu (1996) et Cristal (1999),
                                    pour les apparences d'epoque des legendaires
  sprites/cards/art_474.png         l'illustration officielle de Porygon-Z, pour sa carte

Les dos de 2002 viennent de sprites/g3b/ (build_atlas.py les telecharge deja).
Usage : python3 fetch_cardsprites.py
"""
import os, sys, time, urllib.request

BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"
SRC = {
    "g1b": BASE + "versions/generation-i/red-blue/back/{id}.png",
    "g2b": BASE + "versions/generation-ii/crystal/back/{id}.png",
    "art": BASE + "other/official-artwork/{id}.png",
}


def get(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return True
    for k in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                data = r.read()
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, "wb").write(data)
            return True
        except Exception as e:
            err = e
            time.sleep(1 + k)
    print("  echec :", url, err)
    return False


def valid(p):
    try:
        from PIL import Image
        with Image.open(p) as im:
            im.verify()
        return True
    except Exception:
        return False


def main():
    ok = n = 0
    for series in ("g1", "g2"):
        for f in sorted(os.listdir("sprites/cards")):
            if not f.startswith(series + "_") or not f.endswith(".png"):
                continue
            # un legendaire que cette generation n'a pas dessine n'a pas de dos non plus
            if not valid("sprites/cards/" + f):
                continue
            pid = int(f[len(series) + 1:-4])
            n += 1
            ok += get(SRC[series + "b"].format(id=pid), f"sprites/cards/{series}b_{pid}.png")
    n += 1
    ok += get(SRC["art"].format(id=474), "sprites/cards/art_474.png")
    print(f"{ok} / {n} images presentes")
    return 0 if ok == n else 1


if __name__ == "__main__":
    sys.exit(main())
