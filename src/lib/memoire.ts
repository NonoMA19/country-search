// Garde les réponses dans le navigateur (sessionStorage) : aucun envoi, aucun compte, aucun cookie.
// Tout s'efface quand on ferme l'onglet.
import { useSyncExternalStore } from "react";
import { quiz } from "./donnees";
import { ETAT_VIDE, REGLAGES_DEFAUT, type Etat, type Reglages } from "./moteur";
import { pays } from "./pays";

export type Etape = { t: "profil"; i: number } | { t: "priorites" } | { t: "sujets" } | { t: "phrases" } | { t: "pret" };

// À changer si la forme de la session change : une ancienne session est alors oubliée.
export const VERSION_SESSION = 3;

export type Session = {
  v: number;
  etat: Etat;
  etape: Etape;
  reglages: Reglages;
  proposeA: number; // nombre de phrases vues quand le résultat a été proposé pour la dernière fois
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
const PHRASES = new Map(quiz.phrases.map((p) => [p.id, new Set(["oui", "non", "passer", ...(p.options ?? []).map((o) => o.id)])]));
const PAYS = new Set(pays.map((p) => p.id));
const CRANS = new Set([0, 0.5, 1, 1.5, 2]);

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
  if (!Object.entries(reponses).every(([k, v]) => estTexte(v) && !!PHRASES.get(k)?.has(v))) return false;
  if (!listeDe(x.ordre, (y) => y in reponses) || x.ordre.length !== Object.keys(reponses).length) return false;
  if (!listeDe(x.remontes, (y) => PAYS.has(y))) return false;
  return listeDe(x.historique, () => true) && x.historique.length <= x.ordre.length + 1;
}

function etapeValide(x: unknown): boolean {
  if (!estObjet(x)) return false;
  if (x.t === "profil") return entier(x.i, 0) && (x.i as number) < quiz.profil.length;
  return x.t === "priorites" || x.t === "sujets" || x.t === "phrases" || x.t === "pret";
}

function reglagesValides(x: unknown): boolean {
  if (!estObjet(x) || !estObjet(x.poids)) return false;
  const p = x.poids;
  const poidsOk = ["travailler", "vivre", "valeurs"].every((f) => typeof p[f] === "number" && CRANS.has(p[f] as number));
  const budgetOk = x.budget === null || (typeof x.budget === "number" && Number.isFinite(x.budget) && x.budget >= 0 && x.budget <= 8000);
  return poidsOk && budgetOk;
}

export function validerSession(x: unknown): Session | null {
  if (!estObjet(x) || x.v !== VERSION_SESSION) return null;
  if (!etatValide(x.etat) || !etapeValide(x.etape) || !reglagesValides(x.reglages)) return null;
  if (!(x.proposeA === -1 || entier(x.proposeA, 0)) || typeof x.ouvertes !== "boolean") return null;
  return x as unknown as Session;
}

function lire(): Session {
  if (courant) return courant;
  try {
    const brut = window.sessionStorage.getItem(CLE);
    courant = (brut ? validerSession(JSON.parse(brut)) : null) ?? SESSION_VIDE;
  } catch {
    courant = SESSION_VIDE;
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
export const recommencer = () => ecrire(SESSION_VIDE);

function abonner(f: () => void) {
  ecouteurs.add(f);
  return () => ecouteurs.delete(f);
}

// Renvoie null tant que la page n'est pas chargée dans le navigateur.
export function useSession(): Session | null {
  return useSyncExternalStore(abonner, lire, () => null);
}
