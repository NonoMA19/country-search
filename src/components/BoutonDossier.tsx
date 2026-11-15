"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useSession } from "@/lib/memoire";
import { aplatir, calculer, pointsPays, portrait } from "@/lib/moteur";
import { telechargerDossier } from "@/lib/pdf";
import { trouverPays } from "@/lib/pays";

export function ErreurPdf({ visible }: { visible: boolean }) {
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-red-700 empty:hidden dark:text-red-300">
      {visible ? "Le PDF n’a pas pu être créé, vérifie ta connexion et réessaie." : ""}
    </p>
  );
}

// Crée le PDF dans le navigateur. Si le quiz a été fait, le dossier reprend le résultat.
export default function BoutonDossier({ paysId }: { paysId: string }) {
  const session = useSession();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const pays = trouverPays(paysId);
  if (!pays) return null;

  const telecharger = async () => {
    setEnCours(true);
    setErreur(false);
    try {
      const fini = session && session.etat.priorites.length === 3;
      const ligne = fini ? (calculer(session.etat, session.reglages).find((l) => l.pays.id === paysId) ?? null) : null;
      await telechargerDossier({
        pays,
        ligne,
        ...(ligne && session ? aplatir(pointsPays(ligne, session.etat)) : { pour: [], savoir: [] }),
        alertes: ligne?.porte.alertes ?? [],
        portrait: fini ? portrait(session.etat).map((x) => x.texte) : [],
      });
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <button type="button" onClick={telecharger} disabled={enCours} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-bleu px-5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto">
        <Download aria-hidden="true" className="h-5 w-5" /> {enCours ? "Préparation…" : "Télécharger mon dossier (PDF)"}
      </button>
      <ErreurPdf visible={erreur} />
    </>
  );
}
