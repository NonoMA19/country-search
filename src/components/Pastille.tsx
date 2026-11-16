"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { CONTACT_EMAIL } from "@/config";
import { EXPLICATION_TYPE, LIBELLE_TYPE, dateFr, type Preuve } from "@/lib/donnees";

const STYLE: Record<Preuve["type"], string> = {
  officiel: "bg-bleu text-white",
  "donnee-ouverte": "bg-bleu-doux text-encre",
  "notre-avis": "border border-bord bg-carte text-encre",
  temoignages: "border border-bleu bg-carte text-lien",
  "a-verifier": "border border-dashed border-gris text-gris",
};

const MOTIFS = ["Lien cassé", "Information fausse", "Information dépassée", "Autre"];

// Le nom affiché sur la pastille : une confiance « moyenne » est dite dès la pastille.
const libelle = (p: Preuve) => (p.type === "temoignages" && p.confiance === "moyenne" ? `${LIBELLE_TYPE.temoignages} · confiance moyenne` : LIBELLE_TYPE[p.type]);
// « www.expat.com/… » devient « expat.com » : assez pour reconnaître la source.
const site = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};
// Deux articles du même site : « expat.com (1) », « expat.com (2) ».
const nommer = (urls: string[]) =>
  urls.map((url) => {
    const nom = site(url);
    const memes = urls.filter((u) => site(u) === nom);
    return { url, nom: memes.length > 1 ? `${nom} (${memes.indexOf(url) + 1})` : nom };
  });

// Une pastille (Officiel, Donnée ouverte, Notre avis). Un tap ouvre la preuve.
// La fenêtre est placée à la fin de la page (portail) : une pastille vit souvent
// dans un paragraphe, et un paragraphe ne peut pas contenir de bloc.
// « contexte » complète le nom lu par les lecteurs d'écran : toutes les pastilles ne s'appellent pas « Officiel ».
export default function Pastille({ preuve, pays, contexte }: { preuve: Preuve; pays?: string; contexte?: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`relative ml-1 inline-flex min-h-7 items-center rounded-full max-w-full px-2.5 text-left align-middle text-[13px] font-medium after:absolute after:-inset-x-1 after:-inset-y-2 after:content-[''] ${STYLE[preuve.type]}`}
        aria-label={`${libelle(preuve)} : voir la preuve pour ${contexte ?? preuve.titre}${pays ? `, ${pays}` : ""}`}
        aria-haspopup="dialog"
      >
        {libelle(preuve)}
      </button>
      {ouvert && createPortal(<Fenetre preuve={preuve} pays={pays} fermer={() => setOuvert(false)} />, document.body)}
    </>
  );
}

function Fenetre({ preuve, pays, fermer }: { preuve: Preuve; pays?: string; fermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [signale, setSignale] = useState(false);
  const [motif, setMotif] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const idTitre = useId();
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const courriel = () => {
    const sujet = `Signalement : ${motif}${pays ? ` (${pays})` : ""}`;
    const corps = [`Information : ${preuve.titre}`, preuve.texte, preuve.lien ? `Lien : ${preuve.lien}` : "", "", details].join("\n");
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  };

  return (
      <dialog
        ref={ref}
        onClose={fermer}
        aria-labelledby={idTitre}
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-carte p-0 text-encre shadow-xl"
      >
        <div className="p-5 text-left text-base font-normal">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex min-h-6 items-center rounded-full px-2 text-xs font-medium ${STYLE[preuve.type]}`}>{libelle(preuve)}</span>
            <span className="sr-only"> : </span>
            <button type="button" onClick={() => ref.current?.close()} className="-m-2 rounded-full p-2 text-gris hover:text-encre" aria-label="Fermer">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-sm text-gris">{EXPLICATION_TYPE[preuve.type]}</p>
          <h2 id={idTitre} className="mt-3 text-lg font-semibold">{preuve.titre}</h2>
          <p className="mt-2">{preuve.texte}</p>
          {preuve.avertissement && <p className="mt-3 rounded-xl bg-creux p-3 text-sm">{preuve.avertissement}</p>}
          {preuve.type === "temoignages" && (
            <p className="mt-3 text-sm font-medium">{preuve.confiance === "bonne" ? "Confiance bonne" : "Confiance moyenne"}</p>
          )}
          <dl className="mt-4 space-y-2 text-sm">
            {preuve.type === "temoignages" ? (
              <>
                <div>
                  <dt className="font-medium text-gris">Sources ({preuve.liens?.length ?? 0})</dt>
                  <dd>
                    <ul>
                      {nommer(preuve.liens ?? []).map(({ url, nom }) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${nom} (s’ouvre dans un nouvel onglet)`} className="inline-flex min-h-11 items-center gap-1 break-all text-lien underline">
                            {nom} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
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
                <p className="rounded-xl bg-creux p-3">Ce sont des tendances générales tirées de témoignages. Ton entreprise peut être très différente.</p>
              </>
            ) : preuve.type === "a-verifier" && preuve.lien ? (
              <>
                <div><dd className="text-gris">Lu sur une page officielle, mais pas encore vérifié en détail. Vérifie sur la page avant toute démarche.</dd></div>
                <div>
                  <dt className="font-medium text-gris">Page lue</dt>
                  <dd>
                    <a href={preuve.lien} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-lien underline">
                      {preuve.source ?? preuve.lien} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </dd>
                </div>
                {preuve.verifieLe && (
                  <div>
                    <dt className="font-medium text-gris">Lu le</dt>
                    <dd>{dateFr(preuve.verifieLe)}</dd>
                  </div>
                )}
              </>
            ) : preuve.type === "a-verifier" ? (
              <div><dd className="text-gris">On n’a pas encore trouvé de source officielle ou de donnée ouverte pour cette information.</dd></div>
            ) : (
              <>
                <div>
                  <dt className="font-medium text-gris">Source</dt>
                  <dd>
                    {preuve.page ?? preuve.lien ? (
                      <a href={(preuve.page ?? preuve.lien) as string} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-lien underline">
                        {preuve.source} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      preuve.source
                    )}
                  </dd>
                </div>
                {preuve.page && preuve.lien && preuve.lien !== preuve.page && (
                  <div>
                    <dt className="font-medium text-gris">Données utilisées</dt>
                    <dd>
                      <a href={preuve.lien} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-lien underline">
                        Fichier brut, pour les curieux <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </dd>
                  </div>
                )}
                {preuve.annee && (
                  <div>
                    <dt className="font-medium text-gris">Année de la donnée</dt>
                    <dd>{preuve.annee}</dd>
                  </div>
                )}
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
                <p className="text-sm font-medium">Quel est le problème ?</p>
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
                <p className="mt-2 text-xs text-gris">Le site n’envoie et ne garde rien : ce bouton ouvre ton application de courriel.</p>
              </div>
            )}
          </div>
        </div>
      </dialog>
  );
}
