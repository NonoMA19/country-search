// Le calcul du quiz : un simple calcul, sans IA.
// La méthode complète est expliquée sur la page /methode.
import { ECART_EX_AEQUO, SEUIL_SURPRISE } from "@/config";
import { pays, type Pays } from "./pays";
import {
  avis, mesures, notes, portes, quiz, vie, preuveMesure, preuveSource,
  type Effet, type FamilleScore, type Phrase, type PorteBrute, type Preuve, type Sens,
} from "./donnees";

export type Profil = Record<string, string | string[] | undefined>;

export type Etat = {
  profil: Profil;
  priorites: string[];
  sujets: string[];
  reponses: Record<string, string>; // phrase → "oui", "non", "passer" ou un choix
  ordre: string[]; // phrases dans l'ordre où elles ont été vues
  remontes: string[]; // pays remontés à la main depuis « Moins adaptés »
  historique: string[]; // le top 3 après chaque réponse (le premier : avant les phrases)
};

export type Reglages = { poids: Record<FamilleScore, number>; budget: number | null };

export const ETAT_VIDE: Etat = { profil: {}, priorites: [], sujets: [], reponses: {}, ordre: [], remontes: [], historique: [] };
export const REGLAGES_DEFAUT: Reglages = { poids: { travailler: 1, vivre: 1, valeurs: 1 }, budget: null };
export const MIN_PHRASES = 6;
export const REPONSES_STABLES = 3;

// ---------- Profil ----------
const option = (question: string, id: unknown) =>
  quiz.profil.find((q) => q.id === question)?.options.find((o) => o.id === id);

export const ageMax = (p: Profil) => option("age", p.age)?.ageMax ?? null;
export const budgetProfil = (p: Profil) => option("budget", p.budget)?.euros ?? null;
export const dureeMois = (p: Profil) => option("duree", p.duree)?.mois ?? null;

export function languesParlees(p: Profil): string[] {
  const choix = Array.isArray(p.langues) ? p.langues : [];
  return choix.flatMap((id) => option("langues", id)?.codes ?? []);
}
const parleLangueDe = (paysId: string, p: Profil) => {
  const parlees = languesParlees(p);
  return (avis[paysId]?.langues ?? []).some((l) => parlees.includes(l));
};

export function questionProfilVisible(id: string, p: Profil): boolean {
  const q = quiz.profil.find((x) => x.id === id);
  if (!q?.afficheSi) return true;
  if (q.afficheSi === "anglais-debutant-sans-autre-langue") return p.anglais === "debutant" && languesParlees(p).length === 0;
  if (q.afficheSi === "autre-nationalite") return p.nationalite === "oui";
  return true;
}

// ---------- Notes ----------
export function noteEffective(paysId: string, mesureId: string, p: Profil): number | null {
  const n = notes[paysId]?.[mesureId];
  if (!n || n.statut !== "verifie" || n.note === null) return null;
  // Si tu parles déjà la langue du pays, le quotidien est aussi simple qu'en français.
  if (mesureId === "langue" && parleLangueDe(paysId, p)) return 5;
  return n.note;
}

const disponibilite: Record<string, number> = {};
export function paysCouverts(mesureId: string): number {
  disponibilite[mesureId] ??= pays.filter((x) => notes[x.id]?.[mesureId]?.statut === "verifie").length;
  return disponibilite[mesureId];
}
export const mesureDisponible = (mesureId: string) => paysCouverts(mesureId) > 0;

// ---------- Réponses qui comptent ----------
export type EffetActif = { mesures: string[]; sens: Sens; poids: number; famille: FamilleScore; origine: string };

export const trouverPhrase = (id: string) => quiz.phrases.find((x) => x.id === id);

function effetsDe(ph: Phrase, reponse: string | undefined): Effet[] {
  if (ph.type === "oui-non") return reponse === "oui" ? (ph.oui ?? []) : reponse === "non" ? (ph.non ?? []) : [];
  if (ph.type === "choix") return ph.options?.find((o) => o.id === reponse)?.effets ?? [];
  return [];
}

export function effetsActifs(etat: Etat): EffetActif[] {
  const res: EffetActif[] = [];
  for (const id of etat.priorites) {
    const pr = quiz.priorites.find((x) => x.id === id);
    if (pr) res.push({ mesures: pr.mesures, sens: pr.sens, poids: 2, famille: pr.famille, origine: `priorite:${id}` });
  }
  for (const id of etat.sujets) {
    const s = quiz.sujets.find((x) => x.id === id);
    if (s) res.push({ mesures: [s.mesure], sens: "haut", poids: 1, famille: "valeurs", origine: `sujet:${id}` });
  }
  for (const id of etat.ordre) {
    const ph = trouverPhrase(id);
    if (!ph) continue;
    for (const e of effetsDe(ph, etat.reponses[id])) {
      res.push({ mesures: e.mesures, sens: e.sens, poids: 1, famille: e.famille ?? (ph.famille as FamilleScore), origine: `phrase:${id}` });
    }
  }
  return res;
}

// ---------- Porte d'entrée et badge ----------
export type Badge = "ouverte" | "conditions" | "difficile" | "fermee";
export const LIBELLE_BADGE: Record<Badge, string> = {
  ouverte: "Porte ouverte",
  conditions: "Faisable avec conditions",
  difficile: "Difficile",
  fermee: "Fermé à ton âge",
};
export type Alerte = { texte: string; preuve: Preuve | null };
export type Porte = {
  badge: Badge;
  nom: string;
  type: PorteBrute["type"];
  phrase: string;
  fonds: number | null;
  manque: number | null;
  alertes: Alerte[];
  preuve: Preuve;
  autres: string[];
};

const euros = (n: number) => `${Math.round(n / 50) * 50}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
const preuvePorte = (b: PorteBrute) => preuveSource(b.nom, b.texte, b.statut === "verifie" ? b.source : null, b.lien, b.verifieLe);
const preuveVie = () => preuveSource(vie.nom, vie.texte, vie.source, vie.lien, vie.verifieLe);

export function evaluerPorte(p: Pays, profil: Profil, budget: number | null): Porte {
  const liste = portes(p.id);
  const age = ageMax(profil);
  const vieOuvert = age !== null && age <= vie.ageMaxCandidature;
  const veutVie = profil.objectif === "stage-vie";
  const duree = dureeMois(profil);
  const alertes: Alerte[] = [];
  const autres: string[] = [];
  if (veutVie && age !== null && !vieOuvert) {
    alertes.push({ texte: "Le VIE est fermé à ton âge : il faut avoir moins de 28 ans à la candidature.", preuve: preuveVie() });
  }

  const ue = liste.find((x) => x.type === "ue");
  if (ue) {
    if (veutVie && vieOuvert) autres.push("Un VIE est aussi possible si tu décroches une mission auprès d'une entreprise.");
    return { badge: "ouverte", nom: ue.nom, type: "ue", phrase: "Tu peux y vivre et y travailler sans visa.", fonds: null, manque: null, alertes, preuve: preuvePorte(ue), autres };
  }

  const pvt = liste.find((x) => x.type === "pvt");
  const visa = liste.find((x) => x.type === "visa-travail");
  if (pvt && pvt.ageMax !== undefined) {
    if (age !== null && age > pvt.ageMax) {
      if (visa && visa.statut !== "verifie") alertes.push({ texte: "Les conditions du visa de travail ne sont pas encore vérifiées.", preuve: preuvePorte(visa) });
      return {
        badge: "fermee", nom: pvt.nom, type: "pvt",
        phrase: `Le PVT s'arrête à ${pvt.ageMax} ans. Autre porte : le visa de travail, avec un employeur.`,
        fonds: null, manque: null, alertes, preuve: preuvePorte(pvt), autres,
      };
    }
    const quand = age !== null ? "à ton âge" : `jusqu'à ${pvt.ageMax} ans`;
    let badge: Badge = "ouverte";
    let phrase = pvt.quota ? `PVT ouvert ${quand} : ${pvt.quota.toLocaleString("fr-FR")} places par an.` : `PVT ouvert ${quand}, sans quota.`;
    if (pvt.invitation) {
      badge = "difficile";
      phrase = `PVT ouvert ${quand}, mais il faut recevoir une invitation : rien n'est garanti.`;
      if (pvt.invitationSource) alertes.push({ texte: pvt.invitationTexte ?? "", preuve: preuveSource("Invitation à présenter une demande", pvt.invitationTexte ?? "", pvt.invitationSource.source, pvt.invitationSource.lien, pvt.invitationSource.verifieLe) });
    } else if (pvt.quota !== null && pvt.quota !== undefined && pvt.quota <= 500) {
      badge = "difficile";
      phrase = `PVT ouvert ${quand}, mais seulement ${pvt.quota} places par an.`;
    }
    const fonds = pvt.fonds?.euros ?? null;
    let manque: number | null = null;
    if (fonds !== null && budget !== null && budget < fonds) {
      manque = fonds - budget;
      alertes.push({ texte: `Il te manquerait environ ${euros(manque)} : ce PVT demande ${pvt.fonds?.texte}.`, preuve: preuvePorte(pvt) });
    } else if (fonds === null && pvt.fonds) {
      alertes.push({ texte: `Ce PVT demande ${pvt.fonds.texte}.`, preuve: preuvePorte(pvt) });
    }
    if ((duree !== null && duree > 12) || profil.objectif === "carriere") {
      alertes.push({ texte: "Le PVT dure un an maximum : pour rester plus longtemps, il faudra un autre visa.", preuve: preuvePorte(pvt) });
    }
    if (veutVie && vieOuvert) autres.push("Pour un VIE, il faut décrocher une mission auprès d'une entreprise.");
    return { badge, nom: pvt.nom, type: "pvt", phrase, fonds, manque, alertes, preuve: preuvePorte(pvt), autres };
  }

  // Pays « visa de travail »
  const base = visa ?? ({ type: "visa-travail", nom: "Visa de travail", texte: "Conditions pas encore vérifiées.", source: null, lien: null, verifieLe: null, statut: "a-verifier" } as PorteBrute);
  let phrase = vieOuvert ? "Il faut un employeur sur place, ou une mission en VIE." : "Il faut un employeur qui te fait venir.";
  if (base.statut !== "verifie") phrase += " Les conditions exactes ne sont pas encore vérifiées.";
  for (const c of base.conditions ?? []) alertes.push({ texte: c, preuve: preuvePorte(base) });
  if (vieOuvert) autres.push("VIE : la présence de missions dans ce pays n'est pas encore vérifiée.");
  return { badge: "conditions", nom: vieOuvert ? "Visa de travail ou VIE" : base.nom, type: "visa-travail", phrase, fonds: null, manque: null, alertes, preuve: preuvePorte(base), autres };
}

// ---------- Pays qui descendent dans « Moins adaptés pour toi » ----------
function concerne(regle: string | undefined, p: Pays, etat: Etat): boolean {
  const a = avis[p.id];
  if (regle === "vol-plus-de-3h") {
    const v = notes[p.id]?.vol;
    return v?.statut === "verifie" && (v.valeur ?? 0) > 3;
  }
  if (regle === "autre-ecriture") return !!a?.autreEcriture && !parleLangueDe(p.id, etat.profil);
  if (regle === "employeur-requis") {
    const b = evaluerPorte(p, etat.profil, null).badge;
    return b === "conditions" || b === "fermee";
  }
  if (regle === "langue-locale-necessaire") {
    const n = notes[p.id]?.anglais;
    return n?.statut === "verifie" && (n.note ?? 5) <= 2 && !a?.francaisAuTravail && !parleLangueDe(p.id, etat.profil);
  }
  return false;
}

export function raisonsEcart(etat: Etat): Record<string, string> {
  const res: Record<string, string> = {};
  const ajouter = (id: string, raison: string) => {
    if (!res[id] && !etat.remontes.includes(id)) res[id] = raison;
  };
  for (const p of pays) {
    if (etat.profil.zone === "europe" && p.zone !== "europe") ajouter(p.id, "Tu as choisi de partir en Europe.");
    if (etat.profil.zone === "hors-europe" && p.zone === "europe") ajouter(p.id, "Tu as choisi de partir hors d'Europe.");
    if (etat.profil["pret-anglais"] === "non" && !avis[p.id]?.francaisAuTravail) ajouter(p.id, "Tu veux travailler en français.");
    for (const id of etat.ordre) {
      const ph = trouverPhrase(id);
      if (ph?.type === "ecart" && etat.reponses[id] === ph.ecarteSi && concerne(ph.regle, p, etat)) ajouter(p.id, ph.raison ?? "");
    }
  }
  return res;
}

// ---------- Score ----------
export type Detail = { mesure: string; sens: Sens; poids: number; accord: number; famille: FamilleScore; origine: string };
export type Ligne = {
  pays: Pays;
  score: number;
  familles: Record<FamilleScore, number | null>;
  details: Detail[];
  manquantes: string[];
  ecart: string | null;
  porte: Porte;
};

export function calculer(etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): Ligne[] {
  const effets = effetsActifs(etat);
  const ecarts = raisonsEcart(etat);
  const budget = reglages.budget ?? budgetProfil(etat.profil);
  const lignes = pays.map((p) => {
    const details: Detail[] = [];
    const manquantes = new Set<string>();
    const total = { points: 0, max: 0 };
    const parFamille: Record<FamilleScore, { points: number; max: number }> = {
      travailler: { points: 0, max: 0 }, vivre: { points: 0, max: 0 }, valeurs: { points: 0, max: 0 },
    };
    for (const e of effets) {
      const dispo = e.mesures.filter((m) => noteEffective(p.id, m, etat.profil) !== null);
      e.mesures.filter((m) => !dispo.includes(m) && mesureDisponible(m)).forEach((m) => manquantes.add(m));
      for (const m of dispo) {
        const note = noteEffective(p.id, m, etat.profil) as number;
        const accord = e.sens === "haut" ? (note - 1) / 4 : (5 - note) / 4;
        const base = e.poids / dispo.length;
        const poids = base * reglages.poids[e.famille];
        details.push({ mesure: m, sens: e.sens, poids: base, accord, famille: e.famille, origine: e.origine });
        total.points += poids * accord; total.max += poids;
        // La jauge d'une famille ne dépend pas des curseurs « Et si… ? ».
        parFamille[e.famille].points += base * accord; parFamille[e.famille].max += base;
      }
    }
    const pct = (x: { points: number; max: number }) => (x.max > 0 ? (x.points / x.max) * 100 : null);
    return {
      pays: p,
      score: pct(total) ?? 0,
      familles: { travailler: pct(parFamille.travailler), vivre: pct(parFamille.vivre), valeurs: pct(parFamille.valeurs) },
      details,
      manquantes: [...manquantes],
      ecart: ecarts[p.id] ?? null,
      porte: evaluerPorte(p, etat.profil, budget),
    };
  });
  return lignes.sort((a, b) => Number(!!a.ecart) - Number(!!b.ecart) || b.score - a.score || a.pays.nom.localeCompare(b.pays.nom, "fr"));
}

export const cleTop3 = (lignes: Ligne[]) => lignes.filter((l) => !l.ecart).slice(0, 3).map((l) => l.pays.id).join(",");

export function verdict(score: number): string {
  if (score >= 75) return "Très bonne piste";
  if (score >= 60) return "Bonne piste";
  return "Piste possible";
}

// Deux pays voisins dans le classement, à moins de 5 points d'écart, sont ex aequo.
export function exAequo(lignes: Ligne[], i: number): boolean {
  const s = Math.round(lignes[i].score);
  return [lignes[i - 1], lignes[i + 1]].some((v) => v && !v.ecart === !lignes[i].ecart && Math.abs(Math.round(v.score) - s) < ECART_EX_AEQUO);
}

export function paysSurprise(lignes: Ligne[]): Ligne | null {
  return (
    lignes.filter((l) => !l.ecart).slice(3).find((l) => {
      const n = notes[l.pays.id]?.francais;
      return n?.statut === "verifie" && (n.note ?? 5) <= 2 && l.score >= SEUIL_SURPRISE;
    }) ?? null
  );
}

// ---------- Choix de la phrase suivante ----------
function phraseVisible(ph: Phrase, etat: Etat, ignorerFiltre = false): boolean {
  if (etat.reponses[ph.id] !== undefined) return false;
  if (ph.saufPriorites?.some((x) => etat.priorites.includes(x))) return false;
  if (ph.saufZone && etat.profil.zone === ph.saufZone) return false;
  if (ph.saufReponse && Object.entries(ph.saufReponse).some(([k, v]) => etat.reponses[k] === v)) return false;
  if (ph.siReponse && Object.entries(ph.siReponse).some(([k, v]) => etat.reponses[k] !== v)) return false;
  if (ph.apresFiltre && !ignorerFiltre && etat.reponses[ph.apresFiltre] !== "non") return false;
  if (ph.apresFiltre && ignorerFiltre && etat.reponses[ph.apresFiltre] !== undefined && etat.reponses[ph.apresFiltre] !== "non") return false;
  if (ph.afficheSi === "peut-travailler-en-anglais" && etat.profil.anglais === "debutant" && etat.profil["pret-anglais"] !== "oui") return false;
  return true;
}

function etendue(effets: Effet[], top: Ligne[], profil: Profil): number {
  const ids = [...new Set(effets.flatMap((e) => e.mesures))];
  if (ids.length === 0) return 0;
  const valeurs = top
    .map((l) => {
      const n = ids.map((m) => noteEffective(l.pays.id, m, profil)).filter((x): x is number => x !== null);
      return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
    })
    .filter((x): x is number => x !== null);
  if (valeurs.length < 2) return 0;
  const moy = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  const ecartType = Math.sqrt(valeurs.reduce((a, b) => a + (b - moy) ** 2, 0) / valeurs.length);
  return Math.max(...valeurs) - Math.min(...valeurs) + ecartType / 100;
}

// À quel point une phrase départage les 5 premiers pays (0 : elle ne change rien).
function utilite(ph: Phrase, etat: Etat, top: Ligne[]): number {
  if (ph.type === "oui-non") return Math.max(etendue(ph.oui ?? [], top, etat.profil), etendue(ph.non ?? [], top, etat.profil));
  if (ph.type === "choix") return Math.max(0, ...(ph.options ?? []).map((o) => etendue(o.effets, top, etat.profil)));
  if (ph.type === "ecart") {
    const touches = top.filter((l) => concerne(ph.regle, l.pays, etat)).length;
    return touches > 0 ? 4 + touches / 1000 : 0;
  }
  if (ph.type === "filtre") {
    const enfants = quiz.phrases.filter((x) => ph.ouvre?.includes(x.id) && phraseVisible(x, etat, true));
    return Math.max(0, ...enfants.map((x) => utilite(x, etat, top)));
  }
  return 0;
}

export function prochainePhrase(etat: Etat): Phrase | null {
  const top = calculer(etat).filter((l) => !l.ecart).slice(0, 5);
  let meilleure: Phrase | null = null;
  let max = 0;
  for (const ph of quiz.phrases) {
    if (!phraseVisible(ph, etat)) continue;
    const u = utilite(ph, etat, top);
    if (u > max + 1e-9) { max = u; meilleure = ph; }
  }
  return meilleure;
}

export function resultatPret(etat: Etat): boolean {
  if (etat.ordre.length < MIN_PHRASES) return false;
  const h = etat.historique.slice(-(REPONSES_STABLES + 1));
  return h.length === REPONSES_STABLES + 1 && h.every((x) => x === h[0]);
}

export function repondre(etat: Etat, phraseId: string, reponse: string): Etat {
  const suivant: Etat = { ...etat, reponses: { ...etat.reponses, [phraseId]: reponse }, ordre: [...etat.ordre, phraseId] };
  return { ...suivant, historique: [...etat.historique, cleTop3(calculer(suivant))] };
}

export function annulerDerniere(etat: Etat): Etat {
  const id = etat.ordre.at(-1);
  if (!id) return etat;
  const reponses = { ...etat.reponses };
  delete reponses[id];
  return { ...etat, reponses, ordre: etat.ordre.slice(0, -1), historique: etat.historique.slice(0, -1) };
}

export const demarrerPhrases = (etat: Etat): Etat => ({ ...etat, reponses: {}, ordre: [], historique: [cleTop3(calculer({ ...etat, reponses: {}, ordre: [] }))] });

// ---------- Raisons, points qui coincent, profil de travail ----------
export type Argument = { titre: string; texte: string; preuve: Preuve };

function argument(l: Ligne, d: Detail, profil: Profil): Argument {
  const m = mesures[d.mesure];
  const n = notes[l.pays.id][d.mesure];
  const parle = d.mesure === "langue" && parleLangueDe(l.pays.id, profil);
  const mot = parle ? "tu la parles déjà" : m.mots[(n.note ?? 1) - 1];
  return { titre: `${m.nom} : ${mot}`, texte: n.texte, preuve: preuveMesure(l.pays.id, d.mesure) };
}

function uniques(details: Detail[]): Detail[] {
  const vus = new Set<string>();
  return details.filter((d) => (vus.has(d.mesure) ? false : (vus.add(d.mesure), true)));
}

export function raisons(l: Ligne, profil: Profil, n = 3): Argument[] {
  const tries = [...l.details].sort((a, b) => b.poids * b.accord - a.poids * a.accord || b.accord - a.accord);
  return uniques(tries.filter((d) => d.accord >= 0.5)).slice(0, n).map((d) => argument(l, d, profil));
}

export function coince(l: Ligne, profil: Profil): { arguments: Argument[]; alertes: Alerte[] } {
  const tries = [...l.details].sort((a, b) => a.accord - b.accord || b.poids - a.poids);
  return { arguments: uniques(tries.filter((d) => d.accord < 0.5)).slice(0, 1).map((d) => argument(l, d, profil)), alertes: l.porte.alertes };
}

const STYLE: Record<string, { axe: string; mesure: string; oui: string; non: string }> = {
  chef: { axe: "hiérarchie", mesure: "hierarchie", oui: "un chef qui tranche", non: "un chef qui consulte son équipe" },
  franchise: { axe: "communication", mesure: "communication", oui: "qu'on te parle franchement", non: "qu'on y mette les formes" },
  retard: { axe: "ponctualité", mesure: "ponctualite", oui: "des horaires souples", non: "une ponctualité stricte" },
};

export function profilTravail(etat: Etat, top: Ligne[]) {
  const reponses = Object.entries(STYLE).filter(([id]) => etat.reponses[id] === "oui" || etat.reponses[id] === "non");
  if (reponses.length === 0) return null;
  const morceaux = reponses.map(([id, s]) => (etat.reponses[id] === "oui" ? s.oui : s.non));
  const liste = morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} et ${morceaux.at(-1)}` : morceaux[0];
  const comparaisons = top.map((l) => {
    const communs: string[] = [];
    const differents: string[] = [];
    for (const [, s] of reponses) {
      const d = l.details.find((x) => x.mesure === s.mesure);
      if (!d) continue;
      (d.accord >= 0.5 ? communs : differents).push(s.axe);
    }
    return { pays: l.pays, communs, differents, preuve: preuveMesure(l.pays.id, "hierarchie") };
  });
  return { phrase: `Tu préfères ${liste}.`, comparaisons };
}
