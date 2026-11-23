// Prompt 6 : fait entrer dans les données du site les indicateurs de data/indicators dont la licence permet
// une note (pas RSF ni Transparency International : « pas de modification » ; ni Freedom House ni WJP : valeurs
// non reproduites). Écrit les définitions des mesures (content/criteres.json), les sources (content/sources.json)
// et les notes des 38 pays (content/scores.json). Ajoute aussi la définition des 8 nouvelles familles de secteurs
// (les notes viennent de scripts/secteurs16.mjs). Aucune valeur estimée : une case vide du CSV reste « à vérifier ».
// Usage : node scripts/valeurs.mjs   (à relancer après node scripts/indicateurs.mjs)
import fs from "node:fs";
import path from "node:path";
import { NOUVEAUX } from "./secteurs16.mjs";

const RACINE = path.resolve(import.meta.dirname, "..");
const lireJson = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8"));
const ecrire = (f, x, indent = 2) => fs.writeFileSync(path.join(RACINE, "content", f), JSON.stringify(x, null, indent) + "\n");
const criteres = lireJson("criteres.json");
const sources = lireJson("sources.json");
const scores = lireJson("scores.json");
const fr = (n, d = 1) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d });

function lireCsv(nom) {
  const lignes = fs.readFileSync(path.join(RACINE, "data", "indicators", nom), "utf8").trim().split("\n");
  const cellules = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).slice(0, -1).map((x) => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const entetes = cellules(lignes[0]);
  return lignes.slice(1).map((l) => Object.fromEntries(cellules(l).map((c, i) => [entetes[i], c])));
}

// ---------- Les sources ----------
const NOUVELLES_SOURCES = {
  "nasa-power": { nom: "NASA Langley Research Center, projet POWER (climatologie 2001-2020)", url: "https://power.larc.nasa.gov/", licence: "Aucune restriction indiquée ; citer NASA POWER", type: "donnee-ouverte", page: "https://power.larc.nasa.gov/docs/" },
  "oms-uhc": { nom: "Organisation mondiale de la santé, Global Health Observatory (indice de couverture des services de santé essentiels, ODD 3.8.1)", url: "https://www.who.int/data/gho", licence: "CC BY-NC-SA 3.0 IGO (usage non commercial)", type: "donnee-ouverte", page: "https://www.who.int/data/gho/data/indicators/indicator-details/GHO/uhc-index-of-service-coverage" },
  "bm-wgi-rl": { nom: "Banque mondiale, Indicateurs mondiaux de gouvernance (État de droit)", url: "https://www.worldbank.org/ext/en/legal/terms-conditions/datasets", licence: "CC BY 4.0", type: "donnee-ouverte", page: "https://www.worldbank.org/en/publication/worldwide-governance-indicators" },
  vdem: { nom: "V-Dem (Varieties of Democracy) v16, republié par Our World in Data", url: "https://www.v-dem.net/", licence: "CC BY-SA 4.0", type: "donnee-ouverte", page: "https://ourworldindata.org/grapher/freedom-of-expression-index" },
  "wef-gggr": { nom: "Forum économique mondial, Global Gender Gap Report 2026", url: "https://www.weforum.org/publications/global-gender-gap-report-2026/", licence: "Reproduction autorisée en citant le WEF ; la transformation en note est signalée ici", type: "donnee-ouverte", page: "https://www.weforum.org/publications/global-gender-gap-report-2026/" },
  "oit-normlex": { nom: "Organisation internationale du travail, NORMLEX (ratifications)", url: "https://normlex.ilo.org/", licence: "CC BY 4.0", type: "donnee-ouverte", page: "https://normlex.ilo.org/dyn/nrmlx_fr/" },
  "yale-epi": { nom: "Yale Center for Environmental Law & Policy, Environmental Performance Index 2026", url: "https://epi.yale.edu/", licence: "CC BY-NC-SA 4.0 (usage non commercial)", type: "donnee-ouverte", page: "https://epi.yale.edu/" },
  "nd-gain": { nom: "Notre Dame Global Adaptation Initiative, ND-GAIN Country Index", url: "https://gain.nd.edu/our-work/country-index/", licence: "CC BY 3.0", type: "donnee-ouverte", page: "https://gain.nd.edu/our-work/country-index/" },
};
Object.assign(sources, NOUVELLES_SOURCES);

// ---------- Les mesures ----------
// bornes : 4 seuils ; notes : la note sous chaque seuil (et au-delà du dernier). Depuis le prompt 6, le calcul lit
// une note continue entre ces seuils (voir noteCalcul dans src/lib/moteur.ts) : les seuils ne sont plus des marches.
const etiq = (a) => a;
const MESURES = [
  { fichier: "ensoleillement-nasa.csv", source: "nasa-power", critere: "climat", m: {
    id: "soleil", nom: "Ensoleillement (rayonnement solaire reçu au sol)", sens: "haut", unite: "kWh/m² par jour", bornes: [3, 3.75, 4.5, 5.25], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 3", "de 3 à 3,75", "de 3,75 à 4,5", "de 4,5 à 5,25", "plus de 5,25"], mots: ["très peu de soleil", "peu de soleil", "un soleil moyen", "beaucoup de soleil", "énormément de soleil"],
    fait: "Il y a {mot} sur l’année", court: "Soleil", affichage: "{v} kWh/m² par jour", decimales: 1, theme: "le soleil", sujet: "l’ensoleillement",
    etiquettes: etiq(["Très peu ensoleillé", "Peu ensoleillé", "Moyennement ensoleillé", "Ensoleillé", "Très ensoleillé"]),
    avertissement: "Moyenne annuelle 2001-2020 à la ville de référence du pays : l’énergie du soleil reçue au sol, nuages compris. Ce n’est pas un nombre d’heures de soleil.",
  }, texte: (v, r) => `Énergie du soleil reçue au sol à ${r.ville} : ${fr(v, 2)} kWh par m² et par jour en moyenne (2001-2020, NASA POWER). Plus c’est haut, plus il y a de soleil.` },
  { fichier: "sante-couverture-oms.csv", source: "oms-uhc", critere: "sante", m: {
    id: "sante-systeme", nom: "Couverture des soins essentiels pour toute la population (indice de l’OMS, sur 100)", sens: "haut", unite: "sur 100", bornes: [60, 70, 80, 85], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 60", "de 60 à 70", "de 70 à 80", "de 80 à 85", "85 ou plus"], mots: ["très incomplète", "incomplète", "moyenne", "bonne", "très bonne"],
    fait: "La couverture des soins essentiels pour toute la population y est {mot}", court: "Soins pour tous", affichage: "{v} sur 100", decimales: 0, theme: "la santé", sujet: "l’accès aux soins pour tous",
    etiquettes: ["Très incomplète", "Incomplète", "Moyenne", "Bonne", "Très bonne"],
  }, texte: (v, r) => `Indice de couverture des services de santé essentiels : ${fr(v, 0)} sur 100 (${r.annee_donnee}, OMS). Plus c’est haut, plus les soins de base sont accessibles à toute la population.` },
  { fichier: "etat-de-droit-bm.csv", source: "bm-wgi-rl", critere: "valeurs", m: {
    id: "justice", nom: "État de droit (note de la Banque mondiale, sur 100)", sens: "haut", unite: "sur 100", bornes: [40, 55, 70, 85], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 40", "de 40 à 55", "de 55 à 70", "de 70 à 85", "85 ou plus"], mots: ["très faible", "faible", "moyenne", "élevée", "très élevée"],
    fait: "La note d’État de droit y est {mot}", court: "Justice et règles respectées", affichage: "{v} sur 100", decimales: 0, theme: "l’État de droit", sujet: "l’État de droit",
    etiquettes: ["Très faible", "Faible", "Moyen", "Élevé", "Très élevé"],
  }, texte: (v, r) => `Note de la Banque mondiale pour l’État de droit (respect des contrats, de la propriété, indépendance de la justice) : ${fr(v, 0)} sur 100 (${r.annee_donnee}).` },
  { fichier: "liberte-expression-vdem.csv", source: "vdem", critere: "valeurs", m: {
    id: "expression", nom: "Liberté d’expression et pluralisme de l’information (V-Dem, sur 1)", sens: "haut", unite: "sur 1", bornes: [0.4, 0.6, 0.8, 0.9], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 0,4", "de 0,4 à 0,6", "de 0,6 à 0,8", "de 0,8 à 0,9", "0,9 ou plus"], mots: ["très restreinte", "restreinte", "moyenne", "élevée", "très élevée"],
    fait: "La liberté d’expression y est {mot}", court: "Liberté d’expression", affichage: "{v} sur 1", decimales: 2, theme: "les libertés", sujet: "la liberté d’expression",
    etiquettes: ["Très restreinte", "Restreinte", "Moyenne", "Élevée", "Très élevée"],
  }, texte: (v, r) => `Indice V-Dem de liberté d’expression et de pluralisme de l’information : ${fr(v, 2)} sur 1 (${r.annee_donnee}). Plus c’est haut, plus on peut s’exprimer et s’informer librement.` },
  { fichier: "egalite-genre-wef.csv", source: "wef-gggr", critere: "valeurs", m: {
    id: "egalite-genre", nom: "Égalité femmes-hommes (Global Gender Gap Index du WEF, sur 1)", sens: "haut", unite: "sur 1", bornes: [0.68, 0.72, 0.76, 0.8], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 0,68", "de 0,68 à 0,72", "de 0,72 à 0,76", "de 0,76 à 0,80", "0,80 ou plus"], mots: ["loin de la parité", "assez loin de la parité", "à mi-chemin", "proche de la parité", "très proche de la parité"],
    fait: "L’égalité femmes-hommes y est {mot}", court: "Égalité femmes-hommes", affichage: "{v} sur 1", decimales: 3, theme: "l’égalité", sujet: "l’égalité femmes-hommes",
    etiquettes: ["Loin de la parité", "Assez loin", "À mi-chemin", "Proche de la parité", "Très proche"],
    avertissement: "La note de 1 à 5 est une transformation faite par Orizo de l’indice du Forum économique mondial (WEF), qui reste la source de la valeur affichée.",
  }, texte: (v, r) => `Global Gender Gap Index : ${fr(v, 3)} sur 1 (1 = parité ; ${r.annee_donnee}, Forum économique mondial). Il mesure l’écart entre femmes et hommes dans l’économie, l’éducation, la santé et la politique.` },
  { fichier: "droits-travailleurs-oit.csv", source: "oit-normlex", critere: "valeurs", m: {
    id: "droits-travail", nom: "Conventions fondamentales de l’OIT ratifiées et en vigueur (sur 10)", sens: "haut", unite: "sur 10", bornes: [6, 8, 9, 10], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 6", "6 ou 7", "8", "9", "10"], mots: ["moins de 6 sur 10", "6 ou 7 sur 10", "8 sur 10", "9 sur 10", "10 sur 10"],
    fait: "Le pays a ratifié {mot} des conventions fondamentales du travail", court: "Droits des travailleurs", affichage: "{v} sur 10", decimales: 0, theme: "les droits au travail", sujet: "les droits des travailleurs",
    etiquettes: ["Peu de conventions", "Une partie", "La plupart", "Presque toutes", "Toutes"],
    avertissement: "Ratifier une convention est un engagement juridique : ça ne dit pas à lui seul comment elle est appliquée sur le terrain.",
  }, texte: (v) => `Conventions fondamentales de l’OIT ratifiées et en vigueur : ${fr(v, 0)} sur 10 (travail forcé, liberté syndicale, égalité de salaire, travail des enfants, sécurité au travail ; NORMLEX, état au 21 novembre 2026).` },
  { fichier: "environnement-epi.csv", source: "yale-epi", critere: "valeurs", m: {
    id: "environnement", nom: "Performance environnementale (Environmental Performance Index de Yale, sur 100)", sens: "haut", unite: "sur 100", bornes: [35, 45, 55, 65], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 35", "de 35 à 45", "de 45 à 55", "de 55 à 65", "65 ou plus"], mots: ["très faible", "faible", "moyenne", "bonne", "très bonne"],
    fait: "La performance environnementale y est {mot}", court: "Environnement protégé", affichage: "{v} sur 100", decimales: 0, theme: "l’environnement", sujet: "la protection de l’environnement",
    etiquettes: ["Très faible", "Faible", "Moyenne", "Bonne", "Très bonne"],
  }, texte: (v) => `Environmental Performance Index : ${fr(v, 0)} sur 100 (édition 2026, Yale). Il combine la santé environnementale (air, eau), les écosystèmes et le climat.` },
  { fichier: "risques-climat-ndgain.csv", source: "nd-gain", critere: "valeurs", m: {
    id: "climat-prepare", nom: "Préparation face au changement climatique (ND-GAIN, sur 100)", sens: "haut", unite: "sur 100", bornes: [45, 52, 59, 66], notes: [1, 2, 3, 4, 5],
    echelle: ["moins de 45", "de 45 à 52", "de 52 à 59", "de 59 à 66", "66 ou plus"], mots: ["très vulnérable", "vulnérable", "moyennement préparé", "bien préparé", "très bien préparé"],
    fait: "Face au changement climatique, le pays est {mot}", court: "Préparé au changement climatique", affichage: "{v} sur 100", decimales: 0, theme: "le climat de demain", sujet: "la préparation au changement climatique",
    etiquettes: ["Très vulnérable", "Vulnérable", "Moyen", "Bien préparé", "Très bien préparé"],
  }, texte: (v, r) => `Indice ND-GAIN : ${fr(v, 1)} sur 100 (${r.annee_donnee}, université Notre-Dame). Plus c’est haut, moins le pays est vulnérable et mieux il se prépare au changement climatique.` },
];

const noter = (m, v) => { const i = m.bornes.findIndex((b) => v < b); return m.notes[i === -1 ? m.notes.length - 1 : i]; };
const villes = scores.villes;
for (const { fichier, source, critere, m, texte } of MESURES) {
  const c = criteres.find((x) => x.id === critere);
  c.mesures = c.mesures.filter((x) => x.id !== m.id).concat([m]);
  if (!c.sources.includes(source)) c.sources.push(source);
  let n = 0;
  for (const r of lireCsv(fichier)) {
    const p = scores.pays[r.pays_id];
    if (!p) continue;
    if (r.valeur === "") { p[m.id] = { statut: "a-verifier", note: null, texte: r.remarque || "Pas de valeur dans cette source." }; continue; }
    const v = Number(r.valeur);
    p[m.id] = {
      statut: "verifie", note: noter(m, v), valeur: v, texte: texte(v, { ...r, ville: villes[r.pays_id]?.nom ?? "la ville de référence" }),
      annee: /^\d{4}/.test(r.annee_donnee) ? r.annee_donnee : null, source, lien: r.url, verifieLe: r.lu_le,
    };
    n++;
  }
  console.log(m.id.padEnd(16), `${n} pays notés sur 38`);
}

// ---------- Les 8 nouvelles familles de secteurs : leurs définitions ----------
const secteur = criteres.find((x) => x.id === "secteur");
const modele = secteur.mesures.find((x) => x.id === "secteur-finance");
for (const [id, x] of Object.entries(NOUVEAUX)) {
  const nom = x.nom.replace(/^(l'|le |la |les )/, "");
  secteur.mesures = secteur.mesures.filter((y) => y.id !== `secteur-${id}`).concat([{
    ...modele, id: `secteur-${id}`, nom: `Part de l’emploi dans ${x.nom.replace(/'/g, "’")}`,
    regle: `Section${x.sections.length > 1 ? "s" : ""} ${x.sections.join(" et ")} de la CITI rév. 4, part de l’emploi total du pays, dernière année disponible (2019 ou plus récente). Note selon le rapport entre la part du pays et la médiane des pays notés : moins de 0,7 → 1 ; moins de 0,9 → 2 ; moins de 1,1 → 3 ; moins de 1,3 → 4 ; 1,3 ou plus → 5.`,
    court: `Ton secteur (${nom.replace(/'/g, "’")})`,
  }]);
}
secteur.definition = "La part des emplois du pays dans ton secteur (16 familles), comparée aux autres pays. Source : Organisation internationale du travail (ILOSTAT, emploi par activité économique, CITI rév. 4, CC BY 4.0). Ne compte que si tu as choisi un secteur, et seulement si au moins 30 pays sur 38 ont une donnée pour lui.";

const valeurs = criteres.find((x) => x.id === "valeurs");
valeurs.nom = "Valeurs (en option)";
valeurs.definition = "Des indices ouverts, affichés avec leur source. Ils ne comptent que pour les valeurs que tu as dites importantes. RSF et Transparency International ne sont pas notés : leur licence interdit de transformer leur valeur.";

ecrire("criteres.json", criteres);
ecrire("sources.json", sources);
fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(scores, null, 1) + "\n");
