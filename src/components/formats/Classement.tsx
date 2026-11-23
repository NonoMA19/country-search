"use client";

import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragOverEvent, type DragStartEvent, type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icone from "@/components/Icone";
import { mouvementReduit, useFlip } from "@/lib/animation";
import { quiz, type Classement as TClassement } from "@/lib/donnees";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// Ordonner jusqu'à 5 envies. Trois façons, au choix :
// 1. glisser la poignée (souris, ou doigt après un très court appui : 120 ms) ;
// 2. au clavier : la poignée prend le focus, Espace ou Entrée la soulève, les flèches la déplacent, Espace la pose, Échap annule ;
// 3. les boutons « monter » et « descendre », toujours là en secours.
// Le glisser vient de la bibliothèque dnd-kit (licence MIT). Pendant le geste, une copie de la ligne (calque fixe, posé sur
// la page) suit le pointeur, même si la page défile ; la ligne d'origine reste dans la liste en pointillés et les autres
// lui font de la place. L'ordre n'est modifié qu'au relâchement : le doigt garde la ligne jusqu'au bout.
// L'ancienne version déplaçait la ligne dans la page à chaque échange, ce qui faisait perdre le geste (voir le journal du prompt 4).

const DELAI_TOUCHER = 120; // ms d'appui avant que la ligne se soulève au doigt
const TOLERANCE_TOUCHER = 8; // px de glissement permis pendant ce délai (au-delà, le geste est annulé)

type PropsLigne = { id: string; rang: number; total: number; label: string; icone: string };

// Le contenu d'une ligne. « copie » : la ligne qui suit le pointeur pendant le geste (rien n'y est cliquable).
function Contenu({ id, rang, total, label, icone, copie = false, poignee, fleche }: PropsLigne & {
  copie?: boolean; poignee?: Record<string, unknown>; fleche?: (id: string, sens: "monter" | "descendre") => void;
}) {
  const classePoignee = "flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-gris [-webkit-touch-callout:none]";
  return (
    <>
      {copie ? (
        <span aria-hidden="true" className={`${classePoignee} cursor-grabbing text-encre`}><GripVertical className="h-5 w-5" /></span>
      ) : (
        <button type="button" {...poignee} aria-label={`Déplacer ${label}, position ${rang + 1} sur ${total}`} data-poignee
          className={`${classePoignee} hover:bg-creux hover:text-encre active:cursor-grabbing ${FOCUS}`}>
          <GripVertical aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
      <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${rang === 0 ? "bg-bleu text-white" : "border-2 border-bord text-encre"}`}>{rang + 1}</span>
      {!copie && <span className="sr-only">{rang + 1}. </span>}
      <Icone nom={icone} className="h-5 w-5 shrink-0 text-gris" />
      <span className="min-w-0 flex-1 leading-snug font-medium [overflow-wrap:normal] [word-break:normal]">{label}</span>
      {copie ? (
        <span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-xl border border-bord text-gris">
          <span className="flex h-11 w-10 items-center justify-center"><ArrowUp className="h-5 w-5" /></span>
          <span className="flex h-11 w-10 items-center justify-center border-l border-bord"><ArrowDown className="h-5 w-5" /></span>
        </span>
      ) : (
        <span className="flex shrink-0 overflow-hidden rounded-xl border border-bord">
          <button type="button" id={`monter-${id}`} onClick={() => fleche?.(id, "monter")} disabled={rang === 0} aria-label={`Monter ${label}`}
            className={`flex h-11 w-10 items-center justify-center hover:bg-creux disabled:opacity-30 disabled:hover:bg-transparent ${FOCUS}`}>
            <ArrowUp aria-hidden="true" className="h-5 w-5" />
          </button>
          <button type="button" id={`descendre-${id}`} onClick={() => fleche?.(id, "descendre")} disabled={rang === total - 1} aria-label={`Descendre ${label}`}
            className={`flex h-11 w-10 items-center justify-center border-l border-bord hover:bg-creux disabled:opacity-30 disabled:hover:bg-transparent ${FOCUS}`}>
            <ArrowDown aria-hidden="true" className="h-5 w-5" />
          </button>
        </span>
      )}
    </>
  );
}

const CLASSE_LIGNE = "flex min-h-16 items-center gap-2 rounded-2xl border-2 bg-carte py-2 pr-2 pl-1";

function Ligne({ reduit, fige, fleche, ...props }: PropsLigne & { reduit: boolean; fige: boolean; fleche: (id: string, sens: "monter" | "descendre") => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    // Mouvement réduit : les autres lignes changent de place sans glisser (la copie tenue suit toujours le pointeur).
    transition: reduit ? null : { duration: 200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition: transition ?? undefined };
  return (
    <li ref={setNodeRef} style={style} data-item data-flip={props.id} {...(fige || isDragging ? { "data-flip-fige": "" } : {})}
      className={`${CLASSE_LIGNE} ${isDragging ? "border-dashed border-bleu/60 [&>*]:opacity-30" : "border-bord"}`}>
      <Contenu {...props} fleche={fleche} poignee={{ ref: setActivatorNodeRef, ...attributes, ...listeners }} />
    </li>
  );
}

export default function Classement({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TClassement>) {
  const choisies = Array.isArray(etat.reponses.envies) ? (etat.reponses.envies as string[]) : [];
  const depart = Array.isArray(valeur) && valeur.length === choisies.length && valeur.every((x) => choisies.includes(x)) ? valeur : choisies;
  const [ordre, setOrdre] = useState<string[]>(depart);
  const [annonce, setAnnonce] = useState("");
  // Après un glisser, les lignes sont déjà à leur place : l'animation des flèches (FLIP) ne doit pas rejouer le mouvement.
  const [parGlisser, setParGlisser] = useState(false);
  const liste = useFlip<HTMLOListElement>(ordre.join(","));
  const dernierSurvol = useRef<UniqueIdentifier | null>(null);
  const [actif, setActif] = useState<string | null>(null); // la ligne tenue
  const [visee, setVisee] = useState<number | null>(null); // la place où elle irait si on la lâchait maintenant
  const [reduit] = useState(() => mouvementReduit());
  const label = (id: UniqueIdentifier) => quiz.envies.find((e) => e.id === id)?.label ?? String(id);
  const position = (id: UniqueIdentifier) => ordre.indexOf(String(id)) + 1;

  // Pendant le geste, les numéros suivent l'ordre qu'on aurait si on lâchait maintenant.
  const affiche = actif && visee !== null && visee >= 0 ? arrayMove(ordre, ordre.indexOf(actif), visee) : ordre;

  const capteurs = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: DELAI_TOUCHER, tolerance: TOLERANCE_TOUCHER } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Aux flèches : le focus reste sur la flèche utilisée, ou passe à l'autre si elle devient inactive.
  const fleche = (id: string, sens: "monter" | "descendre") => {
    const i = ordre.indexOf(id);
    const vers = sens === "monter" ? i - 1 : i + 1;
    if (vers < 0 || vers >= ordre.length) return;
    const n = arrayMove(ordre, i, vers);
    setParGlisser(false);
    setOrdre(n);
    setAnnonce(`${label(id)} : position ${vers + 1} sur ${n.length}.`);
    const actif = sens === "monter" ? vers > 0 : vers < n.length - 1;
    const cible = actif ? sens : sens === "monter" ? "descendre" : "monter";
    requestAnimationFrame(() => document.getElementById(`${cible}-${id}`)?.focus());
  };

  const survol = ({ over }: DragOverEvent) => {
    if (over && over.id !== dernierSurvol.current && dernierSurvol.current !== null) navigator.vibrate?.(10); // Android ; sans effet ailleurs
    dernierSurvol.current = over?.id ?? null;
    setVisee(over ? ordre.indexOf(String(over.id)) : null);
  };
  const soulever = ({ active }: DragStartEvent) => setActif(String(active.id));
  const finir = () => { dernierSurvol.current = null; setActif(null); setVisee(null); };
  const poser = ({ active, over }: DragEndEvent) => {
    finir();
    if (!over || active.id === over.id) return;
    setParGlisser(true);
    setOrdre((o) => arrayMove(o, o.indexOf(String(active.id)), o.indexOf(String(over.id))));
  };

  const annonces: Announcements = {
    onDragStart: ({ active }) => `${label(active.id)} soulevée, position ${position(active.id)} sur ${ordre.length}.`,
    onDragOver: ({ active, over }) => (over ? `${label(active.id)} : position ${position(over.id)} sur ${ordre.length}.` : `${label(active.id)} est hors de la liste.`),
    onDragEnd: ({ active, over }) => (over ? `${label(active.id)} posée en position ${position(over.id)} sur ${ordre.length}.` : `${label(active.id)} reposée à sa place.`),
    onDragCancel: ({ active }) => `Déplacement annulé : ${label(active.id)} reste en position ${position(active.id)}.`,
  };

  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <p className="sr-only" aria-live="polite">{annonce}</p>
      <p className="mt-2 hidden text-sm text-gris pointeur-fin:block">Au clavier : Espace sur une poignée, puis les flèches, puis Espace.</p>
      <DndContext sensors={capteurs} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragStart={soulever} onDragOver={survol} onDragEnd={poser} onDragCancel={finir}
        accessibility={{
          announcements: annonces,
          screenReaderInstructions: { draggable: "Pour déplacer cette envie : Espace ou Entrée pour la soulever, flèches haut et bas pour la déplacer, Espace ou Entrée pour la poser, Échap pour annuler." },
        }}>
        <SortableContext items={ordre} strategy={verticalListSortingStrategy}>
          <ol ref={liste} className="mt-4 space-y-2 select-none">
            {ordre.map((id) => (
              <Ligne key={id} id={id} rang={affiche.indexOf(id)} total={ordre.length} label={label(id)} icone={quiz.envies.find((x) => x.id === id)?.icone ?? ""} reduit={reduit} fige={parGlisser} fleche={fleche} />
            ))}
          </ol>
        </SortableContext>
        {/* La copie qui suit le pointeur : posée sur <body>, en position fixe, elle ne bouge pas quand la page défile. */}
        {typeof document !== "undefined" && createPortal(
          <DragOverlay modifiers={[restrictToVerticalAxis]} dropAnimation={reduit ? null : { duration: 200, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
            {actif ? (
              <div data-copie={actif} className={`${CLASSE_LIGNE} cursor-grabbing border-bleu shadow-xl ${reduit ? "" : "scale-[1.02]"}`}>
                <Contenu id={actif} rang={visee ?? ordre.indexOf(actif)} total={ordre.length} label={label(actif)} icone={quiz.envies.find((x) => x.id === actif)?.icone ?? ""} copie />
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" data-valider onClick={() => repondre(ordre)} className={BOUTON_PLEIN}>Valider ce classement</button>
      </Actions>
    </>
  );
}
