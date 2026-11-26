// « Ton intuition et tes réponses » : l'écran de fin, avant le portrait.
// On compare ta zone sur la carte du début (un petit bonus dans le calcul, voir moteur.ts et zones.ts) à ton n° 1,
// et on dit les 2 ou 3 réponses qui ont le plus pesé. Aucun calcul nouveau : on relit les points du classement.
import { quiz, trouverElement, type CarteMonde, type Valeur } from "./donnees";
import { AUCUNE_ZONE, PASSER } from "./elements";
import { calculer, listeFr, sceneDe, type Etat, type Ligne } from "./moteur";
import { pays } from "./pays";
import { PARIS, distanceKm, lireCarte, villeLaPlusProche, type Cercle } from "./zones";

export type Intuition = {
  cas: "bonne" | "autre" | "sans-idee";
  n1: Ligne | null;
  zones: string[]; // les noms de tes zones (« autour de Tokyo », « Europe »…)
  meilleurDansZones: Ligne | null; // le mieux classé des pays de tes régions
  raisons: string[]; // « ton envie « Bon salaire » », « ta réponse à « Deux offres » »…
  phrase: string;
};

const carte = () => trouverElement("carte") as CarteMonde;
// « Tu pensais à l'Europe », « au Moyen-Orient et à l'Afrique du Nord ».
const A_LA_ZONE: Record<string, string> = {
  europe: "à l’Europe", "amerique-nord": "à l’Amérique du Nord", "amerique-latine": "à l’Amérique latine", "asie-est": "à l’Asie de l’Est",
  "asie-sud-est": "à l’Asie du Sud-Est", "asie-sud": "à l’Asie du Sud", oceanie: "à l’Océanie", "moyen-orient": "au Moyen-Orient et à l’Afrique du Nord",
  afrique: "à l’Afrique subsaharienne",
};
const A_GROUPE: Record<string, string> = {
  "g-europe": "à l’Europe", "g-maghreb-afrique-ouest": "au Maghreb et à l’Afrique de l’Ouest", "g-ameriques": "aux Amériques",
  "g-asie": "à l’Asie", "g-oceanie": "à l’Océanie", "g-moyen-orient": "au Moyen-Orient",
};
// Un cercle se nomme par la ville de référence la plus proche de son centre : « autour de Tokyo ».
// Paris compte aussi comme repère pour le nom (un cercle posé sur la France s'appelle « autour de Paris »).
export const nomCercle = (c: Cercle) => {
  const proche = villeLaPlusProche(c);
  const v = distanceKm(c, PARIS) < proche.km ? "Paris" : proche.ville;
  return `autour ${/^[AEIOUYÂÉÈÊÎÔÛHaeiouyh]/.test(v) ? "d’" : "de "}${v}`;
};
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function zonesCochees(v: Valeur | undefined): string[] {
  return Array.isArray(v) ? v.filter((z) => z !== AUCUNE_ZONE) : [];
}
export const zoneDuPays = (paysId: string) => carte().zones.find((z) => z.pays.includes(paysId));

// Une origine de calcul, dite en mots.
export function origineEnMots(origine: string, etat: Etat): string | null {
  const [type, reste = ""] = origine.split(":");
  const [id, sous] = reste.split("/");
  if (origine === "carte") return "ta carte du début";
  if (origine === "langues") return "les langues que tu parles";
  if (type === "envie") return `ton critère «\u00a0${quiz.envies.find((e) => e.id === id)?.label ?? id}\u00a0»`;
  if (type === "objectif") return `ton projet (${quiz.objectifs[id]?.nom ?? id})`;
  const el = trouverElement(id);
  if (!el) return null;
  if (el.type === "tri-zones") return `ta valeur «\u00a0${el.cartes.find((c) => c.id === sous)?.label ?? sous}\u00a0»`;
  if (el.type === "blind-test") return "ton choix au test à l’aveugle";
  if (type === "dilemme" && el.type === "dilemme") return `ta réponse à « ${sceneDe(el, etat).titre} »`;
  if (el.type === "curseur") return "ton équilibre entre temps libre et salaire";
  if (el.type === "ambiances") return `le décor « ${el.options.find((o) => o.id === sous)?.label ?? sous} »`;
  if (el.type === "swipe") return `« ${el.phrases.find((p) => p.id === sous)?.texte ?? sous} »`;
  if (el.type === "choix-cartes") {
    const v = etat.reponses[id];
    const o = el.options.find((x) => (Array.isArray(v) ? v.includes(x.id) : x.id === v));
    return o ? `ton choix «\u00a0${o.label}\u00a0»` : null;
  }
  return null;
}

// Les points d'un pays, réponse par réponse (importance × accord).
function pointsParOrigine(l: Ligne): Map<string, number> {
  const res = new Map<string, number>();
  for (const d of l.details) if (!d.neutre) res.set(d.origine, (res.get(d.origine) ?? 0) + d.poids * d.accord);
  return res;
}

// Les réponses qui donnent le plus d'avance à « a » sur « b » (ou sur la moyenne des pays classés).
export function raisonsAvance(etat: Etat, a: Ligne, contre: Ligne[], n = 3): string[] {
  const pa = pointsParOrigine(a);
  const pc = contre.map(pointsParOrigine);
  const ecarts = [...pa].map(([o, v]) => ({ o, e: v - pc.reduce((s, m) => s + (m.get(o) ?? 0), 0) / Math.max(1, pc.length) }));
  return ecarts
    .filter((x) => x.e > 1e-6)
    .sort((x, y) => y.e - x.e)
    .map((x) => origineEnMots(x.o, etat))
    .filter((x, i, l): x is string => !!x && l.indexOf(x) === i)
    .slice(0, n);
}

export function intuition(etat: Etat): Intuition {
  const lignes = calculer(etat);
  const classes = lignes.filter((l) => !l.ecart && !l.peuDeDonnees);
  const n1 = classes[0] ?? null;
  const v = etat.reponses.carte;
  const el = carte();
  const lecture = lireCarte(el, v, false);
  const regions = el.zones.filter((z) => lecture.regions.includes(z.id));
  const groupes = el.groupes.filter((g) => lecture.groupes.includes(g.id));
  const noms = [...regions.map((z) => z.label), ...groupes.map((g) => g.label), ...lecture.cercles.map(nomCercle)];
  const vers = [...regions.map((z) => A_LA_ZONE[z.id] ?? `à ${z.label}`), ...groupes.map((g) => A_GROUPE[g.id] ?? `à ${g.label}`), ...lecture.cercles.map(nomCercle)];
  if (!n1) return { cas: "sans-idee", n1, zones: noms, meilleurDansZones: null, raisons: [], phrase: "Tes réponses ne permettent pas encore de classer les pays." };
  const Le = majuscule(n1.pays.le);
  if (!noms.length || v === PASSER) {
    const raisons = raisonsAvance(etat, n1, classes.slice(1, 10), 3);
    return { cas: "sans-idee", n1, zones: [], meilleurDansZones: null, raisons, phrase: `Tu partais sans idée : voici où tes réponses te mènent. ${Le}, en n° 1.` };
  }
  const paysZones = new Set([...regions.flatMap((z) => z.pays), ...lecture.dansZone]);
  const accorde = n1.pays.pluriel ? "arrivent" : "arrive";
  if (paysZones.has(n1.pays.id)) {
    const raisons = raisonsAvance(etat, n1, classes.slice(1, 10), 3);
    const zoneN1 = regions.find((z) => z.pays.includes(n1.pays.id));
    const ou = zoneN1 ? (zoneN1.id === "moyen-orient" ? "au Moyen-Orient et en Afrique du Nord" : `en ${zoneN1.label}`) : "dans ta zone";
    return { cas: "bonne", n1, zones: noms, meilleurDansZones: n1, raisons, phrase: `Ton intuition était bonne : ${n1.pays.le}, ${ou}, ${accorde} n° 1.` };
  }
  const meilleur = lignes.find((l) => paysZones.has(l.pays.id) && !l.peuDeDonnees) ?? null;
  const raisons = meilleur ? raisonsAvance(etat, n1, [meilleur], 3) : [];
  return { cas: "autre", n1, zones: noms, meilleurDansZones: meilleur, raisons, phrase: `Tu pensais ${listeFr(vers)}. Tes réponses te mènent vers ${n1.pays.le}.` };
}

export const nomsPays = (ids: string[]) => ids.map((id) => pays.find((p) => p.id === id)?.nom ?? id);
