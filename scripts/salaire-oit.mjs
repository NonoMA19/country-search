// Salaire des pays hors OCDE (prompt 7) : un chiffre de l'OIT, seulement s'il est en parité de pouvoir d'achat.
// Source : ILOSTAT (OIT, CC BY 4.0), « Average monthly earnings of employees by sex and currency »
// (indicateur EAR_EMTA_SEX_CUR_NB_A), femmes et hommes, monnaie « PPP » (dollars à parité de pouvoir d'achat).
// Dernière année disponible, 2019 ou plus récente (règle du site : pas de donnée d'avant 2019). Valeur annuelle = mensuelle × 12.
// Ce n'est pas le même concept que l'OCDE (tous les salariés, temps partiel compris, en dollars PPA courants) :
// la note suit les mêmes seuils, mais la preuve dit « Source différente, comparaison approximative ».
// Les 23 pays de l'OCDE ne sont jamais réécrits. Usage : node scripts/salaire-oit.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const ANNEE_MIN = 2019;
const LIEN = (iso3) => `https://rplumber.ilo.org/data/indicator/?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${iso3}&format=.csv`;
const fr = (n) => Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");

function telecharger(iso3) {
  const f = path.join(CACHE, `oit_EAR_EMTA_${iso3}.csv`);
  if (!fs.existsSync(f) || fs.statSync(f).size === 0) {
    const t = execFileSync("curl", ["-s", "-m", "120", LIEN(iso3)], { encoding: "utf8" });
    fs.writeFileSync(f, t);
  }
  return fs.readFileSync(f, "utf8");
}

const fichierScores = path.join(RACINE, "content", "scores.json");
const scores = JSON.parse(fs.readFileSync(fichierScores, "utf8"));
const pays = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "pays.json"), "utf8"));
const criteres = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "criteres.json"), "utf8"));
const def = criteres.flatMap((c) => c.mesures).find((m) => m.id === "salaire");
const note = (v) => 1 + def.bornes.filter((b) => v >= b).length;

const bilan = [];
for (const p of pays) {
  const actuel = scores.pays[p.id]?.salaire;
  if (actuel?.source === "ocde-salaire") continue;
  const lignes = telecharger(p.iso3).split("\n").slice(1).map((l) => l.split(",").map((x) => x.replace(/"/g, "").trim()))
    .filter((r) => r[3] === "SEX_T" && r[4] === "CUR_TYPE_PPP" && Number.isFinite(Number(r[6])));
  lignes.sort((a, b) => Number(b[5]) - Number(a[5]));
  const r = lignes[0];
  if (!r || Number(r[5]) < ANNEE_MIN) {
    const raison = r ? `la dernière donnée de l’OIT en parité de pouvoir d’achat date de ${r[5]} (règle du site : 2019 ou après)` : "l’OIT n’a pas de donnée en parité de pouvoir d’achat pour ce pays";
    scores.pays[p.id].salaire = {
      statut: "a-verifier", note: null,
      texte: `Salaire brut moyen : ce pays n’est pas dans la série de l’OCDE, et ${raison}. À vérifier, pas de chiffre approximatif.`,
    };
    bilan.push(`${p.nom} : à vérifier (${r ? r[5] : "aucune donnée"})`);
    continue;
  }
  const annuel = Number(r[6]) * 12;
  scores.pays[p.id].salaire = {
    statut: "verifie",
    note: note(annuel),
    valeur: Math.round(annuel),
    texte: `Salaire mensuel moyen de l’ensemble des salariés (temps partiel compris), avant impôts : ${fr(Number(r[6]))} $ par mois en ${r[5]}, soit environ ${fr(annuel)} $ par an, en dollars à parité de pouvoir d’achat (OIT, ILOSTAT). Source différente de l’OCDE (qui compte les salariés à temps plein) : comparaison approximative.`,
    annee: r[5],
    source: "oit-salaire",
    lien: LIEN(p.iso3),
    verifieLe: AUJOURDHUI,
    approximatif: true,
  };
  bilan.push(`${p.nom} : ${fr(annuel)} $ par an (${r[5]}), note ${note(annuel)}`);
}
fs.writeFileSync(fichierScores, JSON.stringify(scores, null, 1) + "\n");
console.log(bilan.join("\n"));
