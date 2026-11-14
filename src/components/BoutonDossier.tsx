"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useSession } from "@/lib/memoire";
import { calculer, coince, raisons } from "@/lib/moteur";
import { telechargerDossier } from "@/lib/pdf";
import { trouverPays } from "@/lib/pays";

// Crée le PDF dans le navigateur. Si le quiz a été fait, le dossier reprend le résultat.
export default function BoutonDossier({ paysId }: { paysId: string }) {
  const session = useSession();
  const [enCours, setEnCours] = useState(false);
  const pays = trouverPays(paysId);
  if (!pays) return null;

  const telecharger = async () => {
    setEnCours(true);
    try {
      const fini = session && session.etat.priorites.length === 3;
      const ligne = fini ? (calculer(session.etat, session.reglages).find((l) => l.pays.id === paysId) ?? null) : null;
      await telechargerDossier({
        pays,
        ligne,
        raisons: ligne && session ? raisons(ligne, session.etat.profil) : [],
        coince: ligne && session ? coince(ligne, session.etat.profil) : undefined,
      });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <button type="button" onClick={telecharger} disabled={enCours} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-bleu px-5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto">
      <Download aria-hidden="true" className="h-5 w-5" /> {enCours ? "Préparation…" : "Télécharger mon dossier (PDF)"}
    </button>
  );
}
