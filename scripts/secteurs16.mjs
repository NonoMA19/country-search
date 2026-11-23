// Les 8 familles de secteurs ajoutées au prompt 6 (16 familles en tout), même source et mêmes règles que
// `node scripts/collecte.mjs --secteur` : ILOSTAT (OIT, CC BY 4.0), emploi par activité économique, CITI rév. 4
// (indicateur EMP_TEMP_SEX_ECO_NB_A), femmes et hommes, dernière année 2019 ou plus récente avec le total et toutes
// les sections utiles. Part = section(s) ÷ total, même source et même année. Note de 1 à 5 selon le rapport entre
// la part du pays et la médiane des pays notés (moins de 0,7 → 1 ; 0,9 → 2 ; 1,1 → 3 ; 1,3 → 4 ; au-delà → 5).
// Les 8 familles d'avant (finance, conseil…) ne sont jamais réécrites. Le Canada reste « à vérifier » (nomenclature SCIAN).
// Usage : node scripts/secteurs16.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
export const NOUVEAUX = {
  agriculture: { sections: ["A"], nom: "l'agriculture et l'agroalimentaire" },
  energie: { sections: ["D", "E"], nom: "l'énergie, l'eau et l'environnement" },
  btp: { sections: ["F"], nom: "le bâtiment et l'architecture" },
  transport: { sections: ["H"], nom: "le transport et la logistique" },
  immobilier: { sections: ["L"], nom: "l'immobilier" },
  public: { sections: ["O"], nom: "l'administration et le service public" },
  culture: { sections: ["R"], nom: "la culture, les arts et le sport" },
  services: { sections: ["N"], nom: "les services aux entreprises (RH, intérim, support)" },
};
const ANNEE_MIN = 2019;
const JAMAIS = new Set(["canada"]);
const LIEN = (iso3) => `https://rplumber.ilo.org/data/indicator/?id=EMP_TEMP_SEX_ECO_NB_A&ref_area=${iso3}&format=.csv`;
const fr = (n, d = 1) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d });
const noteRapport = (r) => (r < 0.7 ? 1 : r < 0.9 ? 2 : r < 1.1 ? 3 : r < 1.3 ? 4 : 5);
const TOUTES = [...new Set(Object.values(NOUVEAUX).flatMap((x) => x.sections))];

if (path.resolve(process.argv[1] ?? "") === import.meta.filename) principal();

function principal() {
const fichierScores = path.join(RACINE, "content", "scores.json");
const scores = JSON.parse(fs.readFileSync(fichierScores, "utf8"));
const pays = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "pays.json"), "utf8"));

function emploi(iso3) {
  const f = path.join(CACHE, `ilo_eco_${iso3}.csv`);
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) {
    try { execFileSync("curl", ["-s", "-m", "120", "--fail", "-o", f, LIEN(iso3)]); } catch { return null; }
  }
  const lignes = fs.readFileSync(f, "utf8").replace(/^﻿/, "").trim().split("\n");
  const entetes = lignes[0].split(",").map((x) => x.replace(/"/g, ""));
  const parCle = {};
  for (const l of lignes.slice(1)) {
    const c = l.match(/("([^"]*)"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, "").replace(/^"|"$/g, ""));
    const o = Object.fromEntries(entetes.map((e, i) => [e, c[i]]));
    if (o.sex !== "SEX_T" || !o.classif1?.startsWith("ECO_ISIC4_") || o.obs_value === "" || isNaN(Number(o.obs_value))) continue;
    if (Number(o.time) > Number(AUJOURDHUI.slice(0, 4))) continue;
    (parCle[`${o.source}|${o.time}`] ??= {})[o.classif1.slice(10)] = Number(o.obs_value);
  }
  const ok = Object.entries(parCle).filter(([, v]) => v.TOTAL > 0 && TOUTES.every((s) => v[s] !== undefined));
  ok.sort((a, b) => Number(b[0].split("|")[1]) - Number(a[0].split("|")[1]) || Object.keys(b[1]).length - Object.keys(a[1]).length);
  if (!ok.length) return null;
  const [cle, v] = ok[0];
  return { annee: cle.split("|")[1], parts: Object.fromEntries(Object.entries(NOUVEAUX).map(([id, x]) => [id, (100 * x.sections.reduce((s, k) => s + v[k], 0)) / v.TOTAL])) };
}

const donnees = Object.fromEntries(pays.map((p) => [p.id, JAMAIS.has(p.id) ? null : emploi(p.iso3)]));
const fra = emploi("FRA");
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
for (const [id, x] of Object.entries(NOUVEAUX)) {
  const valides = pays.filter((p) => donnees[p.id] && Number(donnees[p.id].annee) >= ANNEE_MIN).map((p) => donnees[p.id].parts[id]).sort((a, b) => a - b);
  const n = valides.length;
  const mediane = n % 2 ? valides[(n - 1) / 2] : (valides[n / 2 - 1] + valides[n / 2]) / 2;
  const ref = fra && Number(fra.annee) >= ANNEE_MIN ? fra.parts[id] : null;
  for (const p of pays) {
    const d = donnees[p.id];
    const cle = `secteur-${id}`;
    if (JAMAIS.has(p.id)) { scores.pays[p.id][cle] = { statut: "a-verifier", note: null, texte: "Emploi par secteur : le Canada publie ses chiffres dans une autre nomenclature (SCIAN), pas comparable aux autres pays." }; continue; }
    if (!d) { scores.pays[p.id][cle] = { statut: "a-verifier", note: null, texte: "Emploi par secteur : pas de donnée dans cette source (ILOSTAT)." }; continue; }
    if (Number(d.annee) < ANNEE_MIN) { scores.pays[p.id][cle] = { statut: "a-verifier", note: null, texte: `Emploi par secteur : la donnée la plus récente date de ${d.annee}, avant ${ANNEE_MIN}. On ne la compte pas.` }; continue; }
    const v = d.parts[id];
    const texte = `${majuscule(x.nom)} : ${fr(v)} % des emplois ${p.en}${ref !== null ? `, ${fr(ref)} % en France` : ""} (${d.annee}, Organisation internationale du travail, ILOSTAT). Médiane des ${n} pays notés : ${fr(mediane)} %. C’est la part de ce secteur dans l’emploi du pays, pas le nombre d’offres ouvertes.`;
    scores.pays[p.id][cle] = { statut: "verifie", note: noteRapport(v / mediane), valeur: Math.round(v * 100) / 100, texte, annee: d.annee, source: "oit-ilostat", lien: LIEN(p.iso3), verifieLe: AUJOURDHUI, mediane: Math.round(mediane * 100) / 100 };
  }
  const france = scores.reference?.france?.notes;
  if (france && ref !== null) france[`secteur-${id}`] = { statut: "verifie", note: noteRapport(ref / mediane), valeur: Math.round(ref * 100) / 100, texte: `${majuscule(x.nom)} : ${fr(ref)} % des emplois en France (${fra.annee}, ILOSTAT).`, annee: fra.annee, source: "oit-ilostat", lien: LIEN("FRA"), verifieLe: AUJOURDHUI };
  console.log(id, "médiane", fr(mediane), "pays notés", n);
}
fs.writeFileSync(fichierScores, JSON.stringify(scores, null, 1) + "\n");
for (const p of pays) console.log(p.nom.padEnd(22), donnees[p.id]?.annee ?? "—", Object.keys(NOUVEAUX).map((id) => scores.pays[p.id][`secteur-${id}`].note ?? "·").join(" "));
}
