"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import type { BlindTest as TBlind } from "@/lib/donnees";
import { mesures } from "@/lib/donnees";
import { cartesBlind, paysBlind } from "@/lib/blind";
import { pays } from "@/lib/pays";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const LETTRES = ["A", "B", "C", "D"];

// Trois pays sans leur nom, quatre faits chacun. Après le choix, les noms s'affichent ; « Continuer » enregistre.
export default function BlindTest({ element: el, etat, repondre, passer, libellePasser, titreId }: PropsFormat<TBlind>) {
  const cartes = useMemo(() => cartesBlind(el, etat), [el, etat]);
  const faits = useMemo(() => paysBlind(el, etat).mesures, [el, etat]);
  const [choix, setChoix] = useState<string | null>(null);
  if (cartes.length < 2) {
    return (
      <>
        <EnTete element={el} etat={etat} titreId={titreId} />
        <p className="mt-4">Pas assez de pays à comparer pour l’instant.</p>
        <Actions passer={passer} libellePasser={libellePasser} />
      </>
    );
  }
  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {cartes.map((c, i) => {
          const actif = choix === c.pays;
          const p = pays.find((x) => x.id === c.pays)!;
          return (
            <button key={c.pays} type="button" data-option aria-pressed={actif} disabled={!!choix && !actif} onClick={() => setChoix(c.pays)}
              className={`rounded-2xl border-2 p-3 text-left transition-colors disabled:opacity-60 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              <span className="flex items-center gap-2 text-lg font-semibold">
                {choix ? <><Drapeau iso2={p.iso2} className="h-4 w-6" /> {p.nom}</> : `Pays ${LETTRES[i]}`}
                {actif && <Check aria-hidden="true" className="ml-auto h-5 w-5 text-lien" />}
              </span>
              <ul className="mt-2 space-y-1 text-sm">
                {c.faits.map((f) => (
                  <li key={f.mesure}><span className="text-gris">{mesures[f.mesure]?.court ?? f.mesure}{" "}: </span>{f.valeur}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      {choix && <p role="status" className="mt-4 rounded-2xl bg-creux px-4 py-3">Tu as choisi {pays.find((x) => x.id === choix)?.le}, sans connaître son nom. Les pays qui lui ressemblent sur ces quatre faits passent un peu devant.</p>}
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" disabled={!choix} data-valider onClick={() => choix && repondre({ choix, faits: faits.join(",") })} className={BOUTON_PLEIN}>
          {choix ? "Continuer" : "Choisis un pays"}
        </button>
        {choix && <button type="button" onClick={() => setChoix(null)} className={`min-h-11 w-full rounded-2xl text-base font-medium text-lien underline lg:w-auto ${FOCUS}`}>Changer de choix</button>}
      </Actions>
    </>
  );
}
