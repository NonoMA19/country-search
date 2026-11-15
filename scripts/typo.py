# Passe typographique sur les textes visibles du contenu (JSON) :
# espace insécable avant : ; ! ? et %, apostrophes courbes. Les liens, identifiants et codes ne sont pas touchés.
# Usage : python3 scripts/typo.py
import json, re, glob, sys

NBSP = " "
CLES_INTACTES = {"id", "url", "lien", "source", "page", "iso2", "iso3", "zone", "type", "statut", "verifieLe", "annee", "fuseau",
                 "famille", "icone", "mesure", "mesures", "sens", "regle", "ecarteSi", "apresFiltre", "afficheSi", "villeRecherche",
                 "saufZone", "genre", "liens", "confiance", "pays", "nationalite-laquelle", "codes", "langues", "origine", "genereLe", "sources", "role", "licence_id"}

def typo(t):
    if t.startswith("http") or t.startswith("/"):
        return t
    t = re.sub(r"(?<=[A-Za-zÀ-ÿœŒ])'(?=[A-Za-zÀ-ÿœŒ])", "’", t)
    t = re.sub(r" +([:;!?%»])", NBSP + r"\1", t)
    t = re.sub(r"« +", "«" + NBSP, t)
    return t

def parcourir(x, cle=None):
    if isinstance(x, dict):
        return {k: (v if k in CLES_INTACTES and not isinstance(v, (dict, list)) else parcourir(v, k)) for k, v in x.items()}
    if isinstance(x, list):
        # Une liste d'identifiants reste intacte ; une liste d'objets (les mesures de criteres.json) est parcourue.
        if cle in CLES_INTACTES and not any(isinstance(v, dict) for v in x):
            return x
        return [parcourir(v, None if isinstance(v, dict) else cle) for v in x]
    if isinstance(x, str):
        return typo(x)
    return x

fichiers = sys.argv[1:] or ["content/criteres.json", "content/quiz.json", "content/portes.json", "content/double-nationalite.json",
                             "content/sources.json", "content/saisie/avis.json", "content/saisie/culture.json", "content/scores.json", "content/pays.json",
                             *sorted(glob.glob("content/dossiers/*.json"))]
for f in fichiers:
    brut = open(f, encoding="utf-8").read()
    indent = 1 if brut.startswith("{\n \"") or brut.startswith("[\n {") else 2
    d = json.loads(brut)
    nouveau = parcourir(d)
    if nouveau != d:
        open(f, "w", encoding="utf-8").write(json.dumps(nouveau, ensure_ascii=False, indent=indent) + "\n")
        print("modifié :", f)
