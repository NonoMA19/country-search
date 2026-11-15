"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DUREE_REVELATION, useFlip } from "@/lib/animation";
import { ArrowUp, BadgeCheck, ChevronDown, DoorOpen, Download, FileCheck, FolderOpen, Hourglass, Lock, RotateCcw, Sparkles } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import { ErreurPdf } from "@/components/BoutonDossier";
import CarteVisa from "@/components/CarteVisa";
import Chargement from "@/components/Chargement";
import Pastille from "@/components/Pastille";
import PiedDePage from "@/components/PiedDePage";
import Portrait from "@/components/Portrait";
import Departage, { type EtatDepartage } from "@/components/resultat/Departage";
import { ECART_EX_AEQUO } from "@/config";
import { doubleNationalite, mesures, type FamilleScore, type Preuve } from "@/lib/donnees";
import { ecrire, recommencer, useSession } from "@/lib/memoire";
import {
  LIBELLE_BADGE, avecQui, budgetProfil, calculer, listeFr, portrait, lignesTop, egalites as calculerEgalites, paysSurprise, prochainDilemme, profilTravail, repondues, verdict,
  type Badge, type Etat, type Ligne, type LigneResultat,
} from "@/lib/moteur";
import { trouverPays } from "@/lib/pays";
import { telechargerDossier } from "@/lib/pdf";

const FAMILLES: { id: FamilleScore; nom: string; couleur: string }[] = [
  { id: "travailler", nom: "Travailler", couleur: "bg-bleu" },
  { id: "vivre", nom: "Vivre", couleur: "bg-sky-500" },
  { id: "valeurs", nom: "Valeurs", couleur: "bg-indigo-400" },
];
const CRANS = [0, 0.5, 1, 1.5, 2];
const MOTS_CRANS = ["ne compte plus", "compte moins", "comme tu l’as dit", "compte plus", "compte double"];

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

function Jauges({ ligne }: { ligne: Ligne }) {
  return (
    <div className="mt-5 space-y-2.5">
      {FAMILLES.filter((f) => ligne.familles[f.id] !== null).map((f) => {
        const v = Math.round(ligne.familles[f.id] as number);
        return (
          <div key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Icone nom={f.id} className="h-5 w-5 shrink-0 text-gris" />
            <span className="w-20 shrink-0 text-sm font-medium">{f.nom}</span>
            <div className="jauge h-3 min-w-12 flex-1 overflow-hidden rounded-full bg-creux" aria-hidden="true">
              <div className={`h-full rounded-full ${f.couleur}`} style={{ width: `${v}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right text-sm whitespace-nowrap text-gris tabular-nums">{v} %</span>
          </div>
        );
      })}
    </div>
  );
}

function Affirmation({ titre, texte, preuve, pays }: { titre?: string; texte: string; preuve: Preuve | null; pays: string }) {
  return (
    <li className="leading-snug">
      {titre && <span className="font-medium">{titre}. </span>}
      <span className={titre ? "text-gris" : ""}>{texte}</span>
      {preuve && <Pastille preuve={preuve} pays={pays} contexte={preuve.titre} />}
    </li>
  );
}

type LignesPays = { pour: LigneResultat[]; savoir: LigneResultat | null };

function CartePays({ ligne, rang, egalite, etat, lignes, surprise = false }: { ligne: Ligne; rang: number | null; egalite: string | null; etat: Etat; lignes: LignesPays; surprise?: boolean }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const { pour, savoir } = lignes;
  const score = Math.round(ligne.score);
  const { porte, pays: p } = ligne;
  const alertes = porte.alertes;

  const pdf = async () => {
    setEnCours(true);
    setErreur(false);
    try {
      await telechargerDossier({ pays: p, ligne, pour, savoir, alertes, portrait: portrait(etat).map((x) => x.texte) });
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <article className={`rounded-3xl border bg-carte p-4 shadow-sm sm:p-6 ${surprise ? "border-dashed border-bleu" : "border-bord"}`}>
      <div className="flex items-start gap-4">
        <Drapeau iso2={p.iso2} className="mt-1 h-10 w-15" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gris">
            {surprise ? "Pays surprise" : `N° ${rang}`}
            {egalite && ` · ${egalite}`}
          </p>
          <h3 className="text-2xl leading-tight font-bold break-words sm:text-3xl">{p.nom}</h3>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-5xl leading-none font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-6xl">{score}<span className="text-3xl">{"\u00a0"}%</span></span>
        <span className="pb-1 text-lg font-semibold text-lien">{verdict(score)}</span>
      </div>
      <Jauges ligne={ligne} />

      <div className="mt-5 rounded-2xl bg-creux p-4">
        <BadgePorte badge={porte.badge} />
        <p className="mt-2 font-medium">
          {porte.phrase}
          <Pastille preuve={porte.preuve} pays={p.nom} contexte={`la porte d’entrée (${porte.nom})`} />
        </p>
        {porte.mention && (
          <p className="mt-2 text-sm font-medium">
            {porte.mention.texte}
            {porte.mention.preuve && <Pastille preuve={porte.mention.preuve} pays={p.nom} contexte="la saison du PVT" />}
          </p>
        )}
      </div>

      <section className="mt-5">
        <h4 className="font-semibold">Pour toi</h4>
        {pour.length ? (
          <ul className="mt-2 space-y-2">
            {pour.map((a) => <Affirmation key={a.mesure} texte={a.texte} preuve={a.preuve} pays={p.nom} />)}
          </ul>
        ) : (
          <p className="mt-2 text-gris">Aucune de tes réponses ne le met vraiment en avant : il est là faute de mieux.</p>
        )}
        {savoir && (
          <>
            <h4 className="mt-4 font-semibold">À savoir</h4>
            <ul className="mt-2"><Affirmation texte={savoir.texte} preuve={savoir.preuve} pays={p.nom} /></ul>
          </>
        )}
      </section>

      <details className="group mt-5 rounded-2xl border border-bord">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-semibold">
          <span>Voir le détail</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
      <section className="mt-3">
        <h4 className="font-semibold">Ce qui peut coincer</h4>
        {alertes.length === 0 ? (
          <p className="mt-2 text-gris">Rien côté visa et argent.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {alertes.map((a) => <Affirmation key={a.texte} texte={a.texte} preuve={a.preuve} pays={p.nom} />)}
          </ul>
        )}
        {ligne.neutres.length > 0 && (
          <p className="mt-2 text-sm text-gris">
            Compté à 50 % faute de donnée vérifiée : {ligne.neutres.map((m) => mesures[m]?.nom ?? m).join(", ")}.
          </p>
        )}
        {ligne.manquantes.length > 0 && (
          <p className="mt-2 text-sm text-gris">
            À vérifier, donc pas compté : {ligne.manquantes.map((m) => mesures[m]?.nom ?? m).join(", ")}.
          </p>
        )}
      </section>

      <section className="mt-5">
        <h4 className="font-semibold">Ta porte d’entrée</h4>
        <p className="mt-2">
          <span className="font-medium">{porte.nom}. </span>
          <span className="text-gris">{porte.preuve.texte}</span>
          <Pastille preuve={porte.preuve} pays={p.nom} contexte={porte.nom} />
        </p>
        {porte.autres.map((t) => <p key={t} className="mt-1 text-sm text-gris">{t}</p>)}
        {porte.visa && <CarteVisa visa={porte.visa} pays={p.nom} titre={porte.type === "pvt" ? "Après le PVT, ou sans PVT : le visa de travail" : "Le visa de travail"} />}
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

function LignePays({ ligne, rang, egalite, action, raison }: { ligne: Ligne; rang?: number; egalite?: boolean; action?: React.ReactNode; raison?: string | null }) {
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
        {egalite && <span className="text-xs text-gris">à égalité</span>}
      </div>
      {raison !== undefined ? raison && <p className="mt-2 pl-9 text-sm text-gris">{raison}</p> : ligne.ecart && <p className="mt-2 pl-9 text-sm text-gris">{ligne.ecart}</p>}
      {ligne.peuDeDonnees && <p className="mt-2 pl-9 text-sm text-gris">Trop peu de données vérifiées pour ce pays sur ce qui compte pour toi : on n’affiche pas de pourcentage.</p>}
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
    const t = setTimeout(() => setArrivee(false), DUREE_REVELATION + 100);
    return () => clearTimeout(t);
  }, [charge]);
  if (!session) return <Chargement />;

  const { etat, reglages } = session;
  if (etat.priorites.length !== 3) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-semibold">Pas encore de résultat</h1>
        <p className="mt-2 text-gris">Fais d’abord le quiz : il ne prend que quelques minutes.</p>
        <Link href="/quiz" className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-bleu px-8 text-lg font-semibold text-white">Commencer le quiz</Link>
      </main>
    );
  }

  const maj = (s: Partial<typeof session>) => ecrire({ ...session, ...s });
  const seulementOuvertes = session.ouvertes;
  const setSeulementOuvertes = (v: boolean) => maj({ ouvertes: v });

  const lignes = calculer(etat, reglages);
  const tous = lignes.filter((l) => !l.ecart);
  const principaux = seulementOuvertes ? tous.filter((l) => l.porte.badge === "ouverte") : tous;
  const ecartes = lignes.filter((l) => l.ecart);
  const top = principaux.filter((l) => !l.peuDeDonnees).slice(0, 3);
  const suite = principaux.filter((l) => !top.includes(l));
  const surprise = paysSurprise(principaux);
  // « Pour toi » et « À savoir » : jamais deux pays avec exactement la même phrase.
  const phrases = lignesTop([...top, ...(surprise ? [surprise] : [])], etat);
  const style = profilTravail(etat, top);
  const budget = reglages.budget ?? budgetProfil(etat.profil) ?? 2000;
  const sansArgent = tous.filter((l) => l.porte.manque !== null);
  const famillesActives = FAMILLES.filter((f) => lignes.some((l) => l.familles[f.id] !== null));
  const egalites = calculerEgalites(principaux);
  const encoreDesDilemmes = etat.historique.length > 0 && prochainDilemme(etat) !== null;
  const revoirPortrait = () => { ecrire({ ...session, etape: { t: "portrait" } }); router.push("/quiz"); };
  const affiner = () => { ecrire({ ...session, etape: { t: "dilemmes" }, proposeA: repondues(etat) }); router.push("/quiz"); };
  const cas = doubleNationalite.cas.find((c) => c.id === etat.profil["nationalite-laquelle"]);
  const paysCas = cas ? trouverPays(cas.pays) : undefined;
  // Si tous les curseurs sont à « ne compte plus », il n'y a plus rien à classer.
  const toutAZero = famillesActives.length > 0 && famillesActives.every((f) => reglages.poids[f.id] === 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-5">
      <h1 className="text-3xl font-bold tracking-tight">Ton résultat</h1>
      <p className="mt-2 text-gris">
        Le pourcentage dit à quel point un pays te ressemble, d’après tes réponses. C’est un indicateur, pas une vérité.{" "}
        <Link href="/methode" className="text-lien underline">Comment on calcule</Link>
      </p>

      <details open className="group mt-5 rounded-3xl border border-bord bg-creux">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-2 px-4 font-semibold">
          <span>Ton portrait</span>
          <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <Portrait lignes={portrait(etat)} compact />
          <button type="button" onClick={revoirPortrait} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-lien underline">Ce n’est pas toi ? Revoir ton portrait</button>
        </div>
      </details>

      <label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-bord bg-carte px-4 py-2">
        <input type="checkbox" checked={seulementOuvertes} onChange={(e) => setSeulementOuvertes(e.target.checked)} className="h-5 w-5 shrink-0 accent-bleu" />
        <span className="font-medium">Montrer seulement les portes ouvertes</span>
      </label>

      <section aria-labelledby="titre-top" className="mt-6">
        <h2 id="titre-top" className="text-xl font-semibold">Ton top 3</h2>
        {!toutAZero && egalites.slice(0, 3).some(Boolean) && (
          <p className="mt-1 text-sm text-gris">Des pays à 5 points d’écart ou moins sont considérés à égalité. C’est un indicateur, pas une vérité.</p>
        )}
        <Glissement cle={top.map((l) => l.pays.id).join(",")}>
          {toutAZero ? (
            <p className="rounded-2xl border border-bord bg-carte p-4 font-medium">Tous les curseurs « Et si… ? » sont sur « ne compte plus » : il n’y a plus rien pour classer les pays. Remets au moins un curseur.</p>
          ) : (
            top.map((l, i) => (
              <div key={l.pays.id} data-flip={l.pays.id} className={i === 0 && arrivee ? "revelation" : undefined}>
                <CartePays ligne={l} rang={i + 1} egalite={avecQui(principaux, principaux.indexOf(l))} etat={etat} lignes={phrases.get(l.pays.id) ?? { pour: [], savoir: null }} />
              </div>
            ))
          )}
          {!toutAZero && top.length === 0 && <p className="text-gris">Aucun pays ne correspond avec ce filtre. Décoche-le pour tout revoir.</p>}
        </Glissement>
      </section>

      {!toutAZero && top.length >= 2 && (departage !== null || top[0].score - top[1].score <= ECART_EX_AEQUO) && (
        <Departage etat={etat} reglages={reglages} top={top} lignes={lignes} etatDep={departage} setEtatDep={setDepartage} ecrireEtat={(e) => maj({ etat: e })} />
      )}

      <section aria-labelledby="titre-etsi" className="mt-10">
        <h2 id="titre-etsi" className="text-xl font-semibold">Et si… ?</h2>
        <p className="mt-1 text-sm text-gris">Bouge les curseurs : le classement se met à jour tout de suite.</p>
        <p className="sr-only" aria-live="polite">
          {toutAZero ? "Plus aucun classement : remets au moins un curseur." : `Ton top 3 : ${top.map((l, i) => `${i + 1}, ${l.pays.nom}, ${Math.round(l.score)} %`).join(" ; ")}.`}
        </p>
        <div className="mt-4 space-y-5 rounded-3xl border border-bord bg-carte p-5">
          {famillesActives.map((f) => {
            const cran = Math.max(0, CRANS.indexOf(reglages.poids[f.id]));
            return (
              <label key={f.id} className="block">
                <span className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="flex items-center gap-2 font-medium"><Icone nom={f.id} className="h-5 w-5 text-gris" /> {f.nom}</span>
                  <span className="text-sm text-gris">{MOTS_CRANS[cran]}</span>
                </span>
                <input type="range" min={0} max={4} step={1} value={cran} aria-label={f.nom} aria-valuetext={`${f.nom} : ${MOTS_CRANS[cran]}`} onChange={(e) => maj({ reglages: { ...reglages, poids: { ...reglages.poids, [f.id]: CRANS[Number(e.target.value)] } } })} className="mt-2 h-8 w-full" />
              </label>
            );
          })}
          <label className="block border-t border-bord pt-4">
            <span className="flex flex-wrap items-center justify-between gap-x-2">
              <span className="font-medium">Et si mon budget était de…</span>
              <span className="font-semibold tabular-nums">{budget.toLocaleString("fr-FR")} €</span>
            </span>
            <input type="range" min={0} max={8000} step={250} value={budget} aria-label="Budget" aria-valuetext={`${budget.toLocaleString("fr-FR")} euros`} onChange={(e) => maj({ reglages: { ...reglages, budget: Number(e.target.value) } })} className="mt-2 h-8 w-full" />
            <span className="mt-1 block text-sm text-gris">
              {sansArgent.length === 0
                ? "Avec ce budget, aucun visa de ta liste ne te demande plus que ce que tu as."
                : sansArgent.length === 1
                  ? `Il te manquerait de l’argent pour 1 pays : ${sansArgent[0].pays.nom}. Il reste classé.`
                  : `Il te manquerait de l’argent pour ${sansArgent.length} pays : ${sansArgent.map((l) => l.pays.nom).join(", ")}. Ils restent classés.`}
            </span>
          </label>
        </div>
      </section>

      <section aria-labelledby="titre-surprise" className="mt-10">
        <h2 id="titre-surprise" className="flex items-center gap-2 text-xl font-semibold"><Sparkles aria-hidden="true" className="h-5 w-5 text-lien" /> Le pays surprise</h2>
        <p className="mt-1 text-sm text-gris">Le mieux placé hors de ton top 3, parmi les pays où peu de Français vivent, s’il atteint au moins 70 %.</p>
        <div className="mt-4">
          {surprise && !toutAZero ? <CartePays ligne={surprise} rang={null} egalite={null} etat={etat} lignes={phrases.get(surprise.pays.id) ?? { pour: [], savoir: null }} surprise /> : <p className="rounded-2xl border border-dashed border-bord p-4 text-gris">Pas de surprise cette fois.</p>}
        </div>
      </section>

      <section aria-labelledby="titre-style" className="mt-10">
        <h2 id="titre-style" className="text-xl font-semibold">Ton profil de travail</h2>
        {style ? (
          <div className="mt-3 rounded-3xl border border-bord bg-carte p-5">
            <p className="text-lg font-medium">{style.phrase}</p>
            {style.commun && <p className="mt-2">{style.commun}</p>}
            {!style.commun && style.comparaisons.length === 0 && <p className="mt-2 text-gris">Sur ces points, ton top 3 est à mi-chemin de ce que tu préfères.</p>}
            {style.comparaisons.length > 0 && <ul className="mt-3 space-y-2">
              {style.comparaisons.map((c) => (
                <li key={c.pays.id} className="leading-snug">
                  <span className="font-medium">{c.pays.nom} : </span>
                  <span className="text-gris">
                    {c.communs.length ? `proche de toi sur ${listeFr(c.communs)}` : ""}
                    {c.communs.length && c.differents.length ? ", " : ""}
                    {c.differents.length ? `différent sur ${listeFr(c.differents)}` : ""}.
                  </span>
                  <Pastille preuve={c.preuve} pays={c.pays.nom} contexte="le style de travail" />
                </li>
              ))}
            </ul>}
          </div>
        ) : (
          <p className="mt-2 text-gris">Tu n’as pas encore répondu aux dilemmes sur la culture au travail. Continue le quiz pour le découvrir.</p>
        )}
      </section>

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
                  {cas.acces && paysCas ? `Le badge pour ${paysCas.le} en tient compte : « ${LIBELLE_BADGE.nationalite} ». Son pourcentage, lui, ne change pas. ` : "Ton classement ne change pas. "}
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

      <section aria-labelledby="titre-tous" className="mt-10">
        <h2 id="titre-tous" className="text-xl font-semibold">Tous les pays</h2>
        {!toutAZero && <details className="mt-3">
          <summary className="flex min-h-12 cursor-pointer items-center rounded-2xl border border-bord bg-carte px-4 font-medium">Voir la suite du classement ({suite.length} pays)</summary>
          <ol className="mt-3 space-y-2">
            {suite.map((l, i) => <LignePays key={l.pays.id} ligne={l} rang={i + 4} egalite={!l.peuDeDonnees && egalites[principaux.indexOf(l)]} />)}
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
                      <button type="button" onClick={() => maj({ etat: { ...etat, remontes: [...etat.remontes, l.pays.id] } })} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-bord px-3 text-sm font-medium hover:border-bleu">
                        <ArrowUp aria-hidden="true" className="h-4 w-4" /> Le remonter
                      </button>
                    } />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
        {encoreDesDilemmes ? (
          <button type="button" onClick={affiner} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-bord bg-carte px-3 text-center font-semibold hover:border-bleu"><span className="min-w-0 hyphens-auto">Continuer pour affiner</span></button>
        ) : (
          <p className="flex min-h-14 items-center text-sm text-gris">Tu as répondu à tous les dilemmes utiles : ton classement ne peut plus s’affiner.</p>
        )}
        <button type="button" onClick={() => { recommencer(); router.push("/quiz"); }} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-bord bg-carte px-3 text-center font-semibold hover:border-bleu">
          <RotateCcw aria-hidden="true" className="hidden h-5 w-5 shrink-0 min-[240px]:block" /> <span className="min-w-0 hyphens-auto">Recommencer</span>
        </button>
      </div>

      <p className="mt-10 text-sm text-gris">Tes réponses restent dans ton navigateur : rien n’est envoyé, pas de compte, pas de cookie.</p>
      <PiedDePage liens={[{ href: "/methode", texte: "Comment on calcule" }]} />
    </main>
  );
}
