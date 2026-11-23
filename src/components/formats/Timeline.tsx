"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Timeline as TTimeline } from "@/lib/donnees";
import { objetReponse } from "@/lib/elements";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// La durée sur une frise (des pastilles reliées par une ligne), puis « Et après ? ». Deux touchers, puis « Continuer ».
export default function Timeline({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTimeline>) {
  const avant = objetReponse(valeur);
  const [duree, setDuree] = useState<string | undefined>(avant.duree);
  const [apres, setApres] = useState<string | undefined>(avant.apres);
  const rang = el.options.findIndex((o) => o.id === duree);
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-gris">Ta durée</legend>
        <ol className="relative mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${el.options.length}, minmax(0, 1fr))` }}>
          <span aria-hidden="true" className="absolute top-5 right-[10%] left-[10%] h-1 rounded-full bg-bord" />
          <span aria-hidden="true" className="absolute top-5 left-[10%] h-1 rounded-full bg-bleu transition-all" style={{ width: rang < 0 ? 0 : `${(80 * rang) / Math.max(1, el.options.length - 1)}%` }} />
          {el.options.map((o, i) => {
            const actif = o.id === duree;
            return (
              <li key={o.id} className="relative flex flex-col items-center">
                <button type="button" data-option aria-pressed={actif} onClick={() => setDuree(o.id)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${actif ? "border-bleu bg-bleu text-white" : i <= rang ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                  {actif ? <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} /> : <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gris" />}
                  <span className="sr-only">{o.label}</span>
                </button>
                <span aria-hidden="true" className={`mt-2 text-center text-xs leading-tight ${actif ? "font-semibold text-encre" : "text-gris"}`}>{o.label}</span>
              </li>
            );
          })}
        </ol>
      </fieldset>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-gris">Et après{" "}?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {el.apres.map((o) => {
            const actif = o.id === apres;
            return (
              <button key={o.id} type="button" aria-pressed={actif} onClick={() => setApres(o.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-base font-medium ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                {actif && <Check aria-hidden="true" className="h-4 w-4 text-lien" />}{o.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" disabled={!duree} data-valider onClick={() => repondre({ duree: duree!, ...(apres ? { apres } : {}) })} className={BOUTON_PLEIN}>
          {duree ? "Continuer" : "Choisis une durée"}
        </button>
      </Actions>
    </>
  );
}
