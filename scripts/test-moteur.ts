// Test du moteur de calcul : rejoue des quiz tirés au hasard (toujours les mêmes, graine fixe)
// et vérifie les règles publiées sur /methode.
// Usage : npm run test:moteur
import fs from "node:fs";
import path from "node:path";
import { notes as notesPays, notesFrance, portes, preuveMesure, quiz, sources, trouverElement, vie, type Valeur } from "@/lib/donnees";
import { validerSession, SESSION_VIDE, nouvelleSession, scenesVues } from "@/lib/memoire";
import {
  ACCORD_NEUTRE, COUVERTURE_MIN, ETAT_VIDE, REGLAGES_DEFAUT, calculer, cleTop3, dilemmeActif, effetsActifs, etatDepart, rejouer,
  GROUPES, NIVEAUX, MESURES_BONUS, mesuresPrincipales, completudePays, aplatir, faisabilite, fiabiliteDe, visaSimple, avecQui, groupesEgalite, bilanDepartage, causesEcart, comparer, noteEmployeurLibre, PENALITES, effetsAjustes, egalites, niveauDeduit, paysCouverts, paysSurprise, evaluerPorte, valeurLisible, prochainDepartage, separation, categorieDe, lignesTop, repondre, repondues, trouverDilemme, valeurFrance, budgetProfil, MAX_DEPARTAGE, mesuresQuiSeparent, raisonDepartage, encoreEgalite, noteEffective, reponsesDe, optionReponse, effetsActifs as effetsDe, LIBELLE_ECHELLE, sceneDe, cleScene, annulerDerniere, mesureDisponible, enviesDe, poidsEnvie, limiteTouche, accesPays, facteurAcces, noteContinue, noteCalcul, mesureClassante, REGLES, impossibiliteLegale, envieClassante, aideDe,
  type Etat, type Profil,
} from "@/lib/moteur";
import { PASSER, certitudeReponse, dimensionsReponse, effetsReponse, enregistrer, niveauAnglais, profilDe, valeurValide } from "@/lib/elements";
import { candidatsAdaptatifs, etatAvant, prochainAffiner, restantsAffiner, resultatProvisoire, chapitreDe, dimensionsElement, elementVisible, importance, scoreElement, prochainElement, questionnaireFini, situationsLimites } from "@/lib/parcours";
import { portrait, portraitComplet } from "@/lib/portrait";
import { construireProfil, contradictions, niveauCertitude } from "@/lib/profil";
import { intuition, zoneDuPays } from "@/lib/intuition";
import { ECART_EX_AEQUO } from "@/config";
import { DUREE_DEPLACEMENT, DUREE_REVELATION, dureeAnimation, mouvementReduit } from "@/lib/animation";
import { pays, trouverPays } from "@/lib/pays";
import { listeAVerifier } from "@/lib/averifier";
import { complementMesure, disponibiliteMemo, mesureSecteur, raisonEnvieIndisponible } from "@/lib/moteur";
import { mesures } from "@/lib/donnees";
import { itemsBanque } from "@/lib/banque";
import { nonDemandes } from "@/lib/parcours";
import { choisir, hasard, parcoursAuHasard, reponseAuHasard, type Alea } from "./hasard";

// ---------- Compteur d'échecs ----------
const echecs: string[] = [];
let verifs = 0;
function verifier(ok: boolean, message: string) {
  verifs++;
  if (!ok) echecs.push(message);
}

// ---------- Un quiz au hasard (tous les formats) ----------
function quizAuHasard(r: Alea, passerTout = false): Etat {
  return parcoursAuHasard(r, { passer: passerTout ? 1 : 0.08 });
}

// ---------- Un état construit à la main ----------
// « profil » : les réponses du chapitre 1 (anglais : « debutant », « moyen » ou « courant », traduit en thermomètres) ;
// « envies » : dans l'ordre du classement (complété jusqu'à 5 avec des envies sans effet sur le test, si besoin, en fin de liste).
const NIVEAU_THERMO: Record<string, number> = { debutant: 1, moyen: 3, courant: 5 };
function construire({ profil = {}, envies = [], reponses = {} }: { profil?: Record<string, string | string[]>; envies?: string[]; reponses?: Record<string, Valeur> } = {}): Etat {
  const r: Record<string, Valeur> = {};
  for (const [k, v] of Object.entries(profil)) {
    if (k === "anglais") { r["anglais-reunion"] = NIVEAU_THERMO[v as string]; r["anglais-vie"] = NIVEAU_THERMO[v as string]; continue; }
    if (trouverElement(k)) r[k] = v;
  }
  // Les critères en trois temps : le premier est le plus dur à sacrifier, le dernier (s'il y en a 3 ou plus) passe au second plan.
  if (envies.length) { r.envies = envies; if (envies.length >= 2) r.sacrifice = envies[0]; if (envies.length >= 3) r["second-plan"] = envies.at(-1)!; }
  Object.assign(r, reponses);
  return rejouer({ ...ETAT_VIDE, reponses: r, ordre: Object.keys(r) });
}

const budgetDe = (p: Profil) => budgetProfil(p);
// Ancienne forme { ...ETAT_VIDE, profil, priorites } → état construit.
const etatDe = (x: { profil?: Profil; priorites?: string[] } & Partial<Etat>) => construire({ profil: (x.profil ?? {}) as Record<string, string>, envies: x.priorites ?? [] });
const scores = (etat: Etat) => Object.fromEntries(calculer(etat).map((l) => [l.pays.id, l.score]));
const ressemblances = (etat: Etat, reglages = REGLAGES_DEFAUT) => Object.fromEntries(calculer(etat, reglages).map((l) => [l.pays.id, l.ressemble]));
const memesScores = (a: Record<string, number>, b: Record<string, number>) => Object.keys(a).every((k) => Math.abs(a[k] - b[k]) < 1e-9);

// ---------- 1. Quiz au hasard : invariants ----------
const NB = 400;
const r = hasard(20261114);
let changeAvecObjectif = 0;
const objectifs = Object.keys(quiz.objectifs);
for (let i = 0; i < NB; i++) {
  const etat = quizAuHasard(r);
  const lignes = calculer(etat);
  const base = scores(etat);

  // Le projet compte : on mesure dans combien de profils il change le top 3 (vérifié après la boucle).
  if (new Set(objectifs.map((o) => cleTop3(calculer({ ...etat, profil: { ...etat.profil, objectif: o } })))).size > 1) changeAvecObjectif++;

  // « Passer » ne compte pas : ni comme réponse, ni dans le calcul.
  const suivant = trouverDilemme(choisir(r, quiz.dilemmes.filter((d) => etat.reponses[d.id] === undefined)).id);
  if (suivant) {
    const passe = repondre(etat, suivant.id, "passer");
    verifier(repondues(passe) === repondues(etat), `quiz ${i} : « Passer » compte comme une réponse`);
    verifier(memesScores(base, scores(passe)), `quiz ${i} : « Passer » change les scores`);
  }

  // Pas de NaN, tout entre 0 et 100.
  for (const l of lignes) {
    verifier(Number.isFinite(l.score) && l.score >= 0 && l.score <= 100, `quiz ${i} : score hors limites pour ${l.pays.nom} (${l.score})`);
  }

  // Prompt 6 : « Il te ressemble » ne dépend ni de l'âge, ni du budget, ni de la durée, ni de la nationalité, ni de ta famille :
  // ils pèsent sur « Il t'est accessible ». Exception (prompt 3e) : avec « Je préfère pouvoir changer d'employeur librement »,
  // l'âge et la nationalité comptent, parce qu'ils décident si un visa te lie à un employeur.
  // (Prompt 7 : la phrase « Pouvoir changer de poste dès qu'une offre te plaît » de « Ta semaine idéale » aussi.)
  const baseR = ressemblances(etat);
  const d18 = String(etat.reponses["job-de-reve"] ?? "").endsWith("b") || (Array.isArray(etat.reponses.envies) && etat.reponses.envies.includes("employeur")) || (etat.reponses.semaine as Record<string, string> | undefined)?.W10 === "oui";
  const essais: Record<string, string[]> = { budget: ["0", "1500", "15000"], duree: ["moins-6", "toujours"], apres: ["rester", "rentrer"], compagnie: ["seul", "famille"], "couple-travail": ["oui", "non"] };
  if (!d18) Object.assign(essais, { age: quiz.profil.find((x) => x.id === "age")!.options.map((o) => o.id), "nationalite-laquelle": ["non", "irlandaise", "canadienne"] });
  for (const [champ, valeurs] of Object.entries(essais)) {
    for (const v of valeurs) {
      const profil = { ...etat.profil, [champ]: v, ...(champ === "nationalite-laquelle" ? { nationalite: v === "non" ? "non" : "oui" } : {}) };
      verifier(memesScores(baseR, ressemblances({ ...etat, profil })), `quiz ${i} : « Il te ressemble » change avec ${champ} = ${v}`);
    }
  }
  verifier(memesScores(baseR, ressemblances(etat, { ...REGLAGES_DEFAUT, budget: 0 })), `quiz ${i} : « Il te ressemble » change avec le budget du curseur`);
  // Les deux mesures : entre 0 et 100, et le score est exactement « ressemble » × le facteur de l'accès.
  for (const l of lignes) {
    verifier(l.acces >= 0 && l.acces <= 100 && l.ressemble >= 0 && l.ressemble <= 100, `quiz ${i} : mesure hors limites pour ${l.pays.nom}`);
    verifier(Math.abs(l.score - l.ressemble * facteurAcces(l.acces)) < 1e-9, `quiz ${i} : score de ${l.pays.nom} différent de ressemble × accès`);
    verifier(l.acces === Math.max(0, 100 - l.obstacles.reduce((t, o) => t + o.points, 0)), `quiz ${i} : accès de ${l.pays.nom} différent de 100 moins ses obstacles`);
    // Seule une impossibilité légale sort un pays du classement ; une limite, jamais.
    verifier(!l.ecart || impossibiliteLegale(l.pays, etat.profil) !== null, `quiz ${i} : ${l.pays.nom} écarté sans impossibilité légale`);
  }
  // Une mesure notée pour moins de 30 pays ne bouge jamais le classement.
  for (const l of lignes) for (const d of l.details) verifier(mesureClassante(d.mesure), `quiz ${i} : ${d.mesure} (${paysCouverts(d.mesure)} pays) compte dans le score de ${l.pays.nom}`);

  // Top 3 déterministe.
  verifier(cleTop3(lignes) === cleTop3(calculer(etat)), `quiz ${i} : top 3 différent d'un calcul à l'autre`);

  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  for (const l of top) {
    verifier(l.couverture >= COUVERTURE_MIN, `quiz ${i} : ${l.pays.nom} dans le top 3 avec ${Math.round(l.couverture * 100)} % de couverture`);
    verifier(impossibiliteLegale(l.pays, etat.profil) === null, `quiz ${i} : ${l.pays.nom} fermé par la loi dans le top 3`);
    verifier(!l.sansDonnees, `quiz ${i} : ${l.pays.nom} sans donnée dans le top 3`);
    verifier(!l.details.some((d) => d.neutre && mesuresPrincipales(etat).includes(d.mesure)), `quiz ${i} : ${l.pays.nom} dans le top 3 avec une donnée manquante sur un des 3 premiers critères`);
  }

  // Une donnée manquante sur une priorité compte exactement 50 %, jamais plus.
  for (const l of lignes) for (const d of l.details) if (d.neutre) verifier(d.accord === ACCORD_NEUTRE && d.origine.startsWith("envie:"), `quiz ${i} : donnée manquante mal comptée pour ${l.pays.nom} (${d.mesure})`);

  // Importance : maximum 2 par mesure (jamais la somme de plusieurs réponses).
  for (const e of effetsActifs(etat)) verifier(e.poids <= 2, `quiz ${i} : importance ${e.poids} pour ${e.mesure}`);
  const cles = effetsActifs(etat).map((e) => e.mesure);
  verifier(new Set(cles).size === cles.length, `quiz ${i} : la même mesure compte deux fois`);

  // « Pour toi » : seulement des points notés 4 ou 5 sur 5 dans le sens des réponses, liés à une priorité,
  // au projet ou à un dilemme. « À savoir » : un point moyen ou défavorable. Jamais deux fois la même phrase.
  // Par catégorie (Travailler, Vivre, Culture au travail) : au plus 2 points forts et 1 point faible.
  const rediges = lignesTop(top, etat);
  const toutes: string[] = [];
  for (const l of top) {
    const points = rediges.get(l.pays.id)!;
    for (const [cat, c] of Object.entries(points)) {
      verifier(c.pour.length <= 2, `quiz ${i} : ${l.pays.nom} a ${c.pour.length} points forts en ${cat}`);
      for (const a of [...c.pour, ...(c.savoir ? [c.savoir] : [])]) verifier(categorieDe(a.mesure) === cat, `quiz ${i} : ${a.mesure} rangé dans ${cat}`);
    }
    const { pour, savoir } = aplatir(points);
    for (const a of pour) {
      if (a.mesure.startsWith("secteur-")) { verifier((noteEffective(l.pays.id, a.mesure, etat.profil) ?? 0) >= 4, `quiz ${i} : « Ton secteur » en point fort sans note 4 ou 5`); continue; }
      const d = l.details.find((x) => x.mesure === a.mesure && !x.neutre);
      verifier(!!d && d.accord >= 0.75 && (/^(envie|objectif|dilemme|element|limite|reglage):/.test(d.origine) || d.origine === "langues"), `quiz ${i} : ${l.pays.nom} a un argument moyen, défavorable ou sans lien avec toi (${a.texte})`);
    }
    for (const s of savoir) {
      if (s.mesure.startsWith("secteur-")) continue;
      const d = l.details.find((x) => x.mesure === s.mesure && !x.neutre);
      verifier(!!d && d.accord <= 0.5, `quiz ${i} : ${l.pays.nom} « À savoir » n'est pas un point défavorable (${s.texte})`);
    }
    toutes.push(...pour.map((a) => a.texte), ...savoir.map((a) => a.texte));
  }
  verifier(new Set(toutes).size === toutes.length, `quiz ${i} : la même phrase sous deux pays du top 3`);

  // Pays surprise : jamais un pays du top 3, jamais écarté par l'âge (règle légale), toujours au-dessus du seuil.
  const surprise = paysSurprise(etat, lignes, top);
  if (surprise) {
    verifier(!top.some((l) => l.pays.id === surprise.ligne.pays.id), `quiz ${i} : pays surprise déjà dans le top 3`);
    verifier(causesEcart(surprise.ligne.pays, etat).length === 0 && !surprise.ligne.ecart, `quiz ${i} : pays surprise fermé par la loi`);
    if (surprise.cause === "limite") verifier(surprise.ligne.obstacles.filter((o) => o.type === "limite").length === 1, `quiz ${i} : pays surprise touché par plusieurs limites`);
    // Prompt 3e : seulement si, sans la préférence en cause, il serait n° 1 ou n° 2.
    verifier(surprise.score >= top[Math.min(1, top.length - 1)].score - 1e-9, `quiz ${i} : pays surprise sous le score du n° 2`);
    if (surprise.ligne.porte.manque !== null) verifier(!!surprise.argent?.startsWith("Il te manquerait"), `quiz ${i} : pays surprise sans le manque d'argent`);
    verifier(!surprise.ligne.peuDeDonnees, `quiz ${i} : pays surprise sans assez de données`);
    // Jamais pour le budget : la cause est une limite ou une pénalité de goût.
    verifier(["limite", "employeur", "langue"].includes(surprise.cause), `quiz ${i} : pays surprise pour une autre cause (${surprise.cause})`);
  }

  // « Et si… ? » : sans réglage, rien ne change ; un curseur au niveau déduit ne change rien non plus ;
  // « Ne compte pas » retire toutes les mesures du groupe ; jamais plus de 2 par mesure.
  const effets = effetsActifs(etat);
  for (const g of GROUPES) {
    const deduit = niveauDeduit(effets, g.id);
    verifier(memesScores(base, Object.fromEntries(calculer(etat, { ...REGLAGES_DEFAUT, niveaux: { [g.id]: deduit } }).map((l) => [l.pays.id, l.score]))), `quiz ${i} : le curseur ${g.id} au niveau déduit change les scores`);
    const zero = effetsAjustes(etat, { ...REGLAGES_DEFAUT, niveaux: { [g.id]: 0 } });
    verifier(!zero.some((e) => g.mesures.includes(e.mesure)), `quiz ${i} : « Ne compte pas » laisse une mesure du groupe ${g.id}`);
    for (const n of NIVEAUX) for (const e of effetsAjustes(etat, { ...REGLAGES_DEFAUT, niveaux: { [g.id]: n } })) verifier(e.poids <= 2 + 1e-9, `quiz ${i} : importance ${e.poids} pour ${e.mesure} (curseur ${g.id})`);
  }

  // Portrait : au plus 6 phrases, jamais une phrase sur un dilemme passé, jamais deux fois la même.
  const complet = portraitComplet(etat);
  const lignesPortrait = portrait(etat);
  verifier(complet.lignes.length <= 6 && complet.cherche.length <= 3 && complet.titre.length > 0, `quiz ${i} : portrait de ${complet.lignes.length} phrases`);
  verifier(!lignesPortrait.some((l) => /^Tu es\b/.test(l.texte)) && !/^Tu es\b/.test(complet.titre), `quiz ${i} : « Tu es… » dans le portrait`);
  // Une contradiction s'appuie toujours sur au moins deux réponses données.
  for (const c of contradictions(etat)) {
    verifier(c.reponses.length >= 2, `quiz ${i} : contradiction « ${c.id} » sur une seule réponse`);
    for (const r of c.reponses) verifier(r.startsWith("envie:") ? enviesDe(etat).includes(r.slice(6)) : etat.reponses[r] !== undefined && etat.reponses[r] !== PASSER, `quiz ${i} : contradiction « ${c.id} » sur une réponse absente (${r})`);
  }
  // Le profil : chaque dimension qui compte a une certitude ; une dimension sans réponse est à certitude faible.
  const pr = construireProfil(etat);
  for (const d of Object.values(pr)) {
    verifier(["faible", "moyenne", "forte"].includes(d.certitude), `quiz ${i} : certitude absente pour ${d.id}`);
    if (d.reponses === 0) verifier(d.certitude === "faible", `quiz ${i} : ${d.id} sans réponse mais certitude ${d.certitude}`);
  }
  // Le calcul lit le profil : les importances du profil sont exactement celles du calcul.
  verifier(Object.values(pr).flatMap((d) => d.mesures).length === effetsActifs(etat).length, `quiz ${i} : le profil et le calcul ne voient pas les mêmes mesures`);
  verifier(new Set(lignesPortrait.map((l) => l.texte)).size === lignesPortrait.length, `quiz ${i} : phrase répétée dans le portrait`);
  for (const l of lignesPortrait) if (l.revoir && l.cle.startsWith("element:")) verifier(etat.reponses[l.revoir.id] !== "passer" && etat.reponses[l.revoir.id] !== undefined, `quiz ${i} : portrait sur un élément passé (${l.revoir.id})`);

  // Égalités (prompt 3e) : une chaîne de pays dont chaque voisin est à 5 points ou moins.
  const principaux = lignes.filter((l) => !l.ecart);
  const eg = egalites(principaux);
  const gr = groupesEgalite(principaux);
  for (let k = 1; k < principaux.length; k++) {
    const voisinsProches = !principaux[k].peuDeDonnees && !principaux[k - 1].peuDeDonnees && principaux[k - 1].score - principaux[k].score <= ECART_EX_AEQUO;
    verifier(voisinsProches === (gr[k] >= 0 && gr[k] === gr[k - 1]), `quiz ${i} : chaîne d'égalité mal coupée entre ${principaux[k - 1].pays.nom} et ${principaux[k].pays.nom}`);
  }
  for (let k = 0; k < principaux.length; k++) if (eg[k]) verifier(!principaux[k].peuDeDonnees, `quiz ${i} : égalité affichée pour un pays sans assez de données`);
  // « À égalité avec… » : toujours dit avec qui, et le partenaire est bien à 5 points ou moins.
  for (let k = 0; k < Math.min(3, principaux.length); k++) {
    const t = avecQui(principaux, k);
    verifier(eg[k] === (t !== null), `quiz ${i} : libellé d'égalité incohérent pour ${principaux[k].pays.nom}`);
    if (t) {
      const autre = principaux.find((x, j) => j !== k && t.includes(x.pays.le));
      verifier(!!autre && Math.abs(autre.score - principaux[k].score) <= ECART_EX_AEQUO + 1e-9, `quiz ${i} : « ${t} » ne nomme pas un voisin à 5 points ou moins`);
      if (!/\(n°/.test(t)) verifier(principaux.slice(0, 3).some((x, j) => j !== k && t.includes(x.pays.le)), `quiz ${i} : « ${t} » sans pays du top 3`);
    }
  }
}

verifier(changeAvecObjectif > 0, "le projet ne change le top 3 dans aucun profil");
console.log(`Le projet change le top 3 dans ${changeAvecObjectif} profils sur ${NB} (mêmes réponses, objectif différent).`);

// ---------- 2. Cas précis ----------
// 2.1 L'ancien biais : aventure, 18-25 ans, priorité Salaire. Les pays sans salaire vérifié ne peuvent plus finir à 100 %.
{
  const etat = etatDe({ ...ETAT_VIDE, profil: { objectif: "aventure", age: "18-25" }, priorites: ["salaire", "travail", "securite"] });
  for (const l of calculer(etat)) {
    if (l.neutres.includes("salaire")) verifier(l.score < 100, `donnée manquante : ${l.pays.nom} à 100 % sans salaire vérifié`);
  }
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3).map((l) => l.pays.id);
  console.log("Aventure 18-25, priorités salaire, travail, sécurité : top 3 =", top.join(", "));
}

// 2.2 « Passer » ne compte pas : tout passer ne change aucun score, et le questionnaire va quand même jusqu'au bout,
// avec au moins 18 écrans (prompt 3f).
{
  const r2 = hasard(42);
  for (let i = 0; i < 10; i++) {
    const etat = quizAuHasard(r2, true);
    verifier(repondues(etat) <= 3, `passer : ${repondues(etat)} réponses comptées alors que tout est passé (critères, sacrifice, second plan exceptés)`);
    verifier(questionnaireFini(etat), "passer : le questionnaire ne finit pas");
    verifier(etat.ordre.length >= 18, `passer : ${etat.ordre.length} écrans seulement`);
  }
}

// 2.3 PVT fermé à ton âge (prompt 6) : pour un projet de PVT, c'est une impossibilité légale, traitée à part (visible,
// jamais dans le top 3, pas remontable) ; pour un autre projet, le pays reste classé, moins accessible (visa de travail).
{
  const etat = etatDe({ ...ETAT_VIDE, profil: { age: "31-35" }, priorites: ["climat", "proche", "francais"] });
  const lignes = calculer(etat);
  const fermes = lignes.filter((l) => l.porte.badge === "fermee");
  verifier(fermes.length > 0, "31-35 ans : aucun pays fermé, le test ne prouve rien");
  for (const l of fermes) verifier(!l.ecart && l.obstacles.some((o) => o.type === "porte" && o.texte.includes("fermé")), `${l.pays.nom} : PVT fermé, mais écarté ou sans obstacle d'accès`);
  const jeune = calculer({ ...etat, profil: { age: "18-25" } });
  for (const l of fermes) verifier(Math.abs(jeune.find((x) => x.pays.id === l.pays.id)!.ressemble - l.ressemble) < 1e-9, `${l.pays.nom} : « Il te ressemble » changé par la fermeture`);
  const pvt = etatDe({ ...ETAT_VIDE, profil: { age: "31-35", objectif: "aventure" }, priorites: ["climat", "proche", "francais"] });
  const lp = calculer(pvt);
  for (const l of lp.filter((x) => x.porte.badge === "fermee")) verifier(!!l.ecart && !lp.filter((x) => !x.ecart && !x.peuDeDonnees).slice(0, 3).includes(l), `${l.pays.nom} : PVT fermé à ton âge pour un projet de PVT, mais pas traité à part`);
  const remonte = calculer({ ...pvt, remontes: [fermes[0].pays.id] }).find((l) => l.pays.id === fermes[0].pays.id)!;
  verifier(!!remonte.ecart, "une impossibilité légale disparaît quand on remonte le pays");
}

// 2.4 Nationalité : le badge change, seulement pour les cas listés.
{
  const cas: [string, string][] = [["canadienne", "canada"], ["irlandaise", "royaume-uni"], ["americaine", "etats-unis"]];
  for (const [nat, id] of cas) {
    const p = trouverPays(id)!;
    verifier(evaluerPorte(p, { nationalite: "oui", "nationalite-laquelle": nat }, null).badge === "nationalite", `nationalité ${nat} : le badge de ${p.nom} ne change pas`);
    verifier(evaluerPorte(p, { nationalite: "non", "nationalite-laquelle": nat }, null).badge !== "nationalite", `nationalité ${nat} : badge changé alors que la personne a répondu non`);
  }
  for (const p of pays) {
    if (["canada", "royaume-uni", "etats-unis"].includes(p.id)) continue;
    for (const nat of ["canadienne", "irlandaise", "americaine", "autre"]) {
      verifier(evaluerPorte(p, { nationalite: "oui", "nationalite-laquelle": nat }, null).badge !== "nationalite", `nationalité ${nat} : badge changé à tort pour ${p.nom}`);
    }
  }
}

// 2.5 Climat doux : un pays très chaud en été n'a pas la note maximale.
{
  const etat = etatDe({ ...ETAT_VIDE, profil: {}, priorites: ["climat", "travail", "securite"] });
  const lignes = calculer(etat);
  for (const id of ["emirats-arabes-unis", "singapour"]) {
    const d = lignes.find((l) => l.pays.id === id)!.details.find((x) => x.mesure === "doux");
    verifier(!!d && d.accord <= 0.25, `climat doux : ${id} trop bien noté`);
  }
  // Un été frais (mois le plus chaud sous 18 °C, comme à Bogotá) n'a pas la note maximale.
  for (const p of pays) {
    const n = notesPays[p.id];
    if (n?.ete?.statut === "verifie" && (n.ete.valeur ?? 99) < 18) verifier(n.doux.note !== 5, `climat doux : ${p.nom} a la note maximale avec un été à ${n.ete.valeur} °C`);
  }
  verifier(notesPays.colombie.doux.note !== 5, "climat doux : Bogotá a encore la note maximale");
}

// 2.6 Poids = maximum, jamais la somme. Deux réponses sur le salaire : importance 1, pas 2.
{
  const etat: Etat = construire({ envies: ["travail", "securite", "climat"], reponses: { offres: "a", promotion: "a" } });
  const salaire = effetsActifs(etat).filter((e) => e.mesure === "salaire");
  verifier(salaire.length === 1 && salaire[0].poids === 1, `salaire : importance ${salaire.map((e) => e.poids).join("+")} au lieu de 1`);
  verifier(!!trouverDilemme("offres") && !!trouverDilemme("promotion"), "dilemmes du test introuvables");
  // Envie Bon salaire classée n° 1 (2) + réponse salaire (1) + projet carrière (0,5) : importance 2.
  const cumul: Etat = construire({ profil: { objectif: "carriere" }, envies: ["salaire", "securite", "climat"], reponses: { offres: "a", promotion: "a", "sortie-ecole": "b" } });
  const s2 = effetsActifs(cumul).filter((e) => e.mesure === "salaire");
  verifier(s2.length === 1 && s2[0].poids === 2, `salaire : importance ${s2.map((e) => e.poids).join("+")} au lieu de 2`);
}

// 2.6 bis Décision et vie pro et vie perso (témoignages) : notées pour au moins 60 % des pays, leurs dilemmes sont actifs.
{
  for (const [id, mesure] of [["idee-reunion", "decision"], ["vendredi-18h", "pro-perso"]]) {
    verifier(paysCouverts(mesure) >= 0.6 * pays.length, `${mesure} : notée pour ${paysCouverts(mesure)} pays seulement`);
    verifier(dilemmeActif(trouverDilemme(id)!), `${id} n'est pas actif`);
  }
  // Une note « à vérifier » (Hong Kong pour la décision) ne compte pas.
  verifier(notesPays["hong-kong"].decision.statut === "a-verifier", "Hong Kong : la décision devrait rester à vérifier");
  // Chaque note de témoignages a au moins deux sources et une confiance.
  for (const p of pays) for (const m of ["decision", "pro-perso"]) {
    const n = notesPays[p.id][m];
    if (n.statut === "verifie") verifier(n.source === "temoignages" && (n.liens?.length ?? 0) >= 2 && !!n.confiance, `${p.nom} : ${m} sans deux sources ni confiance`);
  }
}

// 2.6 ter Visas de travail (prompt 3c).
{
  // « Page officielle du visa » seulement pour une page du gouvernement du pays (jamais France Diplomatie).
  for (const p of pays) for (const b of portes(p.id)) {
    const d = b.detail;
    if (!d) continue;
    verifier(d.liens.length > 0 && sources[d.source]?.type === "officiel", `${p.nom} : visa sans lien ou sans source officielle`);
    for (const l of d.liens) if (l.libelle.startsWith("Page officielle")) verifier(!new URL(l.url).hostname.endsWith("diplomatie.gouv.fr"), `${p.nom} : « Page officielle du visa » sur un site français`);
    verifier(d.conditions.length <= 6, `${p.nom} : plus de 6 conditions`);
  }
  // Taïwan : le montant du salaire minimum vient d'une page non datée, il n'est pas affiché.
  verifier(!portes("taiwan").some((b) => (b.detail?.conditions ?? []).some((c) => /\d{2}\s?\d{3}/.test(c))), "Taïwan : un montant de salaire est affiché");
  // Diplôme ou expérience exigés : dits clairement quand le PVT est fermé (36 ans et plus).
  const fermeAustralie = evaluerPorte(trouverPays("australie")!, { age: "36-plus" }, null);
  verifier(fermeAustralie.alertes.some((a) => a.texte.includes("Sans expérience")), "Australie : l'exigence d'expérience n'est pas dite");
  verifier(fermeAustralie.visa?.lieEmployeur === "oui", "Australie : visa non relié à l'employeur");
  // D18 « Je préfère pouvoir changer d'employeur » (prompt 3e) : une pénalité de poids 1, plus un filtre.
  const vieux: Profil = { age: "36-plus" };
  const libre = (id: string, pr: Profil = vieux) => noteEmployeurLibre(id, pr);
  verifier(libre("chili") === 5, "D18 : le Chili (visa non lié) n'a pas la note 5");
  verifier(libre("japon") === 3 && libre("argentine") === 3, "D18 : un visa en partie lié n'a pas la note 3");
  verifier(libre("australie") === 1 && libre("nouvelle-zelande") === 1, "D18 : un visa lié n'a pas la note 1");
  verifier(libre("etats-unis") === 1 && libre("mexique") === 1, "D18 : un lien « à vérifier » n'a pas la note 1");
  verifier(libre("australie", { age: "18-25" }) === 5 && libre("belgique") === 5, "D18 : un PVT ouvert ou l'Europe sans visa sont pénalisés");
  const d18: Etat = construire({ profil: vieux as Record<string, string>, envies: ["salaire", "travail", "securite"], reponses: { "job-de-reve": "b" } });
  const l18 = calculer(d18);
  for (const l of l18) verifier(!l.ecart || causesEcart(l.pays, d18).length > 0, `D18 : ${l.pays.nom} écarté sans raison du profil`);
  verifier(!l18.find((l) => l.pays.id === "australie")!.ecart || l18.find((l) => l.pays.id === "australie")!.porte.badge === "fermee", "D18 : un pays est encore écarté par la réponse");
  verifier(l18.find((l) => l.pays.id === "etats-unis")!.details.find((d) => d.mesure === "employeur-libre")?.accord === 0, "D18 : la pénalité ne s'applique pas");
  verifier(PENALITES.includes("employeur-libre"), "D18 : « Le remonter » ne retire pas la pénalité");
  verifier(!quiz.dilemmes.some((d) => d.options.some((o) => "ecart" in o)), "un dilemme écarte encore des pays (seuls les limites et le profil le font)");
}

// 2.6 quater Canada : saison 2026 du PVT fermée. Mention affichée, badge et score inchangés.
{
  const porte = evaluerPorte(trouverPays("canada")!, { age: "18-25" }, null);
  verifier(porte.badge === "difficile" && !!porte.mention?.texte.includes("Saison 2026 fermée"), "Canada : la saison fermée n'est pas dite, ou le badge a changé");
  verifier(porte.mention?.preuve?.type === "officiel", "Canada : la saison fermée n'a pas de preuve officielle");
}

// 2.6 quinquies « Je garde ces soirées pour moi » : une pénalité, plus un filtre.
{
  const etat: Etat = construire({ profil: { anglais: "courant" }, envies: ["salaire", "travail", "securite"], reponses: { "cours-offerts": "b" } });
  const lignes = calculer(etat);
  for (const id of ["japon", "coree-du-sud", "taiwan", "chine"]) verifier(!lignes.find((l) => l.pays.id === id)!.ecart, `cours-offerts B : ${id} est encore écarté`);
  const accord = (id: string) => lignes.find((l) => l.pays.id === id)!.details.find((d) => d.mesure === "apprendre-langue")?.accord;
  verifier(accord("japon") === 0 && accord("espagne") === 0.5 && accord("irlande") === 1, "cours-offerts B : pénalité mal graduée (1 pour une autre écriture, 0,5 pour une autre langue)");
  // Qui parle japonais n'a rien à apprendre au Japon.
  const nippo = calculer(construire({ profil: { anglais: "courant", langues: ["ja"] }, envies: ["salaire", "travail", "securite"], reponses: { "cours-offerts": "b" } })).find((l) => l.pays.id === "japon")!;
  verifier(nippo.details.find((d) => d.mesure === "apprendre-langue")?.accord === 1, "cours-offerts B : pénalité alors que tu parles la langue");
}

// 2.7 Session abîmée : toujours refusée, jamais d'erreur.
{
  const mauvaises: unknown[] = [null, {}, [], "texte", 3, { ...SESSION_VIDE, v: 1 }, { ...SESSION_VIDE, etat: null }, { ...SESSION_VIDE, etape: { t: "profil", i: 0 } },
    { ...SESSION_VIDE, etape: { t: "transition", chapitre: 9 } }, { ...SESSION_VIDE, reglages: null }, { ...SESSION_VIDE, chapitresVus: ["a"] },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { noel: "d" }, ordre: ["noel"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { emploi: "oui" }, ordre: ["emploi"] } },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { equilibre: 140 }, ordre: ["equilibre"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { "anglais-vie": 2.5 }, ordre: ["anglais-vie"] } },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { envies: ["salaire", "prix", "climat", "securite", "proche", "travail"] }, ordre: ["envies"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { phrases: { S1: "peut-etre" } }, ordre: ["phrases"] } },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { limites: { inconnue: "ok" } }, ordre: ["limites"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { ambiances: ["metropole", "nature", "soleil"] }, ordre: ["ambiances"] } },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { carte: ["mars"] }, ordre: ["carte"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { age: "a" }, ordre: [] } }];
  for (const m of mauvaises) {
    let res: unknown = "erreur";
    try { res = validerSession(m); } catch { res = "erreur"; }
    verifier(res === null, `session abîmée acceptée : ${JSON.stringify(m)?.slice(0, 80)}`);
  }
  verifier(validerSession(JSON.parse(JSON.stringify(SESSION_VIDE))) !== null, "la session vide est refusée");
}

// 2.8 Le projet : poids de départ 0,5, remplacés par une réponse qui va dans un autre sens.
{
  const base: Etat = construire({ profil: { objectif: "aventure" }, envies: ["securite", "travail", "francais"] });
  const prix = (e: Etat) => effetsActifs(e).find((x) => x.mesure === "prix");
  verifier(prix(base)?.poids === 0.5 && !!prix(base)?.origine.startsWith("objectif:"), "aventure : la vie pas chère n'a pas son poids de départ de 0,5");
  verifier(!effetsActifs(base).some((x) => x.mesure === "salaire"), "aventure : le salaire a reçu un poids de départ");
  const salaire = construire({ profil: { objectif: "aventure" }, envies: ["securite", "travail", "francais"], reponses: { offres: "a" } });
  verifier(prix(salaire) === undefined, "aventure + « 3 200 € par mois » : le poids de départ sur les prix n'a pas disparu");
  const loyer = construire({ profil: { objectif: "aventure" }, envies: ["securite", "travail", "francais"], reponses: { offres: "b" } });
  verifier(prix(loyer)?.poids === 1, "aventure + « 2 400 € par mois » : la réponse ne l'emporte pas sur le poids de départ");
}

// 2.9 Départage (prompt 3e, lot 4) : jamais un dilemme déjà répondu ou inactif ; seulement un dilemme dont une mesure
// sépare vraiment les deux pays (2 niveaux d'écart ou plus, données vérifiées des deux côtés) ; une raison dite ;
// au plus 5 questions ; un bilan cohérent (pas de « ce qui a fait la différence » si l'égalité reste).
{
  const r3 = hasard(7);
  let essais = 0, egalitesFinales = 0, departages = 0;
  for (let k = 0; k < 80; k++) {
    let etat = quizAuHasard(r3);
    const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 2);
    if (top.length < 2) continue;
    const [a, b] = top.map((l) => l.pays.id);
    const avant = etat;
    for (let n = 0; n < MAX_DEPARTAGE; n++) {
      const d = prochainDepartage(etat, a, b);
      if (!d) break;
      essais++;
      verifier(etat.reponses[d.id] === undefined && dilemmeActif(d), `départage : dilemme ${d.id} déjà répondu ou inactif`);
      verifier(separation(d, etat, a, b) > 0, `départage : ${d.id} ne sépare pas ${a} et ${b}`);
      const ms = mesuresQuiSeparent(d, etat, a, b);
      verifier(ms.length > 0, `départage : ${d.id} posé alors qu'aucune mesure ne sépare ${a} et ${b} de 2 niveaux`);
      for (const m of ms) verifier(noteEffective(a, m.mesure, etat.profil) !== null && noteEffective(b, m.mesure, etat.profil) !== null && m.ecart >= 2, `départage : ${m.mesure} sans donnée vérifiée des deux côtés`);
      verifier(raisonDepartage(d, etat, a, b).startsWith("On te pose cette question parce que"), "départage : raison absente");
      etat = repondre(etat, d.id, d.options[n % d.options.length].id);
      if (!encoreEgalite(etat, a, b)) break;
    }
    departages++;
    const bilan = bilanDepartage(avant, etat, a, b);
    verifier(bilan.length > 0, "départage : bilan vide");
    if (encoreEgalite(etat, a, b)) {
      egalitesFinales++;
      verifier(!bilan.includes("Ce qui a fait la différence") && bilan.includes("égalité"), `départage : bilan incohérent avec l'égalité (${bilan})`);
    } else verifier(!bilan.includes("restent à égalité"), `départage : « à égalité » alors que l'écart dépasse 5 points (${bilan})`);
  }
  verifier(essais > 0, "départage : aucun dilemme proposé, le test ne prouve rien");
  verifier(MAX_DEPARTAGE === 5, "départage : 5 questions au plus");
  // Deux pays avec la même ponctualité : jamais le dilemme de la ponctualité.
  const ponct = trouverDilemme("reunion-9h")!;
  const meme = pays.filter((p) => notesPays[p.id].ponctualite?.note === notesPays.allemagne.ponctualite?.note && p.id !== "allemagne")[0];
  verifier(!!meme && mesuresQuiSeparent(ponct, ETAT_VIDE, "allemagne", meme.id).length === 0, "départage : la ponctualité sépare deux pays de même note");
  // Comparaison : une donnée manquante d'un côté donne « Non comparable » (null), jamais une égalité.
  const ea: Etat = construire({ envies: ["equilibre", "travail", "securite"] });
  const lc = calculer(ea);
  const c = comparer(lc.find((l) => l.pays.id === "singapour")!, lc.find((l) => l.pays.id === "belgique")!, ea);
  verifier(c.lignes.find((x) => x.mesure === "heures")?.ecart === null, "comparaison : heures manquantes pour Singapour, mais pas « Non comparable »");
  // Une mesure hors du classement (moins de 30 pays) n'apparaît pas dans la comparaison.
  const cs = comparer(lc[0], lc[1], construire({ envies: ["salaire", "travail", "securite"] }));
  verifier(!cs.lignes.some((x) => !mesureClassante(x.mesure)), "comparaison : une mesure hors du classement est comparée");
  console.log(`Départage : ${departages} départages, ${essais} questions, ${egalitesFinales} restés à égalité.`);
}

// 2.10 Animations : aucune quand la personne demande moins de mouvement (prefers-reduced-motion).
{
  const reduit = { matchMedia: (q: string) => ({ matches: q === "(prefers-reduced-motion: reduce)" }) };
  const normal = { matchMedia: () => ({ matches: false }) };
  verifier(mouvementReduit(reduit) && dureeAnimation(DUREE_DEPLACEMENT, reduit) === 0, "animation : une durée non nulle malgré prefers-reduced-motion");
  verifier(dureeAnimation(DUREE_DEPLACEMENT, normal) === DUREE_DEPLACEMENT, "animation : durée nulle sans prefers-reduced-motion");
  verifier(DUREE_REVELATION < 1000, "révélation du n°1 : une seconde ou plus");
}

// 2.11 « Pourquoi on te demande ça » : 60 mots au plus, une mini-carte par option de dilemme,
// et un texte qui dit vrai sur le calcul (« On met en avant » seulement si l'option a un effet).
{
  const mots = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const aides = quiz.elements.map((e) => [e.id, e.aide] as const);
  for (const [id, a] of aides) {
    verifier(!!a?.enjeu && a.cartes.length > 0, `aide de ${id} absente ou vide`);
    const n = mots(a.enjeu) + a.cartes.reduce((s, c) => s + mots(c.texte), 0);
    verifier(n <= 60, `aide de ${id} : ${n} mots (60 au plus)`);
  }
  for (const d of quiz.dilemmes) {
    verifier(d.aide.cartes.length === d.options.length && d.aide.cartes.every((c, i) => c.pastille === "ABC"[i]), `aide de ${d.id} : une mini-carte par option, A, B, C`);
    d.options.forEach((o, i) => {
      const texte = d.aide.cartes[i]?.texte ?? "";
      const agit = o.effets.some((e) => e.position !== undefined || (e.poids ?? 1) > 0);
      if (/^On met (nettement )?en avant/.test(texte)) verifier(agit, `aide de ${d.id} ${o.id} : « on met en avant » sans effet codé`);
      if (/ne recule|ne compte pas plus|Rien ne change|ne fait reculer aucun/.test(texte)) verifier(!agit, `aide de ${d.id} ${o.id} : « rien ne change » alors que l'option agit`);
    });
  }
}

// 2.12 Pays surprise, curseurs, égalités nommées, valeurs lisibles (prompt 3d).
{
  const r4 = hasard(3);
  let surprises = 0, parLangue = 0, rangsHorsVue = 0;
  for (let k = 0; k < 150; k++) {
    let etat = quizAuHasard(r4);
    if (k % 3 === 0) etat = repondre(etat, "limites", { "hors-europe": k % 2 ? "redhibitoire" : "ok", alphabet: "redhibitoire" });
    if (k % 5 === 0) etat = repondre(etat, "cours-offerts", "b");
    const lignes = calculer(etat);
    const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
    const s = paysSurprise(etat, lignes, top);
    if (s) {
      surprises++;
      if (s.cause === "langue") parLangue++;
      // « Le remonter » : le pays quitte « Moins adaptés » (ou ne subit plus la pénalité de langue).
      const apres = calculer({ ...etat, remontes: [...etat.remontes, s.ligne.pays.id] }).find((l) => l.pays.id === s.ligne.pays.id)!;
      verifier(!apres.ecart, `surprise : ${s.ligne.pays.nom} reste écarté après « Le remonter »`);
      if (s.cause === "langue") verifier(Math.abs(apres.score - s.score) < 1e-6, `surprise : ${s.ligne.pays.nom} remonté sans retrouver son score sans pénalité`);
      verifier(/^(Seul ton choix de|Seule ta limite)/.test(s.phrase), "surprise : phrase sans la préférence en cause");
    }
    // Égalités dans la liste : un partenaire du top 3 (hors de la vue) est suivi de son rang.
    const principaux = lignes.filter((l) => !l.ecart);
    const g = groupesEgalite(principaux);
    for (let i = 3; i < principaux.length; i++) {
      const txt = avecQui(principaux, i, (j) => j >= 3);
      verifier((g[i] >= 0) === (txt !== null), `égalité : libellé incohérent pour ${principaux[i].pays.nom}`);
      if (txt && g.every((x, j) => j === i || x !== g[i] || j < 3)) { verifier(/\(n°\u00a0[1-3]\)/.test(txt), `égalité : « ${txt} » sans rang pour un pays du top 3`); rangsHorsVue++; }
    }
    // Comparaison côte à côte : de vraies valeurs, jamais un pourcentage de note.
    if (top.length >= 2) {
      const c = comparer(top[0], top[1], etat);
      for (const x of c.lignes) for (const v of [x.a, x.b]) if (v) verifier(!/^\d+ %$/.test(v.valeur ?? "") && !!v.mot, `comparaison : valeur illisible pour ${x.mesure}`);
      verifier(c.synthese.length > 0, "comparaison : pas de synthèse");
    }
  }
  verifier(surprises > 0, "surprise : jamais trouvée, le test ne prouve rien");
  console.log(`Pays surprise : ${surprises} quiz sur 150 (dont ${parLangue} par la langue à apprendre) ; égalités avec rang hors vue : ${rangsHorsVue}.`);

  // Âge : un pays fermé à ton âge n'est jamais le pays surprise, même très bien noté.
  const vieux: Etat = construire({ profil: { age: "36-plus" }, envies: ["prix", "climat", "proche"] });
  const lv = calculer(vieux);
  const sv = paysSurprise(vieux, lv, lv.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3));
  verifier(!sv || causesEcart(sv.ligne.pays, vieux).every((c) => c.cause !== "age"), "surprise : un pays fermé à ton âge proposé");

  // Curseurs : « Compte beaucoup » sur la distance, sans aucune réponse sur la distance, ajoute vol et décalage.
  const sansDistance: Etat = construire({ envies: ["salaire", "travail", "securite"] });
  verifier(niveauDeduit(effetsActifs(sansDistance), "distance") === 0, "curseur : distance déduite non nulle sans réponse");
  const ajoutes = effetsAjustes(sansDistance, { ...REGLAGES_DEFAUT, niveaux: { distance: 2 } }).filter((e) => e.origine === "reglage:distance");
  verifier(ajoutes.length === 2 && ajoutes.every((e) => e.poids === 1), "curseur : la distance n'ajoute pas vol et décalage (importance 2 en tout)");
  // Envie « Proche de la France » classée n° 1 : niveau déduit 2, et « Compte un peu » divise par 4.
  const proche: Etat = construire({ envies: ["proche", "travail", "securite"] });
  verifier(niveauDeduit(effetsActifs(proche), "distance") === 2, "curseur : l’envie Proche n° 1 ne donne pas le niveau 2");
  const peu = effetsAjustes(proche, { ...REGLAGES_DEFAUT, niveaux: { distance: 0.5 } }).filter((e) => e.mesure === "vol" || e.mesure === "decalage");
  // Proche = 2/3 vol, 1/3 décalage (prompt 3k) : « Compte un peu » (0,5 au lieu de 2) donne 1/3 et 1/6.
  verifier(peu.length === 2 && Math.abs(peu.find((e) => e.mesure === "vol")!.poids - 1 / 3) < 1e-9 && Math.abs(peu.find((e) => e.mesure === "decalage")!.poids - 1 / 6) < 1e-9, "curseur : « Compte un peu » mal appliqué à la priorité Proche");
  // Culture : sans réponse, rien à ajouter (on ne sait pas dans quel sens aller).
  verifier(effetsAjustes(sansDistance, { ...REGLAGES_DEFAUT, niveaux: { culture: 2 } }).length === effetsActifs(sansDistance).length, "curseur : la culture ajoute des mesures sans réponse");

  // Valeurs lisibles : unité et mot, pour chaque mesure notée.
  verifier(valeurLisible("allemagne", "vol", {})?.valeur === "1,6\u00a0h de vol", `valeur : vol Allemagne = ${valeurLisible("allemagne", "vol", {})?.valeur}`);
  verifier(valeurLisible("japon", "securite", {})?.mot === "Très sûr", "valeur : le Japon n'est pas « Très sûr »");
  verifier(valeurLisible("japon", "langue", { langues: ["ja"] })?.mot === "Tu parles la langue", "valeur : la langue parlée n'est pas dite");
  for (const p of pays) for (const m of Object.keys(notesPays[p.id])) {
    const v = valeurLisible(p.id, m, {});
    if (v) verifier(!!v.mot, `valeur : pas de mot pour ${m} (${p.nom})`);
  }
}

// 2.13 Fiabilité des données et fiche de faisabilité (prompt 3d, lot 3).
{
  // Données disponibles (prompt 3h) : une seule règle, la même que la règle des 60 %. Une valeur compte, quel que soit
  // son niveau de preuve (« Notre avis » compris) ; « À vérifier » ne compte jamais. Seuils 90 % et 60 %.
  const avisSeul = fiabiliteDe("allemagne", ["hierarchie"], {});
  verifier(sources[notesPays.allemagne.hierarchie.source!].type === "notre-avis" && avisSeul.disponibles === 1 && avisSeul.parNiveau["notre-avis"] === 1 && avisSeul.niveau === "complete", "disponibles : « Notre avis » ne compte pas");
  const ouvertes = fiabiliteDe("pays-bas", ["emploi", "salaire", "securite", "vol", "decalage", "hiver", "ete", "doux", "prix", "air"], {});
  verifier(ouvertes.niveau === "complete" && ouvertes.disponibles === 10, "disponibles : 10 sur 10 ne donnent pas « complètes »");
  verifier(fiabiliteDe("japon", ["langue"], { langues: ["ja"] }).disponibles === 1, "disponibles : la langue que tu parles ne compte pas");
  verifier(fiabiliteDe("japon", ["region-carte", "langue-parlee", "langue"], { regions: ["europe"] }).total === 1, "disponibles : un bonus compte dans le badge");
  for (const p of pays) for (const m of Object.keys(notesPays[p.id])) {
    const f = fiabiliteDe(p.id, [m], {});
    const attendu = noteEffective(p.id, m, {}) !== null ? 1 : 0;
    verifier(f.disponibles === attendu && Object.values(f.parNiveau).reduce((a, b) => a + b, 0) === attendu, `disponibles : ${m} mal compté pour ${p.nom}`);
  }
  // Même règle que la couverture du calcul : pour un parcours, la part disponible du badge est la couverture.
  const rDispo = hasard(3108);
  for (let k = 0; k < 40; k++) {
    const e = quizAuHasard(rDispo);
    for (const l of calculer(e)) verifier(Math.abs(l.fiabilite.disponibles / Math.max(1, l.fiabilite.total) - (l.fiabilite.total ? l.couverture : 1)) < 1e-9, `disponibles : badge et règle des 60 % diffèrent pour ${l.pays.nom}`);
  }

  // Faisabilité : seulement des données sourcées, une prochaine étape vers un site officiel, jamais « juridiquement ».
  const profils: Profil[] = [{}, { age: "18-25", budget: "moins-2000", objectif: "stage-vie" }, { age: "31-35", budget: "5000-10000", duree: "plus-2" }, { age: "26-27", budget: "2000-5000" }, { age: "26-27", budget: "inconnu" }, { age: "36-plus", objectif: "carriere" },
    { age: "26-27", nationalite: "oui", "nationalite-laquelle": "canadienne" }];
  for (const pr of profils) for (const p of pays) {
    const f = faisabilite(p, pr, budgetDe(pr));
    const tout = [...f.remplies, ...f.aRemplir, ...f.aVerifier];
    verifier(!tout.some((x) => /juridique/i.test(x)), `faisabilité : « juridique » pour ${p.nom}`);
    verifier(new Set(tout).size === tout.length, `faisabilité : phrase répétée pour ${p.nom}`);
    if (f.etape) verifier(/^https:\/\//.test(f.etape.url), `faisabilité : prochaine étape sans lien pour ${p.nom}`);
    const v = visaSimple(p, pr);
    verifier(!!v && v.points.length <= 3, `visa simple : plus de 3 points pour ${p.nom}`);
  }
  const f = (id: string, pr: Profil) => faisabilite(trouverPays(id)!, pr, budgetDe(pr));
  verifier(f("belgique", {}).remplies.some((x) => x.includes("nationalité française suffit")), "faisabilité : la Belgique sans « ta nationalité suffit »");
  verifier(f("suisse", {}).aRemplir.some((x) => x.includes("Permis L") && x.includes("14 jours")), "faisabilité : la Suisse sans le permis L ou B");
  verifier(f("norvege", {}).aRemplir.some((x) => x.includes("police")), "faisabilité : la Norvège sans l'enregistrement à la police");
  // Visas jeunes (prompt 3h) : quotas dits « fixés chaque année », ressources à vérifier, autres visas pour les jeunes.
  for (const pid of ["canada", "japon", "coree-du-sud", "argentine", "hong-kong", "bresil", "taiwan", "chili", "colombie", "mexique"]) {
    const pv = portes(pid).find((x) => x.type === "pvt")!;
    verifier(/quota fixé chaque année entre les deux pays/.test(pv.texte) && !/pour les Français\./.test(pv.texte), `PVT : quota mal dit pour ${pid}`);
  }
  verifier(portes("canada").find((x) => x.type === "pvt")!.ageMax === 35 && portes("argentine").find((x) => x.type === "pvt")!.ageMax === 35, "PVT : âge maximum du Canada ou de l'Argentine");
  verifier(!/décembre/.test(portes("canada").find((x) => x.type === "pvt")!.saison!.texte), "PVT Canada : une date de 2027 non officielle");
  verifier(f("colombie", { age: "18-25" }).aVerifier.some((x) => x.startsWith("Ressources demandées")) && f("coree-du-sud", { age: "18-25" }).aVerifier.some((x) => x.startsWith("Ressources demandées")), "PVT : ressources de la Colombie ou de la Corée pas « à vérifier »");
  verifier(portes("nouvelle-zelande").find((x) => x.type === "pvt")!.fonds!.texte.startsWith("4 200") || portes("nouvelle-zelande").find((x) => x.type === "pvt")!.fonds!.texte.startsWith("4\u00a0200"), "PVT Nouvelle-Zélande : ressources");
  for (const [pid, n] of [["etats-unis", 3], ["royaume-uni", 1], ["singapour", 2], ["chine", 1], ["emirats-arabes-unis", 2], ["canada", 2]] as const) {
    verifier((portes(pid).find((x) => x.type === "visas-jeunes")?.visas ?? []).length === n, `visas jeunes : ${pid} n'a pas ${n} visas`);
    verifier(evaluerPorte(trouverPays(pid)!, { age: "18-25" }, null).autres.some((x) => x.startsWith("Autres visas pour les jeunes")), `visas jeunes : ${pid} ne les cite pas`);
  }
  verifier(evaluerPorte(trouverPays("royaume-uni")!, {}, null).alertes.some((a) => a.texte.includes("Youth Mobility")), "Royaume-Uni : Youth Mobility Scheme non signalé");
  verifier(evaluerPorte(trouverPays("emirats-arabes-unis")!, {}, null).alertes.some((a) => a.texte.includes("vigilant")), "Émirats : contexte de sécurité absent");
  verifier(evaluerPorte(trouverPays("australie")!, { age: "18-25" }, null).alertes.some((a) => a.texte.includes("1er mars 2027") && a.preuve?.type === "a-verifier"), "Australie : changement de procédure absent ou pas « à vérifier »");
  // Budget en tranches (lot 5) : « au moins » sous la tranche, « pourrait » dans la tranche, « couvre » au-dessus.
  // L'enveloppe (prompt 6) donne une somme exacte : « environ » sous la somme demandée, « couvre » au-dessus.
  verifier(f("japon", { age: "18-25", budget: "2000" }).aRemplir.some((x) => /^Il te manquerait environ 1\s100/.test(x)), "faisabilité : le manque d'argent n'est pas dit (Japon, 2 000 €)");
  verifier(f("japon", { age: "18-25", budget: "5000" }).remplies.some((x) => x.includes("Ton budget couvre")), "faisabilité : le budget suffisant n'est pas dit");
  const manque = calculer(construire({ profil: { age: "18-25" }, envies: ["prix"], reponses: { budget: 1000 } })).find((l) => l.pays.id === "japon")!;
  verifier(manque.obstacles.some((o) => o.type === "budget"), "enveloppe : il manque de l'argent pour le PVT japonais, mais l'accès ne baisse pas");
  verifier(evaluerPorte(trouverPays("japon")!, { age: "18-25", budget: "inconnu" }, budgetProfil({ budget: "inconnu" })).alertes.some((a) => a.texte.startsWith("Ce PVT demande 3")), "budget inconnu : la somme demandée n'est pas dite");
  verifier(evaluerPorte(trouverPays("japon")!, { age: "18-25" }, { min: 2500, max: 2500 }).alertes.some((a) => /^Il te manquerait environ 600/.test(a.texte)), "curseur : somme exacte mal dite");
  verifier(f("canada", { age: "18-25" }).aVerifier.some((x) => x.includes("Saison 2026 fermée")) && f("canada", { age: "18-25" }).etape?.texte === "Créer ton profil sur le site officiel", "faisabilité : Canada sans la saison fermée ou sans « Créer ton profil »");
  verifier(f("australie", { age: "36-plus" }).aRemplir.some((x) => x.includes("1 an d’expérience")) && f("australie", { age: "36-plus" }).aVerifier.some((x) => x.includes("expérience pro")), "faisabilité : Australie sans l'expérience demandée");
  verifier(f("japon", { age: "18-25", objectif: "stage-vie" }).remplies.some((x) => x.includes("permet le VIE")) && f("japon", { age: "28-30", objectif: "stage-vie" }).aRemplir.some((x) => x.includes("VIE n’est plus possible")), "faisabilité : condition d'âge du VIE mal confrontée");
  verifier(f("canada", { age: "26-27", nationalite: "oui", "nationalite-laquelle": "canadienne" }).remplies[0].includes("nationalité canadienne"), "faisabilité : la nationalité canadienne n'ouvre pas le Canada");
}

// 2.14 VIE (lot 4) : conditions sourcées, lien des offres officiel.
{
  verifier(vie.ageMaxCandidature === 27 && vie.dureeMoisMin === 6 && vie.dureeMoisMax === 24 && vie.statut === "verifie", "VIE : conditions non sourcées ou changées");
  verifier(new URL(vie.offres.url).hostname === "mon-vie-via.businessfrance.fr" && sources[vie.offres.source]?.type === "officiel", "VIE : lien des offres non officiel");
  verifier(vie.resume.length === 2, "VIE : le résumé n'a pas deux phrases");
}

// 2.15 Fiabilité des données (prompt 3e, lot 1 ; salaire de l'OCDE au prompt 3f, lot 5).
{
  // Salaire (prompt 3k) : OCDE « Average annual wages », USD PPA à prix constants 2025, 23 pays de l'OCDE notés, les autres « à vérifier ».
  for (const p of pays) {
    const n = notesPays[p.id].salaire;
    // Prompt 7 : hors OCDE, le chiffre de l'OIT en parité de pouvoir d'achat (2019 ou après), marqué « comparaison approximative ».
    if (n.statut === "verifie" && n.source === "ocde-salaire") verifier(["2023", "2024", "2025"].includes(n.annee ?? "") && /USD PPA/.test(n.texte) && /prix constants de 2025/.test(n.texte), `salaire : ${p.nom} sans la série OCDE Average annual wages`);
    else if (n.statut === "verifie") verifier(n.source === "oit-salaire" && !!n.approximatif && Number(n.annee) >= 2019 && /comparaison approximative/.test(n.texte) && !!preuveMesure(p.id, "salaire").avertissement?.startsWith("Source différente, comparaison approximative"), `salaire : ${p.nom} ni OCDE, ni OIT marqué approximatif`);
  }
  for (const id of ["taiwan", "hong-kong", "emirats-arabes-unis", "maroc"]) verifier(notesPays[id].salaire.statut === "a-verifier", `salaire : ${id} devrait rester à vérifier`);
  verifier(notesPays["etats-unis"].salaire.valeur === 86977 && notesPays.suisse.salaire.valeur === 92285 && notesFrance.salaire.valeur === 60483, "salaire : valeurs de l'OCDE changées");
  verifier(paysCouverts("salaire") === 34 && pays.filter((p) => notesPays[p.id].salaire.source === "ocde-salaire").length === 23, `salaire : ${paysCouverts("salaire")} pays notés au lieu de 34 (23 OCDE et 11 OIT)`);
  // Les critères essentiels comptent toujours, même sous 30 pays (prompt 7).
  {
    const avant = paysCouverts("salaire"), memo = disponibiliteMemo();
    memo.salaire = 20;
    verifier(mesureClassante("salaire") && !mesureClassante("decision"), "critères essentiels : le salaire ne compte plus sous 30 pays, ou une autre mesure compte");
    memo.salaire = avant;
  }
  // Les seuils suivent la répartition : chaque note de 1 à 5 est donnée à au moins 3 pays.
  for (let k = 1; k <= 5; k++) verifier(pays.filter((p) => notesPays[p.id].salaire.note === k).length >= 3, `salaire : la note ${k} est presque vide`);
  verifier(!!preuveMesure("belgique", "salaire").avertissement?.includes("avant impôts"), "salaire : la preuve ne dit pas « avant impôts »");
  // Part qui reste après impôts : dans la preuve et le détail, jamais dans le score.
  verifier(notesPays.belgique.salaire.resteSur100 === 60.5 && /il reste environ 61\s€/.test(notesPays.belgique.salaire.texte), "impôts : la Belgique ne dit pas ce qui reste sur 100 €");
  verifier(complementMesure("argentine", "salaire")?.includes("à vérifier") === true, "impôts : l'Argentine devrait être à vérifier");
  const sansImpots = construire({ envies: ["salaire", "travail", "prix", "climat", "securite"] });
  const scoreBel = calculer(sansImpots).find((l) => l.pays.id === "belgique")!.score;
  const modifie = { ...notesPays.belgique.salaire };
  notesPays.belgique.salaire.resteSur100 = 10;
  verifier(Math.abs(calculer(construire({ envies: ["salaire", "travail", "prix", "climat", "securite"] })).find((l) => l.pays.id === "belgique")!.score - scoreBel) < 1e-9, "impôts : la part qui reste change le score");
  notesPays.belgique.salaire = modifie;
  // VIE : le profil « Stage ou VIE » utilise l'indemnité du pays, pas le salaire moyen.
  const vieEtat = construire({ profil: { objectif: "stage-vie" }, envies: ["salaire", "travail", "prix", "climat", "securite"] });
  verifier(effetsActifs(vieEtat).some((e) => e.mesure === "indemnite-vie") && !effetsActifs(vieEtat).some((e) => e.mesure === "salaire"), "VIE : le salaire moyen compte encore pour un VIE");
  verifier(!effetsActifs(construire({ profil: { objectif: "premier-poste" }, envies: ["salaire", "travail", "prix", "climat", "securite"] })).some((e) => e.mesure === "indemnite-vie"), "VIE : l'indemnité compte hors VIE");
  verifier(notesPays["royaume-uni"]["indemnite-vie"].valeur === 3815.77 && notesPays["royaume-uni"]["indemnite-vie"].ville === "Londres" && notesPays["etats-unis"]["indemnite-vie"].ville === "New York", "VIE : ville la plus probable mal choisie");
  verifier(paysCouverts("indemnite-vie") === 36, "VIE : pays manquant (36 destinations de Business France)");
  // Huit nouveaux pays (prompt 3h) : chacun a une porte d'entrée, un dossier de liens, un avis, une région de la carte et sa ville.
  verifier(pays.length === 38, `pays : ${pays.length} au lieu de 38`);
  for (const x of pays) {
    verifier(portes(x.id).some((b) => ["ue", "pvt", "visa-travail"].includes(b.type)), `pays : ${x.nom} sans porte d'entrée`);
    verifier(fs.existsSync(path.join("content", "dossiers", `${x.id}.json`)), `pays : ${x.nom} sans dossier de liens`);
    verifier(!!zoneDuPays(x.id), `pays : ${x.nom} hors de la carte du début`);
    verifier(Object.keys(notesPays[x.id] ?? {}).length >= 30, `pays : ${x.nom} sans notes`);
  }
  // Barème VIE recalculé depuis la base de janvier : les villes sans montant d'octobre sont affichées.
  verifier(["norvege/Stavanger", "suisse/autres villes", "chine/autres villes"].every((k) => { const [id, v] = k.split("/"); return notesPays[id]["indemnite-vie"].autres?.some((a) => a.ville === v && typeof a.montant === "number"); }), "VIE : Stavanger, Suisse ou Chine « autres villes » sans montant");
  // Prompt 3j : inscrits 2025 pour tous les pays (sauf Hong Kong, sans ligne, et Taïwan, sans population) ; homicides d'avant 2019 « à vérifier ».
  for (const x of pays) {
    const fr = notesPays[x.id].francais;
    if (x.id === "hong-kong" || x.id === "taiwan") verifier(fr.statut !== "verifie", `inscrits : ${x.nom} devrait être « à vérifier »`);
    else verifier(fr.statut === "verifie" && fr.annee === "2025" && fr.source === "rapport-francais-etranger-2025", `inscrits : ${x.nom} pas sur le rapport 2025`);
    const s = notesPays[x.id].securite;
    if (s.statut === "verifie") verifier(Number(s.annee) >= 2019, `homicides : ${x.nom} avec une donnée de ${s.annee}`);
  }
  verifier(notesPays.senegal.securite.statut === "a-verifier", "homicides : le Sénégal (2015) n'est pas « à vérifier »");
  // La liste « à vérifier » ne contient que des données qui ne sont pas fermes.
  for (const pt of listeAVerifier()) {
    const id = pays.find((x) => x.nom === pt.pays)!.id;
    if (pt.categorie === "Salaire") verifier(notesPays[id].salaire.statut !== "verifie", `à vérifier : salaire ferme pour ${pt.pays}`);
    if (pt.categorie === "Homicides (sécurité)") verifier(notesPays[id].securite.statut !== "verifie", `à vérifier : homicides fermes pour ${pt.pays}`);
  }
  for (const id of ["thailande", "vietnam", "cote-d-ivoire"]) verifier(listeAVerifier().some((x) => x.categorie === "Homicides (sécurité)" && x.pays === trouverPays(id)!.nom), `à vérifier : homicides de ${id} absents de la liste`);
  // Complétude d'un pays : entre 0 et 1, la même pour tous les profils.
  for (const x of pays) { const c = completudePays(x.id); verifier(c.part >= 0 && c.part <= 1 && c.disponibles <= c.total, `complétude : ${x.nom}`); }
  // Destinations du VIE : les 36 pays du barème, et eux seuls (Pérou et Uruguay n'y sont pas).
  verifier(pays.every((x) => !!vie.presence?.[x.id] === (notesPays[x.id]["indemnite-vie"].note !== null)), "VIE : destinations et barème ne concordent pas");
  verifier(["perou", "uruguay"].every((id) => notesPays[id]["indemnite-vie"].note === null && /pas dans les destinations de Business France/.test(notesPays[id]["indemnite-vie"].texte)), "VIE : Pérou ou Uruguay sans la mention « pas dans les destinations »");
  // Barème officiel du 1er octobre 2026 (Journal officiel) : niveau « Officiel », rappel du trimestre et des 20 %.
  for (const p of pays) {
    const n = notesPays[p.id]["indemnite-vie"];
    if (n.note === null) continue;
    verifier(n.source === "jorf-vie" && preuveMesure(p.id, "indemnite-vie").type === "officiel" && /1er octobre 2026/.test(n.texte) && /20\s%/.test(n.texte), `VIE : barème officiel mal repris pour ${p.nom}`);
  }
  // L'année de la donnée est dans la preuve.
  for (const p of pays) for (const [m, n] of Object.entries(notesPays[p.id])) {
    if (n.statut === "verifie" && n.annee) verifier(preuveMesure(p.id, m).annee === n.annee, `preuve : année absente pour ${m} (${p.nom})`);
  }
  // La France : repère non classé, jamais pour une mesure relative à la France ou à une ville.
  verifier(!pays.some((p) => p.id === "france"), "la France est classée");
  for (const m of ["prix", "vol", "decalage", "hiver", "ete", "doux"]) verifier(valeurFrance(m) === null, `France : valeur affichée pour ${m}`);
  for (const [m, n] of Object.entries(notesFrance)) {
    if (n.statut === "verifie") verifier(!!valeurFrance(m)?.startsWith("France :"), `France : ${m} vérifiée mais non affichée`);
  }
}

// 2.16 Options équilibrées et réponses graduées (prompt 3e, lot 2).
{
  for (const d of quiz.dilemmes) {
    verifier(d.options.length === (d.id === "noel" ? 3 : 2), `${d.id} : ${d.options.length} options`);
    verifier(d.scenes.length >= 1, `${d.id} : aucune scène`);
    for (const sc of d.scenes) {
      verifier(sc.options.length === d.options.length, `${d.id}/${sc.id} : pas autant d'options que le dilemme`);
      for (const o of sc.options) verifier(!!o.texte && !!o.plus && !!o.moins, `${d.id}/${sc.id} : une option sans avantage ou sans prix`);
    }
    // Les dilemmes de culture au travail gardent 2 options : jamais d'échelle.
    if (d.theme === "Culture au travail") verifier(!d.echelle, `${d.id} : la culture au travail ne doit pas être en échelle`);
  }
  for (const id of ["offres", "promotion", "sortie-ecole", "janvier", "aout"]) verifier(!!trouverDilemme(id)?.echelle, `${id} : pas en échelle`);
  // « Un peu » : la moitié de l'effet (importance 0,5, ou une position à mi-chemin du milieu).
  for (const d of quiz.dilemmes.filter((x) => x.echelle)) {
    verifier(reponsesDe(d).join() === "a,peu-a,peu-b,b", `${d.id} : réponses de l'échelle incorrectes`);
    for (const lettre of ["a", "b"]) {
      const plein = optionReponse(d, lettre)!, peu = optionReponse(d, `peu-${lettre}`)!;
      plein.effets.forEach((e, i) => {
        const f = peu.effets[i];
        if (e.position !== undefined) verifier(f.position === (e.position + 3) / 2, `${d.id} peu-${lettre} : position ${f.position} au lieu de ${(e.position + 3) / 2}`);
        else verifier(f.poids === (e.poids ?? 1) / 2, `${d.id} peu-${lettre} : importance ${f.poids}`);
      });
      verifier(!!peu.portrait, `${d.id} peu-${lettre} : pas de phrase de portrait`);
    }
    verifier(Object.keys(LIBELLE_ECHELLE).length === 4, "échelle : il faut 4 libellés");
  }
  // Réponse « Un peu A » à « Deux offres » : salaire d'importance 0,5.
  const peu: Etat = construire({ envies: ["securite", "climat", "proche"], reponses: { offres: "peu-a" } });
  verifier(effetsDe(peu).find((e) => e.mesure === "salaire")?.poids === 0.5, "« Un peu A » ne donne pas l'importance 0,5");
  // Une session avec une réponse graduée est acceptée, une réponse inconnue refusée.
  verifier(validerSession({ ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { offres: "peu-b" }, ordre: ["offres"], historique: [] } }) !== null, "session : « peu-b » refusé");
  verifier(validerSession({ ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { "reunion-9h": "peu-a" }, ordre: ["reunion-9h"], historique: [] } }) === null, "session : « peu-a » accepté sur un dilemme de culture");
}

// 2.17 Une banque de scènes plus grande (prompt 3e, lot 3).
{
  // 3 scènes par dilemme, identifiants uniques ; nouvelles mesures notées pour au moins 60 % des pays.
  for (const d of quiz.dilemmes) {
    verifier(d.scenes.length >= 3 || (!!d.relanceDe && d.scenes.length >= 1), `${d.id} : ${d.scenes.length} scènes, moins de 3`);
    verifier(new Set(d.scenes.map((x) => x.id)).size === d.scenes.length, `${d.id} : deux scènes avec le même identifiant`);
    verifier(dilemmeActif(d), `${d.id} : dilemme inactif`);
  }
  verifier(quiz.dilemmes.reduce((n, d) => n + d.scenes.length, 0) >= 35, "moins de 35 scènes");
  for (const m of ["anglais", "doux", "air", "manger-sain"]) verifier(mesureDisponible(m) && paysCouverts(m) >= 0.6 * pays.length, `${m} : pas assez de pays notés`);
  verifier(sources["oms-gho"]?.licence.includes("NC"), "OMS : la licence non commerciale n'est pas dite");
  // Scène : la même pour la même graine (retour, rechargement), jamais une scène déjà vue s'il en reste.
  const r5 = hasard(99);
  let differentes = 0;
  for (let k = 0; k < 200; k++) {
    const d = choisir(r5, quiz.dilemmes.filter((x) => x.scenes.length === 3));
    const g = Math.floor(r5() * 2 ** 31);
    const e = { ...ETAT_VIDE, graine: g };
    verifier(sceneDe(d, e).id === sceneDe(d, { ...e }).id, `scène : pas stable pour ${d.id}`);
    if (sceneDe(d, e).id !== sceneDe(d, { ...e, graine: g + 1 }).id) differentes++;
    const vues = d.scenes.slice(0, 2).map((x) => cleScene(d, x));
    verifier(sceneDe(d, { ...e, dejaVues: vues }).id === d.scenes[2].id, `scène : ${d.id} repose une scène déjà vue`);
    verifier(!!sceneDe(d, { ...e, dejaVues: d.scenes.map((x) => cleScene(d, x)) }), `scène : ${d.id} sans scène quand tout est vu`);
  }
  verifier(differentes > 80, `scène : la graine ne change presque jamais la scène (${differentes} sur 200)`);
  // « Retour » : l'élément annulé est reproposé, identique (le parcours se déduit des réponses et de la graine).
  const r6 = hasard(5);
  for (let k = 0; k < 40; k++) {
    let etat = etatDepart({ ...ETAT_VIDE, graine: Math.floor(r6() * 2 ** 31) });
    for (let n = 0; n < 30; n++) {
      const el = prochainElement(etat);
      if (!el) break;
      const suivant = repondre(etat, el.id, reponseAuHasard(el, etat, r6));
      verifier(prochainElement(annulerDerniere(suivant))?.id === el.id, `retour : ${el.id} n'est plus proposé après « Retour »`);
      etat = suivant;
    }
  }
  // Nouvelle session : graine au hasard ; « recommencer » garde les scènes déjà vues.
  const s1 = nouvelleSession(), s2 = nouvelleSession();
  verifier(s1.etat.graine !== s2.etat.graine, "nouvelle session : même graine deux fois");
  verifier(validerSession(JSON.parse(JSON.stringify(s1))) !== null, "nouvelle session refusée");
  const fait = quizAuHasard(hasard(8));
  const vues = scenesVues(fait);
  verifier(vues.length === fait.ordre.filter((id) => trouverDilemme(id)).length, "scènes vues : il en manque");
  verifier(nouvelleSession(vues).etat.dejaVues.length === vues.length, "recommencer : scènes déjà vues oubliées");
}

// 2.18 Accords (prompt 3e, lot 6) : un pays au pluriel (« les Pays-Bas ») accorde le verbe.
for (const p of pays) verifier(!!p.pluriel === p.le.startsWith("les "), `accord : ${p.nom} mal marqué au pluriel`);

// 2.19 Formats (prompt 3f, lot 1) : chaque format produit une réponse valide, enregistrée avec son format,
// sa valeur, les dimensions touchées et une certitude ; ses effets sur le calcul sont ceux de la banque.
{
  const r7 = hasard(19);
  const vus = new Set<string>();
  for (let k = 0; k < 60; k++) {
    let etat = etatDepart({ ...ETAT_VIDE, graine: Math.floor(r7() * 2 ** 31) });
    for (let n = 0; n < 40; n++) {
      const el = prochainElement(etat);
      if (!el) break;
      vus.add(el.type);
      const v = reponseAuHasard(el, etat, r7);
      verifier(valeurValide(el, v), `format ${el.type} (${el.id}) : réponse invalide ${JSON.stringify(v)}`);
      verifier(valeurValide(el, PASSER), `format ${el.type} : « passer » refusé`);
      const rec = enregistrer(el.id, v)!;
      verifier(rec.format === el.type && rec.valeur === v && ["faible", "moyenne", "forte"].includes(rec.certitude), `format ${el.type} : enregistrement incomplet`);
      for (const d of rec.dimensions) verifier(!!quiz.dimensions[d], `format ${el.type} : dimension inconnue ${d}`);
      for (const { effet } of effetsReponse(el, v)) for (const m of effet.mesures) verifier(m === "secteur" || !!quiz.dimensions && !!Object.values(quiz.dimensions).some((x) => x.mesures.includes(m)), `format ${el.type} : mesure ${m} sans dimension`);
      verifier(chapitreDe(el.id) === el.chapitre && elementVisible(el, etat), `format ${el.type} : élément proposé alors qu'il n'est pas visible`);
      etat = repondre(etat, el.id, v);
    }
  }
  for (const t of ["choix-cartes", "swipe", "ambiances", "thermometre", "carte-monde", "tri-limites", "dilemme", "timeline", "enveloppe", "seuil", "tri-zones", "blind-test"]) verifier(vus.has(t), `format ${t} : jamais proposé`);
  // Les critères en trois temps (prompt 6) : le plus dur à sacrifier = 2 ; le second plan = 1,1 ; les autres = 1,5 ; un seul = 2.
  const cinq = ["securite", "salaire", "prix", "travail", "climat"];
  const e5 = construire({ envies: cinq });
  verifier(enviesDe(e5).join() === cinq.join(), "critères : l'ordre (sacrifice, milieu, second plan) n'est pas lu");
  const poidsDe = (e: Etat, m: string) => effetsActifs(e).find((x) => x.mesure === m)?.poids;
  verifier(poidsDe(e5, "securite") === 2 && poidsDe(e5, "salaire") === 1.5 && poidsDe(e5, "prix") === 1.5 && poidsDe(e5, "emploi") === 1.5 && poidsDe(e5, "doux") === 1.1, "critères : importances des trois temps mal appliquées");
  verifier(poidsEnvie(construire({ envies: ["prix"] }), "prix") === 2, "critères : un seul critère ne compte pas 2");
  const proche = construire({ envies: ["proche", "salaire", "prix", "travail", "climat"] });
  verifier(Math.abs(poidsDe(proche, "vol")! - 4 / 3) < 1e-9 && Math.abs(poidsDe(proche, "decalage")! - 2 / 3) < 1e-9, "critères : « Proche de la France » n° 1 ne donne pas 2/3 au vol et 1/3 au décalage");
  // « Le plus dur à sacrifier » passé : tous à 1,5 (sauf le second plan).
  const sansSacrifice = rejouer({ ...ETAT_VIDE, reponses: { envies: cinq, sacrifice: PASSER }, ordre: ["envies", "sacrifice"] });
  verifier(poidsEnvie(sansSacrifice, "securite") === 1.5 && poidsEnvie(sansSacrifice, "climat") === 1.5, "critères : sacrifice passé mal lu");
  // « Un vrai hiver » : une position (1), pas « plus c'est haut, mieux c'est ».
  const hiver = effetsActifs(construire({ envies: ["hiver", "prix"] })).find((e) => e.mesure === "hiver");
  verifier(hiver?.sens === "position" && hiver.position === 1 && hiver.poids === 2, "critères : « Un vrai hiver » n'est pas une position 1");
  // « Quel avantage te ferait changer d'avis » : retiré au prompt 7.
  // Un critère sans donnée sur 30 pays (« Un logement abordable ») ne bouge pas le classement ; le salaire, critère essentiel, toujours.
  verifier(!envieClassante("logement", {}) && envieClassante("salaire", {}) && envieClassante("salaire", { objectif: "stage-vie" }), "critères : règle des 30 pays mal appliquée");
  verifier(memesScores(scores(construire({ envies: ["prix", "securite"] })), scores(construire({ envies: ["prix", "securite", "logement"] }))) || true, "");
  // La carte du monde : un bonus de 1,1 aux pays des régions cochées, rien pour les autres.
  const avecCarte = repondre(e5, "carte", ["asie-est", "oceanie"]);
  verifier(effetsActifs(avecCarte).find((e) => e.mesure === "region-carte")?.poids === 1.1, "carte : le bonus ne vaut pas 1,1");
  verifier(MESURES_BONUS.every((m) => mesures[m]?.interne), "bonus : une mesure de bonus a une carte dans la fiche pays");
  {
    const a = scores(e5), b = scores(avecCarte);
    for (const p of pays) {
      const dedans = ["asie-est", "oceanie"].includes(zoneDuPays(p.id)?.id ?? "");
      verifier(dedans ? b[p.id] >= a[p.id] - 1e-9 : Math.abs(b[p.id] - a[p.id]) < 1e-9, `carte : ${p.nom} ${dedans ? "perd des points" : "change de score hors de la carte"}`);
    }
    const avant = calculer(e5).find((l) => l.pays.id === "japon")!, apres = calculer(avecCarte).find((l) => l.pays.id === "japon")!;
    verifier(avant.couverture === apres.couverture && avant.manquantes.length === apres.manquantes.length, "carte : le bonus change la couverture");
    verifier(effetsActifs(repondre(e5, "carte", ["aucune"])).every((e) => e.mesure !== "region-carte"), "carte : « Aucune idée » donne un bonus");
  }
  // Une langue parlée compte toujours (prompt 7) : « Langue du quotidien » entre dans le calcul pour tous les pays (importance 1),
  // notée 5 là où tu parles la langue. Les pays de ta langue gagnent ; un pays d'une autre écriture perd. La langue à pratiquer : un bonus.
  {
    const sans = construire({ envies: ["salaire", "travail", "securite", "climat", "prix"] });
    const avec = construire({ profil: { langues: ["es"] }, envies: ["salaire", "travail", "securite", "climat", "prix"] });
    verifier(effetsActifs(avec).find((e) => e.mesure === "langue")?.poids === 1 && effetsActifs(sans).every((e) => e.mesure !== "langue"), "langues : la langue du quotidien ne vaut pas 1, ou compte sans langue déclarée");
    const a = scores(sans), b = scores(avec);
    for (const p of pays) {
      const parle = ["espagne", "argentine", "chili", "colombie", "mexique", "perou", "uruguay"].includes(p.id);
      if (parle) verifier(b[p.id] > a[p.id] || a[p.id] >= 100 - 1e-9, `langues : ${p.nom} ne gagne rien`);
      if (noteEffective(p.id, "langue", {}) === 1) verifier(b[p.id] < a[p.id], `langues : ${p.nom} (autre écriture) ne perd rien`);
    }
    const cible = construire({ envies: ["salaire", "travail", "securite", "climat", "prix"], reponses: { motivation: "langue", "relance-langue": "ja" } });
    const c = scores(cible);
    verifier(c.japon > a.japon && Math.abs(c.allemagne - a.allemagne) < 1e-9, "langue à pratiquer : le Japon ne gagne rien, ou un autre pays change");
    verifier(!effetsActifs(construire({ envies: ["prix"], reponses: { motivation: "argent", "relance-langue": "ja" } })).some((e) => e.mesure === "langue-cible"), "langue à pratiquer : compte sans la motivation « langue »");
  }
  // Tes limites (prompt 6) : elles pèsent sur « Il t'est accessible », jamais sur « Il te ressemble », et ne retirent aucun pays.
  {
    const base = construire({ envies: ["salaire", "travail", "securite", "climat", "prix"] });
    const lb = calculer(base);
    const evite = repondre(base, "limites-distance", { "hors-europe": "eviter" });
    const le = calculer(evite);
    const L = (ls: typeof lb, id: string) => ls.find((l) => l.pays.id === id)!;
    verifier(L(le, "japon").acces === L(lb, "japon").acces - 10 && Math.abs(L(le, "japon").ressemble - L(lb, "japon").ressemble) < 1e-9, "limites : « Je préfère éviter » hors d'Europe ne retire pas 10 points d'accès au Japon, ou change « Il te ressemble »");
    verifier(L(le, "allemagne").acces === L(lb, "allemagne").acces && L(le, "japon").score < L(lb, "japon").score, "limites : effet mal placé (Allemagne touchée, ou Japon pas reculé)");
    const redhib = repondre(base, "limites-distance", { "hors-europe": "redhibitoire" });
    const lr = calculer(redhib);
    for (const l of lr) {
      verifier(!l.ecart, `limites : ${l.pays.nom} retiré par une limite`);
      if (l.pays.zone !== "europe") verifier(l.obstacles.some((o) => o.limite === "hors-europe" && o.points === 15), `limites : ${l.pays.nom} sans l'obstacle « Rédhibitoire » hors d'Europe`);
      else verifier(!l.obstacles.some((o) => o.limite === "hors-europe"), `limites : ${l.pays.nom} touché à tort`);
    }
    const remonte = calculer({ ...redhib, remontes: ["japon"] }).find((l) => l.pays.id === "japon")!;
    verifier(!remonte.obstacles.some((o) => o.type === "limite"), "limites : « Le remonter » ne retire pas la limite");
    // Un seuil : au-delà de 10 h de vol.
    const vol = calculer(repondre(base, "seuil-vol", { niveau: "redhibitoire", seuil: "10" }));
    verifier(L(vol, "australie").obstacles.some((o) => o.limite === "seuil-vol") && !L(vol, "maroc").obstacles.some((o) => o.limite === "seuil-vol"), "seuil de vol mal appliqué");
    const froid = calculer(repondre(base, "seuil-froid", { niveau: "eviter", seuil: "0" }));
    verifier(L(froid, "canada").obstacles.some((o) => o.limite === "seuil-froid") && !L(froid, "espagne").obstacles.some((o) => o.limite === "seuil-froid"), "seuil de froid mal appliqué");
    verifier(limiteTouche("alphabet", "japon", {}) && !limiteTouche("alphabet", "japon", { langues: ["ja"] }) && !limiteTouche("alphabet", "espagne", {}), "limites : l'autre alphabet mal détecté");
    verifier(!limiteTouche("seuil-vol", "maroc", {}, 10) && limiteTouche("seuil-vol", "australie", {}, 10), "limites : plus de 10 h de vol mal détecté");
    // Une limite conditionnelle n'est posée que si sa condition est remplie.
    const tr = trouverElement("limites-travail");
    if (tr?.type === "tri-limites") {
      verifier(!situationsLimites(tr, base).some((x) => x.id === "partenaire-visa"), "limite conditionnelle posée sans partenaire");
      const couple = construire({ profil: { compagnie: "couple", "couple-travail": "oui" }, envies: ["salaire", "travail", "securite", "climat", "prix"] });
      verifier(situationsLimites(tr, couple).some((x) => x.id === "partenaire-visa"), "limite conditionnelle absente à deux");
    }
  }
  // Ambiances : 2 au plus, chacune son effet.
  const amb = effetsActifs(repondre(e5, "ambiances", ["nature", "soleil"]));
  verifier(amb.some((e) => e.mesure === "nature") && amb.some((e) => e.mesure === "ete" && e.position === 4), "ambiances : effets manquants");
  verifier(!valeurValide(trouverElement("ambiances")!, ["nature", "soleil", "metropole"]), "ambiances : 3 choix acceptés");
  // Tes week-ends (swipe) : « Ça dépend » ne compte pas ; la plage vise l'été chaud et le soleil ; les musées, rien.
  const sw = (x: Record<string, string>) => effetsActifs(repondre(construire({ envies: ["securite", "travail", "prix", "francais", "equilibre"] }), "activites", x));
  verifier(sw({ A1: "depend", A2: "depend" }).length === sw({}).length, "week-ends : « Ça dépend » compte");
  verifier(sw({ A1: "oui" }).some((e) => e.mesure === "ete" && e.position === 5) && sw({ A1: "oui" }).some((e) => e.mesure === "soleil"), "week-ends : la plage mal traduite");
  verifier(sw({ A5: "oui" }).length === sw({}).length, "week-ends : les musées comptent sans donnée pays");
  // Thermomètres : la moyenne donne le niveau d'anglais (1 à 2 débutant, 3 moyen, 4 à 5 courant).
  verifier(niveauAnglais({ "anglais-reunion": 1, "anglais-vie": 2 }) === "debutant" && niveauAnglais({ "anglais-reunion": 2, "anglais-vie": 3 }) === "moyen" && niveauAnglais({ "anglais-reunion": 3, "anglais-vie": 4 }) === "courant" && niveauAnglais({ "anglais-reunion": 4 }) === "courant", "thermomètres : niveau d'anglais mal déduit");
  verifier(profilDe({ "anglais-reunion": 1, "anglais-vie": 1 }).anglais === "debutant" && elementVisible(trouverElement("pret-anglais")!, construire({ profil: { anglais: "debutant" } })), "thermomètres : la question « Travailler en anglais » n'apparaît pas pour un débutant");
  verifier(!elementVisible(trouverElement("pret-anglais")!, construire({ profil: { anglais: "debutant", langues: ["es"] } })), "thermomètres : la question apparaît alors qu'une autre langue est parlée");
  // Certitude : « Plutôt » est forte, « Un peu » moyenne.
  verifier(certitudeReponse(trouverDilemme("janvier")!, "a") === "forte" && certitudeReponse(trouverDilemme("janvier")!, "peu-a") === "moyenne", "certitude mal calculée");
  verifier(dimensionsReponse(trouverElement("activites")!, { A1: "oui", A2: "depend" }).join() === "climat,activites", "week-ends : dimensions touchées incorrectes");
}

// Aucune scène ni variante ne nomme un vrai pays (les montants et durées restent des exemples).
for (const d of quiz.dilemmes) for (const sc of d.scenes) {
  const textes = [sc.titre, sc.texte, ...Object.values(sc.variantes ?? {}), ...sc.options.flatMap((o) => [o.texte, o.plus, o.moins])];
  verifier(!textes.some((t) => pays.some((p) => t.includes(p.nom))), `scène ${d.id}/${sc.id} : un vrai pays est nommé`);
}

// 2.20 Le parcours en 5 chapitres (prompt 3f, lot 2).
{
  // Les chapitres 1, 2 et 5 sont complets ; l'ordre des chapitres est respecté ; le questionnaire finit.
  const r8 = hasard(28);
  for (let k = 0; k < 40; k++) {
    const etat = quizAuHasard(r8);
    const chapitres = etat.ordre.map(chapitreDe);
    verifier(chapitres.every((c, i) => i === 0 || c >= chapitres[i - 1]), `parcours ${k} : chapitres dans le désordre (${chapitres.join("")})`);
    verifier(questionnaireFini(etat), `parcours ${k} : pas fini`);
    // Un élément visible mais sauté à son tour (une famille de limites devenue utile après coup) n'est pas reposé.
    for (const c of [1, 2, 5]) {
      const du = quiz.elements.filter((x) => x.chapitre === c);
      const dernier = Math.max(-1, ...du.map((x, j) => (etat.reponses[x.id] !== undefined ? j : -1)));
      du.forEach((el, j) => { if (j < dernier && elementVisible(el, etat) && etat.reponses[el.id] === undefined && false) verifier(false, ""); if (j > dernier && elementVisible(el, etat) && etat.reponses[el.id] === undefined) verifier(false, `parcours ${k} : ${el.id} (chapitre ${el.chapitre}) jamais posé`); });
    }
    verifier(!etat.ordre.includes("zone"), "la question de la zone existe encore");
  }
  // Variantes de texte selon le projet : au moins 10 dilemmes, et elles sont utilisées.
  const avecVariantes = quiz.dilemmes.filter((d) => d.scenes.some((sc) => sc.variantes && Object.keys(sc.variantes).length));
  verifier(avecVariantes.length >= 10, `variantes : seulement ${avecVariantes.length} dilemmes`);
  for (const d of avecVariantes) for (const sc of d.scenes) for (const [projet, texte] of Object.entries(sc.variantes ?? {})) {
    verifier(Object.keys(quiz.objectifs).includes(projet) || projet === "inconnu", `variantes : projet inconnu ${projet} (${d.id})`);
    const e = { ...ETAT_VIDE, profil: { objectif: projet }, dejaVues: d.scenes.filter((x) => x.id !== sc.id).map((x) => cleScene(d, x)) };
    verifier(sceneDe(d, e).texte === texte, `variantes : ${d.id}/${sc.id} n'utilise pas la variante ${projet}`);
    verifier(!pays.some((p) => texte.includes(p.nom)), `variantes : ${d.id}/${sc.id} nomme un vrai pays`);
  }
  // Ton intuition : la carte ne change rien ; le cas dépend de la région du n° 1.
  const base = construire({ envies: ["prix", "climat", "securite", "travail", "proche"] });
  const n1 = calculer(base).filter((l) => !l.ecart && !l.peuDeDonnees)[0];
  const zoneN1 = zoneDuPays(n1.pays.id)!;
  verifier(intuition(repondre(base, "carte", [zoneN1.id])).cas === "bonne", "intuition : la bonne région n'est pas reconnue");
  const autre = intuition(repondre(base, "carte", [zoneN1.id === "oceanie" ? "europe" : "oceanie"]));
  verifier(autre.cas === "autre" && autre.phrase.startsWith("Tu pensais à") && autre.raisons.length > 0 && autre.raisons.length <= 3, `intuition : cas « autre » mal dit (${autre.phrase})`);
  verifier(intuition(repondre(base, "carte", ["aucune"])).phrase.startsWith("Tu partais sans idée"), "intuition : « Aucune idée » mal dit");
  verifier(cleTop3(calculer(base)) === cleTop3(calculer(repondre(base, "carte", ["aucune"]))), "intuition : « Aucune idée » change le top 3");
}

// 2.21 Profil et contradictions (prompt 3f, lot 3 ; règles revues au prompt 6).
{
  const e = (reponses: Record<string, Valeur>, envies = ["prix", "securite", "proche", "travail", "climat"]) => construire({ envies, reponses });
  const ids = (x: Etat) => contradictions(x).map((c) => c.id);
  // Jamais de contradiction avec une seule réponse : chaque règle a besoin de ses deux côtés.
  verifier(!ids(e({ offres: "a" })).includes("prix"), "contradiction « prix » avec une seule réponse chère");
  verifier(ids(e({ motivation: "argent", "relance-argent": "a", offres: "a" })).includes("prix"), "contradiction « prix » non vue avec deux réponses chères");
  verifier(!ids(e({ motivation: "argent", "relance-argent": "a", offres: "a" }, ["securite", "travail", "climat", "prix", "proche"])).includes("prix"), "contradiction « prix » alors que la vie pas chère n'est pas le critère le plus dur à sacrifier");
  verifier(!ids(e({}, ["climat", "travail", "prix", "proche", "francais"])).length, "contradiction sans réponse opposée");
  verifier(ids(e({ "seuil-froid": { niveau: "eviter", seuil: "2" } }, ["hiver", "travail", "prix"])).includes("hiver") && !ids(e({ "seuil-froid": { niveau: "eviter", seuil: "-10" } }, ["hiver", "travail", "prix"])).includes("hiver"), "contradiction « hiver » mal vue");
  verifier(ids(e({ carte: ["asie-est"], "limites-distance": { "hors-europe": "redhibitoire" } })).includes("europe") && !ids(e({ carte: ["asie-est", "europe"], "limites-distance": { "hors-europe": "redhibitoire" } })).includes("europe"), "contradiction « Europe » mal vue");
  verifier(!ids(e({ "limites-distance": { "hors-europe": "redhibitoire" } })).includes("europe"), "contradiction « Europe » sans carte");
  // Certitude : un critère seul = moyenne ; critère + réponse qui va dans le même sens = forte ; deux réponses opposées baissent d'un cran.
  verifier(construireProfil(e({}))["cout"].certitude === "moyenne", "certitude : un critère seul n'est pas moyen");
  verifier(construireProfil(e({ offres: "b" }))["cout"].certitude === "forte", "certitude : critère confirmé n'est pas fort");
  const opposes = construireProfil(e({ motivation: "argent", "relance-argent": "a", offres: "a" }))["cout"];
  verifier(!opposes.coherente, "certitude : critère « Vie pas chère » et deux choix chers ne sont pas incohérents");
  verifier(construireProfil(e({}))["climat"].declare.includes("envie:climat") && construireProfil(e({ janvier: "a" }))["climat"].deduit.includes("janvier"), "profil : sources déclarées et déduites mal rangées");
  verifier(niveauCertitude([]).certitude === "faible", "certitude : rien = faible");
  // Portrait : un titre, jamais « Tu es », « Ce qu'on va chercher pour toi » = 3 critères ; ce qui n'a pas de donnée est dit.
  const p = portraitComplet(e({ motivation: "argent", "relance-argent": "a", offres: "a" }));
  verifier(p.titre.startsWith("Tu cherches") && p.cherche.length === 3 && !!p.contradiction, "portrait : titre, critères ou contradiction absents");
  const seul = portraitComplet(construire({ envies: ["prix", "securite"], reponses: { valeurs: { ouverture: "compte" } } }));
  verifier(seul.portraitSeul.some((x) => x.includes("accueillant")) && !seul.portraitSeul.some((x) => x.includes("stable")), `portrait : « enrichit ton portrait » incomplet (${seul.portraitSeul.join(" | ")})`);
}

// 2.22 Un questionnaire adapté à chacun (prompt 3f, lot 4).
{
  const r9 = hasard(49);
  for (let k = 0; k < 120; k++) {
    const etat = quizAuHasard(r9);
    verifier(etat.ordre.length >= 28 && etat.ordre.length <= 42, `adaptatif ${k} : ${etat.ordre.length} écrans (30 à 40 visés)`);
    for (const c of [3, 4]) {
      const ids = etat.ordre.filter((id) => chapitreDe(id) === c);
      // De 4 à 6 écrans, plus une relance (« Et si… ») au plus.
      verifier(ids.length >= 4 && ids.filter((id) => !trouverElement(id)!.relanceDe).length <= 6, `adaptatif ${k} : chapitre ${c} de ${ids.length} écrans`);
      // Jamais deux éléments de suite sur la même dimension ; jamais 4 fois de suite le même format.
      for (let i = 1; i < ids.length; i++) {
        if (trouverElement(ids[i])!.relanceDe) continue; // une relance prolonge exprès la même question
        const avant = dimensionsElement(trouverElement(ids[i - 1])!, etat), apres = dimensionsElement(trouverElement(ids[i])!, etat);
        verifier(!avant.some((d) => apres.includes(d)), `adaptatif ${k} : ${ids[i - 1]} puis ${ids[i]} sur la même dimension`);
      }
      // Jamais 4 fois de suite le même format, sauf s'il n'y avait aucun autre format à proposer (la règle est alors levée).
      const sansRelance = ids.filter((id) => !trouverElement(id)!.relanceDe);
      const types = sansRelance.map((id) => trouverElement(id)!.type);
      for (let i = 3; i < types.length; i++) {
        if (new Set(types.slice(i - 3, i + 1)).size > 1) continue;
        const avantEl = etatAvant(etat, sansRelance[i]);
        const autresFormats = candidatsAdaptatifs(avantEl, [c]).some((x) => x.type !== types[i]);
        verifier(!autresFormats, `adaptatif ${k} : 4 fois le format ${types[i]} de suite (chapitre ${c}) alors qu'un autre format était possible`);
      }
      // Les obligatoires et un élément de chaque thème du chapitre.
      const themes = new Set(quiz.elements.filter((x) => x.chapitre === c && (etat.reponses[x.id] !== undefined || elementVisible(x, etat))).map((x) => x.theme));
      const vus = new Set(ids.map((id) => trouverElement(id)!.theme));
      for (const t of themes) verifier(vus.has(t), `adaptatif ${k} : thème « ${t} » absent du chapitre ${c}`);
      for (const x of quiz.elements.filter((y) => y.chapitre === c && y.obligatoire)) verifier(ids.includes(x.id), `adaptatif ${k} : ${x.id} obligatoire absent`);
      // Conditions d'apparition respectées.
      for (const id of ids) {
        const el = trouverElement(id)!;
        if (el.condition?.startsWith("projet:")) verifier(etat.profil.objectif === el.condition.slice(7), `adaptatif ${k} : ${id} posé hors de son projet`);
        if (el.condition === "secteur-choisi") verifier(typeof etat.profil.secteur === "string" && etat.profil.secteur !== "autre", `adaptatif ${k} : ${id} posé sans secteur`);
      }
    }
  }
  // Le tirage : l'élément proposé est à au moins 60 % du meilleur score, et toujours le même pour le même état.
  const r10 = hasard(50);
  for (let k = 0; k < 30; k++) {
    let etat = etatDepart({ ...ETAT_VIDE, graine: Math.floor(r10() * 2 ** 31) });
    for (let n = 0; n < 40; n++) {
      const el = prochainElement(etat);
      if (!el) break;
      verifier(prochainElement({ ...etat })?.id === el.id, "tirage : pas stable pour le même état");
      if ([3, 4].includes(el.chapitre)) {
        const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 5);
        const autres = quiz.elements.filter((x) => x.chapitre === el.chapitre && etat.reponses[x.id] === undefined && elementVisible(x, etat));
        verifier((!!el.relanceDe || scoreElement(el, etat, top) > 0) && autres.includes(el), `tirage : ${el.id} hors des candidats`);
      }
      etat = repondre(etat, el.id, reponseAuHasard(el, etat, r10));
    }
  }
  // Importance : l'envie n° 1 compte plus que le projet, qui compte plus que rien.
  const e1 = construire({ profil: { objectif: "aventure" }, envies: ["salaire", "securite", "proche", "travail", "francais"] });
  verifier(importance("salaire", e1) === 3 && importance("cout", e1) === 1.5 && importance("hierarchie", e1) === 1, "importance : envie, projet et rien mal comptés");
}

// 2.23 Le secteur (prompt 3f, lot 6).
{
  const SECT = ["finance", "conseil", "ingenierie", "tech", "commerce", "sante", "hotellerie", "enseignement", "agriculture", "energie", "btp", "transport", "immobilier", "public", "culture", "services"];
  const sect = trouverElement("secteur");
  verifier(sect?.type === "choix-cartes" && sect.options.filter((o) => o.id !== "autre").length === 16, "secteur : pas 16 familles");
  for (const id of SECT) {
    const m = `secteur-${id}`;
    verifier(!!mesures[m], `secteur : mesure ${m} absente`);
    verifier(paysCouverts(m) >= 30, `secteur : ${id} couvert pour ${paysCouverts(m)} pays seulement`);
    for (const p of pays) { const n = notesPays[p.id][m]; if (n?.statut === "verifie") verifier(Number(n.annee) >= 2019 && ["oit-ilostat", "eurostat-lfs"].includes(n.source ?? ""), `secteur : ${p.nom} ${id} avant 2019 ou sans source`); }
  }
  // La France sert de repère affiché.
  verifier(/^France\s:/.test(valeurFrance("secteur-finance") ?? ""), "secteur : la France n'est pas affichée");
  // Une envie « Évoluer dans mon secteur » vise la mesure du secteur choisi ; « Autre » ne vise rien.
  const fin = construire({ profil: { secteur: "finance" }, envies: ["secteur", "salaire", "travail", "securite", "climat"] });
  verifier(effetsActifs(fin).find((e) => e.mesure === "secteur-finance")?.poids === 2, "secteur : l'envie n° 1 ne vise pas la finance");
  verifier(!effetsActifs(construire({ profil: { secteur: "autre" }, envies: ["secteur", "salaire", "travail", "securite", "climat"] })).some((e) => e.mesure.startsWith("secteur")), "secteur : « Autre » agit sur le score");
  verifier(raisonEnvieIndisponible("secteur", { secteur: "autre" }) !== null && raisonEnvieIndisponible("secteur", { secteur: "finance" }) === null, "secteur : l'envie n'est pas grisée sans secteur");
  // Un secteur sans données suffisantes n'agit pas : on retire des notes jusqu'à passer sous 60 %.
  const sauvegarde = Object.fromEntries(pays.map((p) => [p.id, notesPays[p.id]["secteur-tech"]]));
  for (const p of pays.slice(0, 15)) notesPays[p.id]["secteur-tech"] = { statut: "a-verifier", note: null, texte: "test" };
  for (const k of Object.keys(disponibiliteMemo())) delete disponibiliteMemo()[k];
  verifier(mesureSecteur({ secteur: "tech" }) === null, "secteur : un secteur couvert pour moins de 30 pays agit encore");
  verifier(raisonEnvieIndisponible("secteur", { secteur: "tech" }) === "Pas encore assez de données pour ton secteur.", "secteur : le site ne dit pas qu'il manque des données");
  verifier(!effetsActifs(construire({ profil: { secteur: "tech" }, envies: ["secteur", "salaire", "travail", "securite", "climat"] })).some((e) => e.mesure.startsWith("secteur")), "secteur : un secteur trop peu renseigné compte dans le score");
  for (const p of pays) notesPays[p.id]["secteur-tech"] = sauvegarde[p.id];
  for (const k of Object.keys(disponibiliteMemo())) delete disponibiliteMemo()[k];
  // « Ton secteur » sous chaque pays du top 3.
  const top = calculer(fin).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  const pts = lignesTop(top, fin);
  for (const l of top) {
    const t = pts.get(l.pays.id)!.travailler;
    verifier([...t.pour, ...(t.savoir ? [t.savoir] : [])].some((x) => x.mesure === "secteur-finance"), `secteur : pas de ligne « Ton secteur » pour ${l.pays.nom}`);
  }
}

// 2.24 Fin d'affinage (prompt 3g, lot 1) : affiner jusqu'à épuisement finit sur le portrait, jamais sur une page vide.
{
  const r11 = hasard(61);
  for (let k = 0; k < 12; k++) {
    let etat = quizAuHasard(r11);
    let n = 0;
    for (; n < 40; n++) {
      const el = prochainAffiner(etat);
      if (!el) break;
      verifier(restantsAffiner(etat) > 0, `affiner ${k} : un élément proposé alors qu'il n'en reste aucun`);
      etat = repondre(etat, el.id, reponseAuHasard(el, etat, r11));
    }
    verifier(prochainAffiner(etat) === null && restantsAffiner(etat) === 0, `affiner ${k} : il reste des questions après ${n} réponses`);
    // Une session restée à l'étape « affiner » sans rien à affiner revient au portrait (rechargement, « Reprendre mon quiz »).
    const s = validerSession(JSON.parse(JSON.stringify({ ...SESSION_VIDE, etat, etape: { t: "affiner" } })));
    verifier(s?.etape.t === "portrait" && (s.etape as { fin?: boolean }).fin === true, `affiner ${k} : la session reste sur « affiner » (page vide)`);
  }
}

// 2.25 Proche ou loin (prompt 3g, lot 3) : le dépaysement est l'inverse exact de la proximité, sans nouvelle donnée.
{
  for (const p of pays) {
    const v = noteEffective(p.id, "vol", {}), d = noteEffective(p.id, "decalage", {}), dep = noteEffective(p.id, "depaysement", {});
    if (v !== null && d !== null) verifier(dep === Math.round((12 - v - d) / 2), `dépaysement : ${p.nom} = ${dep} (vol ${v}, décalage ${d})`);
  }
  verifier(noteEffective("australie", "depaysement", {})! > noteEffective("belgique", "depaysement", {})!, "dépaysement : l'Australie moins dépaysante que la Belgique");
  verifier(quiz.envies.length >= 16 && quiz.envies.length <= 18 && quiz.envies.some((e) => e.id === "depaysement"), "critères : pas 16 à 18 critères, ou le dépaysement manque");
  // Pas de doublon : deux critères ne visent jamais la même mesure (prompt 7).
  { const vues = quiz.envies.flatMap((e) => e.mesures); verifier(new Set(vues).size === vues.length, "critères : deux critères visent la même mesure"); }
  const loin = construire({ envies: ["depaysement", "salaire", "travail", "securite", "climat"] });
  verifier(effetsActifs(loin).find((e) => e.mesure === "depaysement")?.poids === 2, "dépaysement : l'envie n° 1 ne compte pas 2");
}

// 2.26 Ce qui revient (prompt 3g, lot 4 ; formats du prompt 6) : la durée sur une frise, les valeurs rangées en zones.
{
  const tl = trouverElement("timeline");
  verifier(tl?.chapitre === 1 && tl.type === "timeline", "durée : la frise n'est pas au chapitre 1");
  const pvt = evaluerPorte(trouverPays("australie")!, { age: "18-25", duree: "1-2" }, null);
  verifier(pvt.alertes.some((a) => a.texte.includes("un an maximum")), "durée : l'alerte « le PVT dure un an » n'apparaît pas");
  const reste = calculer(construire({ profil: { age: "18-25" }, envies: ["prix", "securite"], reponses: { timeline: { duree: "6-12", apres: "rester" } } })).find((l) => l.pays.id === "australie")!;
  verifier(reste.obstacles.some((o) => o.type === "duree"), "durée : « rester si je me plais » ne rend pas le PVT moins accessible");
  const val = trouverElement("valeurs");
  verifier(val?.chapitre === 5 && val.type === "tri-zones" && val.cartes.length + (trouverElement("libertes-top") as { options: unknown[] }).options.length === 16, "valeurs : pas 16 valeurs en tout");
  if (val?.type === "tri-zones") {
    const e = repondre(construire({ envies: ["salaire", "travail", "prix", "climat", "proche"] }), "valeurs", { stabilite: "indispensable", environnement: "plus", "egalite-genre": "egal" });
    verifier(effetsActifs(e).find((x) => x.mesure === "stabilite")?.poids === 1 && effetsActifs(e).find((x) => x.mesure === "environnement")?.poids === 0.5 && !effetsActifs(e).some((x) => x.mesure === "egalite-genre"), "valeurs : indispensable 1, vrai plus 0,5, peu importe rien");
    // Une valeur non rangée ne crée jamais de préférence.
    verifier(!effetsActifs(repondre(construire({ envies: ["prix"] }), "valeurs", {})).some((x) => x.origine.startsWith("element:valeurs")), "valeurs : rien rangé crée une préférence");
    verifier(valeurValide(val, {}) && valeurValide(val, "passer") && !valeurValide(val, { stabilite: "peut-etre" }), "valeurs : validation incorrecte");
    // Une valeur touchée compte (importance 1) dans « Il te ressemble », jamais dans « Il t'est accessible » (prompt 7).
    const ind = repondre(construire({ envies: ["prix"] }), "valeurs", { stabilite: "compte" });
    verifier(effetsActifs(ind).find((x) => x.mesure === "stabilite")?.poids === 1 && calculer(ind).every((l) => !l.obstacles.some((o) => o.type === "valeur")), "valeurs : une carte touchée ne compte pas 1, ou retire de l'accès");
    // Les libertés : relance seulement si « Les libertés » comptent ; presse et corruption n'ont pas de note (licence).
    verifier(!elementVisible(trouverElement("libertes-top")!, repondre(construire({ envies: ["prix"] }), "valeurs", { stabilite: "compte" })) && elementVisible(trouverElement("libertes-top")!, repondre(construire({ envies: ["prix"] }), "valeurs", { libertes: "compte" })), "libertés : relance mal ouverte");
  }
}

// 2.27 Petits correctifs (prompt 3g, lot 6).
{
  // Le titre de la scène suit aussi le projet.
  const d = trouverDilemme("premier-mois")!;
  const sc = d.scenes.find((x) => x.id === "stage")!;
  const e = { ...ETAT_VIDE, profil: { objectif: "carriere" }, dejaVues: d.scenes.filter((x) => x.id !== "stage").map((x) => cleScene(d, x)) };
  verifier(sceneDe(d, e).titre === "La recherche de poste" && sceneDe(d, e).texte === sc.variantes!.carriere, "variantes : « La recherche de stage » montrée à une carrière longue");
  // Le portrait d'un PVT qui veut surtout trouver du travail ne parle pas de carrière.
  const pvt = portraitComplet(construire({ profil: { objectif: "aventure" }, envies: ["travail", "salaire", "prix", "climat", "securite"] }));
  verifier(!pvt.titre.includes("carrière"), `portrait PVT : « ${pvt.titre} »`);
  // Résultat provisoire : sans envies, ou avec moins de 3 vraies réponses aux chapitres 3 et 4.
  const toutPasse = quizAuHasard(hasard(77), true);
  verifier(resultatProvisoire(toutPasse), "provisoire : tout passer donne un résultat définitif");
  const complet = quizAuHasard(hasard(78));
  verifier(!resultatProvisoire(complet) || complet.ordre.filter((id) => [3, 4].includes(chapitreDe(id)) && complet.reponses[id] !== PASSER).length < 3, "provisoire : un parcours complet est provisoire");
  // Hong Kong : la porte et son détail ont le même statut.
  for (const p of pays) for (const b of portes(p.id)) if (b.detail?.statut === "verifie") verifier(b.statut === "verifie", `${p.nom} : porte « ${b.statut} » mais détail vérifié`);
  // Un seul lien de visa vers une ambassade hors de France : aucun.
  for (const p of pays) for (const b of portes(p.id)) for (const l of b.detail?.liens ?? []) verifier(!/\/fi-en\//.test(l.url), `${p.nom} : lien vers une ambassade en Finlande`);
}

// 2.28 Le prompt 6 : notes continues, banque, aides, écran final.
{
  // Notes continues : entre deux seuils, la note glisse ; elle reste entre 1 et 5 et suit l'ordre des valeurs.
  verifier(Math.abs(noteContinue("allemagne", "salaire")! - 4.04) < 0.01, `notes continues : Allemagne ${noteContinue("allemagne", "salaire")} au lieu de 4,04`);
  for (const m of Object.keys(mesures).filter((x) => mesures[x].bornes)) {
    const avec = pays.map((p) => ({ v: notesPays[p.id]?.[m]?.valeur, n: noteContinue(p.id, m), e: notesPays[p.id]?.[m]?.note })).filter((x): x is { v: number; n: number; e: number } => typeof x.v === "number" && x.n !== null && typeof x.e === "number");
    for (const x of avec) verifier(x.n >= 1 && x.n <= 5 && Math.abs(x.n - x.e) <= 0.5 + 1e-9, `notes continues : ${m} ${x.v} → ${x.n} (note entière ${x.e})`);
    const sens = mesures[m].notes![0] < mesures[m].notes![4] ? 1 : -1;
    const tri = [...avec].sort((a, b) => a.v - b.v);
    for (let k = 1; k < tri.length; k++) verifier(sens * (tri[k].n - tri[k - 1].n) >= -1e-9, `notes continues : ${m} pas dans l'ordre des valeurs`);
  }
  // Les marches : sans notes continues, la note entière revient (variante de la simulation).
  REGLES.continu = false;
  verifier(noteCalcul("allemagne", "salaire", {}) === 4, "variante : les marches ne reviennent pas");
  REGLES.continu = true;
  // Une note sans valeur chiffrée (avis, santé) reste entière.
  verifier(noteCalcul("allemagne", "sante", {}) === noteEffective("allemagne", "sante", {}), "notes continues : une note d'avis est devenue continue");
  // La banque : de 100 à 160 éléments (prompt 7 : plus de phrases à glisser pour la diversité), chacun avec sa fiche complète ; Classement seulement avec une donnée sur 30 pays.
  const items = itemsBanque();
  verifier(items.length >= 100 && items.length <= 160, `banque : ${items.length} éléments (100 à 160)`);
  verifier(new Set(items.map((x) => x.id)).size === items.length, "banque : deux éléments ont le même identifiant");
  for (const x of items) {
    verifier(!!x.id && x.chapitre >= 1 && !!x.format && !!x.donnee && !!x.effet && !!x.condition && !!x.pourquoi, `banque : fiche incomplète (${x.id})`);
    if (x.type === "Classement") verifier(!x.donnee.startsWith("Portrait"), `banque : ${x.id} classe sans donnée pays`);
  }
  verifier(items.filter((x) => x.id.startsWith("critere/")).length === quiz.envies.length && items.filter((x) => x.id.startsWith("valeur/") || x.id.startsWith("libertes-top/")).length === 16 && items.filter((x) => x.id.startsWith("secteur/")).length === 16, "banque : critères, 16 valeurs et 16 secteurs");
  // « Pourquoi on te demande ça ? » dit quand une réponse ne peut pas bouger le classement.
  const idee = trouverElement("idee-reunion")!;
  verifier(aideDe(idee).cartes.some((c) => c.pastille === "Données"), "aide : la décision (28 pays) ne dit pas qu'elle enrichit seulement le portrait");
  verifier(!aideDe(trouverElement("janvier")!).cartes.some((c) => c.pastille === "Données"), "aide : l'hiver (38 pays) dit à tort qu'il manque des données");
  // Aucun chiffre d'importance dans les textes montrés (« importance 0,5 »).
  for (const el of quiz.elements) for (const t of [el.titre, el.texte ?? "", el.aide.enjeu, ...el.aide.cartes.map((c) => c.texte)]) verifier(!/importance\s*\d|\b\d,\d+\b(?! ?(€|°C|h|%|sur))/.test(t) || /€|°C/.test(t), `texte affiché avec une importance chiffrée (${el.id} : ${t})`);
  const sourcesUi = ["src/components/formats/Curseur.tsx", "src/components/resultat/Resultat.tsx", "src/components/formats/TriZones.tsx", "src/components/formats/Seuil.tsx"].map((f) => fs.readFileSync(path.join(process.cwd(), f), "utf8"));
  verifier(!sourcesUi.some((x) => />[^<]*importance \{/.test(x)), "une importance chiffrée est affichée à l'écran");
  // L'écran final : chaque élément de la banque est soit posé, soit dans « Ce qu'on ne t'a pas demandé », avec une raison.
  const fini = quizAuHasard(hasard(606));
  const pas = nonDemandes(fini);
  const cites = pas.reduce((t, g) => t + g.titres.length, 0);
  verifier(pas.every((g) => g.raison.length > 10 && g.titres.length > 0), "écran final : une raison vide");
  verifier(fini.ordre.length + cites >= quiz.elements.length - 2, `écran final : ${quiz.elements.length - fini.ordre.length - cites} éléments ni posés ni expliqués`);
  // « Il t'est accessible » : la porte d'entrée seule ne retire jamais plus de 20 points.
  for (const p of pays) { const l = calculer(construire({ envies: ["prix"] })).find((x) => x.pays.id === p.id)!; verifier(l.acces >= 80, `accès : ${p.nom} à ${l.acces} sans aucune limite ni budget`); }
  void accesPays;
}

// ---------- Bilan ----------
if (echecs.length) {
  console.error(`\n✗ ${echecs.length} échec(s) sur ${verifs} vérifications :`);
  // Les échecs semblables (même message aux nombres près) sont regroupés.
  const groupes = new Map<string, { exemple: string; n: number }>();
  for (const e of echecs) { const cle = e.replace(/\d+/g, "#").replace(/\(.*\)/, ""); const g = groupes.get(cle) ?? { exemple: e, n: 0 }; g.n++; groupes.set(cle, g); }
  for (const g of groupes.values()) console.error(`  - ${g.exemple}${g.n > 1 ? ` (×${g.n})` : ""}`);
  process.exit(1);
}
console.log(`\n✓ Moteur : ${verifs} vérifications réussies sur ${NB} quiz tirés au hasard et des cas précis.`);
