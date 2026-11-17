"use client";

import { CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import { AvecDefinitions } from "@/components/Definition";
import Drapeau from "@/components/Drapeau";
import LienOfficiel from "@/components/LienOfficiel";
import Pastille from "@/components/Pastille";
import { RAPPEL_VIE, phraseIndemniteVie, preuveMesure, preuveSource, vie } from "@/lib/donnees";
import { ageMax, type Etat, type Ligne } from "@/lib/moteur";

// « Le VIE pour toi » : seulement si ton projet est « Stage ou VIE ».
// Uniquement les conditions officielles déjà sourcées (âge, durée, destinations de Business France, barème officiel).
const indemnite = phraseIndemniteVie;

export default function BlocVie({ etat, top }: { etat: Etat; top: Ligne[] }) {
  const age = ageMax(etat.profil);
  const preuve = preuveSource(vie.nom, vie.texte, vie.source, vie.lien, vie.verifieLe);
  const ageOk = age === null ? null : age <= vie.ageMaxCandidature;
  const I = ageOk === null ? CircleHelp : ageOk ? CircleCheck : CircleAlert;
  return (
    <section aria-labelledby="titre-vie" className="mt-10">
      <h2 id="titre-vie" className="text-xl font-semibold">Le VIE pour toi</h2>
      <div className="mt-3 rounded-3xl border border-bord bg-carte p-5">
        <p>
          <AvecDefinitions texte={vie.resume.join(" ")} />
          <Pastille preuve={preuve} contexte="les règles du VIE" />
        </p>
        <p className="mt-4 text-sm font-semibold">Les conditions officielles</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          <li>Avoir plus de 18 ans et moins de {vie.ageMaxCandidature + 1} ans à la date de candidature.</li>
          <li>Partir au plus tard le jour de tes {vie.ageMaxCandidature + 2} ans.</li>
          <li>Une mission de {vie.dureeMoisMin} à {vie.dureeMoisMax} mois.</li>
        </ul>
        <p className="mt-4 flex items-start gap-2 font-medium">
          <I aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${ageOk ? "text-lien" : "text-gris"}`} />
          <span>
            {ageOk === null ? "Ton âge n’est pas connu : vérifie la condition d’âge." : ageOk ? "Condition d’âge remplie : tu peux candidater." : "Condition d’âge non remplie : le VIE se demande avant 28 ans."}
          </span>
        </p>
        <LienOfficiel url={vie.offres.url} nom={vie.offres.nom} className="mt-4" />
        {top.length > 0 && (
          <>
            <p className="mt-5 text-sm font-semibold">Ton top 3 en VIE</p>
            <p className="mt-1 text-xs text-gris">
              Part fixe de 772,87{"\u00a0"}€ comprise. {RAPPEL_VIE}
              <Pastille preuve={preuveMesure(top[0].pays.id, "indemnite-vie")} contexte="le barème des indemnités VIE" />
            </p>
            <ul className="mt-1 space-y-2">
              {top.map((l) => {
                const presence = vie.presence?.[l.pays.id];
                return (
                  <li key={l.pays.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <Drapeau iso2={l.pays.iso2} className="h-4 w-6" />
                    <span className="font-medium">{l.pays.nom}</span>
                    <span className="text-gris">: {presence ? presence.texte : "VIE : pas dans les destinations de Business France."}</span>
                    {indemnite(l.pays.id) && <span className="basis-full pl-8 font-medium">{indemnite(l.pays.id)}</span>}
                    <Pastille preuve={presence ? preuveSource("Missions VIE", presence.texte, presence.source, presence.lien, presence.verifieLe) : preuveSource("Missions VIE", "La présence de missions VIE dans ce pays n’est pas encore vérifiée.", null, null, null)} pays={l.pays.nom} contexte="les missions VIE" />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
