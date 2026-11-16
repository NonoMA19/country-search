"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { ChoixCartes as TChoix } from "@/lib/donnees";
import { optionsDe } from "@/lib/elements";
import { envieDisponible, raisonEnvieIndisponible } from "@/lib/moteur";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, Illustration, PlusMoins, type PropsFormat } from "./commun";

// Des cartes à choix unique (un toucher suffit) ou multiple (on coche, puis « Continuer »).
// Chaque carte : une image provisoire (sauf pour l'âge, le budget…), un titre, une phrase courte, et parfois son avantage et son prix.
export default function ChoixCartes({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TChoix>) {
  const initial = Array.isArray(valeur) ? valeur : [];
  const [choisies, setChoisies] = useState<string[]>(initial);
  const options = optionsDe(el).map((o) => ({ ...o, indispo: el.source === "envies" ? raisonEnvieIndisponible(o.id, etat.profil) : null }))
    .filter((o) => el.source !== "envies" || envieDisponible(o.id, etat.profil) || o.indispo);
  const nombre = el.nombre;
  const plein = nombre !== undefined && choisies.length >= nombre;
  const basculer = (id: string) => setChoisies((c) => (c.includes(id) ? c.filter((x) => x !== id) : plein ? c : [...c, id]));
  const grille = !el.sansImage;

  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className={`mt-5 ${grille ? "grid grid-cols-2 gap-3" : "space-y-3"}`} role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {options.map((o) => {
          const actif = el.multiple ? choisies.includes(o.id) : valeur === o.id;
          const desactive = !!o.indispo || (el.multiple && !actif && plein);
          const idTitre = `${el.id}-${o.id}`;
          const opt = o as typeof o & { phrase?: string; plus?: string; moins?: string };
          return (
            <button key={o.id} type="button" aria-pressed={actif} disabled={desactive} aria-labelledby={idTitre} aria-describedby={opt.phrase || o.indispo ? `${idTitre}-d` : undefined}
              onClick={() => (el.multiple ? basculer(o.id) : repondre(o.id))}
              className={`relative flex min-h-14 w-full min-w-0 ${grille ? "flex-col items-stretch gap-2 p-3" : "items-start gap-3 px-4 py-3"} rounded-2xl border-2 text-left transition-colors disabled:opacity-50 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              {grille && <Illustration icone={o.icone} alt={`Image provisoire : ${o.label}`} />}
              <span className="min-w-0 flex-1">
                <span id={idTitre} className="block text-base leading-snug font-semibold break-words hyphens-auto">{o.label}</span>
                {(opt.phrase || o.indispo) && <span id={`${idTitre}-d`} className="mt-0.5 block text-sm leading-snug text-gris">{o.indispo ?? opt.phrase}</span>}
                {el.avecPlusMoins && opt.plus && opt.moins && <PlusMoins plus={opt.plus} moins={opt.moins} />}
              </span>
              {actif && <Check aria-hidden="true" className="absolute top-2 right-2 h-5 w-5 text-lien" />}
            </button>
          );
        })}
      </div>
      {el.multiple ? (
        <Actions passer={passer} libellePasser={libellePasser}>
          {nombre !== undefined && <p className="pb-1 text-center text-sm text-gris" aria-live="polite">{choisies.length === nombre ? `${nombre} choisies.` : `${choisies.length} sur ${nombre}`}</p>}
          <button type="button" disabled={nombre !== undefined && choisies.length !== nombre} onClick={() => repondre(choisies)} className={BOUTON_PLEIN}>
            {nombre !== undefined ? (choisies.length === nombre ? "Continuer" : `Encore ${nombre - choisies.length} à choisir`) : choisies.length ? "Continuer" : (el.aucun ?? "Aucune")}
          </button>
        </Actions>
      ) : (
        <Actions passer={passer} libellePasser={libellePasser} />
      )}
    </>
  );
}
