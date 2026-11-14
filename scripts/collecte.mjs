// Télécharge les données ouvertes et écrit content/scores.json.
// Usage : node scripts/collecte.mjs
// Rien n'est inventé : une donnée absente devient « à vérifier » et reste hors calcul.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const UA = "country-search-bot/0.1 (projet open source non commercial)";

const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8"));
const pays = lire("pays.json");
const criteres = lire("criteres.json");
const avis = lire("saisie/avis.json");
const mesures = Object.fromEntries(criteres.flatMap((c) => c.mesures.map((m) => [m.id, m])));

// curl plutôt que fetch : il respecte le proxy de la machine sans réglage.
function telecharger(nom, url) {
  const fichier = path.join(CACHE, nom);
  if (fs.existsSync(fichier) && fs.statSync(fichier).size > 0) return fichier;
  for (let essai = 1; essai <= 4; essai++) {
    try {
      execFileSync("curl", ["-sS", "-L", "--fail", "-m", "300", "-A", UA, "-o", fichier, url], { stdio: "pipe" });
      if (fs.statSync(fichier).size > 0) return fichier;
    } catch {
      execFileSync("sleep", [String(essai * 3)]);
    }
  }
  if (fs.existsSync(fichier)) fs.rmSync(fichier);
  console.warn("  échec :", url);
  return null;
}
const json = (nom, url) => {
  const f = telecharger(nom, url);
  if (!f) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
};

const fr = (n, d = 1) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d });
function noter(idMesure, valeur) {
  const m = mesures[idMesure];
  const i = m.bornes.findIndex((b) => valeur < b);
  return m.notes[i === -1 ? m.notes.length - 1 : i];
}
const aVerifier = (texte) => ({ statut: "a-verifier", note: null, texte });
const verifie = (idMesure, valeur, texte, source, lien, annee) => ({
  statut: "verifie", note: noter(idMesure, valeur), valeur: Math.round(valeur * 100) / 100,
  texte, annee: annee ?? null, source, lien, verifieLe: AUJOURDHUI,
});

// ---------- Banque mondiale ----------
const ISO3 = pays.map((p) => p.iso3).join(";");
function banqueMondiale(indicateur, extra = "") {
  const url = `https://api.worldbank.org/v2/country/${ISO3};FRA/indicator/${indicateur}?format=json&per_page=1000&date=2015:2026${extra}`;
  const d = json(`bm_${indicateur}.json`, url);
  const serie = {};
  if (!d || !Array.isArray(d[1])) return { serie, url };
  for (const l of d[1]) {
    if (l.value === null) continue;
    (serie[l.countryiso3code] ??= {})[l.date] = l.value;
  }
  return { serie, url };
}
const dernier = (o) => {
  if (!o) return null;
  const an = Object.keys(o).sort().pop();
  return { annee: an, valeur: o[an] };
};

console.log("Banque mondiale…");
const bm = {
  emploi: banqueMondiale("SL.UEM.1524.ZS"),
  ppa: banqueMondiale("PA.NUS.PRVT.PP"),
  change: banqueMondiale("PA.NUS.FCRF"),
  homicides: banqueMondiale("VC.IHR.PSRC.P5"),
  air: banqueMondiale("EN.ATM.PM25.MC.M3"),
  stabilite: banqueMondiale("GOV_WGI_PV.SC", "&source=3"),
  libertes: banqueMondiale("GOV_WGI_VA.SC", "&source=3"),
};
// Niveau des prix = parité de pouvoir d'achat (consommation des ménages) ÷ taux de change.
function niveauPrix(iso3) {
  const p = bm.ppa.serie[iso3], c = bm.change.serie[iso3];
  if (!p || !c) return null;
  const an = Object.keys(p).filter((a) => c[a]).sort().pop();
  return an ? { annee: an, valeur: p[an] / c[an] } : null;
}
const prixFrance = niveauPrix("FRA");

// ---------- OIT ----------
function oit(indicateur, iso3, filtre) {
  const f = telecharger(`oit_${indicateur}_${iso3}.csv`, `https://rplumber.ilo.org/data/indicator/?id=${indicateur}&ref_area=${iso3}&format=.csv`);
  if (!f) return null;
  const lignes = fs.readFileSync(f, "utf8").replace(/^﻿/, "").trim().split("\n");
  const entetes = lignes[0].split(",").map((s) => s.replace(/"/g, ""));
  let meilleur = null;
  for (const l of lignes.slice(1)) {
    const c = l.match(/("([^"]*)"|[^,]*)(,|$)/g).map((s) => s.replace(/,$/, "").replace(/^"|"$/g, ""));
    const o = Object.fromEntries(entetes.map((e, i) => [e, c[i]]));
    if (o.sex !== "SEX_T" || !filtre(o) || o.obs_value === "" || isNaN(Number(o.obs_value))) continue;
    if (Number(o.time) > Number(AUJOURDHUI.slice(0, 4))) continue; // pas de projections
    if (!meilleur || o.time > meilleur.annee) meilleur = { annee: o.time, valeur: Number(o.obs_value) };
  }
  return meilleur;
}

// ---------- Registre des Français (data.gouv.fr, fichier xlsx 2020) ----------
function registre() {
  const f = telecharger("registre-2020.xlsx", "https://static.data.gouv.fr/resources/francais-de-letranger-inscriptions-au-registre-des-francais-etablis-hors-de-france/20210203-132410/communaute-francaise-2020.xlsx");
  if (!f) return {};
  const xml = (n) => execFileSync("unzip", ["-p", f, n], { maxBuffer: 5e7 }).toString("utf8");
  const chaines = [...xml("xl/sharedStrings.xml").matchAll(/<si>(.*?)<\/si>/gs)].map((m) => [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1]).join(""));
  const res = {};
  for (const ligne of xml("xl/worksheets/sheet1.xml").matchAll(/<row[^>]*>(.*?)<\/row>/gs)) {
    const cellules = {};
    for (const c of ligne[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?/g)) {
      if (c[3] === undefined) continue;
      cellules[c[1]] = c[2].includes('t="s"') ? chaines[Number(c[3])] : c[3];
    }
    if (cellules.A && cellules.J && !isNaN(Number(cellules.J))) res[cellules.A] = Number(cellules.J);
  }
  return res;
}

// ---------- Villes, distance, décalage, climat ----------
function ville(p) {
  const d = json(`geo_${p.iso2}.json`, `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.villeRecherche)}&count=10&language=fr&format=json`);
  const r = (d?.results ?? []).filter((x) => x.country_code === p.iso2).sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
  return r ? { nom: p.ville, lat: r.latitude, lon: r.longitude, fuseau: r.timezone, population: r.population ?? null } : null;
}
const PARIS = { lat: 48.85341, lon: 2.3488 };
function distanceKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function decalageHeures(fuseau, date) {
  const heure = (tz) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(date).map((x) => [x.type, x.value]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  };
  return (heure(fuseau) - heure("Europe/Paris")) / 3600000;
}
function climat(p, v) {
  const d = json(`climat_${p.iso2}.json`, `https://archive-api.open-meteo.com/v1/archive?latitude=${v.lat}&longitude=${v.lon}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_mean&timezone=GMT`);
  if (!d?.daily?.time) return null;
  const somme = Array(12).fill(0), nb = Array(12).fill(0);
  d.daily.time.forEach((jour, i) => {
    const t = d.daily.temperature_2m_mean[i];
    if (t === null) return;
    const m = Number(jour.slice(5, 7)) - 1;
    somme[m] += t; nb[m]++;
  });
  const moy = somme.map((s, i) => s / nb[i]);
  return { froid: Math.min(...moy), chaud: Math.max(...moy) };
}

// ---------- Santé : grille fixe appliquée à des faits officiels ----------
const ACCORDS_CLEISS = ["argentine", "bresil", "canada", "chili", "coree-du-sud", "etats-unis", "japon", "maroc"];
const SOINS_TRES_CHERS = {
  argentine: "Les frais d'hospitalisation et de soins médicaux sont extrêmement élevés en Argentine.",
  chili: "Les frais médicaux y sont toutefois très élevés et des garanties de paiement sont exigées à l'admission.",
  "etats-unis": "L'infrastructure médicale est excellente aux États-Unis, mais d'un coût très élevé.",
  mexique: "Les frais d'hospitalisation et les dépenses de santé sont très élevés au Mexique.",
};
const cavSante = (id) => `https://www.diplomatie.gouv.fr/fr/information-par-pays/${id}/conseils-aux-voyageurs-sante`;
function sante(p) {
  const base = { statut: "verifie", verifieLe: AUJOURDHUI, annee: null };
  if (p.famille === "Europe sans visa")
    return { ...base, note: 5, texte: "La carte européenne d'assurance maladie est valable pour un séjour temporaire (recherche d'emploi comprise) dans l'Espace économique européen et en Suisse. Une fois embauché, tu relèves du système du pays.", source: "service-public-soins", lien: "https://www.service-public.gouv.fr/particuliers/vosdroits/F213" };
  if (p.id === "royaume-uni")
    return { ...base, note: 4, texte: "Avec un visa de travail, tu paies une surtaxe santé au moment de la demande, puis tu utilises le système public (NHS) sans frais dès le début du visa.", source: "gov-uk-sante", lien: "https://www.gov.uk/healthcare-immigration-application" };
  if (SOINS_TRES_CHERS[p.id])
    return { ...base, note: 1, texte: `France Diplomatie signale des soins très chers : « ${SOINS_TRES_CHERS[p.id]} » Une assurance privée solide est indispensable.`, source: "diplomatie-cav", lien: cavSante(p.id) };
  if (ACCORDS_CLEISS.includes(p.id))
    return { ...base, note: 3, texte: `La France a un accord de sécurité sociale en vigueur avec ce pays${p.id === "canada" ? " (et un accord séparé avec le Québec)" : ""}.${p.famille === "PVT" ? " Pour un PVT, une assurance privée reste exigée pour tout le séjour." : ""}`, source: "cleiss-accords", lien: "https://www.cleiss.fr/docs/textes/index.html" };
  return { ...base, note: 2, texte: `Ce pays ne figure pas dans la liste des accords de sécurité sociale en vigueur avec la France : une assurance privée est à prévoir.${p.famille === "PVT" ? " Pour un PVT, elle est exigée pour tout le séjour." : ""}`, source: "cleiss-accords", lien: "https://www.cleiss.fr/docs/textes/index.html" };
}

// ---------- Assemblage ----------
const inscrits = registre();
const scores = {};
const villes = {};
for (const p of pays) {
  console.log(p.nom, "…");
  const s = {};
  const lienBm = (b) => b.url;

  const e = dernier(bm.emploi.serie[p.iso3]);
  s.emploi = e ? verifie("emploi", e.valeur, `${fr(e.valeur)} % des 15-24 ans actifs sont au chômage (${e.annee}, estimation de l'OIT).`, "bm-wdi", lienBm(bm.emploi), e.annee) : aVerifier("Chômage des jeunes : pas de donnée dans cette source.");

  const sal = oit("EAR_EMTA_SEX_CUR_NB_A", p.iso3, (o) => o.classif1 === "CUR_TYPE_PPP");
  const ANNEE_MIN = Number(AUJOURDHUI.slice(0, 4)) - 6;
  if (sal && Number(sal.annee) < ANNEE_MIN) s.salaire = aVerifier(`Salaire moyen : la dernière donnée date de ${sal.annee}, elle est trop ancienne pour être comptée.`);
  else s.salaire = sal ? verifie("salaire", sal.valeur, `Salaire mensuel moyen des salariés : ${fr(sal.valeur, 0)} $ en pouvoir d'achat (${sal.annee}).`, "oit-ilostat", `https://rplumber.ilo.org/data/indicator/?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${p.iso3}&format=.csv`, sal.annee) : aVerifier("Salaire moyen : pas de donnée dans cette source.");

  const h = oit("HOW_TEMP_SEX_NB_A", p.iso3, () => true);
  s.heures = h ? verifie("heures", h.valeur, `${fr(h.valeur)} heures réellement travaillées par semaine en moyenne (${h.annee}).`, "oit-ilostat", `https://rplumber.ilo.org/data/indicator/?id=HOW_TEMP_SEX_NB_A&ref_area=${p.iso3}&format=.csv`, h.annee) : aVerifier("Heures travaillées : pas de donnée dans cette source.");
  s.conges = aVerifier("Congés payés légaux : le texte de loi de ce pays n'a pas encore été vérifié.");

  const n = inscrits[p.iso2];
  s.francais = n !== undefined ? verifie("francais", n, `${fr(n, 0)} Français inscrits au registre consulaire fin 2020. L'inscription n'est pas obligatoire : le vrai nombre est plus élevé.`, "meae-registre", "https://www.data.gouv.fr/datasets/5c5d559c8b4c4178380e6da7/", "2020") : aVerifier("Français inscrits : pas de donnée dans cette source.");

  const px = niveauPrix(p.iso3);
  if (px && prixFrance) {
    const indice = (px.valeur / prixFrance.valeur) * 100;
    s.prix = verifie("prix", indice, `Niveau des prix : ${fr(indice, 0)} pour une base de 100 en France (${px.annee}).`, "bm-wdi", lienBm(bm.ppa), px.annee);
  } else s.prix = aVerifier("Niveau des prix : pas de donnée dans cette source.");

  const ho = dernier(bm.homicides.serie[p.iso3]);
  s.securite = ho ? verifie("securite", ho.valeur, `${fr(ho.valeur)} homicide${ho.valeur >= 2 ? "s" : ""} pour 100 000 habitants (${ho.annee}).`, "bm-wdi", lienBm(bm.homicides), ho.annee) : aVerifier("Homicides : pas de donnée dans cette source.");

  const v = ville(p);
  if (v) {
    villes[p.id] = v;
    const km = distanceKm(PARIS, v);
    const vol = km / 800 + 0.5;
    s.vol = verifie("vol", vol, `${p.ville} est à environ ${fr(Math.round(km / 50) * 50, 0)} km de Paris, soit à peu près ${fr(Math.round(vol * 2) / 2)} h de vol direct (estimation).`, "geonames", `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.villeRecherche)}&count=10&language=fr&format=json`);
    const dec = decalageHeures(v.fuseau, new Date(Date.UTC(2026, 0, 15, 12)));
    const ete = decalageHeures(v.fuseau, new Date(Date.UTC(2026, 6, 15, 12)));
    const signe = (x) => (x === 0 ? "aucun décalage" : `${x > 0 ? "+" : "−"}${fr(Math.abs(x))} h`);
    s.decalage = verifie("decalage", Math.abs(dec), `Décalage avec Paris à ${p.ville} : ${signe(dec)} en janvier, ${signe(ete)} en juillet.`, "geonames", "https://www.iana.org/time-zones");
    s.decalage.lien = null;
    const c = climat(p, v);
    if (c) {
      const lien = `https://archive-api.open-meteo.com/v1/archive?latitude=${v.lat}&longitude=${v.lon}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_mean&timezone=GMT`;
      s.hiver = verifie("hiver", c.froid, `À ${p.ville}, le mois le plus froid tourne autour de ${fr(c.froid)} °C en moyenne (1991-2020).`, "open-meteo", lien, "1991-2020");
      s.ete = verifie("ete", c.chaud, `À ${p.ville}, le mois le plus chaud tourne autour de ${fr(c.chaud)} °C en moyenne (1991-2020).`, "open-meteo", lien, "1991-2020");
    }
  }
  s.vol ??= aVerifier("Distance : ville non trouvée.");
  s.decalage ??= aVerifier("Décalage horaire : ville non trouvée.");
  s.hiver ??= aVerifier("Climat : pas de donnée.");
  s.ete ??= aVerifier("Climat : pas de donnée.");

  s.sante = sante(p);

  for (const [id, b, nom] of [["stabilite", bm.stabilite, "Stabilité politique et absence de violence"], ["libertes", bm.libertes, "Voix et responsabilité (libertés d'expression, d'association, presse)"]]) {
    const x = dernier(b.serie[p.iso3]);
    s[id] = x ? verifie(id, x.valeur, `Indice « ${nom} » de la Banque mondiale : ${fr(x.valeur, 0)} sur 100 (${x.annee}).`, "bm-wgi", b.url, x.annee) : aVerifier(`Indice « ${nom} » : pas de donnée dans cette source.`);
  }
  s.egalite = aVerifier("Égalité femmes-hommes dans la loi : l'indice de la Banque mondiale n'a pas pu être téléchargé.");
  const a = dernier(bm.air.serie[p.iso3]);
  s.air = a ? verifie("air", a.valeur, `Particules fines (PM2,5) : ${fr(a.valeur)} µg/m³ en moyenne annuelle (${a.annee}).`, "bm-wdi", lienBm(bm.air), a.annee) : aVerifier("Qualité de l'air : pas de donnée dans cette source.");

  // Avis de la rédaction
  const av = avis[p.id];
  for (const id of ["anglais", "langue", "hierarchie", "communication", "ponctualite", "grande-ville", "ville-moyenne", "nature"]) {
    s[id] = av?.[id] ? { statut: "verifie", note: av[id].note, texte: av[id].texte, annee: null, source: "notre-avis", lien: null, verifieLe: AUJOURDHUI } : aVerifier("Pas encore d'avis rédigé.");
  }
  scores[p.id] = s;
}

const manquantes = [];
for (const p of pays) for (const [id, m] of Object.entries(scores[p.id])) if (m.statut !== "verifie") manquantes.push(`${p.nom} : ${mesures[id]?.nom ?? id}`);
fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify({ genereLe: AUJOURDHUI, villes, pays: scores }, null, 1) + "\n");
fs.writeFileSync(path.join(CACHE, "a-verifier.txt"), manquantes.join("\n") + "\n");
console.log(`\ncontent/scores.json écrit. Notes vérifiées : ${Object.values(scores).reduce((t, s) => t + Object.values(s).filter((m) => m.statut === "verifie").length, 0)}. À vérifier : ${manquantes.length}.`);
