import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable | Orizo",
  description: "Cette page n’existe pas sur Orizo.",
};

export default function PageIntrouvable() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-16">
      <p className="text-sm font-semibold tracking-wide text-gris uppercase">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Cette page n’existe pas</h1>
      <p className="mt-3 text-lg text-gris">Le lien est peut-être faux, ou la page a changé d’adresse.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-bleu px-8 text-lg font-semibold text-white hover:bg-blue-700">
          Retour à l’accueil
        </Link>
        <Link href="/quiz" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-bord bg-carte px-8 text-lg font-semibold hover:border-bleu">
          Faire le quiz
        </Link>
      </div>
    </main>
  );
}
