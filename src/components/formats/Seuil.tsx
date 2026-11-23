"use client";

import { useState } from "react";
import type { Seuil as TSeuil } from "@/lib/donnees";
import { LIBELLE_LIMITE, objetReponse, texteSeuil } from "@/lib/elements";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// Un seuil au curseur (« au-delà de 12 h de vol »), puis ce qu'il en coûte : « Je préfère éviter » ou « Rédhibitoire ».
// « Aucune limite » répond tout de suite.
export default function Seuil({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TSeuil>) {
  const avant = objetReponse(valeur);
  const [n, setN] = useState(avant.seuil ? Number(avant.seuil) : el.defaut);
  const [niveau, setNiveau] = useState<"eviter" | "redhibitoire">(avant.niveau === "redhibitoire" ? "redhibitoire" : "eviter");
  const texte = texteSeuil(el, n);
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="mt-6 rounded-3xl border border-bord bg-carte p-5">
        <p className="text-center text-2xl font-bold" aria-hidden="true">{texte}</p>
        <input type="range" min={el.min} max={el.max} step={el.pas} value={n} onChange={(e) => setN(Number(e.target.value))}
          aria-labelledby={titreId ?? "titre-ecran"} aria-valuetext={texte} className="mt-3 h-10 w-full accent-bleu" />
        <div className="mt-1 flex justify-between text-sm text-gris" aria-hidden="true"><span>{el.min}{" "}{el.unite}</span><span>{el.max}{" "}{el.unite}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Au-delà de ce seuil">
          {(["eviter", "redhibitoire"] as const).map((r) => (
            <button key={r} type="button" data-option aria-pressed={niveau === r} onClick={() => setNiveau(r)}
              className={`min-h-12 rounded-xl border-2 px-2 text-sm font-semibold ${niveau === r ? (r === "redhibitoire" ? "border-encre bg-encre text-fond" : "border-bleu bg-bleu-doux") : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              {LIBELLE_LIMITE[r]}
            </button>
          ))}
        </div>
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" data-valider onClick={() => repondre({ niveau, seuil: String(n) })} className={BOUTON_PLEIN}>Valider ce seuil</button>
        <button type="button" onClick={() => repondre({ niveau: "ok" })} className={`min-h-12 w-full rounded-2xl border-2 border-bord bg-carte px-5 text-base font-semibold hover:border-bleu lg:w-auto ${FOCUS}`}>Aucune limite</button>
      </Actions>
    </>
  );
}
