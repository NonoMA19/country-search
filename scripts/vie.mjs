// Barème des indemnités VIE : recalcule les montants à partir de content/saisie/vie-bareme.json.
// Usage : node scripts/vie.mjs   (écrit content/saisie/vie-indemnites.json, puis met à jour scores.json avec collecte.mjs --vie)
//         node scripts/vie.mjs --essai chemin/bareme.json   (calcule et affiche seulement, sans rien écrire : pour vérifier une saisie)
//
// Total mensuel = part fixe (772,87 €) + indemnité supplémentaire.
// L'indemnité supplémentaire est ajustée chaque trimestre par arrêté : on applique le taux de chaque pays
// (en %, par exemple 1.25 pour +1,25 %), et on arrondit au centime à chaque trimestre.
//
// Point de départ :
// - si la base de janvier (« base.supplements ») et les taux de tous les trimestres de l'année sont saisis,
//   on part de janvier et on vérifie qu'on retrouve le barème de référence (1er octobre 2026) ;
// - sinon, on part du barème de référence, lu au Journal officiel.
// Chaque nouveau trimestre : ajouter dans « trimestres » une entrée { arrete, lien, enVigueur, taux: { pays: %, "pays/ville": % } }.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8"));
const iEssai = process.argv.indexOf("--essai");
const ESSAI = iEssai > 0 ? process.argv[iEssai + 1] : null;
const B = ESSAI ? JSON.parse(fs.readFileSync(ESSAI, "utf8")) : lire("saisie/vie-bareme.json");
const centimes = (x) => Math.round(x * 100) / 100;
const cle = (pays, ville) => (ville ? `${pays}/${ville}` : pays);

// Les montants de référence (totaux), ville par ville.
const ref = B.reference;
const supplementsRef = {};
for (const [id, p] of Object.entries(ref.pays)) for (const v of p.villes) {
  supplementsRef[cle(id, v.ville)] = v.total === null ? null : centimes(v.total - B.partFixe);
}

// Le taux d'un trimestre pour une ville : celui de la ville s'il est donné, sinon celui du pays.
const tauxDe = (t, id, ville) => t.taux?.[cle(id, ville)] ?? t.taux?.[id] ?? null;
function appliquer(supplements, trimestres) {
  const res = { ...supplements };
  for (const t of trimestres) for (const k of Object.keys(res)) {
    if (res[k] === null) continue;
    const [id, ville] = k.split("/");
    const taux = tauxDe(t, id, ville ?? null);
    if (taux === null) throw new Error(`${t.arrete} : pas de taux pour ${k}`);
    res[k] = centimes(res[k] * (1 + taux / 100));
  }
  return res;
}

// Les trimestres jusqu'à la référence (inclus), puis ceux d'après.
const iRef = B.trimestres.findIndex((t) => t.enVigueur === ref.date);
const avant = B.trimestres.slice(0, iRef + 1);
const apres = B.trimestres.slice(iRef + 1).filter((t) => t.taux);
const baseComplete = B.base?.supplements && avant.every((t) => t.taux);

let depart = supplementsRef;
let date = ref.date;
if (baseComplete) {
  const calcules = appliquer(B.base.supplements, avant);
  // Un centime d'écart au plus est admis (arrondis) ; au-delà, la saisie est fausse et rien n'est écrit.
  const verifiees = Object.entries(supplementsRef).filter(([, v]) => v !== null);
  const ecart = ([k, v]) => Math.round(Math.abs((calcules[k] ?? NaN) - v) * 100);
  const unCentime = verifiees.filter((x) => ecart(x) === 1), graves = verifiees.filter((x) => !(ecart(x) <= 1));
  console.log(`Contrôle avec le barème du ${ref.date} : ${verifiees.length - unCentime.length - graves.length} montants identiques, ${unCentime.length} à 1 centime près, ${graves.length} écart(s) de plus d'un centime.`);
  for (const [k, v] of [...unCentime, ...graves]) console.log(`  ${k} : calculé ${calcules[k]}, Journal officiel ${v}`);
  if (graves.length) { console.error("Écart de plus d'un centime : vérifie la saisie. Rien n'est écrit."); process.exit(1); }
  // On garde le montant du Journal officiel quand il existe ; le calcul complète les villes sans montant de référence.
  depart = Object.fromEntries(Object.keys(calcules).map((k) => [k, supplementsRef[k] ?? calcules[k]]));
} else {
  console.log(`Base de janvier ou taux de 2026 non saisis : départ du barème du ${ref.date} (Journal officiel).`);
}
const finaux = appliquer(depart, apres);
if (apres.length) date = apres.at(-1).enVigueur;
const dernier = apres.at(-1) ?? B.trimestres[iRef];

// Le tableau lu par collecte.mjs --vie : pour chaque pays, la ville principale et les autres.
const total = (k) => (finaux[k] === null || finaux[k] === undefined ? null : centimes(finaux[k] + B.partFixe));
const sortie = {
  _genere: "Écrit par scripts/vie.mjs depuis content/saisie/vie-bareme.json : ne pas modifier à la main.",
  partFixe: B.partFixe,
  dateBareme: date,
  arrete: dernier.arrete,
  lien: dernier.lien,
  verifieLe: ref.verifieLe,
  source: "jorf-vie",
  reduction: B.sourcePartFixe.phrase,
  destinations: B.destinations,
  pays: {},
};
for (const [id, p] of Object.entries(ref.pays)) {
  if (B.destinations.horsListe.includes(id)) continue;
  const princ = p.villes.find((v) => v.principale) ?? p.villes[0];
  sortie.pays[id] = {
    montant: total(cle(id, princ.ville)),
    ville: princ.ville === "autres villes" ? null : princ.ville,
    autres: p.villes.filter((v) => v !== princ).map((v) => ({ ville: v.ville, montant: total(cle(id, v.ville)) })),
  };
}
if (ESSAI) {
  for (const [id, x] of Object.entries(sortie.pays)) console.log(`  ${id} : ${x.montant} €`);
  process.exit(0);
}
fs.writeFileSync(path.join(RACINE, "content", "saisie", "vie-indemnites.json"), JSON.stringify(sortie, null, 2) + "\n");
console.log(`Barème du ${date} : ${Object.keys(sortie.pays).length} pays (hors destinations : ${B.destinations.horsListe.join(", ")}).`);
for (const [id, x] of Object.entries(sortie.pays)) console.log(`  ${id} : ${x.montant} €${x.ville ? ` (${x.ville})` : ""}${x.autres.length ? ` ; ${x.autres.map((a) => `${a.ville} ${a.montant ?? "à vérifier"}`).join(" ; ")}` : ""}`);

// Puis les notes du score.
execFileSync(process.execPath, [path.join(RACINE, "scripts", "collecte.mjs"), "--vie"], { stdio: ["ignore", "ignore", "inherit"] });
console.log("scores.json mis à jour (collecte.mjs --vie).");
