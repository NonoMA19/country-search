// La banque d'éléments du quiz : ce que chaque format enregistre, et ce que chaque réponse change au calcul.
// Un seul schéma de réponse pour tous les formats (le type Valeur de donnees.ts), ou « passer ».
// Ce fichier ne calcule aucun score : il traduit les réponses en effets, mesure par mesure (voir moteur.ts).
import {
  dimensionDe, notes, quiz, trouverElement,
  type CarteMonde, type ChoixCartes, type Curseur, type Dilemme, type EffetDilemme, type Element, type OptionCarte, type OptionDilemme, type Seuil, type TypeElement, type Valeur,
} from "./donnees";
import { lireCarte, reponseCarteValide } from "./zones";

export const PASSER = "passer";
export type Profil = Record<string, string | string[] | undefined>;
export type Certitude = "faible" | "moyenne" | "forte";
export type ReponseSwipe = "oui" | "non" | "depend";
export type ReponseLimite = "ok" | "eviter" | "redhibitoire";
// « compte » : une carte touchée (valeurs, prompt 7). « indispensable », « plus », « egal » : les anciennes zones, encore lues.
export type ReponseZone = "compte" | "indispensable" | "plus" | "egal";
export const REPONSES_SWIPE: ReponseSwipe[] = ["non", "depend", "oui"];
export const REPONSES_LIMITE: ReponseLimite[] = ["ok", "eviter", "redhibitoire"];
export const LIBELLE_SWIPE: Record<ReponseSwipe, string> = { oui: "Ça me correspond", non: "Pas vraiment", depend: "Ça dépend" };
export const LIBELLE_LIMITE: Record<ReponseLimite, string> = { ok: "Aucun problème", eviter: "Je préfère éviter", redhibitoire: "Rédhibitoire" };
export { AUCUNE_ZONE } from "./zones";

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
      // Les cartes de critères dépendent d'autres réponses : on valide contre la liste complète des critères.
      const ids = new Set(el.source ? quiz.envies.map((e) => e.id) : optionsDe(el).map((o) => o.id));
      if (el.multiple) return listeDe(v, (y) => ids.has(y)) && (el.nombre === undefined || (v as string[]).length === el.nombre) && (el.max === undefined || (v as string[]).length <= el.max);
      return estTexte(v) && (ids.has(v) || (el.aucun !== undefined && v === AUCUN));
    }
    case "timeline": return objetDe(v, new Set(["duree", "apres"]), [...el.options.map((o) => o.id), ...el.apres.map((o) => o.id)]);
    case "enveloppe": return typeof v === "number" && Number.isFinite(v) && v >= el.min && v <= el.max;
    case "seuil": {
      if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
      const r = v as Record<string, string>;
      if (r.niveau === "ok") return Object.keys(r).length === 1;
      const n = Number(r.seuil);
      return Object.keys(r).length === 2 && (r.niveau === "eviter" || r.niveau === "redhibitoire") && Number.isFinite(n) && n >= el.min && n <= el.max;
    }
    case "tri-zones": return objetDe(v, new Set(el.cartes.map((c) => c.id)), el.zones.map((z) => z.id));
    case "blind-test": return typeof v === "object" && v !== null && !Array.isArray(v) && estTexte((v as Record<string, string>).choix) && estTexte((v as Record<string, string>).faits);
    case "classement": return listeDe(v, (y) => quiz.envies.some((e) => e.id === y)) && new Set(v as string[]).size === (v as string[]).length;
    case "curseur": return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
    case "thermometre": return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= el.niveaux.length;
    case "ambiances": return listeDe(v, (y) => el.options.some((o) => o.id === y)) && (v as string[]).length <= el.max;
    case "carte-monde": return listeDe(v, () => true) && reponseCarteValide(el, v as string[]);
    case "swipe": return objetDe(v, new Set(el.phrases.map((p) => p.id)), REPONSES_SWIPE);
    case "tri-limites": return objetDe(v, new Set(el.situations.map((s) => s.id)), REPONSES_LIMITE);
    case "recherche": return estTexte(v) && /^[A-Z]{2}$/.test(v) && !(el.exclus ?? []).includes(v);
  }
}

// Les options d'une carte. Les critères viennent de quiz.envies : tous (« envies »), ceux que tu as choisis
// (« envies-choisies »), ceux qui restent pour le second plan (« envies-second »), ceux que tu n'as pas choisis (« envies-restantes »).
// Une option dont une mesure n'a aucune donnée vérifiée (l'égalité femmes-hommes, par exemple) n'est pas proposée.
// (Les mesures calculées, comme le dépaysement, et « secteur » ne sont pas stockées : elles restent proposées.)
export const AUCUN = "aucun";
const mesureStockee = (m: string) => Object.values(notes).some((n) => n[m] !== undefined);
const mesureNotee = (m: string) => Object.values(notes).some((n) => n[m]?.statut === "verifie");
const listeTexte = (x: Valeur | undefined) => (Array.isArray(x) ? x : []);
export function optionsDe(el: ChoixCartes, reponses: Record<string, Valeur> = {}): OptionCarte[] {
  const criteres = quiz.envies.map((e) => ({ id: e.id, label: e.label, icone: e.icone, emoji: e.emoji }));
  const choisis = listeTexte(reponses.envies);
  if (el.source === "envies") return criteres;
  if (el.source === "envies-choisies") return criteres.filter((c) => choisis.includes(c.id));
  if (el.source === "envies-second") return criteres.filter((c) => choisis.includes(c.id) && c.id !== reponses.sacrifice);
  if (el.source === "envies-restantes") return criteres.filter((c) => !choisis.includes(c.id));
  return el.options.filter((o) => !o.effets || o.effets.every((e) => e.mesures.every((m) => !mesureStockee(m) || mesureNotee(m))));
}

// Les réponses d'un seuil, d'une frise, d'un test à l'aveugle : des objets texte → texte.
export const objetReponse = (v: Valeur | undefined): Record<string, string> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {});

// Le test à l'aveugle : le pays choisi et les mesures montrées deviennent des positions préférées, légères (importance 0,5) :
// « tu as choisi le pays où l'hiver est doux et la vie pas chère ».
export const POIDS_BLIND = 0.5;
export function effetsBlind(v: Valeur | undefined): EffetDilemme[] {
  const r = objetReponse(v);
  if (!r.choix || !r.faits) return [];
  return r.faits.split(",").flatMap((m) => {
    const n = notes[r.choix]?.[m];
    return n?.statut === "verifie" && typeof n.note === "number" ? [{ mesures: [m], position: n.note, poids: POIDS_BLIND }] : [];
  });
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
      // Une carte de profil peut aussi avoir des effets (ta motivation) ; les critères sont lus par le moteur (enviesDe).
      if (el.source) return [];
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
    // Tes limites ne changent pas « Il te ressemble » : elles pèsent sur « Il t'est accessible » (voir accesPays, moteur.ts).
    case "tri-limites": return [];
    // Tes valeurs : une carte touchée (« Compte pour moi ») compte comme une réponse franche (1) ; une carte non touchée
    // ne compte jamais. Une carte sans mesure (pas de donnée sur 30 pays) enrichit le portrait.
    case "tri-zones": return Object.entries(v as Record<string, ReponseZone>).flatMap(([id, r]) => {
      const c = el.cartes.find((x) => x.id === id);
      if (!c || !c.mesures.length || r === "egal") return [];
      return [{ effet: { mesures: c.mesures, poids: r === "plus" ? 0.5 : 1 }, origine: `element:${el.id}/${id}` }];
    });
    case "blind-test": return avec(effetsBlind(v), `element:${el.id}`);
    default: return [];
  }
}

// Une option qui retire une pénalité (« Installé là-bas pour de bon » : apprendre la langue n'est plus une pénalité).
export function penalitesRetirees(el: Element, v: Valeur | undefined): string[] {
  if (v === undefined || v === PASSER) return [];
  if (el.type === "dilemme") return optionReponse(el, v)?.sansPenalite ?? [];
  if (el.type !== "choix-cartes" || el.source) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((id) => el.options.find((o) => o.id === id)?.sansPenalite ?? []);
}

// Le libellé d'un curseur selon sa position (« Plutôt du temps libre », « Un équilibre », « Plutôt le salaire »).
export const libelleCurseur = (el: Curseur, v: number) => el.libelles.find((l) => v <= l.jusqua)?.texte ?? el.libelles.at(-1)!.texte;

// Tes limites, toutes familles : chaque situation jugée « Je préfère éviter » ou « Rédhibitoire », et chaque seuil.
// element : l'écran où tu l'as dit (pour « revoir ») ; seuil : la valeur limite (seuils seulement).
export type LimiteDeclaree = { id: string; element: string; niveau: "eviter" | "redhibitoire"; seuil?: number; texte: string };
export const elementsLimites = () => quiz.elements.filter((e) => e.type === "tri-limites" || e.type === "seuil");
export function limitesDeclarees(reponses: Record<string, Valeur>): LimiteDeclaree[] {
  const res: LimiteDeclaree[] = [];
  for (const el of elementsLimites()) {
    const v = objetReponse(reponses[el.id]);
    if (el.type === "tri-limites") {
      for (const [id, r] of Object.entries(v)) {
        const s = el.situations.find((x) => x.id === id);
        if (s && (r === "eviter" || r === "redhibitoire")) res.push({ id, element: el.id, niveau: r, texte: s.texte });
      }
    } else if (el.type === "seuil" && (v.niveau === "eviter" || v.niveau === "redhibitoire")) {
      res.push({ id: el.id, element: el.id, niveau: v.niveau, seuil: Number(v.seuil), texte: texteSeuil(el, Number(v.seuil)) });
    }
  }
  return res;
}
export const texteSeuil = (el: Seuil, n: number) =>
  el.sens === "max" ? `Plus de ${n.toLocaleString("fr-FR")}\u00a0${el.unite}` : `Moins de ${n.toLocaleString("fr-FR")}\u00a0${el.unite}`;
// Les situations jugées « Rédhibitoire » (identifiants).
export const limitesRedhibitoires = (reponses: Record<string, Valeur>): string[] =>
  limitesDeclarees(reponses).filter((l) => l.niveau === "redhibitoire").map((l) => l.id);

// ---------- Les relances ----------
// Une relance (« Et si… », « Laquelle ? ») ne s'ouvre que si l'élément cité a reçu une des réponses prévues.
// Pour des cartes rangées dans des zones : « carte:zone » (« libertes:indispensable »).
export function relanceOuverte(el: Element, reponses: Record<string, Valeur>): boolean {
  if (!el.relanceDe) return true;
  const v = reponses[el.relanceDe.element];
  if (v === undefined || v === PASSER) return false;
  if (typeof v === "string") return el.relanceDe.reponses.includes(v);
  if (Array.isArray(v)) return v.some((x) => el.relanceDe!.reponses.includes(x));
  if (typeof v === "object") return Object.entries(v).some(([k, r]) => el.relanceDe!.reponses.includes(`${k}:${r}`) || el.relanceDe!.reponses.includes(r));
  return false;
}

// ---------- Dimensions et certitude d'une réponse ----------
const dims = (effets: EffetDilemme[]) => effets.flatMap((e) => e.mesures.map((m) => dimensionDe[m])).filter(Boolean);

// Les dimensions du profil que cette réponse renseigne (même une option « sans effet » renseigne : elle dit que ça ne compte pas).
export function dimensionsReponse(el: Element, v: Valeur | undefined): string[] {
  if (v === undefined || v === PASSER) return [];
  if (el.type === "swipe") return [...new Set(Object.entries(v as Record<string, string>).filter(([, r]) => r !== "depend").flatMap(([id]) => el.phrases.find((p) => p.id === id)?.dimensions ?? []))];
  if (el.type === "tri-limites") return [...new Set(Object.keys(v as Record<string, string>).map((id) => el.situations.find((s) => s.id === id)?.dimension ?? "").filter(Boolean))];
  if (el.type === "tri-zones") return Object.keys(objetReponse(v)).length ? el.dimensions : [];
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
    case "blind-test": return "moyenne";
    case "seuil": return "forte";
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
  // Tu veux rester plus d'un an, ou plus longtemps si tu te plais.
  if (condition === "veut-rester") return ["1-2", "plus-2", "toujours"].includes(String(p.duree)) || p.apres === "rester";
  if (condition === "partenaire-travaille") return p["couple-travail"] === "oui";
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
    const v = reponses[el.id];
    if (v === undefined || v === PASSER) continue;
    // Une relance ne compte que si l'élément cité a reçu une des réponses qui l'ouvrent.
    if (!relanceOuverte(el, reponses)) continue;
    if (el.type === "timeline") {
      const r = objetReponse(v);
      if (r.duree) p.duree = r.duree;
      if (r.apres) p.apres = r.apres;
      continue;
    }
    if (el.type === "enveloppe" && el.profil && typeof v === "number") { p[el.profil] = String(v); continue; }
    // Le pays de ton autre nationalité : un cas décrit et sourcé (irlandaise, canadienne, américaine), sinon « autre ».
    if (el.type === "recherche" && typeof v === "string") { p[el.profil] = el.correspondances[v] ?? el.defaut; p[`${el.profil}-code`] = v; continue; }
    if (el.type !== "choix-cartes" || !el.profil) continue;
    if (typeof v === "number" || (typeof v === "object" && !Array.isArray(v))) continue;
    if (!conditionRemplie(el.condition, p)) continue;
    p[el.profil] = v;
  }
  // « As-tu une autre nationalité ? » : Oui ou Non, puis le pays (une relance). Sans pays, « Oui » reste un cas non couvert.
  if (p.nationalite === "oui" && typeof p["nationalite-laquelle"] !== "string") p["nationalite-laquelle"] = "autre";
  if (p.nationalite === "non") delete p["nationalite-laquelle"];
  // Ta zone sur la carte du début : un bonus léger aux pays dont la ville de référence est dedans (voir moteur.ts et zones.ts).
  // « paysCarte » : les pays qui reçoivent ce bonus (cercles et groupes, après la règle contre le double comptage
  // avec « Proche de la France »). « regions » : les anciennes régions, gardées pour les parcours d'avant.
  const carte = reponses.carte;
  if (Array.isArray(carte)) {
    const lecture = lireCarte(trouverElement("carte") as CarteMonde | undefined, carte, Array.isArray(reponses.envies) && reponses.envies.includes("proche"));
    if (lecture.regions.length) p.regions = lecture.regions;
    if (lecture.bonus.length) p.paysCarte = lecture.bonus;
  }
  return p;
}
