import { GraduationCap } from "lucide-react";
import LienOfficiel from "@/components/LienOfficiel";
import Pastille from "@/components/Pastille";
import { preuveVisa, type DetailVisa } from "@/lib/donnees";
import { LIBELLE_LIE } from "@/lib/moteur";

// Le visa de travail d'un pays : nom, lien avec l'employeur, diplôme ou expérience exigés,
// conditions principales et page officielle. Les conditions ne sont montrées que si elles
// viennent d'une page officielle ; sinon : « Conditions à vérifier sur le site officiel. »
export default function CarteVisa({ visa, pays, titre }: { visa: DetailVisa; pays: string; titre?: string }) {
  const lie = LIBELLE_LIE[visa.lieEmployeur];
  return (
    <div className="mt-3 rounded-2xl border border-bord bg-carte p-4">
      {titre && <p className="text-sm font-medium text-gris">{titre}</p>}
      <p className="font-semibold break-words">
        {visa.nom}
        <Pastille preuve={preuveVisa(visa)} pays={pays} contexte={`le visa (${visa.nom})`} />
      </p>
      <p className="mt-2 flex flex-wrap gap-2 text-sm">
        {visa.employeurRequis && <span className="rounded-full bg-creux px-2.5 py-1">Employeur obligatoire</span>}
        {lie && <span className="rounded-full bg-creux px-2.5 py-1">{lie}</span>}
      </p>
      {visa.experience && (
        <div className="mt-3 flex gap-2 rounded-xl border border-bleu p-3">
          <GraduationCap aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-lien" />
          <p>
            <span className="font-medium">{visa.experience}</span>
            {visa.jeuneDiplome && <span className="block">{visa.jeuneDiplome}</span>}
          </p>
        </div>
      )}
      {visa.conditions.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {visa.conditions.map((c) => <li key={c}>{c}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gris">Conditions à vérifier sur le site officiel.</p>
      )}
      {visa.statut !== "verifie" && visa.conditions.length > 0 && (
        <p className="mt-2 text-sm text-gris">Lu sur une page officielle, mais pas encore vérifié en détail.</p>
      )}
      <ul className="mt-3 space-y-2">
        {visa.liens.map((l) => <li key={l.url}><LienOfficiel url={l.url} nom={l.libelle} className="" /></li>)}
      </ul>
    </div>
  );
}
