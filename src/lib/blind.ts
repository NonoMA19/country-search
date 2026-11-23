// Le test à l'aveugle : trois pays de ton top 10, sans leur nom, et les quatre faits qui les distinguent le plus.
// Tout est tiré de la graine du parcours : le même écran revient à l'identique au retour et au rechargement.
import { notes, type BlindTest } from "./donnees";
import { objetReponse } from "./elements";
import { hacher, mesureClassante, valeurLisible, type Etat } from "./moteur";
import { etatAvant, topCourant } from "./parcours";

export type FaitBlind = { mesure: string; valeur: string };
export type CarteBlind = { pays: string; faits: FaitBlind[] };

const noteDe = (pays: string, m: string) => { const n = notes[pays]?.[m]; return n?.statut === "verifie" && typeof n.note === "number" ? n.note : null; };

export function paysBlind(el: BlindTest, etat: Etat): { pays: string[]; mesures: string[] } {
  const deja = objetReponse(etat.reponses[el.id]);
  // Déjà répondu (ou passé) : les pays de l'état d'avant, et les faits enregistrés.
  if (etat.reponses[el.id] !== undefined) {
    const avant = paysBlind(el, etatAvant(etat, el.id));
    return deja.faits ? { pays: avant.pays, mesures: deja.faits.split(",") } : avant;
  }
  const dix = topCourant(etat, 10).map((l) => l.pays.id);
  const choisis = [...dix].sort((a, b) => hacher(etat.graine, `blind:${a}`) - hacher(etat.graine, `blind:${b}`)).slice(0, el.nombre);
  if (choisis.length < 2) return { pays: [], mesures: [] };
  // Les faits : notés pour les trois pays (et pour au moins 30 pays sur 38), ceux qui les séparent le plus.
  const mesures = el.mesures
    .filter((m) => mesureClassante(m) && choisis.every((p) => noteDe(p, m) !== null))
    .map((m) => { const n = choisis.map((p) => noteDe(p, m)!); return { m, e: Math.max(...n) - Math.min(...n), h: hacher(etat.graine, `fait:${m}`) }; })
    .sort((a, b) => b.e - a.e || a.h - b.h)
    .slice(0, el.faits)
    .map((x) => x.m);
  return { pays: choisis, mesures };
}

export function cartesBlind(el: BlindTest, etat: Etat): CarteBlind[] {
  const { pays, mesures } = paysBlind(el, etat);
  return pays.map((p) => ({
    pays: p,
    faits: mesures.map((m) => { const v = valeurLisible(p, m, etat.profil); return { mesure: m, valeur: v ? (v.valeur ? `${v.valeur} (${v.mot.toLowerCase()})` : v.mot) : "à vérifier" }; }),
  }));
}
