// Test du moteur de calcul : rejoue des quiz tirés au hasard (toujours les mêmes, graine fixe)
// et vérifie les règles publiées sur /methode.
// Usage : npm run test:moteur
import { notes as notesPays, portes, quiz, sources } from "@/lib/donnees";
import { validerSession, SESSION_VIDE } from "@/lib/memoire";
import {
  ACCORD_NEUTRE, COUVERTURE_MIN, ETAT_VIDE, MIN_DILEMMES, REGLAGES_DEFAUT, calculer, cleTop3, demarrerDilemmes, dilemmeActif, effetsActifs,
  bilanDepartage, concerne, egalites, paysCouverts, profilTravail, evaluerPorte, portrait, prochainDepartage, separation, prochainDilemme, questionProfilVisible, lignesTop, repondre, repondues, resultatPret, trouverDilemme,
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
    for (const v of Object.values(l.familles)) verifier(v === null || (Number.isFinite(v) && v >= 0 && v <= 100), `quiz ${i} : jauge hors limites pour ${l.pays.nom}`);
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
  const rediges = lignesTop(top, etat);
  const toutes: string[] = [];
  for (const l of top) {
    const { pour, savoir } = rediges.get(l.pays.id)!;
    verifier(pour.length <= 3, `quiz ${i} : ${l.pays.nom} a ${pour.length} lignes « Pour toi »`);
    for (const a of pour) {
      const d = l.details.find((x) => x.mesure === a.mesure && !x.neutre);
      verifier(!!d && d.accord >= 0.75 && /^(priorite|objectif|dilemme):/.test(d.origine), `quiz ${i} : ${l.pays.nom} a un argument moyen, défavorable ou sans lien avec toi (${a.texte})`);
    }
    if (savoir) {
      const d = l.details.find((x) => x.mesure === savoir.mesure && !x.neutre);
      verifier(!!d && d.accord <= 0.5, `quiz ${i} : ${l.pays.nom} « À savoir » n'est pas un point défavorable (${savoir.texte})`);
    }
    toutes.push(...pour.map((a) => a.texte), ...(savoir ? [savoir.texte] : []));
  }
  verifier(new Set(toutes).size === toutes.length, `quiz ${i} : la même phrase sous deux pays du top 3`);

  // Profil de travail : jamais la même phrase « proche de toi sur… » sous les trois pays.
  const style = profilTravail(etat, top);
  if (style && style.comparaisons.length === 3) {
    const phrasesStyle = style.comparaisons.map((c) => `${c.communs.join("+")}|${c.differents.join("+")}`);
    verifier(new Set(phrasesStyle).size > 1, `quiz ${i} : la même phrase de profil de travail sous les trois pays`);
  }

  // Portrait : au plus 6 phrases, jamais une phrase sur un dilemme passé, jamais deux fois la même.
  const lignesPortrait = portrait(etat);
  verifier(lignesPortrait.length <= 6, `quiz ${i} : portrait de ${lignesPortrait.length} phrases`);
  verifier(new Set(lignesPortrait.map((l) => l.texte)).size === lignesPortrait.length, `quiz ${i} : phrase répétée dans le portrait`);
  for (const l of lignesPortrait) if (l.revoir.t === "dilemme") verifier(etat.reponses[l.revoir.id] !== "passer" && etat.reponses[l.revoir.id] !== undefined, `quiz ${i} : portrait sur un dilemme passé (${l.revoir.id})`);

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

// ---------- Bilan ----------
if (echecs.length) {
  console.error(`\n✗ ${echecs.length} échec(s) sur ${verifs} vérifications :`);
  for (const e of echecs) console.error("  - " + e);
  process.exit(1);
}
console.log(`\n✓ Moteur : ${verifs} vérifications réussies sur ${NB} quiz tirés au hasard et des cas précis.`);
