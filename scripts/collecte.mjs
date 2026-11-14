// Télécharge les données ouvertes et écrit content/scores.json.
// Usage : node scripts/collecte.mjs
//         node scripts/collecte.mjs --textes   (réécrit seulement les phrases, sans rien télécharger :
//                                              les valeurs et les dates « vérifié le » restent celles du fichier)
// Rien n'est inventé : une donnée absente devient « à vérifier » et reste hors calcul.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const UA = "country-search-bot/0.1 (projet open source non commercial)";
const TEXTES_SEUL = process.argv.includes("--textes");

const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8"));
const pays = lire("pays.json");
const criteres = lire("criteres.json");
const avis = lire("saisie/avis.json");
const mesures = Object.fromEntries(criteres.flatMap((c) => c.mesures.map((m) => [m.id, m])));

// curl plutôt que fetch : il respecte le proxy de la machine sans réglage.
function telecharger(nom, url) {
  if (TEXTES_SEUL) return null;
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

// ---------- Les phrases affichées (une seule fonction par mesure) ----------
const pluriel = (n, mot) => `${mot}${Math.round(n * 10) / 10 >= 2 ? "s" : ""}`;
const TEXTE = {
  emploi: (v, an) => `Parmi les 15-24 ans qui travaillent ou cherchent un emploi, ${fr(v)} % sont au chômage (${an}, estimation de l'Organisation internationale du travail).`,
  salaire: (v, an) => `Salaire moyen des salariés : ${fr(v, 0)} $ par mois, en dollars « à pouvoir d'achat égal », qui tiennent compte des prix du pays (${an}).`,
  heures: (v, an) => `${fr(v)} heures réellement travaillées par semaine en moyenne (${an}).`,
  francais: (v) => `${fr(v, 0)} Français inscrits au registre consulaire fin 2020. C'est la donnée la plus récente publiée, mais elle est ancienne. L'inscription n'est pas obligatoire : le vrai nombre est plus élevé.`,
  prix: (v, an) => {
    const ecart = Math.round(v - 100);
    const phrase = Math.abs(ecart) <= 3 ? "à peu près comme en France" : `environ ${Math.abs(ecart)} % ${ecart > 0 ? "plus cher" : "moins cher"} qu'en France`;
    return `Niveau des prix : ${fr(v, 0)} pour 100 en France (${an}). La vie y coûte ${phrase}.`;
  },
  securite: (v, an) => `${fr(v)} ${pluriel(v, "homicide")} pour 100 000 habitants (${an}).`,
  vol: (v, an, p, km) => `${p.ville} est à environ ${fr(Math.round(km / 50) * 50, 0)} km de Paris : compte au moins ${fr(Math.round(v * 2) / 2)} h de vol (estimation du temps en l'air, sans les escales).`,
  hiver: (v, an, p) => `À ${p.ville}, le mois le plus froid tourne autour de ${fr(v)} °C en moyenne (${an}).`,
  ete: (v, an, p) => `À ${p.ville}, le mois le plus chaud tourne autour de ${fr(v)} °C en moyenne (${an}).`,
  stabilite: (v, an) => `Note de la Banque mondiale pour la stabilité politique et l'absence de violence : ${fr(v, 0)} sur 100 (${an}). Plus la note est haute, plus le pays est stable.`,
  libertes: (v, an) => `Note de la Banque mondiale pour les libertés d'expression, d'association et de la presse : ${fr(v, 0)} sur 100 (${an}). Plus la note est haute, plus ces libertés sont respectées.`,
  egalite: (v, an) => `Note de la Banque mondiale pour l'égalité entre femmes et hommes dans les lois (travail, salaire, mariage, sécurité…) : ${fr(v, 0)} sur 100 (${an}). Plus la note est haute, plus la loi est égale.`,
  air: (v, an) => `Particules fines dans l'air (PM2,5, des poussières assez petites pour entrer dans les poumons) : ${fr(v)} µg/m³ en moyenne sur l'année (${an}). Plus c'est bas, mieux c'est.`,
};

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
  // Indice « Les femmes, l'entreprise et le droit » 2024, cadre juridique (base Gender Statistics).
  egalite: banqueMondiale("GD_WBL_OVL_LAW", "&source=14"),
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
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function sante(p, verifieLe = AUJOURDHUI) {
  const base = { statut: "verifie", verifieLe, annee: null };
  const pvt = p.famille === "PVT";
  if (p.famille === "Europe sans visa")
    return { ...base, note: 5, texte: `La carte européenne d'assurance maladie est valable ${p.en} pendant un séjour temporaire, recherche d'emploi comprise. Une fois embauché sur place, tu dépends du système de santé du pays.`, source: "service-public-soins", lien: "https://www.service-public.gouv.fr/particuliers/vosdroits/F213" };
  if (p.id === "royaume-uni")
    return { ...base, note: 4, texte: "Avec un visa de travail, tu paies une surtaxe santé au moment de la demande, puis tu utilises le système public (NHS) sans frais dès le début du visa.", source: "gov-uk-sante", lien: "https://www.gov.uk/healthcare-immigration-application" };
  if (SOINS_TRES_CHERS[p.id])
    return { ...base, note: 1, texte: `France Diplomatie signale des soins très chers : « ${SOINS_TRES_CHERS[p.id]} » Une assurance privée solide est indispensable.`, source: "diplomatie-cav", lien: cavSante(p.id) };
  if (ACCORDS_CLEISS.includes(p.id))
    return { ...base, note: 3, texte: `La France a un accord de sécurité sociale en vigueur avec ${p.le}${p.id === "canada" ? " (et un accord séparé avec le Québec)" : ""}.${pvt ? " Pour un PVT, une assurance privée reste exigée pour tout le séjour." : ""}`, source: "cleiss-accords", lien: "https://www.cleiss.fr/docs/textes/index.html" };
  return { ...base, note: 2, texte: `${majuscule(p.le)} ne figure pas dans la liste des accords de sécurité sociale en vigueur avec la France : une assurance privée est à prévoir${pvt ? ", et le PVT l'exige pour tout le séjour" : ""}.`, source: "cleiss-accords", lien: "https://www.cleiss.fr/docs/textes/index.html" };
}

// ---------- Avis de la rédaction ----------
function notesAvis(p, verifieLe = AUJOURDHUI) {
  const av = avis[p.id];
  const res = {};
  const note = (n, texte) => ({ statut: "verifie", note: n, texte, annee: null, source: "notre-avis", lien: null, verifieLe });
  for (const id of ["anglais", "langue", "hierarchie", "communication", "ponctualite"]) {
    res[id] = av?.[id] ? note(av[id].note, av[id].texte) : aVerifier("Pas encore d'avis rédigé.");
  }
  // Un seul paragraphe pour les trois mesures de la taille de ville.
  for (const id of ["grande-ville", "ville-moyenne", "nature"]) {
    res[id] = av?.villes?.[id] ? note(av.villes[id], av.villes.texte) : aVerifier("Pas encore d'avis rédigé.");
  }
  return res;
}

// ---------- Mode --textes : réécrire les phrases sans rien télécharger ----------
if (TEXTES_SEUL) {
  const actuel = lire("scores.json");
  for (const p of pays) {
    const s = actuel.pays[p.id];
    for (const [id, m] of Object.entries(s)) {
      if (m.statut !== "verifie" || m.valeur === undefined || !TEXTE[id]) continue;
      const km = id === "vol" ? Number((m.texte.match(/environ ([\d\s]+) km/)?.[1] ?? "").replace(/\s/g, "")) : null;
      if (id === "vol" && !km) continue;
      m.texte = TEXTE[id](m.valeur, m.annee, p, km);
    }
    s.sante = sante(p, s.sante?.verifieLe ?? AUJOURDHUI);
    const dateAvis = s.anglais?.verifieLe ?? AUJOURDHUI;
    Object.assign(s, notesAvis(p, dateAvis));
    delete s.conges;
  }
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  console.log("Phrases réécrites. Valeurs et dates inchangées.");
  process.exit(0);
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
  s.emploi = e ? verifie("emploi", e.valeur, TEXTE.emploi(e.valeur, e.annee), "bm-wdi", lienBm(bm.emploi), e.annee) : aVerifier("Chômage des jeunes : pas de donnée dans cette source.");

  const sal = oit("EAR_EMTA_SEX_CUR_NB_A", p.iso3, (o) => o.classif1 === "CUR_TYPE_PPP");
  const ANNEE_MIN = Number(AUJOURDHUI.slice(0, 4)) - 6;
  if (sal && Number(sal.annee) < ANNEE_MIN) s.salaire = aVerifier(`Salaire moyen : la dernière donnée date de ${sal.annee}, elle est trop ancienne pour être comptée.`);
  else s.salaire = sal ? verifie("salaire", sal.valeur, TEXTE.salaire(sal.valeur, sal.annee), "oit-ilostat", `https://rplumber.ilo.org/data/indicator/?id=EAR_EMTA_SEX_CUR_NB_A&ref_area=${p.iso3}&format=.csv`, sal.annee) : aVerifier("Salaire moyen : pas de donnée dans cette source.");

  const h = oit("HOW_TEMP_SEX_NB_A", p.iso3, () => true);
  s.heures = h ? verifie("heures", h.valeur, TEXTE.heures(h.valeur, h.annee), "oit-ilostat", `https://rplumber.ilo.org/data/indicator/?id=HOW_TEMP_SEX_NB_A&ref_area=${p.iso3}&format=.csv`, h.annee) : aVerifier("Heures travaillées : pas de donnée dans cette source.");

  const n = inscrits[p.iso2];
  s.francais = n !== undefined ? verifie("francais", n, TEXTE.francais(n), "meae-registre", "https://www.data.gouv.fr/datasets/5c5d559c8b4c4178380e6da7/", "2020") : aVerifier("Français inscrits : pas de donnée dans cette source.");

  const px = niveauPrix(p.iso3);
  if (px && prixFrance) {
    const indice = (px.valeur / prixFrance.valeur) * 100;
    s.prix = verifie("prix", indice, TEXTE.prix(indice, px.annee), "bm-wdi", lienBm(bm.ppa), px.annee);
  } else s.prix = aVerifier("Niveau des prix : pas de donnée dans cette source.");

  const ho = dernier(bm.homicides.serie[p.iso3]);
  s.securite = ho ? verifie("securite", ho.valeur, TEXTE.securite(ho.valeur, ho.annee), "bm-wdi", lienBm(bm.homicides), ho.annee) : aVerifier("Homicides : pas de donnée dans cette source.");

  const v = ville(p);
  if (v) {
    villes[p.id] = v;
    const km = distanceKm(PARIS, v);
    const vol = km / 800 + 0.5;
    s.vol = verifie("vol", vol, TEXTE.vol(vol, null, p, km), "geonames", `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.villeRecherche)}&count=10&language=fr&format=json`);
    const dec = decalageHeures(v.fuseau, new Date(Date.UTC(2026, 0, 15, 12)));
    const ete = decalageHeures(v.fuseau, new Date(Date.UTC(2026, 6, 15, 12)));
    const signe = (x) => (x === 0 ? "aucun décalage" : `${x > 0 ? "+" : "−"}${fr(Math.abs(x))} h`);
    s.decalage = verifie("decalage", Math.abs(dec), `Décalage avec Paris à ${p.ville} : ${signe(dec)} en janvier, ${signe(ete)} en juillet.`, "geonames", "https://www.iana.org/time-zones");
    s.decalage.lien = null;
    const c = climat(p, v);
    if (c) {
      const lien = `https://archive-api.open-meteo.com/v1/archive?latitude=${v.lat}&longitude=${v.lon}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_mean&timezone=GMT`;
      s.hiver = verifie("hiver", c.froid, TEXTE.hiver(c.froid, "1991-2020", p), "open-meteo", lien, "1991-2020");
      s.ete = verifie("ete", c.chaud, TEXTE.ete(c.chaud, "1991-2020", p), "open-meteo", lien, "1991-2020");
    }
  }
  s.vol ??= aVerifier("Distance : ville non trouvée.");
  s.decalage ??= aVerifier("Décalage horaire : ville non trouvée.");
  s.hiver ??= aVerifier("Climat : pas de donnée.");
  s.ete ??= aVerifier("Climat : pas de donnée.");

  s.sante = sante(p);

  for (const id of ["stabilite", "libertes"]) {
    const x = dernier(bm[id].serie[p.iso3]);
    s[id] = x ? verifie(id, x.valeur, TEXTE[id](x.valeur, x.annee), "bm-wgi", bm[id].url, x.annee) : aVerifier("Pas de donnée dans cette source.");
  }
  const eg = dernier(bm.egalite.serie[p.iso3]);
  s.egalite = eg ? verifie("egalite", eg.valeur, TEXTE.egalite(eg.valeur, eg.annee), "bm-wbl", bm.egalite.url, eg.annee) : aVerifier("Égalité femmes-hommes dans la loi : pas de donnée dans cette source.");
  const a = dernier(bm.air.serie[p.iso3]);
  s.air = a ? verifie("air", a.valeur, TEXTE.air(a.valeur, a.annee), "bm-wdi", lienBm(bm.air), a.annee) : aVerifier("Qualité de l'air : pas de donnée dans cette source.");

  Object.assign(s, notesAvis(p));
  scores[p.id] = s;
}

const manquantes = [];
for (const p of pays) for (const [id, m] of Object.entries(scores[p.id])) if (m.statut !== "verifie") manquantes.push(`${p.nom} : ${mesures[id]?.nom ?? id}`);
fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify({ genereLe: AUJOURDHUI, villes, pays: scores }, null, 1) + "\n");
fs.writeFileSync(path.join(CACHE, "a-verifier.txt"), manquantes.join("\n") + "\n");
console.log(`\ncontent/scores.json écrit. Notes vérifiées : ${Object.values(scores).reduce((t, s) => t + Object.values(s).filter((m) => m.statut === "verifie").length, 0)}. À vérifier : ${manquantes.length}.`);
