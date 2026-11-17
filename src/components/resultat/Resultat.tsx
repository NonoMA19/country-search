"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DUREE_REVELATION, useFlip } from "@/lib/animation";
import { ArrowUp, BadgeCheck, ChevronDown, CircleAlert, CircleCheck, DoorOpen, Download, FileCheck, FolderOpen, Hourglass, Lock, RotateCcw, Sparkles } from "lucide-react";
import { AvecDefinitions } from "@/components/Definition";
import Drapeau from "@/components/Drapeau";
import { ErreurPdf } from "@/components/BoutonDossier";
import Chargement from "@/components/Chargement";
import Pastille from "@/components/Pastille";
import PiedDePage from "@/components/PiedDePage";
import Portrait from "@/components/Portrait";
import Departage, { type EtatDepartage } from "@/components/resultat/Departage";
import BlocVie from "@/components/resultat/BlocVie";
import { BadgeFiabilite, FicheFaisabilite, VisaCourt } from "@/components/resultat/Faisabilite";
import { ECART_EX_AEQUO } from "@/config";
import { doubleNationalite, mesures, notes, preuveMesure, type Preuve } from "@/lib/donnees";
import { uneFois } from "@/lib/clic";
import { ecrire, recommencer, useSession } from "@/lib/memoire";
import {
  CATEGORIES, GROUPES, complementMesure, groupesEgalite, LIBELLE_BADGE, MOTS_NIVEAUX, NIVEAUX, aplatir, avecQui, budgetDe, budgetProfil, calculer, cranDe, effetsActifs, effetsAjustes, groupeReglable,
  faisabilite, lignesTop, niveauDeduit, paysSurprise, visaSimple, valeurFrance, valeurLisible, verdict,
  type Badge, type Budget, type Etat, type Ligne, type PointsPays, type Surprise,
} from "@/lib/moteur";
import { accord, trouverPays } from "@/lib/pays";
import { telechargerDossier } from "@/lib/pdf";
import { prochainAffiner, questionnaireFini, resultatProvisoire } from "@/lib/parcours";
import { portrait, portraitComplet } from "@/lib/portrait";

const STYLE_BADGE: Record<Badge, string> = {
  nationalite: "bg-bleu text-white",
  ouverte: "bg-bleu text-white",
  conditions: "bg-bleu-doux text-encre",
  difficile: "bg-slate-700 text-white",
  fermee: "border border-bord bg-creux text-encre",
};
const ICONE_BADGE = { nationalite: BadgeCheck, ouverte: DoorOpen, conditions: FileCheck, difficile: Hourglass, fermee: Lock };

export function BadgePorte({ badge, petit = false }: { badge: Badge; petit?: boolean }) {
  const I = ICONE_BADGE[badge];
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold ${petit ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"} ${STYLE_BADGE[badge]}`}>
      <I aria-hidden="true" className={petit ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span className="min-w-0">{LIBELLE_BADGE[badge]}</span>
    </span>
  );
}

function Affirmation({ texte, preuve, pays, icone }: { texte: string; preuve: Preuve | null; pays: string; icone?: "pour" | "contre" }) {
  return (
    <li className="flex items-start gap-2 leading-snug">
      {icone === "pour" && <CircleCheck aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-lien" />}
      {icone === "contre" && <CircleAlert aria-hidden="true" className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gris" />}
      <span className="min-w-0">
        {icone && <span className="sr-only">{icone === "pour" ? "Point fort : " : "Point faible : "}</span>}
        {texte}
        {preuve && <Pastille preuve={preuve} pays={pays} contexte={preuve.titre} />}
      </span>
    </li>
  );
}

// « Pour toi » et « À savoir », regroupés : Travailler, Vivre, Culture au travail.
// Une catégorie n'apparaît que si elle a quelque chose à dire.
function PointsParCategorie({ points, pays }: { points: PointsPays; pays: string }) {
  const actives = CATEGORIES.filter((c) => points[c.id].pour.length || points[c.id].savoir);
  if (actives.length === 0) return <p className="mt-5 text-gris">Aucune de tes réponses ne le met vraiment en avant : il est là faute de mieux.</p>;
  return (
    <div className="mt-5 space-y-4">
      {actives.map((c) => (
        <section key={c.id}>
          <h4 className="font-semibold">{c.nom}</h4>
          <ul className="mt-1.5 space-y-1.5">
            {points[c.id].pour.map((a) => <Affirmation key={a.mesure} texte={a.texte} preuve={a.preuve} pays={pays} icone="pour" />)}
            {points[c.id].savoir && <Affirmation texte={points[c.id].savoir!.texte} preuve={points[c.id].savoir!.preuve} pays={pays} icone="contre" />}
          </ul>
        </section>
      ))}
    </div>
  );
}

// « Voir le détail » : chaque critère qui compte pour toi, avec la vraie valeur et un mot (jamais un pourcentage).
function Mesures({ ligne, etat }: { ligne: Ligne; etat: Etat }) {
  const vus = new Set<string>();
  const details = ligne.details
    .filter((d) => !d.neutre && !vus.has(d.mesure) && (vus.add(d.mesure), true))
    .sort((a, b) => Number(b.origine.startsWith("envie:")) - Number(a.origine.startsWith("envie:")) || b.poids - a.poids);
  return (
    <ul className="mt-2 divide-y divide-bord">
      {details.map((d) => {
        const v = valeurLisible(ligne.pays.id, d.mesure, etat.profil);
        const m = mesures[d.mesure];
        const france = v?.valeur ? valeurFrance(d.mesure, notes[ligne.pays.id]?.[d.mesure]?.annee) : null;
        return (
          <li key={d.mesure} className="py-2">
            <p className="text-sm text-gris">{m?.court ?? m?.nom}</p>
            <p className="font-medium">
              {v?.valeur && <><AvecDefinitions texte={v.valeur} /> · </>}{v?.mot}
              <Pastille preuve={preuveMesure(ligne.pays.id, d.mesure)} pays={ligne.pays.nom} contexte={m?.court ?? d.mesure} />
            </p>
            {france && <p className="text-sm text-gris">{france}</p>}
            {complementMesure(ligne.pays.id, d.mesure) && <p className="text-sm text-gris">{complementMesure(ligne.pays.id, d.mesure)}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function CartePays({ ligne, rang, egalite, etat, points, budget, provisoire = false }: { ligne: Ligne; rang: number; egalite: string | null; etat: Etat; points: PointsPays; budget: Budget | null; provisoire?: boolean }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const score = Math.round(ligne.score);
  const { porte, pays: p } = ligne;
  const alertes = porte.alertes;
  const visa = visaSimple(p, etat.profil);
  const fais = faisabilite(p, etat.profil, budget);

  const pdf = async () => {
    setEnCours(true);
    setErreur(false);
    try {
      await telechargerDossier({ pays: p, ligne, ...aplatir(points), alertes, portrait: portrait(etat).map((x) => x.texte) });
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <article className="rounded-3xl border border-bord bg-carte p-4 shadow-sm sm:p-6">
      <p className="text-sm font-medium text-gris">
        N° {rang}
        {egalite && ` · ${egalite}`}
      </p>
      <div className="mt-2 flex items-start gap-4">
        <Drapeau iso2={p.iso2} className="mt-1 h-10 w-15" />
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl leading-tight font-bold break-words sm:text-3xl">{p.nom}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-semibold text-lien">{provisoire ? "Résultat provisoire" : verdict(score)}</span>
            <span className="text-base font-medium whitespace-nowrap text-gris tabular-nums">{score}{" "}%</span>
          </p>
        </div>
      </div>
      <BadgeFiabilite f={ligne.fiabilite} />

      <PointsParCategorie points={points} pays={p.nom} />

      <section className="mt-5 rounded-2xl bg-creux p-4">
        <h4 className="sr-only">Faisabilité</h4>
        <BadgePorte badge={porte.badge} />
        <p className="mt-2 font-medium">
          {porte.phrase}
          <Pastille preuve={porte.preuve} pays={p.nom} contexte={`la porte d’entrée (${porte.nom})`} />
        </p>
        <FicheFaisabilite f={fais} />
      </section>
      {visa && <VisaCourt v={visa.lien?.url === fais.etape?.url ? { ...visa, lien: null } : visa} paysId={p.id} />}

      <details className="group mt-5 rounded-2xl border border-bord">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-semibold">
          <span>Voir le détail</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <section className="mt-1">
            <h4 className="font-semibold">Tes critères, valeur par valeur</h4>
            <Mesures ligne={ligne} etat={etat} />
            {ligne.neutres.length > 0 && (
              <p className="mt-2 text-sm text-gris">Compté à 50 % faute de donnée vérifiée : {ligne.neutres.map((m) => mesures[m]?.court ?? m).join(", ")}.</p>
            )}
            {ligne.manquantes.length > 0 && (
              <p className="mt-2 text-sm text-gris">À vérifier, donc pas compté : {ligne.manquantes.map((m) => mesures[m]?.court ?? m).join(", ")}.</p>
            )}
          </section>
        </div>
      </details>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href={`/pays/${p.id}`} className="inline-flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-2xl bg-bleu px-3 text-center font-semibold break-words text-white hover:bg-blue-700">
          <FolderOpen aria-hidden="true" className="h-5 w-5" /> Ouvrir le dossier
        </Link>
        <button type="button" onClick={pdf} disabled={enCours} className="inline-flex min-h-13 min-w-0 items-center justify-center gap-2 rounded-2xl border border-bord bg-carte px-3 text-center font-semibold break-words hover:border-bleu disabled:opacity-50">
          <Download aria-hidden="true" className="h-5 w-5" /> {enCours ? "Préparation…" : "Télécharger le PDF"}
        </button>
      </div>
      <ErreurPdf visible={erreur} />
    </article>
  );
}

// Le pays surprise : un seul de tes choix l'écarte. Un bouton le remonte dans ton classement.
function CarteSurprise({ s, remonter }: { s: Surprise; remonter: () => void }) {
  const p = s.ligne.pays;
  const Le = p.le.charAt(0).toUpperCase() + p.le.slice(1);
  return (
    <article className="rounded-3xl border border-dashed border-bleu bg-carte p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Drapeau iso2={p.iso2} className="h-8 w-12" />
        <h3 className="min-w-0 text-xl font-bold break-words">{p.nom}</h3>
      </div>
      <p className="mt-3 text-lg leading-snug">
        {Le} te {accord(p, "correspond", "correspondent")} à {Math.round(s.score)}{" "}%. {s.phrase}
      </p>
      {s.argent && <p className="mt-2 flex items-start gap-2 text-sm font-medium"><CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gris" /><span>{s.argent}</span></p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={remonter} className="inline-flex min-h-12 items-center gap-1.5 rounded-2xl bg-bleu px-4 font-semibold text-white hover:bg-blue-700">
          <ArrowUp aria-hidden="true" className="h-5 w-5" /> Le remonter
        </button>
        <Link href={`/pays/${p.id}`} className="inline-flex min-h-12 items-center rounded-2xl border border-bord px-4 font-semibold hover:border-bleu">Ouvrir le dossier</Link>
      </div>
    </article>
  );
}

// Le top 3 : quand un curseur « Et si… ? » change l'ordre, les cartes glissent vers leur nouvelle place.
function Glissement({ cle, children }: { cle: string; children: ReactNode }) {
  const ref = useFlip<HTMLDivElement>(cle);
  return <div ref={ref} className="mt-4 space-y-5">{children}</div>;
}

// « Moins adaptés pour toi » : une seule phrase par raison, en tête de groupe.
// « Fermé à ton âge » regroupe les pays, la porte de chacun reste écrite sous son nom.
const FERME = "Fermé à ton âge.";
function groupesEcart(lignes: Ligne[]) {
  const groupes = new Map<string, { ligne: Ligne; detail: string | null }[]>();
  for (const l of lignes) {
    const raison = l.ecart?.startsWith(FERME) ? FERME : (l.ecart ?? "");
    const detail = raison === FERME ? (l.ecart ?? "").slice(FERME.length).trim() || null : null;
    groupes.set(raison, [...(groupes.get(raison) ?? []), { ligne: l, detail }]);
  }
  return [...groupes].map(([raison, l]) => ({ raison, lignes: l }));
}

function LignePays({ ligne, rang, egalite, action, raison }: { ligne: Ligne; rang?: number; egalite?: string | null; action?: React.ReactNode; raison?: string | null }) {
  return (
    <li className="rounded-2xl border border-bord bg-carte p-3">
      <div className="flex items-center gap-3">
        {rang !== undefined && <span className="w-6 text-sm font-semibold text-gris tabular-nums">{rang}</span>}
        <Drapeau iso2={ligne.pays.iso2} className="h-5 w-7.5" />
        <Link href={`/pays/${ligne.pays.id}`} className="inline-flex min-h-11 min-w-0 flex-1 items-center font-medium break-words underline-offset-2 hover:underline">{ligne.pays.nom}</Link>
        {ligne.peuDeDonnees ? (
          <span className="min-w-0 text-right text-sm text-gris">pas assez de données</span>
        ) : (
          <span className="font-semibold whitespace-nowrap tabular-nums">{Math.round(ligne.score)} %</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
        <BadgePorte badge={ligne.porte.badge} petit />
        {egalite && <span className="text-xs text-gris">{egalite}</span>}
      </div>
      {raison !== undefined ? raison && <p className="mt-2 pl-9 text-sm text-gris">{raison}</p> : ligne.ecart && <p className="mt-2 pl-9 text-sm text-gris">{ligne.ecart}</p>}
      {ligne.peuDeDonnees && <p className="mt-2 pl-9 text-sm text-gris">Trop peu de données vérifiées pour ce pays sur ce qui compte pour toi : on n’affiche pas de pourcentage.</p>}
      {action && <div className="mt-2 pl-9">{action}</div>}
    </li>
  );
}

export default function Resultat() {
  const session = useSession();
  const router = useRouter();
  const [departage, setDepartage] = useState<EtatDepartage | null>(null);
  // Révélation du n°1 : seulement au premier affichage de la page.
  const [arrivee, setArrivee] = useState(true);
  const charge = session !== null;
  useEffect(() => {
    if (!charge) return;
    // À l'arrivée, le focus va sur le titre : un lecteur d'écran annonce la page.
    document.getElementById("titre-resultat")?.focus({ preventScroll: true });
    const t = setTimeout(() => setArrivee(false), DUREE_REVELATION + 100);
    return () => clearTimeout(t);
  }, [charge]);
  if (!session) return <Chargement />;

  const { etat, reglages } = session;
  if (!questionnaireFini(etat)) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-semibold">Pas encore de résultat</h1>
        <p className="mt-2 text-gris">Fais d’abord le quiz : il ne prend que quelques minutes.</p>
        <Link href="/quiz" className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-bleu px-8 text-lg font-semibold text-white">Commencer le quiz</Link>
      </main>
    );
  }

  const maj = (s: Partial<typeof session>) => ecrire({ ...session, ...s });
  const seulementOuvertes = session.ouvertes;
  const setSeulementOuvertes = (v: boolean) => maj({ ouvertes: v });
  // Un double clic sur « Le remonter » ne remonte qu’un seul pays (garde de 400 ms, comme dans le quiz).
  const remonter = (id: string) => uneFois(() => { if (!etat.remontes.includes(id)) maj({ etat: { ...etat, remontes: [...etat.remontes, id] } }); });

  const lignes = calculer(etat, reglages);
  const tous = lignes.filter((l) => !l.ecart);
  const principaux = seulementOuvertes ? tous.filter((l) => l.porte.badge === "ouverte") : tous;
  const ecartes = lignes.filter((l) => l.ecart);
  const top = principaux.filter((l) => !l.peuDeDonnees).slice(0, 3);
  const suite = principaux.filter((l) => !top.includes(l));
  const brute = paysSurprise(etat, lignes, top, reglages);
  const surprise = brute && (!seulementOuvertes || brute.ligne.porte.badge === "ouverte") ? brute : null;
  // « Pour toi » et « À savoir » : jamais deux pays avec exactement la même phrase.
  const phrases = lignesTop(top, etat);
  // Le curseur part de la même somme que la liste « Il te manquerait… » : le haut de ta tranche
  // (ce qui manque « au moins »), ou son bas s'il n'y a pas de haut, ou 2 000 € si tu ne sais pas encore.
  const tranche = budgetProfil(etat.profil);
  const budget = reglages.budget ?? tranche?.max ?? tranche?.min ?? 2000;
  const sansArgent = tous.filter((l) => l.porte.manque !== null);
  const encoreDesDilemmes = prochainAffiner(etat) !== null;
  const revoirPortrait = () => { ecrire({ ...session, etape: { t: "portrait" } }); router.push("/quiz"); };
  const affiner = () => { ecrire({ ...session, etape: { t: "affiner" } }); router.push("/quiz"); };
  const cas = doubleNationalite.cas.find((c) => c.id === etat.profil["nationalite-laquelle"]);
  const paysCas = cas ? trouverPays(cas.pays) : undefined;
  // Deux cas différents : tu n'as répondu à rien qui compte (rienRepondu), ou tes curseurs ont tout mis à zéro (toutAZero).
  const rienRepondu = effetsActifs(etat).length === 0;
  const toutAZero = rienRepondu || effetsAjustes(etat, reglages).length === 0;
  const revoirQuestion = (id: string) => { ecrire({ ...session, etape: { t: "revoir", id } }); router.push("/quiz"); };
  const reponses = effetsActifs(etat);
  const reglagesModifies = Object.keys(reglages.niveaux).length > 0;
  const rangDe = (l: Ligne) => principaux.indexOf(l);
  // Peu de réponses : on le dit, au lieu d'afficher « Très bonne piste » (et parfois 100 %) sur trop peu d'éléments.
  const provisoire = resultatProvisoire(etat);
  // Une longue chaîne d'égalités : une seule phrase au-dessus de la liste, plutôt que « À égalité avec… » sur chaque ligne.
  const groupes = groupesEgalite(principaux);
  const tailleGroupe = (k: number) => (groupes[k] < 0 ? 1 : groupes.filter((g) => g === groupes[k]).length);
  const grandGroupe = (k: number) => tailleGroupe(k) >= 6;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-5">
      <h1 id="titre-resultat" tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">Ton résultat</h1>
      <p className="mt-2 text-gris">
        Le pourcentage dit à quel point un pays te ressemble, d’après tes réponses. C’est un indicateur, pas une vérité.{" "}
        <Link href="/methode" className="text-lien underline">Comment on calcule</Link>
      </p>

      {provisoire && !rienRepondu && (
        <p role="status" className="mt-4 rounded-2xl border border-bord bg-carte p-4 font-medium">Résultat provisoire : tu as répondu à peu de questions. Le classement peut encore beaucoup changer. <button type="button" onClick={affiner} className="inline-flex min-h-11 items-center text-lien underline">Répondre à plus de questions</button></p>
      )}
      <details open className="group mt-5 rounded-3xl border border-bord bg-creux">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-semibold">
          <span>Ton portrait</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <Portrait portrait={portraitComplet(etat)} compact />
          <button type="button" onClick={revoirPortrait} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-lien underline">Ce n’est pas toi ? Revoir ton portrait</button>
        </div>
      </details>

      <section aria-labelledby="titre-top" className="mt-6">
        <h2 id="titre-top" className="text-xl font-semibold">Ton top 3</h2>
        <Glissement cle={top.map((l) => l.pays.id).join(",")}>
          {rienRepondu ? (
            <div className="rounded-2xl border border-bord bg-carte p-4">
              <p className="font-medium">Tu as passé toutes les questions qui comptent pour le classement : on ne peut pas encore classer les pays pour toi.</p>
              <p className="mt-3 font-semibold">Réponds au moins à ces 3 questions, celles qui comptent le plus :</p>
              <div className="mt-2 grid gap-2">
                {[["envies", "Tes 5 envies"], ["objectif", "Ton projet"], ["limites", "Tes limites"]].map(([id, nom]) => (
                  <button key={id} type="button" onClick={() => revoirQuestion(id)} className="min-h-12 rounded-2xl border border-bord px-4 text-left font-semibold hover:border-bleu">{nom}</button>
                ))}
              </div>
            </div>
          ) : toutAZero ? (
            <p className="rounded-2xl border border-bord bg-carte p-4 font-medium">Avec tes curseurs « Et si… ? », plus rien ne compte pour classer les pays. Remonte au moins un curseur.</p>
          ) : (
            top.map((l, i) => (
              <div key={l.pays.id} data-flip={l.pays.id} className={i === 0 && arrivee ? "revelation" : undefined}>
                <CartePays ligne={l} rang={i + 1} egalite={avecQui(principaux, rangDe(l))} etat={etat} points={phrases.get(l.pays.id)!} budget={budgetDe(etat, reglages)} provisoire={provisoire} />
              </div>
            ))
          )}
          {!toutAZero && top.length === 0 && <p className="text-gris">Aucun pays ne correspond avec ce filtre. Décoche-le pour tout revoir.</p>}
        </Glissement>
        {!toutAZero && top.some((l) => avecQui(principaux, rangDe(l))) && (
          <p className="mt-3 text-sm text-gris">Deux pays voisins à 5 points d’écart ou moins sont considérés à égalité. C’est un indicateur, pas une vérité.</p>
        )}
        {!toutAZero && top.length >= 2 && (departage !== null || top[0].score - top[1].score <= ECART_EX_AEQUO) && (
          <Departage etat={etat} reglages={reglages} top={top} lignes={lignes} etatDep={departage} setEtatDep={setDepartage} ecrireEtat={(e) => maj({ etat: e })} />
        )}
        {/* Sous le top 3, au-dessus de la liste complète : le filtre agit sur les deux, et le dit. */}
        {!rienRepondu && (
          <label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-bord bg-carte px-4 py-2">
            <input type="checkbox" checked={seulementOuvertes} onChange={(e) => setSeulementOuvertes(e.target.checked)} className="h-5 w-5 shrink-0 accent-bleu" aria-describedby="aide-ouvertes" />
            <span className="min-w-0">
              <span className="block font-medium">Montrer seulement les portes ouvertes</span>
              <span id="aide-ouvertes" className="block text-sm text-gris">Ton top 3 et la liste de tous les pays se mettent à jour.</span>
            </span>
          </label>
        )}
      </section>

      <section aria-labelledby="titre-etsi" className="mt-10">
        <h2 id="titre-etsi" className="text-xl font-semibold">Et si… ?</h2>
        <p className="mt-1 text-sm text-gris">Chaque curseur part de ce que tu as répondu. Bouge-le : ton top 3 se met à jour juste au-dessus.</p>
        <p className="sr-only" aria-live="polite">
          {toutAZero ? "Plus aucun classement : remonte au moins un curseur." : `Ton top 3 : ${top.map((l, i) => `${i + 1}, ${l.pays.nom}, ${Math.round(l.score)} %`).join(" ; ")}.`}
        </p>
        <div className="mt-4 space-y-5 rounded-3xl border border-bord bg-carte p-5">
          {GROUPES.map((g) => {
            const reglable = groupeReglable(reponses, g.id);
            const cran = cranDe(reglages.niveaux[g.id] ?? niveauDeduit(reponses, g.id));
            const mot = MOTS_NIVEAUX[cran];
            return (
              <label key={g.id} className="block">
                <span className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="font-medium">{g.nom}</span>
                  <span className="text-sm text-gris">{reglable ? mot : "Pas réglable"}</span>
                </span>
                <input type="range" min={0} max={NIVEAUX.length - 1} step={1} value={cran} disabled={!reglable} aria-label={g.nom} aria-valuetext={`${g.nom} : ${mot.toLowerCase()}`}
                  onChange={(e) => maj({ reglages: { ...reglages, niveaux: { ...reglages.niveaux, [g.id]: NIVEAUX[Number(e.target.value)] } } })} className="mt-2 h-8 w-full disabled:opacity-40" />
                <span className="flex justify-between text-xs text-gris" aria-hidden="true"><span>{MOTS_NIVEAUX[0]}</span><span>{MOTS_NIVEAUX.at(-1)}</span></span>
                {!reglable && <span className="mt-1 block text-sm text-gris">Réponds à un dilemme sur la culture au travail pour régler ce curseur.</span>}
              </label>
            );
          })}
          {reglagesModifies && (
            <button type="button" onClick={() => maj({ reglages: { ...reglages, niveaux: {} } })} className="inline-flex min-h-11 items-center text-sm font-medium text-lien underline">Revenir à tes réponses</button>
          )}
          <label className="block border-t border-bord pt-4">
            <span className="flex flex-wrap items-center justify-between gap-x-2">
              <span className="font-medium">Et si mon budget était de…</span>
              <span className="font-semibold tabular-nums">{budget.toLocaleString("fr-FR")} €</span>
            </span>
            <input type="range" min={0} max={15000} step={250} value={budget} aria-label="Budget" aria-valuetext={`${budget.toLocaleString("fr-FR")} euros`} onChange={(e) => maj({ reglages: { ...reglages, budget: Number(e.target.value) } })} className="mt-2 h-8 w-full" />
            <span className="mt-1 block text-sm text-gris">
              {sansArgent.length === 0
                ? "Avec ce budget, aucun visa de ta liste ne te demande plus que ce que tu as."
                : sansArgent.length === 1
                  ? `Il te manquerait de l’argent pour 1 pays : ${sansArgent[0].pays.nom}. Il reste classé.`
                  : `Il te manquerait de l’argent pour ${sansArgent.length} pays : ${sansArgent.map((l) => l.pays.nom).join(", ")}. Ils restent classés.`}
            </span>
          </label>
        </div>
      </section>

      {surprise && !toutAZero && (
        <section aria-labelledby="titre-surprise" className="mt-10">
          <h2 id="titre-surprise" className="flex items-center gap-2 text-xl font-semibold"><Sparkles aria-hidden="true" className="h-5 w-5 text-lien" /> Le pays surprise</h2>
          <p className="mt-1 text-sm text-gris">Un pays qu’un seul de tes choix met de côté ou fait reculer, alors que sans ce choix il serait ton n° 1 ou ton n° 2.</p>
          <div className="mt-4"><CarteSurprise s={surprise} remonter={() => remonter(surprise.ligne.pays.id)} /></div>
        </section>
      )}

      {etat.profil.objectif === "stage-vie" && !toutAZero && <BlocVie etat={etat} top={top} />}

      {etat.profil.nationalite === "oui" && (
        <section aria-labelledby="titre-double" className="mt-10">
          <h2 id="titre-double" className="text-xl font-semibold">Ta double nationalité</h2>
          <div className="mt-3 rounded-3xl border border-bord bg-carte p-5">
            {cas ? (
              <>
                <p className="font-semibold">{cas.titre}</p>
                <p className="mt-1">
                  {cas.texte}
                  <Pastille preuve={{ type: cas.type, titre: cas.titre, texte: cas.texte, source: cas.source, lien: cas.lien, verifieLe: cas.verifieLe, licence: cas.licence }} />
                </p>
                <p className="mt-2 text-sm text-gris">
                  {cas.acces && paysCas ? `Le badge pour ${paysCas.le} en tient compte : « ${LIBELLE_BADGE.nationalite} ». Son pourcentage, lui, ne change pas. ` : "Ton classement ne change pas. "}
                  {`${doubleNationalite.autresPays} `}
                  {doubleNationalite.avertissement}
                </p>
              </>
            ) : (
              <p>{doubleNationalite.autre}</p>
            )}
          </div>
        </section>
      )}

      {(!toutAZero && suite.length > 0) || ecartes.length > 0 ? <section aria-labelledby="titre-tous" className="mt-10">
        <h2 id="titre-tous" className="text-xl font-semibold">Tous les pays</h2>
        {!toutAZero && suite.length > 0 && <details className="mt-3">
          <summary className="flex min-h-12 cursor-pointer items-center rounded-2xl border border-bord bg-carte px-4 font-medium">Voir la suite du classement ({suite.length} pays)</summary>
          {suite.some((l) => grandGroupe(rangDe(l))) && <p className="mt-3 text-sm text-gris">Beaucoup de ces pays sont à 5 points ou moins les uns des autres : leur ordre compte peu. Réponds à plus de questions pour les départager.</p>}
          <ol className="mt-3 space-y-2">
            {suite.map((l) => <LignePays key={l.pays.id} ligne={l} rang={rangDe(l) + 1} egalite={l.peuDeDonnees || grandGroupe(rangDe(l)) ? null : avecQui(principaux, rangDe(l), (k) => k >= top.length)} />)}
          </ol>
        </details>}
        {ecartes.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">Moins adaptés pour toi</h3>
            <p className="mt-1 text-sm text-gris">Ces pays restent visibles. Tu peux les remonter dans ton classement.</p>
            {groupesEcart(ecartes).map((g) => (
              <div key={g.raison} className="mt-4">
                <p className="font-medium">{g.raison}</p>
                <ul className="mt-2 space-y-2">
                  {g.lignes.map(({ ligne: l, detail }) => (
                    <LignePays key={l.pays.id} ligne={l} raison={detail} action={
                      <button type="button" onClick={() => remonter(l.pays.id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-bord px-3 text-sm font-medium hover:border-bleu">
                        <ArrowUp aria-hidden="true" className="h-4 w-4" /> Le remonter
                      </button>
                    } />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section> : null}

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {encoreDesDilemmes ? (
          <button type="button" onClick={affiner} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-bord bg-carte px-3 text-center font-semibold hover:border-bleu"><span className="min-w-0 hyphens-auto">Continuer pour affiner</span></button>
        ) : (
          <p className="flex min-h-14 items-center text-sm text-gris">Tu as répondu à tous les dilemmes utiles : ton classement ne peut plus s’affiner.</p>
        )}
        <button type="button" onClick={() => { recommencer(); router.push("/quiz"); }} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-bord bg-carte px-3 text-center font-semibold hover:border-bleu">
          <RotateCcw aria-hidden="true" className="hidden h-5 w-5 shrink-0 min-[240px]:block" /> <span className="min-w-0 hyphens-auto">Recommencer</span>
        </button>
      </div>

      <p className="mt-10 text-sm text-gris">Tes réponses restent dans ton navigateur : rien n’est envoyé, pas de compte, pas de cookie.</p>
      <PiedDePage liens={[{ href: "/methode", texte: "Comment on calcule" }]} />
    </main>
  );
}
