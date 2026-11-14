"use client";

import { useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { CONTACT_EMAIL } from "@/config";
import { LIBELLE_TYPE, dateFr, type Preuve } from "@/lib/donnees";

const STYLE: Record<Preuve["type"], string> = {
  officiel: "bg-bleu text-white",
  "donnee-ouverte": "bg-bleu-doux text-encre",
  "notre-avis": "border border-bord bg-carte text-encre",
  "a-verifier": "border border-dashed border-gris text-gris",
};

const MOTIFS = ["Lien cassé", "Information fausse", "Information dépassée", "Autre"];

// Une pastille (Officiel, Donnée ouverte, Notre avis). Un tap ouvre la preuve.
export default function Pastille({ preuve, pays }: { preuve: Preuve; pays?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [signale, setSignale] = useState(false);
  const [motif, setMotif] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const courriel = () => {
    const sujet = `Signalement : ${motif}${pays ? ` (${pays})` : ""}`;
    const corps = [`Information : ${preuve.titre}`, preuve.texte, preuve.lien ? `Lien : ${preuve.lien}` : "", "", details].join("\n");
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={`ml-1 inline-flex min-h-6 items-center rounded-full px-2 align-middle text-xs font-medium whitespace-nowrap ${STYLE[preuve.type]}`}
        aria-label={`${LIBELLE_TYPE[preuve.type]} : voir la preuve`}
      >
        {LIBELLE_TYPE[preuve.type]}
      </button>
      <dialog
        ref={ref}
        onClose={() => { setSignale(false); setMotif(null); setDetails(""); }}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-carte p-0 text-encre shadow-xl"
      >
        <div className="p-5 text-left text-base font-normal">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex min-h-6 items-center rounded-full px-2 text-xs font-medium ${STYLE[preuve.type]}`}>{LIBELLE_TYPE[preuve.type]}</span>
            <button type="button" onClick={() => ref.current?.close()} className="-m-2 rounded-full p-2 text-gris hover:text-encre" aria-label="Fermer">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <h3 className="mt-3 text-lg font-semibold">{preuve.titre}</h3>
          <p className="mt-2">{preuve.texte}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {preuve.type === "a-verifier" ? (
              <p className="text-gris">Cette information n’est pas encore vérifiée. Elle ne compte pas dans ton résultat.</p>
            ) : (
              <>
                <div>
                  <dt className="font-medium text-gris">Source</dt>
                  <dd>
                    {preuve.lien ? (
                      <a href={preuve.lien} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lien underline">
                        {preuve.source} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      preuve.source
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gris">Vérifié le</dt>
                  <dd>{dateFr(preuve.verifieLe)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gris">Licence</dt>
                  <dd>{preuve.licence}</dd>
                </div>
              </>
            )}
          </dl>
          <div className="mt-5 border-t border-bord pt-4">
            {CONTACT_EMAIL === "" ? (
              <button type="button" disabled className="min-h-11 w-full rounded-xl border border-bord px-4 text-sm text-gris">
                Les signalements seront ouverts bientôt.
              </button>
            ) : !signale ? (
              <button type="button" onClick={() => setSignale(true)} className="min-h-11 w-full rounded-xl border border-bord px-4 text-sm font-medium hover:border-bleu">
                Signaler un problème
              </button>
            ) : (
              <div>
                <p className="text-sm font-medium">Quel est le problème ?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOTIFS.map((m) => (
                    <button key={m} type="button" aria-pressed={motif === m} onClick={() => setMotif(m)} className={`min-h-11 rounded-xl border px-2 text-sm ${motif === m ? "border-bleu bg-bleu-doux font-medium" : "border-bord"}`}>
                      {m}
                    </button>
                  ))}
                </div>
                <label className="mt-3 block text-sm">
                  Détails (facultatif)
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-bord bg-fond p-2" />
                </label>
                {motif && (
                  <a href={courriel()} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-bleu px-4 text-sm font-semibold text-white">
                    Envoyer par e-mail
                  </a>
                )}
                <p className="mt-2 text-xs text-gris">Le site n’envoie et ne garde rien : ce bouton ouvre ton application de courriel.</p>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
