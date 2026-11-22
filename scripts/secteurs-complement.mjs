// Complète l'emploi par secteur des pays encore « à vérifier », sans toucher aux autres pays.
// Même source et mêmes règles que `node scripts/collecte.mjs --secteur` (ILOSTAT, EMP_TEMP_SEX_ECO_NB_A, CITI rév. 4,
// dernière année 2019 ou plus récente avec le total et les 8 sections), et la MÊME médiane : celle des 30 pays déjà notés,
// relue dans scores.json. Ainsi, ajouter un pays ne change la note d'aucun autre.
// L'Autriche (Eurostat) et le Canada (autre nomenclature) ne sont jamais réécrits.
// Usage : node scripts/collecte.mjs n'est pas nécessaire ; lancer : node scripts/secteurs-complement.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const SECTEURS = { finance: "K", conseil: "M", ingenierie: "C", tech: "J", commerce: "G", sante: "Q", hotellerie: "I", enseignement: "P" };
const NOMS = { finance: "la finance et la banque", conseil: "le conseil et l'audit", ingenierie: "l'ingénierie et l'industrie", tech: "la tech et la data", commerce: "le marketing et le commerce", sante: "la santé", hotellerie: "l'hôtellerie et le tourisme", enseignement: "l'enseignement et la recherche" };
const ANNEE_MIN = 2019;
const JAMAIS = new Set(["autriche", "canada"]);
const LIEN = (iso3) => `https://rplumber.ilo.org/data/indicator/?id=EMP_TEMP_SEX_ECO_NB_A&ref_area=${iso3}&format=.csv`;
const fr = (n, d = 1) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d });
const noteRapport = (r) => (r < 0.7 ? 1 : r < 0.9 ? 2 : r < 1.1 ? 3 : r < 1.3 ? 4 : 5);

const scores = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "scores.json"), "utf8"));
const pays = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "pays.json"), "utf8"));

// La médiane de chaque secteur, telle qu'utilisée pour les 30 pays déjà notés (une seule valeur par secteur).
const mediane = {};
for (const id of Object.keys(SECTEURS)) {
  const v = new Set(Object.values(scores.pays).map((p) => p[`secteur-${id}`]).filter((n) => n?.statut === "verifie" && n.mediane).map((n) => n.mediane));
  if (v.size !== 1) throw new Error(`Médiane du secteur ${id} ambiguë : ${[...v].join(", ")}`);
  mediane[id] = [...v][0];
}
const france = scores.reference?.france?.notes ?? {};

function emploiParSecteur(iso3) {
  const f = path.join(CACHE, `ilo_eco_${iso3}.csv`);
  execFileSync("curl", ["-s", "-m", "120", "--fail", "-o", f, LIEN(iso3)]);
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
  const ok = Object.entries(parCle).filter(([, v]) => v.TOTAL > 0 && Object.values(SECTEURS).every((s) => v[s] !== undefined));
  ok.sort((a, b) => Number(b[0].split("|")[1]) - Number(a[0].split("|")[1]) || Object.keys(b[1]).length - Object.keys(a[1]).length);
  if (!ok.length) return null;
  const [cle, v] = ok[0];
  return { annee: cle.split("|")[1], parts: Object.fromEntries(Object.entries(SECTEURS).map(([id, s]) => [id, (100 * v[s]) / v.TOTAL])) };
}

const cibles = pays.filter((p) => !JAMAIS.has(p.id) && Object.keys(SECTEURS).some((id) => scores.pays[p.id][`secteur-${id}`]?.statut !== "verifie"));
for (const p of cibles) {
  const d = emploiParSecteur(p.iso3);
  for (const id of Object.keys(SECTEURS)) {
    const cle = `secteur-${id}`;
    if (!d) { scores.pays[p.id][cle] = { statut: "a-verifier", note: null, texte: "Emploi par secteur : aucune année avec le total et les 8 sections en CITI rév. 4 dans cette source (ILOSTAT).", verifieLe: AUJOURDHUI }; continue; }
    if (Number(d.annee) < ANNEE_MIN) { scores.pays[p.id][cle] = { statut: "a-verifier", note: null, texte: `Emploi par secteur : la donnée la plus récente date de ${d.annee}, avant ${ANNEE_MIN}. On ne la compte pas.`, verifieLe: AUJOURDHUI }; continue; }
    const v = d.parts[id];
    const ref = france[cle]?.valeur ?? null;
    const texte = `${NOMS[id].charAt(0).toUpperCase() + NOMS[id].slice(1)} : ${fr(v)} % des emplois ${p.en}${ref !== null ? `, ${fr(ref)} % en France` : ""} (${d.annee}, Organisation internationale du travail, ILOSTAT). Médiane des 30 pays : ${fr(mediane[id])} %. C'est la part de ce secteur dans l'emploi du pays, pas le nombre d'offres ouvertes.`;
    scores.pays[p.id][cle] = { statut: "verifie", note: noteRapport(v / mediane[id]), valeur: Math.round(v * 100) / 100, texte, annee: d.annee, source: "oit-ilostat", lien: LIEN(p.iso3), verifieLe: AUJOURDHUI, mediane: mediane[id] };
  }
  console.log(p.nom, d?.annee ?? "—", Object.keys(SECTEURS).map((id) => scores.pays[p.id][`secteur-${id}`].note ?? "·").join(" "));
}
fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(scores, null, 1) + "\n");
