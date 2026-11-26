"use client";

import { useState } from "react";
import Emoji from "@/components/Emoji";
import type { Seuil as TSeuil } from "@/lib/donnees";
import { objetReponse, texteSeuil } from "@/lib/elements";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

// Le décor qui suit la température de janvier : neige sous 0 °C, gris froid, doux, puis soleil.
type Ambiance = { classe: string; emoji: string; mot: string };
function ambianceTemperature(t: number): Ambiance {
  if (t < 0) return { classe: "fond-neige", emoji: "snowman", mot: "Neige et grand froid" };
  if (t < 6) return { classe: "fond-gris", emoji: "fog", mot: "Froid et gris" };
  if (t < 12) return { classe: "fond-doux", emoji: "sun-behind-small-cloud", mot: "Hiver doux" };
  return { classe: "fond-soleil", emoji: "sun", mot: "Presque pas d’hiver" };
}

// Les flocons : quelques points qui tombent (immobiles en mouvement réduit, voir globals.css).
function Flocons() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="flocon" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.37) % 3}s`, animationDuration: `${3 + (i % 4)}s` }} />
      ))}
    </span>
  );
}

// Le temps de vol : un avion qui avance sur la ligne entre la France et le bout du monde.
function Trajet({ part }: { part: number }) {
  return (
    <span aria-hidden="true" className="relative mt-3 block h-12">
      <span className="absolute top-1/2 right-6 left-6 border-t-2 border-dashed border-bord" />
      <Emoji nom="house" className="absolute top-1/2 left-0 h-7 w-7 -translate-y-1/2" />
      <Emoji nom="globe-showing-asia-australia" className="absolute top-1/2 right-0 h-7 w-7 -translate-y-1/2" />
      <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-300" style={{ left: `calc(1.75rem + ${part} * (100% - 3.5rem))` }}>
        <Emoji nom="airplane" className="h-8 w-8" />
      </span>
    </span>
  );
}

// Un seuil au curseur (« au-delà de 12 h de vol »). Par défaut, au-delà du seuil : « Je préfère éviter ».
// La case « C'est non négociable » en fait une limite « Rédhibitoire ». « Aucune limite » répond tout de suite.
export default function Seuil({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TSeuil>) {
  const avant = objetReponse(valeur);
  const [n, setN] = useState(avant.seuil ? Number(avant.seuil) : el.defaut);
  const [ferme, setFerme] = useState(avant.niveau === "redhibitoire");
  const texte = texteSeuil(el, n);
  const temperature = el.mesure === "hiver";
  const amb = temperature ? ambianceTemperature(n) : null;
  const part = (n - el.min) / (el.max - el.min);
  return (
    <>
      <EnTete element={el} etat={etat} titreId={titreId} />
      <div className={`relative mt-6 overflow-hidden rounded-3xl border border-bord p-5 transition-colors duration-500 ${amb ? amb.classe : "bg-carte"}`}>
        {amb?.classe === "fond-neige" && <Flocons />}
        <div className="relative">
          {amb && (
            <span className="flex flex-col items-center gap-1">
              <Emoji key={amb.emoji} nom={amb.emoji} className="emoji-chapitre h-14 w-14" />
              <span className="text-sm font-semibold">{amb.mot}</span>
            </span>
          )}
          {!temperature && el.mesure === "vol" && <Trajet part={part} />}
          <p className="mt-2 text-center text-2xl font-bold" aria-hidden="true">{texte}</p>
          <input type="range" min={el.min} max={el.max} step={el.pas} value={n} onChange={(e) => setN(Number(e.target.value))}
            aria-labelledby={titreId ?? "titre-ecran"} aria-valuetext={texte} className="mt-3 h-10 w-full accent-bleu" />
          <div className="mt-1 flex justify-between text-sm font-medium" aria-hidden="true"><span>{el.min}{" "}{el.unite}</span><span>{el.max}{" "}{el.unite}</span></div>
          <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-bord bg-carte px-4 py-2 font-semibold has-[:checked]:border-encre">
            <input type="checkbox" checked={ferme} onChange={(e) => setFerme(e.target.checked)} className="h-5 w-5 accent-bleu" />
            <span>C’est non négociable <span className="block text-sm font-normal text-gris">Facultatif. Sinon, tu préfères seulement éviter.</span></span>
          </label>
        </div>
      </div>
      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" data-valider onClick={() => repondre({ niveau: ferme ? "redhibitoire" : "eviter", seuil: String(n) })} className={BOUTON_PLEIN}>Valider ce seuil</button>
        <button type="button" onClick={() => repondre({ niveau: "ok" })} className={`min-h-12 w-full rounded-2xl border-2 border-bord bg-carte px-5 text-base font-semibold hover:border-bleu lg:w-auto ${FOCUS}`}>Aucune limite</button>
      </Actions>
    </>
  );
}
