// Ta zone sur la carte du début : des cercles de rayon réel (en km, distance sur la sphère), ou des groupes de pays.
// Tout est calculé ici, sans bibliothèque : la distance entre deux villes est celle du grand cercle (formule de haversine).
// Une seule ville de référence par pays (scores.json, « villes ») : un cercle peut toucher un pays sans contenir sa ville.
import { villes, type CarteMonde, type Valeur } from "./donnees";
import { pays } from "./pays";

export const RAYON_TERRE = 6371; // km, rayon moyen
export const RAYONS = [500, 1500, 3000, 6000, 10000]; // les crans du curseur
export const RAYON_DEPART = 1500;
export const RAYON_MIN = 200;
export const RAYON_MAX = 10000;
export const MAX_CERCLES = 3;
export const AUCUNE_ZONE = "aucune"; // « Je n'ai pas de zone précise »
// Paris, repère de « Proche de la France » (GeoNames, via Open-Meteo, comme les villes de référence des pays).
export const PARIS = { lat: 48.8534, lon: 2.3488 };

export type Point = { lat: number; lon: number };
export type Cercle = Point & { km: number };

const rad = (d: number) => (d * Math.PI) / 180;
export function distanceKm(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Le point à « km » kilomètres de « centre », dans la direction « cap » (degrés, 0 = nord, 90 = est).
export function pointA(centre: Point, km: number, cap: number): Point {
  const d = km / RAYON_TERRE, t = rad(cap), la = rad(centre.lat), lo = rad(centre.lon);
  const lat2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(t));
  const lon2 = lo + Math.atan2(Math.sin(t) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lon: ((((lon2 * 180) / Math.PI + 540) % 360) - 180) };
}

// ---------- Les réponses : « c:48.9,2.3,1500 » (un cercle), « g-europe » (un groupe) ----------
const arrondi = (n: number, pas: number) => Math.round(n / pas) * pas;
export const bornerRayon = (km: number) => Math.min(RAYON_MAX, Math.max(RAYON_MIN, arrondi(km, 50)));
export function ecrireCercle(c: Cercle): string {
  const lon = ((((c.lon + 180) % 360) + 360) % 360) - 180;
  return `c:${Math.round(c.lat * 10) / 10},${Math.round(lon * 10) / 10},${bornerRayon(c.km)}`;
}
export function lireCercle(x: string): Cercle | null {
  const m = /^c:(-?\d{1,2}(?:\.\d)?),(-?\d{1,3}(?:\.\d)?),(\d{3,5})$/.exec(x);
  if (!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]), km = Number(m[3]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || km < RAYON_MIN || km > RAYON_MAX || km % 50 !== 0) return null;
  return { lat, lon, km };
}
export const estCercle = (x: string) => lireCercle(x) !== null;

// Une réponse de carte est valide si chaque morceau est connu (cercle, groupe, ancienne région, « aucune »), avec 3 cercles au plus.
export function reponseCarteValide(el: CarteMonde, v: string[]): boolean {
  const connus = new Set([AUCUNE_ZONE, ...el.zones.map((z) => z.id), ...(el.groupes ?? []).map((g) => g.id)]);
  return v.every((x) => connus.has(x) || estCercle(x)) && v.filter(estCercle).length <= MAX_CERCLES && new Set(v).size === v.length;
}

export const villeDe = (paysId: string): Point | null => villes[paysId] ?? null;
export const paysDansCercle = (c: Cercle): string[] => pays.filter((p) => { const v = villeDe(p.id); return !!v && distanceKm(c, v) <= c.km; }).map((p) => p.id);
export const contientParis = (c: Cercle) => distanceKm(c, PARIS) <= c.km;

// Le pays dont la ville de référence est la plus proche d'un point (pour nommer un cercle, ou dire « le plus proche »).
export function villeLaPlusProche(pt: Point): { paysId: string; ville: string; km: number } {
  let best = { paysId: pays[0].id, ville: "", km: Infinity };
  for (const p of pays) {
    const v = villes[p.id];
    if (!v) continue;
    const d = distanceKm(pt, v);
    if (d < best.km) best = { paysId: p.id, ville: v.nom, km: d };
  }
  return best;
}

// Ce que dit une réponse de carte : les pays dans ta zone, et ceux qui reçoivent le bonus.
// Règle contre le double comptage : si l'envie « Proche de la France » est choisie, une zone qui contient la France
// (un cercle qui contient Paris, ou le groupe Europe) ne donne pas de bonus en plus. Les autres zones comptent.
export type LectureCarte = { cercles: Cercle[]; groupes: string[]; regions: string[]; dansZone: string[]; bonus: string[]; ecartees: number };
export function lireCarte(el: CarteMonde | undefined, v: Valeur | undefined, procheChoisi: boolean): LectureCarte {
  const vide: LectureCarte = { cercles: [], groupes: [], regions: [], dansZone: [], bonus: [], ecartees: 0 };
  if (!el || !Array.isArray(v) || v.includes(AUCUNE_ZONE)) return vide;
  const cercles = v.map(lireCercle).filter((c): c is Cercle => !!c);
  const groupes = (el.groupes ?? []).filter((g) => v.includes(g.id));
  const regions = el.zones.filter((z) => v.includes(z.id)).map((z) => z.id);
  const dans = new Set<string>(), bonus = new Set<string>();
  let ecartees = 0;
  for (const c of cercles) {
    const ids = paysDansCercle(c);
    ids.forEach((id) => dans.add(id));
    if (procheChoisi && contientParis(c)) ecartees++;
    else ids.forEach((id) => bonus.add(id));
  }
  for (const g of groupes) {
    g.pays.forEach((id) => dans.add(id));
    if (procheChoisi && g.id === "g-europe") ecartees++;
    else g.pays.forEach((id) => bonus.add(id));
  }
  return { cercles, groupes: groupes.map((g) => g.id), regions, dansZone: [...dans], bonus: [...bonus], ecartees };
}
