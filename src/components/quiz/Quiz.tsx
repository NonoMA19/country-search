"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, CircleHelp } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import { quiz, type Phrase } from "@/lib/donnees";
import { ecrire, useSession, type Etape, type Session } from "@/lib/memoire";
import {
  MIN_PHRASES, REPONSES_STABLES, annulerDerniere, calculer, demarrerPhrases, mesureDisponible,
  prochainePhrase, questionProfilVisible, repondre, resultatPret, type Profil,
} from "@/lib/moteur";

const BOUTON = "min-h-14 w-full rounded-2xl border px-5 py-3 text-left text-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";
const BOUTON_PLEIN = "min-h-14 w-full rounded-2xl bg-bleu px-5 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu";

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
    </main>
  );
}

// Une phrase : boutons Non, Passer, Oui, et glissement du doigt (droite : oui, gauche : non).
function CartePhrase({ phrase, repond }: { phrase: Phrase; repond: (r: string) => void }) {
  const depart = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const SEUIL = 90;
  const glisse = phrase.type !== "choix";
  return (
    <>
      <div
        onPointerDown={(e) => { if (glisse) depart.current = e.clientX; }}
        onPointerMove={(e) => { if (depart.current !== null) setDx(e.clientX - depart.current); }}
        onPointerUp={() => {
          if (depart.current === null) return;
          depart.current = null;
          if (dx > SEUIL) repond("oui"); else if (dx < -SEUIL) repond("non");
          setDx(0);
        }}
        onPointerCancel={() => { depart.current = null; setDx(0); }}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)`, touchAction: "pan-y" }}
        className={`relative flex min-h-48 flex-col justify-center rounded-3xl border-2 bg-carte p-6 shadow-sm select-none ${dx > SEUIL ? "border-bleu" : dx < -SEUIL ? "border-gris" : "border-bord"}`}
      >
        <p className="text-2xl leading-snug font-semibold">{phrase.texte}</p>
        {glisse && Math.abs(dx) > 20 && (
          <span className={`absolute top-3 rounded-full px-3 py-1 text-sm font-semibold ${dx > 0 ? "right-3 bg-bleu text-white" : "left-3 bg-gris text-white"}`}>{dx > 0 ? "Oui" : "Non"}</span>
        )}
      </div>
      <Pourquoi key={phrase.id} texte={phrase.pourquoi} />
      <div className="mt-auto pt-6">
        {phrase.type === "choix" ? (
          <div className="space-y-3">
            {phrase.options?.map((o) => (
              <button key={o.id} type="button" onClick={() => repond(o.id)} className={`${BOUTON} border-bord bg-carte hover:border-bleu`}>{o.label}</button>
            ))}
            <button type="button" onClick={() => repond("passer")} className="min-h-12 w-full rounded-2xl text-base font-medium text-gris hover:text-encre">Passer</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
              <button type="button" onClick={() => repond("non")} className="min-h-16 rounded-2xl border-2 border-bord bg-carte text-xl font-semibold hover:border-gris">Non</button>
              <button type="button" onClick={() => repond("passer")} className="min-h-16 rounded-2xl px-4 text-base font-medium text-gris hover:text-encre">Passer</button>
              <button type="button" onClick={() => repond("oui")} className="min-h-16 rounded-2xl bg-bleu text-xl font-semibold text-white hover:bg-blue-700">Oui</button>
            </div>
            <p className="mt-3 text-center text-xs text-gris">Tu peux aussi faire glisser la carte : à droite pour oui, à gauche pour non.</p>
          </>
        )}
      </div>
    </>
  );
}

export default function Quiz() {
  const session = useSession();
  const router = useRouter();
  if (!session) return <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10 text-gris">Chargement…</main>;

  const { etat, etape } = session;
  const maj = (s: Partial<Session>) => ecrire({ ...session, ...s });
  const aller = (e: Etape, autres: Partial<Session> = {}) => maj({ etape: e, ...autres });
  const questions = visibles(etat.profil);

  // ----- Profil -----
  if (etape.t === "profil") {
    const q = questions[Math.min(etape.i, questions.length - 1)];
    const rang = questions.indexOf(q);
    const suivant = (valeur: string | string[] | undefined) => {
      const profil: Profil = { ...etat.profil, [q.id]: valeur };
      for (const autre of quiz.profil) if (!questionProfilVisible(autre.id, profil)) delete profil[autre.id];
      const liste = visibles(profil);
      const i = liste.findIndex((x) => x.id === q.id) + 1;
      aller(i < liste.length ? { t: "profil", i } : { t: "priorites" }, { etat: { ...etat, profil } });
    };
    const choisies = Array.isArray(etat.profil[q.id]) ? (etat.profil[q.id] as string[]) : [];
    return (
      <Cadre progression={((rang + 1) / (questions.length + 3)) * 50} retour={rang > 0 ? () => aller({ t: "profil", i: rang - 1 }) : null}>
        <h1 className="text-2xl font-semibold">{q.question}</h1>
        <Pourquoi key={q.id} texte={q.pourquoi} />
        <div className="mt-5 space-y-3">
          {q.multiple ? (
            <>
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const actif = choisies.includes(o.id);
                  return (
                    <button key={o.id} type="button" aria-pressed={actif} onClick={() => maj({ etat: { ...etat, profil: { ...etat.profil, [q.id]: actif ? choisies.filter((x) => x !== o.id) : [...choisies, o.id] } } })}
                      className={`min-h-12 rounded-full border px-4 text-base font-medium ${actif ? "border-bleu bg-bleu text-white" : "border-bord bg-carte hover:border-bleu"}`}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => suivant(choisies)} className={`${BOUTON_PLEIN} mt-4`}>{choisies.length ? "Continuer" : q.aucun}</button>
            </>
          ) : (
            q.options.map((o) => (
              <button key={o.id} type="button" onClick={() => suivant(o.id)} className={`${BOUTON} ${etat.profil[q.id] === o.id ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                {o.label}
              </button>
            ))
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
      <Cadre progression={((questions.length + 1) / (questions.length + 3)) * 50} retour={() => aller({ t: "profil", i: questions.length - 1 })}>
        <h1 className="text-2xl font-semibold">Tes 3 priorités</h1>
        <p className="mt-2 text-gris">Choisis-en exactement 3. Elles compteront double dans ton résultat.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {quiz.priorites.map((p) => {
            const actif = etat.priorites.includes(p.id);
            const dispo = p.mesures.some(mesureDisponible);
            return (
              <button key={p.id} type="button" disabled={!dispo} aria-pressed={actif} onClick={() => basculer(p.id)}
                className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 p-3 text-center text-base leading-tight font-medium disabled:opacity-40 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                <Icone nom={p.icone} className={`h-8 w-8 ${actif ? "text-lien" : "text-gris"}`} />
                <span>{p.label}</span>
                {!dispo && <span className="text-xs text-gris">Bientôt</span>}
                {actif && <Check aria-hidden="true" className="absolute top-2 right-2 h-5 w-5 text-lien" />}
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-6">
          <button type="button" disabled={etat.priorites.length !== 3} onClick={() => aller({ t: "sujets" })} className={BOUTON_PLEIN}>
            {etat.priorites.length === 3 ? "Continuer" : `Encore ${3 - etat.priorites.length} à choisir`}
          </button>
        </div>
      </Cadre>
    );
  }

  // ----- Sujets en option -----
  if (etape.t === "sujets") {
    const lancer = (sujets: string[]) => aller({ t: "phrases" }, { etat: demarrerPhrases({ ...etat, sujets }), proposeA: -1 });
    return (
      <Cadre progression={((questions.length + 2) / (questions.length + 3)) * 50} retour={() => aller({ t: "priorites" })}>
        <h1 className="text-2xl font-semibold">Veux-tu aussi tenir compte de ces sujets ?</h1>
        <p className="mt-2 text-gris">C’est facultatif. Touche ceux qui comptent pour toi, ou passe.</p>
        <div className="mt-5 space-y-3">
          {quiz.sujets.map((s) => {
            const actif = etat.sujets.includes(s.id);
            const dispo = mesureDisponible(s.mesure);
            return (
              <button key={s.id} type="button" disabled={!dispo} aria-pressed={actif}
                onClick={() => maj({ etat: { ...etat, sujets: actif ? etat.sujets.filter((x) => x !== s.id) : [...etat.sujets, s.id] } })}
                className={`${BOUTON} flex items-center justify-between disabled:opacity-40 ${actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte hover:border-bleu"}`}>
                <span>{s.label}</span>
                {actif ? <Check aria-hidden="true" className="h-5 w-5 text-lien" /> : !dispo ? <span className="text-xs text-gris">Bientôt</span> : null}
              </button>
            );
          })}
        </div>
        <div className="mt-auto space-y-2 pt-6">
          <button type="button" onClick={() => lancer(etat.sujets)} className={BOUTON_PLEIN}>{etat.sujets.length ? "Continuer" : "Passer"}</button>
        </div>
      </Cadre>
    );
  }

  // ----- Phrases, une par une -----
  const phrase = prochainePhrase(etat);
  const top = calculer(etat).filter((l) => !l.ecart).slice(0, 3);
  const stables = (() => {
    const h = etat.historique;
    let n = 0;
    for (let i = h.length - 1; i > 0 && h[i] === h[i - 1]; i--) n++;
    return n;
  })();
  const progression = 50 + 50 * Math.min(1, (Math.min(etat.ordre.length, MIN_PHRASES) / MIN_PHRASES) * 0.6 + (Math.min(stables, REPONSES_STABLES) / REPONSES_STABLES) * 0.4);
  const retourPhrase = () => (etat.ordre.length > 0 ? aller({ t: "phrases" }, { etat: annulerDerniere(etat) }) : aller({ t: "sujets" }));

  if (etape.t === "pret" || !phrase) {
    return (
      <Cadre progression={100} retour={retourPhrase}>
        <h1 className="text-2xl font-semibold">{phrase ? "Ton top 3 ne bouge plus" : "On a fait le tour des questions utiles"}</h1>
        <p className="mt-2 text-gris">Ton résultat est prêt.{phrase ? " Tu peux aussi continuer pour l’affiner." : ""}</p>
        <ul className="mt-6 space-y-3">
          {top.map((l, i) => (
            <li key={l.pays.id} className="flex items-center gap-3 rounded-2xl border border-bord bg-carte p-4">
              <span className="w-5 text-lg font-semibold text-gris">{i + 1}</span>
              <Drapeau iso2={l.pays.iso2} />
              <span className="text-lg font-semibold">{l.pays.nom}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-3 pt-6">
          <button type="button" onClick={() => router.push("/resultat")} className={BOUTON_PLEIN}>Voir mon résultat</button>
          {phrase && (
            <button type="button" onClick={() => aller({ t: "phrases" }, { proposeA: etat.ordre.length })} className={`${BOUTON} border-bord bg-carte text-center hover:border-bleu`}>Continuer pour affiner</button>
          )}
        </div>
      </Cadre>
    );
  }

  const repond = (r: string) => {
    const suivant = repondre(etat, phrase.id, r);
    const proposer = resultatPret(suivant) && suivant.ordre.length >= session.proposeA + REPONSES_STABLES;
    aller(proposer ? { t: "pret" } : { t: "phrases" }, { etat: suivant });
  };

  return (
    <Cadre progression={progression} retour={retourPhrase}>
      <CartePhrase key={phrase.id} phrase={phrase} repond={repond} />
      <div className="mt-6 border-t border-bord pt-4">
        <p className="text-xs font-medium tracking-wide text-gris uppercase">Ton top 3 pour l’instant</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {top.map((l) => (
            <li key={l.pays.id} className="flex items-center gap-2 text-sm font-medium">
              <Drapeau iso2={l.pays.iso2} className="h-4 w-6" /> {l.pays.nom}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => router.push("/resultat")} className="mt-3 min-h-11 text-sm font-medium text-lien underline">
          M’arrêter là et voir mon résultat
        </button>
      </div>
    </Cadre>
  );
}
