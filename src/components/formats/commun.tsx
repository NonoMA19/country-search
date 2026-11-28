"use client";

import { createContext, useContext, type ReactNode } from "react";
import Icone from "@/components/Icone";
import Pourquoi from "@/components/Pourquoi";
import type { Element, Valeur } from "@/lib/donnees";
import { aideDe, type Etat } from "@/lib/moteur";

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

// Sur téléphone et tablette, le bouton principal prend toute la largeur (zone du pouce) ; sur ordinateur, sa taille naturelle.
export const BOUTON_PLEIN = "min-h-14 w-full rounded-2xl bg-bleu px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-bord disabled:text-encre focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu lg:w-auto lg:min-w-64 lg:px-8";
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";
// La barre d'action : collée en bas de l'écran sur téléphone et tablette (à portée du pouce) ;
// sur ordinateur, à la suite de la question, boutons alignés à gauche.
export const BARRE_BAS = "sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 backdrop-blur lg:static lg:mx-0 lg:mt-8 lg:flex lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-2 lg:border-t-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none";

// « Pourquoi on te demande ça ? » : sous la question, sur tous les écrans et toutes les tailles (prompt 7 : le panneau de
// droite, sur ordinateur, ne montre plus que les étapes). PanneauContexte reste pour savoir si l'écran est dans le quiz.
export const PanneauContexte = createContext(false);
export function PourquoiEcran({ aide, id }: { aide: Element["aide"]; id: string }) {
  useContext(PanneauContexte);
  return <Pourquoi key={id} aide={aide} />;
}

// Le haut de chaque écran : le thème en pastille, la question (titre de l'écran, reçoit le focus), une phrase, « Pourquoi ».
export function EnTete({ element, titreId = "titre-ecran", titre, texte, etat }: { element: Element; titreId?: string; titre?: string; texte?: string; etat?: Etat }) {
  return (
    <>
      <p className="inline-flex min-h-7 w-fit items-center self-start rounded-full bg-bleu-doux px-3 text-sm font-semibold text-encre">{element.theme}</p>
      <h1 id={titreId} tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">{titre ?? element.titre}</h1>
      {element.encart && <p className="mt-3 rounded-2xl border-2 border-bleu bg-bleu-doux px-4 py-3 text-lg leading-snug font-semibold">{element.encart}</p>}
      {(texte ?? element.texte) && <p className="mt-2 text-lg leading-snug">{texte ?? element.texte}</p>}
      <PourquoiEcran id={element.id} aide={aideDe(element, etat?.profil)} />
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
    <div className={`${BARRE_BAS} space-y-0.5 pt-2 pb-1.5 lg:space-y-0 lg:py-0 [&>p]:lg:pb-0 [&>p]:lg:text-left`}>
      {children}
      <button type="button" onClick={passer} className={`min-h-11 w-full rounded-2xl text-base font-medium text-gris hover:text-encre lg:w-auto lg:px-4 lg:hover:bg-creux ${FOCUS}`}>{libellePasser}</button>
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
