// Garde les réponses dans le navigateur (sessionStorage) : aucun envoi, aucun compte, aucun cookie.
// Tout s'efface quand on ferme l'onglet.
import { useSyncExternalStore } from "react";
import { ETAT_VIDE, REGLAGES_DEFAUT, type Etat, type Reglages } from "./moteur";

export type Etape = { t: "profil"; i: number } | { t: "priorites" } | { t: "sujets" } | { t: "phrases" } | { t: "pret" };

export type Session = {
  etat: Etat;
  etape: Etape;
  reglages: Reglages;
  secteurs: string[];
  proposeA: number; // nombre de phrases vues quand le résultat a été proposé pour la dernière fois
  ouvertes: boolean; // « Montrer seulement les portes ouvertes »
};

export const SESSION_VIDE: Session = { etat: ETAT_VIDE, etape: { t: "profil", i: 0 }, reglages: REGLAGES_DEFAUT, secteurs: [], proposeA: -1, ouvertes: false };

const CLE = "country-search:quiz";
let courant: Session | null = null;
const ecouteurs = new Set<() => void>();

function lire(): Session {
  if (courant) return courant;
  try {
    const brut = window.sessionStorage.getItem(CLE);
    courant = brut ? { ...SESSION_VIDE, ...(JSON.parse(brut) as Session) } : SESSION_VIDE;
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
