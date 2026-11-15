// Le calcul du quiz : un simple calcul, sans IA.
// La méthode complète est expliquée sur la page /methode.
import { ECART_EX_AEQUO, SEUIL_SURPRISE } from "@/config";
import { pays, type Pays } from "./pays";
import {
  avis, doubleNationalite, mesures, notes, portes, quiz, vie, preuveMesure, preuveSource,
  type CasDouble, type Dilemme, type FamilleScore, type OptionDilemme, type PorteBrute, type Preuve,
} from "./donnees";

export type Profil = Record<string, string | string[] | undefined>;

export type Etat = {
  profil: Profil;
  priorites: string[];
  sujets: string[];
  reponses: Record<string, string>; // dilemme → l'option choisie, ou "passer"
  ordre: string[]; // dilemmes dans l'ordre où ils ont été vus
  remontes: string[]; // pays remontés à la main depuis « Moins adaptés »
  historique: string[]; // le top 3 après chaque réponse (le premier : avant les dilemmes)
};

export type Reglages = { poids: Record<FamilleScore, number>; budget: number | null };

export const ETAT_VIDE: Etat = { profil: {}, priorites: [], sujets: [], reponses: {}, ordre: [], remontes: [], historique: [] };
export const REGLAGES_DEFAUT: Reglages = { poids: { travailler: 1, vivre: 1, valeurs: 1 }, budget: null };
export const MIN_DILEMMES = 6;
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
// Un effet porte sur une seule mesure. « haut » : plus la note est haute, mieux c'est.
// « position » : la note la plus proche de la position préférée gagne.
export type EffetActif = { mesure: string; sens: "haut" | "position"; position?: number; poids: number; famille: FamilleScore; origine: string };

export const trouverDilemme = (id: string) => quiz.dilemmes.find((x) => x.id === id);
export const optionChoisie = (etat: Etat, id: string): OptionDilemme | undefined => trouverDilemme(id)?.options.find((o) => o.id === etat.reponses[id]);

// Un dilemme n'est jamais proposé si l'une de ses mesures est notée pour moins de 60 % des pays.
export const SEUIL_DILEMME = 0.6;
export const mesuresDuDilemme = (d: Dilemme) => [...new Set(d.options.flatMap((o) => o.effets.flatMap((e) => e.mesures)))];
export const dilemmeActif = (d: Dilemme) => mesuresDuDilemme(d).every((m) => paysCouverts(m) >= SEUIL_DILEMME * pays.length);

const familleDe = (m: string) => (mesures[m]?.critere.famille ?? "vivre") as FamilleScore;

// Les effets d'une option, mesure par mesure. Un effet sur deux mesures partage son poids entre elles.
function effetsOption(o: OptionDilemme, origine: string): EffetActif[] {
  return o.effets.flatMap((e) =>
    e.mesures.map((m) => ({
      mesure: m,
      sens: e.position !== undefined ? ("position" as const) : ("haut" as const),
      position: e.position,
      poids: (e.position !== undefined ? 1 : (e.poids ?? 1)) / e.mesures.length,
      famille: familleDe(m),
      origine,
    })),
  );
}

export function effetsBruts(etat: Etat): EffetActif[] {
  const res: EffetActif[] = [];
  for (const id of etat.priorites) {
    const pr = quiz.priorites.find((x) => x.id === id);
    if (pr) for (const m of pr.mesures) res.push({ mesure: m, sens: "haut", poids: 2 / pr.mesures.length, famille: pr.famille, origine: `priorite:${id}` });
  }
  for (const id of etat.sujets) {
    const s = quiz.sujets.find((x) => x.id === id);
    if (s) res.push({ mesure: s.mesure, sens: "haut", poids: 1, famille: "valeurs", origine: `sujet:${id}` });
  }
  for (const id of etat.ordre) {
    const o = optionChoisie(etat, id);
    if (o) res.push(...effetsOption(o, `dilemme:${id}`));
  }
  res.push(...effetsObjectif(etat));
  return res;
}

// ---------- Ton projet ----------
// Chaque objectif donne des poids de départ (0,5), plus légers qu'une réponse de dilemme (1).
// Si tu as choisi, dans un dilemme, une autre option que celle qui visait cette mesure,
// ta réponse l'emporte : le poids de départ disparaît.
export const POIDS_OBJECTIF = 0.5;
const peutTravaillerEnAnglais = (p: Profil) => !(p.anglais === "debutant" && p["pret-anglais"] !== "oui");

export function mesuresEcartees(etat: Etat): Set<string> {
  const res = new Set<string>();
  for (const id of etat.ordre) {
    const d = trouverDilemme(id);
    const choisie = optionChoisie(etat, id);
    if (!d || !choisie) continue;
    const gardees = new Set(choisie.effets.flatMap((e) => e.mesures));
    for (const o of d.options) if (o !== choisie) for (const e of o.effets) for (const m of e.mesures) if (!gardees.has(m)) res.add(m);
  }
  return res;
}

export function effetsObjectif(etat: Etat): EffetActif[] {
  const obj = typeof etat.profil.objectif === "string" ? quiz.objectifs[etat.profil.objectif] : undefined;
  if (!obj) return [];
  const ecartees = mesuresEcartees(etat);
  return obj.effets
    .filter((e) => e.afficheSi !== "peut-travailler-en-anglais" || peutTravaillerEnAnglais(etat.profil))
    .flatMap((e) => e.mesures)
    .filter((m) => mesureDisponible(m) && !ecartees.has(m))
    .map((m) => ({ mesure: m, sens: "haut" as const, poids: POIDS_OBJECTIF, famille: familleDe(m), origine: `objectif:${etat.profil.objectif}` }));
}

// Toutes les réponses qui comptent, regroupées mesure par mesure : si plusieurs réponses visent
// la même mesure, on garde la plus grande importance, on ne les additionne pas.
// Seules les 3 priorités comptent double.
export function effetsActifs(etat: Etat): EffetActif[] {
  const groupes = new Map<string, EffetActif>();
  for (const e of effetsBruts(etat)) {
    const deja = groupes.get(e.mesure);
    if (!deja || e.poids > deja.poids) groupes.set(e.mesure, e);
  }
  return [...groupes.values()];
}

// À quel point une note va dans le sens de l'effet : de 0 (pas du tout) à 1 (tout à fait).
export function accordNote(e: { sens: "haut" | "position"; position?: number }, note: number): number {
  if (e.sens === "position") return 1 - Math.abs(note - (e.position ?? 3)) / 4;
  return (note - 1) / 4;
}

// ---------- Porte d'entrée et badge ----------
export type Badge = "nationalite" | "ouverte" | "conditions" | "difficile" | "fermee";
export const LIBELLE_BADGE: Record<Badge, string> = {
  nationalite: "Porte ouverte grâce à ta nationalité",
  ouverte: "Porte ouverte",
  conditions: "Faisable avec conditions",
  difficile: "Difficile",
  fermee: "Fermé à ton âge",
};
export type Alerte = { texte: string; preuve: Preuve | null };
export type Porte = {
  badge: Badge;
  nom: string;
  type: PorteBrute["type"] | "nationalite";
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

// Le cas de double nationalité déclaré, s'il ouvre ce pays (seulement les cas décrits et sourcés).
export function casNationalite(profil: Profil): CasDouble | null {
  if (profil.nationalite !== "oui") return null;
  return doubleNationalite.cas.find((c) => c.id === profil["nationalite-laquelle"]) ?? null;
}

export function evaluerPorte(p: Pays, profil: Profil, budget: number | null): Porte {
  const cas = casNationalite(profil);
  if (cas?.pays === p.id && cas.acces) {
    const preuve: Preuve = { type: cas.type, titre: cas.titre, texte: cas.texte, source: cas.source, lien: cas.lien, verifieLe: cas.verifieLe, licence: cas.licence };
    return {
      badge: "nationalite", nom: `Nationalité ${cas.nationalite.toLowerCase()}`, type: "nationalite", phrase: cas.acces,
      fonds: null, manque: null, alertes: cas.genre === "piege" ? [{ texte: cas.texte, preuve }] : [], preuve, autres: [],
    };
  }
  const liste = portes(p.id);
  const age = ageMax(profil);
  const vieOuvert = age !== null && age <= vie.ageMaxCandidature;
  const veutVie = profil.objectif === "stage-vie";
  const duree = dureeMois(profil);
  const alertes: Alerte[] = [];
  const autres: string[] = [];
  if (veutVie && age !== null && !vieOuvert) {
    alertes.push({ texte: "Le VIE est fermé à ton âge : il faut avoir moins de 28 ans à la candidature.", preuve: preuveVie() });
  }

  const ue = liste.find((x) => x.type === "ue");
  if (ue) {
    if (veutVie && vieOuvert) autres.push("Un VIE est aussi possible si tu décroches une mission auprès d’une entreprise.");
    return { badge: "ouverte", nom: ue.nom, type: "ue", phrase: "Tu peux y vivre et y travailler sans visa.", fonds: null, manque: null, alertes, preuve: preuvePorte(ue), autres };
  }

  const pvt = liste.find((x) => x.type === "pvt");
  const visa = liste.find((x) => x.type === "visa-travail");
  if (pvt && pvt.ageMax !== undefined) {
    if (age !== null && age > pvt.ageMax) {
      if (visa && (visa.statut !== "verifie" || visa.detailsAVerifier)) alertes.push({ texte: "Les conditions détaillées du visa de travail ne sont pas encore vérifiées.", preuve: preuvePorte(visa) });
      return {
        badge: "fermee", nom: pvt.nom, type: "pvt",
        phrase: `Le PVT (Programme Vacances-Travail) s’arrête à ${pvt.ageMax} ans. Autre porte : le visa de travail, avec un employeur.`,
        fonds: null, manque: null, alertes, preuve: preuvePorte(pvt), autres,
      };
    }
    const quand = age !== null ? "à ton âge" : `jusqu’à ${pvt.ageMax} ans`;
    const PVT = "PVT (Programme Vacances-Travail)";
    let badge: Badge = "ouverte";
    let phrase = pvt.quota ? `${PVT} ouvert ${quand} : ${pvt.quota.toLocaleString("fr-FR")} places par an.` : `${PVT} ouvert ${quand}, sans quota.`;
    if (pvt.invitation) {
      badge = "difficile";
      phrase = `${PVT} ouvert ${quand}, mais il faut recevoir une invitation : rien n’est garanti.`;
      if (pvt.invitationSource) alertes.push({ texte: pvt.invitationTexte ?? "", preuve: preuveSource("Invitation à présenter une demande", pvt.invitationTexte ?? "", pvt.invitationSource.source, pvt.invitationSource.lien, pvt.invitationSource.verifieLe) });
    } else if (pvt.quota !== null && pvt.quota !== undefined && pvt.quota <= 500) {
      badge = "difficile";
      phrase = `${PVT} ouvert ${quand}, mais seulement ${pvt.quota} places par an.`;
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
      alertes.push({ texte: "Le PVT dure un an maximum : pour rester plus longtemps, il faudra un autre visa.", preuve: preuvePorte(pvt) });
    }
    if (veutVie && vieOuvert) autres.push("Pour un VIE, il faut décrocher une mission auprès d’une entreprise.");
    return { badge, nom: pvt.nom, type: "pvt", phrase, fonds, manque, alertes, preuve: preuvePorte(pvt), autres };
  }

  // Pays « visa de travail »
  const base = visa ?? ({ type: "visa-travail", nom: "Visa de travail", texte: "Conditions pas encore vérifiées.", source: null, lien: null, verifieLe: null, statut: "a-verifier" } as PorteBrute);
  let phrase = vieOuvert ? "Il faut un employeur sur place, ou une mission en VIE (volontariat international en entreprise)." : "Il faut un employeur qui te fait venir.";
  if (base.statut !== "verifie" || base.detailsAVerifier) phrase += " Les conditions détaillées (employeur, salaire, diplôme) restent à vérifier sur le site officiel du pays.";
  for (const c of base.conditions ?? []) alertes.push({ texte: c, preuve: preuvePorte(base) });
  if (vieOuvert) autres.push("VIE : la présence de missions dans ce pays n’est pas encore vérifiée.");
  return { badge: "conditions", nom: vieOuvert ? "Visa de travail ou VIE" : base.nom, type: "visa-travail", phrase, fonds: null, manque: null, alertes, preuve: preuvePorte(base), autres };
}

// ---------- Pays qui descendent dans « Moins adaptés pour toi » ----------
export function concerne(regle: string | undefined, p: Pays, etat: Etat): boolean {
  const a = avis[p.id];
  if (regle === "autre-ecriture") return !!a?.autreEcriture && !parleLangueDe(p.id, etat.profil);
  if (regle === "employeur-requis") {
    const b = evaluerPorte(p, etat.profil, null).badge;
    return b === "conditions" || b === "fermee";
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
    if (etat.profil.zone === "hors-europe" && p.zone === "europe") ajouter(p.id, "Tu as choisi de partir hors d’Europe.");
    if (etat.profil["pret-anglais"] === "non" && !avis[p.id]?.francaisAuTravail) ajouter(p.id, "Tu veux travailler en français.");
    for (const id of etat.ordre) {
      const ecart = optionChoisie(etat, id)?.ecart;
      if (ecart && concerne(ecart.regle, p, etat)) ajouter(p.id, ecart.raison);
    }
  }
  return res;
}

// ---------- Score ----------
export type Detail = {
  mesure: string; sens: "haut" | "position"; position?: number; poids: number; accord: number; famille: FamilleScore; origine: string;
  neutre: boolean; // donnée manquante sur une priorité : comptée à 50 %
};
export type Ligne = {
  pays: Pays;
  score: number;
  sansDonnees: boolean; // aucune donnée vérifiée sur tes critères : pas de pourcentage
  familles: Record<FamilleScore, number | null>;
  details: Detail[];
  manquantes: string[]; // données « à vérifier » sur tes critères (hors priorités)
  neutres: string[]; // données « à vérifier » sur tes priorités, comptées à 50 %
  ecart: string | null;
  porte: Porte;
  couverture: number; // part de tes critères (en nombre) pour lesquels ce pays a une donnée vérifiée
  peuDeDonnees: boolean;
};

// En dessous de cette part de critères notés, un pays ne peut pas entrer dans le top 3.
export const COUVERTURE_MIN = 0.6;
// Une donnée manquante sur une priorité compte comme une note neutre.
export const ACCORD_NEUTRE = 0.5;

const estPriorite = (e: EffetActif) => e.origine.startsWith("priorite:");

export function calculer(etat: Etat, reglages: Reglages = REGLAGES_DEFAUT): Ligne[] {
  const effets = effetsActifs(etat);
  const ecarts = raisonsEcart(etat);
  const budget = reglages.budget ?? budgetProfil(etat.profil);
  // Tes critères : chaque mesure qui compte pour toi, comptée une fois.
  const tesCriteres = [...new Set(effets.map((e) => e.mesure).filter(mesureDisponible))];
  const lignes = pays.map((p) => {
    const details: Detail[] = [];
    const manquantes = new Set<string>();
    const neutres = new Set<string>();
    const total = { points: 0, max: 0 };
    const parFamille: Record<FamilleScore, { points: number; max: number }> = {
      travailler: { points: 0, max: 0 }, vivre: { points: 0, max: 0 }, valeurs: { points: 0, max: 0 },
    };
    for (const e of effets) {
      if (!mesureDisponible(e.mesure)) continue;
      const note = noteEffective(p.id, e.mesure, etat.profil);
      const priorite = estPriorite(e);
      // Priorité : la mesure compte, notée ou neutre. Sinon : seules les mesures notées comptent.
      if (note === null) {
        (priorite ? neutres : manquantes).add(e.mesure);
        if (!priorite) continue;
      }
      const neutre = note === null;
      const accord = neutre ? ACCORD_NEUTRE : accordNote(e, note);
      const poids = e.poids * reglages.poids[e.famille];
      details.push({ mesure: e.mesure, sens: e.sens, position: e.position, poids: e.poids, accord, famille: e.famille, origine: e.origine, neutre });
      total.points += poids * accord; total.max += poids;
      // La jauge d'une famille ne dépend pas des curseurs « Et si… ? ».
      parFamille[e.famille].points += e.poids * accord; parFamille[e.famille].max += e.poids;
    }
    const pct = (x: { points: number; max: number }) => (x.max > 0 ? (x.points / x.max) * 100 : null);
    const notes = tesCriteres.filter((m) => noteEffective(p.id, m, etat.profil) !== null).length;
    const couverture = tesCriteres.length > 0 ? notes / tesCriteres.length : 1;
    const reelles = details.filter((d) => !d.neutre).length;
    const porte = evaluerPorte(p, etat.profil, budget);
    const fermeAge = porte.badge === "fermee" && !etat.remontes.includes(p.id) ? `Fermé à ton âge. ${porte.phrase}` : null;
    return {
      couverture,
      peuDeDonnees: couverture < COUVERTURE_MIN || reelles === 0,
      sansDonnees: reelles === 0,
      pays: p,
      score: pct(total) ?? 0,
      familles: { travailler: pct(parFamille.travailler), vivre: pct(parFamille.vivre), valeurs: pct(parFamille.valeurs) },
      details,
      manquantes: [...manquantes],
      neutres: [...neutres],
      ecart: ecarts[p.id] ?? fermeAge,
      porte,
    };
  });
  return lignes.sort((a, b) => Number(!!a.ecart) - Number(!!b.ecart) || Number(a.peuDeDonnees) - Number(b.peuDeDonnees) || b.score - a.score || a.pays.nom.localeCompare(b.pays.nom, "fr"));
}

export const cleTop3 = (lignes: Ligne[]) => lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3).map((l) => l.pays.id).join(",");

export function verdict(score: number): string {
  if (score >= 75) return "Très bonne piste";
  if (score >= 60) return "Bonne piste";
  return "Piste possible";
}

// Égalités : dans chaque groupe (même liste, même fiabilité), on compare chaque pays au premier
// du groupe, sur les scores non arrondis. À 5 points ou moins du premier, il est à égalité avec lui.
export function egalites(lignes: Ligne[]): boolean[] {
  const res = lignes.map(() => false);
  let chef = -1;
  lignes.forEach((l, i) => {
    const c = chef >= 0 ? lignes[chef] : null;
    const memeGroupe = c && !c.ecart === !l.ecart && c.peuDeDonnees === l.peuDeDonnees && !l.peuDeDonnees && c.score - l.score <= ECART_EX_AEQUO;
    if (memeGroupe) { res[i] = true; res[chef] = true; } else chef = i;
  });
  return res;
}

export function paysSurprise(lignes: Ligne[]): Ligne | null {
  return (
    lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(3).find((l) => {
      const n = notes[l.pays.id]?.francais;
      return n?.statut === "verifie" && (n.note ?? 5) <= 2 && l.score >= SEUIL_SURPRISE;
    }) ?? null
  );
}

// ---------- Choix du dilemme suivant ----------
export function dilemmeVisible(d: Dilemme, etat: Etat): boolean {
  if (etat.reponses[d.id] !== undefined) return false;
  if (!dilemmeActif(d)) return false;
  if (d.afficheSi === "peut-travailler-en-anglais" && !peutTravaillerEnAnglais(etat.profil)) return false;
  return true;
}

// Les mesures d'une option qui changeraient vraiment quelque chose : une option qui ne fait
// que redonner une importance déjà atteinte (par une priorité, par exemple) ne départage rien.
function effetsNouveaux(o: OptionDilemme, etat: Etat): EffetActif[] {
  const actuels = new Map(effetsActifs(etat).map((e) => [e.mesure, e]));
  return effetsOption(o, "").filter((e) => {
    const deja = actuels.get(e.mesure);
    return !deja || e.poids > deja.poids + 1e-9 || (e.sens === "position" && deja.position !== e.position);
  });
}

// L'écart entre les pays sur ces mesures : de 0 (tous pareils) à 4 (tout le contraire).
function etendue(effets: EffetActif[], liste: Ligne[], profil: Profil): number {
  if (effets.length === 0) return 0;
  const valeurs = liste
    .map((l) => {
      const a = effets.map((e) => {
        const n = noteEffective(l.pays.id, e.mesure, profil);
        return n === null ? null : accordNote(e, n);
      }).filter((x): x is number => x !== null);
      return a.length ? (4 * a.reduce((x, y) => x + y, 0)) / a.length : null;
    })
    .filter((x): x is number => x !== null);
  if (valeurs.length < 2) return 0;
  const moy = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
  const ecartType = Math.sqrt(valeurs.reduce((a, b) => a + (b - moy) ** 2, 0) / valeurs.length);
  return Math.max(...valeurs) - Math.min(...valeurs) + ecartType / 100;
}

// À quel point un dilemme départage les pays donnés (0 : il ne change rien).
export function utilite(d: Dilemme, etat: Etat, liste: Ligne[]): number {
  return Math.max(0, ...d.options.map((o) => {
    let u = etendue(effetsNouveaux(o, etat), liste, etat.profil);
    if (o.ecart) {
      const touches = liste.filter((l) => concerne(o.ecart?.regle, l.pays, etat)).length;
      if (touches > 0) u = Math.max(u, 4 + touches / 1000);
    }
    return u;
  }));
}

export function prochainDilemme(etat: Etat): Dilemme | null {
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 5);
  let meilleur: Dilemme | null = null;
  let max = 0;
  for (const d of quiz.dilemmes) {
    if (!dilemmeVisible(d, etat)) continue;
    const u = utilite(d, etat, top);
    if (u > max + 1e-9) { max = u; meilleur = d; }
  }
  return meilleur;
}

// « Passer » ne compte ni pour le minimum de dilemmes, ni pour la stabilité du top 3.
export const repondues = (etat: Etat) => etat.ordre.filter((id) => etat.reponses[id] !== "passer").length;

// Le top 3 après chaque vraie réponse (le premier : avant les dilemmes).
function historiqueReel(etat: Etat): string[] {
  return etat.historique.filter((_, i) => i === 0 || etat.reponses[etat.ordre[i - 1]] !== "passer");
}

// Nombre de vraies réponses d'affilée sans que le top 3 bouge.
export function reponsesStables(etat: Etat): number {
  const h = historiqueReel(etat);
  let n = 0;
  for (let i = h.length - 1; i > 0 && h[i] === h[i - 1]; i--) n++;
  return n;
}

export function resultatPret(etat: Etat): boolean {
  return repondues(etat) >= MIN_DILEMMES && reponsesStables(etat) >= REPONSES_STABLES;
}

export function repondre(etat: Etat, id: string, reponse: string): Etat {
  const suivant: Etat = { ...etat, reponses: { ...etat.reponses, [id]: reponse }, ordre: [...etat.ordre, id] };
  return { ...suivant, historique: [...etat.historique, cleTop3(calculer(suivant))] };
}

export function annulerDerniere(etat: Etat): Etat {
  const id = etat.ordre.at(-1);
  if (!id) return etat;
  const reponses = { ...etat.reponses };
  delete reponses[id];
  return { ...etat, reponses, ordre: etat.ordre.slice(0, -1), historique: etat.historique.slice(0, -1) };
}

// Recalcule l'historique du top 3 après un changement de réponse (« Ce n'est pas moi »).
export function rejouer(etat: Etat): Etat {
  const historique = [cleTop3(calculer({ ...etat, reponses: {}, ordre: [] }))];
  for (let k = 1; k <= etat.ordre.length; k++) {
    const ordre = etat.ordre.slice(0, k);
    historique.push(cleTop3(calculer({ ...etat, ordre, reponses: Object.fromEntries(ordre.map((id) => [id, etat.reponses[id]])) })));
  }
  return { ...etat, historique };
}

export function changerReponse(etat: Etat, id: string, reponse: string): Etat {
  if (!etat.ordre.includes(id)) return repondre(etat, id, reponse);
  return rejouer({ ...etat, reponses: { ...etat.reponses, [id]: reponse } });
}

// ---------- Ton portrait ----------
// 4 à 6 phrases tirées de tes vraies réponses : ton projet, tes priorités, tes dilemmes.
// Jamais une phrase sur une question passée.
export type LignePortrait = { cle: string; texte: string; revoir: { t: "objectif" } | { t: "priorites" } | { t: "dilemme"; id: string } };
export const MAX_PORTRAIT = 6;

const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export const listeFr = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} et ${l.at(-1)}` : (l[0] ?? ""));

export function portrait(etat: Etat): LignePortrait[] {
  const res: LignePortrait[] = [];
  const obj = typeof etat.profil.objectif === "string" ? quiz.objectifs[etat.profil.objectif] : undefined;
  if (obj) res.push({ cle: "objectif", texte: `Tu pars pour ${obj.nom}.`, revoir: { t: "objectif" } });
  const prio = etat.priorites.map((id) => quiz.priorites.find((p) => p.id === id)?.label).filter((x): x is string => !!x);
  if (prio.length) res.push({ cle: "priorites", texte: `Ce qui compte le plus pour toi\u00a0: ${listeFr(prio.map(minuscule))}.`, revoir: { t: "priorites" } });
  // Les réponses qui changent le plus ton classement d'abord : une option avec un effet avant une option sans effet.
  const poids = (o: OptionDilemme) => (o.ecart ? 1 : 0) + o.effets.reduce((a, e) => a + (e.position !== undefined ? 1 : (e.poids ?? 1)), 0);
  const dilemmes = etat.ordre
    .map((id, rang) => ({ id, rang, o: optionChoisie(etat, id) }))
    .filter((x): x is { id: string; rang: number; o: OptionDilemme } => !!x.o?.portrait)
    .sort((a, b) => poids(b.o) - poids(a.o) || a.rang - b.rang);
  const vus = new Set(res.map((r) => r.texte));
  for (const { id, o } of dilemmes) {
    if (res.length >= MAX_PORTRAIT) break;
    if (vus.has(o.portrait)) continue;
    vus.add(o.portrait);
    res.push({ cle: `dilemme:${id}`, texte: o.portrait, revoir: { t: "dilemme", id } });
  }
  return res;
}

export const demarrerDilemmes = (etat: Etat): Etat => ({ ...etat, reponses: {}, ordre: [], historique: [cleTop3(calculer({ ...etat, reponses: {}, ordre: [] }))] });

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

// « Pourquoi ce pays » : seulement les points notés 4 ou 5 sur 5 dans le sens de tes réponses.
export const ACCORD_ARGUMENT = 0.75;

export function raisons(l: Ligne, profil: Profil, n = 3): Argument[] {
  const tries = [...l.details].filter((d) => !d.neutre && d.accord >= ACCORD_ARGUMENT).sort((a, b) => b.poids * b.accord - a.poids * a.accord || b.accord - a.accord);
  return uniques(tries).slice(0, n).map((d) => argument(l, d, profil));
}

// « Ce qui peut coincer » : le point le plus défavorable (noté 1 ou 2 sur 5 dans le sens de tes réponses).
export function coince(l: Ligne, profil: Profil): { arguments: Argument[]; alertes: Alerte[] } {
  const tries = [...l.details].filter((d) => !d.neutre && d.accord <= 0.25).sort((a, b) => a.accord - b.accord || b.poids - a.poids);
  return { arguments: uniques(tries).slice(0, 1).map((d) => argument(l, d, profil)), alertes: l.porte.alertes };
}

// « Ton profil de travail » : tes réponses aux dilemmes de culture au travail, comparées à ton top 3.
export function profilTravail(etat: Etat, top: Ligne[]) {
  const reponses = quiz.dilemmes
    .filter((d) => d.axe && etat.reponses[d.id] !== undefined)
    .map((d) => ({ d, o: optionChoisie(etat, d.id) }))
    .filter((x): x is { d: Dilemme; o: OptionDilemme } => !!x.o?.style && !!x.o.effets[0]);
  if (reponses.length === 0) return null;
  const morceaux = reponses.map((x) => x.o.style as string);
  const liste = morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} et ${morceaux.at(-1)}` : morceaux[0];
  const comparaisons = top.map((l) => {
    const communs: string[] = [];
    const differents: string[] = [];
    for (const { d, o } of reponses) {
      const det = l.details.find((x) => x.mesure === o.effets[0].mesures[0] && !x.neutre);
      if (!det) continue;
      if (det.accord >= 0.75) communs.push(d.axe as string);
      else if (det.accord <= 0.25) differents.push(d.axe as string);
    }
    return { pays: l.pays, communs, differents, preuve: preuveMesure(l.pays.id, reponses[0].o.effets[0].mesures[0]) };
  });
  return { phrase: `Tu préfères ${liste}.`, comparaisons };
}
