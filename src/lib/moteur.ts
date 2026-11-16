// Le calcul du quiz : un simple calcul, sans IA.
// La méthode complète est expliquée sur la page /methode.
import { ECART_EX_AEQUO } from "@/config";
import { accord, pays, type Pays } from "./pays";
import {
  avis, dateFr, doubleNationalite, europe, mesures, notes, notesFrance, portes, quiz, sources, trouverElement, vie, preuveMesure, preuveSource, preuveVisa,
  type CasDouble, type DetailVisa, type Dilemme, type EffetDilemme, type FamilleScore, type LieEmployeur, type OptionDilemme, type PorteBrute, type Preuve, type Scene, type Valeur,
} from "./donnees";
import {
  LIBELLE_ECHELLE, conditionRemplie, effetsReponse, limitesRedhibitoires, optionReponse, penalitesRetirees, profilDe, type Profil,
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
export function budgetProfil(p: Profil): Budget | null {
  const o = option("budget", p.budget);
  return o?.min !== undefined ? { min: o.min, max: o.max ?? null } : null;
}
export const budgetExact = (n: number): Budget => ({ min: n, max: n });
export const budgetDe = (etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): Budget | null =>
  reglages.budget !== null ? budgetExact(reglages.budget) : budgetProfil(etat.profil);
export const dureeMois = (p: Profil) => option("duree", p.duree)?.mois ?? null;

export function languesParlees(p: Profil): string[] {
  const choix = Array.isArray(p.langues) ? p.langues : [];
  return choix.flatMap((id) => option("langues", id)?.codes ?? []);
}
const parleLangueDe = (paysId: string, p: Profil) => {
  const parlees = languesParlees(p);
  return (avis[paysId]?.langues ?? []).some((l) => parlees.includes(l));
};

export function questionProfilVisible(id: string, p: Profil): boolean {
  return conditionRemplie(quiz.profil.find((x) => x.id === id)?.afficheSi, p);
}

// ---------- Tes envies, dans l'ordre ----------
// Le classement de tes 5 envies (ou, s'il est passé, l'ordre où tu les as choisies).
// Rang 1 : importance 2 ; rang 2 : 1,75 ; rang 3 : 1,5 ; rang 4 : 1,25 ; rang 5 : 1,1.
export function enviesDe(etat: Pick<Etat, "reponses">): string[] {
  const valides = (x: Valeur | undefined) => (Array.isArray(x) ? x.filter((id) => quiz.envies.some((e) => e.id === id)) : []);
  const choisies = valides(etat.reponses.envies);
  const rangees = valides(etat.reponses.classement).filter((id) => choisies.includes(id));
  return rangees.length === choisies.length ? rangees : choisies;
}
export const poidsRang = (rang: number) => quiz.poidsRang[rang] ?? quiz.poidsRang.at(-1) ?? 1;

// Une envie n'est proposée que si au moins une de ses mesures est notée (« Évoluer dans mon secteur » : si ton secteur l'est).
export function envieDisponible(id: string, p: Profil): boolean {
  const en = quiz.envies.find((x) => x.id === id);
  return !!en && en.mesures.some((m) => { const r = mesureReelle(m, p); return !!r && mesureDisponible(r); });
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
  if (mesureId === "en-europe") { const x = pays.find((y) => y.id === paysId); return x ? (x.zone === "europe" ? 5 : 1) : null; }
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

const disponibilite: Record<string, number> = {};
export function paysCouverts(mesureId: string): number {
  if (MESURES_CALCULEES.includes(mesureId)) return pays.length;
  disponibilite[mesureId] ??= pays.filter((x) => notes[x.id]?.[mesureId]?.statut === "verifie").length;
  return disponibilite[mesureId];
}
export const mesureDisponible = (mesureId: string) => paysCouverts(mesureId) > 0;

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
  return variante ? { ...scene, texte: variante } : scene;
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
export function mesureReelle(m: string, p: Profil): string | null {
  if (m === "secteur") return typeof p.secteur === "string" && p.secteur !== "autre" && mesures[`secteur-${p.secteur}`] ? `secteur-${p.secteur}` : null;
  return m;
}

export function effetsBruts(etat: Etat): EffetActif[] {
  const res: EffetActif[] = [];
  const ajouter = (mesuresVisees: string[], e: { poids?: number; position?: number }, origine: string, poidsTotal?: number) => {
    const reelles = mesuresVisees.map((m) => mesureReelle(m, etat.profil)).filter((m): m is string => !!m);
    for (const m of reelles) {
      res.push({
        mesure: m, sens: e.position !== undefined ? "position" : "haut", position: e.position,
        poids: (poidsTotal ?? (e.position !== undefined ? 1 : (e.poids ?? 1))) / mesuresVisees.length, famille: familleDe(m), origine,
      });
    }
  };
  enviesDe(etat).forEach((id, rang) => {
    const en = quiz.envies.find((x) => x.id === id);
    if (en) ajouter(en.mesures, {}, `envie:${id}`, poidsRang(rang));
  });
  const retirees = new Set<string>();
  for (const id of etat.ordre) {
    const el = trouverElement(id);
    if (!el) continue;
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
function effetsActifsSansMemoire(etat: Etat): EffetActif[] {
  const groupes = new Map<string, EffetActif>();
  for (const e of effetsBruts(etat)) {
    const deja = groupes.get(e.mesure);
    if (!deja || e.poids > deja.poids) groupes.set(e.mesure, e);
  }
  return [...groupes.values()];
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

const euros = (n: number) => `${Math.round(n / 50) * 50}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
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
  const veutVie = profil.objectif === "stage-vie";
  const duree = dureeMois(profil);
  const alertes: Alerte[] = [];
  const autres: string[] = [];
  if (veutVie && age !== null && !vieOuvert) {
    alertes.push({ texte: "Le VIE est fermé à ton âge : il faut avoir moins de 28 ans à la candidature.", preuve: preuveVie() });
  }

  const ue = liste.find((x) => x.type === "ue");
  if (ue) {
    // Suisse : un permis de séjour à demander au canton au-delà de trois mois (France Diplomatie).
    const local = europe.pays[p.id];
    if (local) alertes.push({ texte: local.texte, preuve: preuveSource("Séjour de plus de trois mois", local.texte, local.source, local.lien, local.verifieLe) });
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
    let phrase = pvt.quota ? `${PVT} ouvert ${quand} : ${pvt.quota.toLocaleString("fr-FR")} places par an.` : `${PVT} ouvert ${quand}, sans quota.`;
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
      alertes.push({ texte: "Le PVT dure un an maximum : pour rester plus longtemps, il faudra un autre visa.", preuve: preuvePorte(pvt) });
    }
    if (veutVie && vieOuvert) autres.push("Pour un VIE, il faut décrocher une mission auprès d’une entreprise.");
    // Saison fermée (Canada) : le badge reste celui de la porte, avec cette mention.
    const sa = pvt.saison;
    const mention = sa ? { texte: sa.texte, preuve: preuveSource("Saison du PVT", `Phrase officielle : « ${sa.citation} » (page mise à jour le ${dateFr(sa.datePage)}).`, sa.source, sa.lien, sa.verifieLe) } : null;
    return { badge, nom: pvt.nom, type: "pvt", phrase, fonds, manque, manquePossible, alertes, preuve: preuvePorte(pvt), autres, visa: visa?.detail ?? null, mention };
  }

  // Pays « visa de travail »
  const base = visa ?? ({ type: "visa-travail", nom: "Visa de travail", texte: "Conditions pas encore vérifiées.", source: null, lien: null, verifieLe: null, statut: "a-verifier" } as PorteBrute);
  let phrase = vieOuvert ? "Il faut un employeur sur place, ou une mission en VIE (volontariat international en entreprise)." : "Il faut un employeur qui te fait venir.";
  const d = base.detail;
  if (d) phrase += PHRASE_LIE[d.lieEmployeur];
  if (base.statut !== "verifie" || base.detailsAVerifier) phrase += " Les conditions détaillées (employeur, salaire, diplôme) restent à vérifier sur le site officiel du pays.";
  // Avec le détail du visa, les conditions sont dans la carte du visa ; seule l'exigence de diplôme ou d'expérience est une alerte.
  if (d) alertes.push(...alerteExperience(d));
  else for (const c of base.conditions ?? []) alertes.push({ texte: c, preuve: preuvePorte(base) });
  if (vieOuvert) autres.push("VIE : la présence de missions dans ce pays n’est pas encore vérifiée.");
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
    if (local) f.aRemplir.push("Au-delà de trois mois : un permis de séjour à demander au canton, avant d’arriver.");
    f.aVerifier.push("Inscription auprès des autorités locales : elle peut être demandée dans les 3 mois après l’arrivée.");
    f.etape = local
      ? { texte: "Lire les démarches sur le site officiel", url: local.lien, nom: "Suisse : entrée et séjour (France Diplomatie)" }
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
    else if (pvt.fonds) f.aRemplir.push(`Prévoir les ressources demandées\u00a0: ${pvt.fonds.texte}.`);
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
      points: ["Pas de visa ni de permis de travail", europe.pays[p.id] ? "Permis de séjour du canton au-delà de 3 mois" : "Inscription sur place possible"],
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
export const MESURES_CALCULEES = ["employeur-libre"];
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
  if (mesureId !== "employeur-libre") return preuveMesure(paysId, mesureId);
  const p = pays.find((x) => x.id === paysId)!;
  const porte = evaluerPorte(p, profil, null);
  const visa = porte.type === "visa-travail" || porte.badge === "fermee" ? visaTravail(paysId)?.detail : undefined;
  return visa ? preuveVisa(visa) : porte.preuve;
}

// Toutes les raisons qui font descendre un pays dans « Moins adaptés pour toi », dans l'ordre.
// « age » : une règle légale (le PVT fermé à ton âge). Les autres sont tes préférences.
export type CauseEcart = { cause: "francais" | "age" | "limite"; raison: string; limite?: string };

// « Rédhibitoire » dans tes limites : les pays concernés passent dans « Moins adaptés pour toi ».
// Une donnée manquante n'écarte jamais un pays (on ne sait pas).
export function limiteTouche(situation: string, paysId: string, profil: Profil): boolean {
  const note = (m: string) => noteEffective(paysId, m, profil);
  const p = pays.find((x) => x.id === paysId);
  switch (situation) {
    case "hors-europe": return p?.zone !== "europe";
    case "alphabet": return note("apprendre-langue") === 1;
    case "visa-employeur": return note("employeur-libre") === 1;
    case "vol-10h": { const n = notes[paysId]?.vol; return n?.statut === "verifie" && typeof n.valeur === "number" && n.valeur > 10; }
    case "hiver-froid": return note("hiver") === 1;
    case "vigilance": return note("securite") === 1;
    case "ni-fr-ni-en": { const n = note("langue-travail"); return n !== null && n <= 2; }
    case "assurance-privee": { const n = note("sante"); return n !== null && n <= 2; }
    default: return false;
  }
}
export const situationDe = (id: string) => {
  const el = trouverElement("limites");
  return el?.type === "tri-limites" ? el.situations.find((s) => s.id === id) : undefined;
};

export function causesEcart(p: Pays, etat: Etat): CauseEcart[] {
  const res: CauseEcart[] = [];
  if (etat.profil["pret-anglais"] === "non" && !avis[p.id]?.francaisAuTravail) res.push({ cause: "francais", raison: "Tu veux travailler en français." });
  for (const id of limitesRedhibitoires(etat.reponses)) {
    const s = situationDe(id);
    if (s && limiteTouche(id, p.id, etat.profil)) res.push({ cause: "limite", raison: s.raison, limite: id });
  }
  const porte = evaluerPorte(p, etat.profil, null);
  if (porte.badge === "fermee") res.push({ cause: "age", raison: `Fermé à ton âge. ${porte.phrase}` });
  return res;
}

export function raisonsEcart(etat: Etat): Record<string, string> {
  const res: Record<string, string> = {};
  for (const p of pays) {
    if (etat.remontes.includes(p.id)) continue;
    const c = causesEcart(p, etat)[0];
    if (c) res[p.id] = c.raison;
  }
  return res;
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
  score: number;
  sansDonnees: boolean; // aucune donnée vérifiée sur tes critères : pas de pourcentage
  details: Detail[];
  manquantes: string[]; // données « à vérifier » sur tes critères (hors envies)
  neutres: string[]; // données « à vérifier » sur tes envies, comptées à 50 %
  ecart: string | null;
  porte: Porte;
  couverture: number; // part de tes critères (en nombre) pour lesquels ce pays a une donnée vérifiée
  peuDeDonnees: boolean;
  fiabilite: Fiabilite;
};

// ---------- Fiabilité des données ----------
// Part de tes critères qui ont, pour ce pays, une donnée vérifiée par une source Officiel, Donnée ouverte
// ou Témoignages. « Notre avis » (un jugement de la rédaction) et « À vérifier » ne comptent pas.
export type NiveauFiabilite = "complete" | "partielle" | "faible";
export type Fiabilite = { verifies: number; total: number; niveau: NiveauFiabilite };
export const TYPES_VERIFIES = ["officiel", "donnee-ouverte", "temoignages"];
export const LIBELLE_FIABILITE: Record<NiveauFiabilite, string> = {
  complete: "Données complètes",
  partielle: "Données partielles",
  faible: "Peu de données vérifiées",
};
export function fiabiliteDe(paysId: string, criteres: string[], profil: Profil): Fiabilite {
  const verifies = criteres.filter((m) => {
    if (MESURES_CALCULEES.includes(m)) return TYPES_VERIFIES.includes(preuveDe(paysId, m, profil).type);
    const n = notes[paysId]?.[m];
    if (!n || n.statut !== "verifie" || n.note === null || !n.source) return false;
    // Tu parles la langue du pays : la note vient de ta réponse, pas d'une source.
    if ((m === "langue" || m === "apprendre-langue") && parleLangueDe(paysId, profil)) return true;
    return TYPES_VERIFIES.includes(sources[n.source]?.type);
  }).length;
  const part = criteres.length ? verifies / criteres.length : 1;
  return { verifies, total: criteres.length, niveau: part >= 0.9 ? "complete" : part >= 0.6 ? "partielle" : "faible" };
}

// En dessous de cette part de critères notés, un pays ne peut pas entrer dans le top 3.
export const COUVERTURE_MIN = 0.6;
// Une donnée manquante sur une envie compte comme une note neutre.
export const ACCORD_NEUTRE = 0.5;

const estPriorite = (e: EffetActif) => e.origine.startsWith("envie:");

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
  const effets = effetsAjustes(etat, reglages);
  const ecarts = raisonsEcart(etat);
  const budget = budgetDe(etat, reglages);
  // Tes critères : chaque mesure qui compte pour toi, comptée une fois.
  const tesCriteres = [...new Set(effets.map((e) => e.mesure).filter(mesureDisponible))];
  const lignes = pays.map((p) => {
    const remonte = etat.remontes.includes(p.id);
    const details: Detail[] = [];
    const manquantes = new Set<string>();
    const neutres = new Set<string>();
    const total = { points: 0, max: 0 };
    for (const e of effets) {
      if (!mesureDisponible(e.mesure)) continue;
      if (remonte && PENALITES.includes(e.mesure)) continue;
      const note = noteEffective(p.id, e.mesure, etat.profil);
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
    return {
      fiabilite: fiabiliteDe(p.id, tesCriteres, etat.profil),
      couverture,
      peuDeDonnees: couverture < COUVERTURE_MIN || reelles === 0,
      sansDonnees: reelles === 0,
      pays: p,
      score: pct(total) ?? 0,
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
  for (const l of lignes) {
    if (!l.ecart || l.peuDeDonnees || dansTop.has(l.pays.id)) continue;
    const causes = causesEcart(l.pays, etat);
    if (causes.length !== 1 || causes[0].cause !== "limite") continue;
    const s = situationDe(causes[0].limite ?? "");
    candidats.push({ ligne: l, score: l.score, cause: "limite", phrase: `Seule ta limite «\u00a0${s?.texte ?? ""}\u00a0» écarte ce pays.`, argent: phraseArgent(l) });
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
const origineQuiParle = (d: Detail) => /^(envie|objectif|dilemme|element|limite|reglage):/.test(d.origine);
const nomObjectif = (d: Detail) => quiz.objectifs[d.origine.split(":")[1]]?.nom ?? "ton projet";
const personnel = (fait: string) => /^(Tu|Ton|Ta|Tes) /.test(fait);

function preferenceDe(d: Detail, etat: Etat): string | undefined {
  if (!d.origine.startsWith("dilemme:")) return undefined;
  return optionChoisie(etat, d.origine.split(":")[1])?.preference;
}

function phrasePour(d: Detail, fait: string): string {
  if (personnel(fait)) return `${fait}.`;
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
  const modele = typeof v === "number" && v < 2 && m.affichageSingulier ? m.affichageSingulier : m.affichage;
  const valeur = modele && typeof v === "number" ? modele.replace("{v} ", "{v}\u00a0").replace("{v}", nombreFr(v, m.decimales ?? 0)) : null;
  return { valeur, mot: m.etiquettes?.[note - 1] ?? m.mots[note - 1] };
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
    .filter((e) => mesureDisponible(e.mesure))
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
