"use client";

import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";
import { AvecDefinitions } from "@/components/Definition";
import type { Aide } from "@/lib/donnees";

// « Pourquoi on te demande ça » : un panneau déplié dans la page (pas une fenêtre).
// En haut, l'enjeu en gras ; puis une mini-carte par option : ce qu'elle change au classement, son avantage et son prix.
export default function Pourquoi({ aide }: { aide: Aide }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} aria-controls={id}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-bord bg-carte py-1 pr-4 pl-2 text-sm font-semibold text-lien hover:border-bleu focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu">
        <CircleHelp aria-hidden="true" className="h-6 w-6 shrink-0" />
        <span>Pourquoi on te demande ça{"\u00a0"}?</span>
      </button>
      <div id={id} hidden={!ouvert} className="mt-1 rounded-2xl bg-creux p-3">
        {ouvert && <ContenuAide aide={aide} />}
      </div>
    </div>
  );
}

// Le contenu de l'aide : l'enjeu en gras, puis une ligne courte par option, qui apparaissent une par une
// (une simple apparition en mouvement réduit : voir .ligne-une-par-une dans globals.css).
export function ContenuAide({ aide }: { aide: Aide }) {
  return (
    <>
        <p className="ligne-une-par-une font-semibold leading-snug"><AvecDefinitions texte={aide.enjeu} /></p>
        <ul className="mt-2 space-y-2">
          {aide.cartes.map((c, i) => (
            <li key={c.pastille} style={{ animationDelay: `${(i + 1) * 120}ms` }} className="ligne-une-par-une flex items-start gap-2.5 rounded-xl border border-bord bg-carte px-3 py-2 text-sm leading-snug">
              <span aria-hidden="true" className="mt-px inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-bleu-doux px-2 text-xs font-semibold text-encre">{c.pastille}</span>
              <span className="min-w-0">
                <span className="sr-only">{c.pastille.length === 1 ? `Option ${c.pastille}` : c.pastille}{" "}: </span>
                <AvecDefinitions texte={c.texte} />
              </span>
            </li>
          ))}
        </ul>
    </>
  );
}
