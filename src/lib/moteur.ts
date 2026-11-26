// Le calcul du quiz : un simple calcul, sans IA.
// La méthode complète est expliquée sur la page /methode.
import { ECART_EX_AEQUO, MESURES_ESSENTIELLES, OBSTACLES, POIDS_ACCES, SEUIL_PAYS_CLASSEMENT } from "@/config";
import { accord, pays, type Pays } from "./pays";
import {
  avis, dateFr, dimensionDe, doubleNationalite, europe, mesures, notes, notesFrance, portes, quiz, sources, trouverElement, vie, villes, preuveMesure, preuveNote, preuveSource, preuveVisa,
  type CarteMonde, type CasDouble, type ChoixCartes, type DetailVisa, type Element, type Dilemme, type EffetDilemme, type FamilleScore, type LieEmployeur, type OptionDilemme, type PorteBrute, type Preuve, type Scene, type Timeline, type Valeur,
} from "./donnees";
import {
  LIBELLE_ECHELLE, conditionRemplie, effetsReponse, limitesDeclarees, optionReponse, penalitesRetirees, profilDe, relanceOuverte, type LimiteDeclaree, type Profil,
} from "./elements";
export { LIBELLE_ECHELLE, MILIEU_ECHELLE, REPONSES_ECHELLE, optionReponse, reponsesDe, type Profil } from "./elements";

// L'état d'un parcours. « reponses » est la seule source de vérité : le profil (âge, projet, langues…) en est tiré.
export type Etat = {
  profil: Profil; // tiré des réponses (profilDe) : ne jamais l'écrire à la main
  reponses: Record<string, Valeur>; // élément → la réponse (schéma commun, voir elements.ts), ou "passer"
  ordre: string[]; // éléments dans l'ordre où ils ont été vus
  remontes: string[]; // pays remontés à la main depuis « Moins adaptés »
  historique: string[]; // le top 3 après chaque réponse (le premier : avant la première réponse)
  graine: number; // tirée au hasard au début du parcours : scènes et éléments tirés en dépendent (stable au retour et au rechargement)
  dejaVues: string[]; // scènes vues dans tes parcours précédents (« dilemme/scène ») : on ne te les repose pas
};

// « Et si… ? » : 4 curseurs concrets. Chacun règle l'importance d'un groupe de mesures,
// de « Ne compte pas » (0) à « Compte beaucoup » (2, comme une priorité). Sans réglage : la valeur déduite de tes réponses.
export type GroupeReglage = "distance" | "climat" | "salaire" | "culture";
export type Reglages = { niveaux: Partial<Record<GroupeReglage, number>>; budget: number | null };
export const NIVEAUX = [0, 0.5, 1, 2];
export const MOTS_NIVEAUX = ["Ne compte pas", "Compte un peu", "Compte", "Compte beaucoup"];
// « defaut » : les mesures « plus c'est haut, mieux c'est » ajoutées si aucune réponse ne visait ce groupe.
// La culture au travail n'en a pas : sans réponse, on ne sait pas dans quel sens aller.
export const GROUPES: { id: GroupeReglage; nom: string; mesures: string[]; defaut: string[] }[] = [
  { id: "distance", nom: "La distance avec la France", mesures: ["vol", "decalage"], defaut: ["vol", "decalage"] },
  { id: "climat", nom: "Le climat", mesures: ["hiver", "ete", "doux"], defaut: ["doux"] },
  { id: "salaire", nom: "Le salaire face au coût de la vie", mesures: ["salaire", "prix"], defaut: ["salaire", "prix"] },
  { id: "culture", nom: "La culture au travail", mesures: ["hierarchie", "communication", "ponctualite", "decision", "pro-perso"], defaut: [] },
];

export const ETAT_VIDE: Etat = { profil: {}, reponses: {}, ordre: [], remontes: [], historique: [], graine: 0, dejaVues: [] };
export const REGLAGES_DEFAUT: Reglages = { niveaux: {}, budget: null };
export const REPONSES_STABLES = 2;

// ---------- Profil ----------
const option = (question: string, id: unknown) =>
  quiz.profil.find((q) => q.id === question)?.options.find((o) => o.id === id);

export const ageMax = (p: Profil) => option("age", p.age)?.ageMax ?? null;
// Ton budget : une tranche tirée du profil (« de 2 000 à 5 000 € »), ou une somme exacte (curseur « Et si… ? »).
export type Budget = { min: number; max: number | null };
// L'enveloppe du chapitre 1 donne une somme exacte (en euros) ; les anciennes tranches restent lues.
export function budgetProfil(p: Profil): Budget | null {
  if (typeof p.budget === "string" && /^\d+$/.test(p.budget)) return budgetExact(Number(p.budget));
  const o = option("budget", p.budget);
  return o?.min !== undefined ? { min: o.min, max: o.max ?? null } : null;
}
export const budgetExact = (n: number): Budget => ({ min: n, max: n });
export const budgetDe = (etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): Budget | null =>
  reglages.budget !== null ? budgetExact(reglages.budget) : budgetProfil(etat.profil);
export const dureeMois = (p: Profil) => (trouverElement("timeline") as Timeline | undefined)?.options.find((o) => o.id === p.duree)?.mois ?? option("duree", p.duree)?.mois ?? null;
// Tu veux rester plus d'un an, ou plus longtemps si tu te plais.
export const veutRester = (p: Profil) => conditionRemplie("veut-rester", p);

export function languesParlees(p: Profil): string[] {
  const choix = Array.isArray(p.langues) ? p.langues : [];
  return choix.flatMap((id) => option("langues", id)?.codes ?? []);
}
export const parleLangueDe = (paysId: string, p: Profil) => {
  const parlees = languesParlees(p);
  return (avis[paysId]?.langues ?? []).some((l) => parlees.includes(l));
};
// La langue que tu veux pratiquer (relance de ta motivation) : les pays où elle est officielle ou très parlée.
export function codesLangueCible(p: Profil): string[] {
  const el = trouverElement("relance-langue") as ChoixCartes | undefined;
  return el?.options.find((o) => o.id === p["langue-cible"])?.codes ?? [];
}
export const parleLangueCible = (paysId: string, p: Profil) => {
  const codes = codesLangueCible(p);
  return codes.length > 0 && (avis[paysId]?.langues ?? []).some((l) => codes.includes(l));
};

export function questionProfilVisible(id: string, p: Profil): boolean {
  return conditionRemplie(quiz.profil.find((x) => x.id === id)?.afficheSi, p);
}

// ---------- Tes critères, en trois temps ----------
// 1. Jusqu'à 5 critères. 2. Le plus dur à sacrifier : importance 2. 3. Celui qui passe au second plan : 1,1.
// Les autres : 1,5. Un seul critère choisi : 2. L'ordre rendu : le plus dur à sacrifier, les autres, le second plan.
const criteresValides = (x: Valeur | undefined) => (Array.isArray(x) ? x.filter((id) => quiz.envies.some((e) => e.id === id)) : []);
function sacrificeEtSecond(etat: Pick<Etat, "reponses">) {
  const choisies = criteresValides(etat.reponses.envies);
  const s = etat.reponses.sacrifice, d = etat.reponses["second-plan"];
  const premier = typeof s === "string" && choisies.length > 1 && choisies.includes(s) ? s : null;
  const dernier = typeof d === "string" && choisies.length > 2 && choisies.includes(d) && d !== premier ? d : null;
  return { choisies, premier, dernier };
}
export function enviesDe(etat: Pick<Etat, "reponses">): string[] {
  const { choisies, premier, dernier } = sacrificeEtSecond(etat);
  return [...(premier ? [premier] : []), ...choisies.filter((x) => x !== premier && x !== dernier), ...(dernier ? [dernier] : [])];
}
export function poidsEnvie(etat: Pick<Etat, "reponses">, id: string): number {
  const { choisies, premier, dernier } = sacrificeEtSecond(etat);
  const P = quiz.poidsCriteres;
  if (!choisies.includes(id)) return 0;
  if (choisies.length === 1) return P.seul;
  return id === premier ? P.sacrifice : id === dernier ? P.second : P.milieu;
}

// Un critère est proposé s'il a au moins une mesure notée (« Évoluer dans mon secteur » : si ton secteur l'est),
// ou s'il n'a aucune mesure (« Un logement abordable ») : il enrichit alors ton portrait sans changer ton classement.
export function envieDisponible(id: string, p: Profil): boolean {
  const en = quiz.envies.find((x) => x.id === id);
  if (!en) return false;
  if (!en.mesures.length) return true;
  return en.mesures.some((m) => { const r = mesureReelle(m, p); return !!r && mesureDisponible(r); });
}
// Un critère bouge-t-il le classement ? Oui si une de ses mesures est notée pour au moins 30 pays sur 38.
export function envieClassante(id: string, p: Profil): boolean {
  const en = quiz.envies.find((x) => x.id === id);
  return !!en && en.mesures.some((m) => { const r = mesureReelle(m, p); return !!r && mesureClassante(r); });
}
// La phrase sous un critère qui ne bouge pas le classement.
export function raisonEnviePortrait(id: string, p: Profil): string | null {
  if (!envieDisponible(id, p) || envieClassante(id, p)) return null;
  const en = quiz.envies.find((x) => x.id === id);
  if (!en?.mesures.length) return "Pas encore de donnée pays : il enrichit ton portrait.";
  return "Pas encore assez de données pays : il enrichit ton portrait, sans changer ton classement.";
}
// Pourquoi une envie est grisée (affiché sous la carte), ou null.
export function raisonEnvieIndisponible(id: string, p: Profil): string | null {
  if (id !== "secteur" || envieDisponible(id, p)) return null;
  if (typeof p.secteur !== "string" || p.secteur === "autre") return "Choisis d’abord ton secteur, au chapitre 1.";
  return "Pas encore assez de données pour ton secteur.";
}

// ---------- Notes ----------
export function noteEffective(paysId: string, mesureId: string, p: Profil): number | null {
  if (mesureId === "employeur-libre") return noteEmployeurLibre(paysId, p);
  // Les bonus : 5 si le pays est dans ta zone de la carte (cercle ou groupe, ou ancienne région), ou s'il parle une langue
  // que tu parles ; sinon rien (jamais de malus). Qui est dans ta zone : voir profilDe (elements.ts) et zones.ts.
  if (mesureId === "region-carte") {
    const z = zoneCarte(paysId);
    const dansRegion = !!z && Array.isArray(p.regions) && p.regions.includes(z);
    return dansRegion || (Array.isArray(p.paysCarte) && p.paysCarte.includes(paysId)) ? 5 : null;
  }
  if (mesureId === "langue-parlee") return parleLangueDe(paysId, p) ? 5 : null;
  if (mesureId === "langue-cible") return parleLangueCible(paysId, p) ? 5 : null;
  if (mesureId === "en-europe") { const x = pays.find((y) => y.id === paysId); return x ? (x.zone === "europe" ? 5 : 1) : null; }
  // Dépaysement : l'inverse de la proximité (temps de vol et décalage horaire), sans nouvelle donnée.
  if (mesureId === "depaysement") {
    const inv = ["vol", "decalage"].map((m) => noteEffective(paysId, m, p)).filter((n): n is number => n !== null).map((n) => 6 - n);
    return inv.length ? Math.round(inv.reduce((a, b) => a + b, 0) / inv.length) : null;
  }
  if (mesureId === "langue-travail") {
    if (avis[paysId]?.francaisAuTravail) return 5;
    return noteEffective(paysId, "anglais", p);
  }
  const n = notes[paysId]?.[mesureId];
  if (!n || n.statut !== "verifie" || n.note === null) return null;
  // Si tu parles déjà la langue du pays, le quotidien est aussi simple qu'en français, et rien n'est à apprendre.
  if ((mesureId === "langue" || mesureId === "apprendre-langue") && parleLangueDe(paysId, p)) return 5;
  return n.note;
}

// ---------- Les notes continues (prompt 6) ----------
// Les seuils d'une mesure (« bornes ») ne sont plus des marches : entre deux seuils, la note glisse en ligne droite.
// Chaque seuil vaut le milieu des deux notes qu'il sépare (1,5 ; 2,5 ; 3,5 ; 4,5) ; au-delà du dernier seuil, la pente
// continue jusqu'à 1 ou 5. Exemple : 76 285 $ de salaire, entre 72 500 (3,5) et 79 500 (4,5), donne 4,04 au lieu de 4.
// Les secteurs : même règle sur le rapport à la médiane (0,7 ; 0,9 ; 1,1 ; 1,3). Les notes sans valeur chiffrée
// (avis, culture au travail, santé) restent entières. REGLES : pour la simulation (avant / après).
export const REGLES = { continu: true, seuilPays: SEUIL_PAYS_CLASSEMENT, poidsAcces: POIDS_ACCES, essentiels: true };
export function noteContinue(paysId: string, mesureId: string): number | null {
  const n = notes[paysId]?.[mesureId];
  const d = mesures[mesureId];
  if (!n || n.statut !== "verifie" || n.note === null || typeof n.valeur !== "number") return null;
  let bornes = d?.bornes, ns = d?.notes, x = n.valeur;
  if (mesureId.startsWith("secteur-") && typeof n.mediane === "number" && n.mediane > 0) { bornes = [0.7, 0.9, 1.1, 1.3]; ns = [1, 2, 3, 4, 5]; x = n.valeur / n.mediane; }
  if (!bornes || !ns || bornes.length !== 4 || ns.length !== 5) return null;
  const y = bornes.map((_, i) => (ns[i] + ns[i + 1]) / 2);
  const pente = (i: number) => (y[i + 1] - y[i]) / (bornes[i + 1] - bornes[i]);
  let v: number;
  if (x <= bornes[0]) v = y[0] + (x - bornes[0]) * pente(0);
  else if (x >= bornes[3]) v = y[3] + (x - bornes[3]) * pente(2);
  else { const i = bornes.findIndex((b, k) => k < 3 && x >= b && x < bornes[k + 1]); v = y[i] + (x - bornes[i]) * pente(i); }
  return Math.min(5, Math.max(1, v));
}
// La note qui entre dans le calcul : la note continue quand elle existe, sinon la note entière (noteEffective).
export function noteCalcul(paysId: string, mesureId: string, p: Profil): number | null {
  const n = noteEffective(paysId, mesureId, p);
  if (n === null || !REGLES.continu) return n;
  if (mesureId === "depaysement") {
    const inv = ["vol", "decalage"].map((m) => noteCalcul(paysId, m, p)).filter((x): x is number => x !== null).map((x) => 6 - x);
    return inv.length ? inv.reduce((a, b) => a + b, 0) / inv.length : n;
  }
  if (MESURES_CALCULEES.includes(mesureId)) return n;
  if ((mesureId === "langue" || mesureId === "apprendre-langue") && parleLangueDe(paysId, p)) return n;
  return noteContinue(paysId, mesureId) ?? n;
}

const disponibilite: Record<string, number> = {};
// Pour les tests : vider la mémoire des pays couverts après avoir modifié des notes.
export const disponibiliteMemo = () => disponibilite;
export function paysCouverts(mesureId: string): number {
  if (MESURES_CALCULEES.includes(mesureId)) return pays.length;
  // Un pays compte s'il a une note : « vérifié » sans note (le VIE hors des destinations de Business France) ne compte pas.
  disponibilite[mesureId] ??= pays.filter((x) => notes[x.id]?.[mesureId]?.statut === "verifie" && notes[x.id][mesureId].note !== null).length;
  return disponibilite[mesureId];
}
export const mesureDisponible = (mesureId: string) => paysCouverts(mesureId) > 0;
// La règle des 30 pays : une mesure notée pour moins de 30 pays sur 38 ne bouge pas le classement (elle enrichit le portrait).
// Sauf les critères essentiels (salaire, coût de la vie, sécurité, langue de travail) : ils comptent toujours.
export const mesureClassante = (mesureId: string) => paysCouverts(mesureId) >= REGLES.seuilPays || (REGLES.essentiels && MESURES_ESSENTIELLES.includes(mesureId) && paysCouverts(mesureId) > 0);

// ---------- Réponses qui comptent ----------
// Un effet porte sur une seule mesure. « haut » : plus la note est haute, mieux c'est.
// « position » : la note la plus proche de la position préférée gagne.
export type EffetActif = { mesure: string; sens: "haut" | "position"; position?: number; poids: number; famille: FamilleScore; origine: string };

export const trouverDilemme = (id: string) => quiz.dilemmes.find((x) => x.id === id);
export const optionChoisie = (etat: Etat, id: string): OptionDilemme | undefined => {
  const d = trouverDilemme(id);
  return d ? optionReponse(d, etat.reponses[id]) : undefined;
};

// ---------- Hasard reproductible ----------
// Un nombre tiré de la graine du parcours et d'un texte : toujours le même pour la même graine.
export function hacher(graine: number, texte: string): number {
  let h = (graine ^ 0x811c9dc5) >>> 0;
  for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 0x01000193) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
  return h >>> 0;
}

// La scène montrée pour un dilemme : tirée au hasard (avec la graine) parmi celles que tu n'as pas vues
// dans tes parcours précédents. Le même dilemme montre toujours la même scène dans un parcours.
export const cleScene = (d: Dilemme, s: Scene) => `${d.id}/${s.id}`;
// Le texte de la scène s'adapte à ton projet quand une variante existe (« ta mission de VIE », « ton job de PVT »).
export function sceneDe(d: Dilemme, etat: Pick<Etat, "graine" | "dejaVues"> & { profil?: Profil } = ETAT_VIDE): Scene {
  const neuves = d.scenes.filter((s) => !etat.dejaVues.includes(cleScene(d, s)));
  const liste = neuves.length ? neuves : d.scenes;
  const scene = liste[hacher(etat.graine, d.id) % liste.length];
  const projet = etat.profil?.objectif;
  const variante = typeof projet === "string" ? scene.variantes?.[projet] : undefined;
  const titre = typeof projet === "string" ? scene.variantesTitre?.[projet] : undefined;
  return variante || titre ? { ...scene, texte: variante ?? scene.texte, titre: titre ?? scene.titre } : scene;
}

// Ta réponse en mots, pour le bilan du départage : « Plutôt A (3 400 € par mois, 1 500 € de loyer) ».
export function libelleReponse(d: Dilemme, valeur: Valeur, etat?: Etat): string {
  const reponse = String(valeur);
  const scene = sceneDe(d, etat);
  const i = d.options.findIndex((o) => o.id === reponse.replace(/^peu-/, ""));
  const texte = scene.options[i]?.texte ?? "";
  return d.echelle ? `${LIBELLE_ECHELLE[reponse] ?? reponse} : ${texte}` : texte;
}

// Un dilemme n'est jamais proposé si l'une de ses mesures est notée pour moins de 60 % des pays.
export const SEUIL_DILEMME = 0.6;
export const mesuresDuDilemme = (d: Dilemme) => [...new Set(d.options.flatMap((o) => o.effets.flatMap((e) => e.mesures)))];
export const dilemmeActif = (d: Dilemme) => mesuresDuDilemme(d).every((m) => paysCouverts(m) >= SEUIL_DILEMME * pays.length);

const familleDe = (m: string) => (mesures[m]?.critere.famille ?? "vivre") as FamilleScore;

// Une mesure « de profil » prend sa vraie valeur : « secteur » devient la mesure de ton secteur.
// Ton secteur : sa mesure (« secteur-finance »…), seulement si au moins 60 % des pays ont une donnée pour lui.
// Sinon il n'agit pas sur le score, et le site le dit (« Pas encore assez de données pour ton secteur »).
export const SEUIL_SECTEUR = 0.6;
export function mesureSecteur(p: Profil): string | null {
  if (typeof p.secteur !== "string" || p.secteur === "autre") return null;
  const m = `secteur-${p.secteur}`;
  return mesures[m] && mesureClassante(m) ? m : null;
}

// Pour un stage ou un VIE, le revenu qui compte est l'indemnité VIE du pays, pas le salaire moyen.
export function mesureReelle(m: string, p: Profil): string | null {
  if (m === "secteur") return mesureSecteur(p);
  if (m === "salaire" && p.objectif === "stage-vie" && mesures["indemnite-vie"]) return "indemnite-vie";
  return m;
}

export function effetsBruts(etat: Etat): EffetActif[] {
  const res: EffetActif[] = [];
  const ajouter = (mesuresVisees: string[], e: { poids?: number; position?: number }, origine: string, poidsTotal?: number) => {
    const reelles = mesuresVisees.map((m) => mesureReelle(m, etat.profil)).filter((m): m is string => !!m);
    for (const m of reelles) {
      res.push({
        mesure: m, sens: e.position !== undefined ? "position" : "haut", position: e.position,
        poids: (poidsTotal ?? e.poids ?? 1) / mesuresVisees.length, famille: familleDe(m), origine,
      });
    }
  };
  const ajouterCritere = (id: string, poids: number, origine: string) => {
    const en = quiz.envies.find((x) => x.id === id);
    if (!en || !en.mesures.length || poids <= 0) return;
    // « Proche de la France » : 2/3 pour le temps de vol, 1/3 pour le décalage horaire (champ « parts »).
    // « Un vrai hiver » : une position préférée (champ « positions »).
    const somme = en.parts ? en.parts.reduce((a, b) => a + b, 0) : en.mesures.length;
    en.mesures.forEach((m, k) => ajouter([m], { position: en.positions?.[k] }, origine, (poids * (en.parts?.[k] ?? 1)) / somme));
  };
  for (const id of enviesDe(etat)) ajouterCritere(id, poidsEnvie(etat, id), `envie:${id}`);
  // Ta carte du début compte un peu : comme une envie de rang 5 (1,1), en bonus aux pays de ta zone.
  if ((Array.isArray(etat.profil.regions) && etat.profil.regions.length) || (Array.isArray(etat.profil.paysCarte) && etat.profil.paysCarte.length)) {
    res.push({ mesure: "region-carte", sens: "haut", poids: POIDS_CARTE, famille: "vivre", origine: "carte" });
  }
  // Une langue que tu parles (en plus du français et de l'anglais) compte toujours : la « Langue du quotidien » entre
  // dans ton calcul (importance 1), pour tous les pays. Là où tu parles la langue, la note est 5 ; ailleurs, la note du pays
  // (anglais, autre langue latine, autre écriture). Prompt 7 : un simple bonus aux pays de ta langue, sans rien dire
  // des autres, ne pesait presque rien (environ 3 points) ; le Japon restait n° 1 d'un profil qui parle espagnol.
  if (languesParlees(etat.profil).length && mesureClassante("langue")) {
    res.push({ mesure: "langue", sens: "haut", poids: POIDS_LANGUE_PARLEE, famille: familleDe("langue"), origine: "langues" });
  }
  // La langue que tu veux pratiquer : le même bonus, aux pays où on la parle.
  if (codesLangueCible(etat.profil).length) {
    res.push({ mesure: "langue-cible", sens: "haut", poids: POIDS_LANGUE_PARLEE, famille: "vivre", origine: "element:relance-langue" });
  }
  const retirees = new Set<string>();
  for (const id of etat.ordre) {
    const el = trouverElement(id);
    if (!el || !relanceOuverte(el, etat.reponses)) continue;
    const v = etat.reponses[id];
    for (const { effet, origine } of effetsReponse(el, v)) ajouter(effet.mesures, effet, origine);
    for (const m of penalitesRetirees(el, v)) retirees.add(m);
  }
  res.push(...effetsObjectif(etat));
  // « Installé là-bas pour de bon » : apprendre la langue n'est plus une pénalité (sauf si tu l'as dit toi-même dans tes limites).
  return res.filter((e) => !retirees.has(e.mesure) || e.origine.startsWith("limite:") || e.origine.startsWith("envie:"));
}

// ---------- Ton projet ----------
// Chaque objectif donne des poids de départ (0,5), plus légers qu'une réponse de dilemme (1).
// Si tu as choisi, dans un dilemme, une autre option que celle qui visait cette mesure,
// ta réponse l'emporte : le poids de départ disparaît.
export const POIDS_OBJECTIF = 0.5;
const peutTravaillerEnAnglais = (p: Profil) => conditionRemplie("peut-travailler-en-anglais", p);

export function mesuresEcartees(etat: Etat): Set<string> {
  const res = new Set<string>();
  for (const id of etat.ordre) {
    const d = trouverDilemme(id);
    const choisie = optionChoisie(etat, id);
    if (!d || !choisie) continue;
    const gardees = new Set(choisie.effets.flatMap((e) => e.mesures));
    for (const o of d.options) if (o !== choisie) for (const e of o.effets) for (const m of e.mesures) if (!gardees.has(m)) res.add(m);
  }
  return res;
}

export function effetsObjectif(etat: Etat): EffetActif[] {
  const obj = typeof etat.profil.objectif === "string" ? quiz.objectifs[etat.profil.objectif] : undefined;
  if (!obj) return [];
  const ecartees = mesuresEcartees(etat);
  return obj.effets
    .filter((e) => e.afficheSi !== "peut-travailler-en-anglais" || peutTravaillerEnAnglais(etat.profil))
    .flatMap((e) => e.mesures)
    .map((m) => mesureReelle(m, etat.profil))
    .filter((m): m is string => !!m && mesureDisponible(m) && !ecartees.has(m))
    .map((m) => ({ mesure: m, sens: "haut" as const, poids: POIDS_OBJECTIF, famille: familleDe(m), origine: `objectif:${etat.profil.objectif}` }));
}

// Toutes les réponses qui comptent, regroupées mesure par mesure : si plusieurs réponses visent
// la même mesure, on garde la plus grande importance, on ne les additionne pas.
// Seules tes envies comptent plus que 1 (de 2 à 1,1 selon leur rang).
// Mémoire des calculs : un état n'est jamais modifié après sa création (on en crée toujours un nouveau).
const memoEffets = new WeakMap<Etat, EffetActif[]>();
export function effetsActifs(etat: Etat): EffetActif[] {
  const deja = memoEffets.get(etat);
  if (deja) return deja;
  const res = effetsActifsSansMemoire(etat);
  memoEffets.set(etat, res);
  return res;
}
// Le profil de calcul : tes réponses rangées par dimension (salaire, climat, langue…), puis mesure par mesure,
// avec la plus grande importance donnée par une seule réponse. Le score lit ce profil, rien d'autre.
// La couche « profil » (src/lib/profil.ts) y ajoute la source des réponses, la certitude et les contradictions.
export type ProfilCalcul = Map<string, Map<string, EffetActif>>;
const memoProfil = new WeakMap<Etat, ProfilCalcul>();
export function profilCalcul(etat: Etat): ProfilCalcul {
  const deja = memoProfil.get(etat);
  if (deja) return deja;
  const dims: ProfilCalcul = new Map();
  for (const e of effetsBruts(etat)) {
    const d = dimensionDe[e.mesure] ?? (e.mesure.startsWith("secteur-") ? "secteur" : e.mesure);
    const m = dims.get(d) ?? new Map<string, EffetActif>();
    const avant = m.get(e.mesure);
    if (!avant || e.poids > avant.poids) m.set(e.mesure, e);
    dims.set(d, m);
  }
  memoProfil.set(etat, dims);
  return dims;
}
function effetsActifsSansMemoire(etat: Etat): EffetActif[] {
  return [...profilCalcul(etat).values()].flatMap((m) => [...m.values()]);
}

// ---------- « Et si… ? » ----------
// L'importance d'un groupe déduite de tes réponses : la plus forte importance qu'une seule réponse
// donne à ce groupe (une envie : 2 à 1,1 ; un dilemme : 1 ou 0,5 ; ton projet : 0,5 ; rien : 0).
export function niveauDeduit(effets: EffetActif[], g: GroupeReglage): number {
  const groupe = GROUPES.find((x) => x.id === g)!;
  const parOrigine = new Map<string, number>();
  for (const e of effets) if (groupe.mesures.includes(e.mesure)) parOrigine.set(e.origine, (parOrigine.get(e.origine) ?? 0) + e.poids);
  return Math.max(0, ...parOrigine.values());
}
// Le cran du curseur le plus proche d'une importance.
export const cranDe = (v: number) => NIVEAUX.reduce((best, n, i) => (Math.abs(n - v) < Math.abs(NIVEAUX[best] - v) ? i : best), 0);
// Un curseur est réglable si le groupe compte déjà, ou s'il a des mesures à ajouter.
export const groupeReglable = (effets: EffetActif[], g: GroupeReglage) =>
  niveauDeduit(effets, g) > 0 || GROUPES.find((x) => x.id === g)!.defaut.some(mesureDisponible);

// Applique les curseurs : toutes les mesures du groupe sont multipliées par (niveau choisi ÷ niveau déduit),
// donc leurs importances relatives restent les mêmes. Un groupe qui ne comptait pas reçoit ses mesures par défaut.
export function effetsAjustes(etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): EffetActif[] {
  let effets = effetsActifs(etat);
  for (const g of GROUPES) {
    const choisi = reglages.niveaux[g.id];
    if (choisi === undefined) continue;
    const deduit = niveauDeduit(effets, g.id);
    if (Math.abs(choisi - deduit) < 1e-9) continue;
    if (deduit > 0) {
      effets = effets.map((e) => (g.mesures.includes(e.mesure) ? { ...e, poids: (e.poids * choisi) / deduit } : e));
    } else {
      const ajout = g.defaut.filter(mesureDisponible);
      effets = [...effets, ...ajout.map((m) => ({ mesure: m, sens: "haut" as const, poids: choisi / ajout.length, famille: familleDe(m), origine: `reglage:${g.id}` }))];
    }
  }
  return effets.filter((e) => e.poids > 1e-9);
}

// À quel point une note va dans le sens de l'effet : de 0 (pas du tout) à 1 (tout à fait).
export function accordNote(e: { sens: "haut" | "position"; position?: number }, note: number): number {
  if (e.sens === "position") return 1 - Math.abs(note - (e.position ?? 3)) / 4;
  return (note - 1) / 4;
}

// ---------- Porte d'entrée et badge ----------
export type Badge = "nationalite" | "ouverte" | "conditions" | "difficile" | "fermee";
export const LIBELLE_BADGE: Record<Badge, string> = {
  nationalite: "Porte ouverte grâce à ta nationalité",
  ouverte: "Porte ouverte",
  conditions: "Faisable avec conditions",
  difficile: "Difficile",
  fermee: "Fermé à ton âge",
};
export type Alerte = { texte: string; preuve: Preuve | null };
export type Porte = {
  badge: Badge;
  nom: string;
  type: PorteBrute["type"] | "nationalite";
  phrase: string;
  fonds: number | null;
  manque: number | null; // ce qui te manque à coup sûr (au moins), selon ta tranche de budget
  manquePossible?: number | null; // ce qui pourrait te manquer, selon ta somme exacte dans la tranche
  alertes: Alerte[];
  preuve: Preuve;
  autres: string[];
  visa: DetailVisa | null; // le visa de travail lu sur la page officielle du pays, s'il est connu
  mention: Alerte | null; // le statut du moment (saison du PVT fermée…) : ne change ni le score ni le badge
};

// Le visa de travail reste-t-il lié à l'employeur ? « à vérifier » ne dit rien.
export const LIBELLE_LIE: Record<LieEmployeur, string | null> = {
  oui: "Visa lié à ton employeur",
  partiellement: "Visa en partie lié à ton employeur",
  non: "Visa non lié à un seul employeur",
  "a-verifier": null,
};
const PHRASE_LIE: Record<LieEmployeur, string> = {
  oui: " Le visa reste lié à cet employeur.",
  partiellement: " Le visa reste en partie lié à cet employeur.",
  non: " Le visa n’est pas lié à un seul employeur.",
  "a-verifier": "",
};
export const visaTravail = (id: string) => portes(id).find((x) => x.type === "visa-travail");
// Diplôme ou expérience exigés : dit clairement, avec une phrase pour un jeune diplômé.
const alerteExperience = (d: DetailVisa | undefined): Alerte[] =>
  d?.experience ? [{ texte: `${d.experience} ${d.jeuneDiplome ?? ""}`.trim(), preuve: preuveVisa(d) }] : [];

const euros = (n: number) => `${Math.round(n / 50) * 50}`.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0€";
const preuvePorte = (b: PorteBrute) => preuveSource(b.nom, b.texte, b.statut === "verifie" ? b.source : null, b.lien, b.verifieLe);
const preuveVie = () => preuveSource(vie.nom, vie.texte, vie.source, vie.lien, vie.verifieLe);

// Le cas de double nationalité déclaré, s'il ouvre ce pays (seulement les cas décrits et sourcés).
export function casNationalite(profil: Profil): CasDouble | null {
  if (profil.nationalite !== "oui") return null;
  return doubleNationalite.cas.find((c) => c.id === profil["nationalite-laquelle"]) ?? null;
}

export function evaluerPorte(p: Pays, profil: Profil, budget: Budget | null): Porte {
  const cas = casNationalite(profil);
  if (cas?.pays === p.id && cas.acces) {
    const preuve: Preuve = { type: cas.type, titre: cas.titre, texte: cas.texte, source: cas.source, lien: cas.lien, verifieLe: cas.verifieLe, licence: cas.licence };
    return {
      badge: "nationalite", nom: `Nationalité ${cas.nationalite.toLowerCase()}`, type: "nationalite", phrase: cas.acces,
      fonds: null, manque: null, alertes: cas.genre === "piege" ? [{ texte: cas.texte, preuve }] : [], preuve, autres: [], visa: null, mention: null,
    };
  }
  const liste = portes(p.id);
  const age = ageMax(profil);
  const vieOuvert = age !== null && age <= vie.ageMaxCandidature;
  const jeunes = liste.find((x) => x.type === "visas-jeunes")?.visas ?? [];
  const veutVie = profil.objectif === "stage-vie";
  const duree = dureeMois(profil);
  const alertes: Alerte[] = [];
  const autres: string[] = [];
  if (veutVie && age !== null && !vieOuvert) {
    alertes.push({ texte: "Le VIE est fermé à ton âge : il faut avoir moins de 28 ans à la candidature.", preuve: preuveVie() });
  }

  const ue = liste.find((x) => x.type === "ue");
  if (ue) {
    // Suisse (permis L ou B, commune sous 14 jours) et Norvège (police au-delà de 3 mois) : ce qui diffère de l'Union.
    const local = europe.pays[p.id];
    if (local) alertes.push({ texte: local.texte, preuve: preuveSource("Séjour sur place", local.texte, local.source, local.lien, local.verifieLe) });
    if (veutVie && vieOuvert) autres.push("Un VIE est aussi possible si tu décroches une mission auprès d’une entreprise.");
    return { badge: "ouverte", nom: ue.nom, type: "ue", phrase: "Tu peux y vivre et y travailler sans visa.", fonds: null, manque: null, alertes, preuve: preuvePorte(ue), autres, visa: null, mention: null };
  }

  const pvt = liste.find((x) => x.type === "pvt");
  const visa = liste.find((x) => x.type === "visa-travail");
  if (pvt && pvt.ageMax !== undefined) {
    if (age !== null && age > pvt.ageMax) {
      if (visa && (visa.statut !== "verifie" || visa.detailsAVerifier)) alertes.push({ texte: "Les conditions détaillées du visa de travail ne sont pas encore vérifiées.", preuve: visa.detail ? preuveVisa(visa.detail) : preuvePorte(visa) });
      alertes.push(...alerteExperience(visa?.detail));
      return {
        badge: "fermee", nom: pvt.nom, type: "pvt",
        phrase: `Le PVT (Programme Vacances-Travail) s’arrête à ${pvt.ageMax} ans. Autre porte : le visa de travail, avec un employeur.`,
        fonds: null, manque: null, alertes, preuve: preuvePorte(pvt), autres, visa: visa?.detail ?? null, mention: null,
      };
    }
    const quand = age !== null ? "à ton âge" : `jusqu’à ${pvt.ageMax} ans`;
    const PVT = "PVT (Programme Vacances-Travail)";
    let badge: Badge = "ouverte";
    let phrase = pvt.quota ? `${PVT} ouvert ${quand} : ${pvt.quota.toLocaleString("fr-FR")} places par an (quota fixé chaque année entre les deux pays).` : `${PVT} ouvert ${quand}, sans quota.`;
    if (pvt.invitation) {
      badge = "difficile";
      phrase = `${PVT} ouvert ${quand}, mais il faut recevoir une invitation : rien n’est garanti.`;
      if (pvt.invitationSource) alertes.push({ texte: pvt.invitationTexte ?? "", preuve: preuveSource("Invitation à présenter une demande", pvt.invitationTexte ?? "", pvt.invitationSource.source, pvt.invitationSource.lien, pvt.invitationSource.verifieLe) });
    } else if (pvt.quota !== null && pvt.quota !== undefined && pvt.quota <= 500) {
      badge = "difficile";
      phrase = `${PVT} ouvert ${quand}, mais seulement ${pvt.quota} places par an.`;
    }
    const fonds = pvt.fonds?.euros ?? null;
    let manque: number | null = null;
    let manquePossible: number | null = null;
    // Avec une tranche : ce qui manque à coup sûr (le haut de la tranche ne suffit pas), ou ce qui pourrait manquer.
    if (fonds !== null && budget !== null && budget.max !== null && budget.max < fonds) {
      manque = fonds - budget.max;
      alertes.push({ texte: `Il te manquerait ${budget.min === budget.max ? "environ" : "au moins"} ${euros(manque)} : ce PVT demande ${pvt.fonds?.texte}.`, preuve: preuvePorte(pvt) });
    } else if (fonds !== null && budget !== null && budget.min < fonds) {
      manquePossible = fonds - budget.min;
      alertes.push({ texte: `Selon ta somme exacte, il pourrait te manquer jusqu’à ${euros(manquePossible)} : ce PVT demande ${pvt.fonds?.texte}.`, preuve: preuvePorte(pvt) });
    } else if ((fonds === null || budget === null) && pvt.fonds) {
      alertes.push({ texte: `Ce PVT demande ${pvt.fonds.texte}.`, preuve: preuvePorte(pvt) });
    }
    if ((duree !== null && duree > 12) || profil.objectif === "carriere") {
      alertes.push({ texte: "Le PVT dure un an maximum : pour rester plus longtemps, il faudra un autre visa.", preuve: preuvePorte(pvt) });
    }
    if (pvt.changement) alertes.push({ texte: pvt.changement.texte, preuve: preuveNote("La procédure change", pvt.changement) });
    if (visa?.securite) alertes.push({ texte: visa.securite.texte, preuve: preuveNote("Sécurité", visa.securite) });
    if (veutVie && vieOuvert) autres.push("Pour un VIE, il faut décrocher une mission auprès d’une entreprise.");
    // Saison fermée (Canada) : le badge reste celui de la porte, avec cette mention.
    const sa = pvt.saison;
    const mention = sa ? { texte: sa.texte, preuve: sa.statut === "a-verifier" ? preuveNote("Saison du PVT", sa) : preuveSource("Saison du PVT", `Phrase officielle : « ${sa.citation} » (page mise à jour le ${dateFr(sa.datePage)}).`, sa.source, sa.lien, sa.verifieLe) } : null;
    if (jeunes.length) autres.push(`Autres visas pour les jeunes : ${jeunes.map((v) => v.nom).join(", ")}. Le détail est sur la fiche du pays.`);
    return { badge, nom: pvt.nom, type: "pvt", phrase, fonds, manque, manquePossible, alertes, preuve: preuvePorte(pvt), autres, visa: visa?.detail ?? null, mention };
  }

  // Pays « visa de travail »
  const base = visa ?? ({ type: "visa-travail", nom: "Visa de travail", texte: "Conditions pas encore vérifiées.", source: null, lien: null, verifieLe: null, statut: "a-verifier" } as PorteBrute);
  let phrase = vieOuvert && vie.presence?.[p.id] ? "Il faut un employeur sur place, ou une mission en VIE (volontariat international en entreprise)." : "Il faut un employeur qui te fait venir.";
  const d = base.detail;
  if (d) phrase += PHRASE_LIE[d.lieEmployeur];
  if (base.statut !== "verifie" || base.detailsAVerifier) phrase += " Les conditions détaillées (employeur, salaire, diplôme) restent à vérifier sur le site officiel du pays.";
  // Avec le détail du visa, les conditions sont dans la carte du visa ; seule l'exigence de diplôme ou d'expérience est une alerte.
  if (d) alertes.push(...alerteExperience(d));
  else for (const c of base.conditions ?? []) alertes.push({ texte: c, preuve: preuvePorte(base) });
  if (base.jeunes) alertes.push({ texte: base.jeunes.texte, preuve: preuveNote("Visa jeunes", base.jeunes) });
  if (base.securite) alertes.push({ texte: base.securite.texte, preuve: preuveNote("Sécurité", base.securite) });
  if (jeunes.length) autres.push(`Autres visas pour les jeunes : ${jeunes.map((v) => v.nom).join(", ")}. Le détail est sur la fiche du pays.`);
  if (vieOuvert) autres.push(vie.presence?.[p.id] ? "VIE : ce pays fait partie des destinations de Business France ; il faut décrocher une mission." : "VIE : pas dans les destinations de Business France.");
  return { badge: "conditions", nom: vieOuvert ? "Visa de travail ou VIE" : base.nom, type: "visa-travail", phrase, fonds: null, manque: null, alertes, preuve: preuvePorte(base), autres, visa: d ?? null, mention: null };
}

// ---------- Fiche de faisabilité ----------
// Trois listes courtes, tirées seulement des données sourcées (âge, nationalité, budget, visas, statuts),
// et une prochaine étape avec le lien officiel. Jamais « juridiquement accessible » sans source.
export type LienEtape = { texte: string; url: string; nom: string };
export type Faisabilite = { remplies: string[]; aRemplir: string[]; aVerifier: string[]; etape: LienEtape | null };
const premiereSouphrase = (t: string) => (t.match(/^.*?[.!?](\s|$)/)?.[0] ?? t).trim();

export function faisabilite(p: Pays, profil: Profil, budget: Budget | null): Faisabilite {
  const porte = evaluerPorte(p, profil, budget);
  const f: Faisabilite = { remplies: [], aRemplir: [], aVerifier: [], etape: null };
  const age = ageMax(profil);
  const liste = portes(p.id);
  // VIE (ton projet) : la condition d'âge, confrontée à ton profil.
  if (profil.objectif === "stage-vie") {
    if (age === null) f.aVerifier.push("Ton âge n’est pas connu : le VIE se demande avant 28 ans.");
    else if (age <= vie.ageMaxCandidature) f.remplies.push("Ton âge permet le VIE (moins de 28 ans à la candidature).");
    else f.aRemplir.push("Le VIE n’est plus possible à ton âge (moins de 28 ans à la candidature).");
  }
  if (porte.type === "nationalite") {
    const cas = casNationalite(profil)!;
    f.remplies.unshift(`Ta nationalité ${cas.nationalite.toLowerCase()} suffit pour y vivre et y travailler.`);
    if (cas.genre === "piege") f.aVerifier.push(`${cas.titre.replace(/^Piège\s?:\s*/, "").replace(/^./, (c) => c.toUpperCase())}.`);
    f.etape = { texte: "Lire la page officielle", url: cas.lien, nom: cas.source };
    return f;
  }
  if (porte.type === "ue") {
    const ue = liste.find((x) => x.type === "ue")!;
    f.remplies.unshift("Ta nationalité française suffit pour y travailler sans visa.");
    const local = europe.pays[p.id];
    if (local) f.aRemplir.push(`${local.court ?? local.texte}.`);
    f.aVerifier.push("Inscription auprès des autorités locales : elle peut être demandée dans les 3 mois après l’arrivée.");
    f.etape = local
      ? { texte: "Lire les démarches sur le site officiel", url: local.lien, nom: local.etape ?? sources[local.source]?.nom ?? "Site officiel" }
      : { texte: "Lire les démarches sur le site officiel", url: ue.lien ?? europe.inscription.lien, nom: "Travailler dans un autre pays d’Europe" };
    return f;
  }
  const pvt = liste.find((x) => x.type === "pvt");
  const visa = liste.find((x) => x.type === "visa-travail");
  if (pvt && pvt.ageMax !== undefined && porte.type === "pvt" && porte.badge !== "fermee") {
    if (age === null) f.aVerifier.push(`Ton âge n’est pas connu : le PVT est ouvert jusqu’à ${pvt.ageMax} ans.`);
    else f.remplies.push(`Ton âge permet le PVT (jusqu’à ${pvt.ageMax} ans).`);
    const fonds = pvt.fonds?.euros ?? null;
    if (fonds !== null && budget !== null && budget.min >= fonds) f.remplies.push(`Ton budget couvre les ressources demandées (${euros(fonds)}).`);
    else if (porte.manque !== null) f.aRemplir.push(`Il te manquerait ${budget?.min === budget?.max ? "environ" : "au moins"} ${euros(porte.manque)} (ressources demandées\u00a0: ${pvt.fonds?.texte}).`);
    else if (porte.manquePossible) f.aVerifier.push(`Selon ta somme exacte, il pourrait te manquer jusqu’à ${euros(porte.manquePossible)} (ressources demandées\u00a0: ${pvt.fonds?.texte}).`);
    else if (pvt.fonds && pvt.fondsAVerifier) f.aVerifier.push(`Ressources demandées\u00a0: ${pvt.fonds.texte}.`);
    else if (pvt.fonds) f.aRemplir.push(`Prévoir les ressources demandées\u00a0: ${pvt.fonds.texte}.`);
    if (pvt.changement) f.aVerifier.push(pvt.changement.texte);
    if (pvt.invitation) f.aRemplir.push("Recevoir une invitation : rien n’est garanti.");
    else if (pvt.quota !== null && pvt.quota !== undefined && pvt.quota <= 500) f.aRemplir.push(`Obtenir une des ${pvt.quota} places de l’année.`);
    if ((dureeMois(profil) ?? 0) > 12 || profil.objectif === "carriere") f.aRemplir.push("Prévoir un autre visa pour rester plus d’un an.");
    if (porte.mention) f.aVerifier.push(porte.mention.texte);
    f.etape = pvt.invitation && pvt.saison
      ? { texte: "Créer ton profil sur le site officiel", url: pvt.saison.lien, nom: "Expérience internationale Canada : devenir candidat" }
      : { texte: "Lire les conditions du PVT sur le site officiel", url: pvt.lien ?? "", nom: "Programme Vacances-Travail (France Diplomatie)" };
    return f;
  }
  // Visa de travail (ou PVT fermé à ton âge).
  if (porte.badge === "fermee" && pvt?.ageMax !== undefined) f.aRemplir.push(`Ton âge dépasse la limite du PVT (${pvt.ageMax} ans) : il faut un visa de travail.`);
  const d = visa?.detail;
  if (d) {
    if (d.employeurRequis) f.aRemplir.push("Trouver un employeur : le visa demande une offre d’emploi.");
    if (d.experience) {
      f.aRemplir.push(premiereSouphrase(d.experience));
      f.aVerifier.push("Ton expérience pro n’est pas connue du site.");
    }
    if (d.lieEmployeur === "a-verifier") f.aVerifier.push("Le lien du visa avec ton employeur reste à vérifier.");
    if (d.statut !== "verifie") f.aVerifier.push("Les conditions détaillées du visa restent à vérifier sur le site officiel.");
    if (d.liens[0]) f.etape = { texte: "Lire les conditions du visa sur le site officiel", url: d.liens[0].url, nom: d.liens[0].libelle };
  } else {
    f.aRemplir.push("Trouver un employeur qui te fait venir.");
    if (!visa || visa.statut !== "verifie" || visa.detailsAVerifier) f.aVerifier.push("Les conditions détaillées du visa restent à vérifier sur le site officiel.");
    if (visa?.lien) f.etape = { texte: "Lire la page officielle sur le visa", url: visa.lien, nom: visa.statut === "verifie" ? sources[visa.source ?? ""]?.nom ?? visa.nom : visa.nom };
  }
  return f;
}

// Le visa en version simple : son nom, la page officielle et 3 points courts au plus.
export type VisaSimple = { nom: string; lien: { url: string; nom: string } | null; points: string[] };
export function visaSimple(p: Pays, profil: Profil): VisaSimple | null {
  const porte = evaluerPorte(p, profil, null);
  const liste = portes(p.id);
  if (porte.type === "nationalite") {
    const cas = casNationalite(profil)!;
    return { nom: porte.nom, lien: { url: cas.lien, nom: cas.source }, points: ["Sans visa ni permis de travail"] };
  }
  if (porte.type === "ue") {
    const ue = liste.find((x) => x.type === "ue")!;
    return {
      nom: ue.nom, lien: ue.lien ? { url: ue.lien, nom: "Travailler dans un autre pays d’Europe" } : null,
      points: ["Pas de visa ni de permis de travail", europe.pays[p.id]?.court ?? "Inscription sur place possible"],
    };
  }
  const pvt = liste.find((x) => x.type === "pvt");
  if (pvt && porte.type === "pvt" && porte.badge !== "fermee") {
    const points = [`Jusqu’à ${pvt.ageMax} ans`, pvt.invitation ? "Sur invitation" : pvt.quota ? `${pvt.quota.toLocaleString("fr-FR")} places par an` : "Sans quota", "Un an au plus"];
    return { nom: pvt.nom, lien: pvt.lien ? { url: pvt.lien, nom: "Programme Vacances-Travail (France Diplomatie)" } : null, points };
  }
  const visa = liste.find((x) => x.type === "visa-travail");
  const d = visa?.detail;
  if (d) {
    const lie = LIBELLE_LIE[d.lieEmployeur];
    const points = [d.employeurRequis ? "Employeur obligatoire" : "", lie ?? "", d.experience ? "Diplôme ou expérience exigés" : ""].filter(Boolean).slice(0, 3);
    return { nom: d.nom, lien: d.liens[0] ? { url: d.liens[0].url, nom: d.liens[0].libelle } : null, points };
  }
  return { nom: visa?.nom ?? "Visa de travail", lien: visa?.lien ? { url: visa.lien, nom: "Entrée et séjour (France Diplomatie)" } : null, points: ["Employeur obligatoire", "Conditions à vérifier"] };
}

// ---------- Changer d'employeur librement (D18) : une pénalité, plus un filtre ----------
// La note dit si ton visa te laisserait changer d'employeur : 5 si aucun visa ne te lie à un employeur
// (Europe sans visa, PVT ouvert à ton âge, ta nationalité) ou si le visa de travail n'est pas lié ;
// 3 s'il l'est en partie ; 1 s'il l'est, ou si ce lien n'est pas encore vérifié (un employeur reste exigé).
// Les mesures calculées : toujours disponibles pour tous les pays (leur note se calcule, elle n'est pas lue dans scores.json).
export const MESURES_CALCULEES = ["employeur-libre", "depaysement", "en-europe", "langue-travail", "region-carte", "langue-parlee", "langue-cible"];
// Les bonus : un pays hors de ta carte ou qui ne parle pas tes langues n'a pas de note, et n'en est pas pénalisé.
// Ils ne comptent ni dans la couverture (règle des 60 %) ni dans le badge « données disponibles ».
export const MESURES_BONUS = ["region-carte", "langue-parlee", "langue-cible"];
export const POIDS_CARTE = quiz.poidsCriteres.second;
export const POIDS_LANGUE_PARLEE = 1;
export const zoneCarte = (paysId: string) => (trouverElement("carte") as CarteMonde | undefined)?.zones.find((z) => z.pays.includes(paysId))?.id ?? null;
const cacheLibre = new Map<string, number>();
export function noteEmployeurLibre(paysId: string, profil: Profil): number | null {
  const p = pays.find((x) => x.id === paysId);
  if (!p) return null;
  const cle = `${paysId}|${profil.age ?? ""}|${profil.nationalite ?? ""}|${profil["nationalite-laquelle"] ?? ""}`;
  const deja = cacheLibre.get(cle);
  if (deja !== undefined) return deja;
  const porte = evaluerPorte(p, profil, null);
  let n = 1;
  if (porte.type === "nationalite" || porte.type === "ue" || (porte.type === "pvt" && porte.badge !== "fermee")) n = 5;
  else {
    const lie = visaTravail(paysId)?.detail?.lieEmployeur;
    n = lie === "non" ? 5 : lie === "partiellement" ? 3 : 1;
  }
  cacheLibre.set(cle, n);
  return n;
}

// La preuve d'une mesure. « Changer d'employeur » vient de la porte d'entrée (et du visa de travail s'il est lu).
export function preuveDe(paysId: string, mesureId: string, profil: Profil): Preuve {
  // Le dépaysement se lit sur la distance : on montre la preuve du temps de vol (et le décalage dans le texte).
  if (mesureId === "depaysement") {
    const vol = preuveMesure(paysId, "vol"), dec = notes[paysId]?.decalage;
    return { ...vol, titre: "Dépaysement", texte: `${vol.texte}${dec?.texte ? ` ${dec.texte}` : ""} Le dépaysement est l’inverse de cette proximité.` };
  }
  // Les bonus et « En Europe » viennent de la liste des pays et de tes réponses ; le travail en anglais, de la note d'anglais.
  if (mesureId === "region-carte" || mesureId === "en-europe") {
    const m = mesures[mesureId], p = pays.find((x) => x.id === paysId);
    const z = (trouverElement("carte") as CarteMonde | undefined)?.zones.find((x) => x.id === zoneCarte(paysId));
    const ville = villes[paysId]?.nom;
    const texte = mesureId === "en-europe" ? (p?.zone === "europe" ? "Ce pays est en Europe." : "Ce pays est hors d’Europe.")
      : Array.isArray(profil.paysCarte) && profil.paysCarte.includes(paysId) ? `La ville de référence de ce pays${ville ? ` (${ville})` : ""} est dans ta zone de la carte du début.`
      : `Ce pays est dans la région « ${z?.label ?? ""} », que tu as cochée sur la carte du début.`;
    return { ...preuveSource(m?.nom ?? mesureId, texte, m?.critere.sources[0] ?? null, null, null), type: "donnee-ouverte" };
  }
  if (mesureId === "langue-parlee") {
    const a = preuveMesure(paysId, "langue");
    return { ...a, titre: mesures[mesureId]?.nom ?? mesureId, texte: `Tu as dit parler une langue officielle ou très parlée dans ce pays. ${a.texte}`.trim() };
  }
  if (mesureId === "langue-travail") {
    if (avis[paysId]?.francaisAuTravail) return { ...preuveMesure(paysId, "langue"), titre: mesures[mesureId]?.nom ?? mesureId };
    return { ...preuveMesure(paysId, "anglais"), titre: mesures[mesureId]?.nom ?? mesureId };
  }
  if (mesureId !== "employeur-libre") return preuveMesure(paysId, mesureId);
  const p = pays.find((x) => x.id === paysId)!;
  const porte = evaluerPorte(p, profil, null);
  const visa = porte.type === "visa-travail" || porte.badge === "fermee" ? visaTravail(paysId)?.detail : undefined;
  return visa ? preuveVisa(visa) : porte.preuve;
}

// Toutes les raisons qui font descendre un pays dans « Moins adaptés pour toi », dans l'ordre.
// « age » : une règle légale (le PVT fermé à ton âge). Les autres sont tes préférences.
// « age » : une règle légale (ton projet de PVT, fermé à ton âge dans ce pays). C'est la seule chose qui sorte un pays
// du classement : tes limites et tes préférences pèsent sur « Il t'est accessible », jamais ne retirent un pays.
export type CauseEcart = { cause: "age"; raison: string };

// Une de tes limites touche-t-elle ce pays ? Une donnée manquante ne touche jamais un pays (on ne sait pas).
// seuil : la valeur réglée pour un seuil (« plus de 12 h de vol »).
export function limiteTouche(situation: string, paysId: string, profil: Profil, seuil?: number): boolean {
  const note = (m: string) => noteEffective(paysId, m, profil);
  const valeur = (m: string) => { const n = notes[paysId]?.[m]; return n?.statut === "verifie" && typeof n.valeur === "number" ? n.valeur : null; };
  const p = pays.find((x) => x.id === paysId);
  const sansVisa = () => { const t = p ? evaluerPorte(p, profil, null).type : null; return t === "ue" || t === "nationalite"; };
  switch (situation) {
    case "hors-europe": return p?.zone !== "europe";
    case "alphabet": return note("apprendre-langue") === 1;
    case "visa-employeur": return note("employeur-libre") === 1;
    case "vol-10h": { const v = valeur("vol"); return v !== null && v > 10; }
    case "seuil-vol": { const v = valeur("vol"); return v !== null && seuil !== undefined && v > seuil; }
    case "hiver-froid": return note("hiver") === 1;
    case "seuil-froid": { const v = valeur("hiver"); return v !== null && seuil !== undefined && v < seuil; }
    case "chaleur": { const v = valeur("ete"); return v !== null && v >= 29; }
    case "heures-longues": { const v = valeur("heures"); return v !== null && v > 44; }
    case "un-an-max": case "partenaire-visa": return !!p && !sansVisa();
    case "vigilance": return note("securite") === 1;
    case "ni-fr-ni-en": { const n = note("langue-travail"); return n !== null && n <= 2; }
    case "assurance-privee": { const n = note("sante"); return n !== null && n <= 2; }
    default: return false;
  }
}
// La situation (texte, mesure) d'une limite, dans n'importe quelle famille.
export const situationDe = (id: string) =>
  quiz.elements.flatMap((e) => (e.type === "tri-limites" ? e.situations : [])).find((s) => s.id === id);
// Une limite est-elle posable à ce profil (« Que ton ou ta partenaire doive demander son propre visa » : seulement à deux) ?
export const situationPosable = (id: string, profil: Profil) => conditionRemplie(situationDe(id)?.condition, profil);

// Ton projet est un PVT, et le PVT de ce pays est fermé à ton âge : impossible par la loi pour ce projet.
export function impossibiliteLegale(p: Pays, profil: Profil): string | null {
  const porte = evaluerPorte(p, profil, null);
  if (porte.badge !== "fermee" || profil.objectif !== "aventure") return null;
  return `Fermé à ton âge pour un PVT. ${porte.phrase}`;
}
export function causesEcart(p: Pays, etat: Etat): CauseEcart[] {
  const r = impossibiliteLegale(p, etat.profil);
  return r ? [{ cause: "age", raison: r }] : [];
}
export function raisonsEcart(etat: Etat): Record<string, string> {
  const res: Record<string, string> = {};
  for (const p of pays) {
    const c = causesEcart(p, etat)[0];
    if (c) res[p.id] = c.raison;
  }
  return res;
}

// ---------- « Il t'est accessible » ----------
// De 0 à 100 : 100 moins chaque obstacle (la porte d'entrée, le budget, la durée, ta famille, la langue de travail,
// tes limites). Les montants sont dans src/config.ts (OBSTACLES) et sur /methode. Tes valeurs comptent dans « Il te ressemble ».
// Un pays remonté à la main ne subit plus tes limites ni ta langue de travail.
export type TypeObstacle = "porte" | "budget" | "duree" | "famille" | "langue" | "limite" | "valeur";
export type Obstacle = { type: TypeObstacle; texte: string; points: number; niveau?: "eviter" | "redhibitoire"; limite?: string; element?: string };
// « aVerifier » : ce qui reste à vérifier pour toi, sans effet sur le score (les droits de ta famille selon le visa).
export type Acces = { acces: number; obstacles: Obstacle[]; aVerifier: string[] };
export const facteurAcces = (acces: number) => 1 - (REGLES.poidsAcces * (100 - acces)) / 100;
export const LIBELLE_ACCES = (a: number) => (a >= 90 ? "Accès facile" : a >= 70 ? "Accès possible" : a >= 50 ? "Accès difficile" : "Accès très difficile");

export function accesPays(p: Pays, etat: Etat, porte: Porte, limites: LimiteDeclaree[] = limitesDeclarees(etat.reponses)): Acces {
  const o: Obstacle[] = [];
  const profil = etat.profil;
  const remonte = etat.remontes.includes(p.id);
  // La porte d'entrée.
  if (porte.type === "pvt" && porte.badge === "difficile") o.push({ type: "porte", texte: porte.phrase, points: OBSTACLES.pvtDifficile });
  else if (porte.type === "pvt" && porte.badge !== "fermee") o.push({ type: "porte", texte: "Un PVT à demander avant de partir.", points: OBSTACLES.pvt });
  else if (porte.badge === "fermee") o.push({ type: "porte", texte: "Le PVT est fermé à ton âge : il faut un visa de travail.", points: OBSTACLES.pvtFerme });
  else if (porte.type === "visa-travail") o.push({ type: "porte", texte: "Il faut un visa de travail, en général avec un employeur.", points: OBSTACLES.visa });
  // Le budget, pour un PVT qui demande des ressources.
  if (porte.manque) o.push({ type: "budget", texte: `Il te manquerait au moins ${euros(porte.manque)} pour les ressources demandées.`, points: OBSTACLES.manque });
  else if (porte.manquePossible) o.push({ type: "budget", texte: `Il pourrait te manquer jusqu’à ${euros(porte.manquePossible)} pour les ressources demandées.`, points: OBSTACLES.manquePossible });
  // Rester plus d'un an quand la seule porte est un PVT.
  if (porte.type === "pvt" && porte.badge !== "fermee" && veutRester(profil)) o.push({ type: "duree", texte: "Le PVT dure un an : pour rester plus longtemps, il faudra un autre visa.", points: OBSTACLES.duree });
  // À deux ou en famille, hors libre circulation : les droits de ta famille selon le visa restent à vérifier.
  // Sans source visa par visa, rien n'est retiré à « Il t'est accessible » (prompt 7) : c'est dit, pas compté.
  const aVerifier: string[] = [];
  if ((profil["couple-travail"] === "oui" || profil.compagnie === "famille") && porte.type !== "ue" && porte.type !== "nationalite") {
    aVerifier.push(profil.compagnie === "famille" ? "Droits de ta famille selon le visa : à vérifier." : "Droit au travail de ton ou ta partenaire selon le visa : à vérifier.");
  }
  if (!remonte) {
    if (profil["pret-anglais"] === "non" && !avis[p.id]?.francaisAuTravail) o.push({ type: "langue", texte: "Tu veux travailler en français : ici, la plupart des postes demandent une autre langue.", points: OBSTACLES.francais });
    for (const l of limites) {
      if (!situationPosable(l.id, profil) && l.seuil === undefined) continue;
      if (!limiteTouche(l.id, p.id, profil, l.seuil)) continue;
      o.push({ type: "limite", texte: `${l.niveau === "redhibitoire" ? "Rédhibitoire pour toi" : "Tu préfères éviter"} : ${l.texte.charAt(0).toLowerCase()}${l.texte.slice(1)}.`, points: OBSTACLES[l.niveau], niveau: l.niveau, limite: l.id, element: l.element });
    }
  }
  const total = o.reduce((t, x) => t + x.points, 0);
  return { acces: Math.max(0, 100 - total), obstacles: o, aVerifier };
}

// Les pénalités (pas des filtres) : un pays remonté à la main ne les subit plus.
export const PENALITES = ["apprendre-langue", "employeur-libre", "en-europe", "langue-travail"];

// ---------- Score ----------
export type Detail = {
  mesure: string; sens: "haut" | "position"; position?: number; poids: number; accord: number; famille: FamilleScore; origine: string;
  neutre: boolean; // donnée manquante sur une envie : comptée à 50 %
};
export type Ligne = {
  pays: Pays;
  score: number; // le score du classement : « Il te ressemble » × le facteur de « Il t'est accessible »
  ressemble: number; // « Il te ressemble » : tes goûts face aux données du pays (0 à 100)
  acces: number; // « Il t'est accessible » : 100 moins chaque obstacle (0 à 100)
  obstacles: Obstacle[];
  accesAVerifier: string[]; // ce qui reste à vérifier sur l'accès, sans effet sur le score (droits de la famille)
  sansDonnees: boolean; // aucune donnée vérifiée sur tes critères : pas de pourcentage
  details: Detail[];
  manquantes: string[]; // données « à vérifier » sur tes critères (hors envies)
  neutres: string[]; // données « à vérifier » sur tes envies, comptées à 50 %
  ecart: string | null;
  porte: Porte;
  couverture: number; // part de tes critères (en nombre) pour lesquels ce pays a une donnée vérifiée
  peuDeDonnees: boolean; // vrai aussi quand une donnée manque sur une de tes 3 premières envies : jamais dans le top 3
  manquePrincipal: string[]; // les mesures « à vérifier » sur tes 3 premières envies (libellés courts), ou []
  fiabilite: Fiabilite;
};

// ---------- Données disponibles ----------
// Une seule règle, partout (badge, règle des 60 %, fiche pays) : une mesure compte si elle a une valeur,
// quel que soit son niveau de preuve (Officiel, Donnée ouverte, Témoignages ou Notre avis). « À vérifier » ne compte jamais.
// Le détail montre la part de chaque niveau de preuve.
export type NiveauFiabilite = "complete" | "partielle" | "faible";
export type NiveauPreuve = "officiel" | "donnee-ouverte" | "temoignages" | "notre-avis";
export type Fiabilite = { disponibles: number; total: number; niveau: NiveauFiabilite; parNiveau: Record<NiveauPreuve, number> };
export const NIVEAUX_PREUVE: NiveauPreuve[] = ["officiel", "donnee-ouverte", "temoignages", "notre-avis"];
export const LIBELLE_FIABILITE: Record<NiveauFiabilite, string> = {
  complete: "Données disponibles : complètes",
  partielle: "Données disponibles : partielles",
  faible: "Peu de données disponibles",
};
// Le niveau de preuve d'une mesure qui a une valeur (une mesure calculée prend celui de son critère).
export function niveauPreuve(paysId: string, m: string, profil: Profil): NiveauPreuve {
  const t = preuveDe(paysId, m, profil).type;
  if (t !== "a-verifier") return t;
  return mesures[m]?.critere.type ?? "notre-avis";
}
export function fiabiliteDe(paysId: string, criteres: string[], profil: Profil): Fiabilite {
  const parNiveau: Record<NiveauPreuve, number> = { officiel: 0, "donnee-ouverte": 0, temoignages: 0, "notre-avis": 0 };
  const liste = criteres.filter((m) => !MESURES_BONUS.includes(m));
  let disponibles = 0;
  for (const m of liste) {
    if (noteEffective(paysId, m, profil) === null) continue;
    disponibles++;
    parNiveau[niveauPreuve(paysId, m, profil)]++;
  }
  const part = liste.length ? disponibles / liste.length : 1;
  return { disponibles, total: liste.length, niveau: part >= 0.9 ? "complete" : part >= COUVERTURE_MIN ? "partielle" : "faible", parNiveau };
}

// La complétude des données d'un pays, toutes mesures du site comprises (hors mesures internes et secteurs) :
// la part qui a une valeur. Affichée sous chaque pays recommandé, indépendamment de tes réponses.
export const MESURES_COMPLETUDE = Object.keys(mesures).filter((m) => !mesures[m].interne && !m.startsWith("secteur-") && m !== "indemnite-vie" && mesureDisponible(m));
export function completudePays(paysId: string): { disponibles: number; total: number; part: number } {
  const disponibles = MESURES_COMPLETUDE.filter((m) => noteEffective(paysId, m, {}) !== null).length;
  return { disponibles, total: MESURES_COMPLETUDE.length, part: MESURES_COMPLETUDE.length ? disponibles / MESURES_COMPLETUDE.length : 1 };
}
// Ce que la règle des 3 premières envies change : le top 3 qu'on aurait sans elle (même calcul, seule la règle est levée).
export const topSansRegle = (lignes: Ligne[], n = 3) =>
  lignes.filter((l) => !l.ecart && l.couverture >= COUVERTURE_MIN && !l.sansDonnees).sort((a, b) => b.score - a.score || a.pays.nom.localeCompare(b.pays.nom, "fr")).slice(0, n);

// En dessous de cette part de critères notés, un pays ne peut pas entrer dans le top 3.
export const COUVERTURE_MIN = 0.6;
// Une donnée manquante sur une envie compte comme une note neutre.
export const ACCORD_NEUTRE = 0.5;

const estPriorite = (e: EffetActif) => e.origine.startsWith("envie:");
export const NB_ENVIES_PRINCIPALES = 3;
// Les mesures de tes 3 premières envies (leur vraie mesure : l'indemnité VIE pour un VIE, la mesure de ton secteur…).
export function mesuresPrincipales(etat: Etat): string[] {
  return [...new Set(enviesDe(etat).slice(0, NB_ENVIES_PRINCIPALES).flatMap((id) => quiz.envies.find((x) => x.id === id)?.mesures ?? [])
    .map((m) => mesureReelle(m, etat.profil)).filter((m): m is string => !!m && mesureClassante(m) && !MESURES_BONUS.includes(m)))];
}
// « Salaire brut moyen (pouvoir d'achat) » → « salaire brut moyen » : la mention reste courte.
const libelleCourt = (m: string) => (mesures[m]?.court ?? mesures[m]?.nom ?? m).replace(/\s*\(pouvoir[^)]*\)/, "").toLowerCase();

const memoCalcul = new WeakMap<Etat, Ligne[]>();
export function calculer(etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): Ligne[] {
  if (reglages !== REGLAGES_DEFAUT) return calculerSansMemoire(etat, reglages);
  const deja = memoCalcul.get(etat);
  if (deja) return deja;
  const res = calculerSansMemoire(etat, reglages);
  memoCalcul.set(etat, res);
  return res;
}
function calculerSansMemoire(etat: Etat, reglages: Reglages): Ligne[] {
  // Seules les mesures notées pour au moins 30 pays sur 38 bougent le classement (règle des 30 pays).
  const effets = effetsAjustes(etat, reglages).filter((e) => mesureClassante(e.mesure));
  const ecarts = raisonsEcart(etat);
  const budget = budgetDe(etat, reglages);
  const limites = limitesDeclarees(etat.reponses);
  // Tes critères : chaque mesure qui compte pour toi, comptée une fois.
  const tesCriteres = [...new Set(effets.map((e) => e.mesure))].filter((m) => !MESURES_BONUS.includes(m));
  // Tes 3 premières envies : une donnée manquante sur l'une d'elles empêche d'entrer dans le top 3.
  const principales = mesuresPrincipales(etat);
  const lignes = pays.map((p) => {
    const remonte = etat.remontes.includes(p.id);
    const details: Detail[] = [];
    const manquantes = new Set<string>();
    const neutres = new Set<string>();
    const total = { points: 0, max: 0 };
    for (const e of effets) {
      if (remonte && PENALITES.includes(e.mesure)) continue;
      const note = noteCalcul(p.id, e.mesure, etat.profil);
      // Un bonus qui ne s'applique pas à ce pays : rien (ni malus, ni donnée manquante).
      if (note === null && MESURES_BONUS.includes(e.mesure)) continue;
      const priorite = estPriorite(e);
      // Priorité : la mesure compte, notée ou neutre. Sinon : seules les mesures notées comptent.
      if (note === null) {
        (priorite ? neutres : manquantes).add(e.mesure);
        if (!priorite) continue;
      }
      const neutre = note === null;
      const accord = neutre ? ACCORD_NEUTRE : accordNote(e, note);
      details.push({ mesure: e.mesure, sens: e.sens, position: e.position, poids: e.poids, accord, famille: e.famille, origine: e.origine, neutre });
      total.points += e.poids * accord; total.max += e.poids;
    }
    const pct = (x: { points: number; max: number }) => (x.max > 0 ? (x.points / x.max) * 100 : null);
    const notes = tesCriteres.filter((m) => noteEffective(p.id, m, etat.profil) !== null).length;
    const couverture = tesCriteres.length > 0 ? notes / tesCriteres.length : 1;
    const reelles = details.filter((d) => !d.neutre).length;
    const porte = evaluerPorte(p, etat.profil, budget);
    const manquePrincipal = principales.filter((m) => noteEffective(p.id, m, etat.profil) === null).map(libelleCourt);
    const ressemble = pct(total) ?? 0;
    const { acces, obstacles, aVerifier } = accesPays(p, etat, porte, limites);
    return {
      ressemble, acces, obstacles, accesAVerifier: aVerifier,
      fiabilite: fiabiliteDe(p.id, tesCriteres, etat.profil),
      couverture,
      manquePrincipal,
      peuDeDonnees: couverture < COUVERTURE_MIN || reelles === 0 || manquePrincipal.length > 0,
      sansDonnees: reelles === 0,
      pays: p,
      score: ressemble * facteurAcces(acces),
      details,
      manquantes: [...manquantes],
      neutres: [...neutres],
      ecart: ecarts[p.id] ?? null,
      porte,
    };
  });
  return lignes.sort((a, b) => Number(!!a.ecart) - Number(!!b.ecart) || Number(a.peuDeDonnees) - Number(b.peuDeDonnees) || b.score - a.score || a.pays.nom.localeCompare(b.pays.nom, "fr"));
}

export const cleTop3 = (lignes: Ligne[]) => lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3).map((l) => l.pays.id).join(",");

export function verdict(score: number): string {
  if (score >= 75) return "Très bonne piste";
  if (score >= 60) return "Bonne piste";
  return "Piste possible";
}

// Égalités : un groupe d'égalité est une chaîne de pays (même liste, même fiabilité) dont chaque voisin
// est à 5 points ou moins, sur les scores non arrondis.
// Pour chaque pays : l'indice du premier de son groupe d'égalité, ou -1 s'il n'est à égalité avec personne.
export function groupesEgalite(lignes: Ligne[]): number[] {
  const res = lignes.map(() => -1);
  lignes.forEach((l, i) => {
    const prec = i > 0 ? lignes[i - 1] : null;
    const chaine = prec && !prec.ecart === !l.ecart && prec.peuDeDonnees === l.peuDeDonnees && !l.peuDeDonnees && prec.score - l.score <= ECART_EX_AEQUO;
    if (chaine) {
      if (res[i - 1] < 0) res[i - 1] = i - 1;
      res[i] = res[i - 1];
    }
  });
  return res;
}
export const egalites = (lignes: Ligne[]): boolean[] => groupesEgalite(lignes).map((g) => g >= 0);

// « À égalité avec les Pays-Bas » : on cite le voisin le plus proche (au-dessus ou en dessous, dans la même chaîne).
// Un voisin hors de la vue (le top 3 pour une carte, la suite du classement pour la liste) est suivi de son rang.
export function avecQui(lignes: Ligne[], i: number, dansLaVue: (k: number) => boolean = (k) => k < 3): string | null {
  const g = groupesEgalite(lignes);
  if (g[i] < 0) return null;
  const voisins = [i - 1, i + 1].filter((k) => k >= 0 && k < lignes.length && g[k] === g[i]);
  const k = voisins.sort((a, b) => Math.abs(lignes[a].score - lignes[i].score) - Math.abs(lignes[b].score - lignes[i].score) || Number(dansLaVue(b)) - Number(dansLaVue(a)))[0];
  if (k === undefined) return null;
  return `À égalité avec ${dansLaVue(k) ? lignes[k].pays.le : `${lignes[k].pays.le} (n°\u00a0${k + 1})`}`;
}

// ---------- Le pays surprise ----------
// Un pays qu'une seule de tes préférences écarte ou fait reculer : une de tes limites « Rédhibitoire » (un filtre),
// ou une pénalité (« Je préfère pouvoir changer d'employeur librement », « Je garde ces soirées pour moi »).
// Il n'apparaît que si, sans cette préférence, son score l'aurait placé n° 1 ou n° 2 de ton classement.
// Jamais pour une règle légale (âge) ni pour le budget. S'il te manquerait de l'argent pour ce pays, la carte le dit.
export type Surprise = { ligne: Ligne; score: number; cause: "limite" | "employeur" | "langue"; phrase: string; argent: string | null };
const PHRASE_SURPRISE = {
  employeur: "Seul ton choix de pouvoir changer d’employeur librement fait reculer ce pays.",
  langue: "Seul ton choix de ne pas apprendre de nouvelle langue fait reculer ce pays.",
};
// Les préférences qui sont des pénalités : le dilemme, la mesure, la cause.
const PENALITES_SURPRISE = [
  { dilemme: "job-de-reve", mesure: "employeur-libre", cause: "employeur" as const },
  { dilemme: "cours-offerts", mesure: "apprendre-langue", cause: "langue" as const },
];
const phraseArgent = (l: Ligne) => l.porte.alertes.find((a) => /^(Il te manquerait|Selon ta somme exacte)/.test(a.texte))?.texte ?? null;

export function paysSurprise(etat: Etat, lignes: Ligne[], top: Ligne[], reglages: Reglages = REGLAGES_DEFAUT): Surprise | null {
  if (top.length === 0) return null;
  const seuil = top[Math.min(1, top.length - 1)].score; // le score de ton n° 2
  const dansTop = new Set(top.map((l) => l.pays.id));
  const candidats: Surprise[] = [];
  // Une seule de tes limites fait reculer ce pays : son score sans elle (même « Il te ressemble », accès sans cet obstacle).
  for (const l of lignes) {
    if (l.ecart || l.peuDeDonnees || dansTop.has(l.pays.id) || etat.remontes.includes(l.pays.id)) continue;
    // Seulement une limite « Rédhibitoire » (seule limite qui touche ce pays) : un « Je préfère éviter » ne fait pas une surprise.
    const lim = l.obstacles.filter((o) => o.type === "limite");
    if (lim.length !== 1 || lim[0].niveau !== "redhibitoire") continue;
    const score = l.ressemble * facteurAcces(Math.min(100, l.acces + lim[0].points));
    const texte = situationDe(lim[0].limite ?? "")?.texte ?? lim[0].texte;
    candidats.push({ ligne: l, score, cause: "limite", phrase: `Seule ta limite «\u00a0${texte}\u00a0» fait reculer ce pays.`, argent: phraseArgent(l) });
  }
  // Une pénalité : on recalcule sans cette seule réponse.
  for (const pen of PENALITES_SURPRISE) {
    if (!optionChoisie(etat, pen.dilemme)?.effets.some((e) => e.mesures.includes(pen.mesure))) continue;
    for (const l of lignes) {
      if (l.ecart || l.peuDeDonnees || dansTop.has(l.pays.id) || etat.remontes.includes(l.pays.id)) continue;
      // Seule cette réponse fait reculer le pays : aucune autre pénalité (une limite, par exemple) ne le touche.
      const penalites = l.details.filter((d) => PENALITES.includes(d.mesure) && d.accord < 1);
      if (penalites.length !== 1 || penalites[0].mesure !== pen.mesure || penalites[0].origine !== `dilemme:${pen.dilemme}`) continue;
      // Son score sans la pénalité : celui qu'il aurait une fois remonté.
      const score = calculer({ ...etat, remontes: [...etat.remontes, l.pays.id] }, reglages).find((x) => x.pays.id === l.pays.id)?.score ?? 0;
      candidats.push({ ligne: l, score, cause: pen.cause, phrase: PHRASE_SURPRISE[pen.cause], argent: phraseArgent(l) });
    }
  }
  const meilleur = candidats.sort((a, b) => b.score - a.score)[0];
  return meilleur && meilleur.score >= seuil - 1e-9 ? meilleur : null;
}

// ---------- Départager les pays : à quel point une réponse changerait le classement ----------
export function dilemmeVisible(d: Dilemme, etat: Etat): boolean {
  if (etat.reponses[d.id] !== undefined) return false;
  if (!dilemmeActif(d)) return false;
  return conditionRemplie(d.afficheSi ?? d.condition, etat.profil);
}

// Les effets d'une réponse possible, mesure par mesure, comme dans le calcul.
export function effetsPossibles(effets: EffetDilemme[], profil: Profil): EffetActif[] {
  return effets.flatMap((e) => {
    const reelles = e.mesures.map((m) => mesureReelle(m, profil)).filter((m): m is string => !!m);
    return reelles.map((m) => ({
      mesure: m, sens: e.position !== undefined ? ("position" as const) : ("haut" as const), position: e.position,
      poids: (e.position !== undefined ? 1 : (e.poids ?? 1)) / e.mesures.length, famille: familleDe(m), origine: "",
    }));
  });
}

// Les mesures d'une réponse qui changeraient vraiment quelque chose : une réponse qui ne fait
// que redonner une importance déjà atteinte (par une envie, par exemple) ne départage rien.
export function effetsNouveaux(effets: EffetActif[], etat: Etat): EffetActif[] {
  const actuels = new Map(effetsActifs(etat).map((e) => [e.mesure, e]));
  return effets.filter((e) => {
    const deja = actuels.get(e.mesure);
    return !deja || e.poids > deja.poids + 1e-9 || (e.sens === "position" && deja.position !== e.position);
  });
}

// L'écart entre les pays sur ces mesures : de 0 (tous pareils) à 4 (tout le contraire).
export function etendue(effets: EffetActif[], liste: Ligne[], profil: Profil): number {
  if (effets.length === 0) return 0;
  const valeurs = liste
    .map((l) => {
      const a = effets.map((e) => {
        const n = noteEffective(l.pays.id, e.mesure, profil);
        return n === null ? null : accordNote(e, n);
      }).filter((x): x is number => x !== null);
      return a.length ? (4 * a.reduce((x, y) => x + y, 0)) / a.length : null;
    })
    .filter((x): x is number => x !== null);
  if (valeurs.length < 2) return 0;
  const moy = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  const ecartType = Math.sqrt(valeurs.reduce((a, b) => a + (b - moy) ** 2, 0) / valeurs.length);
  return Math.max(...valeurs) - Math.min(...valeurs) + ecartType / 100;
}

// À quel point des réponses possibles départagent les pays donnés (0 : elles ne changent rien).
export const utiliteEffets = (reponsesPossibles: EffetDilemme[][], etat: Etat, liste: Ligne[]) =>
  Math.max(0, ...reponsesPossibles.map((effets) => etendue(effetsNouveaux(effetsPossibles(effets, etat.profil), etat), liste, etat.profil)));
export const utilite = (d: Dilemme, etat: Etat, liste: Ligne[]) => utiliteEffets(d.options.map((o) => o.effets), etat, liste);

// « Passer » ne compte ni comme une réponse, ni pour la stabilité du top 3.
export const repondues = (etat: Etat) => etat.ordre.filter((id) => etat.reponses[id] !== "passer").length;

// Le top 3 après chaque vraie réponse (le premier : avant la première réponse).
function historiqueReel(etat: Etat): string[] {
  return etat.historique.filter((_, i) => i === 0 || etat.reponses[etat.ordre[i - 1]] !== "passer");
}

// Nombre de vraies réponses d'affilée sans que le top 3 bouge (« dans » : seulement parmi ces éléments).
export function reponsesStables(etat: Etat, dans?: (id: string) => boolean): number {
  let n = 0;
  if (!dans) {
    const h = historiqueReel(etat);
    for (let i = h.length - 1; i > 0 && h[i] === h[i - 1]; i--) n++;
    return n;
  }
  for (let i = etat.ordre.length; i > 0; i--) {
    const id = etat.ordre[i - 1];
    if (!dans(id)) break;
    if (etat.reponses[id] === "passer") continue;
    if (etat.historique[i] !== etat.historique[i - 1]) break;
    n++;
  }
  return n;
}

// Le profil suit toujours les réponses.
const avecProfil = (etat: Etat): Etat => ({ ...etat, profil: profilDe(etat.reponses) });
export const etatDepart = (etat: Etat): Etat => {
  const e = avecProfil({ ...etat, reponses: {}, ordre: [] });
  return { ...e, historique: [cleTop3(calculer(e))] };
};

export function repondre(etat: Etat, id: string, reponse: Valeur): Etat {
  const base = etat.historique.length ? etat : { ...etat, historique: [cleTop3(calculer(avecProfil({ ...etat, reponses: {}, ordre: [] })))] };
  const suivant = avecProfil({ ...base, reponses: { ...base.reponses, [id]: reponse }, ordre: [...base.ordre.filter((x) => x !== id), id] });
  return { ...suivant, historique: [...base.historique.slice(0, base.ordre.length + 1), cleTop3(calculer(suivant))] };
}

export function annulerDerniere(etat: Etat): Etat {
  const id = etat.ordre.at(-1);
  if (!id) return etat;
  const reponses = { ...etat.reponses };
  delete reponses[id];
  return avecProfil({ ...etat, reponses, ordre: etat.ordre.slice(0, -1), historique: etat.historique.slice(0, etat.ordre.length) });
}

// Recalcule le profil et l'historique du top 3 après un changement de réponse (« Ce n'est pas moi »).
export function rejouer(etat: Etat): Etat {
  const partiel = (k: number) => {
    const ordre = etat.ordre.slice(0, k);
    return avecProfil({ ...etat, ordre, reponses: Object.fromEntries(ordre.map((id) => [id, etat.reponses[id]])) });
  };
  const historique = Array.from({ length: etat.ordre.length + 1 }, (_, k) => cleTop3(calculer(partiel(k))));
  return { ...avecProfil(etat), historique };
}

export function changerReponse(etat: Etat, id: string, reponse: Valeur): Etat {
  if (!etat.ordre.includes(id)) return repondre(etat, id, reponse);
  return rejouer({ ...etat, reponses: { ...etat.reponses, [id]: reponse } });
}

export const listeFr = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l.at(-1)}` : (l[0] ?? ""));

// ---------- Le départage ----------
// Quand le n°1 et le n°2 sont à 5 points ou moins : au plus 5 dilemmes encore non répondus, tant que l'écart
// reste sous 5 points, puis la comparaison côte à côte. Seulement des dilemmes dont une mesure sépare vraiment
// les deux pays : deux niveaux d'écart ou plus, avec une donnée vérifiée des deux côtés.
export const MAX_DEPARTAGE = 5;
export const ECART_NIVEAUX_DEPARTAGE = 2;
const ecartEntre = (lignes: Ligne[], a: string, b: string) =>
  (lignes.find((l) => l.pays.id === a)?.score ?? 0) - (lignes.find((l) => l.pays.id === b)?.score ?? 0);
const lePays = (id: string) => pays.find((p) => p.id === id)?.le ?? id;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Les mesures d'un dilemme qui séparent a et b (de la plus grande différence à la plus petite).
export function mesuresQuiSeparent(d: Dilemme, etat: Etat, a: string, b: string): { mesure: string; ecart: number }[] {
  return mesuresDuDilemme(d)
    .map((m) => {
      const na = noteEffective(a, m, etat.profil), nb = noteEffective(b, m, etat.profil);
      return na === null || nb === null ? null : { mesure: m, ecart: Math.abs(na - nb) };
    })
    .filter((x): x is { mesure: string; ecart: number } => !!x && x.ecart >= ECART_NIVEAUX_DEPARTAGE)
    .sort((x, y) => y.ecart - x.ecart);
}

// De combien les options d'un dilemme font varier l'écart entre a et b (0 : il ne les sépare pas).
export function separation(d: Dilemme, etat: Etat, a: string, b: string, reglages: Reglages = REGLAGES_DEFAUT): number {
  const ecarts = d.options.map((o) => ecartEntre(calculer(repondre(etat, d.id, o.id), reglages), a, b));
  return Math.max(...ecarts) - Math.min(...ecarts);
}

export function prochainDepartage(etat: Etat, a: string, b: string, reglages: Reglages = REGLAGES_DEFAUT): Dilemme | null {
  let meilleur: Dilemme | null = null;
  let max = 1e-6;
  for (const d of quiz.dilemmes) {
    if (!dilemmeVisible(d, etat) || mesuresQuiSeparent(d, etat, a, b).length === 0) continue;
    const s = separation(d, etat, a, b, reglages);
    if (s > max) { max = s; meilleur = d; }
  }
  return meilleur;
}

// « On te pose cette question parce que l'Allemagne et la Belgique diffèrent surtout sur la ponctualité. »
export function raisonDepartage(d: Dilemme, etat: Etat, a: string, b: string): string {
  const m = mesuresQuiSeparent(d, etat, a, b)[0];
  const sujet = m ? (mesures[m.mesure]?.sujet ?? mesures[m.mesure]?.nom.toLowerCase()) : "ce point";
  return `On te pose cette question parce que ${lePays(a)} et ${lePays(b)} diffèrent surtout sur ${sujet}.`;
}

// L'écart entre deux pays est-il encore une égalité (5 points ou moins) ?
export const encoreEgalite = (etat: Etat, a: string, b: string, reglages: Reglages = REGLAGES_DEFAUT) =>
  Math.abs(ecartEntre(calculer(etat, reglages), a, b)) <= ECART_EX_AEQUO;

// La phrase de fin. Si les deux pays restent à égalité, on ne dit pas « ce qui a fait la différence ».
export function bilanDepartage(avant: Etat, apres: Etat, a: string, b: string, reglages: Reglages = REGLAGES_DEFAUT): string {
  const pluriel = (id: string) => !!pays.find((p) => p.id === id)?.pluriel;
  const ids = apres.ordre.filter((id) => !avant.ordre.includes(id) && apres.reponses[id] !== "passer");
  const debut = ecartEntre(calculer(avant, reglages), a, b);
  const fin = ecartEntre(calculer(apres, reglages), a, b);
  const egalite = Math.abs(fin) <= ECART_EX_AEQUO;
  const ecartFin = Math.round(Math.abs(fin));
  const points = `${ecartFin}\u00a0point${ecartFin > 1 ? "s" : ""} d’écart`;
  const devant = fin > 0 ? a : b, derriere = fin > 0 ? b : a;
  const egaux = `${lePays(a)} et ${lePays(b)} restent à égalité (${points}).`;
  const issue = egalite
    ? majuscule(egaux)
    : `${majuscule(lePays(devant))} ${Math.sign(fin) === Math.sign(debut) && debut !== 0 ? (pluriel(devant) ? "restent" : "reste") : (pluriel(devant) ? "passent" : "passe")} devant ${lePays(derriere)}, avec ${points}.`;
  if (ids.length === 0) return `Tu as passé les questions\u00a0: rien n’a changé. ${issue}`;
  if (egalite) return `Tes réponses n’ont pas suffi à les départager\u00a0: ${egaux}`;
  let etat = avant;
  let plusFort = { id: ids[0], effet: -1 };
  for (const id of ids) {
    const avantCoup = ecartEntre(calculer(etat, reglages), a, b);
    etat = repondre(etat, id, apres.reponses[id]);
    const effet = Math.abs(ecartEntre(calculer(etat, reglages), a, b) - avantCoup);
    if (effet > plusFort.effet) plusFort = { id, effet };
  }
  const d = trouverDilemme(plusFort.id);
  if (!d) return issue;
  return `${issue} Ce qui a fait la différence\u00a0: ta réponse à «\u00a0${sceneDe(d, apres).titre}\u00a0» (${libelleReponse(d, apres.reponses[plusFort.id], apres)}).`;
}

// ---------- Résultat rédigé pour toi ----------
function uniques(details: Detail[]): Detail[] {
  const vus = new Set<string>();
  return details.filter((d) => (vus.has(d.mesure) ? false : (vus.add(d.mesure), true)));
}

// « Pour toi » : seulement les points notés 4 ou 5 sur 5 dans le sens de tes réponses.
export const ACCORD_ARGUMENT = 0.75;
// « À savoir » : un point moyen ou défavorable (2,5 sur 5 ou moins dans le sens de tes réponses).
export const ACCORD_A_SAVOIR = 0.5;

// Une phrase qui relie la donnée à toi. La valeur chiffrée reste dans la pastille de preuve.
export type LigneResultat = { texte: string; mesure: string; preuve: Preuve };

// La phrase de fait d'une mesure pour un pays (« Le chômage des jeunes y est faible »).
export function faitMesure(paysId: string, mesureId: string, profil: Profil): string | null {
  const m = mesures[mesureId];
  const note = noteEffective(paysId, mesureId, profil);
  if (!m || note === null) return null;
  if ((mesureId === "langue" || mesureId === "apprendre-langue") && parleLangueDe(paysId, profil)) return "Tu parles déjà la langue du pays";
  if (Array.isArray(m.fait)) return m.fait[note - 1] ?? null;
  if (m.fait) return m.fait.replace("{mot}", m.mots[note - 1]);
  return `${m.nom}\u00a0: ${m.mots[note - 1]}`;
}

// Seules les mesures liées à une de tes réponses parlent de toi : envie, projet, dilemme, autre élément du quiz, limite ou curseur.
const origineQuiParle = (d: Detail) => /^(envie|objectif|dilemme|element|limite|reglage):/.test(d.origine) || d.origine === "langues";
const nomObjectif = (d: Detail) => quiz.objectifs[d.origine.split(":")[1]]?.nom ?? "ton projet";
const personnel = (fait: string) => /^(Tu|Ton|Ta|Tes) /.test(fait);

function preferenceDe(d: Detail, etat: Etat): string | undefined {
  if (!d.origine.startsWith("dilemme:")) return undefined;
  return optionChoisie(etat, d.origine.split(":")[1])?.preference;
}

function phrasePour(d: Detail, fait: string): string {
  if (personnel(fait) || d.origine === "langues") return `${fait}.`;
  if (d.origine.startsWith("envie:")) return `${fait}\u00a0: c’est une de tes envies.`;
  if (d.origine.startsWith("objectif:")) return `${fait}, utile pour ${nomObjectif(d)}.`;
  if (d.sens === "position") return `${fait}, comme tu le préfères.`;
  return `${fait}, et c’est ce que tu as choisi.`;
}

function phraseSavoir(d: Detail, fait: string, etat: Etat): string {
  if (d.origine.startsWith("envie:")) return `${fait}, alors que c’est une de tes envies.`;
  if (d.origine.startsWith("objectif:")) return `${fait}\u00a0: à prendre en compte pour ${nomObjectif(d)}.`;
  const pref = preferenceDe(d, etat);
  return pref ? `${fait}, et tu préférais ${pref}.` : `${fait}.`;
}

// Les trois catégories des cartes du top 3.
export type Categorie = "travailler" | "vivre" | "culture";
export const CATEGORIES: { id: Categorie; nom: string }[] = [
  { id: "travailler", nom: "Travailler" },
  { id: "vivre", nom: "Vivre" },
  { id: "culture", nom: "Culture au travail" },
];
export const categorieDe = (mesureId: string): Categorie => {
  const c = mesures[mesureId]?.critere;
  if (c?.id === "style-travail") return "culture";
  return c?.famille === "travailler" ? "travailler" : "vivre";
};
export const MAX_POUR_CATEGORIE = 2;
export type PointsCategorie = { pour: LigneResultat[]; savoir: LigneResultat | null };
export type PointsPays = Record<Categorie, PointsCategorie>;
export const aplatir = (p: PointsPays) => ({
  pour: CATEGORIES.flatMap((c) => p[c.id].pour),
  savoir: CATEGORIES.map((c) => p[c.id].savoir).filter((x): x is LigneResultat => !!x),
});

// Pour chaque catégorie : au plus 2 points forts (notés 4 ou 5 sur 5 dans le sens de tes réponses)
// et 1 point faible (2,5 sur 5 ou moins). « interdites » : phrases déjà affichées pour un pays mieux classé.
export function pointsPays(l: Ligne, etat: Etat, interdites: Set<string> = new Set()): PointsPays {
  const res = Object.fromEntries(CATEGORIES.map((c) => [c.id, { pour: [] as LigneResultat[], savoir: null as LigneResultat | null }])) as PointsPays;
  const parle = l.details.filter((d) => !d.neutre && origineQuiParle(d));
  const pour = uniques([...parle].filter((d) => d.accord >= ACCORD_ARGUMENT).sort((a, b) => b.poids * b.accord - a.poids * a.accord || b.accord - a.accord));
  const vues = new Set<string>();
  for (const d of pour) {
    const cat = res[categorieDe(d.mesure)];
    if (cat.pour.length >= MAX_POUR_CATEGORIE) continue;
    const fait = faitMesure(l.pays.id, d.mesure, etat.profil);
    if (!fait) continue;
    const texte = phrasePour(d, fait);
    // Jamais deux fois la même phrase, ni sous deux pays, ni sous le même (langue et langue à apprendre).
    if (interdites.has(texte) || vues.has(texte)) continue;
    vues.add(texte);
    cat.pour.push({ texte, mesure: d.mesure, preuve: preuveDe(l.pays.id, d.mesure, etat.profil) });
  }
  const contre = uniques([...parle].filter((d) => d.accord <= ACCORD_A_SAVOIR).sort((a, b) => a.accord - b.accord || b.poids - a.poids));
  for (const d of contre) {
    const cat = res[categorieDe(d.mesure)];
    if (cat.savoir) continue;
    const fait = faitMesure(l.pays.id, d.mesure, etat.profil);
    if (!fait) continue;
    const texte = phraseSavoir(d, fait, etat);
    if (interdites.has(texte) || vues.has(texte)) continue;
    vues.add(texte);
    cat.savoir = { texte, mesure: d.mesure, preuve: preuveDe(l.pays.id, d.mesure, etat.profil) };
  }
  // « Ton secteur » : toujours dit sous chaque pays quand ton secteur est connu et assez renseigné,
  // dans « Pour toi » s'il y pèse beaucoup (4 ou 5 sur 5), sinon dans « À savoir ».
  const ms = mesureSecteur(etat.profil);
  const travail = res.travailler;
  if (ms && !travail.pour.some((x) => x.mesure === ms) && travail.savoir?.mesure !== ms) {
    const note = noteEffective(l.pays.id, ms, etat.profil);
    const v = valeurLisible(l.pays.id, ms, etat.profil);
    const fr = valeurFrance(ms);
    const ligne: LigneResultat = {
      mesure: ms, preuve: preuveDe(l.pays.id, ms, etat.profil),
      texte: note === null ? `Ton secteur\u00a0: pas encore de donnée pour ${l.pays.le}.` : `${faitMesure(l.pays.id, ms, etat.profil)}${v?.valeur ? `\u00a0: ${v.valeur} ${l.pays.en}` : ""}${fr ? ` (${fr})` : ""}.`,
    };
    if (note !== null && note >= 4) travail.pour = [ligne, ...travail.pour].slice(0, MAX_POUR_CATEGORIE);
    else travail.savoir = ligne;
  }
  return res;
}

// Les points des pays affichés, dans l'ordre : un pays ne reprend jamais une phrase d'un pays mieux classé.
export function lignesTop(liste: Ligne[], etat: Etat): Map<string, PointsPays> {
  const vues = new Set<string>();
  const res = new Map<string, PointsPays>();
  for (const l of liste) {
    const points = pointsPays(l, etat, vues);
    const { pour, savoir } = aplatir(points);
    for (const x of [...pour, ...savoir]) vues.add(x.texte);
    res.set(l.pays.id, points);
  }
  return res;
}

// ---------- La vraie valeur d'une mesure ----------
// « 1,6 h de vol », « 0,7 °C au mois le plus froid », et un mot (« Très proche », « Hiver froid »).
const nombreFr = (v: number, dec: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: dec }).replace(/\u202f/g, "\u00a0");
export function valeurLisible(paysId: string, mesureId: string, profil: Profil): { valeur: string | null; mot: string } | null {
  const m = mesures[mesureId];
  const note = noteEffective(paysId, mesureId, profil);
  if (!m || note === null) return null;
  if ((mesureId === "langue" || mesureId === "apprendre-langue") && parleLangueDe(paysId, profil)) return { valeur: null, mot: "Tu parles la langue" };
  const v = notes[paysId]?.[mesureId]?.valeur;
  // Le soleil : un rang entre les pays (l'unité de la source, des kWh par m², ne parle à personne).
  if (mesureId === "soleil" && typeof v === "number") {
    const toutes = pays.map((p) => notes[p.id]?.soleil).filter((n) => n?.statut === "verifie" && typeof n.valeur === "number").map((n) => n!.valeur as number);
    const k = toutes.filter((x) => x > v).length + 1;
    return { valeur: `${k === 1 ? "1er" : `${k}e`} pays le plus ensoleillé sur ${toutes.length}`, mot: m.etiquettes?.[note - 1] ?? m.mots[note - 1] };
  }
  const modele = typeof v === "number" && v < 2 && m.affichageSingulier ? m.affichageSingulier : m.affichage;
  const valeur = modele && typeof v === "number" ? modele.replace("{v} ", "{v}\u00a0").replace("{v}", nombreFr(v, m.decimales ?? 0)) : null;
  return { valeur, mot: m.etiquettes?.[note - 1] ?? m.mots[note - 1] };
}

// Ce qui accompagne une valeur dans le détail du pays : la part qui reste après impôts (salaire, hors score),
// ou les autres villes du barème (indemnité VIE).
export function complementMesure(paysId: string, mesureId: string): string | null {
  const n = notes[paysId]?.[mesureId];
  if (mesureId === "salaire") {
    if (typeof n?.resteSur100 === "number") return `Pour un célibataire au salaire moyen, sur 100\u00a0€ bruts, il reste environ ${Math.round(n.resteSur100)}\u00a0€ après impôt sur le revenu et cotisations salariales (OCDE, 2025).`;
    return "Ce qui reste après impôts\u00a0: à vérifier pour ce pays.";
  }
  if (mesureId === "indemnite-vie" && n?.autres?.length) {
    return `Autres villes\u00a0: ${n.autres.map((a) => `${a.ville}, ${a.montant ? `${Math.round(a.montant).toLocaleString("fr-FR")}\u00a0€` : "à vérifier"}`).join("\u00a0; ")}.`;
  }
  return null;
}

// La valeur de la France pour comparer à ce qu'on connaît : « France : 17,3 % ».
// Seulement quand la même source la donne, avec les mêmes règles (années comparables pour le salaire).
// « annee » : l'année du pays comparé ; si celle de la France en diffère, elle est dite.
export function valeurFrance(mesureId: string, annee?: string | null): string | null {
  const m = mesures[mesureId];
  const n = notesFrance[mesureId];
  if (!m?.affichage || !n || n.statut !== "verifie" || typeof n.valeur !== "number") return null;
  const modele = n.valeur < 2 && m.affichageSingulier ? m.affichageSingulier : m.affichage;
  const v = modele.replace("{v} ", "{v} ").replace("{v}", nombreFr(n.valeur, m.decimales ?? 0));
  return `France : ${v}${n.annee && annee && n.annee !== annee ? ` (${n.annee})` : ""}`;
}

// ---------- La comparaison côte à côte ----------
// Une ligne par critère qui compte pour toi, tes envies d'abord, puis par importance.
export type LigneComparaison = {
  mesure: string; libelle: string; theme: string; priorite: boolean; poids: number;
  a: { valeur: string | null; mot: string } | null; b: { valeur: string | null; mot: string } | null;
  ecart: number | null; // accord de a moins accord de b : de −1 à 1 (0 : égalité ; null : donnée manquante d'un côté, non comparable)
  france: string | null; // « France : 17,3 % », pour comparer à ce qu'on connaît
};
export function comparer(la: Ligne, lb: Ligne, etat: Etat, reglages: Reglages = REGLAGES_DEFAUT) {
  const lignes: LigneComparaison[] = effetsAjustes(etat, reglages)
    .filter((e) => mesureClassante(e.mesure))
    .map((e) => {
      const da = la.details.find((d) => d.mesure === e.mesure && !d.neutre);
      const db = lb.details.find((d) => d.mesure === e.mesure && !d.neutre);
      const m = mesures[e.mesure];
      return {
        mesure: e.mesure, libelle: m?.court ?? m?.nom ?? e.mesure, theme: m?.theme ?? "", priorite: e.origine.startsWith("envie:"), poids: e.poids,
        a: valeurLisible(la.pays.id, e.mesure, etat.profil), b: valeurLisible(lb.pays.id, e.mesure, etat.profil),
        ecart: da && db ? da.accord - db.accord : null,
        france: valeurFrance(e.mesure),
      };
    })
    .filter((x) => x.a || x.b)
    .sort((x, y) => Number(y.priorite) - Number(x.priorite) || y.poids - x.poids);
  // Par thème : qui gagne, en tenant compte de l'importance de chaque critère.
  const themes = new Map<string, number>();
  for (const x of lignes) if (x.ecart !== null) themes.set(x.theme, (themes.get(x.theme) ?? 0) + x.poids * x.ecart);
  const gagnes = (signe: number) => [...themes].filter(([, s]) => s * signe > 0.05).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1])).map(([th]) => th);
  const Le = (l: Ligne) => l.pays.le.charAt(0).toUpperCase() + l.pays.le.slice(1);
  const gagne = (l: Ligne) => accord(l.pays, "gagne", "gagnent");
  const phrases = [
    gagnes(1).length ? `${Le(la)} ${gagne(la)} sur ${listeFr(gagnes(1))}.` : "",
    gagnes(-1).length ? `${Le(lb)} ${gagne(lb)} sur ${listeFr(gagnes(-1))}.` : "",
  ].filter(Boolean);
  const synthese = phrases.length ? phrases.join(" ") : "Les deux pays font jeu égal sur ce qui compte pour toi.";
  return { lignes, synthese };
}

// ---------- « Pourquoi on te demande ça ? » : ce que la réponse peut changer ----------
// Les mesures qu'un élément peut viser, et une carte de plus quand certaines ne bougent pas le classement
// (notées pour moins de 30 pays sur 38) : la réponse enrichit alors le portrait, et l'aide le dit.
export function mesuresElement(el: Element, p: Profil = {}): string[] {
  const de = (e: EffetDilemme[] | undefined) => (e ?? []).flatMap((x) => x.mesures);
  let ms: string[] = [];
  switch (el.type) {
    case "dilemme": ms = el.options.flatMap((o) => de(o.effets)); break;
    case "choix-cartes": ms = el.source ? [] : el.options.flatMap((o) => de(o.effets)); break;
    case "ambiances": ms = el.options.flatMap((o) => de(o.effets)); break;
    case "swipe": ms = el.phrases.flatMap((x) => [...de(x.oui), ...de(x.non)]); break;
    case "curseur": ms = [...de(el.gauche.effets), ...de(el.droite.effets)]; break;
    case "tri-zones": ms = el.cartes.flatMap((c) => c.mesures); break;
    case "blind-test": ms = el.mesures; break;
  }
  return [...new Set(ms.map((m) => mesureReelle(m, p)).filter((m): m is string => !!m))];
}
export function aideDe(el: Element, p: Profil = {}): Element["aide"] {
  const ms = mesuresElement(el, p);
  const faibles = ms.filter((m) => !mesureClassante(m));
  if (!faibles.length) return el.aide;
  const noms = faibles.map((m) => (mesures[m]?.court ?? m).toLowerCase());
  const texte = faibles.length === ms.length
    ? "Pas assez de données pays pour que ta réponse change ton classement : elle enrichit ton portrait."
    : `Pas encore assez de données pays sur ${listeFr(noms)} : ce côté-là enrichit ton portrait, sans changer ton classement.`;
  return { ...el.aide, cartes: [...el.aide.cartes, { pastille: "Données", texte }] };
}
