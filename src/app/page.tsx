import type { Metadata } from "next";
import Link from "next/link";
import BoutonCommencer from "@/components/BoutonCommencer";
import Definition from "@/components/Definition";
import PiedDePage from "@/components/PiedDePage";
import { europe } from "@/lib/donnees";
import { FAMILLES, NOM_FAMILLE, paysParFamille } from "@/lib/pays";

export const metadata: Metadata = {
  title: "Country Search : choisis le pays où partir travailler",
  description:
    "Un quiz gratuit, sans compte, pour classer 30 pays selon ce qui compte pour toi. Chaque score est expliqué, chaque information a sa source.",
};

export default function Accueil() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:py-16">
      <header>
        {/* Emplacement réservé à la mascotte (pas encore choisie). */}
        <div aria-hidden="true" className="mb-6 h-16 w-16" />

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Country Search
        </h1>
        <p className="mt-3 text-lg">Trouve le pays où partir travailler, parmi 30 pays.</p>
        <p className="mt-1 text-lg">Tu obtiens ton top 3 et ta porte d’entrée : Europe sans visa, <Definition cle="pvt" /> ou visa de travail.</p>
        <p className="mt-1 text-lg text-gris">Environ 5 minutes, sans compte.</p>
        <div className="mt-6">
          <BoutonCommencer />
        </div>
        <p className="mt-6 text-gris">
          Chaque score est expliqué, chaque information a sa source et sa date
          de vérification. <Link href="/methode" className="text-lien underline">Comment on calcule</Link>
        </p>
      </header>

      <section className="mt-12" aria-labelledby="titre-pays">
        <h2 id="titre-pays" className="text-xl font-semibold">
          30 pays, 3 familles
        </h2>

        {FAMILLES.map((famille) => (
          <div key={famille} className="mt-6">
            <h3 className="text-sm font-semibold tracking-wide text-gris uppercase">
              {NOM_FAMILLE[famille]}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {paysParFamille(famille).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pays/${p.id}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-bord bg-carte px-4 text-sm hover:border-bleu"
                  >
                    {p.nom}
                    {p.ficheComplete && (
                      <span className="ml-1 text-lien">
                        <span aria-hidden="true">★</span>
                        <span className="sr-only"> (fiche détaillée à venir en priorité)</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {famille === "Europe sans visa" && <p className="mt-2 text-sm text-gris">{europe.court}</p>}
          </div>
        ))}
        <p className="mt-4 text-sm text-gris">
          ★ = fiche détaillée à venir en priorité. Pour l’instant, chaque page
          pays réunit les données vérifiées et les liens officiels.
        </p>
      </section>

      <PiedDePage liens={[{ href: "/methode", texte: "Comment on calcule" }]} />
      <p className="mt-2 text-sm text-gris">
        Projet gratuit, sans publicité, en construction. Son code est ouvert
        (open source) : tout le monde peut le lire et le réutiliser.
      </p>
    </main>
  );
}
