// Le dossier d'un pays : liens officiels vérifiés un par un (voir scripts/dossiers.mjs).
export type LienDossier = { id: string; titre: string; nom: string | null; url: string | null; statut: "verifie" | "a-completer" };
export type Dossier = {
  pays: string;
  complet: boolean;
  verifieLe: string;
  liens: LienDossier[];
  associations: LienDossier[];
  checklist: string;
};

import { trouverPays } from "./pays";

// Renvoie null seulement pour un pays inconnu. Si le fichier ne se charge pas
// (connexion coupée), l'erreur remonte : on ne fabrique pas un dossier vide à tort.
export async function chargerDossier(id: string): Promise<Dossier | null> {
  if (!trouverPays(id)) return null;
  return (await import(`../../content/dossiers/${id}.json`)).default as Dossier;
}
