// Test du moteur de calcul : rejoue des quiz tirés au hasard (toujours les mêmes, graine fixe)
// et vérifie les règles publiées sur /methode.
// Usage : npm run test:moteur
import { notes as notesPays, notesFrance, portes, preuveMesure, quiz, sources, trouverElement, vie, type Valeur } from "@/lib/donnees";
import { validerSession, SESSION_VIDE, nouvelleSession, scenesVues } from "@/lib/memoire";
import {
  ACCORD_NEUTRE, COUVERTURE_MIN, ETAT_VIDE, REGLAGES_DEFAUT, calculer, cleTop3, dilemmeActif, effetsActifs, etatDepart, rejouer,
  GROUPES, NIVEAUX, TYPES_VERIFIES, aplatir, faisabilite, fiabiliteDe, visaSimple, avecQui, groupesEgalite, bilanDepartage, causesEcart, comparer, noteEmployeurLibre, PENALITES, effetsAjustes, egalites, niveauDeduit, paysCouverts, paysSurprise, evaluerPorte, valeurLisible, prochainDepartage, separation, categorieDe, lignesTop, repondre, repondues, trouverDilemme, valeurFrance, budgetProfil, MAX_DEPARTAGE, mesuresQuiSeparent, raisonDepartage, encoreEgalite, noteEffective, reponsesDe, optionReponse, effetsActifs as effetsDe, LIBELLE_ECHELLE, sceneDe, cleScene, annulerDerniere, mesureDisponible, enviesDe, poidsRang, limiteTouche,
  type Etat, type Profil,
} from "@/lib/moteur";
import { PASSER, certitudeReponse, dimensionsReponse, effetsReponse, enregistrer, niveauAnglais, profilDe, valeurValide } from "@/lib/elements";
import { chapitreDe, dimensionsElement, elementVisible, importance, scoreElement, phrasesSwipe, prochainElement, questionnaireFini, situationsLimites } from "@/lib/parcours";
import { portrait, portraitComplet } from "@/lib/portrait";
import { construireProfil, contradictions, niveauCertitude } from "@/lib/profil";
import { intuition, zoneDuPays } from "@/lib/intuition";
import { ECART_EX_AEQUO } from "@/config";
import { DUREE_DEPLACEMENT, DUREE_REVELATION, dureeAnimation, mouvementReduit } from "@/lib/animation";
import { pays, trouverPays } from "@/lib/pays";
import { choisir, hasard, parcoursAuHasard, reponseAuHasard, type Alea } from "./hasard";

// ---------- Compteur d'échecs ----------
const echecs: string[] = [];
let verifs = 0;
function verifier(ok: boolean, message: string) {
  verifs++;
  if (!ok && echecs.length < 50) echecs.push(message);
  else if (!ok) echecs.push("…");
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
  if (envies.length) { r.envies = envies; r.classement = envies; }
  Object.assign(r, reponses);
  return rejouer({ ...ETAT_VIDE, reponses: r, ordre: Object.keys(r) });
}

const budgetDe = (p: Profil) => budgetProfil(p);
// Ancienne forme { ...ETAT_VIDE, profil, priorites } → état construit.
const etatDe = (x: { profil?: Profil; priorites?: string[] } & Partial<Etat>) => construire({ profil: (x.profil ?? {}) as Record<string, string>, envies: x.priorites ?? [] });
const scores = (etat: Etat) => Object.fromEntries(calculer(etat).map((l) => [l.pays.id, l.score]));
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

  // Le score ne dépend ni de l'âge, ni du budget, ni de la durée, ni de la nationalité (l'objectif, lui, compte : lot 2).
  // Exception (prompt 3e) : avec « Je préfère pouvoir changer d'employeur librement », l'âge et la nationalité comptent,
  // parce qu'ils décident si un visa te lie à un employeur (PVT ouvert ou fermé, nationalité du pays).
  const limites = (etat.reponses.limites ?? {}) as Record<string, string>;
  const d18 = String(etat.reponses["job-de-reve"] ?? "").endsWith("b") || limites["visa-employeur"] === "eviter";
  for (const champ of d18 ? ["budget", "duree"] : ["age", "budget", "duree", "nationalite-laquelle"]) {
    const q = quiz.profil.find((x) => x.id === champ);
    for (const o of q?.options ?? []) {
      const profil = { ...etat.profil, [champ]: o.id, ...(champ === "nationalite-laquelle" ? { nationalite: "oui" } : {}) };
      verifier(memesScores(base, scores({ ...etat, profil })), `quiz ${i} : le score change avec ${champ} = ${o.id}`);
    }
  }
  // Le budget des curseurs ne change pas les scores non plus.
  verifier(memesScores(base, Object.fromEntries(calculer(etat, { ...REGLAGES_DEFAUT, budget: 0 }).map((l) => [l.pays.id, l.score]))), `quiz ${i} : le score change avec le budget du curseur`);

  // Top 3 déterministe.
  verifier(cleTop3(lignes) === cleTop3(calculer(etat)), `quiz ${i} : top 3 différent d'un calcul à l'autre`);

  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  for (const l of top) {
    verifier(l.couverture >= COUVERTURE_MIN, `quiz ${i} : ${l.pays.nom} dans le top 3 avec ${Math.round(l.couverture * 100)} % de couverture`);
    verifier(l.porte.badge !== "fermee", `quiz ${i} : ${l.pays.nom} « Fermé à ton âge » dans le top 3`);
    verifier(!l.sansDonnees, `quiz ${i} : ${l.pays.nom} sans donnée dans le top 3`);
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
      const d = l.details.find((x) => x.mesure === a.mesure && !x.neutre);
      verifier(!!d && d.accord >= 0.75 && /^(envie|objectif|dilemme|element|limite|reglage):/.test(d.origine), `quiz ${i} : ${l.pays.nom} a un argument moyen, défavorable ou sans lien avec toi (${a.texte})`);
    }
    for (const s of savoir) {
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
    const causes = causesEcart(surprise.ligne.pays, etat);
    verifier(!causes.some((c) => c.cause === "age" || c.cause === "francais"), `quiz ${i} : pays surprise écarté par l'âge ou la langue de travail`);
    verifier(surprise.cause === "limite" ? causes.length === 1 : causes.length === 0, `quiz ${i} : pays surprise écarté par plusieurs raisons`);
    // Prompt 3e : seulement si, sans la préférence en cause, il serait n° 1 ou n° 2.
    verifier(surprise.score >= top[Math.min(1, top.length - 1)].score - 1e-9, `quiz ${i} : pays surprise sous le score du n° 2`);
    if (surprise.ligne.porte.manque !== null) verifier(!!surprise.argent?.startsWith("Il te manquerait"), `quiz ${i} : pays surprise sans le manque d'argent`);
    verifier(!surprise.ligne.peuDeDonnees, `quiz ${i} : pays surprise sans assez de données`);
    // Le budget ne compte jamais : même pays surprise avec un budget nul.
    const sansBudget = paysSurprise(etat, calculer(etat, { ...REGLAGES_DEFAUT, budget: 0 }), top);
    verifier(sansBudget?.ligne.pays.id === surprise.ligne.pays.id, `quiz ${i} : le budget change le pays surprise`);
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
    verifier(repondues(etat) <= 2, `passer : ${repondues(etat)} réponses comptées alors que tout est passé`);
    verifier(questionnaireFini(etat), "passer : le questionnaire ne finit pas");
    verifier(etat.ordre.length >= 18, `passer : ${etat.ordre.length} écrans seulement`);
  }
}

// 2.3 Fermé à ton âge : jamais dans le top 3, score inchangé, et remontable.
{
  const etat = etatDe({ ...ETAT_VIDE, profil: { age: "31-35" }, priorites: ["climat", "proche", "francais"] });
  const lignes = calculer(etat);
  const fermes = lignes.filter((l) => l.porte.badge === "fermee");
  verifier(fermes.length > 0, "31-35 ans : aucun pays fermé, le test ne prouve rien");
  for (const l of fermes) verifier(!!l.ecart, `${l.pays.nom} fermé mais pas dans « Moins adaptés »`);
  const jeune = calculer({ ...etat, profil: { age: "18-25" } });
  for (const l of fermes) verifier(Math.abs(jeune.find((x) => x.pays.id === l.pays.id)!.score - l.score) < 1e-9, `${l.pays.nom} : score changé par la fermeture`);
  const remonte = calculer({ ...etat, remontes: [fermes[0].pays.id] }).find((l) => l.pays.id === fermes[0].pays.id)!;
  verifier(!remonte.ecart, "un pays fermé remonté reste dans « Moins adaptés »");
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
  const etat: Etat = construire({ envies: ["travail", "securite", "climat"], reponses: { "deux-offres": "a", promotion: "a" } });
  const salaire = effetsActifs(etat).filter((e) => e.mesure === "salaire");
  verifier(salaire.length === 1 && salaire[0].poids === 1, `salaire : importance ${salaire.map((e) => e.poids).join("+")} au lieu de 1`);
  verifier(!!trouverDilemme("deux-offres") && !!trouverDilemme("promotion"), "dilemmes du test introuvables");
  // Envie Bon salaire classée n° 1 (2) + réponse salaire (1) + projet carrière (0,5) : importance 2.
  const cumul: Etat = construire({ profil: { objectif: "carriere" }, envies: ["salaire", "securite", "climat"], reponses: { "deux-offres": "a", promotion: "a", "sortie-ecole": "b" } });
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
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { envies: ["salaire", "prix"] }, ordre: ["envies"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { phrases: { S1: "peut-etre" } }, ordre: ["phrases"] } },
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
  const salaire = construire({ profil: { objectif: "aventure" }, envies: ["securite", "travail", "francais"], reponses: { "deux-offres": "a" } });
  verifier(prix(salaire) === undefined, "aventure + « 3 200 € par mois » : le poids de départ sur les prix n'a pas disparu");
  const loyer = construire({ profil: { objectif: "aventure" }, envies: ["securite", "travail", "francais"], reponses: { "deux-offres": "b" } });
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
  // Deux pays avec la même couverture santé : jamais le dilemme de la santé.
  const sante = trouverDilemme("poignet")!;
  verifier(mesuresQuiSeparent(sante, ETAT_VIDE, "allemagne", "belgique").length === 0, "départage : la santé sépare l'Allemagne et la Belgique");
  // Comparaison : une donnée manquante d'un côté donne « Non comparable » (null), jamais une égalité.
  const ea: Etat = construire({ envies: ["salaire", "travail", "securite"] });
  const lc = calculer(ea);
  const c = comparer(lc.find((l) => l.pays.id === "allemagne")!, lc.find((l) => l.pays.id === "belgique")!, ea);
  verifier(c.lignes.find((x) => x.mesure === "salaire")?.ecart === null, "comparaison : salaire manquant pour l'Allemagne, mais pas « Non comparable »");
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
  verifier(peu.length === 2 && peu.every((e) => Math.abs(e.poids - 0.25) < 1e-9), "curseur : « Compte un peu » mal appliqué à la priorité Proche");
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
  // Fiabilité : « Notre avis » ne compte pas comme une donnée vérifiée ; seuils 90 % et 60 %.
  const avisSeul = fiabiliteDe("allemagne", ["hierarchie"], {});
  verifier(sources[notesPays.allemagne.hierarchie.source!].type === "notre-avis" && avisSeul.verifies === 0 && avisSeul.niveau === "faible", "fiabilité : « Notre avis » compté comme vérifié");
  const ouvertes = fiabiliteDe("pays-bas", ["emploi", "salaire", "securite", "vol", "decalage", "hiver", "ete", "doux", "prix", "air"], {});
  verifier(ouvertes.niveau === "complete" && ouvertes.verifies === 10, "fiabilité : 10 données ouvertes sur 10 ne donnent pas « Données complètes »");
  const partielle = fiabiliteDe("pays-bas", ["emploi", "salaire", "securite", "vol", "decalage", "hiver", "ete", "hierarchie", "communication", "ponctualite"], {});
  verifier(partielle.niveau === "partielle", `fiabilité : 7 sur 10 donne ${partielle.niveau}`);
  verifier(fiabiliteDe("japon", ["langue"], { langues: ["ja"] }).verifies === 1, "fiabilité : la langue que tu parles ne compte pas");
  for (const p of pays) for (const m of Object.keys(notesPays[p.id])) {
    const n = notesPays[p.id][m];
    const f = fiabiliteDe(p.id, [m], {});
    verifier(f.verifies === (n.statut === "verifie" && n.note !== null && !!n.source && TYPES_VERIFIES.includes(sources[n.source].type) ? 1 : 0), `fiabilité : ${m} mal compté pour ${p.nom}`);
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
  verifier(f("suisse", {}).aRemplir.some((x) => x.includes("permis de séjour")), "faisabilité : la Suisse sans le permis de séjour");
  // Budget en tranches (lot 5) : « au moins » sous la tranche, « pourrait » dans la tranche, « couvre » au-dessus.
  verifier(f("japon", { age: "18-25", budget: "moins-2000" }).aRemplir.some((x) => x.startsWith("Il te manquerait au moins 1 100")), "faisabilité : le manque d'argent n'est pas dit (Japon, moins de 2 000 €)");
  verifier(f("japon", { age: "18-25", budget: "2000-5000" }).aVerifier.some((x) => x.startsWith("Selon ta somme exacte, il pourrait te manquer jusqu’à 1 100")), "faisabilité : le manque possible n'est pas dit (Japon, 2 000 à 5 000 €)");
  verifier(f("japon", { age: "18-25", budget: "5000-10000" }).remplies.some((x) => x.includes("Ton budget couvre")), "faisabilité : le budget suffisant n'est pas dit");
  verifier(evaluerPorte(trouverPays("japon")!, { age: "18-25", budget: "inconnu" }, budgetProfil({ budget: "inconnu" })).alertes.some((a) => a.texte.startsWith("Ce PVT demande 3")), "budget inconnu : la somme demandée n'est pas dite");
  verifier(evaluerPorte(trouverPays("japon")!, { age: "18-25" }, { min: 2500, max: 2500 }).alertes.some((a) => a.texte.startsWith("Il te manquerait environ 600")), "curseur : somme exacte mal dite");
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

// 2.15 Fiabilité des données (prompt 3e, lot 1).
{
  // Salaire : années comparables (au plus un an d'écart avec l'année médiane), libellé honnête.
  const ans = pays.map((p) => notesPays[p.id].salaire).map((n) => Number(n.annee ?? n.ancien?.annee)).filter(Number.isFinite).sort((a, b) => a - b);
  const mediane = ans[Math.floor((ans.length - 1) / 2)];
  for (const p of pays) {
    const n = notesPays[p.id].salaire;
    if (n.statut === "verifie") verifier(Math.abs(Number(n.annee) - mediane) <= 1, `salaire : ${p.nom} compté avec une donnée de ${n.annee} (médiane ${mediane})`);
    if (n.statut === "verifie") verifier(n.texte.includes("brut") && n.texte.includes("avant impôts"), `salaire : ${p.nom} sans « brut, avant impôts »`);
  }
  verifier(paysCouverts("salaire") >= 0.6 * pays.length, `salaire : seulement ${paysCouverts("salaire")} pays notés, les dilemmes du salaire ne seraient plus posés`);
  verifier(!!preuveMesure("belgique", "salaire").avertissement?.includes("avant impôts"), "salaire : la preuve ne dit pas « avant impôts »");
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
    verifier(d.options.length === 2, `${d.id} : ${d.options.length} options au lieu de 2`);
    verifier(d.scenes.length >= 1, `${d.id} : aucune scène`);
    for (const sc of d.scenes) {
      verifier(sc.options.length === d.options.length, `${d.id}/${sc.id} : pas autant d'options que le dilemme`);
      for (const o of sc.options) verifier(!!o.texte && !!o.plus && !!o.moins, `${d.id}/${sc.id} : une option sans avantage ou sans prix`);
    }
    // Les dilemmes de culture au travail gardent 2 options : jamais d'échelle.
    if (d.theme === "Culture au travail") verifier(!d.echelle, `${d.id} : la culture au travail ne doit pas être en échelle`);
  }
  for (const id of ["deux-offres", "promotion", "sortie-ecole", "noel", "janvier", "aout", "appartement", "nuit"]) verifier(!!trouverDilemme(id)?.echelle, `${id} : pas en échelle`);
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
  const peu: Etat = construire({ envies: ["securite", "climat", "proche"], reponses: { "deux-offres": "peu-a" } });
  verifier(effetsDe(peu).find((e) => e.mesure === "salaire")?.poids === 0.5, "« Un peu A » ne donne pas l'importance 0,5");
  // Une session avec une réponse graduée est acceptée, une réponse inconnue refusée.
  verifier(validerSession({ ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { "deux-offres": "peu-b" }, ordre: ["deux-offres"], historique: [] } }) !== null, "session : « peu-b » refusé");
  verifier(validerSession({ ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { "reunion-9h": "peu-a" }, ordre: ["reunion-9h"], historique: [] } }) === null, "session : « peu-a » accepté sur un dilemme de culture");
}

// 2.17 Une banque de scènes plus grande (prompt 3e, lot 3).
{
  // 3 scènes par dilemme, identifiants uniques ; nouvelles mesures notées pour au moins 60 % des pays.
  for (const d of quiz.dilemmes) {
    verifier(d.scenes.length === 3, `${d.id} : ${d.scenes.length} scènes au lieu de 3`);
    verifier(new Set(d.scenes.map((x) => x.id)).size === d.scenes.length, `${d.id} : deux scènes avec le même identifiant`);
    verifier(dilemmeActif(d), `${d.id} : dilemme inactif`);
  }
  verifier(quiz.dilemmes.reduce((n, d) => n + d.scenes.length, 0) >= 50, "moins de 50 scènes");
  for (const m of ["anglais", "doux", "air", "manger-sain"]) {
    verifier(mesureDisponible(m) && paysCouverts(m) >= 0.6 * pays.length, `${m} : pas assez de pays notés`);
    verifier(quiz.dilemmes.some((d) => d.options.some((o) => o.effets.some((e) => e.mesures.includes(m)))), `${m} : aucun dilemme`);
  }
  verifier(sources["oms-gho"]?.licence.includes("NC"), "OMS : la licence non commerciale n'est pas dite");
  // Scène : la même pour la même graine (retour, rechargement), jamais une scène déjà vue s'il en reste.
  const r5 = hasard(99);
  let differentes = 0;
  for (let k = 0; k < 200; k++) {
    const d = choisir(r5, quiz.dilemmes);
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
  for (const t of ["choix-cartes", "classement", "curseur", "swipe", "ambiances", "thermometre", "carte-monde", "tri-limites", "dilemme"]) verifier(vus.has(t), `format ${t} : jamais proposé`);
  // Classement des envies : rang 1 = 2 ; 2 = 1,75 ; 3 = 1,5 ; 4 = 1,25 ; 5 = 1,1.
  verifier([0, 1, 2, 3, 4].map(poidsRang).join() === "2,1.75,1.5,1.25,1.1", "envies : poids des rangs incorrects");
  const cinq = ["securite", "salaire", "prix", "travail", "climat"];
  const e5 = construire({ envies: cinq });
  verifier(enviesDe(e5).join() === cinq.join(), "envies : l'ordre du classement n'est pas lu");
  const poidsDe = (e: Etat, m: string) => effetsActifs(e).find((x) => x.mesure === m)?.poids;
  verifier(poidsDe(e5, "securite") === 2 && poidsDe(e5, "salaire") === 1.75 && poidsDe(e5, "prix") === 1.5 && poidsDe(e5, "emploi") === 1.25 && poidsDe(e5, "doux") === 1.1, "envies : importances du classement mal appliquées");
  const proche = construire({ envies: ["proche", "salaire", "prix", "travail", "climat"] });
  verifier(poidsDe(proche, "vol") === 1 && poidsDe(proche, "decalage") === 1, "envies : « Proche de la France » n° 1 ne partage pas 2 entre vol et décalage");
  // Classement passé : l'ordre du choix des envies sert de classement.
  const sansClassement = rejouer({ ...ETAT_VIDE, reponses: { envies: cinq, classement: PASSER }, ordre: ["envies", "classement"] });
  verifier(enviesDe(sansClassement).join() === cinq.join(), "envies : classement passé mal lu");
  // La carte du monde n'a aucun effet sur le score.
  const avecCarte = repondre(e5, "carte", ["asie-est", "oceanie"]);
  verifier(memesScores(scores(e5), scores(avecCarte)) && effetsActifs(avecCarte).length === effetsActifs(e5).length, "carte : elle change le score");
  // Curseur : continu, 0 = temps libre seulement, 100 = salaire seulement, 50 = les deux à 0,5.
  const curseur = (v: number) => effetsActifs(repondre(construire({ envies: ["securite", "prix", "travail", "climat", "francais"] }), "equilibre", v));
  verifier(curseur(0).find((e) => e.mesure === "heures")?.poids === 1 && !curseur(0).some((e) => e.mesure === "salaire"), "curseur : 0 ne donne pas le temps libre seul");
  verifier(curseur(100).find((e) => e.mesure === "salaire")?.poids === 1 && !curseur(100).some((e) => e.mesure === "heures"), "curseur : 100 ne donne pas le salaire seul");
  verifier(curseur(50).find((e) => e.mesure === "salaire")?.poids === 0.5 && curseur(50).find((e) => e.mesure === "heures")?.poids === 0.5, "curseur : 50 ne donne pas 0,5 et 0,5");
  verifier(Math.abs((curseur(70).find((e) => e.mesure === "salaire")?.poids ?? 0) - 0.7) < 1e-9, "curseur : pas continu");
  // Swipe : « Ça dépend » ne compte pas ; « Pas vraiment » sur S3 met le coût de la vie.
  const sw = (x: Record<string, string>) => effetsActifs(repondre(construire({ envies: ["securite", "travail", "climat", "francais", "equilibre"] }), "phrases", x));
  verifier(sw({ S3: "depend", S7: "depend" }).length === sw({}).length, "swipe : « Ça dépend » compte");
  verifier(sw({ S3: "non" }).some((e) => e.mesure === "prix") && sw({ S3: "oui" }).some((e) => e.mesure === "salaire"), "swipe : S3 mal traduit");
  verifier(sw({ S13: "oui" }).find((e) => e.mesure === "decision")?.position === 1, "swipe : S13 ne vise pas la décision rapide");
  // Ambiances : 2 au plus, chacune son effet.
  const amb = effetsActifs(repondre(e5, "ambiances", ["nature", "soleil"]));
  verifier(amb.some((e) => e.mesure === "nature") && amb.some((e) => e.mesure === "ete" && e.position === 4), "ambiances : effets manquants");
  verifier(!valeurValide(trouverElement("ambiances")!, ["nature", "soleil", "metropole"]), "ambiances : 3 choix acceptés");
  // Thermomètres : la moyenne donne le niveau d'anglais (1 à 2 débutant, 3 moyen, 4 à 5 courant).
  verifier(niveauAnglais({ "anglais-reunion": 1, "anglais-vie": 2 }) === "debutant" && niveauAnglais({ "anglais-reunion": 2, "anglais-vie": 3 }) === "moyen" && niveauAnglais({ "anglais-reunion": 3, "anglais-vie": 4 }) === "courant" && niveauAnglais({ "anglais-reunion": 4 }) === "courant", "thermomètres : niveau d'anglais mal déduit");
  verifier(profilDe({ "anglais-reunion": 1, "anglais-vie": 1 }).anglais === "debutant" && elementVisible(trouverElement("pret-anglais")!, construire({ profil: { anglais: "debutant" } })), "thermomètres : la question « Travailler en anglais » n'apparaît pas pour un débutant");
  verifier(!elementVisible(trouverElement("pret-anglais")!, construire({ profil: { anglais: "debutant", langues: ["es"] } })), "thermomètres : la question apparaît alors qu'une autre langue est parlée");
  // Tri des limites : « Je préfère éviter » = pénalité de poids 1 ; « Rédhibitoire » = « Moins adaptés », avec « Le remonter ».
  const lim = repondre(e5, "limites", { "hors-europe": "redhibitoire", "vol-10h": "eviter" });
  const ll = calculer(lim);
  for (const l of ll) {
    if (l.pays.zone !== "europe") verifier(!!l.ecart && causesEcart(l.pays, lim).some((c) => c.cause === "limite" && c.limite === "hors-europe"), `limites : ${l.pays.nom} pas écarté par « Vivre hors d’Europe »`);
    else verifier(!l.ecart || causesEcart(l.pays, lim).every((c) => c.limite !== "hors-europe"), `limites : ${l.pays.nom} écarté à tort`);
  }
  verifier(effetsActifs(lim).find((e) => e.mesure === "vol")?.poids === 1 && effetsActifs(lim).find((e) => e.mesure === "vol")?.origine === "limite:vol-10h", "limites : « Je préfère éviter » n'est pas une pénalité de poids 1");
  const remonte = calculer({ ...lim, remontes: ["japon"] }).find((l) => l.pays.id === "japon")!;
  verifier(!remonte.ecart, "limites : « Le remonter » ne marche pas");
  verifier(limiteTouche("alphabet", "japon", {}) && !limiteTouche("alphabet", "japon", { langues: ["ja"] }) && !limiteTouche("alphabet", "espagne", {}), "limites : l'autre alphabet mal détecté");
  verifier(!limiteTouche("vol-10h", "maroc", {}) && limiteTouche("vol-10h", "australie", {}), "limites : plus de 10 h de vol mal détecté");
  // 6 situations sur 8, toujours les mêmes pour le même état ; la série de phrases : 5 sur 15.
  const tri = trouverElement("limites");
  if (tri?.type === "tri-limites") verifier(situationsLimites(tri, e5).length === 6 && situationsLimites(tri, e5).map((x) => x.id).join() === situationsLimites(tri, { ...e5 }).map((x) => x.id).join(), "limites : pas 6 situations stables");
  const phr = trouverElement("phrases");
  if (phr?.type === "swipe") verifier(phrasesSwipe(phr, e5).length === 5 && new Set(phrasesSwipe(phr, e5).map((x) => x.id)).size === 5, "swipe : pas 5 phrases différentes");
  // Certitude : « Plutôt » est forte, « Un peu » moyenne ; un curseur au milieu est faible.
  verifier(certitudeReponse(trouverDilemme("noel")!, "a") === "forte" && certitudeReponse(trouverDilemme("noel")!, "peu-a") === "moyenne" && certitudeReponse(trouverElement("equilibre")!, 50) === "faible", "certitude mal calculée");
  verifier(dimensionsReponse(trouverElement("phrases")!, { S3: "oui", S7: "depend" }).join() === "cout,salaire", "swipe : dimensions touchées incorrectes");
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
    for (const el of quiz.elements.filter((x) => [1, 2, 5].includes(x.chapitre))) {
      if (elementVisible(el, etat) && etat.reponses[el.id] === undefined) verifier(false, `parcours ${k} : ${el.id} (chapitre ${el.chapitre}) jamais posé`);
    }
    verifier(!etat.ordre.includes("zone"), "la question de la zone existe encore");
  }
  // Variantes de texte selon le projet : au moins 10 dilemmes, et elles sont utilisées.
  const avecVariantes = quiz.dilemmes.filter((d) => d.scenes.some((sc) => sc.variantes && Object.keys(sc.variantes).length));
  verifier(avecVariantes.length >= 10, `variantes : seulement ${avecVariantes.length} dilemmes`);
  for (const d of avecVariantes) for (const sc of d.scenes) for (const [projet, texte] of Object.entries(sc.variantes ?? {})) {
    verifier(Object.keys(quiz.objectifs).includes(projet), `variantes : projet inconnu ${projet} (${d.id})`);
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
  verifier(memesScores(scores(base), scores(repondre(base, "carte", ["oceanie"]))), "intuition : la carte change le score");
}

// 2.21 Profil et contradictions (prompt 3f, lot 3).
{
  const e = (reponses: Record<string, Valeur>, envies = ["prix", "securite", "proche", "travail", "climat"]) => construire({ envies, reponses });
  const ids = (x: Etat) => contradictions(x).map((c) => c.id);
  // Jamais de contradiction avec une seule réponse : chaque règle a besoin de ses deux côtés.
  verifier(!ids(e({ "deux-offres": "a" })).includes("prix"), "contradiction « prix » avec une seule réponse chère");
  verifier(ids(e({ "deux-offres": "a", phrases: { S3: "oui" } })).includes("prix"), "contradiction « prix » non vue avec deux réponses chères");
  verifier(!ids(e({ "deux-offres": "a", phrases: { S3: "oui" } }, ["securite", "travail", "climat", "prix", "proche"])).includes("prix"), "contradiction « prix » alors que la vie pas chère n'est que n° 4");
  verifier(!ids(e({ noel: "peu-b" })).includes("proche") && ids(e({ noel: "b" })).includes("proche"), "contradiction « proche » : « Un peu » ne doit pas suffire, « Plutôt » oui");
  verifier(!ids(e({}, ["climat", "travail", "prix", "proche", "francais"])).length, "contradiction sans réponse opposée");
  verifier(ids(e({ phrases: { S11: "oui" } })).includes("securite") && !ids(e({ phrases: { S11: "non" } })).includes("securite"), "contradiction « sécurité » mal vue");
  verifier(ids(e({ equilibre: 10 }, ["salaire", "travail", "prix", "proche", "climat"])).includes("salaire") && !ids(e({ equilibre: 40 }, ["salaire", "travail", "prix", "proche", "climat"])).includes("salaire"), "contradiction « salaire » mal vue");
  verifier(ids(e({ carte: ["asie-est"], limites: { "hors-europe": "redhibitoire" } })).includes("europe") && !ids(e({ carte: ["asie-est", "europe"], limites: { "hors-europe": "redhibitoire" } })).includes("europe"), "contradiction « Europe » mal vue");
  verifier(!ids(e({ limites: { "hors-europe": "redhibitoire" } })).includes("europe"), "contradiction « Europe » sans carte");
  // Certitude : une envie seule = moyenne ; envie + réponse qui va dans le même sens = forte ; deux réponses opposées baissent d'un cran.
  verifier(construireProfil(e({}))["cout"].certitude === "moyenne", "certitude : une envie seule n'est pas moyenne");
  verifier(construireProfil(e({ "deux-offres": "b" }))["cout"].certitude === "forte", "certitude : envie confirmée n'est pas forte");
  const opposes = construireProfil(e({ "deux-offres": "a", phrases: { S3: "oui" } }))["cout"];
  verifier(!opposes.coherente, "certitude : envie « Vie pas chère » et deux choix chers ne sont pas incohérents");
  verifier(construireProfil(e({}))["climat"].declare.includes("envie:climat") && construireProfil(e({ janvier: "a" }))["climat"].deduit.includes("janvier"), "profil : sources déclarées et déduites mal rangées");
  verifier(niveauCertitude([]).certitude === "faible", "certitude : rien = faible");
  // « Déjà couvert par » : « La promotion » n'est posée après le curseur que si la certitude reste faible.
  const promo = trouverElement("promotion")!;
  verifier(!elementVisible(promo, construire({ envies: ["salaire", "equilibre", "travail", "prix", "climat"], reponses: { equilibre: 90 } })), "« La promotion » reposée alors que le salaire et l'équilibre sont sûrs");
  verifier(elementVisible(promo, construire({ envies: ["securite", "travail", "prix", "climat", "proche"], reponses: { equilibre: 50 } })), "« La promotion » non reposée alors que la certitude reste faible");
  // Portrait : un titre, jamais « Tu es », « Ce qu'on va chercher pour toi » = 3 critères.
  const p = portraitComplet(e({ "deux-offres": "a", phrases: { S3: "oui" }, noel: "b" }));
  verifier(p.titre.startsWith("Tu cherches") && p.cherche.length === 3 && !!p.contradiction, "portrait : titre, critères ou contradiction absents");
}

// 2.22 Un questionnaire adapté à chacun (prompt 3f, lot 4).
{
  const r9 = hasard(49);
  for (let k = 0; k < 120; k++) {
    const etat = quizAuHasard(r9);
    verifier(etat.ordre.length >= 18, `adaptatif ${k} : ${etat.ordre.length} écrans (18 au moins)`);
    for (const c of [3, 4]) {
      const ids = etat.ordre.filter((id) => chapitreDe(id) === c);
      verifier(ids.length >= 4 && ids.length <= 7, `adaptatif ${k} : chapitre ${c} de ${ids.length} écrans`);
      // Jamais deux éléments de suite sur la même dimension ; jamais 4 fois de suite le même format.
      for (let i = 1; i < ids.length; i++) {
        const avant = dimensionsElement(trouverElement(ids[i - 1])!, etat), apres = dimensionsElement(trouverElement(ids[i])!, etat);
        verifier(!avant.some((d) => apres.includes(d)), `adaptatif ${k} : ${ids[i - 1]} puis ${ids[i]} sur la même dimension`);
      }
      const types = ids.map((id) => trouverElement(id)!.type);
      for (let i = 3; i < types.length; i++) verifier(new Set(types.slice(i - 3, i + 1)).size > 1, `adaptatif ${k} : 4 fois le format ${types[i]} de suite (chapitre ${c})`);
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
        verifier(scoreElement(el, etat, top) > 0 && autres.includes(el), `tirage : ${el.id} hors des candidats`);
      }
      etat = repondre(etat, el.id, reponseAuHasard(el, etat, r10));
    }
  }
  // Importance : l'envie n° 1 compte plus que le projet, qui compte plus que rien.
  const e1 = construire({ profil: { objectif: "aventure" }, envies: ["salaire", "securite", "proche", "travail", "francais"] });
  verifier(importance("salaire", e1) === 3 && importance("cout", e1) === 1.5 && importance("hierarchie", e1) === 1, "importance : envie, projet et rien mal comptés");
}

// ---------- Bilan ----------
if (echecs.length) {
  console.error(`\n✗ ${echecs.length} échec(s) sur ${verifs} vérifications :`);
  for (const e of echecs) console.error("  - " + e);
  process.exit(1);
}
console.log(`\n✓ Moteur : ${verifs} vérifications réussies sur ${NB} quiz tirés au hasard et des cas précis.`);
