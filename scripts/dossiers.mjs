// Construit content/dossiers/<pays>.json.
// Règle absolue : aucune adresse devinée. Chaque lien vient d'une page officielle
// et il est ouvert ici, un par un. S'il ne répond pas, le lien reste « à vérifier » et n'est pas affiché.
// Usage : node scripts/dossiers.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const UA = "country-search-bot/0.1 (projet open source non commercial)";
const pays = JSON.parse(fs.readFileSync(path.join(RACINE, "content", "pays.json"), "utf8"));

const dejaVus = new Map();
function ouvre(url) {
  if (!url) return false;
  if (dejaVus.has(url)) return dejaVus.get(url);
  let ok = false;
  for (let essai = 1; essai <= 2 && !ok; essai++) {
    try {
      const code = execFileSync("curl", ["-sS", "-L", "-m", "45", "-A", UA, "-o", "/dev/null", "-w", "%{http_code}", url], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      ok = code === "200";
    } catch {
      ok = false;
    }
  }
  dejaVus.set(url, ok);
  console.log(ok ? "  ok " : "  ✗  ", url);
  return ok;
}
const lien = (id, titre, nom, url) => (ouvre(url) ? { id, titre, nom, url, statut: "verifie" } : { id, titre, nom, url: null, statut: "a-verifier" });

const DIPLO = "https://www.diplomatie.gouv.fr/fr";
const PVT = `${DIPLO}/services-aux-francaises-et-aux-francais/preparer-son-expatriation/programme-vacances-travail-pvt`;
const REGISTRE = `${DIPLO}/services-aux-francaises-et-aux-francais/formalites-avant-le-depart/sinscrire-au-registre-des-francais-etablis-hors-de-france`;
const EUROPE = "https://europa.eu/youreurope/citizens/work/work-abroad/index_fr.htm";
const infoPays = (id, page) => `${DIPLO}/information-par-pays/${id}/${page}`;

// Page officielle du visa. Adresses lues sur les sites officiels, jamais devinées.
const VISA = {
  canada: ["Expérience internationale Canada (gouvernement du Canada)", "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/eic.html"],
  "nouvelle-zelande": ["Visa vacances-travail pour les Français (Immigration New Zealand, en anglais)", "https://www.immigration.govt.nz/visas/france-working-holiday-visa/"],
  "royaume-uni": ["Skilled Worker visa (GOV.UK, en anglais)", "https://www.gov.uk/skilled-worker-visa"],
  singapour: ["Employment Pass (Ministry of Manpower, en anglais)", "https://www.mom.gov.sg/passes-and-permits/employment-pass/eligibility"],
};
// Ambassade ou consulat : adresses lues sur les pages « Contacts utiles » de France Diplomatie.
const CONSULAT = {
  belgique: ["Consulat général de France à Bruxelles", "https://bruxelles.consulfrance.org/"],
  suisse: ["Ambassade de France en Suisse", "https://ch.ambafrance.org/"],
  allemagne: ["Ambassade de France en Allemagne", "https://de.ambafrance.org/-Francais-"],
  irlande: ["Ambassade de France en Irlande", "https://ie.ambafrance.org/"],
  canada: ["Ambassade de France au Canada", "https://ca.ambafrance.org/"],
  australie: ["Ambassade de France en Australie", "https://au.ambafrance.org/"],
  japon: ["Ambassade de France au Japon", "https://jp.ambafrance.org/"],
  "royaume-uni": ["Ambassade de France au Royaume-Uni", "https://uk.ambafrance.org/-Francais-"],
  "etats-unis": ["Ambassade de France aux États-Unis", "https://fr.franceintheus.org/"],
  singapour: ["Ambassade de France à Singapour", "https://sg.ambafrance.org/"],
};

// Liens vérifiés hors de la session de collecte (sites bloqués depuis la session), le 15 novembre 2026 (prompt 3c).
// Ils sont repris tels quels, avec leur propre date : on ne les rouvre pas.
const HORS_SESSION = "2026-11-15";
const fixe = (id, titre, nom, url) => ({ id, titre, nom, url, statut: "verifie", verifieLe: HORS_SESSION });
const CONSULAT_FIXE = { argentine: ["Consulat général de France à Buenos Aires", "https://ar.diplomatie.gouv.fr/fr/presence-francaise/consulat-general-de-france-en-argentine-et-au-paraguay"] };
const UFE = { allemagne: ["UFE Berlin", "https://ufe-berlin.com/"], japon: ["UFE Japon", "https://ufe-japon.org/"] };
// Français du monde-ADFE : aucune page par pays vérifiable, un seul lien vers la liste des sections.
const ADFE = ["Trouver une section Français du monde", "https://francais-du-monde.org/sections/"];

// Chambres de commerce françaises : pages lues dans l'annuaire officiel de CCI France International.
const ANNUAIRE_CCI = "https://www.ccifrance-international.org/notre-reseau/les-cci-fi.html";
const NOMS_CCI = { "royaume-uni": ["Grande-Bretagne", "Royaume-Uni"], "etats-unis": ["USA | New York"], canada: ["Canada | Montréal"], "coree-du-sud": ["Corée"], "emirats-arabes-unis": ["Emirats", "Émirats"], "hong-kong": ["Hong Kong", "Hong-Kong"], taiwan: ["Taiwan", "Taïwan"], bresil: ["Brésil"], "nouvelle-zelande": ["Nouvelle-Zélande"], "pays-bas": ["Pays-Bas"], belgique: ["Belgique"] };
let annuaire = [];
try {
  const html = execFileSync("curl", ["-sS", "-L", "-m", "60", "-A", UA, ANNUAIRE_CCI], { maxBuffer: 2e7 }).toString("utf8");
  annuaire = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gs)].map((m) => ({ url: m[1], texte: m[2].replace(/<[^>]+>/g, "").replace(/&#039;|&rsquo;/g, "'").replace(/&amp;/g, "&").trim() })).filter((x) => x.url.includes("/les-cci-fi/"));
} catch {
  console.warn("Annuaire CCI inaccessible.");
}
function cci(p) {
  const noms = NOMS_CCI[p.id] ?? [p.nom];
  const trouve = annuaire.find((x) => noms.some((n) => x.texte.toLowerCase().startsWith(n.toLowerCase())));
  if (!trouve) return null;
  const url = trouve.url.startsWith("http") ? trouve.url : `https://www.ccifrance-international.org${trouve.url}`;
  const nom = trouve.texte.split(":").pop().trim() || "CCI France";
  return lien("cci", "Chambre de commerce française", nom, url);
}

for (const p of pays) {
  console.log(p.nom);
  const europe = p.famille === "Europe sans visa";
  // Le titre dit honnêtement ce qu'est la page : celle du pays, ou une page générale.
  const [titreVisa, nomVisa, urlVisa] = VISA[p.id] ? ["Page officielle du visa", ...VISA[p.id]] : europe
    ? ["Travailler dans un autre pays d'Europe", "Travailler dans un autre pays d'Europe (L'Europe est à vous, Union européenne)", EUROPE]
    : p.famille === "PVT"
      ? ["Informations générales sur le PVT", "Programme Vacances-Travail (France Diplomatie)", PVT]
      : ["Entrée et séjour : informations générales", "Entrée et séjour (France Diplomatie)", infoPays(p.id, "conseils-aux-voyageurs-entree-sejour")];
  const liens = [lien("visa", titreVisa, nomVisa, urlVisa)];
  if (p.famille === "PVT" && VISA[p.id]) liens.push(lien("pvt", "Programme Vacances-Travail", "Programme Vacances-Travail (France Diplomatie)", PVT));
  liens.push(lien("conseils", "Conseils aux voyageurs", "Conseils aux voyageurs (France Diplomatie)", infoPays(p.id, "dernieres-minutes-et-alertes")));
  // Si le site de l'ambassade ne s'ouvre pas, on donne la page « Contacts utiles » de France Diplomatie.
  // Hong Kong n'a pas sa propre page « Contacts utiles » : son consulat figure sur celle de la Chine.
  const contacts = p.id === "hong-kong"
    ? ["Contacts utiles en Chine, dont le consulat général de France à Hong Kong et Macao (France Diplomatie)", infoPays("chine", "conseils-aux-voyageurs-contacts-utiles")]
    : ["Contacts utiles : ambassade et consulats (France Diplomatie)", infoPays(p.id, "conseils-aux-voyageurs-contacts-utiles")];
  const [nomConsulat, urlConsulat] = CONSULAT[p.id] && ouvre(CONSULAT[p.id][1]) ? CONSULAT[p.id] : contacts;
  liens.push(CONSULAT_FIXE[p.id] ? fixe("consulat", "Ambassade ou consulat de France", ...CONSULAT_FIXE[p.id]) : lien("consulat", "Ambassade ou consulat de France", nomConsulat, urlConsulat));
  liens.push(lien("registre", "Inscription au registre des Français établis hors de France", "S'inscrire au registre (France Diplomatie)", REGISTRE));

  const associations = [];
  const chambre = cci(p);
  if (chambre) associations.push(chambre);
  if (p.ficheComplete) {
    // UFE : seules les sections vérifiées sont affichées (Berlin, Japon) ; ailleurs, le lien reste masqué.
    // (Le lien Alliance française a été retiré : c'était le même lien général pour tous les pays.)
    associations.push(UFE[p.id]
      ? fixe("ufe", "Association de Français de l'étranger", ...UFE[p.id])
      : { id: "ufe", titre: "Association de Français de l'étranger", nom: "Union des Français de l'étranger (UFE)", url: null, statut: "a-verifier" });
    associations.push(fixe("adfe", "Association de Français de l'étranger", ...ADFE));
  }
  const dossier = { pays: p.id, verifieLe: AUJOURDHUI, liens, associations };
  fs.writeFileSync(path.join(RACINE, "content", "dossiers", `${p.id}.json`), JSON.stringify(dossier, null, 2) + "\n");
}
const total = [...dejaVus.values()];
console.log(`\nLiens ouverts : ${total.filter(Boolean).length} sur ${total.length}.`);
