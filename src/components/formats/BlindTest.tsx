"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import type { BlindTest as TBlind } from "@/lib/donnees";
import { cartesBlind, paysBlind, type FaitBlind } from "@/lib/blind";
import { pays } from "@/lib/pays";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const LETTRES = ["A", "B", "C", "D"];
// Du rouge (défavorable pour toi) au vert (favorable), selon la note de 1 à 5. Thèmes de goût : bleu neutre.
const COULEUR_NOTE = ["#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a"];

function Jauge({ f }: { f: FaitBlind }) {
  const n = f.note ?? 0;
  return (
    <li aria-label={`${f.theme} : ${f.valeur}`} className="leading-snug">
      <span aria-hidden="true" className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-gris uppercase">{f.theme}</span>
        <span className="min-w-0 truncate text-right text-xs text-gris">{f.valeur}</span>
      </span>
      <span aria-hidden="true" className="mt-1 block h-2.5 overflow-hidden rounded-full bg-bord">
        <span className={`block h-full rounded-full ${f.universel ? "" : "bg-bleu"}`} style={{ width: `${(n / 5) * 100}%`, ...(f.universel && n ? { background: COULEUR_NOTE[n - 1] } : {}) }} />
      </span>
    </li>
  );
}

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
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gris" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-8 rounded-full" style={{ background: `linear-gradient(90deg, ${COULEUR_NOTE[0]}, ${COULEUR_NOTE[2]}, ${COULEUR_NOTE[4]})` }} />du moins bon au meilleur pour toi</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-8 rounded-full bg-bleu" />une affaire de goût</span>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
              <ul className="mt-3 space-y-2.5">
                {c.faits.slice(0, 4).map((f) => <Jauge key={f.mesure} f={f} />)}
              </ul>
            </button>
          );
        })}
      </div>
      {choix && <p role="status" className="mt-4 rounded-2xl bg-creux px-4 py-3">C’était {pays.find((x) => x.id === choix)?.le}. Les pays qui lui ressemblent passent un peu devant.</p>}
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" disabled={!choix} data-valider onClick={() => choix && repondre({ choix, faits: faits.join(","), pays: cartes.map((c) => c.pays).join(",") })} className={BOUTON_PLEIN}>
          {choix ? "Continuer" : "Choisis un pays"}
        </button>
        {choix && <button type="button" onClick={() => setChoix(null)} className={`min-h-11 w-full rounded-2xl text-base font-medium text-lien underline lg:w-auto ${FOCUS}`}>Changer de choix</button>}
      </Actions>
    </>
  );
}
