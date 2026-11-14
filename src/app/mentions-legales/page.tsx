import type { Metadata } from "next";
import Link from "next/link";
import PiedDePage from "@/components/PiedDePage";
import { sources } from "@/lib/donnees";

export const metadata: Metadata = {
  title: "Mentions légales | Country Search",
  description: "Qui édite Country Search, ce que valent ses informations, ses sources et ses licences, et pourquoi aucune donnée personnelle n’est collectée.",
};

export default function MentionsLegales() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline">Accueil</Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Mentions légales</h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Ce n’est pas un conseil juridique</h2>
        <p className="mt-3">
          Country Search n’est pas un site officiel. Les informations sur les visas, les impôts et la protection sociale
          sont données à titre indicatif et ne constituent pas un conseil juridique. Les règles changent souvent :
          vérifie toujours sur les sites officiels avant de décider ou de faire une démarche.
        </p>
        <p className="mt-3">
          Chaque information affichée renvoie à sa source et à sa date de vérification. Quand on n’a pas pu la vérifier,
          elle est marquée « À vérifier ».
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Éditeur</h2>
        <p className="mt-3">
          Site édité par NonoMA19, à titre personnel et non commercial. Projet gratuit, sans publicité et sans affiliation.
          Hébergement : Vercel.
        </p>
        <p className="mt-3 text-gris">
          Il n’y a pas encore d’adresse de contact : elle sera ajoutée ici dès qu’elle existera.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Aucune donnée personnelle collectée</h2>
        <p className="mt-3">
          Pas de compte, pas de cookie, pas de mesure d’audience. Tes réponses au quiz restent dans ton navigateur
          (stockage de session) et s’effacent quand tu fermes l’onglet. Le dossier PDF est créé sur ton appareil :
          rien n’est envoyé.
        </p>
        <p className="mt-3">On ne te demande jamais tes opinions politiques, ta religion ni ta santé.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Licences</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Code du site : licence MIT.</li>
          <li>Textes de la rédaction (« Notre avis ») : licence CC BY-SA 4.0.</li>
          <li>Drapeaux : paquet country-flag-icons (licence MIT). Icônes : Lucide (licence ISC).</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Sources et leurs licences</h2>
        <p className="mt-3 text-gris">
          Quand une licence ne permet pas de réutiliser le contenu, on donne seulement le lien, sans rien recopier.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(sources).filter(([id]) => id !== "notre-avis").map(([id, s]) => (
            <li key={id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-lien underline">{s.nom}</a>. Licence : {s.licence}.
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm"><Link href="/methode" className="text-lien underline">Voir la méthode de calcul</Link></p>
      </section>

      <PiedDePage />
    </main>
  );
}
