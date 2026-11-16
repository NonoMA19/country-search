"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { CircleAlert, CircleCheck, CircleHelp, ShieldCheck } from "lucide-react";
import Definition from "@/components/Definition";
import LienOfficiel from "@/components/LienOfficiel";
import { useSession } from "@/lib/memoire";
import { LIBELLE_FIABILITE, budgetDe, calculer, faisabilite, type Faisabilite, type Fiabilite, type VisaSimple } from "@/lib/moteur";
import { trouverPays, type Pays } from "@/lib/pays";

// Le badge de fiabilité : un toucher explique le calcul en une phrase.
export function BadgeFiabilite({ f }: { f: Fiabilite }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  const style = f.niveau === "complete" ? "bg-bleu-doux text-encre" : f.niveau === "partielle" ? "border border-bord bg-carte text-encre" : "border border-dashed border-gris text-gris";
  return (
    <div className="mt-3">
      <button type="button" aria-expanded={ouvert} aria-controls={id} onClick={() => setOuvert(!ouvert)} className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${style}`}>
        <ShieldCheck aria-hidden="true" className="h-4 w-4" /> {LIBELLE_FIABILITE[f.niveau]}
        <span className="sr-only"> : voir comment on le calcule</span>
      </button>
      <p id={id} hidden={!ouvert} className="mt-2 rounded-xl bg-creux px-3 py-2 text-sm">
        {f.verifies} de tes {f.total} critères ont, pour ce pays, une donnée <Definition cle="officiel">officielle</Definition>, une <Definition cle="donnee-ouverte">donnée ouverte</Definition> ou des <Definition cle="temoignages">témoignages</Definition> recoupés. « Notre avis » et « À vérifier » ne comptent pas. 90{" "}% ou plus : données complètes ; de 60 à 89{" "}% : partielles.
      </p>
    </div>
  );
}

function Liste({ titre, items, icone }: { titre: string; items: string[]; icone: "ok" | "non" | "?" }) {
  if (items.length === 0) return null;
  const I = icone === "ok" ? CircleCheck : icone === "non" ? CircleAlert : CircleHelp;
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">{titre}</p>
      <ul className="mt-1 space-y-1">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm leading-snug">
            <I aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${icone === "ok" ? "text-lien" : "text-gris"}`} />
            <span className="min-w-0">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// La fiche de faisabilité : conditions remplies, à remplir, à vérifier, puis la prochaine étape.
export function FicheFaisabilite({ f }: { f: Faisabilite }) {
  return (
    <div>
      <Liste titre="Conditions remplies" items={f.remplies} icone="ok" />
      <Liste titre="À remplir, ou non remplies" items={f.aRemplir} icone="non" />
      <Liste titre="À vérifier" items={f.aVerifier} icone="?" />
      {f.etape && (
        <div className="mt-4">
          <p className="text-sm font-semibold">Prochaine étape : {f.etape.texte.charAt(0).toLowerCase() + f.etape.texte.slice(1)}</p>
          <LienOfficiel url={f.etape.url} nom={f.etape.nom} />
        </div>
      )}
    </div>
  );
}

// Le visa en version simple. Le détail complet reste dans le dossier du pays.
export function VisaCourt({ v, paysId }: { v: VisaSimple; paysId: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-bord p-4">
      <p className="text-sm font-medium text-gris">Ton visa</p>
      <p className="font-semibold break-words">{v.nom}</p>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {v.points.map((x) => <li key={x} className="rounded-full bg-creux px-2.5 py-1">{x}</li>)}
      </ul>
      {v.lien && <LienOfficiel url={v.lien.url} nom={v.lien.nom} className="mt-3" />}
      <Link href={`/pays/${paysId}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-lien underline">Tout le détail dans le dossier du pays</Link>
    </div>
  );
}

// Sur la fiche pays : la faisabilité pour toi, si tu as fait le quiz (lu dans ton navigateur, rien n'est envoyé).
export function FaisabilitePourToi({ paysId }: { paysId: string }) {
  const session = useSession();
  const p: Pays | undefined = trouverPays(paysId);
  if (!p) return null;
  if (!session || !session.etat.profil.age) {
    return (
      <p className="mt-3 rounded-2xl border border-dashed border-bord p-4 text-sm text-gris">
        Fais le quiz pour voir ici les conditions que tu remplis déjà (âge, budget, nationalité). <Link href="/quiz" className="text-lien underline">Faire le quiz</Link>
      </p>
    );
  }
  const { etat, reglages } = session;
  const budget = budgetDe(etat, reglages);
  const ligne = calculer(etat, reglages).find((l) => l.pays.id === paysId);
  return (
    <div className="mt-3 rounded-2xl border border-bord bg-carte p-4">
      <p className="font-semibold">D’après tes réponses au quiz</p>
      {ligne && etat.priorites.length === 3 && <BadgeFiabilite f={ligne.fiabilite} />}
      <FicheFaisabilite f={faisabilite(p, etat.profil, budget)} />
    </div>
  );
}

