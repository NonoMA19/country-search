import Link from "next/link";
import BoutonCommencer from "@/components/BoutonCommencer";
import { FAMILLES, paysParFamille } from "@/lib/pays";

export default function Accueil() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:py-16">
      <header>
        {/* Emplacement réservé à la mascotte (pas encore choisie). */}
        <div aria-hidden="true" className="mb-6 h-16 w-16" />

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Country Search
        </h1>
        <p className="mt-3 text-lg text-gris">
          Choisis le pays où partir travailler, puis arrive prêt le jour J :
          visa, banque, carte SIM, santé, logement, CV local, codes culturels.
        </p>
        <div className="mt-6">
          <BoutonCommencer />
        </div>
      </header>

      <section className="mt-12" aria-labelledby="titre-pays">
        <h2 id="titre-pays" className="text-xl font-semibold">
          30 pays, 3 familles
        </h2>

        {FAMILLES.map((famille) => (
          <div key={famille} className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gris">
              {famille}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {paysParFamille(famille).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pays/${p.id}`}
                    className="inline-block rounded-full border border-bord bg-carte px-3 py-1.5 text-sm hover:border-bleu"
                  >
                  {p.nom}
                  {p.ficheComplete && (
                    <span className="ml-1 text-lien" title="Fiche complète">
                      <span aria-hidden="true">★</span>
                      <span className="sr-only"> (fiche complète)</span>
                    </span>
                  )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="mt-4 text-sm text-gris">★ = fiche complète</p>
      </section>

      <footer className="mt-14 border-t border-bord pt-5 text-sm text-gris">
        <p>
          Les informations sur les visas et les impôts ne constituent pas un
          conseil juridique. Vérifie toujours auprès des sources officielles.
        </p>
        <p className="mt-2">
          Projet gratuit et open source, en construction.{" "}
          <Link href="/methode" className="text-lien underline">
            Comment on calcule
          </Link>
        </p>
      </footer>
    </main>
  );
}
