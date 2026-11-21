import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import BoutonDossier from "@/components/BoutonDossier";
import CarteVisa from "@/components/CarteVisa";
import { AvecDefinitions } from "@/components/Definition";
import Drapeau from "@/components/Drapeau";
import Icone from "@/components/Icone";
import LienOfficiel from "@/components/LienOfficiel";
import Pastille from "@/components/Pastille";
import PiedDePage from "@/components/PiedDePage";
import { FaisabilitePourToi } from "@/components/resultat/Faisabilite";
import { paysCouverts, valeurFrance } from "@/lib/moteur";
import { RAPPEL_VIE, criteres, dateFr, europe, notes, phraseIndemniteVie, mentionInformelle, portes, preuveMesure, preuveNote, preuveSource, vie, type Critere, type NoteSourcee } from "@/lib/donnees";
import { chargerDossier, liensVerifies, type LienDossier } from "@/lib/dossiers";
import { NOM_FAMILLE, pays, trouverPays } from "@/lib/pays";

export function generateStaticParams() {
  return pays.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = trouverPays((await params).id);
  if (!p) return { title: "Pays introuvable | Orizo" };
  return {
    title: `${p.nom} | Orizo`,
    description: `Travailler ${p.en} : porte d’entrée (${p.famille}), emploi, salaires, coût de la vie, climat et liens officiels, chaque donnée avec sa source.`,
  };
}

// Le VIE : les règles (service-public.gouv.fr), les destinations (Business France) et l'indemnité du pays (Journal officiel).
function CarteVie({ paysId, nomPays }: { paysId: string; nomPays: string }) {
  const presence = vie.presence?.[paysId];
  return (
    <li className="rounded-2xl border border-bord bg-carte p-4">
      <p className="font-semibold">{vie.nom}</p>
      <p className="mt-1">
        {vie.texte}
        <Pastille preuve={preuveSource(vie.nom, vie.texte, vie.source, vie.lien, vie.verifieLe)} pays={nomPays} contexte="les règles du VIE" />
      </p>
      {phraseIndemniteVie(paysId) && (
        <p className="mt-2 text-sm">
          <span className="font-medium">{phraseIndemniteVie(paysId)}</span> {RAPPEL_VIE}
          <Pastille preuve={preuveMesure(paysId, "indemnite-vie")} pays={nomPays} contexte="le barème des indemnités VIE" />
        </p>
      )}
      <p className="mt-2 text-sm">
        {presence ? presence.texte : "VIE : pas dans les destinations de Business France."}
        <Pastille preuve={presence ? preuveSource("Missions VIE dans ce pays", presence.texte, presence.source, presence.lien, presence.verifieLe) : preuveSource("Missions VIE dans ce pays", "La présence de missions VIE dans ce pays n’est pas encore vérifiée.", null, null, null)} pays={nomPays} contexte="les missions VIE" />
      </p>
    </li>
  );
}

const FAMILLES = [
  { id: "travailler", nom: "Travailler" },
  { id: "vivre", nom: "Vivre" },
  { id: "valeurs", nom: "Valeurs" },
];

function Lien({ lien, date, officiel = false }: { lien: LienDossier; date: string; officiel?: boolean }) {
  if (officiel) {
    return (
      <li>
        <p className="text-sm font-medium text-gris">{lien.titre}</p>
        <LienOfficiel url={lien.url as string} nom={lien.nom ?? lien.titre} className="mt-1" />
        <p className="mt-1 text-xs text-gris">Lien vérifié le {dateFr(lien.verifieLe ?? date)}</p>
      </li>
    );
  }
  return (
    <li className="rounded-2xl border border-bord bg-carte p-4">
      <p className="text-sm font-medium text-gris">{lien.titre}</p>
      <a href={lien.url as string} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-medium break-words text-lien underline">
        {lien.nom ?? lien.url} <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
      </a>
      <p className="mt-1 text-xs text-gris">Lien vérifié le {dateFr(lien.verifieLe ?? date)}</p>
    </li>
  );
}

// « Europe sans visa » : ce qui peut être demandé sur place, avec sa source.
function NoteEurope({ note, titre, pays }: { note: NoteSourcee; titre: string; pays: string }) {
  const texte = note.datePage ? `${note.texte} (page mise à jour le ${dateFr(note.datePage)})` : note.texte;
  return (
    <p className="mt-2 text-sm">
      {note.texte}
      <Pastille preuve={preuveSource(titre, texte, note.source, note.lien, note.verifieLe)} pays={pays} contexte={titre.toLowerCase()} />
    </p>
  );
}

// Une carte par critère. Si plusieurs mesures partagent le même texte (taille de ville),
// le texte n'apparaît qu'une fois : jamais deux fois le même paragraphe sur une page.
function CarteCritere({ c, paysId, nomPays }: { c: Critere; paysId: string; nomPays: string }) {
  // Une mesure sans aucune donnée pour aucun pays n'est pas affichée (elle ne compte pas).
  const lignes = c.mesures.filter((m) => paysCouverts(m.id) > 0 && !m.interne).map((m) => {
    const n = notes[paysId]?.[m.id];
    const ok = n?.statut === "verifie" && n.note !== null;
    return { m, n, ok, mot: ok ? m.mots[(n.note as number) - 1] : null, explication: ok ? m.explications?.[(n.note as number) - 1] : undefined };
  });
  const textes = [...new Set(lignes.map((l) => l.n?.texte ?? "").filter(Boolean))];
  // Une seule carte si les mesures partagent le même texte (taille de ville) ou décrivent un même style (style de travail).
  if (lignes.length === 0) return null;
  // Toutes « à vérifier » avec la même phrase (l'emploi par secteur, par exemple) : une seule ligne, pas huit.
  if (lignes.length > 1 && lignes.every((l) => !l.ok) && textes.length <= 1) {
    return (
      <li className="rounded-2xl border border-bord bg-carte p-4">
        <p className="text-sm font-medium text-gris">{c.nom}</p>
        <p className="mt-1">
          {textes[0] ?? "À vérifier."}
          <Pastille preuve={preuveMesure(paysId, lignes[0].m.id)} pays={nomPays} contexte={c.nom} />
        </p>
      </li>
    );
  }
  const regrouper = lignes.length > 1 && lignes.every((l) => l.ok) && (textes.length <= 1 || c.id === "style-travail");
  if (regrouper && c.id !== "style-travail") {
    return (
      <li className="rounded-2xl border border-bord bg-carte p-4">
        <p className="text-sm font-medium text-gris">{c.nom}</p>
        <ul className="mt-1 space-y-1.5">
          {lignes.map((l) => (
            <li key={l.m.id}>
              <span className="font-semibold"><AvecDefinitions texte={l.m.nom} />{"\u00a0"}: </span>{l.mot}
              {l.explication && <span className="block text-sm text-gris">{l.explication}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-2">
          {textes.join(" ")}
          <Pastille preuve={preuveMesure(paysId, lignes[0].m.id)} pays={nomPays} contexte={c.nom} />
        </p>
      </li>
    );
  }
  // Style de travail : une seule carte, mais chaque mesure garde sa preuve
  // (l'avis de la rédaction et les témoignages ne sont pas la même source).
  if (regrouper) {
    return (
      <li className="rounded-2xl border border-bord bg-carte p-4">
        <p className="text-sm font-medium text-gris">{c.nom}</p>
        <ul className="mt-1 space-y-3">
          {lignes.map((l) => (
            <li key={l.m.id}>
              <span className="font-semibold"><AvecDefinitions texte={l.m.nom} />{"\u00a0"}: </span>{l.mot}
              {l.explication && <span className="block text-sm text-gris">{l.explication}</span>}
              <span className="mt-0.5 block">
                {l.n?.texte}
                <Pastille preuve={preuveMesure(paysId, l.m.id)} pays={nomPays} contexte={l.m.nom} />
              </span>
            </li>
          ))}
        </ul>
      </li>
    );
  }
  return (
    <>
      {lignes.map(({ m, n, ok, mot, explication }) => (
        <li key={m.id} className="rounded-2xl border border-bord bg-carte p-4">
          <p className="text-sm font-medium text-gris"><AvecDefinitions texte={m.nom} /></p>
          {ok && <p className="mt-0.5 font-semibold first-letter:uppercase">{mot}</p>}
          {explication && <p className="mt-0.5 text-sm text-gris">{explication}</p>}
          <p className={`mt-1 ${ok ? "" : "text-gris"}`}>
            {n?.texte || (ok ? "" : "À vérifier.")}
            <Pastille preuve={preuveMesure(paysId, m.id)} pays={nomPays} contexte={m.nom} />
          </p>
          {ok && valeurFrance(m.id, n?.annee) && <p className="mt-1 text-sm text-gris">Pour comparer, {valeurFrance(m.id, n?.annee)}</p>}
          {m.id === "emploi" && mentionInformelle(paysId) && <p className="mt-2 rounded-xl border border-bord bg-creux px-3 py-2 text-sm">{mentionInformelle(paysId)}</p>}
        </li>
      ))}
    </>
  );
}

export default async function PagePays({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = trouverPays(id);
  if (!p) notFound();
  const dossier = await chargerDossier(p.id);
  const lesPortes = portes(p.id);
  const liens = dossier ? liensVerifies(dossier.liens) : [];
  const associations = dossier ? liensVerifies(dossier.associations) : [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline">Accueil</Link>
      <header className="mt-2 flex flex-wrap items-center gap-4">
        <Drapeau iso2={p.iso2} className="h-12 w-18" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gris">Famille : {NOM_FAMILLE[p.famille]}</p>
          <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">{p.nom}</h1>
        </div>
      </header>
      <p className="mt-4 rounded-2xl border border-dashed border-bord p-4 text-gris">
        {p.ficheComplete
          ? "★ Ce pays aura en priorité une fiche détaillée. Pour l’instant, cette page réunit les données vérifiées et les liens officiels utiles."
          : "Pour l’instant, cette page réunit les données vérifiées et les liens officiels utiles."}
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Faisable pour toi ?</h2>
        <FaisabilitePourToi paysId={p.id} />
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Les portes d’entrée</h2>
        <ul className="mt-3 space-y-3">
          {lesPortes.map((b) => (
            <li key={b.type} className="rounded-2xl border border-bord bg-carte p-4">
              <p className="font-semibold">{b.nom}</p>
              <p className="mt-1">
                {b.texte}
                {b.type !== "visas-jeunes" && <Pastille preuve={preuveSource(b.nom, b.texte, b.statut === "verifie" ? b.source : null, b.lien, b.verifieLe)} pays={p.nom} contexte={b.nom} />}
              </p>
              {[b.changement, b.jeunes, b.securite].filter((n) => !!n).map((n) => (
                <p key={n!.texte} className="mt-2 font-medium">
                  {n!.texte}
                  <Pastille preuve={preuveNote(b.nom, n!)} pays={p.nom} contexte={b.nom} />
                </p>
              ))}
              {(b.visas ?? []).map((v) => <CarteVisa key={v.nom} visa={v} pays={p.nom} />)}
              {b.saison && (
                <p className="mt-2 font-medium">
                  {b.saison.texte}
                  <Pastille preuve={b.saison.statut === "a-verifier" ? preuveNote("Saison du PVT", b.saison) : preuveSource("Saison du PVT", `Phrase officielle : « ${b.saison.citation} » (page mise à jour le ${dateFr(b.saison.datePage)}).`, b.saison.source, b.saison.lien, b.saison.verifieLe)} pays={p.nom} contexte="la saison du PVT" />
                </p>
              )}
              {b.invitationTexte && b.invitationSource && (
                <p className="mt-2">
                  {b.invitationTexte}
                  <Pastille preuve={preuveSource("Invitation à présenter une demande", b.invitationTexte, b.invitationSource.source, b.invitationSource.lien, b.invitationSource.verifieLe)} pays={p.nom} contexte="l’invitation" />
                </p>
              )}
              {b.type === "ue" && (
                <>
                  <p className="mt-2 text-sm text-gris">{europe.texte}</p>
                  <NoteEurope note={europe.inscription} titre="Inscription sur place" pays={p.nom} />
                  {europe.pays[p.id] && <NoteEurope note={europe.pays[p.id]} titre="Séjour sur place" pays={p.nom} />}
                </>
              )}
              {b.detailsAVerifier && <p className="mt-2 text-sm text-gris">Les conditions détaillées du visa de travail (employeur, salaire, diplôme) restent à vérifier sur le site officiel du pays.</p>}
              {(b.conditions ?? []).length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {b.conditions?.map((c) => <li key={c}>{c}</li>)}
                </ul>
              )}
              {b.detail && <CarteVisa visa={b.detail} pays={p.nom} />}
            </li>
          ))}
          <CarteVie paysId={p.id} nomPays={p.nom} />
        </ul>
      </section>

      {FAMILLES.map((f) => (
        <section key={f.id} className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Icone nom={f.id} className="h-5 w-5 text-gris" /> {f.nom}</h2>
          <ul className="mt-3 space-y-3">
            {criteres.filter((c) => c.famille === f.id).map((c) => <CarteCritere key={c.id} c={c} paysId={p.id} nomPays={p.nom} />)}
          </ul>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Liens officiels</h2>
        <ul className="mt-3 space-y-3">
          {liens.map((l) => <Lien key={l.id} lien={l} date={dossier?.verifieLe ?? ""} officiel />)}
        </ul>
        {associations.length > 0 && (
          <>
            <h3 className="mt-6 font-semibold">Associations et réseaux</h3>
            <p className="mt-1 text-sm text-gris">Seulement des organismes publics ou des associations à but non lucratif.</p>
            <ul className="mt-3 space-y-3">
              {associations.map((l) => <Lien key={l.id} lien={l} date={dossier?.verifieLe ?? ""} />)}
            </ul>
          </>
        )}
        <div className="mt-6">
          <BoutonDossier paysId={p.id} />
          <p className="mt-2 text-sm text-gris">Le fichier est créé sur ton appareil : rien n’est envoyé.</p>
        </div>
      </section>

      <PiedDePage liens={[{ href: "/methode", texte: "Comment on calcule" }, { href: "/quiz", texte: "Faire le quiz" }]} />
    </main>
  );
}
