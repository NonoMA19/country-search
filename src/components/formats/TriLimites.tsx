"use client";

import { useMemo, useState } from "react";
import type { CarteLimite, TriLimites as TTri } from "@/lib/donnees";
import { LIBELLE_LIMITE, REPONSES_LIMITE, type ReponseLimite } from "@/lib/elements";
import { situationsLimites } from "@/lib/parcours";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const STYLE: Record<ReponseLimite, string> = { ok: "border-bleu bg-bleu-doux", eviter: "border-bleu bg-bleu-doux", redhibitoire: "border-encre bg-encre text-fond" };

// Une mini-carte : l'Europe (au centre) et trois autres régions, plus ou moins allumées.
function Dessin({ dessin }: { dessin: CarteLimite["dessin"] }) {
  const loin = dessin === "monde" ? "fill-bleu" : dessin === "europe-plus" ? "fill-bleu/45" : "fill-bord";
  return (
    <svg viewBox="0 0 84 56" aria-hidden="true" className="h-14 w-21 shrink-0 rounded-xl bg-bleu-doux">
      <rect x="34" y="12" width="18" height="16" rx="4" className="fill-bleu" />
      <rect x="8" y="14" width="18" height="20" rx="4" className={dessin === "monde" ? "fill-bleu" : "fill-bord"} />
      <rect x="58" y="14" width="20" height="22" rx="4" className={loin} />
      <rect x="36" y="34" width="12" height="14" rx="4" className={loin} />
    </svg>
  );
}

// La distance (prompt 8, maquette 3) : une seule situation, « Vivre hors d'Europe », en trois grandes cartes illustrées.
// Chaque carte est une phrase à la première personne ; la réponse enregistrée reste la même qu'avant.
function CartesIllustrees({ element: el, situation, valeur, repondre, passer, libellePasser, titreId, etat }: PropsFormat<TTri> & { situation: string }) {
  const depart = valeur && typeof valeur === "object" && !Array.isArray(valeur) ? (valeur as Record<string, ReponseLimite>)[situation] : undefined;
  const [choix, setChoix] = useState<ReponseLimite | undefined>(depart);
  const carte = el.cartes!.find((c) => c.reponse === choix);
  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <div className="mt-5 grid gap-2.5" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {el.cartes!.map((c) => {
          const actif = choix === c.reponse;
          return (
            <button key={c.reponse} type="button" data-option aria-pressed={actif} onClick={() => setChoix(c.reponse)}
              className={`grid min-h-20 grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border-2 p-2.5 text-left ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              <Dessin dessin={c.dessin} />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{c.titre}</span>
                <span className={`block text-sm leading-snug ${actif ? "text-encre" : "text-gris"}`}>{c.texte}</span>
                <span className="mt-1 inline-block rounded-full bg-creux px-2 py-0.5 text-xs font-semibold">{LIBELLE_LIMITE[c.reponse]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-gris" aria-live="polite">
        {carte ? (carte.reponse === "ok" ? "Rien ne change : tous les pays restent dans la course." : carte.reponse === "eviter" ? "Les pays hors d’Europe deviennent un peu moins accessibles pour toi." : "Les pays hors d’Europe deviennent beaucoup moins accessibles. Ils restent dans ta liste.") : "Aucune limite ne retire un pays : elle le rend moins accessible pour toi."}
      </p>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" disabled={!choix} onClick={() => choix && repondre({ [situation]: choix })} data-valider className={BOUTON_PLEIN}>
          {choix ? "Continuer" : "Choisis une carte"}
        </button>
      </Actions>
    </>
  );
}

// Des situations, chacune classée en « Aucun problème », « Je préfère éviter » ou « Rédhibitoire » (des boutons, sans glisser).
export default function TriLimites(props: PropsFormat<TTri>) {
  const situations = useMemo(() => situationsLimites(props.element, props.etat), [props.element, props.etat]);
  if (props.element.cartes && situations.length === 1) return <CartesIllustrees {...props} situation={situations[0].id} />;
  return <TriBoutons {...props} />;
}

function TriBoutons({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTri>) {
  const situations = useMemo(() => situationsLimites(el, etat), [el, etat]);
  const [choix, setChoix] = useState<Record<string, ReponseLimite>>(valeur && typeof valeur === "object" && !Array.isArray(valeur) ? (valeur as Record<string, ReponseLimite>) : {});
  const restantes = situations.filter((s) => !choix[s.id]).length;
  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <ul className="mt-5 grid gap-3 xl:grid-cols-2">
        {situations.map((s) => (
          <li key={s.id} className="rounded-2xl border border-bord bg-carte p-3">
            <p id={`${el.id}-${s.id}`} className="font-semibold leading-snug">{s.texte}</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-labelledby={`${el.id}-${s.id}`}>
              {REPONSES_LIMITE.map((r) => {
                const actif = choix[s.id] === r;
                return (
                  <button key={r} type="button" aria-pressed={actif} onClick={() => setChoix({ ...choix, [s.id]: r })}
                    lang="fr" className={`min-h-12 min-w-0 rounded-xl border-2 px-0.5 text-center text-[13px] leading-tight font-semibold hyphens-auto min-[360px]:px-1 min-[360px]:text-sm ${actif ? STYLE[r] : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                    {LIBELLE_LIMITE[r]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-gris">Aucune limite ne retire un pays : elle le rend moins accessible pour toi. Tu pourras le remonter.</p>
      <Actions passer={passer} libellePasser={libellePasser}>
        <p className="sr-only" aria-live="polite">{restantes ? `Encore ${restantes} à classer.` : "Tout est classé."}</p>
        <button type="button" disabled={restantes > 0} onClick={() => repondre(Object.fromEntries(situations.map((s) => [s.id, choix[s.id]])))} data-valider className={BOUTON_PLEIN}>
          {restantes ? `Encore ${restantes} à classer` : "Continuer"}
        </button>
      </Actions>
    </>
  );
}
