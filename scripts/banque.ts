// Écrit docs/quiz-v2-banque.md : la banque v2, élément par élément (fiches), ce qui a été écarté et pourquoi,
// et le nombre d'écrans réel des 6 profils fixes. Tout est recalculé depuis content/ et le moteur.
// Usage : npm run banque
import fs from "node:fs";
import { quiz, trouverElement } from "@/lib/donnees";
import { itemsBanque, type Item, type TypeItem } from "@/lib/banque";
import { calculer } from "@/lib/moteur";
import { hasard, parcoursAuHasard } from "./hasard";
import { PROFILS_FIXES, repondeurFixe } from "./profils";

const items = itemsBanque();
const L: string[] = [];
const e = (t = "") => L.push(t);
const cellule = (t: string) => t.replace(/\|/g, "/").replace(/\n/g, " ");
const compte = (f: (x: Item) => boolean) => items.filter(f).length;

e("# La banque du quiz v2 (prompt 6)");
e("");
e("Générée par `npm run banque` depuis `content/quiz.json`, `content/scores.json` et le moteur : la couverture des données et le type de chaque élément sont recalculés, jamais écrits à la main.");
e("");
e("**Source des contenus.** Les notes `docs/quiz-v2-notes.md` et le point d’étape (pages 5 à 7) n’étaient pas dans le dépôt ni dans la session : la banque suit la liste détaillée du prompt 6 (motivation et sa relance, projet, scénario idéal, seul / à deux / en famille, frise de durée, 16 secteurs, activités, enveloppe de budget, 25 critères en trois temps, limites en 5 familles et limites conditionnelles, 16 valeurs, nouveaux formats). À relire avec les notes quand elles seront ajoutées.");
e("");
e("## En bref");
e("");
const TYPES: TypeItem[] = ["Classement", "Portrait", "Accès"];
e(`- **${items.length} éléments** sur ${quiz.elements.length} écrans possibles (un écran peut porter plusieurs éléments : les 25 critères sont 25 cartes d’un écran).`);
e(`- Par type : ${TYPES.map((t) => `${t} ${compte((x) => x.type === t)}`).join(" ; ")}.`);
e("  - **Classement** : bouge « Il te ressemble » (une donnée pays sur au moins 30 pays sur 38).");
e("  - **Accès** : bouge « Il t’est accessible » (porte d’entrée, budget, durée, famille, limites).");
e("  - **Portrait** : aucune donnée pays sur 30 pays au moins (ou une licence qui interdit de transformer la note) : la réponse enrichit le portrait, et l’écran le dit (« Pourquoi on te demande ça ? », mention sous la carte, phrase du portrait).");
e(`- Par chapitre : ${quiz.chapitres.map((c) => `${c.numero}. ${c.titre} ${compte((x) => x.chapitre === c.numero)}`).join(" ; ")}.`);
const formats = [...new Set(items.map((x) => x.format))];
e(`- Par format : ${formats.map((f) => `${f} ${compte((x) => x.format === f)}`).join(" ; ")}.`);
e("- Règle des 30 pays : un élément sans donnée pays couvrant au moins 30 pays sur 38 ne bouge pas le classement. Le salaire moyen (OCDE, 23 pays) est dans ce cas, sauf pour un VIE (indemnité VIE, 36 pays) ; la prise de décision (28) et vie pro et vie perso (26) aussi.");
e("");
e("## Ce qui a été fusionné ou écarté, et pourquoi");
e("");
e("### Questions fusionnées (elles disaient la même chose)");
e("");
e("- **Salaire** : « Ton équilibre idéal » (curseur temps libre ou salaire) disait la même chose que le dilemme « Salaire ou temps libre » : on garde le dilemme (3 scènes, pas de chiffre d’importance affiché). « Salaire ou coût de la vie » devient « Deux offres d’emploi », suivi de sa relance « Et si… l’écart changeait ? ».");
e("- **Langues** : « Vivre dans une langue inconnue » et « Apprendre une nouvelle langue » posaient la même question : on garde « Apprendre une nouvelle langue ». La langue à pratiquer passe par la motivation (« Apprendre ou pratiquer une langue », puis « Laquelle ? »).");
e("- **Retour en France, durée, trois horizons** : « Dans 5 ans… » (carrière), la durée et les trois horizons tiennent dans une seule frise : la durée, puis « Et après ? » (rentrer, rester si je me plais, repartir ailleurs).");
e("- **Nationalité** : « As-tu une autre nationalité ? » et « Laquelle ? » ne font plus qu’une question.");
e("- **Envies et classement** : les 10 envies et leur classement par glisser deviennent 25 critères en trois temps (5 au plus, le plus dur à sacrifier, ce qui passe au second plan), plus « Quel avantage te ferait changer d’avis ? ».");
e("- **Activités et phrases à glisser** : les 15 phrases (souvent les mêmes sujets que les dilemmes) laissent la place à 5 activités du week-end, au même format.");
e("");
e("### Éléments de la v1 retirés");
e("");
e("- Dilemmes « Douceur ou saisons marquées », « Air pur ou grande métropole », « Couverture publique ou assurance privée », « Cuisine maison ou repas rapides », « Près ou loin de la France », « Grande ville ou nature », « Sécurité avant tout » : la même chose est dite par un critère (climat doux, air pur, santé, manger sainement, proche de la France, grande ville ou nature, sécurité), une limite (vigilance, assurance privée) ou les ambiances.");
e("- « Pendant ton PVT » (petits boulots ou voyage) : surtout une phrase de portrait, couverte par le scénario idéal « Des petits boulots et beaucoup de voyages ».");
e("- L’écran Valeurs à cocher : remplacé par le tri en zones (16 valeurs).");
e("- Limites en double : « Un air pollué » (le critère « Un air pur » le dit), « Un pays instable » (la valeur « Un pays politiquement stable »), « Plus de 6 h de décalage » (le seuil de vol le couvre).");
e("");
e("### Formats proposés au point d’étape");
e("");
e("Gardés :");
e("- **Duel de valeurs** : un dilemme à deux options (« Tes valeurs ou ton porte-monnaie ») ; il mesure ce qu’on accepte de payer pour une valeur.");
e("- **Deux offres d’emploi puis « Et si… »** : la relance dit si le choix tient quand l’autre option devient plus tentante (une réponse « Un peu » confirmée compte pleinement).");
e("- **Test à l’aveugle** : trois pays de ton top 10 sans leur nom, quatre faits chacun ; le choix compte un peu (importance 0,5) et le nom est montré ensuite (idée « Blind test » du journal).");
e("- **Tri en 4 zones** : Indispensable, Un vrai plus, Peu importe, et « non rangée » (aucune préférence) pour les valeurs : il donne le niveau d’exigence demandé.");
e("- **Seuil** : « au-delà de combien d’heures de vol », « en dessous de quelle température en janvier » : une limite chiffrée, plus précise qu’une situation toute faite.");
e("- **Frise** (durée) et **enveloppe** (budget au curseur, avec les sommes demandées par les PVT).");
e("");
e("Écartés :");
e("- **Distribution de points** : même information que les critères en trois temps (ce qui compte le plus et le moins), avec un calcul mental en plus sur téléphone.");
e("- **Pyramide** : un classement déguisé (1, 2, 3 étages) ; les trois temps donnent l’essentiel en deux touchers.");
e("- **Pays idéal à assembler** : chaque pièce (climat, ville, langue…) est déjà mesurée par un critère, une ambiance ou un dilemme ; un écran de plus sans information nouvelle.");
e("- **Trois horizons** : fusionnés dans la frise (durée, puis « Et après ? »).");
e("");
e("## Nombre d’écrans réel des 6 profils fixes");
e("");
// Secondes par écran, selon le format (estimation pour un téléphone, à mesurer avec de vrais testeurs).
const SECONDES: Record<string, number> = { "choix-cartes": 10, dilemme: 15, thermometre: 6, "carte-monde": 30, swipe: 25, ambiances: 12, "tri-limites": 12, timeline: 12, enveloppe: 10, seuil: 12, "tri-zones": 50, "blind-test": 30, curseur: 10, classement: 20 };
e("| Profil | Écrans | Durée estimée | Top 3 (score ; ressemble / accessible) |");
e("| --- | --- | --- | --- |");
const durees: number[] = [];
for (const p of PROFILS_FIXES) {
  const etat = parcoursAuHasard(hasard(p.graine * 1000 + 7), { passer: 0, repondeur: repondeurFixe(p) });
  const secondes = etat.ordre.reduce((t, id) => t + (SECONDES[trouverElement(id)!.type] ?? 12), 0) + 4 * 4 + 60; // 4 écrans d'ouverture, écran final, intuition, portrait
  durees.push(secondes);
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  e(`| ${cellule(p.nom)} | ${etat.ordre.length} | ${Math.round(secondes / 60)} min | ${top.map((l) => `${l.pays.nom} ${Math.round(l.score)} (${Math.round(l.ressemble)} / ${l.acces})`).join(", ")} |`);
}
e("");
e("Durée estimée : secondes par écran selon le format (cartes 10 s, dilemme 15 s, tri des valeurs 50 s…), plus les écrans d’ouverture, l’écran final, l’intuition et le portrait. À mesurer avec de vrais testeurs. Les profils répondent « Passer » à ce qu’ils ne disent pas : un vrai parcours prend un peu plus.");
e("");
for (const c of quiz.chapitres) {
  e(`## Chapitre ${c.numero} : ${c.titre}${c.adaptatif ? ` (adaptatif, ${c.min} à ${c.max} écrans)` : ""}`);
  e("");
  e("| Identifiant | Élément | Format | Type | Donnée pays (indicateur, fichier) | Effet exact | Condition d’apparition | Pourquoi on te demande ça ? |");
  e("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const x of items.filter((y) => y.chapitre === c.numero)) e(`| \`${x.id}\` | ${cellule(x.texte)} | ${x.format} | ${x.type} | ${cellule(x.donnee)} | ${cellule(x.effet)} | ${cellule(x.condition)} | ${cellule(x.pourquoi)} |`);
  e("");
}
fs.writeFileSync("docs/quiz-v2-banque.md", L.join("\n") + "\n");
console.log(`docs/quiz-v2-banque.md écrit : ${items.length} éléments (${TYPES.map((t) => `${t} ${compte((x) => x.type === t)}`).join(", ")}) ; profils fixes : ${durees.map((s) => Math.round(s / 60)).join(", ")} min.`);
