// Des parcours au hasard (graine fixe), pour le test du moteur et la simulation.
// Chaque format reçoit une réponse valide tirée au hasard ; « passer » arrive parfois.
import { quiz, type Element, type Valeur } from "@/lib/donnees";
import { AUCUNE_ZONE, PASSER, REPONSES_LIMITE, REPONSES_SWIPE, optionsDe, reponsesDe } from "@/lib/elements";
import { ETAT_VIDE, envieDisponible, etatDepart, repondre, type Etat } from "@/lib/moteur";
import { phrasesSwipe, prochainElement, situationsLimites } from "@/lib/parcours";
import { paysBlind } from "@/lib/blind";

export function hasard(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Alea = () => number;
export const choisir = <T,>(r: Alea, l: T[]): T => l[Math.floor(r() * l.length)];
const melanger = <T,>(r: Alea, l: T[]) => [...l].map((x) => ({ x, k: r() })).sort((a, b) => a.k - b.k).map((y) => y.x);

// Une réponse valide au hasard pour n'importe quel format.
export function reponseAuHasard(el: Element, etat: Etat, r: Alea): Valeur {
  switch (el.type) {
    case "dilemme": return choisir(r, reponsesDe(el));
    case "choix-cartes": {
      const ids = optionsDe(el, etat.reponses).map((o) => o.id).filter((id) => !el.source?.startsWith("envies") || envieDisponible(id, etat.profil));
      if (!el.multiple) return ids.length ? choisir(r, ids) : PASSER;
      if (el.nombre) return melanger(r, ids).slice(0, el.nombre);
      // Les critères : de 3 à 5, le plus souvent 5.
      if (el.source === "envies") return melanger(r, ids).slice(0, r() < 0.7 ? 5 : 3 + Math.floor(r() * 2));
      if (el.max) return melanger(r, ids).slice(0, Math.floor(r() * (el.max + 1)));
      return ids.filter(() => r() < 0.2);
    }
    case "timeline": return { duree: choisir(r, el.options).id, apres: choisir(r, el.apres).id };
    case "enveloppe": return Math.round((el.min + r() * (el.max - el.min)) / el.pas) * el.pas;
    case "seuil": return r() < 0.5 ? { niveau: "ok" } : { niveau: r() < 0.6 ? "eviter" : "redhibitoire", seuil: String(Math.round((el.min + r() * (el.max - el.min)) / el.pas) * el.pas) };
    case "tri-zones": return Object.fromEntries(el.cartes.filter(() => r() < 0.6).map((c) => [c.id, choisir(r, el.zones).id]));
    case "blind-test": { const b = paysBlind(el, etat); return b.pays.length ? { choix: choisir(r, b.pays), faits: b.mesures.join(",") } : PASSER; }
    case "classement": return melanger(r, Array.isArray(etat.reponses.envies) ? (etat.reponses.envies as string[]) : []);
    case "curseur": return Math.round(r() * 100);
    case "thermometre": return 1 + Math.floor(r() * el.niveaux.length);
    case "ambiances": return melanger(r, el.options.map((o) => o.id)).slice(0, 1 + Math.floor(r() * el.max));
    case "carte-monde": return r() < 0.2 ? [AUCUNE_ZONE] : el.zones.filter(() => r() < 0.25).map((z) => z.id).concat(r() < 0.5 ? [] : [choisir(r, el.zones).id]).filter((x, i, l) => l.indexOf(x) === i);
    case "swipe": return Object.fromEntries(phrasesSwipe(el, etat).map((p) => [p.id, choisir(r, REPONSES_SWIPE)]));
    case "tri-limites": return Object.fromEntries(situationsLimites(el, etat).map((s) => [s.id, r() < 0.55 ? "ok" : r() < 0.75 ? "eviter" : choisir(r, REPONSES_LIMITE)]));
    case "recherche": return choisir(r, [...Object.keys(el.correspondances), "BE", "MA", "DZ", "ES", "SN"].filter((x) => !(el.exclus ?? []).includes(x)));
  }
}

// « choix » : la réponse d'une vraie personne (préférences cachées), ou au hasard. « passer » : probabilité de passer.
export type Repondeur = (el: Element, etat: Etat) => Valeur;
export function parcoursAuHasard(r: Alea, { passer = 0.08, repondeur }: { passer?: number; repondeur?: Repondeur } = {}): Etat {
  let etat = etatDepart({ ...ETAT_VIDE, graine: Math.floor(r() * 2 ** 31) });
  for (let n = 0; n < 80; n++) {
    const el = prochainElement(etat);
    if (!el) break;
    // Les envies et leur classement ne sont presque jamais passés (sinon le classement n'a plus rien à classer).
    const peutPasser = !["envies", "sacrifice", "second-plan"].includes(el.id);
    const v = peutPasser && r() < passer ? PASSER : repondeur ? repondeur(el, etat) : reponseAuHasard(el, etat, r);
    etat = repondre(etat, el.id, v);
  }
  return etat;
}

export const ENVIES = quiz.envies.map((e) => e.id);
