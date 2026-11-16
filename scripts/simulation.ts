// Simulation : 5 000 parcours tirés au hasard (graine fixe, toujours les mêmes).
// Elle mesure les biais du classement (n° 1 et top 3), l'effet du projet, la durée en écrans,
// la diversité des parcours, les formats vus, et rejoue les profils types.
// Usage : npm run simulation   (ou : npm run simulation -- 1000 pour moins de parcours)
import { quiz, trouverElement, type Element, type Valeur } from "@/lib/donnees";
import { PASSER, optionsDe } from "@/lib/elements";
import { LIBELLE_FIABILITE, calculer, repondre, cleTop3, paysSurprise, sceneDe, type Etat, type NiveauFiabilite } from "@/lib/moteur";
import { chapitreDe, estAdaptatif, prochainAffiner, questionnaireFini, restantsAffiner, situationsLimites } from "@/lib/parcours";
import { SESSION_VIDE, validerSession } from "@/lib/memoire";
import { pays } from "@/lib/pays";
import { choisir, hasard, parcoursAuHasard, reponseAuHasard, type Repondeur } from "./hasard";

const NB = Number(process.argv[2] ?? 5000);
const pct = (n: number, d = NB) => `${((100 * n) / Math.max(1, d)).toFixed(1).replace(".", ",")} %`;
const nombre = (x: number, dec = 1) => x.toFixed(dec).replace(".", ",");
const top3 = (e: Etat) => calculer(e).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);

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
const parcoursListe: Etat[] = [];
const formats: Record<string, number> = {};
const debut3: Record<string, number> = {}, debut4: Record<string, number> = {};

for (let i = 0; i < NB; i++) {
  const etat = parcoursAuHasard(r);
  parcoursListe.push(etat);
  ecrans.push(etat.ordre.length);
  const top = top3(etat);
  for (const l of top) fiab[l.fiabilite.niveau]++;
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
const r2 = hasard(20261116);
let jEl = 0, jEcran = 0, jTout = 0;
const PAIRES = 3000;
for (let k = 0; k < PAIRES; k++) {
  const a = choisir(r2, parcoursListe), b = choisir(r2, parcoursListe);
  jEl += jaccard(adaptatifs(a), adaptatifs(b));
  jEcran += jaccard(adaptatifs(a).map((id) => cleEcran(id, a)), adaptatifs(b).map((id) => cleEcran(id, b)));
  jTout += jaccard(a.ordre.map((id) => cleEcran(id, a)), b.ordre.map((id) => cleEcran(id, b)));
}
const modal = (m: Record<string, number>) => Object.entries(m).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
console.log(`\nDiversité (${PAIRES} paires de parcours) :`);
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
console.log(`Fiabilité des pays du top 3 : ${(Object.keys(fiab) as NiveauFiabilite[]).map((k) => `${LIBELLE_FIABILITE[k]} ${pct(fiab[k], nbTop)}`).join(" ; ")}.`);

// ---------- 3. Profils types ----------
// Chaque profil type répond comme il le dit ; pour le reste, il répond au hasard (toujours le même hasard).
// On affiche son parcours (écran par écran, chapitres 3 et 4) et son top 5.
type Persona = { nom: string; reponses: Record<string, Valeur>; graine: number };
const PERSONAS: Persona[] = [
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
const repondeurDe = (p: Persona): Repondeur => (el, etat) => {
  const v = p.reponses[el.id];
  if (el.type === "tri-limites") return Object.fromEntries(situationsLimites(el, etat).map((s) => [s.id, ((v ?? {}) as Record<string, string>)[s.id] ?? "ok"]));
  if (v !== undefined) {
    if (el.id === "envies" && Array.isArray(v)) return v.filter((id) => optionsDe(el as never).some((o: { id: string }) => o.id === id));
    return v;
  }
  if (el.id === "carte") return ["aucune"];
  if (el.id === "nationalite") return "non";
  if (el.id === "langues") return [];
  if (el.id === "budget") return "2000-5000";
  if (el.id === "secteur") return "autre";
  if (el.id === "objectif") return "inconnu";
  return PASSER;
};
console.log("\nProfils types : parcours des chapitres 3 et 4, puis top 5 (score)");
for (const p of PERSONAS) {
  const rr = hasard(p.graine * 1000 + 7);
  const etat = parcoursAuHasard(rr, { passer: 0, repondeur: repondeurDe(p) });
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
