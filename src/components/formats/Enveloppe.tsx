"use client";

import { useState } from "react";
import type { Enveloppe as TEnveloppe } from "@/lib/donnees";
import { portes } from "@/lib/donnees";
import { pays } from "@/lib/pays";
import { Actions, BOUTON_PLEIN, EnTete, type PropsFormat } from "./commun";

const euros = (n: number) => `${n.toLocaleString("fr-FR").replace(/ /g, " ")} €`;

// Les sommes demandées par les PVT (portes.json, sourcées), pour situer ton enveloppe : 3 repères au plus.
const REPERES = pays
  .map((p) => ({ nom: p.nom, euros: portes(p.id).find((x) => x.type === "pvt")?.fonds?.euros ?? null }))
  .filter((x): x is { nom: string; euros: number } => typeof x.euros === "number")
  .sort((a, b) => a.euros - b.euros);

// Une enveloppe qui se remplit au curseur, avec les sommes demandées par quelques PVT. Curseur natif (clavier, lecteur d'écran).
export default function Enveloppe({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TEnveloppe>) {
  const [v, setV] = useState(typeof valeur === "number" ? valeur : el.defaut);
  const part = (v - el.min) / (el.max - el.min);
  const couverts = REPERES.filter((r) => r.euros <= v);
  const premier = REPERES.find((r) => r.euros > v);
  return (
    <>
      <EnTete element={el} titreId={titreId} texte={el.texte} />
      <div className="mt-6 rounded-3xl border border-bord bg-carte p-5">
        <div aria-hidden="true" className="relative mx-auto h-24 w-40 overflow-hidden rounded-xl border-2 border-encre bg-creux">
          <span className="absolute inset-x-0 bottom-0 bg-bleu/80 transition-all" style={{ height: `${Math.round(part * 100)}%` }} />
          <span className="absolute inset-x-0 top-0 h-0 border-x-[78px] border-t-[40px] border-x-transparent border-t-encre/15" />
        </div>
        <p className="mt-3 text-center text-3xl font-bold tabular-nums">{v >= el.max ? `${euros(el.max)} ou plus` : euros(v)}</p>
        <input type="range" min={el.min} max={el.max} step={el.pas} value={v} onChange={(e) => setV(Number(e.target.value))}
          aria-labelledby={titreId ?? "titre-ecran"} aria-valuetext={euros(v)} className="mt-3 h-10 w-full accent-bleu" />
        <p className="mt-2 text-sm text-gris">
          {couverts.length ? `Elle couvre les ressources demandées par ${couverts.length} PVT sur ${REPERES.length}.` : "Elle ne couvre encore les ressources d’aucun PVT."}
          {premier ? ` Prochain repère : ${premier.nom}, ${euros(premier.euros)}.` : ""}
        </p>
      </div>
      <Actions passer={passer} libellePasser={libellePasser ?? "Je ne sais pas encore"}>
        <button type="button" onClick={() => repondre(v)} data-valider className={BOUTON_PLEIN}>Valider</button>
      </Actions>
    </>
  );
}
