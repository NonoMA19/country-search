// Animations du top 3 (technique FLIP : on mesure, on inverse, on joue).
// Aucune bibliothèque : l'API Web Animations du navigateur suffit.
// Si la personne a demandé moins de mouvement (prefers-reduced-motion) : un simple fondu, jamais de déplacement.
// Vitesse et ambiance provisoires : à revoir avec la direction artistique (prompt 5).
import { useLayoutEffect, useRef } from "react";

export const DUREE_DEPLACEMENT = 350; // ms
export const DUREE_REVELATION = 600; // ms, moins d'une seconde

type Fenetre = { matchMedia?: (requete: string) => { matches: boolean } };

export function mouvementReduit(fenetre: Fenetre | undefined = typeof window === "undefined" ? undefined : window): boolean {
  return fenetre?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// La durée réelle d'une animation : 0 si la personne préfère moins de mouvement.
export const dureeAnimation = (duree: number, fenetre?: Fenetre) => (mouvementReduit(fenetre) ? 0 : duree);

// Fait glisser les éléments [data-flip] d'un conteneur vers leur nouvelle place quand « cle » change.
export function useFlip<T extends HTMLElement>(cle: string) {
  const ref = useRef<T>(null);
  const avant = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const conteneur = ref.current;
    if (!conteneur) return;
    const origine = conteneur.getBoundingClientRect();
    const reduit = mouvementReduit();
    const duree = DUREE_DEPLACEMENT;
    const nouvelles = new Map<string, { x: number; y: number }>();
    for (const el of conteneur.querySelectorAll<HTMLElement>("[data-flip]")) {
      const r = el.getBoundingClientRect();
      const pos = { x: r.left - origine.left, y: r.top - origine.top };
      nouvelles.set(el.dataset.flip as string, pos);
      const ancienne = avant.current.get(el.dataset.flip as string);
      if (typeof el.animate !== "function" || el.dataset.flipFige !== undefined) continue;
      // Moins de mouvement : pas de glissement, un court fondu sur ce qui a changé de place.
      if (reduit) {
        if (ancienne && (ancienne.x !== pos.x || ancienne.y !== pos.y)) el.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
        continue;
      }
      if (ancienne && (ancienne.x !== pos.x || ancienne.y !== pos.y)) {
        el.animate([{ transform: `translate(${ancienne.x - pos.x}px, ${ancienne.y - pos.y}px)` }, { transform: "none" }], { duration: duree, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
      } else if (!ancienne && avant.current.size > 0) {
        el.animate([{ opacity: 0, transform: "scale(0.9)" }, { opacity: 1, transform: "none" }], { duration: duree, easing: "ease-out" });
      }
    }
    avant.current = nouvelles;
  }, [cle]);
  return ref;
}
