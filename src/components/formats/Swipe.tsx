"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check, Undo2, X } from "lucide-react";
import type { Swipe as TSwipe } from "@/lib/donnees";
import { LIBELLE_SWIPE, type ReponseSwipe } from "@/lib/elements";
import { phrasesSwipe } from "@/lib/parcours";
import { clicLibre, marquerChangement } from "@/lib/clic";
import { Actions, EnTete, FOCUS, mouvementReduitActif, type PropsFormat } from "./commun";

const SEUIL = 90; // pixels à glisser pour répondre
const DUREE_ENVOL = 300; // ms (provisoire, à revoir avec la direction artistique)

type Geste = { x: number; y: number; dx: number; dy: number };
const sensDuGeste = (dx: number, dy: number): ReponseSwipe | null =>
  dy > SEUIL && dy > Math.abs(dx) ? "depend" : dx > SEUIL ? "oui" : dx < -SEUIL ? "non" : null;
const TEINTE: Record<ReponseSwipe, string> = { oui: "border-bleu bg-bleu-doux", non: "border-gris bg-creux", depend: "border-bord bg-creux" };
const TAMPON: Record<ReponseSwipe, string> = {
  oui: "left-4 top-4 -rotate-12 border-bleu text-lien",
  non: "right-4 top-4 rotate-12 border-gris text-gris",
  depend: "bottom-4 left-1/2 -translate-x-1/2 border-gris text-gris",
};

// Une phrase par carte, deux cartes en pile derrière. Glisser à droite : « Ça me correspond » ; à gauche : « Pas vraiment » ;
// vers le bas : « Ça dépend ». Les trois boutons restent visibles, et le clavier marche sur la carte (flèches droite, gauche, bas).
// Le défilement de la page n'est bloqué que sur la carte elle-même (touch-action), jamais ailleurs.
export default function Swipe({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TSwipe>) {
  const phrases = useMemo(() => phrasesSwipe(el, etat), [el, etat]);
  const [reponses, setReponses] = useState<Record<string, ReponseSwipe>>({});
  const [geste, setGeste] = useState<Geste | null>(null);
  const [envol, setEnvol] = useState<ReponseSwipe | null>(null);
  const carteRef = useRef<HTMLDivElement>(null);
  const i = Object.keys(reponses).length;
  const phrase = phrases[i];
  const avant = valeur && typeof valeur === "object" && !Array.isArray(valeur) ? (valeur as Record<string, ReponseSwipe>) : {};
  const precedente = phrase ? avant[phrase.id] : undefined;

  const enregistrer = (r: ReponseSwipe) => {
    if (!phrase) return;
    const suite = { ...reponses, [phrase.id]: r };
    setGeste(null);
    setEnvol(null);
    // La dernière phrase change d'écran : c'est repondre qui pose la garde.
    if (Object.keys(suite).length >= phrases.length) { repondre(suite); return; }
    marquerChangement();
    setReponses(suite);
    requestAnimationFrame(() => document.getElementById(`${el.id}-carte`)?.focus());
  };

  // La carte s'envole du bon côté (ou tombe pour « Ça dépend »), puis la suivante monte de la pile.
  // Un double tap ou une touche maintenue ne répond qu'à une seule phrase (garde de clic.ts).
  const choisir = (r: ReponseSwipe) => {
    if (!phrase || envol || !clicLibre()) return;
    const carte = carteRef.current;
    if (!carte?.animate) { enregistrer(r); return; }
    setEnvol(r);
    const depuis = geste ? `translate(${geste.dx}px, ${Math.max(0, geste.dy)}px) rotate(${geste.dx / 20}deg)` : "none";
    const vers = r === "oui" ? "translate(140%, 0) rotate(18deg)" : r === "non" ? "translate(-140%, 0) rotate(-18deg)" : "translate(0, 120%) rotate(4deg)";
    const a = mouvementReduitActif()
      ? carte.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-out", fill: "forwards" })
      : carte.animate([{ transform: depuis, opacity: 1 }, { transform: vers, opacity: 0 }], { duration: DUREE_ENVOL, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" });
    a.onfinish = () => { a.cancel(); enregistrer(r); };
  };

  const annuler = () => {
    const ids = Object.keys(reponses);
    if (!ids.length || envol) return;
    const suite = { ...reponses };
    delete suite[ids.at(-1)!];
    setReponses(suite);
  };

  const toucher = (e: PointerEvent<HTMLDivElement>) => {
    if (envol) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setGeste({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
  };
  const bouger = (e: PointerEvent<HTMLDivElement>) => { if (geste && !envol) setGeste({ ...geste, dx: e.clientX - geste.x, dy: e.clientY - geste.y }); };
  const lacher = () => {
    if (!geste || envol) return;
    const r = sensDuGeste(geste.dx, geste.dy);
    if (r) { choisir(r); return; }
    // Sous le seuil : la carte revient avec un ressort.
    const carte = carteRef.current;
    if (carte?.animate && !mouvementReduitActif() && (geste.dx || geste.dy)) {
      carte.animate([{ transform: `translate(${geste.dx}px, ${Math.max(0, geste.dy)}px) rotate(${geste.dx / 20}deg)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
    }
    setGeste(null);
  };
  const touche = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const r = e.key === "ArrowRight" ? "oui" : e.key === "ArrowLeft" ? "non" : e.key === "ArrowDown" ? "depend" : null;
    if (r) { e.preventDefault(); choisir(r); }
  };

  const tendance: ReponseSwipe | null = !geste ? null
    : sensDuGeste(geste.dx, geste.dy) ?? (Math.abs(geste.dx) > 25 || geste.dy > 25 ? (geste.dy > Math.abs(geste.dx) ? "depend" : geste.dx > 0 ? "oui" : "non") : null);
  const intensite = geste ? Math.min(1, Math.max(Math.abs(geste.dx), Math.max(0, geste.dy)) / SEUIL) : 0;
  const etatBouton = (r: ReponseSwipe) => `${precedente === r ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`;

  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <div className="mt-4 flex items-center justify-center gap-2" role="img" aria-label={`Phrase ${Math.min(i + 1, phrases.length)} sur ${phrases.length}`}>
        {phrases.map((p, k) => <span key={p.id} className={`h-2.5 w-2.5 rounded-full transition-colors ${k < i ? "bg-bleu" : k === i ? "bg-bleu/50 ring-2 ring-bleu ring-offset-2 ring-offset-fond" : "bg-bord"}`} />)}
      </div>
      <p className="sr-only" aria-live="polite">Phrase {Math.min(i + 1, phrases.length)} sur {phrases.length}{phrase ? ` : ${phrase.texte}` : ""}</p>
      {phrase && (
        <div className="relative mx-auto mt-4 w-full max-w-[340px] select-none">
          {[2, 1].map((k) => phrases[i + k] && (
            <div key={k} aria-hidden="true" className="absolute inset-x-0 top-0 h-full rounded-3xl border-2 border-bord bg-carte transition-transform duration-300"
              style={{ transform: `translateY(${k * 10}px) scale(${1 - k * 0.04})`, opacity: 1 - k * 0.25 }} />
          ))}
          <div
            ref={carteRef}
            id={`${el.id}-carte`}
            tabIndex={0}
            role="group"
            aria-roledescription="carte à glisser"
            aria-label={`${phrase.texte} Flèche droite : ${LIBELLE_SWIPE.oui}. Flèche gauche : ${LIBELLE_SWIPE.non}. Flèche bas : ${LIBELLE_SWIPE.depend}.${precedente ? ` Ta réponse d’avant : ${LIBELLE_SWIPE[precedente]}.` : ""}`}
            onKeyDown={touche}
            onPointerDown={toucher}
            onPointerMove={bouger}
            onPointerUp={lacher}
            onPointerCancel={() => setGeste(null)}
            style={geste && !mouvementReduitActif() ? { transform: `translate(${geste.dx}px, ${Math.max(0, geste.dy)}px) rotate(${geste.dx / 20}deg)` } : undefined}
            className={`relative flex min-h-52 touch-none items-center justify-center rounded-3xl border-2 p-6 text-center shadow-md transition-colors ${tendance ? TEINTE[tendance] : "border-bord bg-carte"} ${FOCUS}`}
          >
            {tendance && (
              <span aria-hidden="true" style={{ opacity: intensite }} className={`absolute rounded-lg border-2 bg-carte px-2 py-0.5 text-sm font-bold tracking-wide uppercase ${TAMPON[tendance]}`}>
                {LIBELLE_SWIPE[tendance]}
              </span>
            )}
            <p className="text-xl leading-snug font-semibold">«{" "}{phrase.texte}{" "}»</p>
          </div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-3 items-start gap-2">
        <button type="button" data-option onClick={() => choisir("non")} aria-pressed={precedente ? precedente === "non" : undefined} className={`flex flex-col items-center gap-1 rounded-2xl p-1 text-sm font-semibold ${FOCUS}`}>
          <span className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${etatBouton("non")}`}><X aria-hidden="true" className="h-6 w-6" /></span>
          {LIBELLE_SWIPE.non}
        </button>
        <button type="button" data-option onClick={() => choisir("depend")} aria-pressed={precedente ? precedente === "depend" : undefined} className={`mt-1.5 min-h-11 rounded-full border-2 px-2 text-sm font-semibold ${etatBouton("depend")} ${FOCUS}`}>
          {LIBELLE_SWIPE.depend}
        </button>
        <button type="button" data-option onClick={() => choisir("oui")} aria-pressed={precedente ? precedente === "oui" : undefined} className={`flex flex-col items-center gap-1 rounded-2xl p-1 text-sm font-semibold ${FOCUS}`}>
          <span className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${etatBouton("oui")}`}><Check aria-hidden="true" className="h-6 w-6" /></span>
          {LIBELLE_SWIPE.oui}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gris">« Ça dépend » ne compte pas dans ton classement. Tu peux aussi glisser la carte vers le bas.</p>
      {i > 0 && (
        <button type="button" onClick={annuler} className={`mt-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl px-2 text-sm font-medium text-lien ${FOCUS}`}>
          <Undo2 aria-hidden="true" className="h-4 w-4" /> Revenir à la phrase précédente
        </button>
      )}
      <Actions passer={passer} libellePasser={libellePasser} />
    </>
  );
}
