"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Emoji from "@/components/Emoji";
import type { Ambiances as TAmbiances } from "@/lib/donnees";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, Illustration, type PropsFormat } from "./commun";

// 4 cartes illustrées (images provisoires), 2 choix au plus.
export default function Ambiances({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TAmbiances>) {
  const [choisies, setChoisies] = useState<string[]>(Array.isArray(valeur) ? valeur : []);
  const plein = choisies.length >= el.max;
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {el.options.map((o) => {
          const actif = choisies.includes(o.id);
          return (
            <button key={o.id} type="button" data-option aria-pressed={actif} disabled={!actif && plein} aria-labelledby={`${el.id}-${o.id}`} aria-describedby={`${el.id}-${o.id}-d`}
              onClick={() => setChoisies((c) => (actif ? c.filter((x) => x !== o.id) : [...c, o.id]))}
              className={`relative flex min-w-0 flex-col gap-2 rounded-2xl border-2 p-3 text-left disabled:opacity-50 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              {o.emoji
                ? <span aria-hidden="true" className="flex h-20 w-full items-center justify-center rounded-xl bg-creux"><Emoji nom={o.emoji} className="h-12 w-12" /></span>
                : <Illustration icone={o.icone} alt={`Image provisoire : ${o.label}`} />}
              <span id={`${el.id}-${o.id}`} className="block leading-snug font-semibold break-words hyphens-auto">{o.label}</span>
              <span id={`${el.id}-${o.id}-d`} className="block text-sm leading-snug text-gris">{o.phrase}</span>
              {actif && <Check aria-hidden="true" className="absolute top-2 right-2 h-5 w-5 text-lien" />}
            </button>
          );
        })}
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        <p className="pb-1 text-center text-sm text-gris" aria-live="polite">{plein ? `${el.max} choisies : c’est le maximum.` : `${choisies.length} sur ${el.max} au plus`}</p>
        <button type="button" disabled={choisies.length === 0} onClick={() => repondre(choisies)} data-valider className={BOUTON_PLEIN}>Continuer</button>
      </Actions>
    </>
  );
}
