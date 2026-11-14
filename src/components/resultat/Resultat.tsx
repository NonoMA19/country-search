"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, DoorOpen, Download, FileCheck, FolderOpen, Hourglass, Lock, RotateCcw, Sparkles } from "lucide-react";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import Pastille from "@/components/Pastille";
import { doubleNationalite, type FamilleScore, type Preuve } from "@/lib/donnees";
import { ecrire, recommencer, useSession } from "@/lib/memoire";
import {
  LIBELLE_BADGE, budgetProfil, calculer, coince, exAequo, paysSurprise, profilTravail, raisons, verdict,
  type Badge, type Etat, type Ligne,
} from "@/lib/moteur";
import { telechargerDossier } from "@/lib/pdf";

const FAMILLES: { id: FamilleScore; nom: string; couleur: string }[] = [
  { id: "travailler", nom: "Travailler", couleur: "bg-bleu" },
  { id: "vivre", nom: "Vivre", couleur: "bg-sky-500" },
  { id: "valeurs", nom: "Valeurs", couleur: "bg-indigo-400" },
];
const CRANS = [0, 0.5, 1, 1.5, 2];
const MOTS_CRANS = ["ne compte plus", "compte moins", "comme tu l’as dit", "compte plus", "compte double"];
const SECTEURS = ["Tech et numérique", "Finance", "Ingénierie et industrie", "Santé", "Hôtellerie et tourisme", "Commerce et marketing", "Enseignement et recherche", "Art et culture", "Je ne sais pas encore"];

const STYLE_BADGE: Record<Badge, string> = {
  ouverte: "bg-bleu text-white",
  conditions: "bg-bleu-doux text-encre",
  difficile: "bg-slate-700 text-white",
  fermee: "border border-bord bg-creux text-gris",
};
const ICONE_BADGE = { ouverte: DoorOpen, conditions: FileCheck, difficile: Hourglass, fermee: Lock };

export function BadgePorte({ badge, petit = false }: { badge: Badge; petit?: boolean }) {
  const I = ICONE_BADGE[badge];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${petit ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"} ${STYLE_BADGE[badge]}`}>
      <I aria-hidden="true" className={petit ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {LIBELLE_BADGE[badge]}
    </span>
  );
}

function Jauges({ ligne }: { ligne: Ligne }) {
  return (
    <div className="mt-5 space-y-2.5">
      {FAMILLES.filter((f) => ligne.familles[f.id] !== null).map((f) => {
        const v = Math.round(ligne.familles[f.id] as number);
        return (
          <div key={f.id} className="flex items-center gap-3">
            <Icone nom={f.id} className="h-5 w-5 shrink-0 text-gris" />
            <span className="w-20 shrink-0 text-sm font-medium">{f.nom}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-creux" role="img" aria-label={`${f.nom} : ${v} %`}>
              <div className={`h-full rounded-full ${f.couleur}`} style={{ width: `${v}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-gris tabular-nums">{v} %</span>
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
      {preuve && <Pastille preuve={preuve} pays={pays} />}
    </li>
  );
}

function CartePays({ ligne, rang, egalite, etat, surprise = false }: { ligne: Ligne; rang: number | null; egalite: boolean; etat: Etat; surprise?: boolean }) {
  const [enCours, setEnCours] = useState(false);
  const pour = raisons(ligne, etat.profil);
  const contre = coince(ligne, etat.profil);
  const score = Math.round(ligne.score);
  const { porte, pays: p } = ligne;
  const rienNeCoince = contre.arguments.length === 0 && contre.alertes.length === 0;

  const pdf = async () => {
    setEnCours(true);
    try {
      await telechargerDossier({ pays: p, ligne, raisons: pour, coince: contre });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <article className={`rounded-3xl border bg-carte p-5 shadow-sm sm:p-6 ${surprise ? "border-dashed border-bleu" : "border-bord"}`}>
      <div className="flex items-start gap-4">
        <Drapeau iso2={p.iso2} className="mt-1 h-10 w-15" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gris">
            {surprise ? "Pays surprise" : `N° ${rang}`}
            {egalite && " · ex aequo"}
          </p>
          <h3 className="text-3xl leading-tight font-bold">{p.nom}</h3>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <span className="text-6xl leading-none font-bold tracking-tight tabular-nums">{score}<span className="text-3xl"> %</span></span>
        <span className="pb-1 text-lg font-semibold text-lien">{verdict(score)}</span>
      </div>
      <Jauges ligne={ligne} />

      <div className="mt-5 rounded-2xl bg-creux p-4">
        <BadgePorte badge={porte.badge} />
        <p className="mt-2 font-medium">
          {porte.phrase}
          <Pastille preuve={porte.preuve} pays={p.nom} />
        </p>
      </div>

      <section className="mt-5">
        <h4 className="font-semibold">Pourquoi ce pays</h4>
        {pour.length ? (
          <ul className="mt-2 space-y-2">
            {pour.map((a) => <Affirmation key={a.titre} {...a} pays={p.nom} />)}
          </ul>
        ) : (
          <p className="mt-2 text-gris">Aucune de tes réponses ne le met vraiment en avant : il est là faute de mieux.</p>
        )}
      </section>

      <section className="mt-5">
        <h4 className="font-semibold">Ce qui peut coincer</h4>
        {rienNeCoince ? (
          <p className="mt-2 text-gris">Rien de net dans tes réponses.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {contre.arguments.map((a) => <Affirmation key={a.titre} {...a} pays={p.nom} />)}
            {contre.alertes.map((a) => <Affirmation key={a.texte} texte={a.texte} preuve={a.preuve} pays={p.nom} />)}
          </ul>
        )}
        {ligne.manquantes.length > 0 && (
          <p className="mt-2 text-sm text-gris">Certaines données ne sont pas encore vérifiées pour ce pays : elles ne comptent pas dans son pourcentage.</p>
        )}
      </section>

      <section className="mt-5">
        <h4 className="font-semibold">Ta porte d’entrée</h4>
        <p className="mt-2">
          <span className="font-medium">{porte.nom}. </span>
          <span className="text-gris">{porte.preuve.texte}</span>
          <Pastille preuve={porte.preuve} pays={p.nom} />
        </p>
        {porte.autres.map((t) => <p key={t} className="mt-1 text-sm text-gris">{t}</p>)}
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href={`/pays/${p.id}`} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-bleu px-4 font-semibold text-white hover:bg-blue-700">
          <FolderOpen aria-hidden="true" className="h-5 w-5" /> Ouvrir le dossier
        </Link>
        <button type="button" onClick={pdf} disabled={enCours} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-bord bg-carte px-4 font-semibold hover:border-bleu disabled:opacity-50">
          <Download aria-hidden="true" className="h-5 w-5" /> {enCours ? "Préparation…" : "Télécharger mon dossier (PDF)"}
        </button>
      </div>
    </article>
  );
}

function LignePays({ ligne, rang, egalite, action }: { ligne: Ligne; rang?: number; egalite?: boolean; action?: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-bord bg-carte p-3">
      <div className="flex items-center gap-3">
        {rang !== undefined && <span className="w-6 text-sm font-semibold text-gris tabular-nums">{rang}</span>}
        <Drapeau iso2={ligne.pays.iso2} className="h-5 w-7.5" />
        <Link href={`/pays/${ligne.pays.id}`} className="min-w-0 flex-1 truncate font-medium underline-offset-2 hover:underline">{ligne.pays.nom}</Link>
        <span className="font-semibold tabular-nums">{Math.round(ligne.score)} %</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-9">
        <BadgePorte badge={ligne.porte.badge} petit />
        {egalite && <span className="text-xs text-gris">ex aequo</span>}
      </div>
      {ligne.ecart && <p className="mt-2 pl-9 text-sm text-gris">{ligne.ecart}</p>}
      {ligne.peuDeDonnees && <p className="mt-2 pl-9 text-sm text-gris">Pas assez de données vérifiées pour ce pays sur tes critères : son pourcentage n’est pas fiable.</p>}
      {action && <div className="mt-2 pl-9">{action}</div>}
    </li>
  );
}

export default function Resultat() {
  const session = useSession();
  const router = useRouter();
  if (!session) return <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 text-gris">Chargement…</main>;

  const { etat, reglages } = session;
  if (etat.priorites.length !== 3) {
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

  const lignes = calculer(etat, reglages);
  const tous = lignes.filter((l) => !l.ecart);
  const principaux = seulementOuvertes ? tous.filter((l) => l.porte.badge === "ouverte") : tous;
  const ecartes = lignes.filter((l) => l.ecart);
  const top = principaux.filter((l) => !l.peuDeDonnees).slice(0, 3);
  const suite = principaux.filter((l) => !top.includes(l));
  const surprise = paysSurprise(principaux);
  const style = profilTravail(etat, top);
  const budget = reglages.budget ?? budgetProfil(etat.profil) ?? 2000;
  const sansArgent = tous.filter((l) => l.porte.manque !== null);
  const famillesActives = FAMILLES.filter((f) => lignes.some((l) => l.familles[f.id] !== null));
  const egalites = principaux.map((_, i) => exAequo(principaux, i));
  const cas = doubleNationalite.cas.find((c) => c.id === etat.profil["nationalite-laquelle"]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Ton résultat</h1>
      <p className="mt-2 text-gris">
        Le pourcentage dit à quel point un pays te ressemble, d’après tes réponses. C’est un indicateur, pas une vérité.{" "}
        <Link href="/methode" className="text-lien underline">Comment on calcule</Link>
      </p>

      <label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-bord bg-carte px-4">
        <input type="checkbox" checked={seulementOuvertes} onChange={(e) => setSeulementOuvertes(e.target.checked)} className="h-5 w-5 accent-bleu" />
        <span className="font-medium">Montrer seulement les portes ouvertes</span>
      </label>

      <section aria-labelledby="titre-top" className="mt-6">
        <h2 id="titre-top" className="text-xl font-semibold">Ton top 3</h2>
        {egalites.slice(0, 3).some(Boolean) && (
          <p className="mt-1 text-sm text-gris">Deux pays à moins de 5 points d’écart sont ex aequo. C’est un indicateur, pas une vérité.</p>
        )}
        <div className="mt-4 space-y-5">
          {top.map((l, i) => <CartePays key={l.pays.id} ligne={l} rang={i + 1} egalite={egalites[i]} etat={etat} />)}
          {top.length === 0 && <p className="text-gris">Aucun pays ne correspond avec ce filtre. Décoche-le pour tout revoir.</p>}
        </div>
      </section>

      <section aria-labelledby="titre-surprise" className="mt-10">
        <h2 id="titre-surprise" className="flex items-center gap-2 text-xl font-semibold"><Sparkles aria-hidden="true" className="h-5 w-5 text-lien" /> Le pays surprise</h2>
        <p className="mt-1 text-sm text-gris">Le mieux placé hors de ton top 3, parmi les pays où peu de Français vivent, s’il atteint au moins 70 %.</p>
        <div className="mt-4">
          {surprise ? <CartePays ligne={surprise} rang={null} egalite={false} etat={etat} surprise /> : <p className="rounded-2xl border border-dashed border-bord p-4 text-gris">Pas de surprise cette fois.</p>}
        </div>
      </section>

      <section aria-labelledby="titre-etsi" className="mt-10">
        <h2 id="titre-etsi" className="text-xl font-semibold">Et si… ?</h2>
        <p className="mt-1 text-sm text-gris">Bouge les curseurs : le classement se met à jour tout de suite.</p>
        <div className="mt-4 space-y-5 rounded-3xl border border-bord bg-carte p-5">
          {famillesActives.map((f) => {
            const cran = Math.max(0, CRANS.indexOf(reglages.poids[f.id]));
            return (
              <label key={f.id} className="block">
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium"><Icone nom={f.id} className="h-5 w-5 text-gris" /> {f.nom}</span>
                  <span className="text-sm text-gris">{MOTS_CRANS[cran]}</span>
                </span>
                <input type="range" min={0} max={4} step={1} value={cran} onChange={(e) => maj({ reglages: { ...reglages, poids: { ...reglages.poids, [f.id]: CRANS[Number(e.target.value)] } } })} className="mt-2 h-8 w-full" />
              </label>
            );
          })}
          <label className="block border-t border-bord pt-4">
            <span className="flex items-center justify-between gap-2">
              <span className="font-medium">Et si mon budget était de…</span>
              <span className="font-semibold tabular-nums">{budget.toLocaleString("fr-FR")} €</span>
            </span>
            <input type="range" min={0} max={8000} step={250} value={budget} onChange={(e) => maj({ reglages: { ...reglages, budget: Number(e.target.value) } })} className="mt-2 h-8 w-full" />
            <span className="mt-1 block text-sm text-gris">
              {sansArgent.length === 0
                ? "Avec ce budget, aucun visa de ta liste ne te demande plus que ce que tu as."
                : `Il te manquerait de l’argent pour ${sansArgent.length} pays : ${sansArgent.map((l) => l.pays.nom).join(", ")}. Ils restent classés.`}
            </span>
          </label>
        </div>
      </section>

      <section aria-labelledby="titre-style" className="mt-10">
        <h2 id="titre-style" className="text-xl font-semibold">Ton profil de travail</h2>
        {style ? (
          <div className="mt-3 rounded-3xl border border-bord bg-carte p-5">
            <p className="text-lg font-medium">{style.phrase}</p>
            <ul className="mt-3 space-y-2">
              {style.comparaisons.map((c) => (
                <li key={c.pays.id} className="leading-snug">
                  <span className="font-medium">{c.pays.nom} : </span>
                  <span className="text-gris">
                    {c.communs.length ? `proche de toi sur ${c.communs.join(", ")}` : "peu de points communs"}
                    {c.differents.length ? `, différent sur ${c.differents.join(", ")}` : ""}.
                  </span>
                  <Pastille preuve={c.preuve} pays={c.pays.nom} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-gris">Tu n’as pas encore répondu aux phrases sur le style de travail. Continue le quiz pour le découvrir.</p>
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
                <p className="mt-2 text-sm text-gris">Ton classement ne change pas pour l’instant. {doubleNationalite.avertissement}</p>
              </>
            ) : (
              <p>{doubleNationalite.autre}</p>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="titre-tous" className="mt-10">
        <h2 id="titre-tous" className="text-xl font-semibold">Tous les pays</h2>
        <details className="mt-3">
          <summary className="flex min-h-12 cursor-pointer items-center rounded-2xl border border-bord bg-carte px-4 font-medium">Voir la suite du classement ({suite.length} pays)</summary>
          <ol className="mt-3 space-y-2">
            {suite.map((l, i) => <LignePays key={l.pays.id} ligne={l} rang={i + 4} egalite={!l.peuDeDonnees && egalites[principaux.indexOf(l)]} />)}
          </ol>
        </details>
        {ecartes.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold">Moins adaptés pour toi</h3>
            <p className="mt-1 text-sm text-gris">Ces pays restent visibles. Tu peux les remonter dans ton classement.</p>
            <ul className="mt-3 space-y-2">
              {ecartes.map((l) => (
                <LignePays key={l.pays.id} ligne={l} action={
                  <button type="button" onClick={() => maj({ etat: { ...etat, remontes: [...etat.remontes, l.pays.id] } })} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-bord px-3 text-sm font-medium hover:border-bleu">
                    <ArrowUp aria-hidden="true" className="h-4 w-4" /> Le remonter
                  </button>
                } />
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="titre-secteur" className="mt-10">
        <h2 id="titre-secteur" className="text-xl font-semibold">Quel secteur t’intéresse ?</h2>
        <p className="mt-1 text-sm text-gris">On prépare cette partie : bientôt, les opportunités par secteur. Ta réponse reste dans ton navigateur et ne change pas ton résultat.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SECTEURS.map((s) => {
            const actif = session.secteurs.includes(s);
            return (
              <button key={s} type="button" aria-pressed={actif} onClick={() => maj({ secteurs: actif ? session.secteurs.filter((x) => x !== s) : [...session.secteurs, s] })}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium ${actif ? "border-bleu bg-bleu text-white" : "border-bord bg-carte hover:border-bleu"}`}>
                {s}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link href="/quiz" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-bord bg-carte px-5 font-semibold hover:border-bleu">Continuer pour affiner</Link>
        <button type="button" onClick={() => { recommencer(); router.push("/quiz"); }} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-bord bg-carte px-5 font-semibold hover:border-bleu">
          <RotateCcw aria-hidden="true" className="h-5 w-5" /> Recommencer
        </button>
      </div>

      <footer className="mt-10 border-t border-bord pt-5 text-sm text-gris">
        <p>Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.</p>
        <p className="mt-2">Tes réponses restent dans ton navigateur : rien n’est envoyé, pas de compte, pas de cookie.</p>
      </footer>
    </main>
  );
}
