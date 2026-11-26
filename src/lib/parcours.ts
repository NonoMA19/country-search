// Le parcours du quiz : quel écran vient ensuite.
// Chapitres 1, 2 et 5 : toujours complets, dans l'ordre de la banque (sauf conditions d'apparition).
// Chapitres 3 et 4 : adaptatifs, chacun de 4 à 7 écrans, choisis selon tes réponses (voir prochainAdaptatif).
// Tout se déduit des réponses : « Retour » et le rechargement de la page donnent le même écran.
import { dimensionDe, quiz, trouverElement, type EffetDilemme, type Element, type PhraseSwipe, type Situation, type Swipe, type TriLimites } from "./donnees";
import { PASSER, conditionRemplie, profilDe, relanceOuverte } from "./elements";
import { certitudeFaible, construireProfil } from "./profil";
import { calculer, dilemmeActif, enviesDe, poidsEnvie, hacher, limiteTouche, situationPosable, utiliteEffets, reponsesStables, type Etat, type Ligne } from "./moteur";

export const chapitreDe = (id: string) => trouverElement(id)?.chapitre ?? 0;
export const CHAPITRES = quiz.chapitres;
export const NB_CHAPITRES = CHAPITRES.length;
const infoChapitre = (c: number) => CHAPITRES.find((x) => x.numero === c)!;
export const estAdaptatif = (c: number) => !!infoChapitre(c)?.adaptatif;
export const MIN_ADAPTATIF = (c: number) => infoChapitre(c)?.min ?? 4;
export const MAX_ADAPTATIF = (c: number) => infoChapitre(c)?.max ?? 7;

export const topCourant = (etat: Etat, n = 5): Ligne[] => calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, n);

// ---------- Un élément peut-il être posé ? ----------
export function elementVisible(el: Element, etat: Etat): boolean {
  if (!conditionRemplie(el.condition, etat.profil)) return false;
  if (!relanceOuverte(el, etat.reponses)) return false;
  // Les critères en trois temps : le plus dur à sacrifier (2 critères ou plus), le second plan (3 ou plus).
  const nbCriteres = Array.isArray(etat.reponses.envies) ? etat.reponses.envies.length : 0;
  if (el.type === "choix-cartes" && el.source === "envies-choisies") return nbCriteres >= 2;
  if (el.type === "choix-cartes" && el.source === "envies-second") return nbCriteres >= 3;
  if (el.type === "choix-cartes" && el.source === "envies-restantes") return etat.reponses.envies !== undefined;
  // Une famille de limites n'est posée que si une de ses situations touche un de tes 10 premiers pays :
  // sinon, elle ne pourrait rien changer (elle est citée dans « Ce qu'on ne t'a pas demandé »).
  if (el.type === "tri-limites") return situationsLimites(el, etat).length > 0;
  if (el.type === "dilemme") {
    if (!dilemmeActif(el)) return false;
    if (!conditionRemplie(el.afficheSi, etat.profil)) return false;
  }
  // Le classement range les envies choisies : pas d'envies, pas de classement.
  if (el.type === "classement") return Array.isArray(etat.reponses.envies) && etat.reponses.envies.length > 1;
  // « Déjà couvert par » : si l'élément cité a été répondu, celui-ci n'est posé que si la certitude reste faible (lot 3).
  if (el.dejaCouvertPar?.some((id) => etat.reponses[id] !== undefined && etat.reponses[id] !== PASSER) && !certitudeFaible(el, etat)) return false;
  return true;
}

// Les réponses possibles d'un élément, en effets : pour mesurer à quel point il départagerait les pays.
export function reponsesPossibles(el: Element, etat: Etat): EffetDilemme[][] {
  switch (el.type) {
    case "dilemme": return el.options.map((o) => o.effets);
    case "choix-cartes": return el.profil || el.source ? [] : el.options.map((o) => o.effets ?? []);
    case "curseur": return [el.gauche.effets, el.droite.effets];
    case "ambiances": return el.options.map((o) => o.effets);
    case "swipe": return phrasesSwipe(el, etat).flatMap((p) => [p.oui, p.non]);
    default: return [];
  }
}

// ---------- La série de phrases (swipe) : 5 phrases parmi 15 ----------
// Celles qui départagent le plus tes 5 premiers pays, avec un peu de hasard (graine du parcours),
// jamais sur la dimension de l'écran précédent. Toujours les mêmes pour le même état.
// Une phrase vaut d'être posée si sa dimension compte pour toi, reste incertaine, et départage tes 5 premiers pays.
const scorePhrase = (p: PhraseSwipe, etat: Etat, top: Ligne[]) =>
  Math.max(0, ...p.dimensions.map((d) => importance(d, etat) * incertitude(d, etat) * repetition(d, etat))) * (0.15 + utiliteEffets([p.oui, p.non], etat, top));

export function phrasesSwipe(el: Swipe, etat: Etat): PhraseSwipe[] {
  const deja = etat.reponses[el.id];
  if (deja && typeof deja === "object" && !Array.isArray(deja)) {
    // Dans l'ordre où elles ont été vues (l'ordre des réponses), pour les revoir à l'identique.
    return Object.keys(deja).map((id) => el.phrases.find((p) => p.id === id)).filter((p): p is PhraseSwipe => !!p);
  }
  // Passée : les phrases montrées à ce moment-là (l'état d'avant).
  if (deja !== undefined) return phrasesSwipe(el, etatAvant(etat, el.id));
  // Ta carte ne coche que des régions hors d'Europe : la phrase « dépaysement » entre dans la série (en plus du petit bonus de la carte).
  const carte = etat.reponses.carte;
  const horsEurope = Array.isArray(carte) && carte.length > 0 && !carte.includes("europe") && !carte.includes("aucune");
  const imposee = horsEurope ? el.phrases.find((p) => p.id === "S16") : undefined;
  const precedent = dimensionsPrecedentes(etat, el.id);
  const top = topCourant(etat);
  const notes = el.phrases
    .filter((p) => !p.dimensions.some((d) => precedent.includes(d)))
    .map((p) => ({ p, s: scorePhrase(p, etat, top) * (0.5 + ((hacher(etat.graine, `phrase:${p.id}`) % 1000) / 1000)) }))
    .sort((a, b) => b.s - a.s);
  // Pas deux phrases sur exactement les mêmes dimensions quand on peut l'éviter.
  const res: PhraseSwipe[] = imposee ? [imposee] : [];
  const vues = new Set<string>(imposee ? [imposee.dimensions.join("+")] : []);
  for (const { p } of notes) {
    const cle = p.dimensions.join("+");
    if (vues.has(cle) || res.includes(p)) continue;
    vues.add(cle); res.push(p);
    if (res.length === el.nombre) return res;
  }
  for (const { p } of notes) if (!res.includes(p) && res.length < el.nombre) res.push(p);
  return res;
}

// L'état juste avant qu'un élément soit montré.
export function etatAvant(etat: Etat, id: string): Etat {
  const k = etat.ordre.indexOf(id);
  if (k < 0) return etat;
  const ordre = etat.ordre.slice(0, k);
  const reponses = Object.fromEntries(ordre.map((x) => [x, etat.reponses[x]]));
  return { ...etat, ordre, reponses, profil: profilDe(reponses), historique: etat.historique.slice(0, k + 1) };
}

// ---------- Tes limites : 6 situations parmi 8 ----------
// D'abord celles qui touchent le plus de pays parmi tes 10 premiers (elles peuvent changer ton classement),
// puis les autres. À égalité, la graine du parcours décide.
// Une famille de limites : ses situations posables à ton profil qui touchent au moins un de tes 10 premiers pays
// (les autres ne pourraient rien changer). Dans l'ordre de la banque.
export function situationsLimites(el: TriLimites, etat: Etat): Situation[] {
  const deja = etat.reponses[el.id];
  if (deja && typeof deja === "object" && !Array.isArray(deja)) {
    const ids = Object.keys(deja);
    return el.situations.filter((s) => ids.includes(s.id));
  }
  if (deja !== undefined) return situationsLimites(el, etatAvant(etat, el.id));
  const dix = topCourant(etat, 10);
  return el.situations
    .filter((s) => situationPosable(s.id, etat.profil))
    .map((s) => ({ s, n: dix.filter((l) => limiteTouche(s.id, l.pays.id, etat.profil)).length, h: hacher(etat.graine, `limite:${s.id}`) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.h - b.h)
    .slice(0, el.nombre)
    .map((x) => x.s)
    .sort((a, b) => el.situations.indexOf(a) - el.situations.indexOf(b));
}

// Les dimensions de l'écran précédent (pour ne jamais poser deux fois de suite la même chose).
export function dimensionsPrecedentes(etat: Etat, sauf?: string): string[] {
  const id = [...etat.ordre].reverse().find((x) => x !== sauf);
  const el = id ? trouverElement(id) : undefined;
  if (!el || !estAdaptatif(el.chapitre)) return [];
  if (el.type === "swipe") return phrasesSwipe(el, etat).flatMap((p) => p.dimensions);
  return el.dimensions;
}

// ---------- Les chapitres adaptatifs ----------
export const vusDans = (etat: Etat, c: number) => etat.ordre.filter((id) => chapitreDe(id) === c);

export type Candidat = { el: Element; score: number };

// ---------- Le score d'un élément (lot 4) ----------
// score = importance de la dimension pour toi × incertitude de la dimension × capacité à départager ton top 5.
// - Importance : 1, plus le poids de l'envie qui la vise (2 à 1,1 selon son rang), plus 0,5 si ton projet la vise,
//   plus 0,5 pour ton secteur s'il est choisi.
// - Incertitude : certitude faible = 1 ; moyenne = 0,5 ; forte = 0,2.
// - Une dimension déjà mesurée deux fois (ou plus) compte 0,3 fois.
// - Départage : l'écart que les réponses possibles creuseraient entre tes 5 premiers pays (0 à 4), plus 0,15.
export function importance(d: string, etat: Etat): number {
  let imp = 1;
  for (const id of enviesDe(etat)) {
    const en = quiz.envies.find((e) => e.id === id);
    const poids = poidsEnvie(etat, id);
    if (en?.mesures.some((m) => (dimensionDe[m] ?? m) === d)) imp = Math.max(imp, 1 + poids);
  }
  const obj = typeof etat.profil.objectif === "string" ? quiz.objectifs[etat.profil.objectif] : undefined;
  if (obj?.effets.some((e) => e.mesures.some((m) => (dimensionDe[m] ?? m) === d))) imp += 0.5;
  if (d === "secteur" && conditionRemplie("secteur-choisi", etat.profil)) imp += 0.5;
  return imp;
}
const INCERTITUDE = { faible: 1, moyenne: 0.5, forte: 0.2 };
export const incertitude = (d: string, etat: Etat) => INCERTITUDE[construireProfil(etat)[d]?.certitude ?? "faible"];
// Le nombre d'écrans adaptatifs déjà répondus qui touchent cette dimension.
export const mesuree = (d: string, etat: Etat) =>
  etat.ordre.filter((id) => { const el = trouverElement(id)!; return estAdaptatif(el.chapitre) && etat.reponses[id] !== PASSER && dimensionsElement(el, etat).includes(d); }).length;
const repetition = (d: string, etat: Etat) => (mesuree(d, etat) >= 2 ? 0.3 : 1);

// Les dimensions d'un élément (pour la série de phrases : celles des 5 phrases tirées).
export function dimensionsElement(el: Element, etat: Etat): string[] {
  if (el.type === "swipe") return [...new Set(phrasesSwipe(el, etat).flatMap((p) => p.dimensions))];
  return el.dimensions;
}

const interetDims = (dims: string[], etat: Etat) => Math.max(0.05, ...dims.map((d) => importance(d, etat) * incertitude(d, etat) * repetition(d, etat)));
export function scoreElement(el: Element, etat: Etat, top: Ligne[]): number {
  // La série de phrases : la moyenne de ses 5 phrases (sinon elle passerait presque toujours en premier).
  if (el.type === "swipe") {
    const ps = phrasesSwipe(el, etat);
    return ps.reduce((a, p) => a + interetDims(p.dimensions, etat) * (0.15 + utiliteEffets([p.oui, p.non], etat, top)), 0) / Math.max(1, ps.length);
  }
  const interet = interetDims(el.dimensions, etat);
  return interet * (0.15 + utiliteEffets(reponsesPossibles(el, etat), etat, top));
}

// ---------- Les règles (lot 4) ----------
// 1. Jamais deux éléments de suite sur la même dimension.
// 2. Jamais quatre fois de suite le même format dans un chapitre.
// 3. Au moins un élément de chaque thème du chapitre, et les éléments obligatoires (ambiances, phrases) :
//    quand il ne reste avant le 4e écran que juste assez de place pour eux (ou après le 4e écran), seuls eux sont proposés.
// Une règle qui ne laisserait aucun élément est levée (la suivante reste appliquée).
const themesDu = (etat: Etat, c: number) => new Set(quiz.elements.filter((x) => x.chapitre === c && (etat.reponses[x.id] !== undefined || elementVisible(x, etat))).map((x) => x.theme));
export function besoinsChapitre(etat: Etat, c: number) {
  const vus = vusDans(etat, c).map((id) => trouverElement(id)!);
  const themesVus = new Set(vus.map((x) => x.theme));
  const obligatoires = quiz.elements.filter((x) => x.chapitre === c && x.obligatoire && etat.reponses[x.id] === undefined && elementVisible(x, etat));
  const themes = [...themesDu(etat, c)].filter((t) => !themesVus.has(t) && !obligatoires.some((o) => o.theme === t));
  return { obligatoires, themes, n: vus.length };
}

function respecteRegles(x: Element, etat: Etat, c: number): boolean {
  const avant = dimensionsPrecedentes(etat);
  if (dimensionsElement(x, etat).some((d) => avant.includes(d))) return false;
  const derniers = vusDans(etat, c).slice(-3).map((id) => trouverElement(id)!.type);
  return !(derniers.length === 3 && new Set(derniers).size === 1 && x.type === derniers[0]);
}

function filtrer(etat: Etat, c: number, candidats: Element[]): Element[] {
  let liste = candidats;
  const garder = (f: (x: Element) => boolean) => { const l = liste.filter(f); if (l.length) liste = l; };
  // Règle 1 : pas la même dimension que l'écran précédent.
  const avant = dimensionsPrecedentes(etat);
  if (avant.length) garder((x) => !dimensionsElement(x, etat).some((d) => avant.includes(d)));
  // Règle 2 : pas un 4e format identique de suite dans le chapitre.
  const derniers = vusDans(etat, c).slice(-3).map((id) => trouverElement(id)!.type);
  if (derniers.length === 3 && new Set(derniers).size === 1) garder((x) => x.type !== derniers[0]);
  // Anticipation : après 2 écrans du même format, si les autres formats se font rares (2 éléments ou moins), on en pose un
  // tout de suite, pour ne pas se retrouver sans autre choix qu'un 4e écran identique.
  const deux = derniers.slice(-2);
  if (deux.length === 2 && deux[0] === deux[1]) {
    const autres = liste.filter((x) => x.type !== deux[0]);
    if (autres.length > 0 && candidats.filter((x) => x.type !== deux[0]).length <= 2) liste = autres;
  }
  // Règle 3 : il reste juste assez de place pour les thèmes manquants et les obligatoires (avant le 4e écran : on vise 4 écrans ; ensuite, tout de suite).
  const { obligatoires, themes, n } = besoinsChapitre(etat, c);
  // Une marge d'un écran : si l'élément attendu touche la même dimension que l'écran précédent, on pose d'abord
  // un élément qui ne la touche pas, pour qu'il puisse venir juste après.
  const restant = (n < MIN_ADAPTATIF(c) ? MIN_ADAPTATIF(c) : n) - n;
  const attendu = (x: Element) => obligatoires.includes(x) || themes.includes(x.theme);
  if (c > 0 && restant <= obligatoires.length + themes.length + 1) {
    const prets = liste.filter(attendu);
    if (prets.length) liste = prets;
    else {
      const dimsAttendues = candidats.filter(attendu).flatMap((x) => dimensionsElement(x, etat));
      garder((x) => !dimensionsElement(x, etat).some((d) => dimsAttendues.includes(d)));
    }
  }
  return liste;
}

function selection(etat: Etat, c: number, candidats: Element[]): Candidat[] {
  const top = topCourant(etat);
  return filtrer(etat, c, candidats).map((el) => ({ el, score: scoreElement(el, etat, top) }));
}

// ---------- Fin d'un chapitre adaptatif ----------
// Jamais avant 4 écrans, toujours à 7. Entre les deux : quand les éléments obligatoires et un élément de chaque thème
// sont passés, que les dimensions importantes pour toi (importance plus de 1) que ce chapitre peut mesurer
// ont une certitude au moins moyenne, et que ton top 3 n'a pas bougé pendant les 2 dernières réponses du chapitre.
export const STABILITE_CHAPITRE = 1;
export function chapitreFini(etat: Etat, c: number, restants: Element[]): boolean {
  const { obligatoires, themes, n } = besoinsChapitre(etat, c);
  if (restants.length === 0 || n >= MAX_ADAPTATIF(c)) return true;
  if (n < MIN_ADAPTATIF(c)) return false;
  if (obligatoires.length || themes.length) return false;
  // Plus aucun élément ne respecte les règles 1 et 2 (autre dimension, autre format) : le chapitre s'arrête là.
  if (!restants.some((x) => respecteRegles(x, etat, c))) return true;
  const dims = new Set(quiz.elements.filter((x) => x.chapitre === c && elementVisible(x, etat)).flatMap((x) => x.dimensions));
  const profil = construireProfil(etat);
  const importantes = [...dims].filter((d) => importance(d, etat) > 1);
  if (importantes.some((d) => profil[d]?.certitude === "faible")) return false;
  return reponsesStables(etat, (id) => chapitreDe(id) === c) >= STABILITE_CHAPITRE;
}

export const PART_MEILLEUR = 0.6;
// Les relances ne sont jamais tirées au hasard : elles viennent juste après l'élément qu'elles prolongent.
export function candidatsAdaptatifs(etat: Etat, chapitres: number[]): Element[] {
  return quiz.elements.filter((el) => chapitres.includes(el.chapitre) && !el.relanceDe && etat.reponses[el.id] === undefined && elementVisible(el, etat));
}
// La relance de la dernière réponse, si elle s'ouvre (« Et si… l'autre offre s'améliorait ? »).
export function relanceEnAttente(etat: Etat): Element | null {
  const dernier = etat.ordre.at(-1);
  if (!dernier) return null;
  return quiz.elements.find((el) => el.relanceDe?.element === dernier && etat.reponses[el.id] === undefined && elementVisible(el, etat)) ?? null;
}

// Tirage au hasard (graine stable) parmi les éléments à au moins 60 % du meilleur score.
export function tirer(etat: Etat, candidats: Candidat[], cle: string): Element | null {
  if (!candidats.length) return null;
  const max = Math.max(...candidats.map((x) => x.score));
  const proches = candidats.filter((x) => x.score >= PART_MEILLEUR * max - 1e-12);
  return proches[hacher(etat.graine, cle) % proches.length].el;
}

function prochainAdaptatif(etat: Etat, c: number): Element | null {
  const relance = relanceEnAttente(etat);
  if (relance && relance.chapitre === c) return relance;
  const restants = candidatsAdaptatifs(etat, [c]);
  if (chapitreFini(etat, c, restants)) return null;
  return tirer(etat, selection(etat, c, restants), `chapitre:${c}:${vusDans(etat, c).length}`);
}

// L'écran suivant. null : le questionnaire est fini (tes limites sont triées).
export function prochainElement(etat: Etat): Element | null {
  for (const ch of CHAPITRES) {
    if (estAdaptatif(ch.numero)) {
      // Un chapitre adaptatif déjà quitté (le suivant a commencé) ne reprend pas.
      if (etat.ordre.some((id) => chapitreDe(id) > ch.numero)) continue;
      const el = prochainAdaptatif(etat, ch.numero);
      if (el) return el;
      continue;
    }
    // Dans l'ordre de la banque, jamais en arrière : un élément sauté (non visible à son tour) n'est pas reposé plus tard.
    const duChapitre = quiz.elements.filter((x) => x.chapitre === ch.numero);
    const dernier = Math.max(-1, ...duChapitre.map((x, i) => (etat.reponses[x.id] !== undefined ? i : -1)));
    const el = duChapitre.find((x, i) => i > dernier && etat.reponses[x.id] === undefined && elementVisible(x, etat));
    if (el) return el;
  }
  return null;
}

export const questionnaireFini = (etat: Etat) => etat.ordre.some((id) => chapitreDe(id) === NB_CHAPITRES) && prochainElement(etat) === null;

// « Continuer pour affiner » : un élément de plus des chapitres 3 et 4, sans limite de nombre.
// Le nombre de questions qui restent à affiner (chapitres 3 et 4).
export const restantsAffiner = (etat: Etat) => {
  const relance = relanceEnAttente(etat);
  return candidatsAdaptatifs(etat, [3, 4]).length + (relance && estAdaptatif(relance.chapitre) ? 1 : 0);
};

export function prochainAffiner(etat: Etat): Element | null {
  const relance = relanceEnAttente(etat);
  if (relance && estAdaptatif(relance.chapitre)) return relance;
  const restants = candidatsAdaptatifs(etat, [3, 4]);
  return tirer(etat, selection(etat, 0, restants), `affiner:${etat.ordre.length}`);
}

// Résultat provisoire : tant que tes envies manquent, ou que moins de 3 écrans des chapitres 3 et 4 ont une vraie réponse.
export const RESULTAT_PROVISOIRE_MIN = 3;
export function resultatProvisoire(etat: Etat): boolean {
  if (enviesDe(etat).length === 0) return true;
  return etat.ordre.filter((id) => estAdaptatif(chapitreDe(id)) && etat.reponses[id] !== PASSER).length < RESULTAT_PROVISOIRE_MIN;
}

// Le nombre d'écrans d'un parcours (les écrans de transition et le portrait ne comptent pas).
// Un élément montré dans le même écran qu'un autre (le projet, avec la motivation) ne compte pas en plus.
export const nombreEcrans = (etat: Etat) => etat.ordre.filter((id) => { const m = trouverElement(id)?.memeEcranQue; return !m || !etat.ordre.includes(m); }).length;

// ---------- « Ce qu'on ne t'a pas demandé, et pourquoi » ----------
// Chaque élément de la banque qui n'a pas été posé, avec sa raison, regroupé par raison (écran final du questionnaire).
export type NonDemande = { raison: string; titres: string[] };
const titreCourt = (el: Element) => (el.type === "tri-limites" ? `Tes limites sur ${el.famille ?? el.theme}` : el.titre.replace(/\s*\?$/, ""));
export function nonDemandes(etat: Etat): NonDemande[] {
  const groupes = new Map<string, string[]>();
  const noter = (raison: string, el: Element) => groupes.set(raison, [...(groupes.get(raison) ?? []), titreCourt(el)]);
  for (const el of quiz.elements) {
    if (etat.reponses[el.id] !== undefined) continue;
    if (el.relanceDe && !relanceOuverte(el, etat.reponses)) { noter("Une question de suite, qui ne se pose qu’après certaines réponses : tes réponses ne l’ont pas ouverte.", el); continue; }
    if (!conditionRemplie(el.condition, etat.profil) || (el.type === "dilemme" && !conditionRemplie(el.afficheSi, etat.profil))) { noter("Elle ne concerne pas ton profil (ton projet, ton secteur, tes langues).", el); continue; }
    if (el.type === "dilemme" && !dilemmeActif(el)) { noter("Pas assez de données pays pour qu’elle compte.", el); continue; }
    if (el.type === "tri-limites") { noter("Aucune de ces limites ne touchait tes 10 premiers pays : elles n’auraient rien changé.", el); continue; }
    if (el.type === "choix-cartes" && el.source?.startsWith("envies")) { noter("Tu as choisi trop peu de critères pour qu’on te la pose.", el); continue; }
    if (estAdaptatif(el.chapitre)) {
      if (el.dejaCouvertPar?.some((id) => etat.reponses[id] !== undefined)) noter("Une autre de tes réponses disait déjà la même chose.", el);
      else noter("Elle aurait peu départagé tes premiers pays : on a préféré des questions plus utiles pour toi.", el);
      continue;
    }
    noter("Elle n’était pas utile à ce moment du parcours.", el);
  }
  return [...groupes].map(([raison, titres]) => ({ raison, titres: [...new Set(titres)] }));
}
