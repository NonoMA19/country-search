// Garde les réponses dans le navigateur (sessionStorage) : aucun envoi, aucun compte, aucun cookie.
// Tout s'efface quand on ferme l'onglet.
import { useSyncExternalStore } from "react";
import { quiz, trouverElement } from "./donnees";
import { valeurValide } from "./elements";
import { ETAT_VIDE, GROUPES, NIVEAUX, REGLAGES_DEFAUT, cleScene, rejouer, sceneDe, trouverDilemme, type Etat, type Reglages } from "./moteur";
import { prochainAffiner, questionnaireFini } from "./parcours";
import { pays } from "./pays";

// Les écrans hors questions. « quiz » : l'élément suivant du parcours (src/lib/parcours.ts).
// « transition » : l'écran d'ouverture d'un chapitre. « revoir » : un élément rouvert depuis le portrait.
// « affiner » : « Continuer pour affiner », un élément de plus des chapitres 3 et 4.
export type Etape =
  | { t: "quiz" }
  | { t: "transition"; chapitre: number }
  | { t: "intuition" }
  | { t: "portrait"; fin?: boolean } // fin : « Tu as répondu à tout. Ton portrait est à jour. »
  | { t: "revoir"; id: string; retour?: "intuition" } // retour : l'écran où revenir après (sinon le portrait)
  | { t: "affiner" };

// À changer si la forme de la session change : une ancienne session est alors oubliée.
export const VERSION_SESSION = 11; // prompt 8 : critères classés, « second plan » et « Tes 3 libertés » retirés

export type Session = {
  v: number;
  etat: Etat;
  etape: Etape;
  reglages: Reglages;
  ouvertes: boolean; // « Montrer seulement les portes ouvertes »
  chapitresVus: number[]; // chapitres dont l'écran d'ouverture a été vu
};

export const SESSION_VIDE: Session = { v: VERSION_SESSION, etat: ETAT_VIDE, etape: { t: "quiz" }, reglages: REGLAGES_DEFAUT, ouvertes: false, chapitresVus: [] };

// Ancien nom de code gardé exprès : changer la clé ferait perdre les quiz en cours.
const CLE = "country-search:quiz";
let courant: Session | null = null;
const ecouteurs = new Set<() => void>();

// ---------- Lecture prudente ----------
// Une session abîmée (modifiée à la main, ancienne version, autre site) ne doit jamais
// faire planter la page : au moindre doute, on repart d’une session vide.
type Objet = Record<string, unknown>;
const estObjet = (x: unknown): x is Objet => typeof x === "object" && x !== null && !Array.isArray(x);
const estTexte = (x: unknown): x is string => typeof x === "string";
const listeDe = (x: unknown, ok: (y: string) => boolean): x is string[] => Array.isArray(x) && x.every((y) => estTexte(y) && ok(y));
const entier = (x: unknown, min: number) => typeof x === "number" && Number.isInteger(x) && x >= min;

const PAYS = new Set(pays.map((p) => p.id));
const SCENES = new Set(quiz.dilemmes.flatMap((d) => d.scenes.map((s) => cleScene(d, s))));
const CRANS = new Set(NIVEAUX);
const GROUPES_REGLAGE = new Set<string>(GROUPES.map((g) => g.id));

// Chaque réponse doit correspondre au format de son élément (voir valeurValide).
function etatValide(x: unknown): x is Etat {
  if (!estObjet(x) || !estObjet(x.reponses)) return false;
  const reponses = x.reponses;
  if (!Object.entries(reponses).every(([k, v]) => { const el = trouverElement(k); return !!el && valeurValide(el, v); })) return false;
  if (!listeDe(x.ordre, (y) => y in reponses) || x.ordre.length !== Object.keys(reponses).length || new Set(x.ordre).size !== x.ordre.length) return false;
  if (!listeDe(x.remontes, (y) => PAYS.has(y))) return false;
  if (!entier(x.graine, 0) || !listeDe(x.dejaVues, (y) => SCENES.has(y))) return false;
  return listeDe(x.historique, () => true) && x.historique.length <= x.ordre.length + 1;
}

function etapeValide(x: unknown): boolean {
  if (!estObjet(x)) return false;
  if (x.t === "revoir") return estTexte(x.id) && !!trouverElement(x.id) && (x.retour === undefined || x.retour === "intuition");
  if (x.t === "transition") return entier(x.chapitre, 1) && (x.chapitre as number) <= quiz.chapitres.length;
  if (x.t === "portrait") return x.fin === undefined || typeof x.fin === "boolean";
  return x.t === "quiz" || x.t === "intuition" || x.t === "affiner";
}

function reglagesValides(x: unknown): boolean {
  if (!estObjet(x) || !estObjet(x.niveaux)) return false;
  const poidsOk = Object.entries(x.niveaux).every(([g, v]) => GROUPES_REGLAGE.has(g) && typeof v === "number" && CRANS.has(v));
  const budgetOk = x.budget === null || (typeof x.budget === "number" && Number.isFinite(x.budget) && x.budget >= 0 && x.budget <= 15000);
  return poidsOk && budgetOk;
}

export function validerSession(x: unknown): Session | null {
  if (!estObjet(x) || x.v !== VERSION_SESSION) return null;
  if (!etatValide(x.etat) || !etapeValide(x.etape) || !reglagesValides(x.reglages)) return null;
  if (typeof x.ouvertes !== "boolean" || !Array.isArray(x.chapitresVus) || !x.chapitresVus.every((c) => entier(c, 1))) return null;
  // Le profil et l'historique sont recalculés depuis les réponses : jamais lus tels quels.
  const session = { ...(x as unknown as Session), etat: rejouer(x.etat as Etat) };
  // « Continuer pour affiner » alors qu'il ne reste plus rien à affiner : on revient au portrait (jamais une page vide).
  if (session.etape.t === "affiner" && prochainAffiner(session.etat) === null) session.etape = { t: "portrait", fin: true };
  return session;
}

// Une nouvelle session : une graine tirée au hasard. « dejaVues » : les scènes des parcours précédents,
// pour ne pas te reposer la même scène quand tu recommences (on repart de zéro quand tu les as toutes vues).
const nouvelleGraine = () => Math.floor(Math.random() * 2 ** 31);
export function nouvelleSession(dejaVues: string[] = []): Session {
  const toutes = dejaVues.length >= SCENES.size ? [] : dejaVues;
  return { ...SESSION_VIDE, etat: { ...ETAT_VIDE, graine: nouvelleGraine(), dejaVues: toutes } };
}
// Les scènes montrées dans ce parcours (réponses et « Passer » compris).
export const scenesVues = (e: Etat) => e.ordre.flatMap((id) => {
  const d = trouverDilemme(id);
  return d ? [cleScene(d, sceneDe(d, e))] : [];
});

function lire(): Session {
  if (courant) return courant;
  try {
    const brut = window.sessionStorage.getItem(CLE);
    courant = (brut ? validerSession(JSON.parse(brut)) : null) ?? nouvelleSession();
  } catch {
    courant = nouvelleSession();
  }
  return courant;
}

export function ecrire(s: Session) {
  courant = s;
  try {
    window.sessionStorage.setItem(CLE, JSON.stringify(s));
  } catch {
    // Stockage indisponible (navigation privée stricte) : on garde tout en mémoire.
  }
  ecouteurs.forEach((f) => f());
}

export const modifier = (f: (s: Session) => Session) => ecrire(f(lire()));
// Pages d'erreur : revenir au portrait si le quiz est fini, sinon à l'écran en cours du quiz.
export const revenirAuPortrait = () => modifier((s) => ({ ...s, etape: questionnaireFini(s.etat) ? { t: "portrait" } : { t: "quiz" } }));
export const recommencer = () => {
  const e = lire().etat;
  ecrire(nouvelleSession([...new Set([...e.dejaVues, ...scenesVues(e)])]));
};

function abonner(f: () => void) {
  ecouteurs.add(f);
  return () => ecouteurs.delete(f);
}

// Renvoie null tant que la page n'est pas chargée dans le navigateur.
export function useSession(): Session | null {
  return useSyncExternalStore(abonner, lire, () => null);
}
