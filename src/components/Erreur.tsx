"use client";

import { recommencer, revenirAuPortrait } from "@/lib/memoire";

// Un message humain et deux issues, jamais une page sans bouton. Utilisé par src/app/quiz/error.tsx et src/app/global-error.tsx.
export default function Erreur({ titre = "Oups, cet écran n’a pas pu s’afficher" }: { titre?: string }) {
  const aller = (f: () => void) => { try { f(); } catch { /* stockage indisponible : on recharge quand même */ } window.location.assign(new URL("/quiz", window.location.origin).href); };
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
      <h1 className="text-2xl font-semibold">{titre}</h1>
      <p className="mt-3 text-lg">Tes réponses sont toujours dans ton navigateur. Tu peux revenir à ton portrait, ou recommencer le quiz.</p>
      <div className="mt-8 space-y-3 lg:flex lg:gap-3 lg:space-y-0">
        <button type="button" onClick={() => aller(revenirAuPortrait)} className="min-h-14 w-full rounded-2xl bg-bleu lg:w-auto lg:min-w-64 px-5 text-lg font-semibold text-white hover:bg-blue-700">Revenir à mon portrait</button>
        <button type="button" onClick={() => aller(recommencer)} className="min-h-14 w-full rounded-2xl border border-bord lg:w-auto lg:min-w-64 bg-carte px-5 text-lg font-semibold hover:border-bleu">Recommencer</button>
      </div>
    </main>
  );
}
