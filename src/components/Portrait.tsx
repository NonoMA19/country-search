import { Scale, Search, UserRound } from "lucide-react";
import type { LignePortrait, Portrait as TPortrait } from "@/lib/portrait";

// Ton portrait : un titre, des phrases courtes tirées de tes réponses, une contradiction s'il y en a une,
// et « Ce qu'on va chercher pour toi ». « Ce n'est pas moi » rouvre la question concernée (si « revoir » est fourni).
export default function Portrait({ portrait, revoir, compact = false }: { portrait: TPortrait; revoir?: (l: LignePortrait) => void; compact?: boolean }) {
  const { titre, lignes, contradiction, cherche, portraitSeul } = portrait;
  if (lignes.length === 0) return <p className="text-gris">Tu n’as pas encore assez répondu pour qu’on te décrive.</p>;
  const pasMoi = (l: LignePortrait) => revoir && l.revoir && (
    <button type="button" onClick={() => revoir(l)} className="mt-1 ml-8 inline-flex min-h-11 items-center text-sm font-medium text-lien underline" aria-label={`Ce n’est pas moi : ${l.texte}`}>
      Ce n’est pas moi
    </button>
  );
  return (
    <div>
      <p className={`${compact ? "text-lg" : "text-xl"} leading-snug font-semibold`}>{titre}.</p>
      <ul className={compact ? "mt-3 space-y-1.5" : "mt-4 space-y-3"}>
        {lignes.map((l) => (
          <li key={l.cle} className={compact ? "flex items-start gap-2 leading-snug" : "rounded-2xl border border-bord bg-carte px-4 py-3"}>
            {compact ? (
              <>
                <UserRound aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lien" />
                <span className="min-w-0 break-words">{l.texte}</span>
              </>
            ) : (
              <>
                <p className="flex items-start gap-3 text-lg leading-snug font-medium">
                  <UserRound aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-lien" />
                  <span className="min-w-0 break-words">{l.texte}</span>
                </p>
                {pasMoi(l)}
              </>
            )}
          </li>
        ))}
      </ul>
      {contradiction && (
        <div className={`mt-4 rounded-2xl border border-dashed border-bleu bg-carte ${compact ? "p-3" : "px-4 py-3"}`}>
          <p className="flex items-start gap-3 leading-snug">
            <Scale aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-lien" />
            <span className="min-w-0"><span className="font-semibold">Une hésitation{" "}: </span>{contradiction.texte}</span>
          </p>
          {!compact && pasMoi(contradiction)}
        </div>
      )}
      {portraitSeul.length > 0 && (
        <p className={`mt-4 text-sm leading-snug text-gris ${compact ? "" : "rounded-2xl bg-creux px-4 py-3"}`}>
          <span className="font-semibold text-encre">Enrichit ton portrait, sans changer ton classement{"\u00a0"}: </span>
          {portraitSeul.join(", ")}. Pas encore assez de données pays pour les comparer.
        </p>
      )}
      {cherche.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-2 font-semibold"><Search aria-hidden="true" className="h-4 w-4 text-lien" /> Ce qu’on va chercher pour toi</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {cherche.map((c) => <li key={c} className="rounded-full bg-bleu-doux px-3 py-1 text-sm font-medium">{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
