// Le dossier d'un pays : liens officiels vérifiés un par un (voir scripts/dossiers.mjs).
export type LienDossier = { id: string; titre: string; nom: string | null; url: string | null; statut: "verifie" | "a-verifier" };
export type Dossier = {
  pays: string;
  verifieLe: string;
  liens: LienDossier[];
  associations: LienDossier[];
};

// Seuls les liens réellement ouverts et vérifiés sont montrés.
export const liensVerifies = (liste: LienDossier[]) => liste.filter((l) => l.statut === "verifie" && l.url);

import { trouverPays } from "./pays";

// Renvoie null seulement pour un pays inconnu. Si le fichier ne se charge pas
// (connexion coupée), l'erreur remonte : on ne fabrique pas un dossier vide à tort.
export async function chargerDossier(id: string): Promise<Dossier | null> {
  if (!trouverPays(id)) return null;
  return (await import(`../../content/dossiers/${id}.json`)).default as Dossier;
}
