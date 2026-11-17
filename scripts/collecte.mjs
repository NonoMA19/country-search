// Télécharge les données ouvertes et écrit content/scores.json.
// Usage : node scripts/collecte.mjs
//         node scripts/collecte.mjs --population   (télécharge seulement la population et recalcule le réseau français)
//         node scripts/collecte.mjs --textes   (réécrit seulement les phrases, sans rien télécharger :
//                                              les valeurs et les dates « vérifié le » restent celles du fichier)
//         node scripts/collecte.mjs --france   (télécharge seulement les valeurs de la France, pays repère non classé)
//         node scripts/collecte.mjs --oms      (télécharge seulement l'obésité des adultes, mesure « Manger sainement »)
//         node scripts/collecte.mjs --ocde     (salaire moyen de l'OCDE et part qui reste après impôts, depuis content/saisie/ocde.json)
//         node scripts/collecte.mjs --vie      (indemnité VIE par pays, depuis content/saisie/vie-indemnites.json)
//         node scripts/collecte.mjs --secteur  (part de l'emploi par secteur, ILOSTAT, CITI rév. 4)
//         node scripts/collecte.mjs --ajout id1,id2   (collecte seulement ces pays, ajoutés à pays.json, et les ajoute à scores.json :
//                                                     les autres pays ne changent pas. Puis lancer node scripts/vie.mjs.)
// Rien n'est inventé : une donnée absente devient « à vérifier » et reste hors calcul.
//
// Salaire (prompt 3f) : salaire annuel moyen de l'OCDE 2024 (dollars PPA, même année pour tous), saisi dans
// content/saisie/ocde.json (le site de l'OCDE est inaccessible depuis la session ; valeurs vérifiées hors session).
// La part qui reste après impôts (Taxing Wages 2026) est affichée dans la preuve, sans entrer dans le score.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const UA = "country-search-bot/0.1 (projet open source non commercial)";
const TEXTES_SEUL = process.argv.includes("--textes");
const POPULATION_SEULE = process.argv.includes("--population");
const FRANCE_SEULE = process.argv.includes("--france");
const OMS_SEULE = process.argv.includes("--oms");
const OCDE_SEULE = process.argv.includes("--ocde");
const VIE_SEULE = process.argv.includes("--vie");
const SECTEUR_SEUL = process.argv.includes("--secteur");
const AJOUT = process.argv.includes("--ajout") ? process.argv[process.argv.indexOf("--ajout") + 1].split(",") : null;

const lire = (f) => JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8"));
const pays = lire("pays.json");
const criteres = lire("criteres.json");
const avis = lire("saisie/avis.json");
// Culture au travail (prise de décision, vie pro et vie perso) : témoignages recoupés, saisis à la main.
const culture = lire("saisie/culture.json");
const mesures = Object.fromEntries(criteres.flatMap((c) => c.mesures.map((m) => [m.id, m])));

// curl plutôt que fetch : il respecte le proxy de la machine sans réglage.
function telecharger(nom, url) {
  if (TEXTES_SEUL || OCDE_SEULE || VIE_SEULE || (SECTEUR_SEUL && !nom.startsWith("ilo_eco_")) || (POPULATION_SEULE && !nom.startsWith("bm_pop_")) || (FRANCE_SEULE && !nom.startsWith("fr_")) || (OMS_SEULE && !nom.startsWith("bm_SH.STA.OB18"))) return null;
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

// « 2026-10-01 » → « 1er octobre 2026 ».
const dateLongue = (iso) => { const [a, m, j] = iso.split("-").map(Number); return `${j === 1 ? "1er" : j} ${["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][m - 1]} ${a}`; };
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

// Typographie française : espace insécable avant : ; ! ? %, apostrophes courbes (comme scripts/typo.py).
const typo = (t) => t.replace(/(?<=[A-Za-zÀ-ÿœŒ])'(?=[A-Za-zÀ-ÿœŒ])/g, "’").replace(/ +([:;!?%»])/g, "\u00a0$1").replace(/« +/g, "«\u00a0");
const typoTextes = (scores) => {
  for (const s of Object.values(scores)) for (const m of Object.values(s)) if (typeof m.texte === "string") m.texte = typo(m.texte);
};

// ---------- Les phrases affichées (une seule fonction par mesure) ----------
const pluriel = (n, mot) => `${mot}${Math.round(n * 10) / 10 >= 2 ? "s" : ""}`;
const TEXTE = {
  emploi: (v, an) => `Parmi les 15-24 ans qui travaillent ou cherchent un emploi, ${fr(v)} % sont au chômage (${an}, estimation de l'Organisation internationale du travail).`,
  salaire: (v, an, p, reste, bit) => `Salaire brut moyen d'un salarié à temps plein, tous métiers, avant impôts et cotisations : ${fr(v, 0)} $ par an, en dollars « à pouvoir d'achat égal », qui tiennent compte des prix du pays (OCDE, ${an}${bit ? " ; donnée du Bureau international du travail reprise par l'OCDE dans le même tableau" : ""}). ${reste === null || reste === undefined ? "La part qui reste après impôts n'est pas encore connue pour ce pays : à vérifier." : `Pour un célibataire au salaire moyen, sur 100 € bruts, il reste environ ${fr(reste, 0)} € après impôt sur le revenu et cotisations salariales (OCDE, Taxing Wages 2026, données 2025).`}`,
  "indemnite-vie": (v, an, p, ville, autres, bareme) => `Indemnité VIE ${p.en}${ville ? ` (${ville})` : ""} : ${fr(v, 0)} € par mois, soit ${fr(bareme.partFixe, 2)} € de part fixe et ${fr(v - bareme.partFixe, 0)} € d'indemnité supplémentaire (barème du ${dateLongue(bareme.dateBareme)}, ${bareme.arrete.charAt(0).toLowerCase()}${bareme.arrete.slice(1)}). Révisé chaque trimestre ; l'indemnité supplémentaire est réduite de 20 % si l'entreprise te loge.${autres?.length ? ` ${autres.map((a, i) => `${i ? a.ville : a.ville.charAt(0).toUpperCase() + a.ville.slice(1)} : ${a.montant ? `${fr(a.montant, 0)} €` : "à vérifier"}`).join(" ; ")}.` : ""}`,
  heures: (v, an) => `${fr(v)} heures réellement travaillées par semaine en moyenne (${an}).`,
  francais: (v, an, p, inscrits) => `${fr(inscrits, 0)} Français inscrits au registre consulaire fin 2020, soit ${fr(v, v < 10 ? 1 : 0)} pour 100 000 habitants (population 2020 : Banque mondiale, CC BY 4.0). C'est la donnée la plus récente publiée, mais elle est ancienne. L'inscription n'est pas obligatoire : le vrai nombre est plus élevé.`,
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
  doux: (h, an, p, e) => `À ${p.ville}, le mois le plus froid tourne autour de ${fr(h)} °C et le mois le plus chaud autour de ${fr(e)} °C (moyennes ${an}).`,
  "manger-sain": (v, an) => `Adultes en situation d'obésité : ${fr(v)} % (moyenne des taux des femmes et des hommes de 18 ans et plus, ${an}, estimation de l'Organisation mondiale de la santé). Plus c'est bas, plus on mange sainement en moyenne. L'alimentation n'est qu'une des causes de l'obésité : c'est un repère, pas une mesure de la cuisine du pays.`,
  air: (v, an) => `Particules fines dans l'air (PM2,5, des poussières assez petites pour entrer dans les poumons) : ${fr(v)} µg/m³ en moyenne sur l'année (${an}). Plus c'est bas, mieux c'est.`,
};

// Climat doux : la plus basse des deux notes, hiver et été (règle expliquée sur /methode).
// L'été n'a la note maximale qu'entre 18 et 23 °C : en dessous de 18 °C, il est « frais » (4).
function noteDoux(hiver, ete) {
  const h = hiver < -5 ? 1 : hiver < 2 ? 2 : hiver < 5 ? 3 : hiver < 8 ? 4 : 5;
  const e = ete >= 29 ? 1 : ete >= 27 ? 2 : ete >= 25 ? 3 : ete >= 23 ? 4 : ete >= 18 ? 5 : 4;
  return Math.min(h, e);
}
const doux = (hiver, ete, p) => ({
  statut: "verifie", note: noteDoux(hiver.valeur, ete.valeur), texte: TEXTE.doux(hiver.valeur, hiver.annee, p, ete.valeur),
  annee: hiver.annee, source: hiver.source, lien: hiver.lien, verifieLe: hiver.verifieLe,
});

// ---------- La France, pays repère (non classé) ----------
// Mêmes sources et mêmes règles que les 30 pays, pour comparer à ce qu'on connaît.
// Pas de mesure « par rapport à la France » (niveau des prix), ni de mesure par ville (distance, climat).
const FRANCE = { nom: "France", ville: "Paris", le: "la France", en: "en France", iso3: "FRA" };
const MESURES_FRANCE = ["emploi", "salaire", "heures", "securite", "air", "stabilite", "libertes", "manger-sain"];

// ---------- Banque mondiale ----------
const ISO3 = (AJOUT ? pays.filter((p) => AJOUT.includes(p.id)) : pays).map((p) => p.iso3).join(";");
function banqueMondiale(indicateur, extra = "") {
  const url = `https://api.worldbank.org/v2/country/${ISO3};FRA/indicator/${indicateur}?format=json&per_page=1000&date=2015:2026${extra}`;
  const d = json(`${AJOUT ? `ajout_${AJOUT.join("_")}_` : ""}bm_${indicateur}.json`, url);
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
  // Obésité des adultes (OMS, Global Health Observatory, relayée par la base Gender Statistics de la Banque mondiale).
  // Licence de l'OMS : CC BY-NC-SA 3.0 IGO, usage non commercial (à revoir si le site devient payant).
  obFemmes: banqueMondiale("SH.STA.OB18.FE.ZS", "&source=14"),
  obHommes: banqueMondiale("SH.STA.OB18.MA.ZS", "&source=14"),
};
// Manger sainement : la moyenne des taux d'obésité des femmes et des hommes, la dernière année où les deux existent.
function obesite(iso3) {
  const f = bm.obFemmes.serie[iso3], h = bm.obHommes.serie[iso3];
  if (!f || !h) return null;
  const an = Object.keys(f).filter((a) => h[a] !== undefined).sort().pop();
  return an ? { annee: an, valeur: (f[an] + h[an]) / 2 } : null;
}
const noteObesite = (iso3) => {
  const o = obesite(iso3);
  return o ? verifie("manger-sain", o.valeur, TEXTE["manger-sain"](o.valeur, o.annee), "oms-gho", bm.obFemmes.url, o.annee) : aVerifier("Obésité des adultes : pas de donnée dans cette source.");
};

// ---------- Mode --ocde : salaire moyen de l'OCDE et part qui reste après impôts ----------
const OCDE = lire("saisie/ocde.json");
function noteSalaire(id, p) {
  const v = id === "france" ? OCDE.salaire.france : OCDE.salaire.valeurs[id];
  const taux = id === "france" ? OCDE.impots.france : OCDE.impots.taux[id];
  const reste = typeof taux === "number" ? Math.round((100 - taux) * 10) / 10 : null;
  if (typeof v !== "number") return { ...aVerifier(OCDE.salaire.textesAVerifier?.[id] ?? "Salaire brut moyen : pas de chiffre comparable dans le tableau de l'OCDE pour ce pays (2024)."), ...(reste !== null ? { resteSur100: reste } : {}) };
  const n = verifie("salaire", v, TEXTE.salaire(v, OCDE.salaire.annee, p, reste, OCDE.salaire.bit.includes(id)), OCDE.salaire.source, OCDE.salaire.lien, OCDE.salaire.annee);
  return { ...n, verifieLe: OCDE.salaire.verifieLe, ...(reste !== null ? { resteSur100: reste, impots: { taux, source: OCDE.impots.source, lien: OCDE.impots.lien, annee: OCDE.impots.annee } } : {}) };
}
if (OCDE_SEULE) {
  const actuel = lire("scores.json");
  for (const p of pays) actuel.pays[p.id].salaire = noteSalaire(p.id, p);
  const france = actuel.reference?.france?.notes;
  if (france) france.salaire = noteSalaire("france", FRANCE);
  typoTextes(actuel.pays);
  if (france) typoTextes({ france });
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const p of pays) console.log(p.nom, actuel.pays[p.id].salaire.valeur ?? "à vérifier", actuel.pays[p.id].salaire.note ?? "", actuel.pays[p.id].salaire.resteSur100 ?? "");
  process.exit(0);
}

// ---------- Mode --vie : indemnité VIE (barème officiel, écrit par scripts/vie.mjs) ----------
const VIE = lire("saisie/vie-indemnites.json");
function noteVie(p) {
  if (VIE.destinations.horsListe.includes(p.id)) {
    return { statut: "verifie", note: null, texte: "VIE : pas dans les destinations de Business France.", source: VIE.destinations.source, lien: VIE.destinations.lien, verifieLe: VIE.destinations.verifieLe, annee: null };
  }
  const x = VIE.pays[p.id];
  if (!x) return aVerifier("Indemnité VIE : pas encore dans le barème saisi.");
  const n = verifie("indemnite-vie", x.montant, TEXTE["indemnite-vie"](x.montant, null, p, x.ville, x.autres, VIE), VIE.source, VIE.lien, VIE.dateBareme.slice(0, 4));
  return { ...n, verifieLe: VIE.verifieLe, ville: x.ville, autres: x.autres };
}
if (VIE_SEULE) {
  const actuel = lire("scores.json");
  for (const p of pays) actuel.pays[p.id]["indemnite-vie"] = noteVie(p);
  typoTextes(actuel.pays);
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const p of pays) console.log(p.nom, actuel.pays[p.id]["indemnite-vie"].valeur, actuel.pays[p.id]["indemnite-vie"].note);
  process.exit(0);
}

// ---------- Mode --secteur : la part de l'emploi du pays dans chaque secteur (ILOSTAT, CC BY 4.0) ----------
// Emploi par activité économique, CITI rév. 4 (indicateur EMP_TEMP_SEX_ECO_NB_A), femmes et hommes.
// Pour chaque pays : la dernière année disponible, à condition qu'elle soit 2019 ou plus récente ; part = section ÷ total,
// même source et même année. Note de 1 à 5 selon le rapport entre la part du pays et la médiane des 30 pays :
// moins de 0,7 → 1 ; moins de 0,9 → 2 ; moins de 1,1 → 3 ; moins de 1,3 → 4 ; 1,3 ou plus → 5.
const SECTEURS = { finance: "K", conseil: "M", ingenierie: "C", tech: "J", commerce: "G", sante: "Q", hotellerie: "I", enseignement: "P" };
const NOMS_SECTEURS = { finance: "la finance et la banque", conseil: "le conseil et l'audit", ingenierie: "l'ingénierie et l'industrie", tech: "la tech et la data", commerce: "le marketing et le commerce", sante: "la santé", hotellerie: "l'hôtellerie et le tourisme", enseignement: "l'enseignement et la recherche" };
const ANNEE_MIN_SECTEUR = 2019;
const LIEN_ILO_ECO = (iso3) => `https://rplumber.ilo.org/data/indicator/?id=EMP_TEMP_SEX_ECO_NB_A&ref_area=${iso3}&format=.csv`;
function emploiParSecteur(iso3) {
  const f = telecharger(`ilo_eco_${iso3}.csv`, LIEN_ILO_ECO(iso3));
  if (!f) return null;
  const lignes = fs.readFileSync(f, "utf8").replace(/^\ufeff/, "").trim().split("\n");
  const entetes = lignes[0].split(",").map((x) => x.replace(/"/g, ""));
  const parCle = {}; // "source|année" → { classif: valeur }
  for (const l of lignes.slice(1)) {
    const c = l.match(/("([^"]*)"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, "").replace(/^"|"$/g, ""));
    const o = Object.fromEntries(entetes.map((e, i) => [e, c[i]]));
    if (o.sex !== "SEX_T" || !o.classif1?.startsWith("ECO_ISIC4_") || o.obs_value === "" || isNaN(Number(o.obs_value))) continue;
    if (Number(o.time) > Number(AUJOURDHUI.slice(0, 4))) continue;
    (parCle[`${o.source}|${o.time}`] ??= {})[o.classif1.slice(10)] = Number(o.obs_value);
  }
  // La dernière année avec le total et les 8 sections ; à égalité d'année, la source la plus complète.
  const ok = Object.entries(parCle).filter(([, v]) => v.TOTAL > 0 && Object.values(SECTEURS).every((s) => v[s] !== undefined));
  ok.sort((a, b) => Number(b[0].split("|")[1]) - Number(a[0].split("|")[1]) || Object.keys(b[1]).length - Object.keys(a[1]).length);
  if (!ok.length) return null;
  const [cle, v] = ok[0];
  const annee = cle.split("|")[1];
  return { annee, parts: Object.fromEntries(Object.entries(SECTEURS).map(([id, s]) => [id, (100 * v[s]) / v.TOTAL])) };
}
const noteRapport = (r) => (r < 0.7 ? 1 : r < 0.9 ? 2 : r < 1.1 ? 3 : r < 1.3 ? 4 : 5);
if (SECTEUR_SEUL) {
  const actuel = lire("scores.json");
  const donnees = Object.fromEntries(pays.map((p) => [p.id, emploiParSecteur(p.iso3)]));
  const fra = emploiParSecteur("FRA");
  for (const id of Object.keys(SECTEURS)) {
    const valides = pays.filter((p) => donnees[p.id] && Number(donnees[p.id].annee) >= ANNEE_MIN_SECTEUR).map((p) => donnees[p.id].parts[id]).sort((a, b) => a - b);
    const mediane = valides.length ? (valides.length % 2 ? valides[(valides.length - 1) / 2] : (valides[valides.length / 2 - 1] + valides[valides.length / 2]) / 2) : null;
    const ref = fra && Number(fra.annee) >= ANNEE_MIN_SECTEUR ? fra.parts[id] : null;
    for (const p of pays) {
      const d = donnees[p.id];
      const cle = `secteur-${id}`;
      if (!d) { actuel.pays[p.id][cle] = aVerifier(`Emploi par secteur : pas de donnée dans cette source (ILOSTAT).`); continue; }
      if (Number(d.annee) < ANNEE_MIN_SECTEUR) { actuel.pays[p.id][cle] = aVerifier(`Emploi par secteur : la donnée la plus récente date de ${d.annee}, avant ${ANNEE_MIN_SECTEUR}. On ne la compte pas.`); continue; }
      const v = d.parts[id];
      const texte = `${NOMS_SECTEURS[id].charAt(0).toUpperCase() + NOMS_SECTEURS[id].slice(1)} : ${fr(v)} % des emplois ${p.en}${ref !== null ? `, ${fr(ref)} % en France` : ""} (${d.annee}, Organisation internationale du travail, ILOSTAT). Médiane des 30 pays : ${fr(mediane)} %. C'est la part de ce secteur dans l'emploi du pays, pas le nombre d'offres ouvertes.`;
      actuel.pays[p.id][cle] = { statut: "verifie", note: noteRapport(v / mediane), valeur: Math.round(v * 100) / 100, texte, annee: d.annee, source: "oit-ilostat", lien: LIEN_ILO_ECO(p.iso3), verifieLe: AUJOURDHUI, mediane: Math.round(mediane * 100) / 100 };
    }
    const france = actuel.reference?.france?.notes;
    if (france && ref !== null) france[`secteur-${id}`] = { statut: "verifie", note: noteRapport(ref / mediane), valeur: Math.round(ref * 100) / 100, texte: `${NOMS_SECTEURS[id].charAt(0).toUpperCase() + NOMS_SECTEURS[id].slice(1)} : ${fr(ref)} % des emplois en France (${fra.annee}, ILOSTAT).`, annee: fra.annee, source: "oit-ilostat", lien: LIEN_ILO_ECO("FRA"), verifieLe: AUJOURDHUI };
    console.log(id, "médiane", mediane && fr(mediane), "pays notés", valides.length);
  }
  typoTextes(actuel.pays);
  if (actuel.reference?.france?.notes) typoTextes({ france: actuel.reference.france.notes });
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const p of pays) console.log(p.nom, donnees[p.id]?.annee ?? "—", Object.keys(SECTEURS).map((id) => actuel.pays[p.id][`secteur-${id}`].note ?? "·").join(" "));
  process.exit(0);
}

// ---------- Mode --oms : seulement l'obésité des adultes ----------
if (OMS_SEULE) {
  const actuel = lire("scores.json");
  for (const p of pays) actuel.pays[p.id]["manger-sain"] = noteObesite(p.iso3);
  const france = actuel.reference?.france?.notes;
  if (france) france["manger-sain"] = noteObesite("FRA");
  typoTextes(actuel.pays);
  if (france) typoTextes({ france });
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const p of pays) console.log(p.nom, actuel.pays[p.id]["manger-sain"].valeur ?? "à vérifier");
  process.exit(0);
}
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
  const f = telecharger(`${FRANCE_SEULE ? "fr_" : ""}oit_${indicateur}_${iso3}.csv`,`https://rplumber.ilo.org/data/indicator/?id=${indicateur}&ref_area=${iso3}&format=.csv`);
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

// Les notes de la France. « series » : la dernière valeur de chaque indicateur de la Banque mondiale, avec son lien.
const LIEN_OIT = (ind, iso3) => `https://rplumber.ilo.org/data/indicator/?id=${ind}&ref_area=${iso3}&format=.csv`;
function notesFrance(series) {
  const note = (id, x, source, lien) => (x ? verifie(id, x.valeur, TEXTE[id](x.valeur, x.annee, FRANCE), source, lien, x.annee) : aVerifier("Pas de donnée dans cette source."));
  const res = {
    emploi: note("emploi", series.emploi?.x, "bm-wdi", series.emploi?.url),
    salaire: noteSalaire("france", FRANCE),
    heures: note("heures", oit("HOW_TEMP_SEX_NB_A", "FRA", () => true), "oit-ilostat", LIEN_OIT("HOW_TEMP_SEX_NB_A", "FRA")),
    securite: note("securite", series.homicides?.x, "bm-wdi", series.homicides?.url),
    air: note("air", series.air?.x, "bm-wdi", series.air?.url),
    stabilite: note("stabilite", series.stabilite?.x, "bm-wgi", series.stabilite?.url),
    libertes: note("libertes", series.libertes?.x, "bm-wgi", series.libertes?.url),
    "manger-sain": series.mangerSain ?? aVerifier("Pas de donnée dans cette source."),
  };
  return res;
}

// ---------- Mode --france : télécharger seulement les valeurs de la France ----------
if (FRANCE_SEULE) {
  const actuel = lire("scores.json");
  const INDICATEURS = { emploi: ["SL.UEM.1524.ZS", ""], homicides: ["VC.IHR.PSRC.P5", ""], air: ["EN.ATM.PM25.MC.M3", ""], stabilite: ["GOV_WGI_PV.SC", "&source=3"], libertes: ["GOV_WGI_VA.SC", "&source=3"] };
  const series = {};
  for (const [k, [ind, extra]] of Object.entries(INDICATEURS)) {
    const url = `https://api.worldbank.org/v2/country/FRA/indicator/${ind}?format=json&per_page=1000&date=2015:2026${extra}`;
    const d = json(`fr_bm_${ind}.json`, url);
    const serie = {};
    for (const l of Array.isArray(d?.[1]) ? d[1] : []) if (l.value !== null) serie[l.date] = l.value;
    series[k] = { x: dernier(Object.keys(serie).length ? serie : null), url };
  }
  const notes = notesFrance(series);
  // Une donnée déjà vérifiée n'est jamais remplacée par un échec de téléchargement.
  const avant = actuel.reference?.france?.notes ?? {};
  for (const id of MESURES_FRANCE) if (notes[id].statut !== "verifie" && avant[id]?.statut === "verifie") notes[id] = avant[id];
  actuel.reference = { france: { nom: FRANCE.nom, notes } };
  typoTextes({ france: notes });
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const id of MESURES_FRANCE) console.log(id, notes[id].statut === "verifie" ? `${notes[id].valeur} (${notes[id].annee})` : notes[id].texte);
  process.exit(0);
}

// ---------- Population (Banque mondiale, SP.POP.TOTL), pays par pays : la requête groupée est trop lente ----------
// Même année que le registre des Français (2020). Taïwan n'est pas dans la base : réseau français « à vérifier ».
const ANNEE_REGISTRE = "2020";
function population(iso3) {
  const d = json(`bm_pop_${iso3}_${ANNEE_REGISTRE}.json`, `https://api.worldbank.org/v2/country/${iso3}/indicator/SP.POP.TOTL?format=json&date=${ANNEE_REGISTRE}`);
  const v = Array.isArray(d?.[1]) ? d[1][0]?.value : null;
  return typeof v === "number" && v > 0 ? v : null;
}
const LIEN_REGISTRE = "https://www.data.gouv.fr/datasets/5c5d559c8b4c4178380e6da7/";
function reseauFrancais(p, inscrits, verifieLe) {
  if (inscrits === undefined || inscrits === null) return aVerifier("Français inscrits : pas de donnée dans cette source.");
  const pop = population(p.iso3);
  if (!pop) return { ...aVerifier(`${fr(inscrits, 0)} Français inscrits au registre consulaire fin 2020. La population du pays n'est pas dans la base de la Banque mondiale : la part pour 100 000 habitants reste à vérifier.`), inscrits };
  const ratio = (inscrits / pop) * 100000;
  return { ...verifie("francais", ratio, TEXTE.francais(ratio, ANNEE_REGISTRE, p, inscrits), "meae-registre", LIEN_REGISTRE, ANNEE_REGISTRE), inscrits, population: pop, verifieLe };
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
// Accords de sécurité sociale en vigueur avec la France (liste du Cleiss, relue le 17 novembre 2026).
const ACCORDS_CLEISS = ["argentine", "bresil", "canada", "chili", "coree-du-sud", "etats-unis", "japon", "maroc", "cote-d-ivoire", "inde", "senegal", "uruguay"];
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
  return { ...base, note: 2, texte: `${majuscule(p.le)} ne figure${p.pluriel ? "nt" : ""} pas dans la liste des accords de sécurité sociale en vigueur avec la France : une assurance privée est à prévoir${pvt ? ", et le PVT l'exige pour tout le séjour" : ""}.`, source: "cleiss-accords", lien: "https://www.cleiss.fr/docs/textes/index.html" };
}

// ---------- Avis de la rédaction ----------
function notesAvis(p, verifieLe = AUJOURDHUI) {
  const av = avis[p.id];
  const res = {};
  const note = (n, texte) => ({ statut: "verifie", note: n, texte, annee: null, source: "notre-avis", lien: null, verifieLe });
  for (const id of ["anglais", "langue", "hierarchie", "communication", "ponctualite"]) {
    res[id] = av?.[id] ? note(av[id].note, av[id].texte) : aVerifier("Pas encore d'avis rédigé.");
  }
  // Témoignages : au moins deux sources concordantes, avec une confiance « bonne » ou « moyenne ».
  for (const id of ["decision", "pro-perso"]) {
    const t = culture[p.id]?.[id];
    res[id] = t?.note
      ? { statut: "verifie", note: t.note, texte: t.texte, annee: null, source: "temoignages", lien: null, liens: t.sources, confiance: t.confiance, verifieLe: culture.verifieLe }
      : aVerifier("Pas encore assez de témoignages concordants pour donner une note.");
  }
  // Langue à apprendre : tirée de la langue du quotidien (pénalité du dilemme « Les cours offerts »).
  // Autre écriture = 1 ; autre langue à alphabet latin ou langue proche du français = 3 ; anglais ou français = 5.
  const APPRENDRE = { 1: 1, 2: 3, 3: 5, 4: 3, 5: 5 };
  const PHRASE_APPRENDRE = {
    1: "Pour vivre ici sans aide, il faut apprendre une langue qui s'écrit avec un autre alphabet.",
    3: "Pour vivre ici sans aide, il faut apprendre une autre langue, avec le même alphabet.",
    5: "Le français ou l'anglais suffisent au quotidien : pas de nouvelle langue à apprendre.",
  };
  const l = res.langue;
  res["apprendre-langue"] = l?.statut === "verifie" ? note(APPRENDRE[l.note], PHRASE_APPRENDRE[APPRENDRE[l.note]]) : aVerifier("Pas encore d'avis rédigé.");
  // Un seul paragraphe pour les trois mesures de la taille de ville.
  for (const id of ["grande-ville", "ville-moyenne", "nature"]) {
    res[id] = av?.villes?.[id] ? note(av.villes[id], av.villes.texte) : aVerifier("Pas encore d'avis rédigé.");
  }
  return res;
}

// ---------- Mode --population : télécharger la population et recalculer le réseau français ----------
if (POPULATION_SEULE) {
  const actuel = lire("scores.json");
  for (const p of pays) {
    const f = actuel.pays[p.id].francais;
    // Avant le prompt 3c, « valeur » était le nombre d'inscrits ; ensuite, il est gardé dans « inscrits ».
    const n = f.inscrits ?? (f.statut === "verifie" ? f.valeur : null);
    actuel.pays[p.id].francais = reseauFrancais(p, n, AUJOURDHUI);
    console.log(p.nom, actuel.pays[p.id].francais.note ?? "à vérifier");
  }
  typoTextes(actuel.pays);
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  process.exit(0);
}

// ---------- Mode --textes : réécrire les phrases sans rien télécharger ----------
if (TEXTES_SEUL) {
  const actuel = lire("scores.json");
  for (const p of pays) {
    const s = actuel.pays[p.id];
    for (const [id, m] of Object.entries(s)) {
      if (m.statut !== "verifie" || m.valeur === undefined || !TEXTE[id] || id === "salaire" || id === "indemnite-vie") continue;
      if (id === "francais") { m.texte = TEXTE.francais(m.valeur, m.annee, p, m.inscrits); continue; }
      const km = id === "vol" ? Number((m.texte.match(/environ ([\d\s]+) km/)?.[1] ?? "").replace(/\s/g, "")) : null;
      if (id === "vol" && !km) continue;
      m.texte = TEXTE[id](m.valeur, m.annee, p, km);
    }
    if (s.hiver?.statut === "verifie" && s.ete?.statut === "verifie") s.doux = doux(s.hiver, s.ete, p);
    s.sante = sante(p, s.sante?.verifieLe ?? AUJOURDHUI);
    const dateAvis = s.anglais?.verifieLe ?? AUJOURDHUI;
    Object.assign(s, notesAvis(p, dateAvis));
    delete s.conges;
    s.salaire = noteSalaire(p.id, p);
    s["indemnite-vie"] = noteVie(p);
  }
  const france = actuel.reference?.france?.notes;
  if (france) {
    for (const [id, m] of Object.entries(france)) if (m.statut === "verifie" && TEXTE[id] && id !== "salaire") m.texte = TEXTE[id](m.valeur, m.annee, FRANCE);
    france.salaire = noteSalaire("france", FRANCE);
    typoTextes({ france });
  }
  typoTextes(actuel.pays);
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  console.log("Phrases réécrites. Valeurs et dates inchangées.");
  process.exit(0);
}

// ---------- Assemblage ----------
// Un pays, toutes ses mesures. « inscrits » : le registre des Français (null pour un pays ajouté : voir --ajout).
function assembler(p, inscrits, villes) {
  console.log(p.nom, "…");
  const s = {};
  const lienBm = (b) => b.url;

  const e = dernier(bm.emploi.serie[p.iso3]);
  s.emploi = e ? verifie("emploi", e.valeur, TEXTE.emploi(e.valeur, e.annee), "bm-wdi", lienBm(bm.emploi), e.annee) : aVerifier("Chômage des jeunes : pas de donnée dans cette source.");

  s.salaire = noteSalaire(p.id, p);
  s["indemnite-vie"] = noteVie(p);

  const h = oit("HOW_TEMP_SEX_NB_A", p.iso3, () => true);
  s.heures = h ? verifie("heures", h.valeur, TEXTE.heures(h.valeur, h.annee), "oit-ilostat", `https://rplumber.ilo.org/data/indicator/?id=HOW_TEMP_SEX_NB_A&ref_area=${p.iso3}&format=.csv`, h.annee) : aVerifier("Heures travaillées : pas de donnée dans cette source.");

  s.francais = inscrits ? reseauFrancais(p, inscrits[p.iso2], AUJOURDHUI) : aVerifier("Français inscrits : la source à utiliser pour ce pays est le Rapport du Gouvernement 2025 sur les Français établis hors de France (inscrits au 31 décembre 2025). Pas encore saisi.");

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
  s.doux = s.hiver.statut === "verifie" && s.ete.statut === "verifie" ? doux(s.hiver, s.ete, p) : aVerifier("Climat : pas de donnée.");

  s.sante = sante(p);

  for (const id of ["stabilite", "libertes"]) {
    const x = dernier(bm[id].serie[p.iso3]);
    s[id] = x ? verifie(id, x.valeur, TEXTE[id](x.valeur, x.annee), "bm-wgi", bm[id].url, x.annee) : aVerifier("Pas de donnée dans cette source.");
  }
  const eg = dernier(bm.egalite.serie[p.iso3]);
  s.egalite = eg ? verifie("egalite", eg.valeur, TEXTE.egalite(eg.valeur, eg.annee), "bm-wbl", bm.egalite.url, eg.annee) : aVerifier("Égalité femmes-hommes dans la loi : pas de donnée dans cette source.");
  const a = dernier(bm.air.serie[p.iso3]);
  s.air = a ? verifie("air", a.valeur, TEXTE.air(a.valeur, a.annee), "bm-wdi", lienBm(bm.air), a.annee) : aVerifier("Qualité de l'air : pas de donnée dans cette source.");

  s["manger-sain"] = noteObesite(p.iso3);

  Object.assign(s, notesAvis(p));
  return s;
}

// ---------- Mode --ajout : seulement les pays nommés, ajoutés à scores.json ----------
if (AJOUT) {
  const actuel = lire("scores.json");
  for (const id of AJOUT) {
    const p = pays.find((x) => x.id === id);
    if (!p) throw new Error(`--ajout : ${id} n'est pas dans pays.json`);
    const s = assembler(p, null, actuel.villes);
    // Heures et secteurs viennent de l'OIT : sans donnée téléchargée, ils restent « à vérifier » (jamais un chiffre inventé).
    for (const sect of Object.keys(SECTEURS)) s[`secteur-${sect}`] = aVerifier("Emploi par secteur : pas encore de donnée de l'Organisation internationale du travail pour ce pays (source injoignable depuis la session).");
    actuel.pays[id] = s;
  }
  typoTextes(actuel.pays);
  fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify(actuel, null, 1) + "\n");
  for (const id of AJOUT) {
    const s = actuel.pays[id];
    const ok = Object.entries(s).filter(([, m]) => m.statut === "verifie" && m.note !== null);
    console.log(`${id} : ${ok.length} mesures notées ; à vérifier : ${Object.entries(s).filter(([, m]) => m.statut !== "verifie").map(([k]) => k).join(", ")}`);
  }
  process.exit(0);
}

const inscrits = registre();
const scores = {};
const villes = {};
for (const p of pays) scores[p.id] = assembler(p, inscrits, villes);

const pourFrance = (k) => ({ x: dernier(bm[k].serie.FRA), url: bm[k].url });
const france = notesFrance({ emploi: pourFrance("emploi"), homicides: pourFrance("homicides"), air: pourFrance("air"), stabilite: pourFrance("stabilite"), libertes: pourFrance("libertes"), mangerSain: noteObesite("FRA") });
typoTextes({ france });

const manquantes = [];
for (const p of pays) for (const [id, m] of Object.entries(scores[p.id])) if (m.statut !== "verifie") manquantes.push(`${p.nom} : ${mesures[id]?.nom ?? id}`);
typoTextes(scores);
fs.writeFileSync(path.join(RACINE, "content", "scores.json"), JSON.stringify({ genereLe: AUJOURDHUI, villes, pays: scores, reference: { france: { nom: FRANCE.nom, notes: france } } }, null, 1) + "\n");
fs.writeFileSync(path.join(CACHE, "a-verifier.txt"), manquantes.join("\n") + "\n");
console.log(`\ncontent/scores.json écrit. Notes vérifiées : ${Object.values(scores).reduce((t, s) => t + Object.values(s).filter((m) => m.statut === "verifie").length, 0)}. À vérifier : ${manquantes.length}.`);
