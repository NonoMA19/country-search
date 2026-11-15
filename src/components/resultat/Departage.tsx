"use client";

import { useEffect } from "react";
import { Scale } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import { CarteDilemme } from "@/components/quiz/Quiz";
import { mesures } from "@/lib/donnees";
import { bilanDepartage, MAX_DEPARTAGE, prochainDepartage, repondre, type Etat, type Ligne, type Reglages } from "@/lib/moteur";

// L'état du départage, gardé par la page résultat le temps de la visite.
export type EtatDepartage =
  | { t: "quiz"; a: string; b: string; avant: Etat; poses: string[] }
  | { t: "fin"; a: string; b: string; message: string }
  | { t: "comparaison"; a: string; b: string };

const BOUTON = "inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 text-center font-semibold";

// Deux jauges côte à côte, sans nouveau calcul : l'accord déjà calculé pour chaque critère.
function Comparaison({ la, lb }: { la: Ligne; lb: Ligne }) {
  const ids = [...new Set([...la.details, ...lb.details].filter((d) => !d.neutre).map((d) => d.mesure))];
  const accord = (l: Ligne, m: string) => l.details.find((d) => d.mesure === m && !d.neutre)?.accord ?? null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-bord bg-carte">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-bord px-4 py-3 text-sm font-semibold">
        <span className="flex min-w-0 items-center gap-2"><Drapeau iso2={la.pays.iso2} className="h-4 w-6" /><span className="break-words">{la.pays.nom}</span></span>
        <span className="flex min-w-0 items-center gap-2"><Drapeau iso2={lb.pays.iso2} className="h-4 w-6" /><span className="break-words">{lb.pays.nom}</span></span>
      </div>
      <ul className="divide-y divide-bord">
        {ids.map((m) => {
          const va = accord(la, m), vb = accord(lb, m);
          const jauge = (v: number | null, nom: string) => (
            <span className="flex min-w-0 items-center gap-2">
              <span className="jauge h-2.5 min-w-8 flex-1 overflow-hidden rounded-full bg-creux" aria-hidden="true">
                <span className="block h-full rounded-full bg-bleu" style={{ width: `${Math.round((v ?? 0) * 100)}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-gris tabular-nums">{v === null ? "?" : `${Math.round(v * 100)} %`}</span>
              <span className="sr-only">{nom} : {v === null ? "pas de donnée" : `${Math.round(v * 100)} %`}</span>
            </span>
          );
          return (
            <li key={m} className="px-4 py-2.5">
              <p className="text-sm font-medium">{mesures[m]?.nom ?? m}</p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">{jauge(va, la.pays.nom)}{jauge(vb, lb.pays.nom)}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Departage({ etat, reglages, top, lignes, etatDep, setEtatDep, ecrireEtat }: {
  etat: Etat; reglages: Reglages; top: Ligne[]; lignes: Ligne[]; etatDep: EtatDepartage | null;
  setEtatDep: (e: EtatDepartage | null) => void; ecrireEtat: (e: Etat) => void;
}) {
  const cle = etatDep ? `${etatDep.t}:${etatDep.t === "quiz" ? etatDep.poses.length : ""}` : "";
  useEffect(() => {
    if (!cle) return;
    document.getElementById(cle.startsWith("quiz") ? "titre-departage" : "titre-bilan-departage")?.focus();
  }, [cle]);

  const [l1, l2] = top;
  const a = etatDep?.a ?? l1?.pays.id;
  const b = etatDep?.b ?? l2?.pays.id;
  const la = lignes.find((l) => l.pays.id === a);
  const lb = lignes.find((l) => l.pays.id === b);
  if (!a || !b || !la || !lb) return null;
  const nomA = la.pays.nom, nomB = lb.pays.nom;

  const lancer = () => {
    const d = prochainDepartage(etat, a, b, reglages);
    setEtatDep(d ? { t: "quiz", a, b, avant: etat, poses: [] } : { t: "comparaison", a, b });
  };

  if (etatDep?.t === "quiz") {
    const d = etatDep.poses.length < MAX_DEPARTAGE ? prochainDepartage(etat, a, b, reglages) : null;
    if (!d) {
      // Plus rien à demander (le classement a changé entre-temps) : on propose le bilan.
      return (
        <section className="mt-6 rounded-3xl border border-bord bg-creux p-4 sm:p-6">
          <p className="font-medium">Plus aucune question ne sépare {nomA} et {nomB}.</p>
          <button type="button" onClick={() => setEtatDep({ t: "fin", a, b, message: bilanDepartage(etatDep.avant, etat, a, b, reglages) })} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Voir ce qui a changé</button>
        </section>
      );
    }
    const repond = (r: string) => {
      const suivant = repondre(etat, d.id, r);
      ecrireEtat(suivant);
      const poses = [...etatDep.poses, d.id];
      const encore = poses.length < MAX_DEPARTAGE && prochainDepartage(suivant, a, b, reglages);
      setEtatDep(encore ? { ...etatDep, poses } : { t: "fin", a, b, message: bilanDepartage(etatDep.avant, suivant, a, b, reglages) });
    };
    return (
      <section aria-label={`Départage : ${nomA} ou ${nomB}`} className="mt-6 rounded-3xl border-2 border-bleu bg-carte p-4 sm:p-6">
        <p className="text-sm font-medium text-gris">{nomA} ou {nomB} ? Question {etatDep.poses.length + 1} sur {MAX_DEPARTAGE} au plus</p>
        <div className="mt-3"><CarteDilemme key={d.id} dilemme={d} repond={repond} titreId="titre-departage" niveau="h3" /></div>
        <button type="button" onClick={() => setEtatDep({ t: "fin", a, b, message: bilanDepartage(etatDep.avant, etat, a, b, reglages) })} className="mt-1 min-h-11 w-full text-sm font-medium text-lien underline">Arrêter le départage</button>
      </section>
    );
  }

  return (
    <section aria-labelledby="titre-bilan-departage" className="mt-6 rounded-3xl border border-bord bg-creux p-4 sm:p-6">
      <h3 id="titre-bilan-departage" tabIndex={-1} className="flex items-center gap-2 text-lg font-semibold outline-none">
        <Scale aria-hidden="true" className="h-5 w-5 shrink-0 text-lien" /> {nomA} ou {nomB} ?
      </h3>
      {etatDep?.t === "fin" ? (
        <>
          <p className="mt-2 font-medium" role="status">{etatDep.message}</p>
          <p className="mt-1 text-sm text-gris">Ton classement est à jour.</p>
          <button type="button" onClick={() => setEtatDep(null)} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Fermer</button>
        </>
      ) : etatDep?.t === "comparaison" ? (
        <>
          <p className="mt-2">Il ne reste aucun dilemme pour les départager. Voici les deux pays côte à côte, sur ce qui compte pour toi.</p>
          <Comparaison la={la} lb={lb} />
          <button type="button" onClick={() => setEtatDep(null)} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Fermer</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-gris">Ils sont à égalité. Trois questions pour trancher.</p>
          <button type="button" onClick={lancer} className={`${BOUTON} mt-3 bg-bleu text-white hover:bg-blue-700`}>Trancher entre les deux</button>
        </>
      )}
    </section>
  );
}

