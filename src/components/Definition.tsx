"use client";

import { useId, useState, type ReactNode } from "react";
import { glossaire, type CleGlossaire } from "@/lib/donnees";

// Une petite définition au toucher (pas une infobulle au survol) : le mot souligné en pointillé
// ouvre une ou deux phrases juste en dessous, dans le texte. Échap la referme.
export default function Definition({ cle, children }: { cle: CleGlossaire; children?: ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  const g = glossaire[cle];
  return (
    <>
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert(!ouvert)}
        onKeyDown={(e) => { if (e.key === "Escape") setOuvert(false); }}
        className="relative inline p-0 text-left align-baseline font-[inherit] underline decoration-gris decoration-dotted underline-offset-4 after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] hover:decoration-bleu"
      >
        {children ?? g.terme}
        <span className="sr-only"> (voir la définition)</span>
      </button>
      <span id={id} role="note" hidden={!ouvert} className="my-1.5 block rounded-xl border border-bord bg-carte px-3 py-2 text-left text-sm font-normal text-encre normal-case">
        <span className="font-semibold">{g.terme}{" "}: </span>
        {g.definition}
      </span>
    </>
  );
}

// Met une définition sur la première apparition de chaque mot du glossaire dans un texte simple.
const MOTS: [RegExp, CleGlossaire][] = [
  [/\bPVT\b/, "pvt"], [/\bVIE\b/, "vie"], [/\bPM2,5\b/, "pm25"], [/\$ PPA\b/, "ppa"], [/pouvoir d’achat/, "ppa"], [/(note|indice) de la Banque mondiale/, "indice-bm"],
];
export function AvecDefinitions({ texte }: { texte: string }) {
  const morceaux: ReactNode[] = [];
  let reste = texte;
  const vus = new Set<CleGlossaire>();
  for (;;) {
    let premier: { i: number; mot: string; cle: CleGlossaire } | null = null;
    for (const [re, cle] of MOTS) {
      if (vus.has(cle)) continue;
      const m = re.exec(reste);
      if (m && (!premier || m.index < premier.i)) premier = { i: m.index, mot: m[0], cle };
    }
    if (!premier) break;
    vus.add(premier.cle);
    morceaux.push(reste.slice(0, premier.i), <Definition key={premier.cle} cle={premier.cle}>{premier.mot}</Definition>);
    reste = reste.slice(premier.i + premier.mot.length);
  }
  morceaux.push(reste);
  return <>{morceaux}</>;
}
