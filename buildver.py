"""La version du jeu : une date lisible et une empreinte des sources.

build.py date la version au moment ou il construit (VERSION.txt, versionne
avec le reste) ; build_web.py relit cette date, y compris quand Vercel
reconstruit web/ a partir du depot. L'empreinte est calculee de la meme
facon des deux cotes, sur les sources : la version embarquee (dist/) et la
version hebergee (web/) d'un meme etat du depot portent donc la meme.

Le jeu l'affiche dans les Reglages ; la version hebergee la publie aussi dans
web/version.json, que le jeu relit pour savoir si une version plus recente
est en ligne.
"""
import hashlib, json, os

LABEL_FILE = "VERSION.txt"
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre", "novembre", "décembre"]


def stamp_label():
    """Date la version maintenant (heure de Paris) et l'ecrit dans VERSION.txt."""
    from datetime import datetime
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("Europe/Paris"))
    except Exception:
        now = datetime.now()
    day = "1er" if now.day == 1 else str(now.day)
    label = f"{day} {MOIS[now.month - 1]} {now.year}, {now.hour} h {now.minute:02d}"
    with open(LABEL_FILE, "w", encoding="utf-8") as f:
        f.write(label + "\n")
    return label


def read_label():
    try:
        with open(LABEL_FILE, encoding="utf-8") as f:
            return f.read().strip() or "version locale"
    except OSError:
        return "version locale"


def source_version(src, order, label):
    """Empreinte courte des sources (modules dans l'ordre, style, gabarit) et de la date."""
    h = hashlib.sha1(label.encode("utf-8"))
    for name in list(order) + ["style.css", "index.template.html"]:
        with open(os.path.join(src, name), "rb") as f:
            h.update(f.read())
    return h.hexdigest()[:8]


def version_js(v, label):
    return ("/* version du jeu (buildver.py) */\n"
            f"const BUILD_V = {json.dumps(v)}, BUILD_LABEL = {json.dumps(label, ensure_ascii=False)};\n")
