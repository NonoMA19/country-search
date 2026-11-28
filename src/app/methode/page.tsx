import { aVerifierParCategorie } from "@/lib/averifier";
import type { Metadata } from "next";
import Link from "next/link";
import { LIBELLE_TYPE, criteres, dateDonnees, dateFr, europe, mesures, notes, preuveSource, quiz, sources, villes, type OptionDilemme, type TypeSource } from "@/lib/donnees";
import { MAX_CERCLES, RAYONS, RAYON_TERRE } from "@/lib/zones";
import Definition, { AvecDefinitions } from "@/components/Definition";
import Pastille from "@/components/Pastille";
import PiedDePage from "@/components/PiedDePage";
import { POIDS_OBJECTIF, SEUIL_DILEMME, dilemmeActif, mesureClassante, paysCouverts } from "@/lib/moteur";
import { pays } from "@/lib/pays";

export const metadata: Metadata = {
  title: "La méthode | Orizo",
  description: "Comment Orizo calcule ton résultat : ce qu’on mesure, l’importance de chaque réponse, les sources et leurs limites.",
};

const NOMS_FAMILLES: Record<string, string> = { partir: "Partir", travailler: "Travailler", vivre: "Vivre", valeurs: "Valeurs (en option)" };
const STYLE_TYPE: Record<TypeSource, string> = {
  officiel: "bg-bleu text-white",
  "donnee-ouverte": "bg-bleu-doux text-encre",
  "notre-avis": "border border-bord bg-carte text-encre",
  temoignages: "border border-bleu bg-carte text-lien",
};

function Type({ type }: { type: TypeSource }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap ${STYLE_TYPE[type]}`}>{LIBELLE_TYPE[type]}</span>;
}

const nombre = (n: number) => n.toLocaleString("fr-FR");

// Pour chaque mesure datée : la plus ancienne et la plus récente année parmi les notes vérifiées des pays.
function anneesParMesure() {
  return Object.values(mesures).flatMap((m) => {
    const ans = pays.map((p) => notes[p.id]?.[m.id]).filter((n) => n?.statut === "verifie" && n.annee && /^\d{4}$/.test(n.annee)).map((n) => Number(n!.annee));
    if (!ans.length) return [];
    const min = Math.min(...ans), max = Math.max(...ans);
    return [{ id: m.id, nom: m.court ?? m.nom, min, max, ecart: max - min }];
  });
}

// L'effet d'une option, en mots simples.
function effet(o: OptionDilemme): string {
  const morceaux = o.effets.map((e) => {
    const noms = e.mesures.map((m) => mesures[m]?.nom ?? m).join(" et ");
    if (e.position !== undefined) {
      const m = mesures[e.mesures[0]];
      return `${noms} : la position « ${m?.echelle[e.position - 1] ?? e.position} » gagne`;
    }
    return `${noms} : importance ${nombre(e.poids ?? 1)}`;
  });
  return morceaux.length ? morceaux.join(" ; ") : "rien ne change";
}

// Le sommaire, collé à gauche sur ordinateur (1024 px et plus) ; caché sur téléphone et tablette, où la page se lit d'un trait.
const SOMMAIRE: [string, string][] = [
  ["le-calcul-en-7", "Le calcul en 7 points"],
  ["ta-zone-sur-la-carte", "Ta zone sur la carte"],
  ["ton-projet-fixe-les", "Ton projet"],
  ["un-exemple-chiffre", "Un exemple chiffré"],
  ["comment-les-questions-sont", "Le choix des questions"],
  ["ton-profil-ses-certitudes", "Ton profil"],
  ["faisabilite-et-fiabilite", "Faisabilité et fiabilité"],
  ["le-pays-surprise", "Le pays surprise"],
  ["quatre-sortes-de-sources", "Quatre sortes de sources"],
  ["famille-partir", "Les mesures, famille par famille"],
  ["les-envies-et-leur", "Les critères"],
  ["tous-les-dilemmes-et", "Les dilemmes"],
  ["a-verifier", "Ce qui reste à vérifier"],
  ["toutes-les-sources", "Toutes les sources"],
];

export default function Methode() {
  const familles = ["partir", "travailler", "vivre", "valeurs"];
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 lg:grid lg:max-w-6xl lg:grid-cols-[15rem_minmax(0,46rem)] lg:items-start lg:justify-center lg:gap-12 lg:px-8 lg:py-12">
      <nav aria-labelledby="titre-sommaire" className="hidden lg:sticky lg:top-8 lg:block">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline">Accueil</Link>
        <h2 id="titre-sommaire" className="mt-4 text-xs font-medium tracking-wide text-gris uppercase">Sommaire</h2>
        <ol className="mt-2 max-h-[calc(100dvh-10rem)] space-y-0.5 overflow-y-auto border-l border-bord">
          {SOMMAIRE.map(([id, titre]) => (
            <li key={id}><a href={`#${id}`} className="-ml-px flex min-h-9 items-center border-l-2 border-transparent py-1 pl-3 text-sm text-gris hover:border-bleu hover:text-encre focus-visible:outline-2 focus-visible:outline-bleu">{titre}</a></li>
          ))}
        </ol>
      </nav>
      <div className="min-w-0">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline lg:hidden">Accueil</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight lg:mt-0 lg:text-4xl">La méthode</h1>
      <p className="mt-3 text-lg text-gris">Un simple calcul classe les pays. Aucune intelligence artificielle ne décide, et rien n’est inventé.</p>

      <section id="le-calcul-en-7" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Le calcul en 7 points</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li id="notes-continues">Pour chaque chose qu’on mesure (le chômage des jeunes, l’hiver, la langue…), chaque pays reçoit une note de 1 à 5 (1 vaut 0 %, 5 vaut 100 %). Quand la mesure est un chiffre (salaire, heures, température, prix…), la note est continue : entre deux seuils, elle glisse en ligne droite, au lieu de sauter d’un niveau à l’autre. Exemple : un salaire de 76 285 $, entre les seuils de 72 500 et 79 500 $, vaut 4,04 au lieu de 4 ; à 80 136 $, 4,59 au lieu de 5. Deux pays presque égaux ont ainsi presque la même note. Les mots affichés (« Hiver doux ») restent ceux du niveau entier.</li>
          <li>Seules tes réponses comptent. Un écran auquel tu réponds « Passer » ne change rien. La carte du début (« où te vois-tu vivre ? ») compte un peu : chaque pays de ta zone reçoit un bonus, comme un critère passé au second plan (importance 1,1). Un pays hors de ta zone ne perd rien. On la garde aussi pour la comparer à ton résultat (<a href="#ta-zone-sur-la-carte" className="text-lien underline">ta zone sur la carte</a>).</li>
          <li id="langues-parlees">Une langue que tu parles (chapitre 1, en plus du français et de l’anglais) compte toujours : la « langue du quotidien » entre dans ton calcul pour tous les pays (importance 1, comme une réponse de dilemme). Là où tu parles la langue, le pays a la meilleure note, comme s’il parlait français ; ailleurs, il garde sa note (anglais, autre langue latine, autre écriture). Avant le 26 novembre 2026, c’était un simple bonus aux pays de ta langue, sans rien dire des autres : il pesait trop peu (environ 3 points), et un profil qui parle espagnol avait encore le Japon en n° 1.</li>
          <li id="criteres">Tu choisis jusqu’à 5 critères parmi 18 (sans doublon depuis le 26 novembre 2026 : « Soleil et chaleur », « Du temps pour soi », « Une vie saine et bien soignée », « Vivre et travailler sans nouvelle langue » et « Une culture de travail simple et directe » regroupent chacun des critères qui se recouvraient), en trois temps : tes critères, puis celui que tu sacrifierais en dernier (importance 2), puis celui qui passe au second plan (1,1). Les autres comptent 1,5 ; un seul critère compte 2. Un critère qui vise deux mesures partage son importance entre elles : « Proche de la France » donne 2/3 au temps de vol et 1/3 au décalage horaire (un pays à 6 h de vol mais à la même heure n’est pas « proche »). Une option de dilemme, une phrase « Ça me correspond », une ambiance ou une valeur touchée compte simple (importance 1) ou à moitié (0,5 : « Un peu », ta motivation, ton scénario idéal, le test à l’aveugle). Ton projet donne des poids de départ, plus légers (importance 0,5). Si plusieurs réponses visent la même mesure, on garde la plus grande importance, sans les additionner.</li>
          <li>Certaines mesures ne sont ni bonnes ni mauvaises : la hiérarchie, la façon de communiquer, la ponctualité, la prise de décision, le lien entre vie pro et vie perso, l’hiver, l’été. Pour elles, ton option fixe une position préférée. Un pays à cette position gagne 100 %, un niveau plus loin 75 %, deux niveaux 50 %, et ainsi de suite.</li>
          <li id="deux-mesures">Deux mesures par pays. « Il te ressemble » = les points gagnés par le pays, divisés par les points possibles (familles Travailler et Vivre, et les valeurs que tu as rangées). « Il t’est accessible » = 100 moins chaque obstacle pour toi : la porte d’entrée (PVT à demander −5, PVT sur invitation ou à très petit quota −15, visa de travail −20, PVT fermé à ton âge −20), l’argent qui te manquerait pour un PVT (−15, ou −5 s’il pourrait manquer), un PVT d’un an alors que tu veux rester plus longtemps (−10), travailler en français impossible alors que tu le veux (−30), chacune de tes limites (« Je préfère éviter » −10, « Rédhibitoire » −15). Tes valeurs (les cartes que tu touches) comptent dans « Il te ressemble », pas dans l’accès. Les droits de ta famille selon le visa (à deux ou en famille, hors d’Europe) sont dits « à vérifier », sans rien retirer : aucune source ne les donne visa par visa. Le classement suit surtout « Il te ressemble » : « Il te ressemble » × (1 − 0,15 × (100 − « Il t’est accessible ») ÷ 100). Un pays accessible à 80 garde 97 % de son score ; à 50, 92,5 %.</li>
          <li id="regle-30-pays">Une mesure ne bouge ton classement que si elle est notée pour au moins 30 pays sur 38. En dessous, ta réponse enrichit ton portrait, et l’écran le dit. Exception : les critères essentiels comptent toujours (salaire ou indemnité VIE, coût de la vie, sécurité, langue de travail) ; un pays sans donnée sur l’un d’eux ne peut pas entrer dans ton top 3 si c’est un de tes 3 premiers critères. Les mesures sous 30 pays aujourd’hui : la prise de décision (28), de la vie pro et vie perso (26), d’un logement abordable (aucune donnée), de la presse libre et de la corruption (leur licence interdit de transformer la note).</li>
          <li id="economie-informelle">Chômage des jeunes : c’est l’estimation de l’Organisation internationale du travail (via la Banque mondiale). Dans les pays à revenu faible ou intermédiaire selon la Banque mondiale (Argentine, Brésil, Chine, Colombie, Côte d’Ivoire, Inde, Maroc, Mexique, Pérou, Sénégal, Thaïlande, Vietnam), beaucoup d’emplois sont informels : un chômage bas n’y veut pas dire que les emplois déclarés sont faciles à trouver. Ces pays portent la mention « Économie informelle ». La part des jeunes ni en emploi ni en formation serait plus juste, mais elle manque pour 4 pays (Corée du Sud, Taïwan, Chine, Maroc).</li>
          <li id="donnees-manquantes">Une donnée « À vérifier » sur un de tes critères compte comme une note moyenne (50 %), et la carte du pays le dit. Cette moyenne peut avantager un pays dont la vraie note serait basse : c’est pourquoi un pays à qui il manque une donnée sur un de tes 3 premiers critères ne peut jamais entrer dans ton top 3. Il reste dans la liste, avec son pourcentage et la mention « Donnée manquante : salaire » (par exemple). Sur tes autres critères, la donnée manquante compte comme moyenne. Sur une réponse qui n’est pas un critère, elle est sautée : elle ne donne ni ne retire de points.</li>
          <li>Si un pays a une donnée vérifiée pour moins de 60 % de ce qui compte pour toi (on compte les mesures, une par une), il ne peut pas entrer dans ton top 3 : il reste dans la liste, sans pourcentage, avec la mention « pas assez de données ».</li>
        </ol>
        <p className="mt-3">La famille Partir (visa, âge, argent) entre dans « Il t’est accessible », jamais dans « Il te ressemble ». Elle donne aussi un badge : Porte ouverte, Faisable avec conditions, Difficile ou Fermé à ton âge.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Aucune limite ni aucun obstacle ne retire un pays : il recule, et reste dans ta liste. Une seule exception, légale : si ton projet est un PVT et que le PVT de ce pays est fermé à ton âge, le pays est montré à part (« Fermés par la loi pour ton projet »), avec l’autre porte possible, et jamais dans ton top 3. Pour un autre projet, un PVT fermé rend seulement le pays moins accessible (il faut un visa de travail).</li>
          <li>Ton budget est une somme (l’enveloppe du chapitre 1). Si elle est sous la somme demandée par un PVT, on dit « il te manquerait environ » la différence, et le pays devient moins accessible. Il ne change jamais « Il te ressemble ». Sans réponse, on donne seulement la somme demandée.</li>
          <li>Si tu déclares une autre nationalité, le badge devient « Porte ouverte grâce à ta nationalité » seulement dans les cas que nous avons vérifiés : la nationalité du pays lui-même (canadienne pour le Canada, américaine pour les États-Unis) et la nationalité irlandaise pour le Royaume-Uni. Le pourcentage ne change pas. Pour toute autre nationalité, ou pour les autres pays, le résultat dit clairement que ce cas n’est pas encore couvert.</li>
        </ul>
        <p className="mt-3">
          Europe sans visa : {europe.texte}
          <Pastille preuve={preuveSource("Inscription sur place", europe.inscription.texte, europe.inscription.source, europe.inscription.lien, europe.inscription.verifieLe)} contexte="l’inscription sur place en Europe" />
        </p>
        <p className="mt-3 text-sm text-gris">Touche un mot souligné en pointillé pour lire sa définition : <Definition cle="pvt" />, <Definition cle="vie" />.</p>
      </section>

      <section id="ta-zone-sur-la-carte" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Ta zone sur la carte</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Au début du quiz, tu peux tracer jusqu’à {MAX_CERCLES} zones sur un planisphère : un centre et un rayon réel, de {nombre(RAYONS[0])} à {nombre(RAYONS.at(-1)!)} km. La distance se mesure à vol d’oiseau sur la Terre (le plus court chemin sur la sphère, rayon moyen de {nombre(RAYON_TERRE)} km), pas sur la carte à plat : un cercle près des pôles paraît plus grand, et un cercle autour de la Nouvelle-Zélande peut passer de l’autre côté de la carte. Tu peux aussi choisir une ou plusieurs régions (6 boutons) ou placer une zone autour d’une ville dans une liste, au clavier.</li>
          <li>Un pays est dans ta zone si sa <strong>ville de référence</strong> est dans un de tes cercles, ou s’il fait partie d’une région choisie. Limite : une seule ville par pays. Un cercle qui touche un pays sans contenir sa ville ne le compte pas.</li>
          <li>Effet sur le calcul : la mesure « Ta zone sur la carte » donne la note maximale aux pays de ta zone, avec l’importance d’un critère passé au second plan (1,1). Les autres pays n’ont pas de note pour cette mesure : ils ne perdent rien, et elle ne compte ni dans la règle des 60 % ni dans le badge « Données disponibles ». Aucun pays n’est écarté. Sans zone (« Je n’ai pas de zone précise », ou « Passer ») : aucun effet.</li>
          <li>Ordre de grandeur, mesuré sur 392 parcours tirés au hasard : un pays placé dans ta zone gagne environ 2 points de pourcentage (de 1,8 à 2,7 pour 8 parcours sur 10). Un pays classé n° 10 remonte en général au n° 8, et entre dans le top 3 dans moins de 2 % des parcours. C’est un coup de pouce, pas un filtre.</li>
          <li id="double-comptage">Pas de double comptage avec le critère « Proche de la France » : si tu l’as choisi, une zone qui contient la France (un cercle qui contient Paris, ou la région Europe) ne donne pas de bonus en plus. La proximité compte déjà, par le temps de vol et le décalage horaire, avec l’importance de ton envie (jusqu’à 2). Tes autres zones comptent normalement. Sans cette règle, vouloir rester près de la France compterait deux fois et pousserait encore plus haut les pays européens, déjà n° 1 dans la plupart des parcours simulés.</li>
          <li>Les cercles se placent sur une carte à plat (projection équirectangulaire, Natural Earth, domaine public). Les coordonnées des villes viennent de GeoNames, via le géocodage Open-Meteo (CC BY 4.0).</li>
        </ul>
        <details className="mt-3 rounded-2xl border border-bord bg-carte">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Les {pays.length} villes de référence</summary>
          <ul className="grid gap-x-6 gap-y-1 px-4 pb-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {pays.map((p) => <li key={p.id}>{p.nom}{"\u00a0"}: {villes[p.id]?.nom ?? "à vérifier"}</li>)}
          </ul>
        </details>
      </section>

      <section id="ton-projet-fixe-les" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Ton projet fixe les règles de départ</h2>
        <p className="mt-3">Le projet que tu choisis au début donne des poids de départ, avant même tes critères. « Je ne sais pas encore » n’en donne aucun. Ils sont légers : importance {nombre(POIDS_OBJECTIF)}, moins qu’une réponse de dilemme (importance 1).</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {Object.entries(quiz.objectifs).map(([id, o]) => <li key={id}>{o.explication}</li>)}
        </ul>
        <p className="mt-3">Tes réponses l’emportent. Si, dans un dilemme, tu choisis une autre option que celle qui visait une de ces mesures, son poids de départ disparaît. Exemple : tu pars pour une année d’aventure, mais au dilemme « Deux offres » tu choisis le meilleur salaire : la vie pas chère perd son poids de départ.</p>
        <p className="mt-3">Le badge de visa ne dépend pas de ce calcul : ton projet change seulement la porte d’entrée proposée (PVT, VIE ou visa de travail), comme avant.</p>
      </section>

      <section id="un-exemple-chiffre" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Un exemple chiffré</h2>
        <p className="mt-3">Pour simplifier, deux critères seulement, de même importance (2) : le travail facile à trouver et un climat doux. Une réponse vise la langue du quotidien (importance 1). Les deux pays sont tous deux en Europe, sans aucune limite : « Il t’est accessible » vaut 100 pour les deux, et le classement suit « Il te ressemble ».</p>
        <p className="mt-3 text-sm text-gris sm:hidden" aria-hidden="true">Fais glisser le tableau sur le côté pour tout voir.</p>
        <div className="mt-2 overflow-x-auto rounded-2xl border border-bord focus-visible:outline-2 focus-visible:outline-bleu" tabIndex={0} role="region" aria-label="Exemple chiffré, tableau défilant">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="px-3 pt-3 text-left font-medium">Deux pays imaginaires, A et B, notés sur les mêmes réponses</caption>
            <thead><tr className="border-b border-bord"><th scope="col" className="px-3 py-2">Ce qui compte</th><th scope="col" className="py-2 pr-2">Importance</th><th scope="col" className="py-2 pr-2">Pays A</th><th scope="col" className="py-2 pr-3">Pays B</th></tr></thead>
            <tbody>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Chômage des jeunes</th><td className="pr-2">2</td><td className="pr-2">niveau 3 : 50 %, soit 1 point</td><td className="pr-3">niveau 1 : 0 %, soit 0 point</td></tr>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Climat doux</th><td className="pr-2">2</td><td className="pr-2">niveau 2 : 25 %, soit 0,5 point</td><td className="pr-3">niveau 3 : 50 %, soit 1 point</td></tr>
              <tr className="border-b border-bord"><th scope="row" className="px-3 py-2 font-normal">Langue du quotidien</th><td className="pr-2">1</td><td className="pr-2">niveau 5 : 100 %, soit 1 point</td><td className="pr-3">niveau 4 : 75 %, soit 0,75 point</td></tr>
              <tr className="font-semibold"><th scope="row" className="px-3 py-2">Total sur 5 points</th><td /><td className="pr-2">2,5 points, soit 50 %</td><td className="pr-3">1,75 point, soit 35 %</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="comment-les-questions-sont" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Comment les questions sont choisies</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Un dilemme est une petite scène avec 2 options. Chaque option affiche son avantage (+) et son prix (−) : il n’y a pas de bonne réponse. Les montants et les durées des scènes sont des exemples, pas les chiffres d’un pays.</li>
          <li>Les dilemmes qui forment une échelle (salaire et coût de la vie, salaire et temps libre, emploi et salaire, distance, hiver, été, ville et nature, sécurité…) ont 4 réponses : « Plutôt A », « Un peu A », « Un peu B », « Plutôt B ». « Plutôt » donne l’effet complet de l’option (importance 1, ou sa position). « Un peu » en donne la moitié : importance 0,5, ou une position à mi-chemin entre celle de l’option et le milieu de l’échelle (exemple : la position 4 devient 3,5). Les dilemmes de culture au travail gardent 2 options : une réponse « entre les deux » n’apprendrait rien.</li>
          <li>Dans les chapitres 3 (ton travail) et 4 (ta vie), chaque écran reçoit un score : l’importance de sa dimension pour toi × son incertitude × sa capacité à départager tes 5 premiers pays du moment. L’importance vaut 1, plus le poids du critère qui la vise (de 2 à 1,1), plus 0,5 si ton projet la vise, plus 0,5 pour ton secteur. L’incertitude vaut 1 si la certitude est faible, 0,5 si elle est moyenne, 0,2 si elle est forte. Une dimension déjà mesurée deux fois compte 0,3 fois. La capacité à départager est l’écart que les réponses possibles creuseraient entre tes 5 premiers pays, de 0 à 4, plus 0,15. C’est un calcul, pas une IA.</li>
          <li>Une option qui ne ferait que redonner une importance déjà acquise (par un de tes critères, par exemple) ne compte pas : elle ne départagerait rien. L’écran est tiré au hasard parmi ceux qui ont au moins 60 % du meilleur score, avec un nombre choisi au début de ton parcours : deux personnes proches n’ont pas les mêmes questions, et « Retour » te remontre le même écran.</li>
          <li>Chaque dilemme mesure une seule chose, mais il a 3 scènes de la vie réelle (par exemple « Deux offres », « Le colocataire », « La sortie du vendredi » pour le salaire face au coût de la vie). Les 3 scènes ont exactement le même effet. Le site en tire une au hasard, et ne te repose jamais une scène que tu as déjà vue dans un parcours précédent (tant qu’il en reste). Le tirage dépend d’un nombre choisi au début de ton parcours : « Retour » et le rechargement de la page te montrent la même scène.</li>
          <li>Des règles s’ajoutent : jamais deux écrans de suite sur la même dimension ; jamais quatre fois de suite le même format dans un chapitre (sauf s’il n’y a pas d’autre format à proposer) ; au moins un écran de chaque thème du chapitre, et toujours les ambiances et tes week-ends au chapitre 4 ; une question n’apparaît que si sa condition est remplie (ton projet, ton secteur, tes langues, ton anglais). Une relance (« Gagner plus, ou dépenser moins », après ta motivation) vient juste après la question qu’elle prolonge. Un chapitre adaptatif dure de 4 à 6 écrans (plus une relance) : il s’arrête quand ses thèmes sont couverts, que les dimensions importantes pour toi ont une certitude au moins moyenne et que ton top 3 n’a pas bougé à la dernière réponse. Le questionnaire compte ainsi de 30 à 40 écrans selon ton profil (35 en moyenne sur 5 000 parcours simulés), environ 9 minutes.</li>
          <li>Un dilemme n’est jamais posé si l’une de ses mesures est notée pour moins de {Math.round(SEUIL_DILEMME * 100)} % des pays.</li>
          <li>Le questionnaire a 5 chapitres. Le chapitre 1 (ton point de départ : ta motivation puis ton projet, sur un même écran en deux temps, ton scénario idéal, avec qui tu pars, la durée sur une frise, ton enveloppe de budget, ton secteur, tes langues, ta nationalité), le chapitre 2 (tes critères en trois temps) et le chapitre 5 (tes limites en 5 familles, deux seuils, tes valeurs à toucher) sont posés à tout le monde. Deux séries de phrases à glisser (« Ta semaine idéale » au chapitre 3, « Ton week-end idéal » au chapitre 4) sont posées à tout le monde, 5 phrases tirées au hasard chacune parmi 18 et 21 (parmi celles qui départagent le plus tes premiers pays) ; une famille de limites n’est posée que si elle touche un de tes 10 premiers pays. Les chapitres 3 (ton travail) et 4 (ta vie) choisissent leurs écrans selon tes réponses. Entre deux chapitres, un écran d’ouverture dit où tu en es. Plus de 10 dilemmes ont un texte adapté à ton projet (« ta mission de VIE », « ton job de PVT ») : les mots changent, jamais l’effet. Le test à l’aveugle montre trois pays de ton top 10 sans leur nom, avec quatre faits chacun ; le pays choisi compte un peu (ses quatre notes deviennent des positions préférées, importance 0,5). À la fin, « Ton intuition et tes réponses » compare ta carte du début à ton n° 1. À la fin, « Continuer pour affiner » propose d’autres écrans des chapitres 3 et 4.</li>
          <li>Sous chaque pays de ton top 3, les points sont rangés en trois catégories : Travailler, Vivre, Culture au travail. Par catégorie, au plus 2 points forts (notés 4 ou 5 sur 5 dans le sens de tes réponses) et 1 point faible (2,5 sur 5 ou moins). Seulement des points liés à tes réponses : un critère, ton projet, un dilemme ou un autre écran du quiz. Une catégorie sans rien à dire n’est pas affichée. Deux pays n’ont jamais exactement la même phrase : le pays mieux classé la garde.</li>
          <li>Dans « Voir le détail », chaque critère est donné avec sa vraie valeur et un mot (« 1,6 h de vol · Très proche »), jamais avec un pourcentage. Les pourcentages restent pour le score global du pays.</li>
          <li>Si ton n°1 et ton n°2 sont à 5 points ou moins, tu peux les départager. On te pose seulement des dilemmes encore sans réponse dont une mesure sépare vraiment ces deux pays : au moins 2 niveaux d’écart sur l’échelle de 1 à 5, avec une donnée vérifiée des deux côtés. Une ligne te dit pourquoi (« On te pose cette question parce que l’Allemagne et la Belgique diffèrent surtout sur la ponctualité. »). Parmi eux, on choisit celui dont les options font le plus varier l’écart. Jusqu’à 5 questions, tant que l’écart reste de 5 points ou moins. Tes réponses comptent comme les autres. Si l’un passe devant, une phrase dit quelle réponse a fait la différence ; s’ils restent à égalité, on le dit, et on te montre la comparaison côte à côte. Cette comparaison ne refait aucun calcul : une ligne par critère qui compte pour toi (tes critères choisis d’abord), la vraie valeur de chaque pays, et une barre qui va vers le pays qui gagne, plus longue si l’écart de note est grand. Si une donnée manque d’un côté, la ligne dit « Non comparable ». Une phrase dit qui gagne sur quoi, en tenant compte de l’importance de chaque critère. Depuis le 26 novembre 2026 : le bouton « Trancher entre les deux » n’apparaît que s’il reste au moins une question qui les sépare vraiment. Sinon, et quand ils restent très proches après tes réponses, une phrase dit sur quoi ils se ressemblent pour toi et ce qui les distingue (les thèmes où l’écart pèse le plus, compte tenu de l’importance de chaque critère), pour savoir sur quoi réfléchir. Jamais « tes réponses n’ont pas suffi ».</li>
          <li>Avant ton résultat, « Ton portrait » est une fiche de synthèse en quatre blocs : ton projet (la forme, ta raison, la durée, avec qui), tes 3 priorités (tes premiers critères), ce que tu refuses (tes limites « non négociables », puis celles que tu préfères éviter) et ton style au travail (tes réponses sur la culture au travail). Chaque bloc a un seul bouton « Modifier », qui rouvre la question la plus utile. Un écran passé n’y apparaît jamais.</li>
          <li id="limites">Aucune réponse n’écarte un pays. Tes limites, en 5 familles (la distance, le climat, la langue, le travail, la sécurité et la santé) et deux seuils (heures de vol, température de janvier), pèsent sur « Il t’est accessible » : « Aucun problème » ne change rien, « Je préfère éviter » retire 10 points d’accès aux pays concernés, « Rédhibitoire » 15. Les situations : vivre hors d’Europe ; des étés à plus de 29 °C ; apprendre une langue avec un autre alphabet (sauf si tu la parles) ; un travail où ni le français ni l’anglais ne suffisent (anglais au travail noté 1 ou 2, sans français au travail) ; des semaines de plus de 44 h ; une ville où il faut rester vigilant (10 homicides ou plus pour 100 000 habitants) ; payer une assurance santé privée (couverture santé notée 1 ou 2). Une limite n’est posée que si elle te concerne : que ton ou ta partenaire doive demander son propre visa (si il ou elle veut travailler). Le visa lié à un employeur et la durée d’un an du PVT ne sont plus des limites (prompt 7) : ils sont déjà demandés ailleurs (« Le job de rêve », la frise de durée). Une donnée manquante ne touche jamais un pays. « Je préfère pouvoir changer d’employeur librement » est une pénalité de goût (importance 1) : un pays où ton visa dépendrait d’un employeur, ou où ce lien n’est pas encore vérifié, reçoit la note 1 ; en partie lié, 3 ; sans visa lié (Europe sans visa, PVT ouvert à ton âge, ta nationalité, ou visa non lié), 5. Ne pas vouloir apprendre de langue est aussi une pénalité ; partir pour une langue, ou viser une entreprise locale, la retire. « Le remonter » annule pour ce pays tes limites et ces pénalités.</li>
        </ul>
      </section>

      <section id="ton-profil-ses-certitudes" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Ton profil, ses certitudes et ses hésitations</h2>
        <p className="mt-3">Tes réponses sont rangées par dimension : le salaire, le coût de la vie, trouver du travail, ton secteur, l’équilibre, la distance, le climat, la ville, la sécurité, la santé, la langue, les Français sur place, la culture au travail (hiérarchie, communication, ponctualité, décision, vie pro et vie perso), les valeurs, ton visa. Le calcul lit ce profil : pour chaque mesure, la plus grande importance donnée par une seule réponse.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Chaque dimension garde la source de tes réponses : déclarée (tes critères, tes limites, tes thermomètres d’anglais, ton secteur) ou déduite (dilemmes, activités à glisser, ambiances, test à l’aveugle, questions sur ton projet).</li>
          <li>Sa certitude vient du nombre de réponses et de leur franchise : une réponse franche (« Plutôt », un critère, une limite, un seuil) vaut 1,5 point ; une réponse plus prudente (« Un peu », une activité à glisser, le test à l’aveugle) 1 ; une réponse au milieu 0,5. Moins de 1,5 point : certitude faible ; moins de 2,5 : moyenne ; sinon forte. Deux réponses franches qui disent le contraire font baisser la certitude d’un cran.</li>
          <li>Une hésitation n’est signalée que si au moins deux réponses s’opposent nettement. Exemples : « Vie pas chère » est le critère que tu sacrifierais en dernier, mais deux fois l’option chère et bien payée ; « Un vrai hiver » parmi tes critères, mais un seuil de froid au-dessus de 0 °C ; « Vivre hors d’Europe » rédhibitoire alors que ta carte ne cochait que des régions hors d’Europe ; un autre alphabet rédhibitoire alors que tu pars pour pratiquer le japonais. Sinon, c’est un compromis : on n’en dit rien. Une hésitation ne change pas le calcul : les deux réponses comptent.</li>
          <li>Ton portrait a un titre tiré de la dimension la plus importante pour toi, 4 à 6 phrases (« Tes réponses montrent… », « Tu acceptes plus facilement… », jamais « Tu es… »), une hésitation s’il y en a une, et « Ce qu’on va chercher pour toi » : tes 3 critères les plus importants.</li>
        </ul>
      </section>

      <section id="faisabilite-et-fiabilite" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Faisabilité et fiabilité</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Sous chaque pays de ton top 3, et dans le dossier du pays si tu as fait le quiz, trois listes courtes : les conditions remplies, celles à remplir (ou non remplies), et ce qui reste à vérifier, puis la prochaine étape avec le lien officiel. Elles viennent seulement de tes réponses (âge, budget, nationalité, projet) et des données sourcées des visas. On n’écrit jamais qu’un pays est « juridiquement accessible ».</li>
          <li>Si ton projet est « Stage ou VIE », un bloc « Le VIE pour toi » reprend les conditions officielles déjà vérifiées (âge à la candidature, âge au départ, durée), les confronte à ton âge et donne le lien vers les offres de Business France. La présence de missions dans chaque pays de ton top 3 reste « à vérifier » tant qu’elle n’est pas sourcée. La condition de nationalité n’est pas encore vérifiée, elle n’est donc pas affichée.</li>
          <li>Une seule règle, partout : une mesure compte comme disponible si elle a une valeur, quel que soit son niveau de preuve (Officiel, Donnée ouverte, Témoignages ou Notre avis). « À vérifier » ne compte jamais. Le badge « Données disponibles » donne la part de tes critères qui ont une valeur pour ce pays : 90 % ou plus, « complètes » ; de 60 à 89 %, « partielles » ; moins de 60 %, « Peu de données disponibles », et le pays ne peut pas entrer dans ton top 3. Le détail du badge montre combien de ces valeurs viennent de chaque niveau de preuve. Les bonus de la carte et des langues n’y comptent pas.</li>
          <li id="nouveaux-pays">Huit pays ont été ajoutés le 17 novembre 2026 (Autriche, Pérou, Uruguay, Thaïlande, Vietnam, Inde, Côte d’Ivoire, Sénégal), avec les mêmes sources et les mêmes règles que les autres. Ce qui manque reste « à vérifier » : l’emploi par secteur, « Notre avis » (anglais au travail, culture au travail, taille des villes) et les témoignages. Pour ne pas déplacer les autres pays, les seuils restent ceux calculés sur les 30 premiers. Le niveau de vigilance de la capitale vient de France Diplomatie. Échelle de vigilance de France Diplomatie : vert, vigilance normale ; jaune, vigilance renforcée ; orange, déconseillé sauf raison impérative ; rouge, formellement déconseillé. Les Français inscrits de tous les pays viennent du Rapport du Gouvernement 2025 (au 31 décembre 2025), sauf Hong Kong (pas de ligne à part) et Taïwan (population inconnue de la Banque mondiale) : « à vérifier ».</li>
        </ul>
      </section>

      <section id="le-pays-surprise" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Le pays surprise</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>D’abord, un pays auquel tu n’avais pas pensé : hors de ta carte du début, hors de ton top 3 mais dans tes 8 premiers, qui va dans ton sens (4 ou 5 sur 5) sur tes 3 premiers critères (sur tous si tu en as choisi moins). Il apparaît dans environ un parcours sur cinq : sinon, ce ne serait plus une surprise. La carte dit lesquels (« Tu ne l’avais pas coché sur ta carte, mais il colle à 3 de tes priorités »). S’il y en a plusieurs, celui qui colle au plus de priorités, puis le mieux classé. Il est montré juste sous ton top 3.</li>
          <li>Sinon, un pays qu’un seul de tes choix fait reculer, selon les règles ci-dessous.</li>
          <li>On cherche un pays qu’une seule de tes préférences fait reculer : une de tes limites « Rédhibitoire » (la seule qui touche ce pays), ou une réponse de goût : « Je préfère pouvoir changer d’employeur librement » et « Je garde ces soirées pour moi » (langue à apprendre).</li>
          <li>On recalcule le score du pays sans cette seule préférence (pour une limite : « Il t’est accessible » sans cet obstacle).</li>
          <li>Il n’apparaît que si, sans cette préférence, son score l’aurait placé n° 1 ou n° 2 de ton classement (au moins le score de ton n° 2). Avant, il suffisait d’égaler ton n° 3 ou 75 % : il apparaissait dans un profil sur deux, ce n’était plus une surprise.</li>
          <li>Jamais pour une règle légale (ton âge, ta nationalité), ni pour le budget, ni pour un pays déjà dans ton top 3. S’il te manquerait de l’argent pour ce pays, la carte le dit.</li>
          <li>« Le remonter » le fait revenir dans ton classement, sans la limite ni la pénalité.</li>
        </ul>
      </section>

      <section id="quatre-sortes-de-sources" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Quatre sortes de sources</h2>
        <ul className="mt-3 space-y-3">
          <li><Type type="officiel" /> Un site d’État ou d’organisme public (France Diplomatie, Service-Public, GOV.UK…).</li>
          <li><Type type="donnee-ouverte" /> Une base de données publique, libre de réutilisation : Banque mondiale, OCDE, Organisation internationale du travail (OIT), Open-Meteo.</li>
          <li><Type type="notre-avis" /> Un jugement de la rédaction, justifié par écrit. Il reste discutable : la justification est affichée pour que tu puisses juger par toi-même.</li>
          <li><Type type="temoignages" /> Une tendance tirée de guides d’expatriation et de témoignages. Elle sert pour deux mesures de la culture au travail : la prise de décision, et le lien entre vie pro et vie perso.</li>
        </ul>
        <div id="temoignages" className="mt-4 scroll-mt-4 rounded-2xl border border-bord bg-carte p-4">
          <h3 className="font-semibold">Comment on a établi les notes « Témoignages »</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Chaque note s’appuie sur au moins deux sources qui disent la même chose : guides d’expatriation, articles de presse, récits de Français qui travaillent sur place, forums.</li>
            <li>Pas de clichés : une idée reçue que personne ne décrit concrètement ne compte pas. Quand les sources se contredisent, la note est au milieu de l’échelle et le résumé le dit.</li>
            <li>Toutes les sources sont listées dans la pastille, avec un lien. Le résumé est reformulé : aucun texte n’est copié.</li>
            <li>Chaque note a une confiance. « Bonne » : les sources sont nombreuses et vont dans le même sens. « Moyenne » : peu de sources, des avis partagés, ou des sources anciennes. Une note de confiance moyenne compte comme les autres dans le calcul, mais sa pastille l’indique.</li>
            <li>Sans assez de sources concordantes, la note reste « À vérifier » et ne compte pas.</li>
          </ul>
          <p className="mt-3 font-medium">Les limites</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Ce sont des tendances générales, à l’échelle d’un pays. Une start-up et une grande banque du même pays peuvent fonctionner tout à fait autrement : ton entreprise peut être très différente.</li>
            <li>Les témoignages viennent surtout d’expatriés, souvent dans de grandes villes et dans des entreprises internationales.</li>
            <li>Ce n’est pas une mesure officielle : aucune enquête publique et réutilisable ne compare ces deux points dans tous ces pays.</li>
          </ul>
        </div>
        <div id="annees" className="mt-4 scroll-mt-4 rounded-2xl border border-bord bg-carte p-4">
          <h3 className="font-semibold">Des années comparables, et la France comme repère</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Chaque fenêtre de preuve donne l’année de la donnée quand elle est connue.</li>
            <li id="salaire">Salaire : le salaire annuel moyen d’un salarié à temps plein, toute l’économie, de l’OCDE (série « Average annual wages », lue le 20 novembre 2026 ; copie dans data/oecd-average-annual-wages.csv). Unité : dollars à parité de pouvoir d’achat (USD PPA), à prix constants de 2025 : des dollars « à pouvoir d’achat égal », qui tiennent compte des prix de chaque pays, et une même base de prix pour toutes les années. Dernière année disponible : 2025 (2024 pour la Colombie, 2023 pour le Chili). Seuils : quintiles des 23 pays de l’OCDE du site, arrondis à 500 $ : 51 500, 61 500, 72 500 et 79 500 $. Pays hors OCDE : le salaire mensuel moyen de l’ensemble des salariés de l’Organisation internationale du travail (ILOSTAT, indicateur EAR_EMTA_SEX_CUR_NB_A, CC BY 4.0), seulement s’il est en dollars à parité de pouvoir d’achat et daté de 2019 ou après, multiplié par 12 et noté avec les mêmes seuils (script scripts/salaire-oit.mjs). Ce n’est pas le même concept (temps partiel compris, prix courants) : ces pays sont marqués « source différente, comparaison approximative ». Onze pays en ont un (Argentine, Brésil, Chine, Singapour, Pérou, Uruguay, Thaïlande, Vietnam, Inde, Côte d’Ivoire, Sénégal) ; Taïwan et le Maroc n’ont pas de chiffre, Hong Kong (2016) et les Émirats (2009) sont trop anciens : « à vérifier ». La part qui reste après impôts (OCDE, Taxing Wages 2026) est affichée, sans entrer dans le score.</li>
            <li id="vie">Indemnité VIE : pour le projet « Stage ou VIE », le score utilise l’indemnité mensuelle du pays à la place du salaire moyen. C’est le barème officiel en vigueur depuis le 1er octobre 2026 (Journal officiel) : une part fixe de 772,87 € (service-public.gouv.fr) et une indemnité supplémentaire qui suit le barème des VIA (arrêté du 18 décembre 2025), sauf pour les pays dérogatoires (arrêté du 23 décembre 2025 : Corée du Sud, Émirats arabes unis, Espagne, États-Unis hors New York, Japon, Tunisie), ajustée par les arrêtés du 9 mars, du 10 juin et du 15 septembre 2026. Elle est révisée chaque trimestre : le site part de la base du 1er janvier 2026, applique le taux de chaque trimestre (avril, juillet, octobre) avec un arrondi au centime, et vérifie qu’il retrouve les montants du Journal officiel à un centime près (scripts/vie.mjs). On affiche le montant du Journal officiel ; le calcul sert pour les villes sans montant publié (Stavanger, autres villes de Suisse et de Chine) et réduite de 20 % si l’entreprise te loge. On prend la ville la plus probable d’un VIE (Londres, New York, Sydney, Tokyo, Berlin, Zurich, Vancouver, Shanghai, São Paulo, Bombay, Dubaï ; sinon le montant du pays) ; les autres villes sont dans le détail. Seuils : quintiles des 30 pays de la version 1, arrondis à 50 € : 2 650, 2 900, 3 200 et 3 550 € par mois. La liste des destinations du VIE vient de Business France (lue le 17 novembre 2026).</li>
            <li id="secteur">Ton secteur : la part des emplois du pays dans ton secteur (Organisation internationale du travail, ILOSTAT, emploi par activité économique, CITI rév. 4, CC BY 4.0), dernière année disponible, à condition qu’elle soit 2019 ou plus récente. Seize familles : finance et banque = section K ; conseil et audit = M ; ingénierie et industrie = C ; tech et data = J ; marketing et commerce = G ; santé = Q ; hôtellerie et tourisme = I ; enseignement et recherche = P ; agriculture = A ; énergie, eau et environnement = D et E ; bâtiment = F ; transport et logistique = H ; immobilier = L ; administration et service public = O ; culture, arts et sport = R ; RH et services aux entreprises = N. Note de 1 à 5 selon le rapport entre la part du pays et la médiane des pays notés : moins de 0,7 → 1 ; moins de 0,9 → 2 ; moins de 1,1 → 3 ; moins de 1,3 → 4 ; 1,3 ou plus → 5. La France est donnée pour comparer. Le Canada (qui publie avec sa propre nomenclature), la Nouvelle-Zélande (2015), Hong Kong (2009), la Chine et le Maroc : « À vérifier ». Si moins de 30 pays sur 38 ont une donnée pour ton secteur, il n’agit pas sur le score et le site le dit. Il compte quand tu choisis le critère « Évoluer dans mon secteur », un peu (0,5) si tu pars d’abord pour ta carrière, ou à moitié (0,5) si tu vises une grande ville où ton secteur est concentré ; sous chaque pays du top 3, une ligne « Ton secteur » dit sa part. C’est le poids du secteur dans l’emploi, pas le nombre d’offres ouvertes.</li>
            <li id="depaysement">Dépaysement : l’inverse exact de la proximité, sans nouvelle donnée. Pour chaque pays, on prend (6 − la note du temps de vol) et (6 − la note du décalage horaire), puis leur moyenne. Un pays très proche de Paris a 1, un pays à l’autre bout du monde a 5. Il compte si tu choisis le critère « Vivre un vrai dépaysement », un peu (0,5) si tu pars d’abord pour l’aventure ou si ton scénario idéal est « Des petits boulots et beaucoup de voyages ». Ainsi, partir loin peut compter autant que rester proche.</li>
            <li>La France n’est pas classée. Quand la même source donne sa valeur, on l’affiche à côté (« France : … ») pour que tu compares à ce que tu connais. Le niveau des prix est déjà calculé par rapport à la France, et la distance ou le climat dépendent d’une ville : pas de valeur France pour eux.</li>
          </ul>
          <p className="mt-3 font-medium">Années des données, mesure par mesure</p>
          <ul className="mt-2 space-y-1 text-sm">
            {anneesParMesure().map((x) => (
              <li key={x.id}>
                {x.nom} : {x.min === x.max ? x.min : `de ${x.min} à ${x.max}`}
                {x.ecart > 2 && <span className="text-gris"> (plus de 2 ans d’écart entre pays : l’année est dite dans chaque preuve)</span>}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-sm text-gris">Dernière collecte des données : {dateFr(dateDonnees)}. Deux pays voisins dans le classement, à 5 points d’écart ou moins, sont à égalité. Un groupe d’égalité est une chaîne : chaque pays est à 5 points ou moins de son voisin. « À égalité avec… » cite le voisin le plus proche, avec son rang s’il est hors de ton top 3.</p>
      </section>

      {familles.map((f) => (
        <section key={f} id={`famille-${f}`} className="mt-8 scroll-mt-6">
          <h2 className="text-xl font-semibold">Famille {NOMS_FAMILLES[f]}</h2>
          <div className="mt-3 space-y-4">
            {criteres.filter((c) => c.famille === f).map((c) => (
              <article key={c.id} className="rounded-3xl border border-bord bg-carte p-5">
                <h3 className="font-semibold">{c.numero}. {c.nom} <Type type={c.type} /></h3>
                <p className="mt-1 text-gris">{c.definition}</p>
                {c.role === "badge" && c.echelle && (
                  <p className="mt-2 text-sm"><span className="font-medium">Ce qu’on regarde : </span>{c.echelle.join(" · ")}. Importance : aucune dans le pourcentage, cela donne le badge.</p>
                )}
                {c.mesures.map((m) => (
                  <div key={m.id} className="mt-3 text-sm">
                    <p className="font-medium"><AvecDefinitions texte={m.nom} />{m.sens === "position" ? " (une position, ni bonne ni mauvaise)" : ""}</p>
                    <p className="text-gris">Les 5 niveaux, du plus bas au plus haut : {m.echelle.join(" · ")}.</p>
                    {m.regle && <p className="text-gris">Règle : {m.regle}</p>}
                    <p className="text-gris">
                      {paysCouverts(m.id) > 0
                        ? `Pays couverts : ${paysCouverts(m.id)} sur ${pays.length}.`
                        : "Pas encore de donnée vérifiée : cette mesure ne compte pas pour l’instant."}
                    </p>
                  </div>
                ))}
                <p className="mt-3 text-sm">
                  <span className="font-medium">Sources : </span>
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

      <section id="les-envies-et-leur" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Les critères</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {quiz.envies.map((p) => <li key={p.id}>{p.label} : {p.mesures.length === 0 ? "pas encore de donnée pays (portrait seulement)" : p.mesures.filter((m) => mesures[m]).map((m) => `${mesures[m].nom} (${paysCouverts(m)} pays sur 38${mesureClassante(m) ? "" : ", portrait seulement"})`).join(" et ") || "la part des emplois de ton secteur (16 familles)"}.</li>)}
        </ul>
      </section>

      <section id="tous-les-dilemmes-et" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Tous les dilemmes et leur effet</h2>
        <ul className="mt-3 space-y-3">
          {quiz.dilemmes.map((d) => (
            <li key={d.id} className="rounded-2xl border border-bord bg-carte p-4 text-sm">
              <p className="text-xs font-medium tracking-wide text-gris uppercase">{d.theme}</p>
              <p className="text-base font-medium">{d.titre}{d.echelle ? " (en échelle : 4 réponses)" : ""}</p>
              <ul className="mt-2 space-y-1 text-gris">
                {d.options.map((o, i) => <li key={o.id}>{["A", "B", "C"][i]} : {effet(o)}.</li>)}
              </ul>
              <p className="mt-2 font-medium">{d.scenes.length > 1 ? `Ses ${d.scenes.length} scènes` : "Sa scène"}</p>
              <ul className="mt-1 space-y-2">
                {d.scenes.map((sc) => (
                  <li key={sc.id}>
                    <span className="font-medium">{sc.titre}.</span> {sc.texte}
                    <span className="block text-gris">{sc.options.map((o, i) => `${["A", "B", "C"][i]}. ${o.texte} (+ ${o.plus} − ${o.moins})`).join(" ")}</span>
                  </li>
                ))}
              </ul>
              {d.regleAffichage && <p className="mt-1 text-gris">Règle d’affichage : {d.regleAffichage}</p>}
              {!dilemmeActif(d) && <p className="mt-1 font-medium">Pas encore posé : sa mesure n’est pas assez renseignée (moins de {Math.round(SEUIL_DILEMME * 100)} % des pays).</p>}
            </li>
          ))}
        </ul>
      </section>

      <section id="a-verifier" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Ce qui reste à vérifier</h2>
        <p className="mt-2 text-gris">Liste tirée des données elles-mêmes. Chacun de ces points est marqué « à vérifier » dans le site : jamais une valeur ferme. Une donnée « à vérifier » ne compte pas dans « Données disponibles ».</p>
        {aVerifierParCategorie().map(([cat, points]) => (
          <details key={cat} className="mt-3 rounded-2xl border border-bord bg-carte">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">{cat} ({points.length})</summary>
            <ul className="list-disc space-y-1 px-4 pb-3 pl-9 text-sm">
              {points.map((x) => <li key={x.pays + x.detail}><span className="font-medium">{x.pays}</span> : {x.detail}</li>)}
            </ul>
          </details>
        ))}
      </section>

      <section id="toutes-les-sources" className="mt-8 scroll-mt-6">
        <h2 className="text-xl font-semibold">Toutes les sources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(sources).map(([id, s]) => (
            <li key={id}>
              <Type type={s.type} />{" "}
              {s.url.startsWith("http") ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-lien underline">{s.nom}</a> : s.nom}. Licence : {s.licence}.
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gris">Licence à surveiller : les données de l’OMS (manger sainement) sont réutilisables seulement pour un usage non commercial (CC BY-NC-SA 3.0 IGO). Si le site devenait payant, il faudrait les retirer. Pas encore de mesure « vie active et sportive » : la part d’adultes à l’activité physique insuffisante (OMS) n’était pas téléchargeable depuis nos outils. Sources écartées parce que leur licence ne permet pas la réutilisation : Numbeo, EF EPI, Hofstede.</p>
      </section>

      <p className="mt-10 text-sm text-gris">Code sous licence MIT, contenu sous licence CC BY-SA 4.0.</p>
      <PiedDePage />
      </div>
    </main>
  );
}
