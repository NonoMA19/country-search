// Garde les réponses dans le navigateur (sessionStorage) : aucun envoi, aucun compte, aucun cookie.
// Tout s'efface quand on ferme l'onglet.
import { useSyncExternalStore } from "react";
import { quiz } from "./donnees";
import { ETAT_VIDE, GROUPES, NIVEAUX, REGLAGES_DEFAUT, cleScene, reponsesDe, sceneDe, trouverDilemme, type Etat, type Reglages } from "./moteur";
import { pays } from "./pays";

// L'ordre du parcours : profil, priorités, dilemmes, (résultat prêt), valeurs (en option), résultat.
// « retour: "portrait" » : on vient de « Ce n'est pas moi », on revient au portrait après la réponse.
export type Etape =
  | { t: "profil"; i: number; retour?: "portrait" }
  | { t: "priorites"; retour?: "portrait" }
  | { t: "dilemmes" }
  | { t: "pret" }
  | { t: "sujets" }
  | { t: "portrait" }
  | { t: "revoir"; id: string };

// À changer si la forme de la session change : une ancienne session est alors oubliée.
export const VERSION_SESSION = 7;

export type Session = {
  v: number;
  etat: Etat;
  etape: Etape;
  reglages: Reglages;
  proposeA: number; // nombre de dilemmes répondus quand le résultat a été proposé pour la dernière fois
  ouvertes: boolean; // « Montrer seulement les portes ouvertes »
};

export const SESSION_VIDE: Session = { v: VERSION_SESSION, etat: ETAT_VIDE, etape: { t: "profil", i: 0 }, reglages: REGLAGES_DEFAUT, proposeA: -1, ouvertes: false };

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

const QUESTIONS = new Map(quiz.profil.map((q) => [q.id, new Set(q.options.map((o) => o.id))]));
const PRIORITES = new Set(quiz.priorites.map((p) => p.id));
const SUJETS = new Set(quiz.sujets.map((s) => s.id));
const DILEMMES = new Map(quiz.dilemmes.map((d) => [d.id, new Set(["passer", ...reponsesDe(d)])]));
const PAYS = new Set(pays.map((p) => p.id));
const SCENES = new Set(quiz.dilemmes.flatMap((d) => d.scenes.map((s) => cleScene(d, s))));
const CRANS = new Set(NIVEAUX);
const GROUPES_REGLAGE = new Set<string>(GROUPES.map((g) => g.id));

function profilValide(x: unknown): boolean {
  if (!estObjet(x)) return false;
  return Object.entries(x).every(([k, v]) => {
    const options = QUESTIONS.get(k);
    if (!options) return false;
    if (v === undefined || v === null) return true;
    return estTexte(v) ? options.has(v) : listeDe(v, (y) => options.has(y));
  });
}

function etatValide(x: unknown): x is Etat {
  if (!estObjet(x) || !profilValide(x.profil)) return false;
  if (!listeDe(x.priorites, (y) => PRIORITES.has(y)) || x.priorites.length > 3) return false;
  if (!listeDe(x.sujets, (y) => SUJETS.has(y))) return false;
  if (!estObjet(x.reponses)) return false;
  const reponses = x.reponses;
  if (!Object.entries(reponses).every(([k, v]) => estTexte(v) && !!DILEMMES.get(k)?.has(v))) return false;
  if (!listeDe(x.ordre, (y) => y in reponses) || x.ordre.length !== Object.keys(reponses).length) return false;
  if (!listeDe(x.remontes, (y) => PAYS.has(y))) return false;
  if (!entier(x.graine, 0) || !listeDe(x.dejaVues, (y) => SCENES.has(y))) return false;
  return listeDe(x.historique, () => true) && x.historique.length <= x.ordre.length + 1;
}

function etapeValide(x: unknown): boolean {
  if (!estObjet(x)) return false;
  if (x.retour !== undefined && x.retour !== "portrait") return false;
  if (x.t === "profil") return entier(x.i, 0) && (x.i as number) < quiz.profil.length;
  if (x.t === "revoir") return estTexte(x.id) && DILEMMES.has(x.id);
  return x.t === "priorites" || x.t === "sujets" || x.t === "dilemmes" || x.t === "pret" || x.t === "portrait";
}

function reglagesValides(x: unknown): boolean {
  if (!estObjet(x) || !estObjet(x.niveaux)) return false;
  const poidsOk = Object.entries(x.niveaux).every(([g, v]) => GROUPES_REGLAGE.has(g) && typeof v === "number" && CRANS.has(v));
  const budgetOk = x.budget === null || (typeof x.budget === "number" && Number.isFinite(x.budget) && x.budget >= 0 && x.budget <= 8000);
  return poidsOk && budgetOk;
}

export function validerSession(x: unknown): Session | null {
  if (!estObjet(x) || x.v !== VERSION_SESSION) return null;
  if (!etatValide(x.etat) || !etapeValide(x.etape) || !reglagesValides(x.reglages)) return null;
  if (!(x.proposeA === -1 || entier(x.proposeA, 0)) || typeof x.ouvertes !== "boolean") return null;
  return x as unknown as Session;
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
