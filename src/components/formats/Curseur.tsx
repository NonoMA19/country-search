"use client";

import { useState } from "react";
import type { Curseur as TCurseur } from "@/lib/donnees";
import { libelleCurseur } from "@/lib/elements";
import { Actions, BOUTON_PLEIN, EnTete, type PropsFormat } from "./commun";

// Un axe entre deux pôles, de 0 à 100. Le libellé change avec la position ; la valeur devient une importance, de façon continue.
// Curseur natif : flèches du clavier, Début et Fin, et lecteur d'écran (aria-valuetext).

export default function Curseur({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TCurseur>) {
  const [v, setV] = useState(typeof valeur === "number" ? valeur : 50);
  const libelle = libelleCurseur(el, v);
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="mt-6 rounded-3xl border border-bord bg-carte p-5">
        <p className="text-center text-xl font-semibold text-lien" aria-hidden="true">{libelle}</p>
        <input type="range" min={0} max={100} step={1} value={v} onChange={(e) => setV(Number(e.target.value))}
          aria-labelledby={titreId ?? "titre-ecran"} aria-valuetext={`${libelle} (${v} sur 100)`} className="mt-4 h-10 w-full accent-bleu" />
        <div className="mt-1 flex justify-between gap-4 text-sm font-medium" aria-hidden="true">
          <span className="min-w-0">{el.gauche.label}</span>
          <span className="min-w-0 text-right">{el.droite.label}</span>
        </div>
        <p className="mt-4 text-sm text-gris">
          {el.gauche.label} : importance {((100 - v) / 100).toLocaleString("fr-FR")} · {el.droite.label} : importance {(v / 100).toLocaleString("fr-FR")}
        </p>
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" onClick={() => repondre(v)} data-valider className={BOUTON_PLEIN}>Valider</button>
      </Actions>
    </>
  );
}
