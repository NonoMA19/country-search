"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Chargement from "@/components/Chargement";
import Drapeau from "@/components/Drapeau";
import Portrait from "@/components/Portrait";
import { FORMATS } from "@/components/formats/registre";
import { BOUTON_PLEIN } from "@/components/formats/commun";
import { useFlip } from "@/lib/animation";
import { clicLibre, marquerChangement, marquerLibre } from "@/lib/clic";
import { quiz, trouverElement, type Element, type Valeur } from "@/lib/donnees";
import { intuition } from "@/lib/intuition";
import { PASSER } from "@/lib/elements";
import { ecrire, useSession, type Etape, type Session } from "@/lib/memoire";
import { annulerDerniere, changerReponse, repondre } from "@/lib/moteur";
import { CHAPITRES, MAX_ADAPTATIF, NB_CHAPITRES, chapitreDe, elementVisible, estAdaptatif, prochainAffiner, prochainElement, restantsAffiner, topCourant, vusDans } from "@/lib/parcours";
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

function Cadre({ chapitre, part, retour, children }: { chapitre: number; part: number; retour: (() => void) | null; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-4 pb-6">
      <div className="flex items-center gap-3">
        {retour ? (
          <button type="button" data-retour onClick={retour} className="-ml-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:text-encre">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Retour
          </button>
        ) : (
          <Link href="/" className="-ml-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium text-gris hover:text-encre">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" /> Accueil
          </Link>
        )}
        <Progression chapitre={chapitre} part={part} />
      </div>
      <div className="flex flex-1 flex-col pt-5">{children}</div>
      <p className="mt-6 text-xs text-gris">
        Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.{" "}
        <Link href="/mentions-legales" className="text-lien underline">Mentions légales</Link>
      </p>
    </main>
  );
}

// « Ton top 3 pour l'instant » : les drapeaux glissent vers leur nouvelle place quand le classement change.
function TopEnCours({ top, change }: { top: { id: string; nom: string; iso2: string }[]; change: boolean }) {
  const cle = top.map((p) => p.id).join(",");
  const ref = useFlip<HTMLUListElement>(cle);
  const noms = top.map((p) => p.nom).join(", ");
  return (
    <div className="mt-5 border-t border-bord pt-4">
      <p className="text-xs font-medium tracking-wide text-gris uppercase">Ton top 3 pour l’instant</p>
      <p className="sr-only" aria-live="polite">{change ? `Ton top 3 a changé : ${noms}.` : `Ton top 3 pour l’instant : ${noms}.`}</p>
      <ul ref={ref} className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {top.map((p) => (
          <li key={p.id} data-flip={p.id} className="flex items-center gap-2 text-sm font-medium">
            <Drapeau iso2={p.iso2} className="h-4 w-6" /> {p.nom}
          </li>
        ))}
      </ul>
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
        <p className="text-sm font-semibold tracking-wide text-lien uppercase">Chapitre {chapitre} sur {NB_CHAPITRES}</p>
        <h1 id="titre-ecran" tabIndex={-1} className="mt-2 text-3xl font-bold break-words outline-none">{ch.titre}</h1>
        <p className="mx-auto mt-3 max-w-sm text-lg leading-snug text-gris">{ch.phrase}</p>
      </div>
      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
        <button type="button" onClick={continuer} className={BOUTON_PLEIN}>Commencer le chapitre</button>
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
          {i.cas === "autre" && i.meilleurDansZones && <p className="ml-auto text-right text-sm text-gris">Le mieux placé de ta région{"\u00a0"}: {i.meilleurDansZones.pays.nom}</p>}
        </div>
      )}
      {i.raisons.length > 0 && (
        <>
          <p className="mt-5 font-semibold">Ce qui a compté{"\u00a0"}:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{i.raisons.map((r) => <li key={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</li>)}</ul>
        </>
      )}
      <p className="mt-5 text-sm text-gris">Ta carte du début ne compte pas dans le calcul. Ton résultat complet vient juste après ton portrait.</p>
      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
        <button type="button" onClick={suite} className={BOUTON_PLEIN}>Voir mon portrait</button>
      </div>
    </>
  );
}

const phraseRestants = (n: number) => (n > 1 ? `Encore ${n} questions possibles` : n === 1 ? "Encore 1 question possible" : "Plus aucune question à affiner");

// Un écran de secours : jamais de page vide, toujours un bouton pour continuer.
function Secours({ chapitre, texte, portrait }: { chapitre: number; texte: string; portrait: () => void }) {
  return (
    <Cadre chapitre={chapitre} part={1} retour={portrait}>
      <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold outline-none">On revient à ton portrait</h1>
      <p className="mt-2 text-lg">{texte}</p>
      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
        <button type="button" onClick={portrait} className={BOUTON_PLEIN}>Revenir à mon portrait</button>
      </div>
    </Cadre>
  );
}

export default function Quiz() {
  const session = useSession();
  const router = useRouter();
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
  if (!session) return <Chargement />;

  const { etat, etape } = session;
  const aller = (e: Etape, autres: Partial<Session> = {}) => {
    if (!clicLibre()) return;
    marquerChangement();
    ecrire({ ...session, etape: e, ...autres });
  };
  const allerAuResultat = () => { if (clicLibre()) { marquerChangement(); router.push("/resultat"); } };
  const retourQuiz = () => (etat.ordre.length > 0 ? aller({ t: "quiz" }, { etat: annulerDerniere(etat) }) : null);

  // ----- Ton intuition et tes réponses -----
  if (etape.t === "intuition") {
    // Retour : rouvre tes limites. Si tu as affiné depuis, on les rouvre telles quelles, sans rien annuler.
    const retourIntuition = () => (etat.ordre.at(-1) === "limites" ? retourQuiz() : aller({ t: "revoir", id: "limites", retour: "intuition" }));
    return (
      <Cadre chapitre={NB_CHAPITRES} part={1} retour={retourIntuition}>
        <EcranIntuition etat={etat} suite={() => aller({ t: "portrait" })} />
      </Cadre>
    );
  }

  // ----- Ton portrait -----
  if (etape.t === "portrait") {
    const revoir = (l: LignePortrait) => { if (l.revoir) aller({ t: "revoir", id: l.revoir.id }); };
    const restants = restantsAffiner(etat);
    return (
      <Cadre chapitre={NB_CHAPITRES} part={1} retour={() => aller({ t: "intuition" })}>
        <h1 id="titre-ecran" tabIndex={-1} className="text-2xl font-semibold break-words outline-none">Ton portrait</h1>
        {etape.fin && <p role="status" className="mt-3 rounded-2xl bg-bleu-doux px-4 py-3 font-medium">Tu as répondu à tout. Ton portrait est à jour.</p>}
        <p className="mt-2 text-gris">Voilà ce qu’on a compris de toi. Si une phrase ne te ressemble pas, change ta réponse.</p>
        <div className="mt-5"><Portrait portrait={portraitComplet(etat)} revoir={revoir} /></div>
        <div className="sticky bottom-0 -mx-5 mt-auto space-y-2 border-t border-bord bg-fond/95 px-5 pt-3 pb-4 backdrop-blur">
          <button type="button" onClick={allerAuResultat} className={BOUTON_PLEIN}>C’est moi, voir mon résultat</button>
          {restants > 0 && prochainAffiner(etat) && (
            <button type="button" onClick={() => aller({ t: "affiner" })} className="min-h-12 w-full rounded-2xl border border-bord bg-carte px-3 text-base font-semibold hover:border-bleu">
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
        <Cadre chapitre={el.chapitre} part={1} retour={() => aller(apres)}>
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
        <Cadre chapitre={el.chapitre} part={1} retour={() => aller({ t: "portrait" })}>
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
    // Tout est répondu : ton intuition face à tes réponses, puis le portrait.
    if (typeof window !== "undefined") queueMicrotask(() => ecrire({ ...session, etape: { t: "intuition" } }));
    return <Chargement />;
  }
  // Un nouveau chapitre commence : son écran d'ouverture (à partir du chapitre 2).
  if (el.chapitre > 1 && !session.chapitresVus.includes(el.chapitre) && vusDans(etat, el.chapitre).length === 0) {
    return (
      <Cadre chapitre={el.chapitre} part={0} retour={retourQuiz}>
        <Transition chapitre={el.chapitre} continuer={() => aller({ t: "quiz" }, { chapitresVus: [...session.chapitresVus, el.chapitre] })} />
      </Cadre>
    );
  }
  const F = FORMATS[el.type];
  const suivant = (v: Valeur) => aller({ t: "quiz" }, { etat: repondre(etat, el.id, v) });
  const adaptatif = estAdaptatif(el.chapitre);
  const top = adaptatif ? topCourant(etat, 3) : [];
  return (
    <Cadre chapitre={el.chapitre} part={partDuChapitre(etat, el)} retour={etat.ordre.length > 0 ? retourQuiz : null}>
      <F key={`${el.id}:${etat.ordre.length}`} element={el} etat={etat} repondre={suivant} passer={() => suivant(PASSER)} />
      {adaptatif && top.length > 0 && (
        <TopEnCours top={top.map((l) => ({ id: l.pays.id, nom: l.pays.nom, iso2: l.pays.iso2 }))} change={etat.historique.length > 1 && etat.historique.at(-1) !== etat.historique.at(-2) && chapitreDe(etat.ordre.at(-1) ?? "") === el.chapitre} />
      )}
    </Cadre>
  );
}
