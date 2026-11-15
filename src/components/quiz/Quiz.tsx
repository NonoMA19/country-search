"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, CircleHelp } from "lucide-react";
import Chargement from "@/components/Chargement";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import Portrait from "@/components/Portrait";
import { useFlip } from "@/lib/animation";
import { quiz, type Dilemme } from "@/lib/donnees";
import { ecrire, useSession, type Etape, type Session } from "@/lib/memoire";
import {
  MIN_DILEMMES, REPONSES_STABLES, annulerDerniere, calculer, changerReponse, demarrerDilemmes, mesureDisponible, portrait,
  prochainDilemme, questionProfilVisible, rejouer, repondre, repondues, reponsesStables, resultatPret, trouverDilemme, type LignePortrait, type Profil,
} from "@/lib/moteur";

export const BOUTON = "min-h-14 w-full rounded-2xl border px-5 py-3 text-left text-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";
const BOUTON_PLEIN = "min-h-14 w-full rounded-2xl bg-bleu px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-bord disabled:text-encre focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";

const visibles = (p: Profil) => quiz.profil.filter((q) => questionProfilVisible(q.id, p));

function Pourquoi({ texte }: { texte: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm text-gris hover:text-encre">
        <CircleHelp aria-hidden="true" className="h-5 w-5" />
        <span>Pourquoi on te demande ça</span>
      </button>
      {ouvert && <p className="mt-1 rounded-xl bg-creux px-3 py-2 text-sm">{texte}</p>}
    </div>
  );
}

function Cadre({ progression, retour, children }: { progression: number; retour: (() => void) | null; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-4 pb-8">
      <div className="flex items-center gap-3">
        {retour ? (
          <button type="button" onClick={retour} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:text-encre">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Retour
          </button>
        ) : (
          <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:text-encre">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Accueil
          </Link>
        )}
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bord" role="progressbar" aria-label="Avancement du quiz" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progression)}>
          <div className="h-full rounded-full bg-bleu transition-all" style={{ width: `${progression}%` }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-6">{children}</div>
      <p className="mt-8 text-xs text-gris">
        Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.{" "}
        <Link href="/mentions-legales" className="text-lien underline">Mentions légales</Link>
      </p>
    </main>
  );
}

// Un dilemme : une scène, puis 2 ou 3 options en cartes. Un tap pour répondre.
export function CarteDilemme({ dilemme, repond, titreId = "titre-ecran", choisie, passer = "Passer", niveau = "h1" }: {
  dilemme: Dilemme; repond: (r: string) => void; titreId?: string; choisie?: string; passer?: string; niveau?: "h1" | "h3";
}) {
  const lettres = ["A", "B", "C"];
  const Titre = niveau;
  return (
    <>
      <p className="text-xs font-medium tracking-wide text-gris uppercase">{dilemme.theme}</p>
      <Titre id={titreId} tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">{dilemme.titre}</Titre>
      <p className="mt-2 text-lg leading-snug">{dilemme.scene}</p>
      <div className="mt-5 space-y-3" role="group" aria-labelledby={titreId}>
        {dilemme.options.map((o, i) => (
          <button key={o.id} type="button" onClick={() => repond(o.id)} aria-pressed={choisie !== undefined ? choisie === o.id : undefined}
            className={`flex min-h-16 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors hover:border-bleu focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu ${choisie === o.id ? "border-bleu bg-bleu-doux" : "border-bord bg-carte"}`}>
            <span aria-hidden="true" className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-creux text-sm font-semibold text-gris">{lettres[i]}</span>
            <span className="min-w-0">
              <span className="block text-lg leading-snug font-medium break-words">{o.texte}</span>
              {o.detail && <span className="mt-0.5 block text-sm leading-snug text-gris">{o.detail}</span>}
            </span>
          </button>
        ))}
      </div>
      {dilemme.exemple && <p className="mt-3 text-xs text-gris">Les montants et les durées sont des exemples, pas les chiffres d’un pays.</p>}
      <Pourquoi key={dilemme.id} texte={dilemme.pourquoi} />
      <button type="button" onClick={() => repond("passer")} className="mt-2 min-h-12 w-full rounded-2xl text-base font-medium text-gris hover:text-encre">{passer}</button>
    </>
  );
}

// « Ton top 3 pour l'instant » : les drapeaux glissent vers leur nouvelle place quand le classement change.
function TopEnCours({ top, change }: { top: { id: string; nom: string; iso2: string }[]; change: boolean }) {
  const cle = top.map((p) => p.id).join(",");
  const ref = useFlip<HTMLUListElement>(cle);
  const noms = top.map((p) => p.nom).join(", ");
  return (
    <>
      <p className="text-xs font-medium tracking-wide text-gris uppercase">Ton top 3 pour l’instant</p>
      <p className="sr-only" aria-live="polite">{change ? `Ton top 3 a changé\u00a0: ${noms}.` : `Ton top 3 pour l’instant\u00a0: ${noms}.`}</p>
      <ul ref={ref} className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {top.map((p) => (
          <li key={p.id} data-flip={p.id} className="flex items-center gap-2 text-sm font-medium">
            <Drapeau iso2={p.iso2} className="h-4 w-6" /> {p.nom}
          </li>
        ))}
      </ul>
    </>
  );
}

// Après un changement d'écran, les clics arrivés trop vite sont ignorés :
// un double clic ne doit pas répondre aussi à la question suivante.
const DELAI_CLIC = 400;
let dernierChangement = -Infinity;
const clicLibre = () => performance.now() - dernierChangement >= DELAI_CLIC;
const marquerChangement = () => { dernierChangement = performance.now(); };

export default function Quiz() {
  const session = useSession();
  const router = useRouter();
  // À chaque nouvel écran, le focus va sur le titre : un lecteur d'écran lit la nouvelle question.
  const ecran = session ? `${JSON.stringify(session.etape)}:${session.etat.ordre.length}` : "";
  const premier = useRef(true);
  useEffect(() => {
    if (!ecran) return;
    if (premier.current) { premier.current = false; return; }
    document.getElementById("titre-ecran")?.focus({ preventScroll: false });
  }, [ecran]);
  if (!session) return <Chargement />;

  const { etat, etape } = session;
  const maj = (s: Partial<Session>) => { if (clicLibre()) ecrire({ ...session, ...s }); };
  const aller = (e: Etape, autres: Partial<Session> = {}) => {
    if (!clicLibre()) return;
    marquerChangement();
    ecrire({ ...session, etape: e, ...autres });
  };
  // Avant le résultat : l'écran Valeurs (facultatif).
  const voirResultat = () => aller({ t: "sujets" });
  const allerAuResultat = () => { if (clicLibre()) { marquerChangement(); router.push("/resultat"); } };
  const questions = visibles(etat.profil);

  // ----- Profil -----
  if (etape.t === "profil") {
    const q = questions[Math.min(etape.i, questions.length - 1)];
    const rang = questions.indexOf(q);
    const suivant = (valeur: string | string[] | undefined) => {
      const profil: Profil = { ...etat.profil, [q.id]: valeur };
      for (const autre of quiz.profil) if (!questionProfilVisible(autre.id, profil)) delete profil[autre.id];
      if (etape.retour === "portrait") return aller({ t: "portrait" }, { etat: rejouer({ ...etat, profil }) });
      const liste = visibles(profil);
      const i = liste.findIndex((x) => x.id === q.id) + 1;
      aller(i < liste.length ? { t: "profil", i } : { t: "priorites" }, { etat: { ...etat, profil } });
    };
    const choisies = Array.isArray(etat.profil[q.id]) ? (etat.profil[q.id] as string[]) : [];
    return (
      <Cadre progression={((rang + 1) / (questions.length + 1)) * 40} retour={etape.retour === "portrait" ? () => aller({ t: "portrait" }) : rang > 0 ? () => aller({ t: "profil", i: rang - 1 }) : null}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">{q.question}</h1>
        <Pourquoi key={q.id} texte={q.pourquoi} />
        <div className="mt-5 space-y-3">
          {q.multiple ? (
            <>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const actif = choisies.includes(o.id);
                  return (
                    <button key={o.id} type="button" aria-pressed={actif} onClick={() => maj({ etat: { ...etat, profil: { ...etat.profil, [q.id]: actif ? choisies.filter((x) => x !== o.id) : [...choisies, o.id] } } })}
                      className={`inline-flex min-h-12 items-center gap-1.5 rounded-full border px-4 text-base font-medium ${actif ? "border-bleu bg-bleu text-white" : "border-bord bg-carte hover:border-bleu"}`}>
                      {actif && <Check aria-hidden="true" className="h-4 w-4" />}
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
                <button type="button" onClick={() => suivant(choisies)} className={BOUTON_PLEIN}>{choisies.length ? "Continuer" : q.aucun}</button>
              </div>
            </>
          ) : (
            q.options.map((o) => {
              const choisi = etat.profil[q.id] === o.id;
              return (
                <button key={o.id} type="button" aria-pressed={choisi} onClick={() => suivant(o.id)} className={`${BOUTON} flex items-center justify-between gap-3 ${choisi ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                  <span>{o.label}</span>
                  {choisi && <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-lien" />}
                </button>
              );
            })
          )}
        </div>
        {!q.multiple && (
          <button type="button" onClick={() => suivant(undefined)} className="mt-4 min-h-12 w-full rounded-2xl text-base font-medium text-gris hover:text-encre">Passer</button>
        )}
      </Cadre>
    );
  }

  // ----- Tes 3 priorités -----
  if (etape.t === "priorites") {
    const basculer = (id: string) => {
      const p = etat.priorites.includes(id) ? etat.priorites.filter((x) => x !== id) : etat.priorites.length < 3 ? [...etat.priorites, id] : etat.priorites;
      maj({ etat: { ...etat, priorites: p } });
    };
    return (
      <Cadre progression={((questions.length + 1) / (questions.length + 1)) * 40} retour={() => (etape.retour === "portrait" ? aller({ t: "portrait" }) : aller({ t: "profil", i: questions.length - 1 }))}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">Tes 3 priorités</h1>
        <p className="mt-2 text-gris">Choisis-en exactement 3. Elles compteront double dans ton résultat.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {quiz.priorites.filter((p) => p.mesures.some(mesureDisponible)).map((p) => {
            const actif = etat.priorites.includes(p.id);
            return (
              <button key={p.id} type="button" aria-pressed={actif} onClick={() => basculer(p.id)}
                className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 p-3 text-center text-base leading-tight font-medium ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                <Icone nom={p.icone} className={`h-8 w-8 ${actif ? "text-lien" : "text-gris"}`} />
                <span>{p.label}</span>
                {actif && <Check aria-hidden="true" className="absolute top-2 right-2 h-5 w-5 text-lien" />}
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
          <p className="sr-only" aria-live="polite">{etat.priorites.length === 3 ? "3 priorités choisies." : `Encore ${3 - etat.priorites.length} à choisir.`}</p>
          <button type="button" disabled={etat.priorites.length !== 3} onClick={() => (etape.retour === "portrait" ? aller({ t: "portrait" }, { etat: rejouer(etat) }) : aller({ t: "dilemmes" }, { etat: demarrerDilemmes(etat), proposeA: -1 }))} className={BOUTON_PLEIN}>
            {etat.priorites.length === 3 ? "Continuer" : `Encore ${3 - etat.priorites.length} à choisir`}
          </button>
        </div>
      </Cadre>
    );
  }

  // ----- Sujets en option -----
  if (etape.t === "sujets") {
    const lancer = () => aller({ t: "portrait" });
    return (
      <Cadre progression={100} retour={() => aller({ t: "pret" })}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">Veux-tu aussi tenir compte de ces sujets ?</h1>
        <p className="mt-2 text-gris">C’est facultatif. Touche ceux qui comptent pour toi, ou passe.</p>
        <div className="mt-5 space-y-3">
          {quiz.sujets.filter((s) => mesureDisponible(s.mesure)).map((s) => {
            const actif = etat.sujets.includes(s.id);
            return (
              <button key={s.id} type="button" aria-pressed={actif}
                onClick={() => maj({ etat: { ...etat, sujets: actif ? etat.sujets.filter((x) => x !== s.id) : [...etat.sujets, s.id] } })}
                className={`${BOUTON} flex items-center justify-between ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                <span>{s.label}</span>
                {actif && <Check aria-hidden="true" className="h-5 w-5 text-lien" />}
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur space-y-2">
          <button type="button" onClick={lancer} className={BOUTON_PLEIN}>{etat.sujets.length ? "Continuer" : "Passer"}</button>
        </div>
      </Cadre>
    );
  }

  // ----- Ton portrait -----
  if (etape.t === "portrait") {
    const revoir = (l: LignePortrait) => {
      if (l.revoir.t === "dilemme") aller({ t: "revoir", id: l.revoir.id });
      else if (l.revoir.t === "priorites") aller({ t: "priorites", retour: "portrait" });
      else aller({ t: "profil", i: Math.max(0, questions.findIndex((x) => x.id === "objectif")), retour: "portrait" });
    };
    return (
      <Cadre progression={100} retour={() => aller({ t: "sujets" })}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">Ton portrait</h1>
        <p className="mt-2 text-gris">Voilà ce qu’on a compris de toi. Si une phrase ne te ressemble pas, change ta réponse.</p>
        <div className="mt-5"><Portrait lignes={portrait(etat)} revoir={revoir} /></div>
        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
          <button type="button" onClick={allerAuResultat} className={BOUTON_PLEIN}>C’est moi, voir mon résultat</button>
        </div>
      </Cadre>
    );
  }

  // ----- Revoir un dilemme depuis le portrait -----
  if (etape.t === "revoir") {
    const d = trouverDilemme(etape.id);
    if (d) {
      const change = (r: string) => (r === "passer" ? aller({ t: "portrait" }) : aller({ t: "portrait" }, { etat: changerReponse(etat, d.id, r) }));
      return (
        <Cadre progression={100} retour={() => aller({ t: "portrait" })}>
          <CarteDilemme key={d.id} dilemme={d} repond={change} choisie={etat.reponses[d.id]} passer="Garder ma réponse" />
        </Cadre>
      );
    }
  }

  // ----- Dilemmes, un par un -----
  const dilemme = prochainDilemme(etat);
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  // « Passer » ne fait pas avancer : seules les vraies réponses comptent.
  const stables = reponsesStables(etat);
  const progression = 40 + 60 * Math.min(1, (Math.min(repondues(etat), MIN_DILEMMES) / MIN_DILEMMES) * 0.6 + (Math.min(stables, REPONSES_STABLES) / REPONSES_STABLES) * 0.4);
  const retourDilemme = () => (etat.ordre.length > 0 ? aller({ t: "dilemmes" }, { etat: annulerDerniere(etat) }) : aller({ t: "priorites" }));

  if (etape.t === "pret" || !dilemme) {
    const titre = !dilemme ? "On a fait le tour des questions utiles" : resultatPret(etat) ? "Ton top 3 ne bouge plus" : "Ton top 3 pour l’instant";
    return (
      <Cadre progression={100} retour={retourDilemme}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">{titre}</h1>
        <p className="mt-2 text-gris">Ton résultat est prêt.{dilemme ? " Tu peux aussi continuer pour l’affiner." : ""}</p>
        <ul className="mt-6 space-y-3">
          {top.map((l, i) => (
            <li key={l.pays.id} className="flex items-center gap-3 rounded-2xl border border-bord bg-carte p-4">
              <span className="w-5 text-lg font-semibold text-gris">{i + 1}</span>
              <Drapeau iso2={l.pays.iso2} />
              <span className="text-lg font-semibold">{l.pays.nom}</span>
            </li>
          ))}
        </ul>
        <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur space-y-3">
          <button type="button" onClick={voirResultat} className={BOUTON_PLEIN}>Voir mon résultat</button>
          {dilemme && (
            <button type="button" onClick={() => aller({ t: "dilemmes" }, { proposeA: repondues(etat) })} className={`${BOUTON} border-bord bg-carte text-center hover:border-bleu`}>Continuer pour affiner</button>
          )}
        </div>
      </Cadre>
    );
  }

  const repond = (r: string) => {
    const suivant = repondre(etat, dilemme.id, r);
    const proposer = resultatPret(suivant) && repondues(suivant) >= session.proposeA + REPONSES_STABLES;
    aller(proposer ? { t: "pret" } : { t: "dilemmes" }, { etat: suivant });
  };

  return (
    <Cadre progression={progression} retour={retourDilemme}>
      <CarteDilemme key={dilemme.id} dilemme={dilemme} repond={repond} />
      <div className="mt-6 border-t border-bord pt-4">
        <TopEnCours top={top.map((l) => ({ id: l.pays.id, nom: l.pays.nom, iso2: l.pays.iso2 }))} change={etat.historique.length > 1 && etat.historique.at(-1) !== etat.historique.at(-2)} />
        <button type="button" onClick={voirResultat} className="mt-3 min-h-11 text-sm font-medium text-lien underline">
          M’arrêter là et voir mon résultat
        </button>
      </div>
    </Cadre>
  );
}
