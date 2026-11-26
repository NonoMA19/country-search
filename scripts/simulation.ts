// Simulation : 5 000 parcours tirés au hasard (graine fixe, toujours les mêmes).
// Elle mesure les biais du classement (n° 1 et top 3), l'effet du projet, la durée en écrans,
// la diversité des parcours, les formats vus, et rejoue les profils types.
// Usage : npm run simulation   (ou : npm run simulation -- 1000 pour moins de parcours)
import { quiz, trouverElement, type Element } from "@/lib/donnees";
import { PASSER } from "@/lib/elements";
import { LIBELLE_FIABILITE, REGLES, topSansRegle, calculer, repondre, cleTop3, mesureClassante, noteContinue, paysCouverts, paysSurprise, sceneDe, type Etat, type Ligne, type NiveauFiabilite } from "@/lib/moteur";
import { mesures, notes } from "@/lib/donnees";
import { chapitreDe, estAdaptatif, etatAvant, nombreEcrans, phrasesSwipe, prochainAffiner, questionnaireFini, restantsAffiner } from "@/lib/parcours";
import { SESSION_VIDE, validerSession } from "@/lib/memoire";
import { pays } from "@/lib/pays";
import { PROFILS_FIXES, PROFILS_TYPES, repondeurFixe } from "./profils";
import { choisir, hasard, parcoursAuHasard, reponseAuHasard } from "./hasard";

const NB = Number(process.argv[2] ?? 5000);
const pct = (n: number, d = NB) => `${((100 * n) / Math.max(1, d)).toFixed(1).replace(".", ",")} %`;
const nombre = (x: number, dec = 1) => x.toFixed(dec).replace(".", ",");
const top3 = (e: Etat) => calculer(e).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
const EUROPE = new Set(pays.filter((p) => p.zone === "europe").map((p) => p.id));
// Le n° 1 avec une règle changée, mêmes réponses (une copie de l'état : les calculs mis en mémoire ne servent pas).
function n1Avec(e: Etat, regles: Partial<typeof REGLES>): Ligne | undefined {
  const avant = { ...REGLES };
  Object.assign(REGLES, regles);
  try { return calculer({ ...e }).find((l) => !l.ecart && !l.peuDeDonnees); } finally { Object.assign(REGLES, avant); }
}

// La clé d'un écran pour comparer deux parcours : l'élément, et la scène montrée pour un dilemme.
const cleEcran = (id: string, e: Etat) => {
  const el = trouverElement(id);
  return el?.type === "dilemme" ? `${id}/${sceneDe(el, e).id}` : id;
};

// ---------- 1. Répartition, projet, sensibilité, surprise, fiabilité ----------
const r = hasard(20261115);
const enN1: Record<string, number> = {}, enTop3: Record<string, number> = {};
const objectifs = (trouverElement("objectif") as Element & { options: { id: string }[] }).options.map((o) => o.id);
let changeAvecObjectif = 0;
const posee: Record<string, number> = {}, sensible: Record<string, number> = {};
const surprises: Record<string, number> = {};
const fiab: Record<NiveauFiabilite, number> = { complete: 0, partielle: 0, faible: 0 };
const ecrans: number[] = [];
let topChange = 0; const ecartesRegle: Record<string, number> = {};
const parcoursListe: Etat[] = [];
const formats: Record<string, number> = {};
const debut3: Record<string, number> = {}, debut4: Record<string, number> = {};

// Les variantes : chaque règle retirée seule (mêmes réponses).
const VARIANTES: [string, Partial<typeof REGLES>][] = [
  ["seuils en marches (sans notes continues)", { continu: false }],
  ["sans la règle des 30 pays", { seuilPays: 0 }],
  ["sans la règle des 30 pays, seuils en marches (le salaire compte, comme avant)", { seuilPays: 0, continu: false }],
  ["accès pesant 0,3 (avant le prompt 7)", { poidsAcces: 0.3 }],
  ["sans l'exception des critères essentiels (le salaire ne compte plus)", { essentiels: false }],
  ["sans « Il t'est accessible » dans le classement", { poidsAcces: 0 }],
];
const n1Variantes: Record<string, Record<string, number>> = {};
const porteurs: Record<string, number> = {};
let nbN1Europe = 0, parAcces = 0;
const bloques = { europe: 0, ailleurs: 0 }, neutres = { europe: 0, ailleurs: 0 }, vus = { europe: 0, ailleurs: 0 };
for (let i = 0; i < NB; i++) {
  const etat = parcoursAuHasard(r);
  parcoursListe.push(etat);
  ecrans.push(nombreEcrans(etat));
  const top = top3(etat);
  for (const l of top) fiab[l.fiabilite.niveau]++;
  // La règle des 3 premières envies : le top 3 change-t-il, et quels pays écarte-t-elle ?
  const sans = topSansRegle(calculer(etat));
  if (sans.map((l) => l.pays.id).join() !== top.map((l) => l.pays.id).join()) topChange++;
  for (const l of sans) if (!top.some((t) => t.pays.id === l.pays.id) && l.manquePrincipal.length) ecartesRegle[l.pays.nom] = (ecartesRegle[l.pays.nom] ?? 0) + 1;
  if (top[0]) enN1[top[0].pays.id] = (enN1[top[0].pays.id] ?? 0) + 1;
  for (const l of top) enTop3[l.pays.id] = (enTop3[l.pays.id] ?? 0) + 1;
  const s = paysSurprise(etat, calculer(etat), top);
  if (s) surprises[s.cause] = (surprises[s.cause] ?? 0) + 1;
  const vusFormats = new Set(etat.ordre.map((id) => trouverElement(id)!.type));
  for (const f of vusFormats) formats[f] = (formats[f] ?? 0) + 1;
  const adapt = (c: number) => etat.ordre.find((id) => chapitreDe(id) === c);
  const d3 = adapt(3), d4 = adapt(4);
  if (d3) debut3[d3] = (debut3[d3] ?? 0) + 1;
  if (d4) debut4[d4] = (debut4[d4] ?? 0) + 1;

  // Les règles du prompt 6, une par une : mêmes réponses, une seule règle changée.
  for (const [nom, regles] of VARIANTES) {
    const n1 = n1Avec(etat, regles);
    if (n1) { (n1Variantes[nom] ??= {})[n1.pays.id] = (n1Variantes[nom][n1.pays.id] ?? 0) + 1; }
  }
  // Ce qui porte le n° 1 européen : les mesures où il prend le plus d'avance sur le meilleur pays hors d'Europe.
  const lignesTout = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees);
  const premier = lignesTout[0];
  const horsEurope = lignesTout.find((l) => !EUROPE.has(l.pays.id));
  if (premier && horsEurope && EUROPE.has(premier.pays.id)) {
    const parMesure = (l: Ligne) => new Map(l.details.map((d) => [d.mesure, d.poids * d.accord]));
    const a = parMesure(premier), b = parMesure(horsEurope);
    const avance = [...a].map(([m, v]) => ({ m, e: v - (b.get(m) ?? 0) })).sort((x, y) => y.e - x.e);
    if (avance[0]?.e > 0) porteurs[avance[0].m] = (porteurs[avance[0].m] ?? 0) + 1;
    if (premier.acces > horsEurope.acces && premier.ressemble <= horsEurope.ressemble) parAcces++;
    nbN1Europe++;
  }
  // Couverture : les pays du top 10 de « Il te ressemble » qui ne peuvent pas entrer dans le top 3 faute de données.
  for (const l of calculer(etat).filter((x) => !x.ecart).sort((x, y) => y.ressemble - x.ressemble).slice(0, 10)) {
    if (l.peuDeDonnees) bloques[EUROPE.has(l.pays.id) ? "europe" : "ailleurs"]++;
    neutres[EUROPE.has(l.pays.id) ? "europe" : "ailleurs"] += l.neutres.length;
    vus[EUROPE.has(l.pays.id) ? "europe" : "ailleurs"]++;
  }

  // Le projet : mêmes réponses, seul l'objectif change.
  if (i < 1000) {
    const tops = objectifs.map((o) => cleTop3(calculer({ ...etat, profil: { ...etat.profil, objectif: o } })));
    if (new Set(tops).size > 1) changeAvecObjectif++;
  }
  // Sensibilité (1 000 premiers parcours) : pour chaque élément adaptatif répondu, une autre réponse change-t-elle le top 3 ?
  if (i < 1000) {
    const cle = cleTop3(calculer(etat));
    for (const id of etat.ordre) {
      const el = trouverElement(id)!;
      if (!estAdaptatif(el.chapitre) || etat.reponses[id] === PASSER) continue;
      posee[id] = (posee[id] ?? 0) + 1;
      const rr = hasard(i * 31 + id.length);
      let change = false;
      for (let k = 0; k < 4 && !change; k++) {
        const autre = reponseAuHasard(el, etat, rr);
        if (JSON.stringify(autre) === JSON.stringify(etat.reponses[id])) continue;
        if (cleTop3(calculer({ ...etat, reponses: { ...etat.reponses, [id]: autre } })) !== cle) change = true;
      }
      if (change) sensible[id] = (sensible[id] ?? 0) + 1;
    }
  }
}

console.log(`Simulation sur ${NB} parcours (graine 20261115).\n`);
console.log("Pays : part en n° 1 | part dans le top 3");
for (const p of [...pays].sort((a, b) => (enN1[b.id] ?? 0) - (enN1[a.id] ?? 0) || (enTop3[b.id] ?? 0) - (enTop3[a.id] ?? 0))) {
  console.log(`  ${p.nom.padEnd(22)} ${pct(enN1[p.id] ?? 0).padStart(7)} | ${pct(enTop3[p.id] ?? 0).padStart(7)}`);
}
// Part des pays européens en n° 1, et les pays qui dépassent 20 % de n° 1.
const europeN1 = pays.filter((p) => p.zone === "europe").reduce((t, p) => t + (enN1[p.id] ?? 0), 0);
console.log(`\nPart des pays européens en n° 1 : ${pct(europeN1)} ; pays au-dessus de 20 % de n° 1 : ${pays.filter((p) => (enN1[p.id] ?? 0) > 0.2 * NB).map((p) => `${p.nom} ${pct(enN1[p.id])}`).join(", ") || "aucun"}.`);
console.log("Rappel : ces parcours sont tirés au hasard (réponses uniformes) ; ils mesurent le moteur, pas de vrais utilisateurs.");
console.log("\nUne règle retirée à la fois (mêmes réponses) : part européenne en n° 1 ; les 3 premiers pays en n° 1");
for (const [nom] of VARIANTES) {
  const m = n1Variantes[nom] ?? {};
  const eu = Object.entries(m).filter(([id]) => EUROPE.has(id)).reduce((t, [, n]) => t + n, 0);
  console.log(`  ${nom.padEnd(48)} ${pct(eu).padStart(7)} ; ${Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `${pays.find((p) => p.id === id)?.nom} ${pct(n)}`).join(", ")}`);
}
console.log("\nCe qui porte le n° 1 européen (la mesure où il prend le plus d'avance sur le meilleur pays hors d'Europe) :");
for (const [m, n] of Object.entries(porteurs).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${(mesures[m]?.court ?? m).padEnd(40)} ${pct(n, nbN1Europe)}`);
console.log(`  N° 1 européen grâce à l'accès seulement (il ressemble moins, mais il est plus accessible) : ${pct(parAcces, nbN1Europe)} des n° 1 européens.`);
console.log(`\nCouverture des données (top 10 de « Il te ressemble ») : ne peuvent pas entrer dans le top 3 faute de données : Europe ${pct(bloques.europe, vus.europe)}, ailleurs ${pct(bloques.ailleurs, vus.ailleurs)} ; critères sans donnée (comptés à 50 %) par pays : Europe ${nombre(neutres.europe / Math.max(1, vus.europe), 2)}, ailleurs ${nombre(neutres.ailleurs / Math.max(1, vus.ailleurs), 2)}.`);
console.log("Mesures notées pour moins de 30 pays (hors du classement) : " + Object.keys(mesures).filter((m) => !mesures[m].interne && !mesureClassante(m) && paysCouverts(m) > 0).map((m) => `${mesures[m].court ?? m} ${paysCouverts(m)}`).join(", ") + ".");
console.log("\nNotes continues, exemple du salaire (marche → continue) : " + ["luxembourg", "suisse", "etats-unis", "pays-bas", "danemark", "allemagne", "belgique", "autriche"].map((id) => `${pays.find((p) => p.id === id)?.nom} ${notes[id]?.salaire?.valeur ?? "—"} $ : ${notes[id]?.salaire?.note ?? "—"} → ${noteContinue(id, "salaire")?.toFixed(2).replace(".", ",") ?? "—"}`).join(" ; ") + ".");
console.log(`\nTop 3 différent selon le projet (mêmes réponses, 1 000 parcours) : ${pct(changeAvecObjectif, Math.min(NB, 1000))}.`);
const tri = [...ecrans].sort((a, b) => a - b);
console.log(`\nDurée : ${nombre(ecrans.reduce((a, b) => a + b, 0) / NB)} écrans en moyenne (min ${tri[0]}, max ${tri.at(-1)}, médiane ${tri[Math.floor(NB / 2)]}) ; moins de 18 écrans : ${pct(ecrans.filter((x) => x < 18).length)}.`);
for (const c of [3, 4]) {
  const n = parcoursListe.map((e) => e.ordre.filter((id) => chapitreDe(id) === c).length);
  console.log(`  Chapitre ${c} : ${nombre(n.reduce((a, b) => a + b, 0) / NB)} écrans en moyenne (min ${Math.min(...n)}, max ${Math.max(...n)}).`);
}
console.log("\nFormats vus (part des parcours qui voient au moins une fois ce format) :");
for (const [f, n] of Object.entries(formats).sort((a, b) => b[1] - a[1])) console.log(`  ${f.padEnd(14)} ${pct(n)}`);

// ---------- 2. Diversité : éléments en commun entre deux parcours (chapitres 3 et 4) ----------
const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 1;
};
const adaptatifs = (e: Etat) => e.ordre.filter((id) => estAdaptatif(chapitreDe(id)));
// Ce que la personne lit vraiment dans les chapitres 3 et 4 : la scène d'un dilemme, chacune des 5 phrases à glisser,
// le texte d'une question (curseur, ambiances, question du projet).
const contenusLus = (e: Etat) => adaptatifs(e).flatMap((id) => {
  const el = trouverElement(id)!;
  if (el.type === "dilemme") return [`${id}/${sceneDe(el, etatAvant(e, id)).id}`];
  if (el.type === "swipe") return phrasesSwipe(el, e).map((p) => `phrase/${p.id}`);
  return [id];
});
const r2 = hasard(20261116);
let jEl = 0, jEcran = 0, jTout = 0, jLu = 0;
const PAIRES = 3000;
for (let k = 0; k < PAIRES; k++) {
  const a = choisir(r2, parcoursListe), b = choisir(r2, parcoursListe);
  jEl += jaccard(adaptatifs(a), adaptatifs(b));
  jLu += jaccard(contenusLus(a), contenusLus(b));
  jEcran += jaccard(adaptatifs(a).map((id) => cleEcran(id, a)), adaptatifs(b).map((id) => cleEcran(id, b)));
  jTout += jaccard(a.ordre.map((id) => cleEcran(id, a)), b.ordre.map((id) => cleEcran(id, b)));
}
const modal = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
console.log(`\nDiversité (${PAIRES} paires de parcours) :`);
console.log(`  Contenu lu identique dans les chapitres 3 et 4 (scènes, phrases à glisser, questions ; Jaccard) : ${pct(jLu, PAIRES)} (objectif : moins de 30 %)`);
console.log(`  Éléments en commun dans les chapitres 3 et 4 (Jaccard) : ${pct(jEl, PAIRES)} ; écrans identiques (même scène) : ${pct(jEcran, PAIRES)}`);
console.log(`  Écrans identiques sur tout le parcours (chapitres 1, 2 et 5 compris, communs à tous) : ${pct(jTout, PAIRES)}`);
const [m3, n3] = modal(debut3), [m4, n4] = modal(debut4);
console.log(`  Même premier élément du chapitre 3 : ${pct(Object.values(debut3).reduce((s, n) => s + (n / NB) ** 2, 0) * NB)} des paires (le plus fréquent : ${m3}, ${pct(n3)} des parcours)`);
console.log(`  Même premier élément du chapitre 4 : ${pct(Object.values(debut4).reduce((s, n) => s + (n / NB) ** 2, 0) * NB)} des paires (le plus fréquent : ${m4}, ${pct(n4)} des parcours)`);

console.log("\nÉléments adaptatifs (1 000 parcours) : posé dans | une autre réponse change le top 3");
for (const el of quiz.elements.filter((x) => estAdaptatif(x.chapitre))) {
  const n = posee[el.id] ?? 0;
  console.log(`  ${el.id.padEnd(18)} ${pct(n, Math.min(NB, 1000)).padStart(7)} | ${n ? pct(sensible[el.id] ?? 0, n).padStart(7) : "      –"}`);
}
const nbSurprises = Object.values(surprises).reduce((a, b) => a + b, 0);
console.log(`\nPays surprise : ${pct(nbSurprises)} des parcours (${Object.entries(surprises).map(([c, n]) => `${c} ${n}`).join(", ") || "aucun"}).`);
const nbTop = fiab.complete + fiab.partielle + fiab.faible;
console.log(`Règle des 3 premières envies (une donnée manquante empêche le top 3) : le top 3 change dans ${pct(topChange, NB)} des parcours.`);
console.log(`  Pays écartés du top 3 par la règle (nombre de parcours) : ${Object.entries(ecartesRegle).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p} ${n}`).join(", ")}.`);
console.log(`Données disponibles des pays du top 3 : ${(Object.keys(fiab) as NiveauFiabilite[]).map((k) => `${LIBELLE_FIABILITE[k]} ${pct(fiab[k], nbTop)}`).join(" ; ")}.`);

// ---------- 3. Profils types ----------
// Chaque profil type répond comme il le dit ; pour le reste, il répond au hasard (toujours le même hasard).
// On affiche son parcours (écran par écran, chapitres 3 et 4) et son top 5.
console.log("\nProfils types : parcours des chapitres 3 et 4, puis top 5 (score)");
for (const p of PROFILS_TYPES) {
  const rr = hasard(p.graine * 1000 + 7);
  const etat = parcoursAuHasard(rr, { passer: 0, repondeur: repondeurFixe(p) });
  const lignes = calculer(etat);
  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 5);
  const ru = lignes.filter((l) => !l.ecart).findIndex((l) => l.pays.id === "royaume-uni");
  console.log(`  ${p.nom}`);
  console.log(`    ${etat.ordre.length} écrans ; chapitre 3 : ${etat.ordre.filter((id) => chapitreDe(id) === 3).join(", ")}`);
  console.log(`    chapitre 4 : ${etat.ordre.filter((id) => chapitreDe(id) === 4).join(", ")}`);
  console.log(`    top 5 : ${top.map((l) => `${l.pays.nom} ${Math.round(l.score)}`).join(", ")} ; Royaume-Uni ${ru < 0 ? "dans « Moins adaptés »" : `n° ${ru + 1}`}`);
  // Le profil finance : la place du Royaume-Uni sans le secteur (mêmes réponses, secteur « Autre »).
  if (p.reponses.secteur === "finance") {
    const sans = calculer({ ...etat, profil: { ...etat.profil, secteur: "autre" } }).filter((l) => !l.ecart);
    console.log(`    sans le secteur (mêmes réponses) : Royaume-Uni n° ${sans.findIndex((l) => l.pays.id === "royaume-uni") + 1} ; top 5 : ${sans.filter((l) => !l.peuDeDonnees).slice(0, 5).map((l) => `${l.pays.nom} ${Math.round(l.score)}`).join(", ")}`);
  }
}

// ---------- Profils fixes (prompt 3h) : six personnes types, leur top 3 ----------
console.log("\nProfils fixes (prompt 3h) : écrans, top 3 (score, « ressemble » / « accessible »), puis les pays écartés du top 3 pour une donnée manquante sur un des 3 premiers critères");
for (const p of PROFILS_FIXES) {
  const etat = parcoursAuHasard(hasard(p.graine * 1000 + 7), { passer: 0, repondeur: repondeurFixe(p) });
  const lignes = calculer(etat);
  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  const manquants = lignes.filter((l) => !l.ecart && l.manquePrincipal.length && l.score > (top[2]?.score ?? 0)).map((l) => `${l.pays.nom} ${Math.round(l.score)} (${l.manquePrincipal.join(", ")})`);
  console.log(`  ${p.nom}\n    ${etat.ordre.length} écrans ; top 3 : ${top.map((l) => `${l.pays.nom} ${Math.round(l.score)} (${Math.round(l.ressemble)} / ${l.acces})`).join(", ")}${manquants.length ? `\n    au-dessus du n° 3 mais écartés (donnée manquante) : ${manquants.join(" ; ")}` : ""}`);
}

// ---------- Cas limites (prompt 3g) : affiner jusqu'au bout, et tout passer ----------
{
  const rA = hasard(424242);
  let etat = parcoursAuHasard(rA);
  const avant = etat.ordre.length;
  let affinages = 0;
  for (; affinages < 40; affinages++) {
    const el = prochainAffiner(etat);
    if (!el) break;
    etat = repondre(etat, el.id, reponseAuHasard(el, etat, rA));
  }
  const session = validerSession(JSON.parse(JSON.stringify({ ...SESSION_VIDE, etat, etape: { t: "affiner" } })));
  console.log(`\nAffiner jusqu'au bout : ${avant} écrans, puis ${affinages} questions d'affinage ; il en reste ${restantsAffiner(etat)} ; une session restée sur « affiner » revient à « ${session?.etape.t} ».`);
  const passe = parcoursAuHasard(hasard(7), { passer: 1 });
  const top = calculer(passe).filter((l) => !l.ecart && !l.peuDeDonnees);
  console.log(`Tout passer : ${passe.ordre.length} écrans, questionnaire fini : ${questionnaireFini(passe) ? "oui" : "non"} ; pays classés avec un pourcentage : ${top.length}.`);
}
