import type { Metadata } from "next";
import Link from "next/link";
import { LIBELLE_TYPE, criteres, dateDonnees, dateFr, europe, mesures, notes, preuveSource, quiz, sources, type OptionDilemme, type TypeSource } from "@/lib/donnees";
import Definition, { AvecDefinitions } from "@/components/Definition";
import Pastille from "@/components/Pastille";
import PiedDePage from "@/components/PiedDePage";
import { POIDS_OBJECTIF, SEUIL_DILEMME, dilemmeActif, paysCouverts } from "@/lib/moteur";
import { pays } from "@/lib/pays";

export const metadata: Metadata = {
  title: "La méthode | Country Search",
  description: "Comment Country Search calcule ton résultat : ce qu’on mesure, l’importance de chaque réponse, les sources et leurs limites.",
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

// Pour chaque mesure datée : la plus ancienne et la plus récente année parmi les notes vérifiées des 30 pays.
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

export default function Methode() {
  const familles = ["partir", "travailler", "vivre", "valeurs"];
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-lien underline">Accueil</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">La méthode</h1>
      <p className="mt-3 text-lg text-gris">Un simple calcul classe les pays. Aucune intelligence artificielle ne décide, et rien n’est inventé.</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Le calcul en 7 points</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Pour chaque chose qu’on mesure (le chômage des jeunes, l’hiver, la langue…), chaque pays reçoit une place sur une échelle à 5 niveaux. Le niveau le plus bas vaut 0 %, puis 25 %, 50 %, 75 % et 100 %.</li>
          <li>Seules tes réponses comptent. Un écran auquel tu réponds « Passer » ne change rien. La carte du début (« où pensais-tu partir ? ») ne compte jamais : on la garde pour la comparer à ton résultat.</li>
          <li>Tu choisis 5 envies, puis tu les ranges. Leur rang donne leur importance : n° 1 = 2 ; n° 2 = 1,75 ; n° 3 = 1,5 ; n° 4 = 1,25 ; n° 5 = 1,1. Une envie qui vise deux mesures (« Proche de la France » : temps de vol et décalage) partage son importance entre elles. Une option de dilemme, une phrase « Ça me correspond », une ambiance ou une limite « Je préfère éviter » compte simple (importance 1) ou à moitié (0,5). Le curseur « temps libre ou salaire » donne à chaque côté sa part, de 0 à 1, de façon continue : tout à gauche, le temps libre compte 1 et le salaire 0 ; au milieu, 0,5 chacun. Ton projet donne des poids de départ, plus légers (importance 0,5). Si plusieurs réponses visent la même mesure, on garde la plus grande importance, sans les additionner.</li>
          <li>Certaines mesures ne sont ni bonnes ni mauvaises : la hiérarchie, la façon de communiquer, la ponctualité, la prise de décision, le lien entre vie pro et vie perso, l’hiver, l’été. Pour elles, ton option fixe une position préférée. Un pays à cette position gagne 100 %, un niveau plus loin 75 %, deux niveaux 50 %, et ainsi de suite.</li>
          <li>Ton pourcentage = les points gagnés par le pays, divisés par les points possibles. Il mesure « ça te ressemble » avec les familles Travailler et Vivre (et les valeurs, si une réponse les vise : la stabilité, l’air pur).</li>
          <li>Une donnée « À vérifier » sur une de tes 5 envies compte pour une note neutre, 50 %, et la carte du pays le dit : un trou dans les données ne peut pas faire gagner un pays. Sur une autre réponse, elle est sautée : elle ne donne ni ne retire de points.</li>
          <li>Si un pays a une donnée vérifiée pour moins de 60 % de ce qui compte pour toi (on compte les mesures, une par une), il ne peut pas entrer dans ton top 3 : il reste dans la liste, sans pourcentage, avec la mention « pas assez de données ».</li>
        </ol>
        <p className="mt-3">La famille Partir (visa, âge, argent) n’entre pas dans le pourcentage. Elle donne un badge : Porte ouverte, Faisable avec conditions, Difficile ou Fermé à ton âge.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Un pays « Fermé à ton âge » ne peut pas entrer dans ton top 3 : il passe dans « Moins adaptés pour toi », avec la raison et son pourcentage inchangé. Un bouton permet de le remonter.</li>
          <li>Le budget ne fait jamais descendre un pays : on t’affiche seulement ce qu’il te manquerait. Tu choisis une tranche (moins de 2 000 €, de 2 000 à 5 000 €, de 5 000 à 10 000 €, plus de 10 000 €, ou « Je ne sais pas encore »). Si le haut de ta tranche est sous la somme demandée par un visa, on dit « il te manquerait au moins » la différence. Si la somme demandée tombe dans ta tranche, on dit « il pourrait te manquer jusqu’à » la différence avec le bas de ta tranche. Sans réponse, on donne seulement la somme demandée.</li>
          <li>Si tu déclares une autre nationalité, le badge devient « Porte ouverte grâce à ta nationalité » seulement dans les cas que nous avons vérifiés : la nationalité du pays lui-même (canadienne pour le Canada, américaine pour les États-Unis) et la nationalité irlandaise pour le Royaume-Uni. Le pourcentage ne change pas. Pour toute autre nationalité, ou pour les autres pays, le résultat dit clairement que ce cas n’est pas encore couvert.</li>
        </ul>
        <p className="mt-3">
          Europe sans visa : {europe.texte}
          <Pastille preuve={preuveSource("Inscription sur place", europe.inscription.texte, europe.inscription.source, europe.inscription.lien, europe.inscription.verifieLe)} contexte="l’inscription sur place en Europe" />
        </p>
        <p className="mt-3 text-sm text-gris">Touche un mot souligné en pointillé pour lire sa définition : <Definition cle="pvt" />, <Definition cle="vie" />.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Ton projet fixe les règles de départ</h2>
        <p className="mt-3">Le projet que tu choisis au début donne des poids de départ, avant même tes envies. « Je ne sais pas encore » n’en donne aucun. Ils sont légers : importance {nombre(POIDS_OBJECTIF)}, moins qu’une réponse de dilemme (importance 1).</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {Object.entries(quiz.objectifs).map(([id, o]) => <li key={id}>{o.explication}</li>)}
        </ul>
        <p className="mt-3">Tes réponses l’emportent. Si, dans un dilemme, tu choisis une autre option que celle qui visait une de ces mesures, son poids de départ disparaît. Exemple : tu pars pour une année d’aventure, mais au dilemme « Deux offres » tu choisis le meilleur salaire : la vie pas chère perd son poids de départ.</p>
        <p className="mt-3">Le badge de visa ne dépend pas de ce calcul : ton projet change seulement la porte d’entrée proposée (PVT, VIE ou visa de travail), comme avant.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Un exemple chiffré</h2>
        <p className="mt-3">Pour simplifier, deux envies seulement, de même importance (2) : le travail facile à trouver et un climat doux. Au dilemme « Ta vie en deux langues », tu choisis « Je veux gérer mon quotidien sans aide » (importance 1).</p>
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

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Comment les dilemmes sont choisis</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Un dilemme est une petite scène avec 2 options. Chaque option affiche son avantage (+) et son prix (−) : il n’y a pas de bonne réponse. Les montants et les durées des scènes sont des exemples, pas les chiffres d’un pays.</li>
          <li>Les dilemmes qui forment une échelle (salaire et coût de la vie, salaire et temps libre, emploi et salaire, distance, hiver, été, ville et nature, sécurité…) ont 4 réponses : « Plutôt A », « Un peu A », « Un peu B », « Plutôt B ». « Plutôt » donne l’effet complet de l’option (importance 1, ou sa position). « Un peu » en donne la moitié : importance 0,5, ou une position à mi-chemin entre celle de l’option et le milieu de l’échelle (exemple : la position 4 devient 3,5). Les dilemmes de culture au travail gardent 2 options : une réponse « entre les deux » n’apprendrait rien.</li>
          <li>Après tes envies, on regarde les 5 premiers pays de ton classement.</li>
          <li>On te pose le dilemme pour lequel ces 5 pays sont les plus différents. Une option qui ne ferait que redonner une importance déjà acquise (par une de tes envies, par exemple) ne compte pas : elle ne départagerait rien. C’est un calcul, pas une IA.</li>
          <li>Chaque dilemme mesure une seule chose, mais il a 3 scènes de la vie réelle (par exemple « Deux offres », « Le colocataire », « La sortie du vendredi » pour le salaire face au coût de la vie). Les 3 scènes ont exactement le même effet. Le site en tire une au hasard, et ne te repose jamais une scène que tu as déjà vue dans un parcours précédent (tant qu’il en reste). Le tirage dépend d’un nombre choisi au début de ton parcours : « Retour » et le rechargement de la page te montrent la même scène.</li>
          <li>Les 4 premiers dilemmes sont tirés au hasard parmi ceux qui départagent au moins 60 % autant que le meilleur. Deux personnes au profil proche n’ont donc pas les mêmes premières questions. Ensuite, on pose toujours le plus utile.</li>
          <li>Un dilemme n’est jamais posé si l’une de ses mesures est notée pour moins de {Math.round(SEUIL_DILEMME * 100)} % des pays.</li>
          <li>Le questionnaire a 5 chapitres. Les chapitres 1 (ton point de départ), 2 (tes envies) et 5 (tes limites) sont posés à tout le monde. Les chapitres 3 (ton travail) et 4 (ta vie) choisissent leurs écrans selon tes réponses, de 4 à 7 écrans chacun. À la fin, « Continuer pour affiner » propose d’autres écrans des chapitres 3 et 4.</li>
          <li>Sous chaque pays de ton top 3, les points sont rangés en trois catégories : Travailler, Vivre, Culture au travail. Par catégorie, au plus 2 points forts (notés 4 ou 5 sur 5 dans le sens de tes réponses) et 1 point faible (2,5 sur 5 ou moins). Seulement des points liés à tes réponses : une envie, ton projet, un dilemme ou un autre écran du quiz, une limite, ou un curseur « Et si… ? ». Une catégorie sans rien à dire n’est pas affichée. Deux pays n’ont jamais exactement la même phrase : le pays mieux classé la garde.</li>
          <li>Dans « Voir le détail », chaque critère est donné avec sa vraie valeur et un mot (« 1,6 h de vol · Très proche »), jamais avec un pourcentage. Les pourcentages restent pour le score global du pays.</li>
          <li>Si ton n°1 et ton n°2 sont à 5 points ou moins, tu peux les départager. On te pose seulement des dilemmes encore sans réponse dont une mesure sépare vraiment ces deux pays : au moins 2 niveaux d’écart sur l’échelle de 1 à 5, avec une donnée vérifiée des deux côtés. Une ligne te dit pourquoi (« On te pose cette question parce que l’Allemagne et la Belgique diffèrent surtout sur la ponctualité. »). Parmi eux, on choisit celui dont les options font le plus varier l’écart. Jusqu’à 5 questions, tant que l’écart reste de 5 points ou moins. Tes réponses comptent comme les autres. Si l’un passe devant, une phrase dit quelle réponse a fait la différence ; s’ils restent à égalité, on le dit, et on te montre la comparaison côte à côte. Cette comparaison ne refait aucun calcul : une ligne par critère qui compte pour toi (tes envies d’abord), la vraie valeur de chaque pays, et une barre qui va vers le pays qui gagne, plus longue si l’écart de note est grand. Si une donnée manque d’un côté, la ligne dit « Non comparable ». Une phrase dit qui gagne sur quoi, en tenant compte de l’importance de chaque critère.</li>
          <li>Avant ton résultat, « Ton portrait » reprend en quelques phrases ton projet, tes envies et tes réponses qui comptent le plus. Un écran passé n’y apparaît jamais. « Ce n’est pas moi » rouvre la question pour changer ta réponse.</li>
          <li>Aucune réponse de dilemme n’écarte un pays : seuls ton âge, le travail en anglais (si tu ne veux travailler qu’en français) et tes limites « Rédhibitoire » le font. Dans « Tes limites », 6 situations sur 8 te sont proposées (d’abord celles qui touchent le plus de pays parmi tes 10 premiers). « Aucun problème » ne change rien. « Je préfère éviter » est une pénalité d’importance 1 sur la mesure concernée. « Rédhibitoire » met les pays concernés dans « Moins adaptés pour toi », avec la raison et « Le remonter » : vivre hors d’Europe (pays hors d’Europe) ; apprendre une langue avec un autre alphabet (sauf si tu la parles) ; un visa qui dépend de ton employeur (note 1 ci-dessous) ; plus de 10 h de vol (temps de vol estimé) ; un hiver très froid (mois le plus froid sous −5 °C) ; une ville où il faut rester vigilant (10 homicides ou plus pour 100 000 habitants) ; ne travailler ni en français ni en anglais (anglais au travail noté 1 ou 2, sans français au travail) ; payer une assurance santé privée (couverture santé notée 1 ou 2). Une donnée manquante n’écarte jamais un pays. « Je préfère pouvoir changer d’employeur librement » est une pénalité (importance 1) : un pays où ton visa dépendrait d’un employeur, ou où ce lien n’est pas encore vérifié, reçoit la note 1 ; en partie lié, 3 ; sans visa lié (Europe sans visa, PVT ouvert à ton âge, ta nationalité, ou visa non lié), 5. Comme ce point dépend de ton âge et de ta nationalité, ce sont les seuls cas où ils changent ton pourcentage. Ne pas vouloir apprendre de langue est aussi une pénalité ; « Installé là-bas pour de bon » (carrière longue) la retire, sauf si tu l’as choisie toi-même dans tes limites. Un pays remonté à la main ne subit plus ces pénalités.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Les curseurs « Et si… ? »</h2>
        <p className="mt-3">Quatre curseurs, chacun sur un groupe de mesures : la distance avec la France (temps de vol, décalage horaire), le climat (hiver, été, climat doux), le salaire face au coût de la vie (salaire brut moyen en pouvoir d’achat, niveau des prix) et la culture au travail (hiérarchie, communication, ponctualité, prise de décision, vie pro et vie perso).</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Chaque curseur va de « Ne compte pas » (importance 0) à « Compte beaucoup » (importance 2, comme une envie n° 1), en passant par « Compte un peu » (0,5) et « Compte » (1).</li>
          <li>Il part de la valeur déduite de tes réponses : la plus forte importance qu’une seule de tes réponses donne à ce groupe. Exemple : l’envie « Proche de la France » classée n° 1 donne 2, l’option « 6 h de vol » donne 0,5.</li>
          <li>Quand tu le bouges, toutes les mesures du groupe sont multipliées par le même nombre (niveau choisi divisé par niveau déduit) : leurs importances relatives ne changent pas.</li>
          <li>Si aucune réponse ne visait le groupe, le curseur ajoute ses mesures « plus c’est haut, mieux c’est » : temps de vol et décalage, climat doux, salaire et niveau des prix. La culture au travail n’a pas de sens « meilleur » : sans réponse à un de ses dilemmes, son curseur reste bloqué.</li>
          <li>Le budget a son propre curseur. Il ne change jamais le classement : il dit seulement ce qu’il te manquerait.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Faisabilité et fiabilité</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Sous chaque pays de ton top 3, et dans le dossier du pays si tu as fait le quiz, trois listes courtes : les conditions remplies, celles à remplir (ou non remplies), et ce qui reste à vérifier, puis la prochaine étape avec le lien officiel. Elles viennent seulement de tes réponses (âge, budget, nationalité, projet) et des données sourcées des visas. On n’écrit jamais qu’un pays est « juridiquement accessible ».</li>
          <li>Si ton projet est « Stage ou VIE », un bloc « Le VIE pour toi » reprend les conditions officielles déjà vérifiées (âge à la candidature, âge au départ, durée), les confronte à ton âge et donne le lien vers les offres de Business France. La présence de missions dans chaque pays de ton top 3 reste « à vérifier » tant qu’elle n’est pas sourcée. La condition de nationalité n’est pas encore vérifiée, elle n’est donc pas affichée.</li>
          <li>Le badge de fiabilité compte la part de tes critères qui ont, pour ce pays, une donnée vérifiée par une source Officiel, Donnée ouverte ou Témoignages. 90 % ou plus : « Données complètes ». De 60 à 89 % : « Données partielles ». Moins de 60 % : « Peu de données vérifiées ».</li>
          <li>« Notre avis » ne compte pas dans ce badge : c’est un jugement de la rédaction, pas une donnée vérifiée. Il compte en revanche dans la règle des 60 % du calcul (point 7 plus haut) : un pays peut donc être dans ton top 3 avec « Peu de données vérifiées » si beaucoup de tes critères reposent sur notre avis (culture au travail, langue, taille des villes).</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Le pays surprise</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>On cherche un pays qu’une seule de tes préférences met de côté : une de tes limites « Rédhibitoire », qui écarte des pays, ou une réponse qui en fait reculer : « Je préfère pouvoir changer d’employeur librement » et « Je garde ces soirées pour moi » (langue à apprendre).</li>
          <li>Pour une réponse qui fait reculer des pays, on recalcule le score du pays sans cette seule réponse.</li>
          <li>Il n’apparaît que si, sans cette préférence, son score l’aurait placé n° 1 ou n° 2 de ton classement (au moins le score de ton n° 2). Avant, il suffisait d’égaler ton n° 3 ou 75 % : il apparaissait dans un profil sur deux, ce n’était plus une surprise.</li>
          <li>Jamais pour une règle légale (ton âge, ta nationalité), ni pour le budget, ni pour un pays déjà dans ton top 3. S’il te manquerait de l’argent pour ce pays, la carte le dit.</li>
          <li>« Le remonter » le fait revenir dans ton classement, sans l’écart ni la pénalité.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Quatre sortes de sources</h2>
        <ul className="mt-3 space-y-3">
          <li><Type type="officiel" /> Un site d’État ou d’organisme public (France Diplomatie, Service-Public, GOV.UK…).</li>
          <li><Type type="donnee-ouverte" /> Une base de données publique, libre de réutilisation : Banque mondiale, Organisation internationale du travail (OIT), Open-Meteo.</li>
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
            <li>Ce n’est pas une mesure officielle : aucune enquête publique et réutilisable ne compare ces deux points dans les 30 pays.</li>
          </ul>
        </div>
        <div id="annees" className="mt-4 scroll-mt-4 rounded-2xl border border-bord bg-carte p-4">
          <h3 className="font-semibold">Des années comparables, et la France comme repère</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Chaque fenêtre de preuve donne l’année de la donnée quand elle est connue.</li>
            <li>Salaire : un pays dont la donnée la plus récente s’écarte de plus d’un an de l’année médiane des 30 pays passe « À vérifier » et ne compte pas. Une moyenne de 2021 ne se compare pas à une moyenne de 2025. C’est un salaire brut moyen, avant impôts et cotisations, tous métiers confondus : ton salaire net dépendra de ton métier et des impôts du pays.</li>
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
        <section key={f} className="mt-8">
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

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Les envies et leur importance</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {quiz.envies.map((p) => <li key={p.id}>{p.label} : {p.mesures.filter((m) => mesures[m]).map((m) => mesures[m].nom).join(" et ") || "la part des emplois de ton secteur"}.</li>)}
        </ul>
      </section>

      <section className="mt-8">
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
        <p className="mt-4 text-sm text-gris">Licence à surveiller : les données de l’OMS (manger sainement) sont réutilisables seulement pour un usage non commercial (CC BY-NC-SA 3.0 IGO). Si le site devenait payant, il faudrait les retirer. Pas encore de mesure « vie active et sportive » : la part d’adultes à l’activité physique insuffisante (OMS) n’était pas téléchargeable depuis nos outils. Sources écartées parce que leur licence ne permet pas la réutilisation : Numbeo, EF EPI, Hofstede.</p>
      </section>

      <p className="mt-10 text-sm text-gris">Code sous licence MIT, contenu sous licence CC BY-SA 4.0.</p>
      <PiedDePage />
    </main>
  );
}
