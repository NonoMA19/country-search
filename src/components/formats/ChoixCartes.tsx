"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import Emoji from "@/components/Emoji";
import Icone from "@/components/Icone";
import type { ChoixCartes as TChoix } from "@/lib/donnees";
import { AUCUN, optionsDe } from "@/lib/elements";
import { envieDisponible, raisonEnviePortrait, raisonEnvieIndisponible } from "@/lib/moteur";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, PlusMoins, type PropsFormat } from "./commun";

// Les drapeaux d'une langue (des images, pas des emojis) : deux drapeaux quand la langue est parlée dans plusieurs pays du site.
const DRAPEAUX_LANGUE: Record<string, string[]> = {
  en: ["GB", "US"], es: ["ES", "MX"], de: ["DE", "AT"], it: ["IT", "CH"], pt: ["PT", "BR"], nl: ["NL", "BE"],
  scandinave: ["SE", "NO"], ja: ["JP"], ko: ["KR"], zh: ["CN", "TW"], ar: ["MA", "AE"],
};
const ELEMENTS_LANGUES = new Set(["langues", "relance-langue"]);
function Drapeaux({ langue }: { langue: string }) {
  const liste = DRAPEAUX_LANGUE[langue];
  if (!liste) return null;
  return <span aria-hidden="true" className="flex shrink-0 gap-1">{liste.map((c) => <Drapeau key={c} iso2={c} className="h-4 w-6" />)}</span>;
}

// Les options « ne sait pas » : sur téléphone, elles sortent de la grille et deviennent un bouton discret dessous.
const DISCRETES = new Set(["autre", "inconnu"]);

type Opt = ReturnType<typeof optionsDe>[number] & { indispo: string | null; phrase?: string; plus?: string; moins?: string };

// Une tuile horizontale de 64 px : une pastille ronde (l'image provisoire, avec son texte alternatif) et le libellé.
function Tuile({ o, actif, desactive, onClick, idBase, classe = "" }: { o: Opt; actif: boolean; desactive: boolean; onClick: () => void; idBase: string; classe?: string }) {
  return (
    <button type="button" data-option aria-pressed={actif} disabled={desactive} aria-labelledby={idBase} aria-describedby={o.phrase || o.indispo ? `${idBase}-d` : undefined} onClick={onClick}
      className={`relative flex h-full min-h-16 w-full min-w-0 items-center gap-2 rounded-2xl border-2 py-2 pr-4 pl-2 min-[400px]:gap-2.5 min-[400px]:pr-5 min-[400px]:pl-2.5 text-left transition-colors disabled:opacity-50 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS} ${classe}`}>
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors min-[400px]:h-11 min-[400px]:w-11 ${actif ? "bg-white" : "bg-bleu-doux"}`}>
        {o.emoji ? <Emoji nom={o.emoji} className="h-6 w-6 min-[400px]:h-7 min-[400px]:w-7" /> : <Icone nom={o.icone ?? "circle-help"} className="h-5 w-5 text-lien" />}
      </span>
      <span className="min-w-0 flex-1">
        <span id={idBase} lang="fr" className="block text-sm leading-tight font-semibold hyphens-auto [overflow-wrap:normal]">{o.label}</span>
        {(o.phrase || o.indispo) && <span id={`${idBase}-d`} className="mt-0.5 block text-xs leading-snug text-gris">{o.indispo ?? o.phrase}</span>}
      </span>
      {actif && (
        <span aria-hidden="true" className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bleu">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

// Des cartes à choix unique (un toucher suffit) ou multiple (on coche, puis « Continuer »).
// Avec image (secteur, envies, projet) : des tuiles en grille. Sans image : une liste (choix unique) ou des pastilles à cocher (choix multiple).
export default function ChoixCartes({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TChoix>) {
  const initial = Array.isArray(valeur) ? valeur : [];
  const [choisies, setChoisies] = useState<string[]>(initial);
  const critere = !!el.source?.startsWith("envies");
  // Un critère sans donnée pays pour 30 pays reste choisissable : sa carte dit qu'il enrichit le portrait.
  const options: Opt[] = optionsDe(el, etat.reponses).map((o) => ({ ...o, indispo: el.source === "envies" ? raisonEnvieIndisponible(o.id, etat.profil) : null, phrase: critere ? (raisonEnviePortrait(o.id, etat.profil) ?? undefined) : o.phrase }))
    .filter((o) => !critere || envieDisponible(o.id, etat.profil) || o.indispo);
  const nombre = el.nombre;
  const plafond = nombre ?? el.max;
  const plein = plafond !== undefined && choisies.length >= plafond;
  const basculer = (id: string) => setChoisies((c) => (c.includes(id) ? c.filter((x) => x !== id) : plein ? c : [...c, id]));
  const avecImage = !el.sansImage;
  const estActif = (id: string) => (el.multiple ? choisies.includes(id) : valeur === id);
  const toucher = (id: string) => (el.multiple ? basculer(id) : repondre(id));
  const discrete = avecImage ? options.find((o) => DISCRETES.has(o.id)) : undefined;

  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      {avecImage ? (
        <>
          <div className="mt-5 grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
            {options.map((o) => (
              <Tuile key={o.id} o={o} actif={estActif(o.id)} desactive={!!o.indispo || (!!el.multiple && !estActif(o.id) && plein)} onClick={() => toucher(o.id)}
                idBase={`${el.id}-${o.id}`} classe={o === discrete ? "hidden sm:flex" : ""} />
            ))}
          </div>
          {discrete && (
            <button type="button" aria-pressed={estActif(discrete.id)} onClick={() => toucher(discrete.id)}
              className={`mt-3 inline-flex min-h-11 items-center gap-2 self-center rounded-full px-4 text-base font-medium sm:hidden ${estActif(discrete.id) ? "bg-bleu-doux text-encre" : "text-lien underline"} ${FOCUS}`}>
              {estActif(discrete.id) && <Check aria-hidden="true" className="h-4 w-4" />}{discrete.label}
            </button>
          )}
        </>
      ) : el.multiple ? (
        <>
          <p className="mt-4 text-sm font-medium text-gris">{el.id === "langues" ? "Coche toutes celles que tu parles." : "Coche tout ce qui compte pour toi."}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
            {options.map((o) => {
              const actif = choisies.includes(o.id);
              return (
                <button key={o.id} type="button" data-option role="checkbox" aria-checked={actif} onClick={() => basculer(o.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-2.5 text-base font-medium transition-colors ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                  <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${actif ? "border-bleu bg-bleu" : "border-gris bg-carte"}`}>
                    {actif && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  {ELEMENTS_LANGUES.has(el.id) && <Drapeaux langue={o.id} />}
                  {o.label}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3" role="group" aria-labelledby={titreId ?? "titre-ecran"}>
          {options.map((o) => {
            const actif = valeur === o.id;
            const idBase = `${el.id}-${o.id}`;
            return (
              <button key={o.id} type="button" data-option aria-pressed={actif} aria-labelledby={idBase} aria-describedby={[o.phrase ? `${idBase}-d` : "", el.avecPlusMoins && o.plus ? `${idBase}-pm` : ""].filter(Boolean).join(" ") || undefined}
                onClick={() => repondre(o.id)}
                className={`relative flex min-h-14 w-full min-w-0 items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                {ELEMENTS_LANGUES.has(el.id) && <span className="mt-1"><Drapeaux langue={o.id} /></span>}
                {o.emoji && <Emoji nom={o.emoji} className="mt-0.5 h-7 w-7" />}
                <span className="min-w-0 flex-1">
                  <span id={idBase} className="block text-base leading-snug font-semibold break-words">{o.label}</span>
                  {o.phrase && <span id={`${idBase}-d`} className="mt-0.5 block text-sm leading-snug text-gris">{o.phrase}</span>}
                  {el.avecPlusMoins && o.plus && o.moins && <span id={`${idBase}-pm`} className="block"><PlusMoins plus={o.plus} moins={o.moins} /></span>}
                </span>
                {actif && <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-lien" />}
              </button>
            );
          })}
        </div>
      )}
      {el.multiple ? (
        <Actions passer={passer} libellePasser={libellePasser}>
          {el.max !== undefined && nombre === undefined ? (
            <>
              <p className="pb-1 text-center text-sm text-gris" aria-live="polite">{choisies.length} sur {el.max} au plus</p>
              {choisies.length > 0 ? (
                <button type="button" onClick={() => repondre(choisies)} data-valider className={BOUTON_PLEIN}>Continuer ({choisies.length})</button>
              ) : el.aucun ? (
                <button type="button" data-valider onClick={() => repondre([])} className={`min-h-14 w-full rounded-2xl border-2 border-bord bg-carte px-5 text-lg font-semibold hover:border-bleu lg:w-auto lg:min-w-64 ${FOCUS}`}>{el.aucun}</button>
              ) : (
                <button type="button" disabled className={BOUTON_PLEIN}>Choisis au moins 1</button>
              )}
            </>
          ) : nombre !== undefined ? (
            <>
              <p className="pb-1 text-center text-sm text-gris" aria-live="polite">{choisies.length === nombre ? `${nombre} choisies.` : `${choisies.length} sur ${nombre}`}</p>
              <button type="button" disabled={choisies.length !== nombre} onClick={() => repondre(choisies)} data-valider className={BOUTON_PLEIN}>
                {choisies.length === nombre ? "Continuer" : `Encore ${nombre - choisies.length} à choisir`}
              </button>
            </>
          ) : choisies.length > 0 ? (
            <button type="button" onClick={() => repondre(choisies)} data-valider className={BOUTON_PLEIN}>Continuer ({choisies.length})</button>
          ) : (
            <button type="button" data-valider onClick={() => repondre([])} className={`min-h-14 w-full rounded-2xl border-2 border-bord bg-carte px-5 text-lg font-semibold hover:border-bleu lg:w-auto lg:min-w-64 ${FOCUS}`}>{el.aucun ?? "Aucune"}</button>
          )}
        </Actions>
      ) : (
        <Actions passer={passer} libellePasser={libellePasser}>
          {el.aucun && <button type="button" data-valider onClick={() => repondre(AUCUN)} className={`min-h-12 w-full rounded-2xl border-2 border-bord bg-carte px-5 text-base font-semibold hover:border-bleu lg:w-auto ${FOCUS}`}>{el.aucun}</button>}
        </Actions>
      )}
    </>
  );
}
