"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft } from "lucide-react";
import Chargement from "@/components/Chargement";
import Drapeau from "@/components/Drapeau";
import Portrait from "@/components/Portrait";
import Emoji from "@/components/Emoji";
import { FORMATS } from "@/components/formats/registre";
import { BARRE_BAS, BOUTON_PLEIN, PanneauContexte } from "@/components/formats/commun";
import { useFlip } from "@/lib/animation";
import { clicLibre, marquerChangement, marquerLibre } from "@/lib/clic";
import { quiz, trouverElement, type Aide, type Element, type Valeur } from "@/lib/donnees";
import { optionsDe } from "@/lib/elements";
import { intuition } from "@/lib/intuition";
import { PASSER } from "@/lib/elements";
import { ecrire, useSession, type Etape, type Session } from "@/lib/memoire";
import { aideDe, annulerDerniere, changerReponse, repondre, type Etat } from "@/lib/moteur";
import { CHAPITRES, MAX_ADAPTATIF, NB_CHAPITRES, chapitreDe, nombreEcrans, elementVisible, estAdaptatif, nonDemandes, prochainAffiner, prochainElement, restantsAffiner, topCourant, vusDans } from "@/lib/parcours";
import { portraitComplet, type LignePortrait } from "@/lib/portrait";

export { BOUTON_PLEIN };

// L'avancement : 5 segments, un par chapitre, et le nom du chapitre en cours.
function Progression({ chapitre, part }: { chapitre: number; part: number }) {
  const ch = CHAPITRES.find((c) => c.numero === chapitre);
  const total = ((chapitre - 1 + Math.min(1, part)) / NB_CHAPITRES) * 100;
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-semibold text-gris">Chapitre {chapitre} sur {NB_CHAPITRES}{ch ? ` : ${ch.titre}` : ""}</p>
      <div className="mt-1 flex gap-1" role="progressbar" aria-label={`Chapitre ${chapitre} sur ${NB_CHAPITRES}${ch ? ` : ${ch.titre}` : ""}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(total)}>
        {CHAPITRES.map((c) => (
          <span key={c.numero} className="h-2 flex-1 overflow-hidden rounded-full bg-bord">
            <span className="block h-full rounded-full bg-bleu transition-all" style={{ width: `${c.numero < chapitre ? 100 : c.numero === chapitre ? Math.round(Math.min(1, part) * 100) : 0}%` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// L'avancement détaillé, dans le panneau de droite sur ordinateur : les 5 chapitres, faits, en cours ou à venir.
function ProgressionDetaillee({ chapitre, part }: { chapitre: number; part: number }) {
  return (
    <ol className="space-y-1.5" aria-label="Les chapitres du quiz">
      {CHAPITRES.map((c) => {
        const fait = c.numero < chapitre, enCours = c.numero === chapitre;
        return (
          <li key={c.numero} className={`flex items-center gap-3 text-sm ${enCours ? "font-semibold text-encre" : fait ? "text-encre" : "text-gris"}`} aria-current={enCours ? "step" : undefined}>
            <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${fait ? "bg-bleu text-white" : enCours ? "border-2 border-bleu text-lien" : "border-2 border-bord"}`}>
              {fait ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : c.numero}
            </span>
            <span className="min-w-0 flex-1">
              {c.titre}
              <span className="sr-only">{fait ? " : fait" : enCours ? " : en cours" : " : à venir"}</span>
              {enCours && (
                <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-full bg-bord">
                  <span className="block h-full rounded-full bg-bleu transition-all" style={{ width: `${Math.round(Math.min(1, part) * 100)}%` }} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Le panneau de droite (ordinateur) ne montre que les étapes et le chapitre en cours (prompt 7) : ces champs ne servent plus
// qu'à l'aperçu du top sous la question.
type Panneau = { aide?: Aide; top?: { id: string; nom: string; iso2: string }[]; change?: boolean; attente?: string };

// « cle » change à chaque écran : l'écran entre en fondu avec un léger glissement (un simple fondu en mouvement réduit).
// Téléphone et tablette : une seule colonne, l'avancement en haut, compact. Ordinateur (1024 px et plus) : deux colonnes,
// la question à gauche, un panneau à droite avec seulement les étapes et le chapitre en cours.
function Cadre({ chapitre, part, retour, children, cle = "" }: { chapitre: number; part: number; retour: (() => void) | null; children: ReactNode; cle?: string; panneau?: Panneau }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-x-clip px-5 pt-4 pb-6 md:max-w-2xl lg:max-w-6xl lg:px-8 lg:pt-8">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,44rem)_22rem] xl:justify-center">
        <div className="flex min-w-0 flex-1 flex-col lg:min-h-[calc(100dvh-8rem)]">
          <div className="flex items-center gap-3">
            {retour ? (
              <button type="button" data-retour onClick={retour} className="-ml-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:bg-creux hover:text-encre focus-visible:outline-2 focus-visible:outline-bleu">
                <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Retour
              </button>
            ) : (
              <Link href="/" className="-ml-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:bg-creux hover:text-encre">
                <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Accueil
              </Link>
            )}
            <div className="flex min-w-0 flex-1 lg:hidden"><Progression chapitre={chapitre} part={part} /></div>
            <p className="hidden min-w-0 flex-1 truncate text-right text-sm font-medium text-gris lg:block">Chapitre {chapitre} sur {NB_CHAPITRES}</p>
          </div>
          <PanneauContexte.Provider value={true}>
            <div key={cle} className="ecran-entree flex flex-1 flex-col pt-5 lg:pt-8">{children}</div>
          </PanneauContexte.Provider>
        </div>
        <aside className="hidden rounded-3xl border border-bord bg-carte p-6 lg:sticky lg:top-8 lg:block" aria-label="Ton avancement">
          <h2 className="text-xs font-medium tracking-wide text-gris uppercase">Ton avancement</h2>
          <div className="mt-3"><ProgressionDetaillee chapitre={chapitre} part={part} /></div>
        </aside>
      </div>
      <p className="mt-6 text-xs text-gris lg:mt-10">
        Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.{" "}
        <Link href="/mentions-legales" className="text-lien underline">Mentions légales</Link>
      </p>
    </main>
  );
}

// « Ton top 3 pour l'instant » : les drapeaux glissent vers leur nouvelle place quand le classement change.
function TopEnCours({ top, change, panneau = false }: { top: { id: string; nom: string; iso2: string }[]; change: boolean; panneau?: boolean }) {
  const cle = top.map((p) => p.id).join(",");
  const ref = useFlip<HTMLOListElement>(cle);
  const noms = top.map((p) => p.nom).join(", ");
  return (
    <div className={panneau ? "border-t border-bord pt-4" : "mt-5 border-t border-bord pt-4"}>
      <p className="text-xs font-medium tracking-wide text-gris uppercase">{panneau ? `Ton top ${top.length} pour l’instant` : "Ton top 3 pour l’instant"}</p>
      <p className="sr-only" aria-live="polite">{change ? `Ton top a changé : ${noms}.` : `Ton top pour l’instant : ${noms}.`}</p>
      <ol ref={ref} className={panneau ? "mt-2 space-y-1.5" : "mt-2 flex flex-wrap gap-x-4 gap-y-2"}>
        {top.map((p, i) => (
          <li key={p.id} data-flip={p.id} className="flex items-center gap-2 text-sm font-medium">
            {panneau && <span className="w-4 text-right text-xs text-gris tabular-nums">{i + 1}</span>}
            <Drapeau iso2={p.iso2} className="h-4 w-6" /> {p.nom}
          </li>
        ))}
      </ol>
      {panneau && <p className="mt-2 text-xs text-gris">Il bouge à chaque réponse. Ton résultat complet vient à la fin.</p>}
    </div>
  );
}

// L'avancement dans le chapitre de l'élément : son rang parmi les écrans du chapitre
// (pour les chapitres 3 et 4, sur 6 écrans environ, sans jamais atteindre la fin avant la fin).
function partDuChapitre(etat: Session["etat"], el: Element): number {
  const c = el.chapitre;
  if (estAdaptatif(c)) return Math.min(0.9, vusDans(etat, c).length / (MAX_ADAPTATIF(c) - 1));
  const visibles = quiz.elements.filter((x) => x.chapitre === c && (etat.reponses[x.id] !== undefined || elementVisible(x, etat)));
  return Math.max(0, visibles.findIndex((x) => x.id === el.id)) / Math.max(1, visibles.length);
}

// L'écran d'ouverture d'un chapitre : son titre et une phrase.
function Transition({ chapitre, continuer }: { chapitre: number; continuer: () => void }) {
  const ch = CHAPITRES.find((c) => c.numero === chapitre)!;
  return (
    <div className="flex flex-1 flex-col">
      <div className="my-auto py-8 text-center">
        {ch.emoji && <div className="emoji-chapitre mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-bleu-doux"><Emoji nom={ch.emoji} className="h-14 w-14" /></div>}
        <ol className="mx-auto mt-5 flex w-fit gap-2" aria-label={`Chapitre ${chapitre} sur ${NB_CHAPITRES}`}>
          {CHAPITRES.map((c) => <li key={c.numero} aria-hidden="true" className={`h-2 rounded-full transition-all duration-500 ${c.numero < chapitre ? "w-6 bg-bleu" : c.numero === chapitre ? "w-10 bg-bleu" : "w-6 bg-bord"}`} />)}
        </ol>
        <p className="mt-3 text-sm font-semibold tracking-wide text-lien uppercase">Chapitre {chapitre} sur {NB_CHAPITRES}</p>
        <h1 id="titre-ecran" tabIndex={-1} className="ligne-une-par-une mt-1 text-3xl font-bold break-words outline-none">{ch.titre}</h1>
        <ul className="mx-auto mt-3 max-w-sm space-y-1 text-lg leading-snug text-gris">
          {(ch.lignes ?? [ch.phrase]).map((l, i) => <li key={l} className="ligne-une-par-une" style={{ animationDelay: `${200 + i * 250}ms` }}>{l}</li>)}
        </ul>
      </div>
      <div className={`${BARRE_BAS} pt-3 pb-4 lg:justify-center lg:py-0`}>
        <button type="button" data-valider onClick={continuer} className={BOUTON_PLEIN}>Commencer le chapitre</button>
      </div>
    </div>
  );
}

// « Ton intuition et tes réponses » : la carte du début face à ton n° 1.
function EcranIntuition({ etat, suite }: { etat: Session["etat"]; suite: () => void }) {
  const i = intuition(etat);
  return (
    <>
      <p className="inline-flex min-h-7 w-fit items-center self-start rounded-full bg-bleu-doux px-3 text-sm font-semibold text-encre">Ton intuition</p>
      <h1 id="titre-ecran" tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">Ton intuition et tes réponses</h1>
      <p className="mt-3 text-lg leading-snug">{i.phrase}</p>
      {i.n1 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-bord bg-carte p-4">
          <Drapeau iso2={i.n1.pays.iso2} className="h-8 w-12" />
          <p className="text-xl font-semibold">{i.n1.pays.nom}</p>
          {i.cas === "autre" && i.meilleurDansZones && <p className="ml-auto text-right text-sm text-gris">Le mieux placé de ta zone{"\u00a0"}: {i.meilleurDansZones.pays.nom}</p>}
        </div>
      )}
      {i.raisons.length > 0 && (
        <>
          <p className="mt-5 font-semibold">Ce qui a compté{"\u00a0"}:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{i.raisons.map((r, k) => <li key={r} className="ligne-une-par-une" style={{ animationDelay: `${(k + 1) * 150}ms` }}>{r.charAt(0).toUpperCase() + r.slice(1)}</li>)}</ul>
        </>
      )}
      <p className="mt-5 text-sm text-gris">Ta carte du début compte un peu : un petit bonus aux pays de ta zone, rien de retiré aux autres. Ton résultat complet vient juste après ton portrait.</p>
      <div className={`${BARRE_BAS} pt-3 pb-4 lg:py-0`}>
        <button type="button" data-valider onClick={suite} className={BOUTON_PLEIN}>Voir mon portrait</button>
      </div>
    </>
  );
}

// « Ce qu'on ne t'a pas demandé, et pourquoi » : l'écran final du questionnaire.
// Les éléments de la banque non posés, regroupés par raison ; ce que le site ne sait pas encore mesurer ; ce qu'il ne demande jamais.
const PAS_ENCORE = ["Le loyer par ville", "les impôts (ce qui reste sur 100 € bruts, au-delà du salaire moyen)", "les transports", "les écoles en français", "ton expérience pro et ton diplôme, que certains visas exigent"];
function EcranPasDemande({ etat, suite }: { etat: Session["etat"]; suite: () => void }) {
  const liste = nonDemandes(etat);
  const n = liste.reduce((t, g) => t + g.titres.length, 0);
  return (
    <>
      <p className="inline-flex min-h-7 w-fit items-center self-start rounded-full bg-bleu-doux px-3 text-sm font-semibold text-encre">Avant ton résultat</p>
      <h1 id="titre-ecran" tabIndex={-1} className="mt-1 text-2xl leading-snug font-semibold break-words outline-none">Ce qu’on ne t’a pas demandé, et pourquoi</h1>
      <p className="mt-2 text-lg leading-snug">Tu as répondu à {nombreEcrans(etat)} écrans. {n} autres questions existent : voici pourquoi on ne te les a pas posées.</p>
      <div className="mt-4 space-y-3">
        {liste.map((g, k) => (
          <details key={g.raison} className="ligne-une-par-une rounded-2xl border border-bord bg-carte p-3" style={{ animationDelay: `${k * 120}ms` }}>
            <summary className="min-h-11 cursor-pointer py-1 font-semibold leading-snug">{g.raison} <span className="font-normal text-gris">({g.titres.length})</span></summary>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">{g.titres.map((t) => <li key={t}>{t}</li>)}</ul>
          </details>
        ))}
        <div className="rounded-2xl border border-bord bg-carte p-3">
          <p className="font-semibold">Ce qu’on ne sait pas encore mesurer pour les 38 pays</p>
          <p className="mt-1 text-sm">{PAS_ENCORE.join(" ; ")}. Ces sujets viendront quand des données ouvertes et comparables existeront.</p>
        </div>
        <div className="rounded-2xl border border-bord bg-carte p-3">
          <p className="font-semibold">Ce qu’on ne te demandera jamais</p>
          <p className="mt-1 text-sm">Tes opinions politiques, ta religion, ta santé. Tes réponses restent dans ton navigateur : rien n’est envoyé.</p>
        </div>
      </div>
      <div className={`${BARRE_BAS} pt-3 pb-4 lg:py-0`}>
        <button type="button" data-valider onClick={suite} className={BOUTON_PLEIN}>Continuer</button>
      </div>
    </>
  );
}

// Un écran en deux temps (prompt 7) : d'abord pourquoi tu pars, puis sous quelle forme. Le deuxième temps glisse
// depuis la droite (un simple fondu en mouvement réduit). Les deux réponses sont enregistrées ensemble, à la fin.
function DeuxTemps({ premier, second, etat, finir }: { premier: Element; second: Element; etat: Etat; finir: (e: Etat) => void }) {
  const [temps1, setTemps1] = useState<{ v: Valeur } | null>(null);
  const deuxieme = temps1 !== null;
  const montre = useRef(false);
  useEffect(() => {
    if (!montre.current) { montre.current = true; return; }
    document.getElementById("titre-ecran")?.focus();
  }, [deuxieme]);
  const F1 = FORMATS[premier.type], F2 = FORMATS[second.type];
  if (!temps1) {
    return <F1 key={premier.id} element={premier} etat={etat} valeur={etat.reponses[premier.id]} repondre={(v: Valeur) => setTemps1({ v })} passer={() => setTemps1({ v: PASSER })} />;
  }
  const etat1 = repondre(etat, premier.id, temps1.v);
  const choix = premier.type === "choix-cartes" && typeof temps1.v === "string" ? optionsDe(premier).find((o) => o.id === temps1.v)?.label : undefined;
  return (
    <div key={second.id} className="temps-entree flex flex-1 flex-col">
      <button type="button" onClick={() => setTemps1(null)} className="mb-3 inline-flex min-h-11 w-fit items-center gap-1 rounded-full text-sm font-medium text-lien underline">
        <ChevronLeft aria-hidden="true" className="h-4 w-4" /> {choix ? `Ta raison : ${choix}` : "Revenir à ta raison"}
      </button>
      <F2 element={second} etat={etat1} repondre={(v: Valeur) => finir(repondre(etat1, second.id, v))} passer={() => finir(repondre(etat1, second.id, PASSER))} />
    </div>
  );
}

const phraseRestants = (n: number) => (n > 1 ? `Encore ${n} questions possibles` : n === 1 ? "Encore 1 question possible" : "Plus aucune question à affiner");

// Un écran de secours : jamais de page vide, toujours un bouton pour continuer.
function Secours({ chapitre, texte, portrait }: { chapitre: number; texte: string; portrait: () => void }) {
  return (
    <Cadre chapitre={chapitre} part={1} retour={portrait}>
      <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold outline-none">On revient à ton portrait</h1>
      <p className="mt-2 text-lg">{texte}</p>
      <div className={`${BARRE_BAS} pt-3 pb-4 lg:py-0`}>
        <button type="button" data-valider onClick={portrait} className={BOUTON_PLEIN}>Revenir à mon portrait</button>
      </div>
    </Cadre>
  );
}

export default function Quiz() {
  const session = useSession();
  const router = useRouter();
  const [horsLigne, setHorsLigne] = useState(false);
  // À chaque nouvel écran, le focus va sur le titre : un lecteur d'écran lit la nouvelle question.
  const ecran = session ? `${JSON.stringify(session.etape)}:${session.etat.ordre.length}:${session.chapitresVus.length}` : "";
  const premier = useRef(true);
  useEffect(() => {
    if (!ecran) return;
    if (premier.current) { premier.current = false; return; }
    document.getElementById("titre-ecran")?.focus({ preventScroll: false });
    window.scrollTo({ top: 0 });
  }, [ecran]);
  // Bouton Retour du navigateur et geste retour d'Android : on revient à l'écran précédent, sans quitter le quiz.
  // Une entrée d'historique « tampon » (même adresse) est ajoutée ; quand elle est consommée, on clique sur le bouton
  // Retour de l'écran et on la remet. Au premier écran (lien « Accueil »), on laisse le navigateur quitter le quiz.
  useEffect(() => {
    const armer = () => window.history.pushState({ ...(window.history.state ?? {}), csQuiz: true }, "");
    armer();
    const surRetour = () => {
      const bouton = document.querySelector<HTMLButtonElement>("[data-retour]");
      if (bouton) { marquerLibre(); bouton.click(); armer(); } else window.history.back();
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);
  // Raccourcis clavier (ordinateur) : 1 à 9 choisissent une option, Entrée valide, Retour arrière revient.
  // Jamais quand on écrit dans un champ, règle un curseur, ou tient une ligne du classement.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const cible = e.target instanceof HTMLElement ? e.target : null;
      if (cible?.closest("input, textarea, select, [contenteditable='true'], [role='slider'], dialog")) return;
      if (document.querySelector("[data-copie]")) return;
      const visibles = (sel: string) => [...document.querySelectorAll<HTMLButtonElement>(sel)].filter((b) => b.offsetParent !== null && !b.disabled);
      if (/^[1-9]$/.test(e.key)) {
        const b = visibles("main [data-option]")[Number(e.key) - 1];
        if (b) { e.preventDefault(); b.click(); }
      } else if (e.key === "Enter") {
        // Entrée sur un bouton ou un lien garde son sens habituel ; ailleurs (titre, page), elle valide l'écran.
        if (cible && cible !== document.body && !cible.matches("h1, main")) return;
        const b = visibles("main [data-valider]")[0];
        if (b) { e.preventDefault(); b.click(); }
      } else if (e.key === "Backspace") {
        const b = document.querySelector<HTMLButtonElement>("[data-retour]");
        if (b) { e.preventDefault(); b.click(); }
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);
  if (!session) return <Chargement />;

  const { etat, etape } = session;
  // L'aperçu du top dans le panneau (ordinateur) : dès que tes envies sont choisies, les 5 premiers pays.
  const envies = Array.isArray(etat.reponses.envies) && (etat.reponses.envies as string[]).length > 0;
  const apercu: Panneau = envies
    ? { top: topCourant(etat, 5).map((l) => ({ id: l.pays.id, nom: l.pays.nom, iso2: l.pays.iso2 })) }
    : { attente: "Ton top apparaîtra ici dès que tu auras choisi tes critères." };
  const aller = (e: Etape, autres: Partial<Session> = {}) => {
    if (!clicLibre()) return;
    marquerChangement();
    ecrire({ ...session, etape: e, ...autres });
  };
  // Hors ligne, la page du résultat ne peut pas se charger : on le dit dans le site, au lieu de la page d'erreur du navigateur.
  const allerAuResultat = () => {
    if (!clicLibre()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setHorsLigne(true); return; }
    marquerChangement();
    router.push("/resultat");
  };
  const retourQuiz = () => (etat.ordre.length > 0 ? aller({ t: "quiz" }, { etat: annulerDerniere(etat) }) : null);

  // ----- Ce qu'on ne t'a pas demandé, et pourquoi -----
  if (etape.t === "pas-demande") {
    return (
      <Cadre cle={ecran} chapitre={NB_CHAPITRES} part={1} retour={retourQuiz} panneau={apercu}>
        <EcranPasDemande etat={etat} suite={() => aller({ t: "intuition" })} />
      </Cadre>
    );
  }

  // ----- Ton intuition et tes réponses -----
  if (etape.t === "intuition") {
    const retourIntuition = () => aller({ t: "pas-demande" });
    return (
      <Cadre cle={ecran} chapitre={NB_CHAPITRES} part={1} retour={retourIntuition}>
        <EcranIntuition etat={etat} suite={() => aller({ t: "portrait" })} />
      </Cadre>
    );
  }

  // ----- Ton portrait -----
  if (etape.t === "portrait") {
    const revoir = (l: LignePortrait) => { if (l.revoir) aller({ t: "revoir", id: l.revoir.id }); };
    const restants = restantsAffiner(etat);
    return (
      <Cadre cle={ecran} chapitre={NB_CHAPITRES} part={1} retour={() => aller({ t: "intuition" })}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">Ton portrait</h1>
        {etape.fin && <p role="status" className="mt-3 rounded-2xl bg-bleu-doux px-4 py-3 font-medium">Tu as répondu à tout. Ton portrait est à jour.</p>}
        <p className="mt-2 text-gris">Voilà ce qu’on a compris de toi. Si une phrase ne te ressemble pas, change ta réponse.</p>
        <div className="mt-5"><Portrait portrait={portraitComplet(etat)} revoir={revoir} /></div>
        <div className={`${BARRE_BAS} space-y-2 pt-3 pb-4 lg:space-y-0 lg:py-0`}>
          {horsLigne && <p role="alert" className="rounded-2xl bg-creux px-4 py-3 text-sm font-medium lg:basis-full">Tu sembles hors ligne : ton résultat ne peut pas s’ouvrir pour l’instant. Tes réponses sont gardées. Réessaie quand la connexion revient.</p>}
          <button type="button" data-valider onClick={allerAuResultat} className={BOUTON_PLEIN}>C’est moi, voir mon résultat</button>
          {restants > 0 && prochainAffiner(etat) && (
            <button type="button" onClick={() => aller({ t: "affiner" })} className="min-h-12 w-full rounded-2xl border border-bord bg-carte px-3 text-base font-semibold hover:border-bleu lg:min-h-14 lg:w-auto lg:px-6">
              Continuer pour affiner <span className="font-normal text-gris">· {phraseRestants(restants)}</span>
            </button>
          )}
        </div>
      </Cadre>
    );
  }

  // ----- Revoir un élément depuis le portrait -----
  if (etape.t === "revoir") {
    const el = trouverElement(etape.id);
    if (!el) return <Secours chapitre={NB_CHAPITRES} texte="Cette question n’existe plus." portrait={() => aller({ t: "portrait" })} />;
    const apres: Etape = etape.retour === "intuition" ? { t: "intuition" } : { t: "portrait" };
    {
      const F = FORMATS[el.type];
      return (
        <Cadre cle={ecran} chapitre={el.chapitre} part={1} retour={() => aller(apres)} panneau={{ aide: aideDe(el, etat.profil), ...apercu }}>
          <F key={el.id} element={el} etat={etat} valeur={etat.reponses[el.id]} libellePasser="Garder ma réponse"
            repondre={(v: Valeur) => aller(apres, { etat: changerReponse(etat, el.id, v) })} passer={() => aller(apres)} />
        </Cadre>
      );
    }
  }

  // ----- « Continuer pour affiner » : un élément de plus des chapitres 3 et 4 -----
  if (etape.t === "affiner") {
    const el = prochainAffiner(etat);
    if (el) {
      const F = FORMATS[el.type];
      // Après chaque réponse : s'il ne reste plus rien, retour au portrait avec un message.
      const suivant = (v: Valeur) => {
        const nouvel = repondre(etat, el.id, v);
        aller(prochainAffiner(nouvel) ? { t: "affiner" } : { t: "portrait", fin: true }, { etat: nouvel });
      };
      return (
        <Cadre cle={ecran} chapitre={el.chapitre} part={1} retour={() => aller({ t: "portrait" })} panneau={{ aide: aideDe(el, etat.profil), ...apercu }}>
          <p className="mb-2 text-sm font-medium text-gris">{phraseRestants(restantsAffiner(etat))}</p>
          <F key={`${el.id}:${etat.ordre.length}`} element={el} etat={etat} repondre={suivant} passer={() => suivant(PASSER)} />
          <button type="button" onClick={() => aller({ t: "portrait" })} className="mt-3 min-h-11 text-sm font-medium text-lien underline">J’ai fini, revoir mon portrait</button>
        </Cadre>
      );
    }
    return <Secours chapitre={NB_CHAPITRES} texte="Tu as répondu à toutes les questions. Ton portrait est à jour." portrait={() => aller({ t: "portrait", fin: true })} />;
  }

  // ----- Le parcours : l'élément suivant -----
  const el = prochainElement(etat);
  if (!el) {
    // Tout est répondu : ce qu'on ne t'a pas demandé, ton intuition face à tes réponses, puis le portrait.
    if (typeof window !== "undefined") queueMicrotask(() => ecrire({ ...session, etape: { t: "pas-demande" } }));
    return <Chargement />;
  }
  // Un nouveau chapitre commence : son écran d'ouverture (à partir du chapitre 2).
  if (el.chapitre > 1 && !session.chapitresVus.includes(el.chapitre) && vusDans(etat, el.chapitre).length === 0) {
    return (
      <Cadre cle={ecran} chapitre={el.chapitre} part={0} retour={retourQuiz} panneau={apercu}>
        <Transition chapitre={el.chapitre} continuer={() => aller({ t: "quiz" }, { chapitresVus: [...session.chapitresVus, el.chapitre] })} />
      </Cadre>
    );
  }
  const F = FORMATS[el.type];
  const suivant = (v: Valeur) => aller({ t: "quiz" }, { etat: repondre(etat, el.id, v) });
  // Un élément qui se montre dans le même écran que celui-ci, en deuxième temps (le projet après la motivation).
  const second = quiz.elements.find((x) => x.memeEcranQue === el.id && etat.reponses[x.id] === undefined);
  const adaptatif = estAdaptatif(el.chapitre);
  const top = adaptatif ? topCourant(etat, 3) : [];
  const change = etat.historique.length > 1 && etat.historique.at(-1) !== etat.historique.at(-2) && chapitreDe(etat.ordre.at(-1) ?? "") === el.chapitre;
  return (
    <Cadre cle={ecran} chapitre={el.chapitre} part={partDuChapitre(etat, el)} retour={etat.ordre.length > 0 ? retourQuiz : null} panneau={{ aide: aideDe(el, etat.profil), ...apercu, change }}>
      {second
        ? <DeuxTemps key={`${el.id}:${etat.ordre.length}`} premier={el} second={second} etat={etat} finir={(e) => aller({ t: "quiz" }, { etat: e })} />
        : <F key={`${el.id}:${etat.ordre.length}`} element={el} etat={etat} repondre={suivant} passer={() => suivant(PASSER)} />}
      {/* Le top 3 sous la question (chapitres 3 et 4), sur toutes les tailles. */}
      {adaptatif && top.length > 0 && (
        <TopEnCours top={top.map((l) => ({ id: l.pays.id, nom: l.pays.nom, iso2: l.pays.iso2 }))} change={change} />
      )}
    </Cadre>
  );
}
