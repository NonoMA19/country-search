"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, Undo2 } from "lucide-react";
import type { Swipe as TSwipe } from "@/lib/donnees";
import { LIBELLE_SWIPE, type ReponseSwipe } from "@/lib/elements";
import { phrasesSwipe } from "@/lib/parcours";
import { Actions, EnTete, FOCUS, mouvementReduitActif, type PropsFormat } from "./commun";

const SEUIL = 90; // pixels à glisser pour répondre

// Une phrase par carte. Glisser à droite : « Ça me correspond » ; à gauche : « Pas vraiment ».
// Les trois boutons restent visibles en permanence (et les flèches du clavier marchent sur la carte).
export default function Swipe({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TSwipe>) {
  const phrases = useMemo(() => phrasesSwipe(el, etat), [el, etat]);
  const [reponses, setReponses] = useState<Record<string, ReponseSwipe>>({});
  const [dx, setDx] = useState(0);
  const depart = useRef<number | null>(null);
  const i = Object.keys(reponses).length;
  const phrase = phrases[i];

  const choisir = (r: ReponseSwipe) => {
    if (!phrase) return;
    const suite = { ...reponses, [phrase.id]: r };
    setDx(0);
    if (Object.keys(suite).length >= phrases.length) repondre(suite);
    else setReponses(suite);
    requestAnimationFrame(() => document.getElementById(`${el.id}-carte`)?.focus());
  };
  const annuler = () => {
    const ids = Object.keys(reponses);
    if (!ids.length) return;
    const suite = { ...reponses };
    delete suite[ids.at(-1)!];
    setReponses(suite);
  };
  const lacher = () => {
    if (dx > SEUIL) choisir("oui");
    else if (dx < -SEUIL) choisir("non");
    setDx(0);
    depart.current = null;
  };
  const touche = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); choisir("oui"); }
    if (e.key === "ArrowLeft") { e.preventDefault(); choisir("non"); }
  };
  const precedente = valeur && typeof valeur === "object" && !Array.isArray(valeur) ? (valeur as Record<string, string>)[phrase?.id ?? ""] : undefined;

  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <p className="mt-4 text-sm font-medium text-gris" aria-live="polite">Phrase {Math.min(i + 1, phrases.length)} sur {phrases.length}</p>
      {phrase && (
        <div className="relative mt-2 select-none">
          <div
            id={`${el.id}-carte`}
            tabIndex={0}
            role="group"
            aria-roledescription="carte à glisser"
            aria-label={`${phrase.texte} Flèche droite : ${LIBELLE_SWIPE.oui}. Flèche gauche : ${LIBELLE_SWIPE.non}.`}
            onKeyDown={touche}
            onPointerDown={(e: PointerEvent<HTMLDivElement>) => { depart.current = e.clientX; e.currentTarget.setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (depart.current !== null) setDx(e.clientX - depart.current); }}
            onPointerUp={lacher}
            onPointerCancel={() => { setDx(0); depart.current = null; }}
            style={{ transform: dx && !mouvementReduitActif() ? `translateX(${dx}px) rotate(${dx / 30}deg)` : undefined }}
            className={`flex min-h-48 touch-pan-y items-center justify-center rounded-3xl border-2 bg-carte p-6 text-center shadow-sm ${dx > SEUIL / 2 ? "border-bleu" : dx < -SEUIL / 2 ? "border-gris" : "border-bord"} ${FOCUS}`}
          >
            <p className="text-xl leading-snug font-semibold">« {phrase.texte} »</p>
          </div>
          {precedente && <p className="mt-2 text-center text-sm text-gris">Ta réponse d’avant : {LIBELLE_SWIPE[precedente as ReponseSwipe]}</p>}
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => choisir("non")} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-bord bg-carte px-1 text-sm font-semibold hover:border-bleu ${FOCUS}`}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {LIBELLE_SWIPE.non}
        </button>
        <button type="button" onClick={() => choisir("depend")} className={`min-h-14 rounded-2xl border-2 border-bord bg-carte px-1 text-sm font-semibold hover:border-bleu ${FOCUS}`}>
          {LIBELLE_SWIPE.depend}
        </button>
        <button type="button" onClick={() => choisir("oui")} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-bleu bg-bleu-doux px-1 text-sm font-semibold ${FOCUS}`}>
          <ArrowRight aria-hidden="true" className="h-4 w-4" /> {LIBELLE_SWIPE.oui}
        </button>
      </div>
      <p className="mt-2 text-xs text-gris">« Ça dépend » ne compte pas dans ton classement.</p>
      {i > 0 && (
        <button type="button" onClick={annuler} className={`mt-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl px-2 text-sm font-medium text-lien ${FOCUS}`}>
          <Undo2 aria-hidden="true" className="h-4 w-4" /> Revenir à la phrase précédente
        </button>
      )}
      <Actions passer={passer} libellePasser={libellePasser} />
    </>
  );
}
