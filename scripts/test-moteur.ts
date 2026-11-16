// Test du moteur de calcul : rejoue des quiz tirés au hasard (toujours les mêmes, graine fixe)
// et vérifie les règles publiées sur /methode.
// Usage : npm run test:moteur
import { notes as notesPays, notesFrance, portes, preuveMesure, quiz, sources, vie } from "@/lib/donnees";
import { validerSession, SESSION_VIDE } from "@/lib/memoire";
import {
  ACCORD_NEUTRE, COUVERTURE_MIN, ETAT_VIDE, MIN_DILEMMES, REGLAGES_DEFAUT, calculer, cleTop3, demarrerDilemmes, dilemmeActif, effetsActifs,
  GROUPES, NIVEAUX, TYPES_VERIFIES, aplatir, faisabilite, fiabiliteDe, visaSimple, avecQui, groupesEgalite, bilanDepartage, causesEcart, comparer, concerne, effetsAjustes, egalites, niveauDeduit, paysCouverts, paysSurprise, evaluerPorte, valeurLisible, portrait, prochainDepartage, separation, prochainDilemme, questionProfilVisible, categorieDe, lignesTop, repondre, repondues, resultatPret, trouverDilemme, valeurFrance,
  type Etat, type Profil,
} from "@/lib/moteur";
import { ECART_EX_AEQUO } from "@/config";
import { DUREE_DEPLACEMENT, DUREE_REVELATION, dureeAnimation, mouvementReduit } from "@/lib/animation";
import { pays, trouverPays } from "@/lib/pays";

// ---------- Hasard reproductible ----------
function hasard(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Alea = () => number;
const choisir = <T,>(r: Alea, l: T[]): T => l[Math.floor(r() * l.length)];

// ---------- Compteur d'échecs ----------
const echecs: string[] = [];
let verifs = 0;
function verifier(ok: boolean, message: string) {
  verifs++;
  if (!ok && echecs.length < 50) echecs.push(message);
  else if (!ok) echecs.push("…");
}

// ---------- Un quiz au hasard ----------
function profilAuHasard(r: Alea): Profil {
  const p: Profil = {};
  for (const q of quiz.profil) {
    if (!questionProfilVisible(q.id, p)) continue;
    if (r() < 0.1) continue; // « Passer »
    if (q.multiple) p[q.id] = q.options.filter(() => r() < 0.2).map((o) => o.id);
    else p[q.id] = choisir(r, q.options).id;
  }
  return p;
}

function quizAuHasard(r: Alea, passerTout = false): Etat {
  const dispo = quiz.priorites.map((x) => x.id);
  const priorites: string[] = [];
  while (priorites.length < 3) {
    const id = choisir(r, dispo);
    if (!priorites.includes(id)) priorites.push(id);
  }
  const sujets = quiz.sujets.filter(() => r() < 0.3).map((s) => s.id);
  let etat = demarrerDilemmes({ ...ETAT_VIDE, profil: profilAuHasard(r), priorites, sujets });
  for (let n = 0; n < 30; n++) {
    const d = prochainDilemme(etat);
    if (!d) break;
    // Un dilemme inactif (mesure notée pour moins de 60 % des pays) n'est jamais proposé.
    verifier(dilemmeActif(d), `dilemme inactif proposé : ${d.id}`);
    const choix = passerTout ? ["passer"] : [...d.options.map((o) => o.id), "passer"];
    etat = repondre(etat, d.id, choisir(r, choix));
    if (!passerTout && resultatPret(etat) && r() < 0.5) break;
  }
  return etat;
}

const budgetDe = (p: Profil) => quiz.profil.find((q) => q.id === "budget")!.options.find((o) => o.id === p.budget)?.euros ?? null;
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
  const suivant = prochainDilemme(etat);
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
  for (const champ of ["age", "budget", "duree", "nationalite-laquelle"]) {
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
  for (const l of lignes) for (const d of l.details) if (d.neutre) verifier(d.accord === ACCORD_NEUTRE && d.origine.startsWith("priorite:"), `quiz ${i} : donnée manquante mal comptée pour ${l.pays.nom} (${d.mesure})`);

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
      verifier(!!d && d.accord >= 0.75 && /^(priorite|objectif|dilemme|sujet|reglage):/.test(d.origine), `quiz ${i} : ${l.pays.nom} a un argument moyen, défavorable ou sans lien avec toi (${a.texte})`);
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
    verifier(surprise.cause === "langue" ? causes.length === 0 : causes.length === 1, `quiz ${i} : pays surprise écarté par plusieurs raisons`);
    verifier(surprise.score >= Math.min(top.length >= 3 ? top[2].score : Infinity, 75) - 1e-9, `quiz ${i} : pays surprise sous le seuil`);
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
  const lignesPortrait = portrait(etat);
  verifier(lignesPortrait.length <= 6, `quiz ${i} : portrait de ${lignesPortrait.length} phrases`);
  verifier(new Set(lignesPortrait.map((l) => l.texte)).size === lignesPortrait.length, `quiz ${i} : phrase répétée dans le portrait`);
  for (const l of lignesPortrait) if (l.revoir.t === "dilemme") verifier(etat.reponses[l.revoir.id] !== "passer" && etat.reponses[l.revoir.id] !== undefined, `quiz ${i} : portrait sur un dilemme passé (${l.revoir.id})`);
  // Portrait : jamais une phrase de dilemme qui répète une priorité déjà citée.
  const mesuresPrio = new Set(etat.priorites.flatMap((id) => quiz.priorites.find((p) => p.id === id)?.mesures ?? []));
  for (const l of lignesPortrait) if (l.revoir.t === "dilemme") {
    const o = trouverDilemme(l.revoir.id)!.options.find((x) => x.id === etat.reponses[(l.revoir as { id: string }).id])!;
    const ms = o.effets.flatMap((e) => e.mesures);
    verifier(!(ms.length > 0 && o.effets.every((e) => e.position === undefined) && ms.every((m) => mesuresPrio.has(m))), `quiz ${i} : le portrait répète une priorité (${l.texte})`);
  }

  // Égalités : dans chaque groupe à égalité, au plus 5 points entre le premier et le dernier.
  const principaux = lignes.filter((l) => !l.ecart);
  const eg = egalites(principaux);
  let debut = -1;
  for (let k = 0; k <= principaux.length; k++) {
    const dansGroupe = k < principaux.length && eg[k] && (debut === -1 || principaux[debut].score - principaux[k].score <= ECART_EX_AEQUO);
    if (dansGroupe && debut === -1) debut = k;
    if (!dansGroupe && debut !== -1) {
      verifier(principaux[debut].score - principaux[k - 1].score <= ECART_EX_AEQUO + 1e-9, `quiz ${i} : égalité sur plus de 5 points`);
      debut = k < principaux.length && eg[k] ? k : -1;
    }
  }
  for (let k = 0; k < principaux.length; k++) if (eg[k]) verifier(!principaux[k].peuDeDonnees, `quiz ${i} : égalité affichée pour un pays sans assez de données`);
  // « À égalité avec… » : toujours dit avec qui, et le partenaire est bien à 5 points ou moins.
  for (let k = 0; k < Math.min(3, principaux.length); k++) {
    const t = avecQui(principaux, k);
    verifier(eg[k] === (t !== null), `quiz ${i} : libellé d'égalité incohérent pour ${principaux[k].pays.nom}`);
    if (t) {
      const autre = principaux.find((x, j) => j !== k && t.includes(x.pays.le));
      verifier(!!autre && Math.abs(autre.score - principaux[k].score) <= 2 * ECART_EX_AEQUO + 1e-9, `quiz ${i} : « ${t} » ne nomme pas un pays proche`);
      if (!/\(n°/.test(t)) verifier(principaux.slice(0, 3).some((x, j) => j !== k && t.includes(x.pays.le)), `quiz ${i} : « ${t} » sans pays du top 3`);
    }
  }
}

verifier(changeAvecObjectif > 0, "le projet ne change le top 3 dans aucun profil");
console.log(`Le projet change le top 3 dans ${changeAvecObjectif} profils sur ${NB} (mêmes réponses, objectif différent).`);

// ---------- 2. Cas précis ----------
// 2.1 L'ancien biais : aventure, 18-25 ans, priorité Salaire. Les pays sans salaire vérifié ne peuvent plus finir à 100 %.
{
  const etat = demarrerDilemmes({ ...ETAT_VIDE, profil: { objectif: "aventure", age: "18-25" }, priorites: ["salaire", "travail", "securite"] });
  for (const l of calculer(etat)) {
    if (l.neutres.includes("salaire")) verifier(l.score < 100, `donnée manquante : ${l.pays.nom} à 100 % sans salaire vérifié`);
  }
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3).map((l) => l.pays.id);
  console.log("Aventure 18-25, priorités salaire, travail, sécurité : top 3 =", top.join(", "));
}

// 2.2 « Passer » ne compte pas : tout passer ne propose jamais le résultat.
{
  const r2 = hasard(42);
  for (let i = 0; i < 20; i++) {
    const etat = quizAuHasard(r2, true);
    verifier(!resultatPret(etat), `passer : résultat proposé après ${etat.ordre.length} dilemmes tous passés`);
  }
  verifier(MIN_DILEMMES === 6, "le minimum de dilemmes n'est plus 6");
}

// 2.3 Fermé à ton âge : jamais dans le top 3, score inchangé, et remontable.
{
  const etat = demarrerDilemmes({ ...ETAT_VIDE, profil: { age: "31-35" }, priorites: ["climat", "proche", "francais"] });
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
  const etat = demarrerDilemmes({ ...ETAT_VIDE, profil: {}, priorites: ["climat", "travail", "securite"] });
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
  const etat: Etat = { ...ETAT_VIDE, priorites: ["travail", "securite", "climat"], reponses: { "deux-offres": "a", promotion: "a" }, ordre: ["deux-offres", "promotion"] };
  const salaire = effetsActifs(etat).filter((e) => e.mesure === "salaire");
  verifier(salaire.length === 1 && salaire[0].poids === 1, `salaire : importance ${salaire.map((e) => e.poids).join("+")} au lieu de 1`);
  verifier(!!trouverDilemme("deux-offres") && !!trouverDilemme("promotion"), "dilemmes du test introuvables");
  // Priorité Bon salaire (2) + réponse salaire (1) + projet carrière (0,5) : importance 2.
  const cumul: Etat = { ...ETAT_VIDE, profil: { objectif: "carriere" }, priorites: ["salaire", "securite", "climat"], reponses: { "deux-offres": "a", promotion: "a", "sortie-ecole": "b" }, ordre: ["deux-offres", "promotion", "sortie-ecole"] };
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
  // D18 « Je préfère pouvoir changer d'employeur » : seul un visa lié à l'employeur (ou inconnu) écarte le pays.
  const etat: Etat = { ...ETAT_VIDE, profil: { age: "36-plus" }, reponses: { "job-de-reve": "b" }, ordre: ["job-de-reve"] };
  const ecarte = (id: string) => concerne("employeur-requis", trouverPays(id)!, etat);
  verifier(!ecarte("chili"), "D18 : le Chili (visa non lié) est écarté");
  verifier(!ecarte("japon") && !ecarte("argentine"), "D18 : un visa en partie lié écarte le pays");
  verifier(ecarte("australie") && ecarte("nouvelle-zelande"), "D18 : un visa lié à l'employeur n'écarte pas le pays");
  verifier(ecarte("etats-unis") && ecarte("mexique"), "D18 : sans donnée (ou « à vérifier »), la règle d'avant ne s'applique plus");
  verifier(!concerne("employeur-requis", trouverPays("australie")!, { ...etat, profil: { age: "18-25" } }), "D18 : un PVT ouvert est écarté");
}

// 2.6 quater Canada : saison 2026 du PVT fermée. Mention affichée, badge et score inchangés.
{
  const porte = evaluerPorte(trouverPays("canada")!, { age: "18-25" }, null);
  verifier(porte.badge === "difficile" && !!porte.mention?.texte.includes("Saison 2026 fermée"), "Canada : la saison fermée n'est pas dite, ou le badge a changé");
  verifier(porte.mention?.preuve?.type === "officiel", "Canada : la saison fermée n'a pas de preuve officielle");
}

// 2.6 quinquies « Je garde ces soirées pour moi » : une pénalité, plus un filtre.
{
  const etat: Etat = { ...ETAT_VIDE, profil: { anglais: "courant" }, priorites: ["salaire", "travail", "securite"], reponses: { "cours-offerts": "b" }, ordre: ["cours-offerts"] };
  const lignes = calculer(etat);
  for (const id of ["japon", "coree-du-sud", "taiwan", "chine"]) verifier(!lignes.find((l) => l.pays.id === id)!.ecart, `cours-offerts B : ${id} est encore écarté`);
  const accord = (id: string) => lignes.find((l) => l.pays.id === id)!.details.find((d) => d.mesure === "apprendre-langue")?.accord;
  verifier(accord("japon") === 0 && accord("espagne") === 0.5 && accord("irlande") === 1, "cours-offerts B : pénalité mal graduée (1 pour une autre écriture, 0,5 pour une autre langue)");
  // Qui parle japonais n'a rien à apprendre au Japon.
  const nippo = calculer({ ...etat, profil: { anglais: "courant", langues: ["ja"] } }).find((l) => l.pays.id === "japon")!;
  verifier(nippo.details.find((d) => d.mesure === "apprendre-langue")?.accord === 1, "cours-offerts B : pénalité alors que tu parles la langue");
}

// 2.7 Session abîmée : toujours refusée, jamais d'erreur.
{
  const mauvaises: unknown[] = [null, {}, [], "texte", 3, { ...SESSION_VIDE, v: 1 }, { ...SESSION_VIDE, etat: null }, { ...SESSION_VIDE, etape: { t: "profil", i: -1 } },
    { ...SESSION_VIDE, etape: { t: "profil", i: "2" } }, { ...SESSION_VIDE, reglages: null }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, sujets: undefined } },
    { ...SESSION_VIDE, etat: { ...ETAT_VIDE, priorites: ["a", "b", "c", "d"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { noel: "d" }, ordre: ["noel"] } }, { ...SESSION_VIDE, etat: { ...ETAT_VIDE, reponses: { emploi: "oui" }, ordre: ["emploi"] } }];
  for (const m of mauvaises) {
    let res: unknown = "erreur";
    try { res = validerSession(m); } catch { res = "erreur"; }
    verifier(res === null, `session abîmée acceptée : ${JSON.stringify(m)?.slice(0, 80)}`);
  }
  verifier(validerSession(JSON.parse(JSON.stringify(SESSION_VIDE))) !== null, "la session vide est refusée");
}

// 2.8 Le projet : poids de départ 0,5, remplacés par une réponse qui va dans un autre sens.
{
  const base: Etat = { ...ETAT_VIDE, profil: { objectif: "aventure" }, priorites: ["securite", "travail", "francais"] };
  const prix = (e: Etat) => effetsActifs(e).find((x) => x.mesure === "prix");
  verifier(prix(base)?.poids === 0.5 && !!prix(base)?.origine.startsWith("objectif:"), "aventure : la vie pas chère n'a pas son poids de départ de 0,5");
  verifier(!effetsActifs(base).some((x) => x.mesure === "salaire"), "aventure : le salaire a reçu un poids de départ");
  const salaire = { ...base, reponses: { "deux-offres": "a" }, ordre: ["deux-offres"] };
  verifier(prix(salaire) === undefined, "aventure + « 3 200 € par mois » : le poids de départ sur les prix n'a pas disparu");
  const loyer = { ...base, reponses: { "deux-offres": "b" }, ordre: ["deux-offres"] };
  verifier(prix(loyer)?.poids === 1, "aventure + « 2 400 € par mois » : la réponse ne l'emporte pas sur le poids de départ");
}

// 2.9 Départage : jamais un dilemme déjà répondu ou inactif, toujours un dilemme qui sépare les deux pays.
{
  const r3 = hasard(7);
  let essais = 0;
  for (let k = 0; k < 60; k++) {
    let etat = quizAuHasard(r3);
    const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 2);
    if (top.length < 2) continue;
    const [a, b] = top.map((l) => l.pays.id);
    const avant = etat;
    for (let n = 0; n < 3; n++) {
      const d = prochainDepartage(etat, a, b);
      if (!d) break;
      essais++;
      verifier(etat.reponses[d.id] === undefined && dilemmeActif(d), `départage : dilemme ${d.id} déjà répondu ou inactif`);
      verifier(separation(d, etat, a, b) > 0, `départage : ${d.id} ne sépare pas ${a} et ${b}`);
      etat = repondre(etat, d.id, d.options[n % d.options.length].id);
    }
    verifier(bilanDepartage(avant, etat, a, b).length > 0, "départage : bilan vide");
  }
  verifier(essais > 0, "départage : aucun dilemme proposé, le test ne prouve rien");
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
  const aides = [...quiz.profil.map((q) => [q.id, q.aide] as const), ...Object.entries(quiz.aides), ...quiz.dilemmes.map((d) => [d.id, d.aide] as const)];
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
      if (/ne recule|ne compte pas plus|Rien ne change|ne fait reculer aucun/.test(texte)) verifier(!agit && !o.ecart, `aide de ${d.id} ${o.id} : « rien ne change » alors que l'option agit`);
      if (o.ecart) verifier(texte.includes("Moins adaptés pour toi"), `aide de ${d.id} ${o.id} : l'écart n'est pas dit`);
    });
  }
}

// 2.12 Pays surprise, curseurs, égalités nommées, valeurs lisibles (prompt 3d).
{
  const r4 = hasard(3);
  let surprises = 0, parLangue = 0, rangsHorsVue = 0;
  for (let k = 0; k < 150; k++) {
    let etat = quizAuHasard(r4);
    if (k % 3 === 0) etat = { ...etat, profil: { ...etat.profil, zone: k % 2 ? "europe" : "hors-europe" } };
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
      verifier(/^Seul ton choix de/.test(s.phrase), "surprise : phrase sans la préférence en cause");
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
  const vieux: Etat = demarrerDilemmes({ ...ETAT_VIDE, profil: { age: "36-plus", zone: "peu-importe" }, priorites: ["prix", "climat", "proche"] });
  const lv = calculer(vieux);
  const sv = paysSurprise(vieux, lv, lv.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3));
  verifier(!sv || causesEcart(sv.ligne.pays, vieux).every((c) => c.cause !== "age"), "surprise : un pays fermé à ton âge proposé");

  // Curseurs : « Compte beaucoup » sur la distance, sans aucune réponse sur la distance, ajoute vol et décalage.
  const sansDistance: Etat = { ...ETAT_VIDE, priorites: ["salaire", "travail", "securite"] };
  verifier(niveauDeduit(effetsActifs(sansDistance), "distance") === 0, "curseur : distance déduite non nulle sans réponse");
  const ajoutes = effetsAjustes(sansDistance, { ...REGLAGES_DEFAUT, niveaux: { distance: 2 } }).filter((e) => e.origine === "reglage:distance");
  verifier(ajoutes.length === 2 && ajoutes.every((e) => e.poids === 1), "curseur : la distance n'ajoute pas vol et décalage (importance 2 en tout)");
  // Priorité « Proche de la France » : niveau déduit 2, et « Compte un peu » divise par 4.
  const proche: Etat = { ...ETAT_VIDE, priorites: ["proche", "travail", "securite"] };
  verifier(niveauDeduit(effetsActifs(proche), "distance") === 2, "curseur : la priorité Proche ne donne pas le niveau 2");
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
  const profils: Profil[] = [{}, { age: "18-25", budget: "1000", objectif: "stage-vie" }, { age: "31-35", budget: "5000", duree: "plus-2" }, { age: "36-plus", objectif: "carriere" },
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
  verifier(f("japon", { age: "18-25", budget: "1000" }).aRemplir.some((x) => x.startsWith("Il te manquerait environ 2")), "faisabilité : le manque d'argent n'est pas dit (Japon, 1 000 €)");
  verifier(f("japon", { age: "18-25", budget: "5000" }).remplies.some((x) => x.includes("Ton budget couvre")), "faisabilité : le budget suffisant n'est pas dit");
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

// ---------- Bilan ----------
if (echecs.length) {
  console.error(`\n✗ ${echecs.length} échec(s) sur ${verifs} vérifications :`);
  for (const e of echecs) console.error("  - " + e);
  process.exit(1);
}
console.log(`\n✓ Moteur : ${verifs} vérifications réussies sur ${NB} quiz tirés au hasard et des cas précis.`);
