import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import BoutonDossier from "@/components/BoutonDossier";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import Pastille from "@/components/Pastille";
import { criteres, dateFr, notes, portes, preuveMesure, preuveSource, vie } from "@/lib/donnees";
import { chargerDossier, type LienDossier } from "@/lib/dossiers";
import { pays, trouverPays } from "@/lib/pays";

export function generateStaticParams() {
  return pays.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = trouverPays((await params).id);
  return { title: p ? `${p.nom} | Country Search` : "Pays introuvable | Country Search" };
}

const FAMILLES = [
  { id: "travailler", nom: "Travailler" },
  { id: "vivre", nom: "Vivre" },
  { id: "valeurs", nom: "Valeurs" },
];

function Lien({ lien, date }: { lien: LienDossier; date: string }) {
  return (
    <li className="rounded-2xl border border-bord bg-carte p-4">
      <p className="text-sm font-medium text-gris">{lien.titre}</p>
      {lien.url ? (
        <>
          <a href={lien.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-medium text-lien underline">
            {lien.nom ?? lien.url} <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
          </a>
          <p className="mt-1 text-xs text-gris">Lien vérifié le {dateFr(date)}</p>
        </>
      ) : (
        <p className="mt-1 text-gris">{lien.nom ? `${lien.nom} : à compléter` : "À compléter"}</p>
      )}
    </li>
  );
}

export default async function PagePays({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = trouverPays(id);
  if (!p) notFound();
  const dossier = await chargerDossier(p.id);
  const lesPortes = portes(p.id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="text-sm font-medium text-lien underline">Accueil</Link>
      <header className="mt-4 flex items-center gap-4">
        <Drapeau iso2={p.iso2} className="h-12 w-18" />
        <div>
          <p className="text-sm font-medium text-gris">Famille : {p.famille}</p>
          <h1 className="text-4xl font-bold tracking-tight">{p.nom}</h1>
        </div>
      </header>
      <p className="mt-4 rounded-2xl border border-dashed border-bord p-4 text-gris">Fiche complète en préparation. En attendant, voici les données vérifiées et ton dossier.</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Les portes d’entrée</h2>
        <ul className="mt-3 space-y-3">
          {lesPortes.map((b) => (
            <li key={b.type} className="rounded-2xl border border-bord bg-carte p-4">
              <p className="font-semibold">{b.nom}</p>
              <p className="mt-1">
                {b.texte}
                <Pastille preuve={preuveSource(b.nom, b.texte, b.statut === "verifie" ? b.source : null, b.lien, b.verifieLe)} pays={p.nom} />
              </p>
              {b.invitationTexte && b.invitationSource && (
                <p className="mt-2">
                  {b.invitationTexte}
                  <Pastille preuve={preuveSource("Invitation à présenter une demande", b.invitationTexte, b.invitationSource.source, b.invitationSource.lien, b.invitationSource.verifieLe)} pays={p.nom} />
                </p>
              )}
              {(b.conditions ?? []).length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {b.conditions?.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}
            </li>
          ))}
          <li className="rounded-2xl border border-bord bg-carte p-4">
            <p className="font-semibold">{vie.nom}</p>
            <p className="mt-1">
              {vie.texte}
              <Pastille preuve={preuveSource(vie.nom, vie.texte, vie.source, vie.lien, vie.verifieLe)} pays={p.nom} />
            </p>
            <p className="mt-2 text-sm text-gris">La présence de missions dans ce pays n’est pas encore vérifiée.</p>
          </li>
        </ul>
      </section>

      {FAMILLES.map((f) => (
        <section key={f.id} className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Icone nom={f.id} className="h-5 w-5 text-gris" /> {f.nom}</h2>
          <ul className="mt-3 space-y-3">
            {criteres.filter((c) => c.famille === f.id).flatMap((c) => c.mesures).map((m) => {
              const n = notes[p.id]?.[m.id];
              const ok = n?.statut === "verifie" && n.note !== null;
              return (
                <li key={m.id} className="rounded-2xl border border-bord bg-carte p-4">
                  <p className="text-sm font-medium text-gris">{m.nom}</p>
                  {ok && <p className="mt-0.5 font-semibold first-letter:uppercase">{m.mots[(n.note as number) - 1]}</p>}
                  <p className={`mt-1 ${ok ? "" : "text-gris"}`}>
                    {n?.texte ?? "Pas encore vérifié."}
                    <Pastille preuve={preuveMesure(p.id, m.id)} pays={p.nom} />
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Ton dossier</h2>
        {dossier && !dossier.complet && <p className="mt-1 text-sm text-gris">Dossier minimal pour ce pays : il sera complété.</p>}
        <ul className="mt-3 space-y-3">
          {dossier?.liens.map((l) => <Lien key={l.id} lien={l} date={dossier.verifieLe} />)}
        </ul>
        <h3 className="mt-6 font-semibold">Associations et réseaux</h3>
        <p className="mt-1 text-sm text-gris">Seulement des organismes publics ou des associations à but non lucratif.</p>
        <ul className="mt-3 space-y-3">
          {dossier?.associations.map((l) => <Lien key={l.id} lien={l} date={dossier.verifieLe} />)}
          {(!dossier || dossier.associations.length === 0) && <li className="rounded-2xl border border-dashed border-bord p-4 text-gris">À compléter</li>}
        </ul>
        <h3 className="mt-6 font-semibold">Checklist jour J</h3>
        <p className="mt-1 text-gris">Bientôt.</p>
        <div className="mt-6">
          <BoutonDossier paysId={p.id} />
          <p className="mt-2 text-sm text-gris">Le fichier est créé sur ton appareil : rien n’est envoyé.</p>
        </div>
      </section>

      <footer className="mt-10 border-t border-bord pt-5 text-sm text-gris">
        <p>Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.</p>
        <p className="mt-2"><Link href="/methode" className="text-lien underline">Comment on calcule</Link> · <Link href="/quiz" className="text-lien underline">Faire le quiz</Link></p>
      </footer>
    </main>
  );
}
