// Le parcours du quiz : quel écran vient ensuite.
// Chapitres 1, 2 et 5 : toujours complets, dans l'ordre de la banque (sauf conditions d'apparition).
// Chapitres 3 et 4 : adaptatifs, chacun de 4 à 7 écrans, choisis selon tes réponses (voir prochainAdaptatif).
// Tout se déduit des réponses : « Retour » et le rechargement de la page donnent le même écran.
import { quiz, trouverElement, type EffetDilemme, type Element, type PhraseSwipe, type Situation, type Swipe, type TriLimites } from "./donnees";
import { PASSER, conditionRemplie } from "./elements";
import { calculer, dilemmeActif, hacher, limiteTouche, utiliteEffets, reponsesStables, type Etat, type Ligne } from "./moteur";

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
// Remplacée au lot 3 par la vraie certitude du profil.
let certitudeFaible: (el: Element, etat: Etat) => boolean = () => false;
export const brancherCertitude = (f: (el: Element, etat: Etat) => boolean) => { certitudeFaible = f; };

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
export type ScorePhrase = (p: PhraseSwipe, etat: Etat, top: Ligne[]) => number;
let scorePhrase: ScorePhrase = (p, etat, top) => 0.1 + utiliteEffets([p.oui, p.non], etat, top);
export const brancherScorePhrase = (f: ScorePhrase) => { scorePhrase = f; };

export function phrasesSwipe(el: Swipe, etat: Etat): PhraseSwipe[] {
  const deja = etat.reponses[el.id];
  if (deja && typeof deja === "object" && !Array.isArray(deja)) {
    const ids = Object.keys(deja);
    return el.phrases.filter((p) => ids.includes(p.id));
  }
  const precedent = dimensionsPrecedentes(etat, el.id);
  const top = topCourant(etat);
  const notes = el.phrases
    .filter((p) => !p.dimensions.some((d) => precedent.includes(d)))
    .map((p) => ({ p, s: scorePhrase(p, etat, top) * (0.75 + 0.5 * ((hacher(etat.graine, `phrase:${p.id}`) % 1000) / 1000)) }))
    .sort((a, b) => b.s - a.s);
  // Pas deux phrases sur exactement les mêmes dimensions quand on peut l'éviter.
  const res: PhraseSwipe[] = [];
  const vues = new Set<string>();
  for (const { p } of notes) {
    const cle = p.dimensions.join("+");
    if (vues.has(cle)) continue;
    vues.add(cle); res.push(p);
    if (res.length === el.nombre) return res;
  }
  for (const { p } of notes) if (!res.includes(p) && res.length < el.nombre) res.push(p);
  return res;
}

// ---------- Tes limites : 6 situations parmi 8 ----------
// D'abord celles qui touchent le plus de pays parmi tes 10 premiers (elles peuvent changer ton classement),
// puis les autres. À égalité, la graine du parcours décide.
export function situationsLimites(el: TriLimites, etat: Etat): Situation[] {
  const deja = etat.reponses[el.id];
  if (deja && typeof deja === "object" && !Array.isArray(deja)) {
    const ids = Object.keys(deja);
    return el.situations.filter((s) => ids.includes(s.id));
  }
  const dix = topCourant(etat, 10);
  return el.situations
    .map((s) => ({ s, n: dix.filter((l) => limiteTouche(s.id, l.pays.id, etat.profil)).length, h: hacher(etat.graine, `limite:${s.id}`) }))
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
export type Selection = (etat: Etat, c: number, candidats: Element[]) => Candidat[];
// Le score d'un élément (lot 1 : à quel point il départage tes 5 premiers pays ; lot 4 : voir selection.ts).
let selection: Selection = (etat, _c, candidats) => {
  const top = topCourant(etat);
  return candidats.map((el) => ({ el, score: 0.1 + utiliteEffets(reponsesPossibles(el, etat), etat, top) }));
};
export const brancherSelection = (f: Selection) => { selection = f; };
let chapitreFini: (etat: Etat, c: number, restants: Element[]) => boolean = (etat, c, restants) => {
  const n = vusDans(etat, c).length;
  if (restants.length === 0 || n >= MAX_ADAPTATIF(c)) return true;
  return n >= MIN_ADAPTATIF(c) && reponsesStables(etat, (id) => chapitreDe(id) === c) >= 2;
};
export const brancherFinChapitre = (f: typeof chapitreFini) => { chapitreFini = f; };

export const PART_MEILLEUR = 0.6;
export function candidatsAdaptatifs(etat: Etat, chapitres: number[]): Element[] {
  return quiz.elements.filter((el) => chapitres.includes(el.chapitre) && etat.reponses[el.id] === undefined && elementVisible(el, etat));
}

// Tirage au hasard (graine stable) parmi les éléments à au moins 60 % du meilleur score.
export function tirer(etat: Etat, candidats: Candidat[], cle: string): Element | null {
  if (!candidats.length) return null;
  const max = Math.max(...candidats.map((x) => x.score));
  const proches = candidats.filter((x) => x.score >= PART_MEILLEUR * max - 1e-12);
  return proches[hacher(etat.graine, cle) % proches.length].el;
}

function prochainAdaptatif(etat: Etat, c: number): Element | null {
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
    const el = quiz.elements.find((x) => x.chapitre === ch.numero && etat.reponses[x.id] === undefined && elementVisible(x, etat));
    if (el) return el;
  }
  return null;
}

export const questionnaireFini = (etat: Etat) => etat.reponses.limites !== undefined && prochainElement(etat) === null;

// « Continuer pour affiner » : un élément de plus des chapitres 3 et 4, sans limite de nombre.
export function prochainAffiner(etat: Etat): Element | null {
  const restants = candidatsAdaptatifs(etat, [3, 4]);
  return tirer(etat, selection(etat, 0, restants), `affiner:${etat.ordre.length}`);
}

// Le nombre d'écrans d'un parcours (les écrans de transition et le portrait ne comptent pas).
export const nombreEcrans = (etat: Etat) => etat.ordre.length;
