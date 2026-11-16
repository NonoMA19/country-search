import { UserRound } from "lucide-react";
import type { LignePortrait } from "@/lib/portrait";

// Ton portrait : des phrases courtes tirées de tes réponses.
// « Ce n'est pas moi » rouvre la question concernée (seulement si « revoir » est fourni).
export default function Portrait({ lignes, revoir, compact = false }: { lignes: LignePortrait[]; revoir?: (l: LignePortrait) => void; compact?: boolean }) {
  if (lignes.length === 0) return <p className="text-gris">Tu n’as pas encore assez répondu pour qu’on te décrive.</p>;
  if (compact) {
    return (
      <ul className="space-y-1.5">
        {lignes.map((l) => (
          <li key={l.cle} className="flex items-start gap-2 leading-snug">
            <UserRound aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-lien" />
            <span className="min-w-0 break-words">{l.texte}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-3">
      {lignes.map((l) => (
        <li key={l.cle} className="rounded-2xl border border-bord bg-carte px-4 py-3">
          <p className="flex items-start gap-3 text-lg leading-snug font-medium">
            <UserRound aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-lien" />
            <span className="min-w-0 break-words">{l.texte}</span>
          </p>
          {revoir && l.revoir && (
            <button type="button" onClick={() => revoir(l)} className="mt-1 ml-8 inline-flex min-h-11 items-center text-sm font-medium text-lien underline" aria-label={`Ce n’est pas moi : ${l.texte}`}>
              Ce n’est pas moi
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
