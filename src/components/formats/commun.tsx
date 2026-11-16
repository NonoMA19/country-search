"use client";

import type { ReactNode } from "react";
import Icone from "@/components/Icone";
import Pourquoi from "@/components/Pourquoi";
import type { Element, Valeur } from "@/lib/donnees";
import type { Etat } from "@/lib/moteur";

// Ce que reçoit chaque format : l'élément, l'état du parcours, la réponse déjà donnée (pour « revoir »),
// et deux fonctions : répondre (avec une valeur au schéma commun) ou passer.
export type PropsFormat<E extends Element = Element> = {
  element: E;
  etat: Etat;
  valeur?: Valeur;
  repondre: (v: Valeur) => void;
  passer: () => void;
  libellePasser?: string; // « Passer », ou « Garder ma réponse » quand on revoit un élément
  titreId?: string;
};

export const BOUTON_PLEIN = "min-h-14 w-full rounded-2xl bg-bleu px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-bord disabled:text-encre focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";

// Le haut de chaque écran : le thème en pastille, la question (titre de l'écran, reçoit le focus), une phrase, « Pourquoi ».
export function EnTete({ element, titreId = "titre-ecran", titre, texte }: { element: Element; titreId?: string; titre?: string; texte?: string }) {
  return (
    <>
      <p className="inline-flex min-h-7 w-fit items-center self-start rounded-full bg-bleu-doux px-3 text-sm font-semibold text-encre">{element.theme}</p>
      <h1 id={titreId} tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">{titre ?? element.titre}</h1>
      {(texte ?? element.texte) && <p className="mt-2 text-lg leading-snug">{texte ?? element.texte}</p>}
      <Pourquoi key={element.id} aide={element.aide} />
    </>
  );
}

// Une image provisoire : une icône sur fond uni, avec son texte alternatif. À remplacer par les illustrations (prompt 5).
export function Illustration({ icone, alt, petite = false }: { icone?: string; alt: string; petite?: boolean }) {
  return (
    <span role="img" aria-label={alt} className={`flex items-center justify-center rounded-xl bg-creux ${petite ? "h-12 w-12 shrink-0" : "h-20 w-full"}`}>
      <Icone nom={icone ?? "circle-help"} className={petite ? "h-6 w-6 text-gris" : "h-9 w-9 text-gris"} />
    </span>
  );
}

// La barre du bas, collée à l'écran : le bouton principal, puis « Passer ».
export function Actions({ children, passer, libellePasser = "Passer" }: { children?: ReactNode; passer: () => void; libellePasser?: string }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-auto space-y-1 border-t border-bord bg-fond/95 px-5 pt-3 pb-3 backdrop-blur">
      {children}
      <button type="button" onClick={passer} className={`min-h-12 w-full rounded-2xl text-base font-medium text-gris hover:text-encre ${FOCUS}`}>{libellePasser}</button>
    </div>
  );
}

export function PlusMoins({ plus, moins }: { plus: string; moins: string }) {
  return (
    <span className="mt-1.5 block space-y-0.5 text-sm leading-snug">
      <span className="flex gap-1.5"><span aria-hidden="true" className="w-3 shrink-0 font-bold text-lien">+</span><span className="min-w-0"><span className="sr-only">Avantage : </span>{plus}</span></span>
      <span className="flex gap-1.5 text-gris"><span aria-hidden="true" className="w-3 shrink-0 font-bold">−</span><span className="min-w-0"><span className="sr-only">Prix : </span>{moins}</span></span>
    </span>
  );
}

// Préférence « moins de mouvement » : lue au moment du geste (rien n'est animé si elle est active).
export const mouvementReduitActif = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
