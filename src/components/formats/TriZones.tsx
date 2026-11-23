"use client";

import { useState } from "react";
import type { TriZones as TTri } from "@/lib/donnees";
import { objetReponse } from "@/lib/elements";
import { mesureClassante } from "@/lib/moteur";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// Des cartes à ranger dans des zones (des boutons, sans glisser). Une carte laissée de côté ne compte pas :
// on peut valider à tout moment. Une carte sans donnée pays pour 30 pays le dit.
export default function TriZones({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTri>) {
  const [choix, setChoix] = useState<Record<string, string>>(objetReponse(valeur));
  const n = Object.keys(choix).length;
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <ul className="mt-5 grid gap-3 xl:grid-cols-2">
        {el.cartes.map((c) => {
          const portrait = !c.mesures.length || !c.mesures.every(mesureClassante);
          return (
            <li key={c.id} className="rounded-2xl border border-bord bg-carte p-3">
              <p id={`${el.id}-${c.id}`} className="font-semibold leading-snug">{c.label}</p>
              {(c.phrase || portrait) && <p className="mt-0.5 text-xs text-gris">{portrait ? "Pas de donnée pays sur 30 pays : enrichit ton portrait." : c.phrase}</p>}
              <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-labelledby={`${el.id}-${c.id}`}>
                {el.zones.map((z) => {
                  const actif = choix[c.id] === z.id;
                  return (
                    <button key={z.id} type="button" aria-pressed={actif} lang="fr"
                      onClick={() => setChoix((x) => { const y = { ...x }; if (actif) delete y[c.id]; else y[c.id] = z.id; return y; })}
                      className={`min-h-12 min-w-0 rounded-xl border-2 px-0.5 text-center text-[13px] leading-tight font-semibold hyphens-auto min-[360px]:text-sm ${actif ? (z.id === "indispensable" ? "border-encre bg-encre text-fond" : "border-bleu bg-bleu-doux") : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                      {z.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <Actions passer={passer} libellePasser={libellePasser}>
        <p className="sr-only" aria-live="polite">{n} carte{n > 1 ? "s" : ""} rangée{n > 1 ? "s" : ""}.</p>
        <button type="button" data-valider onClick={() => repondre(choix)} className={BOUTON_PLEIN}>{n ? `Continuer (${n} rangée${n > 1 ? "s" : ""})` : "Aucune ne compte pour moi"}</button>
      </Actions>
    </>
  );
}
