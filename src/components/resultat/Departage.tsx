"use client";

import { useEffect } from "react";
import { Scale } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import { CarteDilemme } from "@/components/formats/Dilemme";
import { bilanDepartage, comparer, encoreEgalite, MAX_DEPARTAGE, prochainDepartage, raisonDepartage, repondre, sceneDe, type Etat, type Ligne, type Reglages } from "@/lib/moteur";

// L'état du départage, gardé par la page résultat le temps de la visite.
export type EtatDepartage =
  | { t: "quiz"; a: string; b: string; avant: Etat; poses: string[] }
  | { t: "fin"; a: string; b: string; message: string; egalite: boolean }
  | { t: "comparaison"; a: string; b: string };

const BOUTON = "inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 text-center font-semibold lg:w-auto lg:px-6";

// Les deux pays côte à côte, sans nouveau calcul : une ligne par critère qui compte pour toi,
// la vraie valeur de chaque pays, et au centre une barre qui part du milieu vers le pays qui gagne.
function Comparaison({ la, lb, etat, reglages }: { la: Ligne; lb: Ligne; etat: Etat; reglages: Reglages }) {
  const { lignes, synthese } = comparer(la, lb, etat, reglages);
  const valeur = (v: { valeur: string | null; mot: string } | null) => (v ? (v.valeur ? `${v.valeur} · ${v.mot}` : v.mot) : "Pas de donnée");
  const qui = (ecart: number | null) => (ecart === null ? "Non comparable : une donnée manque d’un côté" : Math.abs(ecart) < 1e-9 ? "Égalité" : `${ecart > 0 ? la.pays.nom : lb.pays.nom} gagne`);
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-bord bg-carte">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-bord px-4 py-3 text-sm font-semibold">
        <span className="flex min-w-0 items-center gap-2"><Drapeau iso2={la.pays.iso2} className="h-4 w-6" /><span className="break-words">{la.pays.nom}</span></span>
        <span className="flex min-w-0 items-center justify-end gap-2 text-right"><span className="break-words">{lb.pays.nom}</span><Drapeau iso2={lb.pays.iso2} className="h-4 w-6" /></span>
      </div>
      <ul className="divide-y divide-bord">
        {lignes.map((x) => {
          const largeur = `${Math.round(Math.min(1, Math.abs(x.ecart ?? 0)) * 50)}%`;
          return (
            <li key={x.mesure} className="px-4 py-3">
              <p className="sr-only">{x.libelle} : {la.pays.nom}, {valeur(x.a)} ; {lb.pays.nom}, {valeur(x.b)}. {qui(x.ecart)}.{x.france ? ` Pour comparer, ${x.france}.` : ""}</p>
              <div aria-hidden="true">
                <p className="text-center text-sm font-semibold">{x.libelle}{x.priorite && <span className="font-normal text-gris"> · priorité</span>}</p>
                <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 text-sm leading-snug">
                  <span className="min-w-0 break-words">{valeur(x.a)}</span>
                  <span className="min-w-0 text-right break-words">{valeur(x.b)}</span>
                </div>
                <div className="relative mt-2 h-2.5 rounded-full bg-creux">
                  <span className="absolute top-[-3px] left-1/2 h-4 w-px bg-gris" />
                  {x.ecart === null ? (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded bg-carte px-1 text-[11px] leading-none whitespace-nowrap text-gris">non comparable</span>
                  ) : Math.abs(x.ecart) < 1e-9 ? (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded bg-carte px-1 text-[11px] leading-none text-gris">égalité</span>
                  ) : (
                    <span className="jauge absolute top-0 h-full rounded-full bg-bleu" style={x.ecart > 0 ? { right: "50%", width: largeur } : { left: "50%", width: largeur }} />
                  )}
                </div>
                {x.france && <p className="mt-1.5 text-center text-xs text-gris">{x.france}</p>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-bord px-4 py-3">
        <p className="font-medium">{synthese}</p>
        <p className="mt-1 text-sm text-gris">À toi de voir ce qui compte le plus.</p>
      </div>
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

  // La fin : le bilan, et la comparaison côte à côte si les deux pays restent à égalité.
  const finir = (avant: Etat, apres: Etat) => setEtatDep({ t: "fin", a, b, message: bilanDepartage(avant, apres, a, b, reglages), egalite: encoreEgalite(apres, a, b, reglages) });

  if (etatDep?.t === "quiz") {
    const d = etatDep.poses.length < MAX_DEPARTAGE ? prochainDepartage(etat, a, b, reglages) : null;
    if (!d) {
      // Plus rien à demander (le classement a changé entre-temps) : on propose le bilan.
      return (
        <section className="mt-6 rounded-3xl border border-bord bg-creux p-4 sm:p-6">
          <p className="font-medium">Plus aucune question ne sépare {nomA} et {nomB}.</p>
          <button type="button" onClick={() => finir(etatDep.avant, etat)} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Voir ce qui a changé</button>
        </section>
      );
    }
    // Après chaque réponse : on continue tant que l'écart reste de 5 points ou moins, jusqu'à 5 questions.
    const repond = (r: string) => {
      const suivant = repondre(etat, d.id, r);
      ecrireEtat(suivant);
      const poses = [...etatDep.poses, d.id];
      const encore = poses.length < MAX_DEPARTAGE && encoreEgalite(suivant, a, b, reglages) && prochainDepartage(suivant, a, b, reglages);
      if (encore) setEtatDep({ ...etatDep, poses });
      else finir(etatDep.avant, suivant);
    };
    return (
      <section aria-label={`Départage : ${nomA} ou ${nomB}`} className="mt-6 rounded-3xl border-2 border-bleu bg-carte p-4 sm:p-6">
        <p className="text-sm font-medium text-gris">{nomA} ou {nomB} ? Question {etatDep.poses.length + 1} sur {MAX_DEPARTAGE} au plus</p>
        <p className="mt-2 rounded-xl bg-creux px-3 py-2 text-sm leading-snug">{raisonDepartage(d, etat, a, b)}</p>
        <div className="mt-3"><CarteDilemme key={d.id} dilemme={d} scene={sceneDe(d, etat)} repond={repond} titreId="titre-departage" niveau="h3" /></div>
        <button type="button" onClick={() => finir(etatDep.avant, etat)} className="mt-1 min-h-11 w-full text-sm font-medium text-lien underline lg:w-auto">Arrêter le départage</button>
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
          {etatDep.egalite && (
            <>
              <p className="mt-4">Pour t’aider à choisir, les deux pays côte à côte.</p>
              <Comparaison la={la} lb={lb} etat={etat} reglages={reglages} />
            </>
          )}
          <button type="button" onClick={() => setEtatDep(null)} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Fermer</button>
        </>
      ) : etatDep?.t === "comparaison" ? (
        <>
          <p className="mt-2">Les deux pays côte à côte, sur ce qui compte pour toi.</p>
          <Comparaison la={la} lb={lb} etat={etat} reglages={reglages} />
          <button type="button" onClick={() => setEtatDep(null)} className={`${BOUTON} mt-3 border border-bord bg-carte hover:border-bleu`}>Fermer</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-gris">Ils sont à égalité. Jusqu’à 5 questions pour trancher, choisies parce que ces deux pays y diffèrent vraiment.</p>
          <div className="lg:mt-3 lg:flex lg:flex-wrap lg:gap-3">
            <button type="button" onClick={lancer} className={`${BOUTON} mt-3 bg-bleu text-white hover:bg-blue-700 lg:mt-0`}>Trancher entre les deux</button>
            <button type="button" onClick={() => setEtatDep({ t: "comparaison", a, b })} className={`${BOUTON} mt-2 border border-bord bg-carte hover:border-bleu lg:mt-0`}>Les comparer côte à côte</button>
          </div>
        </>
      )}
    </section>
  );
}

