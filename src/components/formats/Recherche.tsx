"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { countries } from "country-flag-icons";
import type { Recherche as TRecherche } from "@/lib/donnees";
import { Actions, EnTete, FOCUS, type PropsFormat } from "./commun";

// Les pays du monde, avec leur nom en français (Intl.DisplayNames). Les codes sans nom (« EU », « XK »…) sont écartés.
const sansAccent = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
function listePays(exclus: string[]): { code: string; nom: string; cle: string }[] {
  const noms = new Intl.DisplayNames(["fr"], { type: "region" });
  return countries
    .filter((c) => /^[A-Z]{2}$/.test(c) && !exclus.includes(c))
    .map((code) => ({ code, nom: noms.of(code) ?? code }))
    .filter((x) => x.nom !== x.code)
    .map((x) => ({ ...x, cle: sansAccent(x.nom) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

// Une liste avec recherche : on tape quelques lettres, on touche le pays. Les cas décrits et sourcés passent en tête.
export default function Recherche({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TRecherche>) {
  const tous = useMemo(() => listePays(el.exclus ?? []), [el.exclus]);
  const [texte, setTexte] = useState("");
  const id = useId();
  const proposes = Object.keys(el.correspondances);
  const cle = sansAccent(texte.trim());
  const liste = cle ? tous.filter((p) => p.cle.includes(cle)).slice(0, 30) : tous.filter((p) => proposes.includes(p.code));
  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <label htmlFor={id} className="sr-only">Chercher un pays</label>
      <div className="relative mt-5">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gris" />
        <input id={id} type="search" autoComplete="off" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Par exemple : Maroc"
          className={`min-h-12 w-full rounded-2xl border-2 border-bord bg-carte py-2 pr-4 pl-12 text-base placeholder:text-gris focus:border-bleu ${FOCUS}`} />
      </div>
      <p className="mt-3 text-sm text-gris" aria-live="polite">{cle ? (liste.length ? `${liste.length} pays${liste.length === 30 ? " (les 30 premiers)" : ""}` : "Aucun pays ne correspond.") : "Les plus fréquents, ou tape le nom du pays."}</p>
      <ul className="mt-2 space-y-2" aria-label="Pays">
        {liste.map((p) => {
          const actif = valeur === p.code;
          return (
            <li key={p.code}>
              <button type="button" data-option aria-pressed={actif} onClick={() => repondre(p.code)}
                className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2 text-left text-base font-semibold ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                {p.nom}
                {actif && <Check aria-hidden="true" className="h-5 w-5 text-lien" />}
              </button>
            </li>
          );
        })}
      </ul>
      <Actions passer={passer} libellePasser={libellePasser} />
    </>
  );
}
