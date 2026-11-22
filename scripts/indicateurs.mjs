// Construit data/indicators/*.csv (un fichier par indicateur, 38 pays) et data/couverture.md.
// Usage : node scripts/indicateurs.mjs
//
// Deux sortes de sources :
// 1. lues par script (fichier ou API officiels, téléchargés dans scripts/.cache/indicateurs, rien n'est recopié à la main) :
//    OMS (PM2,5 et couverture santé), NASA POWER, RSF (CSV officiel), Yale EPI (tableau officiel), V-Dem (republication
//    d'Our World in Data, identique à l'API officielle de V-Dem pour les 38 pays) ;
// 2. lues par des agents (pages ou fichiers non lisibles par script depuis la session) : les preuves sont gardées dans
//    data/indicators/lectures/*.json (valeur, URL, extrait mot pour mot, seconde lecture quand elle existe).
// Règles : jamais de valeur estimée ; une valeur absente reste vide, avec la raison ; une source dont la licence
// interdit la republication (Freedom House) ou dont la licence n'a pas pu être trouvée (WJP) n'a que des liens.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache", "indicateurs");
const SORTIE = path.join(RACINE, "data", "indicators");
const LECTURES = path.join(SORTIE, "lectures");
fs.mkdirSync(path.join(CACHE, "nasa"), { recursive: true });
const pays = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "pays.json"), "utf8"));
const scores = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "scores.json"), "utf8"));
const jour = (f) => fs.statSync(f).mtime.toISOString().slice(0, 10);

function telecharger(nom, url) {
  const f = path.join(CACHE, nom);
  if (!fs.existsSync(f)) execFileSync("curl", ["-sL", "--fail", "-m", "180", "-o", f, url]);
  return f;
}

const NIVEAU = {
  script: "Donnée officielle, lue par script",
  recoupee: "Lecture automatique, recoupée (deux agents indépendants, aucun écart)",
  auto: "Lecture automatique",
  lien: "Lien seulement (valeur non reproduite)",
};
const COLONNES = ["pays_id", "pays", "iso3", "valeur", "unite", "rang", "annee_donnee", "edition", "source", "url", "niveau_preuve", "lu_le", "licence", "remarque"];
const csv = (v) => (v === null || v === undefined ? "" : /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const indicateurs = [];

function ecrire(def, lignes) {
  const parId = Object.fromEntries(lignes.map((l) => [l.pays_id, l]));
  const rangees = pays.map((p) => ({ pays_id: p.id, pays: p.nom, iso3: p.iso3, unite: def.unite, edition: def.edition, source: def.source, licence: def.licence, ...(parId[p.id] ?? { remarque: def.absent?.(p) ?? "Pas de valeur dans la source." }) }));
  fs.writeFileSync(path.join(SORTIE, `${def.id}.csv`), [COLONNES.join(","), ...rangees.map((r) => COLONNES.map((c) => csv(r[c])).join(","))].join("\n") + "\n");
  indicateurs.push({ ...def, rangees });
}

// ---------- OMS, Global Health Observatory (API OData, fichier complet) ----------
function gho(code, filtre) {
  const f = telecharger(`${code}.json`, `https://ghoapi.azureedge.net/api/${code}`);
  const lignes = JSON.parse(fs.readFileSync(f, "utf8")).value.filter((r) => r.NumericValue !== null && filtre(r));
  const dernier = {};
  for (const r of lignes) if (!dernier[r.SpatialDim] || r.TimeDim > dernier[r.SpatialDim].TimeDim) dernier[r.SpatialDim] = r;
  return { dernier, lu: jour(f) };
}
{
  const { dernier, lu } = gho("SDGPM25", (r) => r.Dim1 === "RESIDENCEAREATYPE_TOTL");
  ecrire({
    id: "air-pm25-oms", titre: "Qualité de l'air : particules fines PM2,5", unite: "µg/m³, moyenne annuelle (plus bas = mieux)", edition: "Global Health Observatory, indicateur SDGPM25 (ODD 11.6.2)",
    source: "Organisation mondiale de la santé", licence: "CC BY-NC-SA 3.0 IGO : usage non commercial, en citant l'OMS", themes: "Qualité de l'air",
    absent: () => "Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).",
  }, pays.filter((p) => dernier[p.iso3]).map((p) => {
    const r = dernier[p.iso3];
    return { pays_id: p.id, valeur: Math.round(r.NumericValue * 100) / 100, annee_donnee: r.TimeDim, url: `https://ghoapi.azureedge.net/api/SDGPM25?$filter=SpatialDim eq '${p.iso3}' and Dim1 eq 'RESIDENCEAREATYPE_TOTL'`, niveau_preuve: NIVEAU.script, lu_le: lu, remarque: `Intervalle publié par l'OMS : ${r.Value}. Tout le pays (zones urbaines et rurales).` };
  }));
}
{
  const { dernier, lu } = gho("UHC_INDEX_REPORTED", () => true);
  ecrire({
    id: "sante-couverture-oms", titre: "Santé : indice de couverture des services de santé essentiels", unite: "indice de 0 à 100 (plus haut = mieux)", edition: "Global Health Observatory, indicateur UHC_INDEX_REPORTED (ODD 3.8.1)",
    source: "Organisation mondiale de la santé", licence: "CC BY-NC-SA 3.0 IGO : usage non commercial, en citant l'OMS", themes: "Santé",
    absent: () => "Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).",
  }, pays.filter((p) => dernier[p.iso3]).map((p) => {
    const r = dernier[p.iso3];
    return { pays_id: p.id, valeur: r.NumericValue, annee_donnee: r.TimeDim, url: `https://ghoapi.azureedge.net/api/UHC_INDEX_REPORTED?$filter=SpatialDim eq '${p.iso3}'`, niveau_preuve: NIVEAU.script, lu_le: lu, remarque: "" };
  }));
}

// ---------- RSF, Classement mondial de la liberté de la presse (CSV officiel) ----------
{
  const f = telecharger("rsf-2026.csv", "https://rsf.org/sites/default/files/import_classement/2026.csv");
  const lignes = fs.readFileSync(f, "latin1").trim().split(/\r?\n/).map((l) => l.split(";"));
  const ent = lignes[0];
  const I = (k) => ent.indexOf(k);
  const par = Object.fromEntries(lignes.slice(1).map((l) => [l[I("ISO")], l]));
  ecrire({
    id: "liberte-presse-rsf", titre: "Liberté de la presse (RSF)", unite: "score de 0 à 100 (plus haut = plus libre)", edition: "Classement mondial de la liberté de la presse 2026",
    source: "Reporters sans frontières", themes: "Libertés et presse",
    licence: "Creative Commons « Attribution – Pas de modification », usage commercial interdit (page de méthodologie 2026) : citer « Reporters sans frontières / RSF.org » ; valeur reproduite telle quelle, à ne pas transformer en note sans l'accord de RSF",
  }, pays.filter((p) => par[p.iso3]).map((p) => {
    const l = par[p.iso3];
    return { pays_id: p.id, valeur: Number(l[I("Score 2026")].replace(",", ".")), rang: Number(l[I("Rank")]), annee_donnee: 2026, url: "https://rsf.org/sites/default/files/import_classement/2026.csv", niveau_preuve: NIVEAU.script, lu_le: jour(f), remarque: `Nom dans la source : ${l[I("Country_EN")]}. Rang sur 180. Concorde avec deux lectures par agents (page du classement et pages pays).` };
  }));
}

// ---------- V-Dem (republication Our World in Data, identique à l'API officielle de V-Dem) ----------
{
  const f = telecharger("owid-freexp.csv", "https://ourworldindata.org/grapher/freedom-of-expression-index.csv?v=1&csvType=full&useColumnShortNames=true");
  const lignes = fs.readFileSync(f, "utf8").trim().split("\n").slice(1).map((l) => l.split(","));
  ecrire({
    id: "liberte-expression-vdem", titre: "Liberté d'expression et pluralisme de l'information (V-Dem)", unite: "indice de 0 à 1 (plus haut = plus libre)", edition: "V-Dem v16 (mars 2026), indicateur v2x_freexp_altinf",
    source: "V-Dem (Varieties of Democracy), republié par Our World in Data", themes: "Libertés et presse",
    licence: "CC BY-SA 4.0 (jeu de données V-Dem) : citer V-Dem et Our World in Data",
  }, pays.flatMap((p) => {
    const r = lignes.filter((l) => l[1] === p.iso3).sort((a, b) => Number(b[2]) - Number(a[2]))[0];
    return r ? [{ pays_id: p.id, valeur: Number(r[3]), annee_donnee: Number(r[2]), url: "https://ourworldindata.org/grapher/freedom-of-expression-index", niveau_preuve: NIVEAU.script, lu_le: jour(f), remarque: "Valeur centrale de V-Dem. Concorde avec l'API officielle de v-dem.net (lecture par agent) pour les 38 pays." }] : [];
  }));
}

// ---------- Yale EPI (tableau officiel de l'édition 2026) ----------
{
  const f = telecharger("epi-2026.html", "https://epi.yale.edu/2026/results/indicator/EPI");
  const t = fs.readFileSync(f, "utf8");
  const re = /results\/country\/([A-Z]{3})"[^>]*>([^<]*)<\/a>\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*([\d.]+)/g;
  const par = {};
  for (let m; (m = re.exec(t));) par[m[1]] = { nom: m[2].trim(), rang: Number(m[3]), valeur: Number(m[4]) };
  ecrire({
    id: "environnement-epi", titre: "Environnement : Environmental Performance Index", unite: "score de 0 à 100 (plus haut = mieux)", edition: "Environmental Performance Index 2026 (Yale)",
    source: "Yale Center for Environmental Law & Policy", themes: "Environnement",
    licence: "CC BY-NC-SA 4.0 : usage non commercial, en citant l'EPI (Yale)",
    absent: () => "Absent du classement 2026 (177 pays) : la page pays ne contient aucun score.",
  }, pays.filter((p) => par[p.iso3]).map((p) => ({ pays_id: p.id, valeur: par[p.iso3].valeur, rang: par[p.iso3].rang, annee_donnee: "édition 2026 (année par indicateur dans l'annexe technique)", url: `https://epi.yale.edu/2026/results/country/${p.iso3}`, niveau_preuve: NIVEAU.script, lu_le: jour(f), remarque: `Nom dans la source : ${par[p.iso3].nom}. Rang sur 177.` })));
}

// ---------- NASA POWER : rayonnement solaire, ville de référence de chaque pays ----------
{
  const lignes = [];
  for (const p of pays) {
    const v = scores.villes[p.id];
    if (!v) continue;
    const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,ALLSKY_KT&community=RE&longitude=${v.lon}&latitude=${v.lat}&format=JSON&start=2001&end=2020`;
    const f = telecharger(path.join("nasa", `${p.id}.json`), url);
    const par = JSON.parse(fs.readFileSync(f, "utf8")).properties.parameter;
    lignes.push({ pays_id: p.id, valeur: par.ALLSKY_SFC_SW_DWN.ANN, annee_donnee: "2001-2020", url, niveau_preuve: NIVEAU.script, lu_le: jour(f), remarque: `Ville de référence : ${v.nom}. Indice de clarté du ciel : ${par.ALLSKY_KT.ANN} (0 à 1).` });
  }
  ecrire({
    id: "ensoleillement-nasa", titre: "Ensoleillement : rayonnement solaire reçu au sol", unite: "kWh/m²/jour, moyenne annuelle 2001-2020 (plus haut = plus de soleil)", edition: "NASA POWER, API de climatologie v2.10.2",
    source: "NASA Langley Research Center, projet POWER", themes: "Ensoleillement",
    licence: "Aucune restriction indiquée ; la NASA demande de citer POWER et d'être prévenue en cas de redistribution",
  }, lignes);
}

// ---------- Banque mondiale, Indicateurs mondiaux de gouvernance : État de droit (remplace le WJP) ----------
// Même famille que les notes « stabilité » et « libertés » déjà sur le site (GOV_WGI_PV.SC, GOV_WGI_VA.SC), licence CC BY 4.0.
{
  const iso = pays.map((p) => p.iso3).join(";");
  const f = telecharger("wgi-rl-sc.json", `https://api.worldbank.org/v2/country/${iso}/indicator/GOV_WGI_RL.SC?source=3&format=json&per_page=2000&date=2015:2025`);
  const [meta, lignes] = JSON.parse(fs.readFileSync(f, "utf8"));
  const dernier = {};
  for (const r of lignes ?? []) if (r.value !== null && (!dernier[r.countryiso3code] || r.date > dernier[r.countryiso3code].date)) dernier[r.countryiso3code] = r;
  ecrire({
    id: "etat-de-droit-bm", titre: "État de droit (Banque mondiale, indicateurs de gouvernance)", unite: "score de 0 à 100 (plus haut = mieux)", edition: `Worldwide Governance Indicators, série GOV_WGI_RL.SC (mise à jour du ${meta.lastupdated})`,
    source: "Banque mondiale", themes: "État de droit", licence: "CC BY 4.0, en citant la Banque mondiale",
    absent: (p) => (p.id === "taiwan" ? "Taïwan n'est pas servi par l'API de la Banque mondiale." : "Pas de valeur dans la source."),
  }, pays.filter((p) => dernier[p.iso3]).map((p) => ({ pays_id: p.id, valeur: Math.round(dernier[p.iso3].value * 100) / 100, annee_donnee: Number(dernier[p.iso3].date), url: `https://api.worldbank.org/v2/country/${p.iso3}/indicator/GOV_WGI_RL.SC?source=3&format=json`, niveau_preuve: NIVEAU.script, lu_le: jour(f), remarque: "Remplace le World Justice Project, dont la licence n'a pas pu être trouvée. Même famille que les notes « stabilité » et « libertés » du site." })));
}

// ---------- Sources lues par agents (preuves dans data/indicators/lectures) ----------
const lecture = (nom) => JSON.parse(fs.readFileSync(path.join(LECTURES, `${nom}.json`), "utf8"));
const nombre = (v) => (v === null || v === undefined || v === "" ? null : Number(String(v).replace(",", ".")));
function depuisLecture(nom, def, niveau, remarque = () => "") {
  const l = lecture(nom);
  const [a, b] = l.lectures;
  ecrire({ ...def, absent: (p) => a.pays.find((x) => x.id === p.id)?.raison ?? "Pas de valeur dans la source." }, a.pays.filter((x) => nombre(x.valeur) !== null).map((x) => {
    const y = b?.pays.find((z) => z.id === x.id);
    if (b && nombre(y?.valeur) !== nombre(x.valeur)) throw new Error(`${nom} : les deux lectures diffèrent pour ${x.id}`);
    return { pays_id: x.id, valeur: nombre(x.valeur), rang: x.rang ?? "", annee_donnee: x.annee_donnee ?? "", url: Array.isArray(x.url) ? x.url[0] : x.url, niveau_preuve: niveau, lu_le: l.lu_le, remarque: remarque(x) };
  }));
}
depuisLecture("cpi", {
  id: "corruption-cpi", titre: "Corruption perçue (Transparency International)", unite: "score de 0 à 100 (100 = très peu de corruption perçue)", edition: "Corruption Perceptions Index 2025 (publié le 10 février 2026)",
  source: "Transparency International", themes: "Corruption",
  licence: "CC BY-ND 4.0 : citer « Corruption Perceptions Index 2025 by Transparency International is licensed under CC BY-ND 4.0 » avec un lien ; ne pas modifier (pas de transformation en note sans accord)",
}, NIVEAU.recoupee, (x) => `Nom dans la source : ${x.nom_dans_source}. Lu dans le fichier officiel CPI2025_Results.xlsx ; la seconde lecture a aussi relu 14 pages pays.`);
depuisLecture("ndgain", {
  id: "risques-climat-ndgain", titre: "Risques climatiques : préparation face au changement climatique (ND-GAIN)", unite: "score de 0 à 100 (plus haut = moins vulnérable et mieux préparé)", edition: "ND-GAIN Country Index, données 2005 à 2024",
  source: "Notre Dame Global Adaptation Initiative (université Notre-Dame)", themes: "Risques climatiques",
  licence: "CC BY 3.0 (page de téléchargement des données ND-GAIN)",
}, NIVEAU.recoupee, (x) => `Nom dans la source : ${x.nom_dans_source}. Sous-scores (vulnérabilité, préparation) non repris : une seule lecture, avec une incohérence entre deux onglets de la page.`);
depuisLecture("wef", {
  id: "egalite-genre-wef", titre: "Égalité femmes-hommes : Global Gender Gap Index", unite: "score de 0 à 1 (1 = parité)", edition: "Global Gender Gap Report 2026 (publié le 16 septembre 2026)",
  source: "Forum économique mondial (World Economic Forum)", themes: "Égalité femmes-hommes",
  licence: "Données du WEF : reproduction et diffusion autorisées si elles restent exactes et attribuées au World Economic Forum ; toute transformation doit être signalée ; vente interdite sans accord (« Terms of use and disclaimer » du rapport 2026)",
}, NIVEAU.auto, (x) => `Nom dans la source : ${x.nom_dans_source}. Rang sur 145. Lu dans le rapport PDF par un agent ; les 36 valeurs ont été contrôlées par script sur le texte extrait du PDF. Pas de seconde lecture indépendante (crédits de lecture épuisés, site non autorisé).`);
depuisLecture("normlex", {
  id: "droits-travailleurs-oit", titre: "Droits des travailleurs : conventions fondamentales de l'OIT ratifiées et en vigueur", unite: "nombre sur 10 (C029, C087, C098, C100, C105, C111, C138, C182, C155, C187)", edition: "NORMLEX (OIT), état au 21 novembre 2026",
  source: "Organisation internationale du travail, NORMLEX", themes: "Droits des travailleurs",
  licence: "CC BY 4.0 (bases de données de l'OIT, depuis le 3 mai 2023)",
}, NIVEAU.auto, () => "Le détail convention par convention (date, statut) est dans data/indicators/lectures/normlex.json. Pas de seconde lecture : NORMLEX refuse les scripts (403) et les crédits de lecture étaient épuisés.");

// ---------- Sources sans valeur reproduite (licence) ----------
ecrire({
  id: "libertes-freedomhouse", titre: "Libertés politiques et civiles (Freedom House)", unite: "score de 0 à 100 (plus haut = plus libre)", edition: "Freedom in the World 2026 (année 2025)",
  source: "Freedom House", themes: "Libertés et presse",
  licence: "Republication des données soumise à l'accord écrit de Freedom House (formulaire de demande : « may not be resold or redistributed without prior written permission ») : valeurs non reproduites",
  absent: () => `Valeur lue par deux agents (concordantes) mais non reproduite : la licence interdit de la republier sans accord. Voir https://freedomhouse.org/countries/freedom-world/scores ; accord à demander sur https://freedomhouse.org/data-request.`,
}, pays.map((p) => ({ pays_id: p.id, url: "https://freedomhouse.org/countries/freedom-world/scores", niveau_preuve: NIVEAU.lien, lu_le: "2026-11-21", remarque: "Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request)." })));
ecrire({
  id: "etat-de-droit-wjp", titre: "État de droit (World Justice Project)", unite: "score de 0 à 1 (plus haut = mieux)", edition: "Rule of Law Index 2026",
  source: "World Justice Project", themes: "État de droit",
  licence: "Licence des données non trouvée (page de téléchargement refusée aux scripts, erreur 403 ; seule mention lue : « rights: World Justice Project ») : valeurs non reproduites",
}, pays.map((p) => ({ pays_id: p.id, url: "https://worldjusticeproject.org/rule-of-law-index/global/2026", niveau_preuve: NIVEAU.lien, lu_le: "2026-11-21",
  remarque: ["suisse", "taiwan"].includes(p.id) ? "Absent du tableau 2026 (143 pays)." : "Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue." })));

// ---------- data/couverture.md ----------
const SEUIL = 30;
const md = [
  "# Couverture des indicateurs", "",
  `Tirée des fichiers de data/indicators le ${new Date().toISOString().slice(0, 10)} (\`node scripts/indicateurs.mjs\`). Un indicateur couvert pour moins de ${SEUIL} pays sur 38 est signalé : il ne doit pas faire bouger le classement. Aucun de ces indicateurs n'est utilisé par le calcul aujourd'hui.`, "",
  "| Indicateur | Source | Pays avec valeur | Signalé (< 30) | Niveau de preuve | Licence |", "| --- | --- | --- | --- | --- | --- |",
  ...indicateurs.map((d) => { const n = d.rangees.filter((r) => r.valeur !== undefined && r.valeur !== null && r.valeur !== "").length; return `| ${d.titre} | ${d.source}, ${d.edition} | ${n} / 38 | ${n < SEUIL ? "**oui**" : "non"} | ${[...new Set(d.rangees.map((r) => r.niveau_preuve).filter(Boolean))].join(" ; ")} | ${d.licence} |`; }),
  "", "## Pays manquants, indicateur par indicateur", "",
  ...indicateurs.flatMap((d) => {
    const manque = d.rangees.filter((r) => r.valeur === undefined || r.valeur === null || r.valeur === "");
    return [`### ${d.titre}`, "", manque.length ? manque.map((r) => `- **${r.pays}** : ${r.remarque}`).join("\n") : "Aucun : les 38 pays ont une valeur.", ""];
  }),
].join("\n");
const PROPOSITIONS = `
## Sources remplacées, et pourquoi

- **État de droit** : le World Justice Project est remplacé par la Banque mondiale (indicateurs de gouvernance, « Rule of Law », score de 0 à 100). La licence des données du WJP n'a pas pu être trouvée (page de téléchargement refusée aux scripts) ; la Banque mondiale publie sous CC BY 4.0, couvre 37 pays sur 38 et c'est déjà la famille des notes « stabilité » et « libertés » du site. Le fichier du WJP reste, avec ses liens seulement.
- **Libertés** : Freedom House interdit de republier ses données sans accord écrit. RSF (presse, CSV officiel) et V-Dem (expression et pluralisme, CC BY-SA 4.0) couvrent les 38 pays et suffisent. Pour publier Freedom House, il faut faire la demande sur https://freedomhouse.org/data-request.

## Logement, transports, ensoleillement : la meilleure source ouverte

- **Logement** : OCDE, Affordable Housing Database, indicateur HC1.2 « Housing costs over income » (part du revenu consacrée au logement). Pourquoi : même définition pour tous les pays, source officielle, réutilisation permise en citant l'OCDE. Limite : 22 pays sur 38 (années de 2017 à 2024 selon le pays), donc **signalé** : information seulement, jamais dans le classement. Complément pour l'Europe : Eurostat ilc_mded01 (13 pays, 2025, réutilisation permise en citant Eurostat). Écartés : Numbeo (licence), l'indicateur ODD 11.1.1 (bidonvilles : pas le bon sujet pour notre public). Non collecté dans cette session.
- **Transports** : ONU-Habitat, indicateur ODD 11.2.1 « part de la population ayant un accès pratique aux transports publics », mesuré par ville (2020 et 2025). Pourquoi : seul indicateur comparable entre pays, et il se lit à l'échelle de la ville, comme nos villes de référence. Limites : seule la première page sur 30 de la base a été lue (Buenos Aires, Sydney) ; la licence n'est pas lue ; la couverture de nos 38 villes n'est pas établie. À collecter quand unstats.un.org sera lisible.
- **Ensoleillement** : collecté avec NASA POWER (rayonnement solaire reçu au sol, moyenne 2001-2020, à la ville de référence ; 38 pays sur 38, lu par script). Pourquoi : donnée ouverte, même méthode pour toutes les villes, sans restriction de réutilisation. La meilleure mesure pour une personne serait la durée d'ensoleillement en heures, avec Open-Meteo (réanalyse ERA5, CC BY 4.0, déjà la source du climat du site) : le quota quotidien de l'API était épuisé pendant la session. À ajouter ensuite, avec la même ville de référence.
`;
fs.writeFileSync(path.join(RACINE, "data", "couverture.md"), md + "\n" + PROPOSITIONS);
console.log(indicateurs.map((d) => `${d.id} : ${d.rangees.filter((r) => r.valeur !== undefined && r.valeur !== null && r.valeur !== "").length}/38`).join("\n"));
