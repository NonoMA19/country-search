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

export async function chargerDossier(id: string): Promise<Dossier | null> {
  try {
    return (await import(`../../content/dossiers/${id}.json`)).default as Dossier;
  } catch {
    return null;
  }
}
