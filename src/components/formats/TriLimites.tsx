"use client";

import { useMemo, useState } from "react";
import type { TriLimites as TTri } from "@/lib/donnees";
import { LIBELLE_LIMITE, REPONSES_LIMITE, type ReponseLimite } from "@/lib/elements";
import { situationsLimites } from "@/lib/parcours";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const STYLE: Record<ReponseLimite, string> = { ok: "border-bleu bg-bleu-doux", eviter: "border-bleu bg-bleu-doux", redhibitoire: "border-encre bg-encre text-fond" };

// Des situations, chacune classée en « Aucun problème », « Je préfère éviter » ou « Rédhibitoire » (des boutons, sans glisser).
export default function TriLimites({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTri>) {
  const situations = useMemo(() => situationsLimites(el, etat), [el, etat]);
  const [choix, setChoix] = useState<Record<string, ReponseLimite>>(valeur && typeof valeur === "object" && !Array.isArray(valeur) ? (valeur as Record<string, ReponseLimite>) : {});
  const restantes = situations.filter((s) => !choix[s.id]).length;
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <ul className="mt-5 space-y-3">
        {situations.map((s) => (
          <li key={s.id} className="rounded-2xl border border-bord bg-carte p-3">
            <p id={`${el.id}-${s.id}`} className="font-semibold leading-snug">{s.texte}</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-labelledby={`${el.id}-${s.id}`}>
              {REPONSES_LIMITE.map((r) => {
                const actif = choix[s.id] === r;
                return (
                  <button key={r} type="button" aria-pressed={actif} onClick={() => setChoix({ ...choix, [s.id]: r })}
                    lang="fr" className={`min-h-12 min-w-0 rounded-xl border-2 px-0.5 text-center text-[13px] leading-tight font-semibold hyphens-auto min-[360px]:px-1 min-[360px]:text-sm ${actif ? STYLE[r] : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                    {LIBELLE_LIMITE[r]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-gris">« Rédhibitoire » met les pays concernés dans « Moins adaptés pour toi ». Tu pourras les remonter.</p>
      <Actions passer={passer} libellePasser={libellePasser}>
        <p className="sr-only" aria-live="polite">{restantes ? `Encore ${restantes} à classer.` : "Tout est classé."}</p>
        <button type="button" disabled={restantes > 0} onClick={() => repondre(Object.fromEntries(situations.map((s) => [s.id, choix[s.id]])))} className={BOUTON_PLEIN}>
          {restantes ? `Encore ${restantes} à classer` : "Continuer"}
        </button>
      </Actions>
    </>
  );
}
