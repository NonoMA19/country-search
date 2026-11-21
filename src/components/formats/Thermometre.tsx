"use client";

import { Check } from "lucide-react";
import type { Thermometre as TThermo } from "@/lib/donnees";
import { Actions, EnTete, FOCUS, type PropsFormat } from "./commun";

// Une situation, 5 niveaux de confiance, de « Pas à l'aise » à « Très à l'aise ». Un toucher suffit.
export default function Thermometre({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TThermo>) {
  const n = el.niveaux.length;
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="mt-5 space-y-2" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {[...el.niveaux].map((texte, i) => ({ texte, niveau: i + 1 })).reverse().map(({ texte, niveau }) => {
          const actif = valeur === niveau;
          return (
            <button key={niveau} type="button" data-option aria-pressed={actif} onClick={() => repondre(niveau)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-2 text-left transition-colors ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              <span aria-hidden="true" className="flex h-8 w-24 shrink-0 items-end gap-1">
                {Array.from({ length: n }, (_, k) => (
                  <span key={k} className={`w-full rounded-sm ${k < niveau ? "bg-bleu" : "bg-bord"}`} style={{ height: `${30 + (70 * (k + 1)) / n}%` }} />
                ))}
              </span>
              <span className="flex-1 text-lg font-medium">{texte}</span>
              <span className="sr-only">, niveau {niveau} sur {n}</span>
              {actif && <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-lien" />}
            </button>
          );
        })}
      </div>
      <Actions passer={passer} libellePasser={libellePasser} />
    </>
  );
}
