"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import Icone from "@/components/Icone";
import { quiz, type Classement as TClassement } from "@/lib/donnees";
import { poidsRang } from "@/lib/moteur";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const nombreFr = (n: number) => n.toLocaleString("fr-FR");

// Ordonner jusqu'à 5 éléments : glisser la poignée, ou les boutons « monter » et « descendre » (clavier et lecteur d'écran).
export default function Classement({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TClassement>) {
  const choisies = Array.isArray(etat.reponses.envies) ? (etat.reponses.envies as string[]) : [];
  const depart = Array.isArray(valeur) && valeur.length === choisies.length && valeur.every((x) => choisies.includes(x)) ? valeur : choisies;
  const [ordre, setOrdre] = useState<string[]>(depart);
  const [annonce, setAnnonce] = useState("");
  const [glisse, setGlisse] = useState<string | null>(null);
  const liste = useRef<HTMLOListElement>(null);
  const label = (id: string) => quiz.envies.find((e) => e.id === id)?.label ?? id;

  // focus : après un déplacement au clavier, le focus reste sur la flèche utilisée, ou passe à l'autre si elle devient inactive.
  const deplacer = (id: string, vers: number, focus?: "monter" | "descendre") => {
    const i = ordre.indexOf(id);
    if (vers < 0 || vers >= ordre.length || vers === i) return;
    const n = [...ordre];
    n.splice(i, 1);
    n.splice(vers, 0, id);
    setOrdre(n);
    setAnnonce(`${label(id)} : position ${vers + 1} sur ${n.length}.`);
    if (focus) {
      const actif = focus === "monter" ? vers > 0 : vers < n.length - 1;
      const cible = actif ? focus : focus === "monter" ? "descendre" : "monter";
      requestAnimationFrame(() => document.getElementById(`${cible}-${id}`)?.focus());
    }
  };

  // Glisser : l'élément ne change de place que quand le doigt dépasse le milieu d'un voisin d'au moins ZONE_MORTE pixels.
  // On ne compte jamais l'élément glissé lui-même.
  const ZONE_MORTE = 12;
  const bouger = (e: PointerEvent, id: string) => {
    if (glisse !== id || !liste.current) return;
    const items = [...liste.current.querySelectorAll<HTMLElement>("[data-item]")];
    const i = ordre.indexOf(id);
    let vers = 0;
    items.forEach((it, j) => {
      if (j === i) return;
      const r = it.getBoundingClientRect();
      const milieu = r.top + r.height / 2;
      // Un voisin du dessus reste au-dessus tant qu'on ne remonte pas assez ; un voisin du dessous passe au-dessus quand on le dépasse assez.
      if (j < i ? e.clientY >= milieu - ZONE_MORTE : e.clientY > milieu + ZONE_MORTE) vers++;
    });
    if (vers !== i) deplacer(id, vers);
  };

  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <p className="sr-only" aria-live="polite">{annonce}</p>
      <ol ref={liste} className="mt-5 space-y-2">
        {ordre.map((id, i) => (
          <li key={id} data-item className={`flex items-center gap-2 rounded-2xl border-2 bg-carte p-2 transition-colors ${glisse === id ? "border-bleu" : "border-bord"}`}>
            <span
              aria-hidden="true"
              onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setGlisse(id); }}
              onPointerMove={(e) => bouger(e, id)}
              onPointerUp={() => setGlisse(null)}
              onPointerCancel={() => setGlisse(null)}
              className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gris active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </span>
            <span className="w-6 shrink-0 text-center text-lg font-bold text-lien tabular-nums">{i + 1}</span>
            <Icone nom={quiz.envies.find((x) => x.id === id)?.icone ?? ""} className="h-5 w-5 shrink-0 text-gris" />
            <span className="min-w-0 flex-1">
              <span className="block leading-snug font-medium break-words">{label(id)}</span>
              <span className="block text-xs text-gris">Importance {nombreFr(poidsRang(i))}</span>
            </span>
            <button type="button" id={`monter-${id}`} onClick={() => deplacer(id, i - 1, "monter")} disabled={i === 0} aria-label={`Monter ${label(id)}`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-bord disabled:opacity-30 ${FOCUS}`}>
              <ArrowUp aria-hidden="true" className="h-5 w-5" />
            </button>
            <button type="button" id={`descendre-${id}`} onClick={() => deplacer(id, i + 1, "descendre")} disabled={i === ordre.length - 1} aria-label={`Descendre ${label(id)}`}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-bord disabled:opacity-30 ${FOCUS}`}>
              <ArrowDown aria-hidden="true" className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ol>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" onClick={() => repondre(ordre)} className={BOUTON_PLEIN}>Valider ce classement</button>
      </Actions>
    </>
  );
}
