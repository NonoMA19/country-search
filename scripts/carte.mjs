// Fabrique la carte du monde simplifiée du quiz (content/carte-monde.json) à partir de Natural Earth
// (pays au 1:110 000 000, domaine public : https://www.naturalearthdata.com/about/terms-of-use/).
// Usage : node scripts/carte.mjs
// Projection équirectangulaire (360 × 160, sans l'Antarctique), points simplifiés (Douglas-Peucker), coordonnées arrondies.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(RACINE, "scripts", ".cache");
fs.mkdirSync(CACHE, { recursive: true });
const SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const fichier = path.join(CACHE, "ne_110m_admin_0_countries.geojson");
if (!fs.existsSync(fichier)) execFileSync("curl", ["-sS", "-L", "--fail", "-m", "300", "-o", fichier, SOURCE]);
const geo = JSON.parse(fs.readFileSync(fichier, "utf8"));

// Les 9 zones du quiz (codes ISO à 3 lettres). Les autres pays restent en fond, non cliquables.
const ZONES = {
  europe: "ALB AND AUT BEL BGR BIH BLR CHE CYP CZE DEU DNK ESP EST FIN FRA GBR GRC HRV HUN IRL ISL ITA KOS LTU LUX LVA MDA MKD MNE NLD NOR POL PRT ROU SRB SVK SVN SWE UKR".split(" "),
  "amerique-nord": "CAN USA GRL".split(" "),
  "amerique-latine": "MEX GTM BLZ HND SLV NIC CRI PAN CUB HTI DOM JAM PRI BHS TTO COL VEN GUY SUR ECU PER BOL BRA PRY URY ARG CHL FLK".split(" "),
  "asie-est": "CHN JPN KOR PRK TWN MNG".split(" "),
  "asie-sud-est": "MMR THA LAO KHM VNM MYS SGP IDN PHL BRN TLS PNG".split(" "),
  oceanie: "AUS NZL FJI NCL SLB VUT".split(" "),
  "moyen-orient": "MAR DZA TUN LBY EGY ESH SAU ARE OMN YEM QAT KWT BHR IRQ IRN JOR SYR LBN ISR PSE TUR".split(" "),
  "asie-sud": "IND PAK BGD LKA NPL BTN".split(" "),
  afrique: "SEN GMB GNB GIN SLE LBR CIV GHA TGO BEN BFA MLI NER NGA MRT CMR TCD CAF GAB GNQ COG COD AGO SDN SSD ETH ERI DJI SOM SOL KEN UGA RWA BDI TZA ZMB MWI MOZ ZWE BWA NAM ZAF LSO SWZ MDG".split(" "),
};
const zoneDe = Object.fromEntries(Object.entries(ZONES).flatMap(([z, l]) => l.map((c) => [c, z])));
const codeDe = (p) => (p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3);

const projeter = ([lon, lat]) => [lon + 180, 84 - lat];
function simplifier(points, tol) {
  if (points.length < 4) return points;
  const garde = new Uint8Array(points.length);
  garde[0] = garde[points.length - 1] = 1;
  const pile = [[0, points.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    let max = 0, idx = -1;
    const [x1, y1] = points[a], [x2, y2] = points[b];
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + x2 * y1 - y2 * x1) / l;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { garde[idx] = 1; pile.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => garde[i]);
}
const r = (n) => Math.round(n * 2) / 2;
function chemin(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  for (const poly of polys) {
    // Un anneau fermé commence et finit au même point : on le coupe en deux moitiés avant de simplifier.
    const pts = poly[0].map(projeter).slice(0, -1);
    const m = Math.floor(pts.length / 2);
    const anneau = [...simplifier(pts.slice(0, m + 1), 0.6).slice(0, -1), ...simplifier([...pts.slice(m), pts[0]], 0.6).slice(0, -1)].map(([x, y]) => [r(x), r(y)]);
    if (anneau.length < 3) continue;
    const xs = anneau.map((p) => p[0]), ys = anneau.map((p) => p[1]);
    if (Math.max(...xs) - Math.min(...xs) < 1 && Math.max(...ys) - Math.min(...ys) < 1) continue;
    d += "M" + anneau.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
  }
  return d;
}

const parZone = Object.fromEntries([...Object.keys(ZONES), "fond"].map((z) => [z, ""]));
for (const f of geo.features) {
  const code = codeDe(f.properties);
  if (code === "ATA") continue;
  parZone[zoneDe[code] ?? "fond"] += chemin(f.geometry);
}
const sortie = {
  source: "Natural Earth, pays au 1:110 000 000 (domaine public)",
  lien: "https://www.naturalearthdata.com/",
  largeur: 360, hauteur: 146,
  // Pour la carte : un point repère par zone (petites zones et lecteurs d'écran : la liste de boutons reste l'alternative).
  zones: parZone,
};
fs.writeFileSync(path.join(RACINE, "content", "carte-monde.json"), JSON.stringify(sortie) + "\n");
console.log("content/carte-monde.json :", Math.round(fs.statSync(path.join(RACINE, "content", "carte-monde.json")).size / 1024), "Ko");
