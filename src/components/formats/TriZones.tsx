"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Emoji from "@/components/Emoji";
import type { TriZones as TTri } from "@/lib/donnees";
import { objetReponse } from "@/lib/elements";
import { mesureClassante } from "@/lib/moteur";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// Des cartes à ranger dans des zones (des boutons, sans glisser). Une carte laissée de côté ne compte pas :
// on peut valider à tout moment. Une carte sans donnée pays pour 30 pays le dit.
export default function TriZones(props: PropsFormat<TTri>) {
  return props.element.zones.length === 1 ? <CartesATouchers {...props} /> : <Zones {...props} />;
}

// Une seule zone (« Compte pour moi », prompt 7) : des cartes avec emoji. On touche seulement celles qui comptent.
function CartesATouchers({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTri>) {
  const zone = el.zones[0].id;
  const [choix, setChoix] = useState<string[]>(Object.keys(objetReponse(valeur)));
  const n = choix.length;
  // 3 cartes au plus (prompt 8), comme les critères : au-delà, les autres cartes ne se cochent plus.
  const max = el.max;
  const plein = max !== undefined && n >= max;
  const basculer = (id: string) => setChoix((c) => (c.includes(id) ? c.filter((x) => x !== id) : plein ? c : [...c, id]));
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {el.cartes.map((c) => {
          const actif = choix.includes(c.id);
          const bloque = plein && !actif;
          // Une carte sans donnée pays (ou sous 30 pays) le dit : la choisir prend une place sans changer le classement.
          const portrait = !c.mesures.length || !c.mesures.every(mesureClassante);
          return (
            <button key={c.id} type="button" data-option aria-pressed={actif} aria-disabled={bloque || undefined} onClick={() => basculer(c.id)}
              className={`carte-touche relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-center ${actif ? "border-bleu bg-bleu-doux" : bloque ? "border-bord bg-carte opacity-45" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              {c.emoji && <Emoji nom={c.emoji} className="h-10 w-10" />}
              <span lang="fr" className="text-sm leading-tight font-semibold hyphens-auto">{c.label}</span>
              {portrait && <span className="text-xs leading-tight text-gris">Enrichit ton portrait</span>}
              {actif && (
                <span aria-hidden="true" className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-bleu">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        {max !== undefined
          ? <p className="pb-1 text-center text-sm text-gris" aria-live="polite">{n} sur {max} au plus{plein ? " : retire une carte pour en choisir une autre." : ""}</p>
          : <p className="sr-only" aria-live="polite">{n} carte{n > 1 ? "s" : ""} choisie{n > 1 ? "s" : ""}.</p>}
        <button type="button" data-valider onClick={() => repondre(Object.fromEntries(choix.map((id) => [id, zone])))} className={BOUTON_PLEIN}>{n ? `Continuer (${n})` : "Aucune ne compte pour moi"}</button>
      </Actions>
    </>
  );
}

// Plusieurs zones : chaque carte se range dans une zone (des boutons, sans glisser).
function Zones({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TTri>) {
  const [choix, setChoix] = useState<Record<string, string>>(objetReponse(valeur));
  const n = Object.keys(choix).length;
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <ul className="mt-5 grid gap-3 xl:grid-cols-2">
        {el.cartes.map((c) => {
          const portrait = !c.mesures.length || !c.mesures.every(mesureClassante);
          return (
            <li key={c.id} className="rounded-2xl border border-bord bg-carte p-3">
              <p id={`${el.id}-${c.id}`} className="font-semibold leading-snug">{c.label}</p>
              {(c.phrase || portrait) && <p className="mt-0.5 text-xs text-gris">{portrait ? "Pas encore assez de données pays : enrichit ton portrait." : c.phrase}</p>}
              <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-labelledby={`${el.id}-${c.id}`}>
                {el.zones.map((z) => {
                  const actif = choix[c.id] === z.id;
                  return (
                    <button key={z.id} type="button" aria-pressed={actif} lang="fr"
                      onClick={() => setChoix((x) => { const y = { ...x }; if (actif) delete y[c.id]; else y[c.id] = z.id; return y; })}
                      className={`min-h-12 min-w-0 rounded-xl border-2 px-0.5 text-center text-[13px] leading-tight font-semibold hyphens-auto min-[360px]:text-sm ${actif ? (z.id === "indispensable" ? "border-encre bg-encre text-fond" : "border-bleu bg-bleu-doux") : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                      {z.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <Actions passer={passer} libellePasser={libellePasser}>
        <p className="sr-only" aria-live="polite">{n} carte{n > 1 ? "s" : ""} rangée{n > 1 ? "s" : ""}.</p>
        <button type="button" data-valider onClick={() => repondre(choix)} className={BOUTON_PLEIN}>{n ? `Continuer (${n} rangée${n > 1 ? "s" : ""})` : "Aucune ne compte pour moi"}</button>
      </Actions>
    </>
  );
}
