"use client";

import Pourquoi from "@/components/Pourquoi";
import type { Dilemme as TDilemme, Scene } from "@/lib/donnees";
import { LIBELLE_ECHELLE, REPONSES_ECHELLE, sceneDe } from "@/lib/moteur";
import { PlusMoins, type PropsFormat } from "./commun";

// Un dilemme : une scène, puis ses options. Chaque option montre son avantage et son prix.
// Dilemme en échelle : les deux options côte à côte (A à gauche, B à droite), puis 4 réponses.
export function CarteDilemme({ dilemme, scene, repond, titreId = "titre-ecran", choisie, passer = "Passer", niveau = "h1" }: {
  dilemme: TDilemme; scene: Scene; repond: (r: string) => void; titreId?: string; choisie?: string; passer?: string; niveau?: "h1" | "h3";
}) {
  const lettres = ["A", "B", "C"];
  const Titre = niveau;
  return (
    <>
      <p className="inline-flex min-h-7 w-fit items-center self-start rounded-full bg-bleu-doux px-3 text-sm font-semibold text-encre">{dilemme.theme}</p>
      <Titre id={titreId} tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">{scene.titre}</Titre>
      <p className="mt-2 text-lg leading-snug">{scene.texte}</p>
      <Pourquoi key={dilemme.id} aide={dilemme.aide} />
      {dilemme.echelle ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {scene.options.map((o, i) => (
              <div key={i} className="min-w-0 rounded-2xl border-2 border-bord bg-carte p-3">
                <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-creux text-sm font-semibold text-gris">{lettres[i]}</span>
                <span className="sr-only">Option {lettres[i]} : </span>
                <span className="mt-1.5 block text-base leading-snug font-medium break-words hyphens-auto">{o.texte}</span>
                <PlusMoins plus={o.plus} moins={o.moins} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5" role="group" aria-labelledby={titreId}>
            {REPONSES_ECHELLE.map((r) => (
              <button key={r} type="button" data-reponse={r} onClick={() => repond(r)} aria-pressed={choisie !== undefined ? choisie === r : undefined}
                className={`min-h-14 rounded-2xl border-2 px-1 text-center text-sm leading-tight font-semibold transition-colors hover:border-bleu focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu ${choisie === r ? "border-bleu bg-bleu-doux" : "border-bord bg-carte"}`}>
                {LIBELLE_ECHELLE[r]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gris">« Un peu » compte deux fois moins que « Plutôt ».</p>
        </>
      ) : (
        <div className="mt-5 space-y-3" role="group" aria-labelledby={titreId}>
          {dilemme.options.map((opt, i) => {
            const o = scene.options[i];
            return (
              <button key={opt.id} type="button" data-reponse={opt.id} onClick={() => repond(opt.id)} aria-pressed={choisie !== undefined ? choisie === opt.id : undefined}
                className={`flex min-h-16 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors hover:border-bleu focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu ${choisie === opt.id ? "border-bleu bg-bleu-doux" : "border-bord bg-carte"}`}>
                <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-creux text-sm font-semibold text-gris">{lettres[i]}</span>
                <span className="min-w-0">
                  <span className="block text-lg leading-snug font-medium break-words">{o.texte}</span>
                  <PlusMoins plus={o.plus} moins={o.moins} />
                </span>
              </button>
            );
          })}
        </div>
      )}
      {scene.exemple && <p className="mt-3 text-xs text-gris">Les montants et les durées sont des exemples, pas les chiffres d’un pays.</p>}
      <button type="button" onClick={() => repond("passer")} className="mt-2 min-h-12 w-full rounded-2xl text-base font-medium text-gris hover:text-encre">{passer}</button>
    </>
  );
}


// Le format « Dilemme » : une scène tirée parmi 3, avec 2 options (ou 4 positions graduées).
export default function Dilemme({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TDilemme>) {
  return <CarteDilemme dilemme={el} scene={sceneDe(el, etat)} repond={(r) => (r === "passer" ? passer() : repondre(r))} choisie={typeof valeur === "string" ? valeur : undefined} passer={libellePasser} titreId={titreId} />;
}
