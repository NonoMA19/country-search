"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import carte from "../../../content/carte-monde.json";
import type { CarteMonde as TCarte } from "@/lib/donnees";
import { AUCUNE_ZONE } from "@/lib/elements";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const DESSIN = carte as { largeur: number; hauteur: number; zones: Record<string, string> };

// Une carte du monde simplifiée (Natural Earth, domaine public), découpée en 7 zones, à choix multiple.
// La carte se touche ; la liste de boutons dessous fait la même chose (clavier, lecteur d'écran, petites zones).
export default function CarteMonde({ element: el, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TCarte>) {
  const [zones, setZones] = useState<string[]>(Array.isArray(valeur) ? valeur.filter((z) => z !== AUCUNE_ZONE) : []);
  const basculer = (id: string) => setZones((z) => (z.includes(id) ? z.filter((x) => x !== id) : [...z, id]));
  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <svg viewBox={`0 0 ${DESSIN.largeur} ${DESSIN.hauteur}`} className="mt-5 w-full rounded-2xl bg-creux" aria-hidden="true">
        <path d={DESSIN.zones.fond} className="fill-bord" />
        {el.zones.map((z) => (
          <path key={z.id} d={DESSIN.zones[z.id]} onClick={() => basculer(z.id)}
            className={`cursor-pointer stroke-carte transition-colors ${zones.includes(z.id) ? "fill-bleu" : "fill-gris/40 hover:fill-gris/60"}`} strokeWidth={0.3} />
        ))}
      </svg>
      <p className="mt-1 text-xs text-gris">Carte : Natural Earth (domaine public). Les petits pays n’apparaissent pas : utilise la liste.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
        {el.zones.map((z) => {
          const actif = zones.includes(z.id);
          return (
            <button key={z.id} type="button" aria-pressed={actif} onClick={() => basculer(z.id)}
              className={`inline-flex min-h-12 items-center gap-1.5 rounded-full border px-4 text-left text-base font-medium ${actif ? "border-bleu bg-bleu text-white" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
              {actif && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              <span>{z.label}{z.detail && <span className={`block text-xs font-normal ${actif ? "text-white" : "text-gris"}`}>{z.detail}</span>}</span>
            </button>
          );
        })}
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" disabled={zones.length === 0} onClick={() => repondre(zones)} className={BOUTON_PLEIN}>Continuer</button>
        <button type="button" onClick={() => repondre([AUCUNE_ZONE])} className={`min-h-12 w-full rounded-2xl border border-bord bg-carte text-base font-semibold hover:border-bleu ${FOCUS}`}>Aucune idée pour l’instant</button>
      </Actions>
    </>
  );
}
