import { Pencil, Scale, Search } from "lucide-react";
import Emoji from "@/components/Emoji";
import type { Portrait } from "@/lib/portrait";
import type { BlocSynthese } from "@/lib/profil";

// Ton portrait en fiche de synthèse (prompt 7) : quelques blocs avec emoji, un seul bouton « Modifier » par bloc.
// En dessous : une hésitation s'il y en a une, et « Ce qu'on va chercher pour toi ».
export default function SyntheseProfil({ blocs, portrait, modifier, compact = false }: { blocs: BlocSynthese[]; portrait: Portrait; modifier?: (id: string) => void; compact?: boolean }) {
  const Titre = compact ? "h3" : "h2";
  // Version compacte (haut du résultat) : une ligne par bloc, pour laisser la place au top 3.
  if (compact) {
    return (
      <div className="min-w-0">
        <p className="text-lg leading-snug font-semibold break-words">{portrait.titre}.</p>
        <ul className="mt-3 divide-y divide-bord rounded-2xl border border-bord bg-carte">
          {blocs.map((b) => (
            <li key={b.id} className="flex min-w-0 items-start gap-3 px-3 py-2.5">
              <Emoji nom={b.emoji} className="mt-0.5 h-6 w-6" />
              <div className="min-w-0 flex-1 leading-snug">
                <Titre className="text-sm font-semibold text-gris">{b.titre}</Titre>
                <p className="break-words">{b.lignes.length ? b.lignes.map((l) => l.texte).join(" · ") : b.vide}</p>
              </div>
              {modifier && b.revoir && (
                <button type="button" onClick={() => modifier(b.revoir!)} aria-label={`Modifier : ${b.titre.toLowerCase()}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lien hover:bg-creux focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu">
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className={`${compact ? "text-lg" : "text-xl"} leading-snug font-semibold break-words`}>{portrait.titre}.</p>
      <ul className={"mt-4 grid gap-3 sm:grid-cols-2"}>
        {blocs.map((b, i) => (
          <li key={b.id} className="ligne-une-par-une flex min-w-0 flex-col rounded-2xl border border-bord bg-carte p-4" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bleu-doux"><Emoji nom={b.emoji} className="h-7 w-7" /></span>
              <Titre className="min-w-0 flex-1 text-base font-semibold break-words">{b.titre}</Titre>
            </div>
            {b.lignes.length ? (
              <ul className="mt-3 space-y-1.5">
                {b.lignes.map((l) => (
                  <li key={l.texte} className="flex items-start gap-2 leading-snug break-words">
                    {l.emoji ? <Emoji nom={l.emoji} className="mt-0.5 h-5 w-5" /> : <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bleu" />}
                    <span className="min-w-0">{l.texte}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-gris">{b.vide}</p>
            )}
            {modifier && b.revoir && (
              <button type="button" onClick={() => modifier(b.revoir!)} aria-label={`Modifier : ${b.titre.toLowerCase()}`}
                className="mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 self-start pt-2 text-sm font-semibold text-lien underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu">
                <Pencil aria-hidden="true" className="h-4 w-4" /> Modifier
              </button>
            )}
          </li>
        ))}
      </ul>
      {portrait.contradiction && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-bleu bg-carte px-4 py-3 leading-snug">
          <Scale aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-lien" />
          <p className="min-w-0"><span className="font-semibold">Une hésitation{" "}: </span>{portrait.contradiction.texte}</p>
        </div>
      )}
      {portrait.cherche.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-2 font-semibold"><Search aria-hidden="true" className="h-4 w-4 text-lien" /> Ce qu’on va chercher pour toi</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {portrait.cherche.map((c) => <li key={c} className="rounded-full bg-bleu-doux px-3 py-1 text-sm font-medium">{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
