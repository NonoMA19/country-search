// Les profils types et les profils fixes de la simulation (et de l'audit des résultats surprenants).
// Chaque profil répond comme il le dit ; pour le reste : « Passer » (chapitres 3 et 4), « Non » pour la nationalité,
// « Aucune idée » sur la carte, « Aucun problème » pour les limites non citées, rien pour les langues.
import type { Valeur } from "@/lib/donnees";
import { PASSER, optionsDe } from "@/lib/elements";
import { situationsLimites } from "@/lib/parcours";
import type { Repondeur } from "./hasard";

export type Persona = { nom: string; reponses: Record<string, Valeur>; graine: number };

// Les profils sont écrits avec les identifiants d'avant le prompt 6 (pour comparer avant / après) et traduits ici
// vers la banque v2, réponse par réponse : envies et classement → critères, le plus dur à sacrifier (n° 1) et le second
// plan (n° 5) ; durée → frise ; tranche de budget → enveloppe (milieu de la tranche) ; limites → leur famille ;
// « Plus de 10 h de vol : aucun problème » → seuil de vol sans limite. Les questions qui n'existent plus sont ignorées.
const BUDGETS: Record<string, number> = { "moins-2000": 1500, "2000-5000": 3500, "5000-10000": 7500, "plus-10000": 12000 };
const FAMILLE_LIMITE: Record<string, string> = { "hors-europe": "limites-distance", alphabet: "limites-langue", "ni-fr-ni-en": "limites-langue", "visa-employeur": "limites-travail", vigilance: "limites-securite", "assurance-privee": "limites-securite" };
export function versV2(r: Record<string, Valeur>): Record<string, Valeur> {
  const res: Record<string, Valeur> = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === "classement" && Array.isArray(v)) { res.sacrifice = v; continue; }
    if (k === "duree") { res.timeline = { duree: String(v), ...(String(v) === "plus-2" ? { apres: "rester" } : {}) }; continue; }
    if (k === "budget") { if (BUDGETS[String(v)]) res.budget = BUDGETS[String(v)]; continue; }
    if (k === "limites" && typeof v === "object" && !Array.isArray(v)) {
      for (const [sit, n] of Object.entries(v)) {
        if (sit === "vol-10h") { res["seuil-vol"] = n === "ok" ? { niveau: "ok" } : { niveau: n, seuil: "10" }; continue; }
        const f = FAMILLE_LIMITE[sit];
        if (f) res[f] = { ...((res[f] as Record<string, string>) ?? {}), [sit]: n };
      }
      continue;
    }
    if (k === "nationalite" || k === "nationalite-laquelle") { res.nationalite = r["nationalite-laquelle"] ?? v; continue; }
    res[k] = v;
  }
  return res;
}
export const PROFILS_TYPES: Persona[] = [
  { nom: "a) Premier poste, anglais courant, salaire, travail facile, grande ville", graine: 1, reponses: { objectif: "premier-poste", age: "18-25", "anglais-reunion": 5, "anglais-vie": 5, envies: ["salaire", "travail", "equilibre", "securite", "francais"], classement: ["salaire", "travail", "equilibre", "securite", "francais"], appartement: "a", ambiances: ["metropole"] } },
  { nom: "b) Année d’aventure, 22 ans, coût de la vie, nature, climat doux", graine: 2, reponses: { objectif: "aventure", age: "18-25", "anglais-reunion": 3, "anglais-vie": 3, envies: ["prix", "climat", "travail", "securite", "proche"], classement: ["prix", "climat", "travail", "securite", "proche"], appartement: "b", ambiances: ["nature", "soleil"] } },
  { nom: "c) Stage ou VIE, des Français sur place, près de la France", graine: 3, reponses: { objectif: "stage-vie", age: "18-25", "anglais-reunion": 3, "anglais-vie": 3, envies: ["francais", "proche", "travail", "salaire", "securite"], classement: ["francais", "proche", "travail", "salaire", "securite"], "premier-mois": "a", noel: "a" } },
  { nom: "d) Carrière longue, apprendre une langue lui va, sécurité et équilibre", graine: 4, reponses: { objectif: "carriere", age: "26-27", "anglais-reunion": 5, "anglais-vie": 4, envies: ["securite", "equilibre", "salaire", "travail", "climat"], classement: ["securite", "equilibre", "salaire", "travail", "climat"], "cours-offerts": "a", "deux-langues": "a" } },
  { nom: "e) Parle espagnol, aime la chaleur, vie moins chère", graine: 5, reponses: { age: "18-25", "anglais-reunion": 3, "anglais-vie": 3, langues: ["es"], envies: ["prix", "climat", "travail", "securite", "equilibre"], classement: ["prix", "climat", "travail", "securite", "equilibre"], aout: "a", janvier: "b", ambiances: ["soleil"] } },
  { nom: "f) Hiérarchie plate, consensus, collègues vus après le travail", graine: 6, reponses: { age: "26-27", "anglais-reunion": 5, "anglais-vie": 5, envies: ["equilibre", "travail", "salaire", "securite", "proche"], classement: ["equilibre", "travail", "salaire", "securite", "proche"], "reunion-directeur": "a", "idee-reunion": "b", "vendredi-18h": "b" } },
  { nom: "k) Karim : Océanie et Asie de l’Est, « Climat doux » n° 1, soleil, 10 h de vol sans problème", graine: 11, reponses: { age: "18-25", "anglais-reunion": 4, "anglais-vie": 4, carte: ["oceanie", "asie-est"], envies: ["climat", "travail", "salaire", "securite", "prix"], classement: ["climat", "travail", "salaire", "securite", "prix"], ambiances: ["soleil"], limites: { "vol-10h": "ok" } } },
  { nom: "g) Finance, anglais courant, carrière, peu importe la zone", graine: 7, reponses: { objectif: "carriere", secteur: "finance", age: "26-27", "anglais-reunion": 5, "anglais-vie": 5, carte: ["aucune"], envies: ["secteur", "salaire", "travail", "securite", "equilibre"], classement: ["secteur", "salaire", "travail", "securite", "equilibre"], "secteur-ville": "a", ambiances: ["metropole"], "langue-bureau": "a", limites: {} } },
];
// Un profil type répond seulement à ce qu'il dit. Le reste : « Passer » (chapitres 3 et 4), « Non » pour la nationalité,
// « Aucune idée » sur la carte, « Aucun problème » pour les limites non citées, rien pour les langues.
export const repondeurFixe = (p: Persona): Repondeur => {
  const reponses = versV2(p.reponses);
  return (el, etat) => {
    const v = reponses[el.id];
    if (el.type === "tri-limites") return Object.fromEntries(situationsLimites(el, etat).map((s) => [s.id, ((v ?? {}) as Record<string, string>)[s.id] ?? "ok"]));
    if (el.type === "seuil") return v ?? { niveau: "ok" };
    if (v !== undefined) {
      if (el.id === "envies" && Array.isArray(v)) return v.filter((id) => optionsDe(el as never).some((o: { id: string }) => o.id === id));
      return v;
    }
    if (el.id === "carte") return ["aucune"];
    if (el.id === "nationalite") return "non";
    if (el.id === "langues") return [];
    if (el.id === "budget") return 3500;
    if (el.id === "secteur") return "autre";
    if (el.id === "objectif") return "inconnu";
    if (el.type === "tri-zones") return {};
    return PASSER;
  };
};
const KARIM = PROFILS_TYPES.find((p) => p.nom.startsWith("k)"))!;
const ESPAGNOL = PROFILS_TYPES.find((p) => p.nom.startsWith("e)"))!;
export const PROFILS_FIXES: Persona[] = [
  { nom: "a) Finance, 23 ans, VIE, bon salaire en n° 1", graine: 21, reponses: { objectif: "stage-vie", secteur: "finance", age: "18-25", "anglais-reunion": 4, "anglais-vie": 4, envies: ["salaire", "secteur", "travail", "securite", "equilibre"], classement: ["salaire", "secteur", "travail", "securite", "equilibre"], ambiances: ["metropole"] } },
  { nom: "b) Qualité de vie, 29 ans, installation durable", graine: 22, reponses: { objectif: "carriere", age: "28-30", duree: "plus-2", "anglais-reunion": 4, "anglais-vie": 4, envies: ["equilibre", "securite", "climat", "prix", "travail"], classement: ["equilibre", "securite", "climat", "prix", "travail"], "cours-offerts": "a" } },
  { ...KARIM, nom: "c) Karim : Océanie et Asie de l’Est, « Climat doux » n° 1, soleil, 10 h de vol sans problème" },
  { ...ESPAGNOL, nom: "d) Parle espagnol, aime la chaleur, vie moins chère" },
  { nom: "e) PVT, 25 ans, attiré par le Japon, refuse d’apprendre le japonais", graine: 25, reponses: { objectif: "aventure", age: "18-25", duree: "6-12", "anglais-reunion": 3, "anglais-vie": 3, carte: ["asie-est"], envies: ["depaysement", "prix", "climat", "travail", "securite"], classement: ["depaysement", "prix", "climat", "travail", "securite"], "cours-offerts": "b", limites: { alphabet: "redhibitoire" } } },
  { nom: "f) Reste proche de la France, budget faible", graine: 26, reponses: { objectif: "premier-poste", age: "18-25", budget: "moins-2000", "anglais-reunion": 3, "anglais-vie": 3, envies: ["proche", "prix", "francais", "travail", "securite"], classement: ["proche", "prix", "francais", "travail", "securite"], noel: "a" } },
];
