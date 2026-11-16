// La banque d'éléments du quiz : ce que chaque format enregistre, et ce que chaque réponse change au calcul.
// Un seul schéma de réponse pour tous les formats (le type Valeur de donnees.ts), ou « passer ».
// Ce fichier ne calcule aucun score : il traduit les réponses en effets, mesure par mesure (voir moteur.ts).
import {
  dimensionDe, quiz, trouverElement,
  type ChoixCartes, type Curseur, type Dilemme, type EffetDilemme, type Element, type OptionDilemme, type TypeElement, type Valeur,
} from "./donnees";

export const PASSER = "passer";
export type Profil = Record<string, string | string[] | undefined>;
export type Certitude = "faible" | "moyenne" | "forte";
export type ReponseSwipe = "oui" | "non" | "depend";
export type ReponseLimite = "ok" | "eviter" | "redhibitoire";
export const REPONSES_SWIPE: ReponseSwipe[] = ["non", "depend", "oui"];
export const REPONSES_LIMITE: ReponseLimite[] = ["ok", "eviter", "redhibitoire"];
export const LIBELLE_SWIPE: Record<ReponseSwipe, string> = { oui: "Ça me correspond", non: "Pas vraiment", depend: "Ça dépend" };
export const LIBELLE_LIMITE: Record<ReponseLimite, string> = { ok: "Aucun problème", eviter: "Je préfère éviter", redhibitoire: "Rédhibitoire" };
export const AUCUNE_ZONE = "aucune";

// ---------- Réponses graduées des dilemmes ----------
// Un dilemme « en échelle » a 4 réponses : Plutôt A, Un peu A, Un peu B, Plutôt B.
// « Plutôt » : l'effet complet de l'option (importance 1, ou sa position).
// « Un peu » : la moitié (importance 0,5, ou la position à mi-chemin entre celle de l'option et le milieu de l'échelle, 3).
export const REPONSES_ECHELLE = ["a", "peu-a", "peu-b", "b"] as const;
export const LIBELLE_ECHELLE: Record<string, string> = { a: "Plutôt A", "peu-a": "Un peu A", "peu-b": "Un peu B", b: "Plutôt B" };
export const reponsesDe = (d: Dilemme): string[] => (d.echelle ? [...REPONSES_ECHELLE] : d.options.map((o) => o.id));
export const MILIEU_ECHELLE = 3;

export function optionReponse(d: Dilemme, reponse: Valeur | undefined): OptionDilemme | undefined {
  if (typeof reponse !== "string" || reponse === PASSER) return undefined;
  if (!d.echelle || !reponse.startsWith("peu-")) return d.options.find((o) => o.id === reponse);
  const o = d.options.find((x) => x.id === reponse.slice(4));
  if (!o) return undefined;
  return {
    ...o,
    id: reponse,
    effets: o.effets.map((e) => (e.position !== undefined ? { ...e, position: (e.position + MILIEU_ECHELLE) / 2 } : { ...e, poids: (e.poids ?? 1) / 2 })),
    portrait: o.portraitPeu ?? o.portrait,
    preference: o.preferencePeu ?? o.preference,
  };
}

// ---------- Validation (une session abîmée ne doit jamais faire planter le site) ----------
const estTexte = (x: unknown): x is string => typeof x === "string";
const listeDe = (x: unknown, ok: (y: string) => boolean) => Array.isArray(x) && x.every((y) => estTexte(y) && ok(y));
const objetDe = (x: unknown, cles: Set<string>, valeurs: string[]) =>
  typeof x === "object" && x !== null && !Array.isArray(x) && Object.entries(x).every(([k, v]) => cles.has(k) && estTexte(v) && valeurs.includes(v));

export function valeurValide(el: Element, v: unknown): boolean {
  if (v === PASSER) return true;
  switch (el.type) {
    case "dilemme": return estTexte(v) && reponsesDe(el).includes(v);
    case "choix-cartes": {
      const ids = new Set(optionsDe(el).map((o) => o.id));
      if (el.multiple) return listeDe(v, (y) => ids.has(y)) && (el.nombre === undefined || (v as string[]).length === el.nombre);
      return estTexte(v) && ids.has(v);
    }
    case "classement": return listeDe(v, (y) => quiz.envies.some((e) => e.id === y)) && new Set(v as string[]).size === (v as string[]).length;
    case "curseur": return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
    case "thermometre": return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= el.niveaux.length;
    case "ambiances": return listeDe(v, (y) => el.options.some((o) => o.id === y)) && (v as string[]).length <= el.max;
    case "carte-monde": return listeDe(v, (y) => y === AUCUNE_ZONE || el.zones.some((z) => z.id === y));
    case "swipe": return objetDe(v, new Set(el.phrases.map((p) => p.id)), REPONSES_SWIPE);
    case "tri-limites": return objetDe(v, new Set(el.situations.map((s) => s.id)), REPONSES_LIMITE);
  }
}

// Les options d'une carte. Les envies viennent de quiz.envies.
export function optionsDe(el: ChoixCartes) {
  if (el.source === "envies") return quiz.envies.map((e) => ({ id: e.id, label: e.label, icone: e.icone }));
  return el.options;
}

// ---------- Effets d'une réponse ----------
// Un effet porte sur des mesures, avec une importance (« poids ») ou une position préférée.
// « origine » dit quelle réponse l'a donné : dilemme:<id>, element:<id>, element:<id>/<option>, limite:<situation>.
export type EffetReponse = { effet: EffetDilemme; origine: string };

export function effetsReponse(el: Element, v: Valeur | undefined): EffetReponse[] {
  if (v === undefined || v === PASSER) return [];
  const avec = (effets: EffetDilemme[] | undefined, origine: string) => (effets ?? []).map((effet) => ({ effet, origine }));
  switch (el.type) {
    case "dilemme": return avec(optionReponse(el, v)?.effets, `dilemme:${el.id}`);
    case "choix-cartes": {
      if (el.profil || el.source) return [];
      const choisies = Array.isArray(v) ? v : [v];
      return choisies.flatMap((id) => avec(el.options.find((o) => o.id === id)?.effets, `element:${el.id}`));
    }
    case "curseur": {
      // De 0 (tout à gauche) à 100 (tout à droite) : chaque côté pèse sa part, de façon continue.
      const droite = (v as number) / 100;
      const part = (e: EffetDilemme, p: number) => ({ ...e, poids: (e.poids ?? 1) * p });
      return [
        ...el.gauche.effets.map((e) => ({ effet: part(e, 1 - droite), origine: `element:${el.id}` })),
        ...el.droite.effets.map((e) => ({ effet: part(e, droite), origine: `element:${el.id}` })),
      ].filter((x) => (x.effet.poids ?? 0) > 1e-9);
    }
    case "ambiances": return (v as string[]).flatMap((id) => avec(el.options.find((o) => o.id === id)?.effets, `element:${el.id}/${id}`));
    case "swipe": return Object.entries(v as Record<string, ReponseSwipe>).flatMap(([id, r]) => {
      const p = el.phrases.find((x) => x.id === id);
      return p && r !== "depend" ? avec(r === "oui" ? p.oui : p.non, `element:${el.id}/${id}`) : [];
    });
    case "tri-limites": return Object.entries(v as Record<string, ReponseLimite>).flatMap(([id, r]) => {
      const s = el.situations.find((x) => x.id === id);
      return s && r === "eviter" ? [{ effet: { mesures: [s.mesure], poids: 1 }, origine: `limite:${id}` }] : [];
    });
    default: return [];
  }
}

// Une option qui retire une pénalité (« Installé là-bas pour de bon » : apprendre la langue n'est plus une pénalité).
export function penalitesRetirees(el: Element, v: Valeur | undefined): string[] {
  if (el.type !== "choix-cartes" || el.profil || el.source || v === undefined || v === PASSER) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((id) => el.options.find((o) => o.id === id)?.sansPenalite ?? []);
}

// Le libellé d'un curseur selon sa position (« Plutôt du temps libre », « Un équilibre », « Plutôt le salaire »).
export const libelleCurseur = (el: Curseur, v: number) => el.libelles.find((l) => v <= l.jusqua)?.texte ?? el.libelles.at(-1)!.texte;

// Les situations jugées « Rédhibitoire ».
export function limitesRedhibitoires(reponses: Record<string, Valeur>): string[] {
  const v = reponses.limites;
  if (!v || typeof v !== "object" || Array.isArray(v)) return [];
  return Object.entries(v).filter(([, r]) => r === "redhibitoire").map(([id]) => id);
}

// ---------- Dimensions et certitude d'une réponse ----------
const dims = (effets: EffetDilemme[]) => effets.flatMap((e) => e.mesures.map((m) => dimensionDe[m])).filter(Boolean);

// Les dimensions du profil que cette réponse renseigne (même une option « sans effet » renseigne : elle dit que ça ne compte pas).
export function dimensionsReponse(el: Element, v: Valeur | undefined): string[] {
  if (v === undefined || v === PASSER) return [];
  if (el.type === "swipe") return [...new Set(Object.entries(v as Record<string, string>).filter(([, r]) => r !== "depend").flatMap(([id]) => el.phrases.find((p) => p.id === id)?.dimensions ?? []))];
  if (el.type === "tri-limites") return [...new Set(Object.keys(v as Record<string, string>).map((id) => el.situations.find((s) => s.id === id)?.dimension ?? "").filter(Boolean))];
  if (el.type === "ambiances") return [...new Set((v as string[]).flatMap((id) => dims(el.options.find((o) => o.id === id)?.effets ?? [])))];
  return el.dimensions;
}

// La certitude d'une réponse : forte quand elle est franche, faible quand elle hésite.
export function certitudeReponse(el: Element, v: Valeur | undefined): Certitude {
  if (v === undefined || v === PASSER) return "faible";
  switch (el.type) {
    case "dilemme": return typeof v === "string" && v.startsWith("peu-") ? "moyenne" : "forte";
    case "curseur": { const n = v as number; return n <= 20 || n >= 80 ? "forte" : n <= 35 || n >= 65 ? "moyenne" : "faible"; }
    case "thermometre": { const n = v as number; return n === 1 || n === el.niveaux.length ? "forte" : n === 3 ? "faible" : "moyenne"; }
    case "swipe": return "moyenne";
    case "ambiances": return (v as string[]).length === 1 ? "forte" : "moyenne";
    default: return "forte"; // une réponse déclarée : choix de cartes, classement, carte, limites
  }
}

// Ce que le moteur enregistre de chaque réponse : son format, sa valeur, les dimensions touchées, sa certitude.
export type ReponseEnregistree = { element: string; format: TypeElement; valeur: Valeur; dimensions: string[]; certitude: Certitude };
export function enregistrer(id: string, v: Valeur): ReponseEnregistree | null {
  const el = trouverElement(id);
  if (!el) return null;
  return { element: id, format: el.type, valeur: v, dimensions: dimensionsReponse(el, v), certitude: certitudeReponse(el, v) };
}

// ---------- Le profil (âge, projet, langues…) tiré des réponses ----------
// Le niveau d'anglais : la moyenne des deux thermomètres. 1 à 2 : débutant ; 3 : moyen ; 4 à 5 : courant
// (une moyenne de 2,5 compte comme 3, une moyenne de 3,5 comme 4).
export function niveauAnglais(reponses: Record<string, Valeur>): "debutant" | "moyen" | "courant" | undefined {
  const notes = ["anglais-reunion", "anglais-vie"].map((id) => reponses[id]).filter((x): x is number => typeof x === "number");
  if (!notes.length) return undefined;
  const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
  return moyenne < 2.5 ? "debutant" : moyenne < 3.5 ? "moyen" : "courant";
}

const languesDe = (p: Profil) => (Array.isArray(p.langues) ? p.langues : []);
export function conditionRemplie(condition: string | undefined, p: Profil): boolean {
  if (!condition) return true;
  if (condition === "anglais-debutant-sans-autre-langue") return p.anglais === "debutant" && languesDe(p).length === 0;
  if (condition === "autre-nationalite") return p.nationalite === "oui";
  if (condition === "peut-travailler-en-anglais") return !(p.anglais === "debutant" && p["pret-anglais"] !== "oui");
  if (condition === "secteur-choisi") return typeof p.secteur === "string" && p.secteur !== "autre";
  if (condition.startsWith("projet:")) return p.objectif === condition.slice(7);
  return true;
}

// Le profil : les cartes qui remplissent un champ (âge, projet, secteur, langues, nationalité…) et le niveau d'anglais.
// Une question dont la condition n'est plus remplie (tu as changé de réponse plus tôt) ne compte plus.
export function profilDe(reponses: Record<string, Valeur>): Profil {
  const p: Profil = {};
  const anglais = niveauAnglais(reponses);
  if (anglais) p.anglais = anglais;
  for (const el of quiz.elements) {
    if (el.type !== "choix-cartes" || !el.profil) continue;
    const v = reponses[el.id];
    if (v === undefined || v === PASSER || typeof v === "number" || (typeof v === "object" && !Array.isArray(v))) continue;
    if (!conditionRemplie(el.condition, p)) continue;
    p[el.profil] = v;
  }
  return p;
}
