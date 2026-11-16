"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { recommencer, useSession } from "@/lib/memoire";

const PLEIN = "inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-bleu px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu sm:w-auto";
const VIDE = "inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-bord bg-carte px-8 py-3 text-lg font-semibold hover:border-bleu sm:w-auto";

// Si un quiz est déjà entamé dans cet onglet, on le dit au lieu de le reprendre en silence.
export default function BoutonCommencer() {
  const session = useSession();
  const router = useRouter();
  const entame = !!session && (session.etape.t !== "profil" || session.etape.i > 0 || Object.keys(session.etat.profil).length > 0);
  return (
    <div>
      {entame ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/quiz" className={PLEIN}>Reprendre mon quiz</Link>
          <button type="button" onClick={() => { recommencer(); router.push("/quiz"); }} className={VIDE}>Recommencer</button>
        </div>
      ) : (
        <Link href="/quiz" className={PLEIN}>Trouver mon pays</Link>
      )}
      <p className="mt-3 text-sm text-gris">
        Tes réponses restent dans ton navigateur : rien n’est envoyé.
      </p>
    </div>
  );
}
