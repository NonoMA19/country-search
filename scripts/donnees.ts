// Écrit data/a-verifier.md (tout ce qui reste « à vérifier », tiré des données)
// et data/donnees-manquantes.md (pays écartés du top 3 par la règle des 3 premières envies, par donnée manquante).
// Usage : npm run donnees   (ou : npm run donnees -- 1000 pour moins de parcours)
import fs from "node:fs";
import path from "node:path";
import { calculer, mesuresPrincipales, topSansRegle, completudePays } from "@/lib/moteur";
import { mesures } from "@/lib/donnees";
import { pays } from "@/lib/pays";
import { aVerifierParCategorie } from "@/lib/averifier";
import { hasard, parcoursAuHasard } from "./hasard";

const NB = Number(process.argv[2] ?? 5000);
const DOSSIER = path.join(process.cwd(), "data");
fs.mkdirSync(DOSSIER, { recursive: true });
const date = new Date().toISOString().slice(0, 10);

// ---------- data/a-verifier.md ----------
{
  const lignes = [`# Ce qui reste « à vérifier »`, ``, `Liste tirée des données le ${date} (\`npm run donnees\`). Chaque point apparaît « à vérifier » dans le site et dans /methode, jamais comme une valeur ferme.`, ``];
  for (const [cat, points] of aVerifierParCategorie()) {
    lignes.push(`## ${cat} (${points.length})`, ``);
    for (const p of points) lignes.push(`- **${p.pays}** : ${p.detail.replace(/ /g, " ")}`);
    lignes.push(``);
  }
  fs.writeFileSync(path.join(DOSSIER, "a-verifier.md"), lignes.join("\n"));
}

// ---------- data/donnees-manquantes.md ----------
// La donnée précise à collecter, et la source probable (à confirmer), pour chaque mesure qui écarte des pays.
const A_COLLECTER: Record<string, { donnee: string; source: string }> = {
  heures: { donnee: "Heures réellement travaillées par semaine (moyenne, tous salariés)", source: "OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc)" },
  salaire: { donnee: "Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays", source: "OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente" },
  securite: { donnee: "Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente", source: "ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5)" },
  francais: { donnee: "Français inscrits au registre consulaire", source: "Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale" },
  emploi: { donnee: "Taux de chômage des 15-24 ans", source: "OIT, estimations modélisées (Banque mondiale SL.UEM.1524.ZS)" },
  prix: { donnee: "Niveau des prix (PPA ÷ taux de change)", source: "Banque mondiale (PA.NUS.PRVT.PP, PA.NUS.FCRF)" },
};
const aCollecter = (m: string) => A_COLLECTER[m] ?? (m.startsWith("secteur-") ? { donnee: "Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente", source: "OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A)" } : { donnee: mesures[m]?.nom ?? m, source: "voir /methode" });

const r = hasard(20261115);
const matrice: Record<string, Record<string, number>> = {}; // pays → mesure → parcours où il est écarté
const ecartes: Record<string, number> = {};
let change = 0;
for (let i = 0; i < NB; i++) {
  const etat = parcoursAuHasard(r);
  const lignes = calculer(etat);
  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  const sans = topSansRegle(lignes);
  if (sans.map((l) => l.pays.id).join() !== top.map((l) => l.pays.id).join()) change++;
  const princ = mesuresPrincipales(etat);
  for (const l of sans) {
    if (top.some((t) => t.pays.id === l.pays.id) || !l.manquePrincipal.length) continue;
    ecartes[l.pays.id] = (ecartes[l.pays.id] ?? 0) + 1;
    for (const d of l.details) if (d.neutre && princ.includes(d.mesure)) (matrice[l.pays.id] ??= {})[d.mesure] = (matrice[l.pays.id]?.[d.mesure] ?? 0) + 1;
  }
}
const nomPays = (id: string) => pays.find((p) => p.id === id)?.nom ?? id;
const court = (m: string) => mesures[m]?.court ?? m;
const tries = Object.entries(ecartes).sort((a, b) => b[1] - a[1]);
const colonnes = [...new Set(Object.values(matrice).flatMap((x) => Object.keys(x)))].sort((a, b) =>
  Object.values(matrice).reduce((t, x) => t + (x[b] ?? 0), 0) - Object.values(matrice).reduce((t, x) => t + (x[a] ?? 0), 0));
const pct = (n: number) => `${((100 * n) / NB).toFixed(1).replace(".", ",")} %`;
const md = [
  `# Données manquantes : ce qui écarte des pays du top 3`,
  ``,
  `Simulation de ${NB} parcours tirés au hasard (graine 20261115), le ${date} (\`npm run donnees\`).`,
  `Règle : un pays à qui il manque une donnée sur une des 3 premières envies de la personne ne peut pas entrer dans son top 3. C'est un filet de sécurité, pas une solution : la solution est de collecter la donnée.`,
  ``,
  `- Parcours dont le top 3 change à cause de la règle : **${change} sur ${NB} (${pct(change)})**.`,
  `- Impact d'un pays = nombre de parcours où il aurait été dans le top 3 sans la règle.`,
  ``,
  `## Matrice pays × donnée manquante (triée par impact)`,
  ``,
  `| Pays | Impact | Complétude du pays | ${colonnes.map(court).join(" | ")} |`,
  `| --- | --- | --- | ${colonnes.map(() => "---").join(" | ")} |`,
  ...tries.map(([id, n]) => `| ${nomPays(id)} | ${n} (${pct(n)}) | ${Math.round(completudePays(id).part * 100)} % | ${colonnes.map((m) => matrice[id]?.[m] ?? "").join(" | ")} |`),
  ``,
  `## À collecter, pays par pays`,
  ``,
  ...tries.flatMap(([id]) => {
    const ms = Object.entries(matrice[id] ?? {}).sort((a, b) => b[1] - a[1]);
    return [`### ${nomPays(id)}`, ...ms.map(([m, k]) => `- **${court(m)}** (écarte le pays dans ${k} parcours) : ${aCollecter(m).donnee}. Source probable : ${aCollecter(m).source}.`), ``];
  }),
].join("\n").replace(/ /g, " ");
fs.writeFileSync(path.join(DOSSIER, "donnees-manquantes.md"), md);
// ---------- data/a-verifier-par-impact.md ----------
// Chaque point « à vérifier », classé par son effet sur le top 3 : le nombre de parcours simulés où le pays
// en est écarté à cause de cette donnée manquante (règle des 3 premières envies). Un visa, une procédure ou une
// vigilance ne changent pas le pourcentage : impact 0 sur le classement (mais utile à la personne).
{
  const MESURE: Record<string, (m: string) => boolean> = {
    "Salaire": (m) => m === "salaire", "Homicides (sécurité)": (m) => m === "securite", "Heures travaillées": (m) => m === "heures",
    "Français inscrits": (m) => m === "francais", "Emploi par secteur": (m) => m.startsWith("secteur-"),
  };
  const idDe = (nom: string) => pays.find((p) => p.nom === nom)?.id ?? nom;
  const points = aVerifierParCategorie().flatMap(([cat, ps]) => ps.map((p) => {
    const test = MESURE[cat];
    const impact = test ? Object.entries(matrice[idDe(p.pays)] ?? {}).filter(([m]) => test(m)).reduce((t, [, k]) => t + k, 0) : 0;
    return { ...p, cat, impact, classement: !!test };
  })).sort((a, b) => b.impact - a.impact || Number(b.classement) - Number(a.classement) || a.cat.localeCompare(b.cat, "fr"));
  const lignes2 = [
    `# Ce qui reste « à vérifier », classé par impact sur le top 3`, ``,
    `Simulation de ${NB} parcours tirés au hasard (graine 20261115), le ${date} (\`npm run donnees\`).`,
    `Impact = nombre de parcours où le pays aurait été dans le top 3 sans la règle des 3 premières envies, à cause de cette donnée manquante. « 0 (hors calcul) » : le point ne change pas le pourcentage (visa, procédure, vigilance), mais reste utile à la personne.`, ``,
    `| Impact | Pays | Sujet | Raison exacte |`, `| --- | --- | --- | --- |`,
    ...points.map((p) => `| ${p.classement ? `${p.impact} (${pct(p.impact)})` : "0 (hors calcul)"} | ${p.pays} | ${p.cat} | ${p.detail.replace(/\|/g, "/")} |`),
  ];
  fs.writeFileSync(path.join(DOSSIER, "a-verifier-par-impact.md"), lignes2.join("\n").replace(/ /g, " ") + "\n");
}
console.log(`data/a-verifier.md et data/donnees-manquantes.md écrits. Top 3 changé par la règle : ${pct(change)} ; pays écartés : ${tries.map(([id, n]) => `${nomPays(id)} ${n}`).join(", ")}.`);
