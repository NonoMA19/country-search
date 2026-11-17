"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import Icone from "@/components/Icone";
import { mouvementReduit, useFlip } from "@/lib/animation";
import { quiz, type Classement as TClassement } from "@/lib/donnees";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// L'élément glissé ne change de place que quand le doigt dépasse le milieu d'un voisin d'au moins ZONE_MORTE pixels.
const ZONE_MORTE = 12;
// Près des bords de l'écran, la page défile toute seule (le bas tient compte de la barre collée).
const BORD_HAUT = 70, BORD_BAS = 150, PAS_DEFILEMENT = 10;

type Glisse = { id: string; depart: number; dy: number };

// Ordonner jusqu'à 5 éléments : glisser la poignée, ou les flèches « monter » et « descendre » (clavier et lecteur d'écran).
// Chaque changement de place est animé (technique FLIP, src/lib/animation.ts) ; en mouvement réduit, un simple fondu.
export default function Classement({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TClassement>) {
  const choisies = Array.isArray(etat.reponses.envies) ? (etat.reponses.envies as string[]) : [];
  const depart = Array.isArray(valeur) && valeur.length === choisies.length && valeur.every((x) => choisies.includes(x)) ? valeur : choisies;
  const [ordre, setOrdre] = useState<string[]>(depart);
  const [annonce, setAnnonce] = useState("");
  const [glisse, setGlisse] = useState<Glisse | null>(null);
  const liste = useFlip<HTMLOListElement>(ordre.join(","));
  // L'ordre à jour pendant un geste (plusieurs mouvements arrivent avant le prochain rendu) ; seul « changer » le modifie, avec l'état.
  const ordreRef = useRef(depart);
  const label = (id: string) => quiz.envies.find((e) => e.id === id)?.label ?? id;

  const changer = (id: string, vers: number) => {
    const o = ordreRef.current;
    const i = o.indexOf(id);
    if (vers < 0 || vers >= o.length || vers === i) return false;
    const n = [...o];
    n.splice(i, 1);
    n.splice(vers, 0, id);
    ordreRef.current = n;
    setOrdre(n);
    setAnnonce(`${label(id)} : position ${vers + 1} sur ${n.length}.`);
    return true;
  };

  // Aux flèches : le focus reste sur la flèche utilisée, ou passe à l'autre si elle devient inactive.
  const fleche = (id: string, sens: "monter" | "descendre") => {
    const i = ordreRef.current.indexOf(id);
    const vers = sens === "monter" ? i - 1 : i + 1;
    if (!changer(id, vers)) return;
    const actif = sens === "monter" ? vers > 0 : vers < ordreRef.current.length - 1;
    const cible = actif ? sens : sens === "monter" ? "descendre" : "monter";
    requestAnimationFrame(() => document.getElementById(`${cible}-${id}`)?.focus());
  };

  // Glisser : la ligne se soulève et suit le doigt ; on ne compte jamais la ligne glissée elle-même.
  const commencer = (e: PointerEvent<HTMLSpanElement>, id: string) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setGlisse({ id, depart: e.clientY, dy: 0 });
  };
  const bouger = (e: PointerEvent) => {
    if (!glisse || !liste.current) return;
    if (e.clientY < BORD_HAUT) window.scrollBy(0, -PAS_DEFILEMENT);
    else if (e.clientY > window.innerHeight - BORD_BAS) window.scrollBy(0, PAS_DEFILEMENT);
    const items = [...liste.current.querySelectorAll<HTMLElement>("[data-item]")];
    const i = ordreRef.current.indexOf(glisse.id);
    let vers = 0;
    items.forEach((it, j) => {
      if (j === i) return;
      const r = it.getBoundingClientRect();
      const milieu = r.top + r.height / 2;
      if (j < i ? e.clientY >= milieu - ZONE_MORTE : e.clientY > milieu + ZONE_MORTE) vers++;
    });
    let depart = glisse.depart;
    if (vers !== i) {
      // La ligne change de place : son point de départ suit, pour qu'elle reste sous le doigt.
      const pas = items.length > 1 ? items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().top : 0;
      if (changer(glisse.id, vers)) {
        depart += (vers - i) * pas;
        if (typeof navigator !== "undefined") navigator.vibrate?.(10); // Android ; sans effet ailleurs
      }
    }
    setGlisse({ id: glisse.id, depart, dy: e.clientY - depart });
  };
  const lacher = () => {
    if (!glisse) return;
    const ligne = liste.current?.querySelector<HTMLElement>(`[data-flip="${glisse.id}"]`);
    // La ligne se pose avec un léger ressort (ou un fondu en mouvement réduit).
    if (ligne?.animate) {
      ligne.animate(mouvementReduit() ? [{ opacity: 0.6 }, { opacity: 1 }] : [{ transform: `translateY(${glisse.dy}px) scale(1.02)` }, { transform: "none" }],
        { duration: 260, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
    }
    setGlisse(null);
  };

  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <p className="sr-only" aria-live="polite">{annonce}</p>
      <ol ref={liste} className="mt-5 space-y-2 select-none">
        {ordre.map((id, i) => {
          const enMain = glisse?.id === id;
          return (
            <li key={id} data-item data-flip={id} {...(enMain ? { "data-flip-fige": "" } : {})}
              style={enMain ? { transform: `translateY(${glisse!.dy}px) scale(1.02)`, zIndex: 10, position: "relative" } : undefined}
              className={`flex min-h-16 items-center gap-2 rounded-2xl border-2 bg-carte py-2 pr-2 pl-1 transition-shadow ${enMain ? "border-bleu shadow-lg" : "border-bord"}`}>
              <span aria-hidden="true" onPointerDown={(e) => commencer(e, id)} onPointerMove={bouger} onPointerUp={lacher} onPointerCancel={lacher}
                className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gris active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </span>
              <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${i === 0 ? "bg-bleu text-white" : "border-2 border-bord text-encre"}`}>{i + 1}</span>
              <span className="sr-only">{i + 1}. </span>
              <Icone nom={quiz.envies.find((x) => x.id === id)?.icone ?? ""} className="h-5 w-5 shrink-0 text-gris" />
              <span className="min-w-0 flex-1 leading-snug font-medium [overflow-wrap:normal] [word-break:normal]">{label(id)}</span>
              <span className="flex shrink-0 overflow-hidden rounded-xl border border-bord">
                <button type="button" id={`monter-${id}`} onClick={() => fleche(id, "monter")} disabled={i === 0} aria-label={`Monter ${label(id)}`}
                  className={`flex h-11 w-10 items-center justify-center disabled:opacity-30 ${FOCUS}`}>
                  <ArrowUp aria-hidden="true" className="h-5 w-5" />
                </button>
                <button type="button" id={`descendre-${id}`} onClick={() => fleche(id, "descendre")} disabled={i === ordre.length - 1} aria-label={`Descendre ${label(id)}`}
                  className={`flex h-11 w-10 items-center justify-center border-l border-bord disabled:opacity-30 ${FOCUS}`}>
                  <ArrowDown aria-hidden="true" className="h-5 w-5" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" onClick={() => repondre(ordre)} className={BOUTON_PLEIN}>Valider ce classement</button>
      </Actions>
    </>
  );
}
