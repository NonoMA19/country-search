import type { Metadata } from "next";
import Link from "next/link";
import { LIBELLE_TYPE, criteres, dateDonnees, dateFr, mesures, quiz, sources, type Effet, type TypeSource } from "@/lib/donnees";
import PiedDePage from "@/components/PiedDePage";
import { paysCouverts } from "@/lib/moteur";
import { pays } from "@/lib/pays";

export const metadata: Metadata = {
  title: "La méthode | Country Search",
  description: "Comment Country Search calcule ton résultat : ce qu’on mesure, l’importance de chaque réponse, les sources et leurs limites.",
};

const NOMS_FAMILLES: Record<string, string> = { partir: "Partir", travailler: "Travailler", vivre: "Vivre", valeurs: "Valeurs (en option)" };
const STYLE_TYPE: Record<TypeSource, string> = {
  officiel: "bg-bleu text-white",
  "donnee-ouverte": "bg-bleu-doux text-encre",
  "notre-avis": "border border-bord bg-carte text-encre",
};

function Type({ type }: { type: TypeSource }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ${STYLE_TYPE[type]}`}>{LIBELLE_TYPE[type]}</span>;
}

function effet(e: Effet[] | undefined): string {
  if (!e || e.length === 0) return "rien ne change";
  return e.map((x) => `${x.mesures.map((m) => mesures[m]?.nom ?? m).join(" et ")} : ${x.sens === "haut" ? "le haut de l’échelle gagne" : "le bas de l’échelle gagne"}`).join(" ; ");
}

export default function Methode() {
  const familles = ["partir", "travailler", "vivre", "valeurs"];
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline">Accueil</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">La méthode</h1>
      <p className="mt-3 text-lg text-gris">Un simple calcul classe les pays. Aucune intelligence artificielle ne décide, et rien n’est inventé.</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Le calcul en 6 points</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Pour chaque chose qu’on mesure (le chômage des jeunes, l’hiver, la langue…), chaque pays reçoit une place sur une échelle à 5 niveaux. Le niveau le plus bas vaut 0 %, puis 25 %, 50 %, 75 % et 100 %.</li>
          <li>Seules tes réponses comptent. Une phrase à laquelle tu réponds « Passer » ne change rien.</li>
          <li>Tes 3 priorités comptent double (importance 2). Chaque autre réponse compte simple (importance 1). Si plusieurs réponses visent la même chose, on garde la plus grande importance, sans les additionner : seules tes 3 priorités comptent double.</li>
          <li>Ton pourcentage = les points gagnés par le pays, divisés par les points possibles. Il mesure « ça te ressemble » avec les familles Travailler, Vivre et, si tu l’as choisi, Valeurs.</li>
          <li>Une donnée « À vérifier » sur une de tes 3 priorités compte pour une note neutre, 50 %, et la carte du pays le dit : un trou dans les données ne peut pas faire gagner un pays. Sur une autre réponse, elle est sautée : elle ne donne ni ne retire de points.</li>
          <li>Si un pays a une donnée vérifiée pour moins de 60 % de ce qui compte pour toi (on compte les mesures, une par une), il ne peut pas entrer dans ton top 3 : il reste dans la liste, sans pourcentage, avec la mention « pas assez de données ».</li>
        </ol>
        <p className="mt-3">La famille Partir (visa, âge, argent) n’entre pas dans le pourcentage. Elle donne un badge : Porte ouverte, Faisable avec conditions, Difficile ou Fermé à ton âge.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Un pays « Fermé à ton âge » ne peut pas entrer dans ton top 3 : il passe dans « Moins adaptés pour toi », avec la raison et son pourcentage inchangé. Un bouton permet de le remonter.</li>
          <li>Le budget ne fait jamais descendre un pays : on t’affiche seulement ce qu’il te manquerait.</li>
          <li>Si tu déclares une autre nationalité, le badge devient « Porte ouverte grâce à ta nationalité » seulement dans les cas que nous avons vérifiés : la nationalité du pays lui-même (canadienne pour le Canada, américaine pour les États-Unis) et la nationalité irlandaise pour le Royaume-Uni. Le pourcentage ne change pas.</li>
        </ul>
        <p className="mt-3 text-sm text-gris">PVT : Programme Vacances-Travail, un visa d’un an pour voyager et travailler. VIE : Volontariat international en entreprise, une mission de 6 à 24 mois pour une entreprise française à l’étranger.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Un exemple chiffré</h2>
        <p className="mt-3">Tes priorités : le travail facile à trouver et un climat doux (importance 2 chacune). Tu réponds « Non » à « Je suis prêt à apprendre une nouvelle langue » (importance 1).</p>
        <p className="mt-3 text-sm text-gris sm:hidden" aria-hidden="true">Fais glisser le tableau sur le côté pour tout voir.</p>
        <div className="mt-2 overflow-x-auto rounded-2xl border border-bord focus-visible:outline-2 focus-visible:outline-bleu" tabIndex={0} role="region" aria-label="Exemple chiffré, tableau défilant">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="px-3 pt-3 text-left font-medium">Deux pays imaginaires, A et B, notés sur les mêmes réponses</caption>
            <thead><tr className="border-b border-bord"><th scope="col" className="px-3 py-2">Ce qui compte</th><th scope="col" className="py-2 pr-2">Importance</th><th scope="col" className="py-2 pr-2">Pays A</th><th scope="col" className="py-2 pr-3">Pays B</th></tr></thead>
            <tbody>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Chômage des jeunes</th><td className="pr-2">2</td><td className="pr-2">niveau 3 : 50 %, soit 1 point</td><td className="pr-3">niveau 1 : 0 %, soit 0 point</td></tr>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Climat doux</th><td className="pr-2">2</td><td className="pr-2">niveau 2 : 25 %, soit 0,5 point</td><td className="pr-3">niveau 3 : 50 %, soit 1 point</td></tr>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Langue du quotidien</th><td className="pr-2">1</td><td className="pr-2">niveau 5 : 100 %, soit 1 point</td><td className="pr-3">niveau 4 : 75 %, soit 0,75 point</td></tr>
              <tr className="font-semibold"><th scope="row" className="px-3 py-2">Total sur 5 points</th><td /><td className="pr-2">2,5 points, soit 50 %</td><td className="pr-3">1,75 point, soit 35 %</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Comment les phrases sont choisies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Après tes 3 priorités, on regarde les 5 premiers pays de ton classement.</li>
          <li>On te pose la phrase pour laquelle ces 5 pays sont les plus différents. C’est un calcul, pas une IA.</li>
          <li>Ton résultat est proposé quand ton top 3 n’a pas bougé pendant 3 réponses, après au moins 6 réponses. « Passer » ne compte ni dans les 6, ni dans les 3. Tu peux t’arrêter avant, ou continuer.</li>
          <li>Sous chaque pays, « Pourquoi ce pays » ne cite que des points notés 4 ou 5 sur 5 dans le sens de tes réponses. « Ce qui peut coincer » cite un point noté 1 ou 2 sur 5.</li>
          <li>Certaines réponses font descendre des pays dans « Moins adaptés pour toi ». La raison est écrite, et un bouton permet de les remonter.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Trois sortes de sources</h2>
        <ul className="mt-3 space-y-3">
          <li><Type type="officiel" /> Un site d’État ou d’organisme public (France Diplomatie, Service-Public, GOV.UK…).</li>
          <li><Type type="donnee-ouverte" /> Une base de données publique, libre de réutilisation : Banque mondiale, Organisation internationale du travail (OIT), Open-Meteo.</li>
          <li><Type type="notre-avis" /> Un jugement de la rédaction, justifié par écrit. Il reste discutable : la justification est affichée pour que tu puisses juger par toi-même.</li>
        </ul>
        <p className="mt-3 text-sm text-gris">Dernière collecte des données : {dateFr(dateDonnees)}. Des pays à 5 points d’écart ou moins du premier de leur groupe sont affichés à égalité.</p>
      </section>

      {familles.map((f) => (
        <section key={f} className="mt-8">
          <h2 className="text-xl font-semibold">Famille {NOMS_FAMILLES[f]}</h2>
          <div className="mt-3 space-y-4">
            {criteres.filter((c) => c.famille === f).map((c) => (
              <article key={c.id} className="rounded-3xl border border-bord bg-carte p-5">
                <h3 className="font-semibold">{c.numero}. {c.nom} <Type type={c.type} /></h3>
                <p className="mt-1 text-gris">{c.definition}</p>
                {c.role === "badge" && c.echelle && (
                  <p className="mt-2 text-sm"><span className="font-medium">Ce qu’on regarde : </span>{c.echelle.join(" · ")}. Importance : aucune dans le pourcentage, cela donne le badge.</p>
                )}
                {c.mesures.map((m) => (
                  <div key={m.id} className="mt-3 text-sm">
                    <p className="font-medium">{m.nom}{m.sens === "position" ? " (une position, ni bonne ni mauvaise)" : ""}</p>
                    <p className="text-gris">Les 5 niveaux, du plus bas au plus haut : {m.echelle.join(" · ")}.</p>
                    {m.regle && <p className="text-gris">Règle : {m.regle}</p>}
                    <p className="text-gris">
                      {paysCouverts(m.id) > 0
                        ? `Pays couverts : ${paysCouverts(m.id)} sur ${pays.length}.`
                        : "Pas encore de donnée vérifiée : cette mesure ne compte pas pour l’instant."}
                    </p>
                  </div>
                ))}
                <p className="mt-3 text-sm">
                  <span className="font-medium">Sources : </span>
                  {c.sources.map((id, i) => {
                    const s = sources[id];
                    return (
                      <span key={id}>
                        {i > 0 && " ; "}
                        {s.url.startsWith("http") ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-lien underline">{s.nom}</a> : s.nom} ({s.licence})
                      </span>
                    );
                  })}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Les priorités et leur importance</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {quiz.priorites.map((p) => <li key={p.id}>{p.label} : {p.mesures.filter((m) => mesures[m]).map((m) => mesures[m].nom).join(" et ")}, importance 2.</li>)}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Toutes les phrases et leur effet</h2>
        <p className="mt-2 text-sm text-gris">Chaque phrase compte avec une importance de 1.</p>
        <ul className="mt-3 space-y-3">
          {quiz.phrases.map((ph) => (
            <li key={ph.id} className="rounded-2xl border border-bord bg-carte p-4 text-sm">
              <p className="text-base font-medium">« {ph.texte} »</p>
              {ph.type === "oui-non" && <p className="mt-1 text-gris">Oui : {effet(ph.oui)}. Non : {effet(ph.non)}.</p>}
              {ph.type === "choix" && <p className="mt-1 text-gris">{ph.options?.map((o) => `${o.label} : ${effet(o.effets)}`).join(". ")}.</p>}
              {ph.type === "ecart" && <p className="mt-1 text-gris">Si tu réponds {ph.ecarteSi}, les pays concernés descendent dans « Moins adaptés pour toi ».</p>}
              {ph.type === "filtre" && <p className="mt-1 text-gris">Si oui, les autres phrases sur ce sujet ne sont pas posées.</p>}
              {ph.regleAffichage && <p className="mt-1 text-gris">Règle d’affichage : {ph.regleAffichage}</p>}
              {ph.saufPriorites && <p className="mt-1 text-gris">Pas posée si tu as déjà choisi la priorité liée.</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Toutes les sources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(sources).map(([id, s]) => (
            <li key={id}>
              <Type type={s.type} />{" "}
              {s.url.startsWith("http") ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-lien underline">{s.nom}</a> : s.nom}. Licence : {s.licence}.
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gris">Sources écartées parce que leur licence ne permet pas la réutilisation : Numbeo, EF EPI, Hofstede.</p>
      </section>

      <p className="mt-10 text-sm text-gris">Code sous licence MIT, contenu sous licence CC BY-SA 4.0.</p>
      <PiedDePage />
    </main>
  );
}
