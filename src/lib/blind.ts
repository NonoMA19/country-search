// Le test à l'aveugle : trois pays de ton top 10, sans leur nom, et les quatre faits qui les distinguent le plus.
// Tout est tiré de la graine du parcours : le même écran revient à l'identique au retour et au rechargement.
import { notes, type BlindTest } from "./donnees";
import { BLIND_UNIVERSELS, objetReponse } from "./elements";
import { hacher, mesureClassante, valeurLisible, type Etat } from "./moteur";
import { etatAvant, topCourant } from "./parcours";

// Un fait : le nom du thème, une jauge (la note de 1 à 5), un emoji et quelques mots simples (« Hiver frais, 4 °C »).
// universel : le vert veut dire « bon pour toi » (voir BLIND_UNIVERSELS) ; sinon la jauge est neutre (une affaire de goût).
export type FaitBlind = { mesure: string; theme: string; valeur: string; emoji: string; note: number | null; universel: boolean };
export const THEME_BLIND: Record<string, string> = {
  prix: "Coût de la vie", emploi: "Chômage des jeunes", securite: "Sécurité", heures: "Charge de travail", langue: "Langue au quotidien",
  hiver: "Hiver", ete: "Été", vol: "Distance", soleil: "Soleil", "grande-ville": "Grandes villes", nature: "Nature",
};
const EMOJI_FAIT: Record<string, string> = {
  prix: "pig-face", emploi: "briefcase", hiver: "snowflake", ete: "thermometer", securite: "shield", vol: "airplane",
  heures: "mantelpiece-clock", "grande-ville": "cityscape", nature: "evergreen-tree", langue: "speech-balloon", soleil: "sun",
};
const arrondi = (n: number) => Math.round(n).toLocaleString("fr-FR");
function faitSimple(paysId: string, m: string, etat: Etat): string {
  const v = valeurLisible(paysId, m, etat.profil);
  if (!v) return "À vérifier";
  const x = notes[paysId]?.[m]?.valeur;
  if (m === "vol" && typeof x === "number") return `${v.mot}, ${arrondi(x)}\u00a0h de vol`;
  if ((m === "hiver" || m === "ete") && typeof x === "number") return `${v.mot}, ${arrondi(x)}\u00a0°C`;
  if (m === "prix") return v.mot.replace("que la France", "qu’en France").replace("ceux de la France", "ceux de France");
  return v.mot;
}
export type CarteBlind = { pays: string; faits: FaitBlind[] };

const noteDe = (pays: string, m: string) => { const n = notes[pays]?.[m]; return n?.statut === "verifie" && typeof n.note === "number" ? n.note : null; };

export function paysBlind(el: BlindTest, etat: Etat): { pays: string[]; mesures: string[] } {
  const deja = objetReponse(etat.reponses[el.id]);
  // Déjà répondu (ou passé) : les pays de l'état d'avant, et les faits enregistrés.
  if (etat.reponses[el.id] !== undefined) {
    const avant = paysBlind(el, etatAvant(etat, el.id));
    return deja.faits ? { pays: avant.pays, mesures: deja.faits.split(",") } : avant;
  }
  // Un second test : ni les pays ni les thèmes du premier (quand il en reste assez).
  const avant = el.exclure ? objetReponse(etat.reponses[el.exclure]) : {};
  const dejaPays = avant.pays ? avant.pays.split(",") : avant.choix ? [avant.choix] : [];
  const dejaFaits = avant.faits ? avant.faits.split(",") : [];
  const dix = topCourant(etat, 10).map((l) => l.pays.id).filter((p) => !dejaPays.includes(p));
  const choisis = [...dix].sort((a, b) => hacher(etat.graine, `blind:${el.id}:${a}`) - hacher(etat.graine, `blind:${el.id}:${b}`)).slice(0, el.nombre);
  if (choisis.length < 2) return { pays: [], mesures: [] };
  // Les faits : notés pour les trois pays (et pour au moins 30 pays sur 38), ceux qui les séparent le plus.
  const neufs = el.mesures.filter((m) => !dejaFaits.includes(m));
  const parmi = neufs.filter((m) => mesureClassante(m) && choisis.every((p) => noteDe(p, m) !== null)).length >= el.faits ? neufs : el.mesures;
  const mesures = parmi
    .filter((m) => mesureClassante(m) && choisis.every((p) => noteDe(p, m) !== null))
    .map((m) => { const n = choisis.map((p) => noteDe(p, m)!); return { m, e: Math.max(...n) - Math.min(...n), h: hacher(etat.graine, `fait:${m}`) }; })
    .sort((a, b) => b.e - a.e || a.h - b.h);
  // Moitié thèmes universels (jauge rouge → vert), moitié thèmes de goût, les plus séparants de chaque côté ;
  // s'il en manque d'un côté, l'autre complète. Universels d'abord dans la carte.
  const moitie = Math.ceil(el.faits / 2);
  const univ = mesures.filter((x) => BLIND_UNIVERSELS.includes(x.m));
  const gout = mesures.filter((x) => !BLIND_UNIVERSELS.includes(x.m));
  const pris = [...univ.slice(0, moitie), ...gout.slice(0, el.faits - Math.min(moitie, univ.length))].slice(0, el.faits);
  for (const x of mesures) if (pris.length < el.faits && !pris.includes(x)) pris.push(x);
  const ordre = (m: string) => Number(!BLIND_UNIVERSELS.includes(m));
  return { pays: choisis, mesures: pris.map((x) => x.m).sort((a, b) => ordre(a) - ordre(b)) };
}

export function cartesBlind(el: BlindTest, etat: Etat): CarteBlind[] {
  const { pays, mesures } = paysBlind(el, etat);
  return pays.map((p) => ({
    pays: p,
    faits: mesures.map((m) => ({ mesure: m, theme: THEME_BLIND[m] ?? m, valeur: faitSimple(p, m, etat), emoji: EMOJI_FAIT[m] ?? "light-bulb", note: noteDe(p, m), universel: BLIND_UNIVERSELS.includes(m) })),
  }));
}
