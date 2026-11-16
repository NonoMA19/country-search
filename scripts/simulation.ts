// Simulation : 5 000 quiz tirés au hasard (graine fixe, toujours les mêmes).
// Elle mesure les biais du classement : part de chaque pays en n°1 et dans le top 3,
// effet du projet (objectif) sur le top 3, et sensibilité de chaque question.
// Usage : npm run simulation   (ou : npm run simulation -- 1000 pour moins de quiz)
import { quiz, type Dilemme } from "@/lib/donnees";
import { ETAT_VIDE, LIBELLE_FIABILITE, calculer, cleTop3, demarrerDilemmes, paysSurprise, prochainDilemme, questionProfilVisible, repondre, reponsesDe, resultatPret, type Etat, type NiveauFiabilite, type Profil } from "@/lib/moteur";
import { pays } from "@/lib/pays";

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

type Question = { id: string; options: { id: string }[] };
// Les réponses possibles d'un dilemme, sans « passer ».
const reponsesPossibles = (q: Question) => reponsesDe(q as Dilemme);
const toutesLesQuestions = (): Question[] => quiz.dilemmes;

function profilAuHasard(r: Alea): Profil {
  const p: Profil = {};
  for (const q of quiz.profil) {
    if (!questionProfilVisible(q.id, p)) continue;
    if (r() < 0.1) continue;
    if (q.multiple) p[q.id] = q.options.filter(() => r() < 0.2).map((o) => o.id);
    else p[q.id] = choisir(r, q.options).id;
  }
  return p;
}

function quizAuHasard(r: Alea): Etat {
  const dispo = quiz.priorites.map((x) => x.id);
  const priorites: string[] = [];
  while (priorites.length < 3) {
    const id = choisir(r, dispo);
    if (!priorites.includes(id)) priorites.push(id);
  }
  const sujets = quiz.sujets.filter(() => r() < 0.3).map((s) => s.id);
  let etat = demarrerDilemmes({ ...ETAT_VIDE, profil: profilAuHasard(r), priorites, sujets });
  for (let n = 0; n < 30; n++) {
    const q = prochainDilemme(etat);
    if (!q) break;
    const r1 = r();
    const reponse = r1 < 0.1 ? "passer" : choisir(r, reponsesPossibles(q));
    etat = repondre(etat, q.id, reponse);
    // À la première proposition du résultat, 7 personnes sur 10 s'arrêtent.
    if (resultatPret(etat) && r() < 0.7) break;
  }
  return etat;
}

const NB = Number(process.argv[2] ?? 5000);
const r = hasard(20261115);
const enN1: Record<string, number> = {};
const enTop3: Record<string, number> = {};
const objectifs = quiz.profil.find((q) => q.id === "objectif")!.options.map((o) => o.id);
let changeAvecObjectif = 0;
const changeParObjectif: Record<string, number> = Object.fromEntries(objectifs.map((o) => [o, 0]));
const posee: Record<string, number> = {};
const sensible: Record<string, number> = {};
const sensibleN1: Record<string, number> = {};
let nbQuestions = 0;
// Prompt 3d : pays surprise et fiabilité des données du top 3.
const surprises: Record<string, number> = { zone: 0, employeur: 0, langue: 0 };
const surprisePays: Record<string, number> = {};
const fiab: Record<NiveauFiabilite, number> = { complete: 0, partielle: 0, faible: 0 };

for (let i = 0; i < NB; i++) {
  const etat = quizAuHasard(r);
  const lignes = calculer(etat);
  const top = cleTop3(lignes).split(",").filter(Boolean);
  const top3 = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  for (const l of top3) fiab[l.fiabilite.niveau]++;
  const s = paysSurprise(etat, lignes, top3);
  if (s) { surprises[s.cause]++; surprisePays[s.ligne.pays.id] = (surprisePays[s.ligne.pays.id] ?? 0) + 1; }
  if (top[0]) enN1[top[0]] = (enN1[top[0]] ?? 0) + 1;
  for (const id of top) enTop3[id] = (enTop3[id] ?? 0) + 1;

  // Le projet : mêmes réponses, seul l'objectif change.
  const tops = objectifs.map((o) => cleTop3(calculer({ ...etat, profil: { ...etat.profil, objectif: o } })));
  if (new Set(tops).size > 1) changeAvecObjectif++;
  const ref = cleTop3(calculer({ ...etat, profil: { ...etat.profil, objectif: undefined } }));
  objectifs.forEach((o, k) => { if (tops[k] !== ref) changeParObjectif[o]++; });

  // Sensibilité : pour chaque question répondue, une autre réponse change-t-elle le top 3 ?
  const cle = cleTop3(calculer(etat));
  for (const id of etat.ordre) {
    const rep = etat.reponses[id];
    if (rep === "passer") continue;
    nbQuestions++;
    posee[id] = (posee[id] ?? 0) + 1;
    const q = toutesLesQuestions().find((x) => x.id === id)!;
    let change = false, changeN1 = false;
    for (const autre of reponsesPossibles(q)) {
      if (autre === rep) continue;
      const k = cleTop3(calculer({ ...etat, reponses: { ...etat.reponses, [id]: autre } }));
      if (k !== cle) change = true;
      if (k.split(",")[0] !== cle.split(",")[0]) changeN1 = true;
    }
    if (change) sensible[id] = (sensible[id] ?? 0) + 1;
    if (changeN1) sensibleN1[id] = (sensibleN1[id] ?? 0) + 1;
  }
}

const pct = (n: number, d = NB) => `${((100 * n) / d).toFixed(1).replace(".", ",")} %`;
console.log(`Simulation sur ${NB} quiz (graine 20261115).\n`);
console.log("Pays : part en n°1 | part dans le top 3");
for (const p of [...pays].sort((a, b) => (enN1[b.id] ?? 0) - (enN1[a.id] ?? 0) || (enTop3[b.id] ?? 0) - (enTop3[a.id] ?? 0))) {
  console.log(`  ${p.nom.padEnd(22)} ${pct(enN1[p.id] ?? 0).padStart(7)} | ${pct(enTop3[p.id] ?? 0).padStart(7)}`);
}
console.log(`\nTop 3 différent selon l'objectif (mêmes réponses) : ${pct(changeAvecObjectif)} des profils.`);
for (const o of objectifs) console.log(`  « ${o} » au lieu de « sans objectif » : ${pct(changeParObjectif[o])}`);
console.log(`\nQuestions (${nbQuestions} réponses au total) : posée dans | une autre réponse change le top 3 | change le n°1`);
for (const q of toutesLesQuestions()) {
  const n = posee[q.id] ?? 0;
  console.log(`  ${q.id.padEnd(22)} ${pct(n).padStart(7)} | ${n ? pct(sensible[q.id] ?? 0, n).padStart(7) : "      –"} | ${n ? pct(sensibleN1[q.id] ?? 0, n).padStart(7) : "      –"}`);
}

const nbSurprises = Object.values(surprises).reduce((a, b) => a + b, 0);
console.log(`\nPays surprise : ${pct(nbSurprises)} des profils (zone ${surprises.zone}, visa lié à l'employeur ${surprises.employeur}, langue à apprendre ${surprises.langue}).`);
console.log(`  Les plus fréquents : ${Object.entries(surprisePays).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => `${pays.find((p) => p.id === id)?.nom} ${pct(n, nbSurprises)}`).join(", ")}`);
const nbTop = fiab.complete + fiab.partielle + fiab.faible;
console.log(`Fiabilité des pays du top 3 : ${(Object.keys(fiab) as NiveauFiabilite[]).map((k) => `${LIBELLE_FIABILITE[k]} ${pct(fiab[k], nbTop)}`).join(" ; ")}.`);

// ---------- Personas de contrôle (prompt 3c) ----------
// Six profils types, toujours les mêmes, rejoués à chaque simulation. On affiche leur top 5 sans rien forcer.
// Les réponses de dilemme traduisent ce que dit chaque profil ; tout le reste est laissé sans réponse.
type Persona = { nom: string; profil: Profil; priorites: string[]; reponses: Record<string, string> };
const PERSONAS: Persona[] = [
  { nom: "a) Premier poste en finance, anglais courant, salaire, travail facile, grande ville", profil: { objectif: "premier-poste", age: "18-25", anglais: "courant", zone: "peu-importe" }, priorites: ["salaire", "travail"], reponses: { appartement: "a" } },
  { nom: "b) Année d'aventure, 22 ans, coût de la vie, nature, climat doux", profil: { objectif: "aventure", age: "18-25", anglais: "moyen", zone: "peu-importe" }, priorites: ["prix", "climat"], reponses: { appartement: "b" } },
  { nom: "c) Stage ou VIE, des Français sur place, près de la France", profil: { objectif: "stage-vie", age: "18-25", anglais: "moyen", zone: "peu-importe" }, priorites: ["francais", "proche"], reponses: { "premier-mois": "a", noel: "a" } },
  { nom: "d) Carrière longue, apprendre une langue lui va, sécurité et équilibre", profil: { objectif: "carriere", age: "26-27", anglais: "courant", zone: "peu-importe" }, priorites: ["securite", "equilibre"], reponses: { "cours-offerts": "a", "deux-langues": "a" } },
  { nom: "e) Parle espagnol, aime la chaleur, vie moins chère", profil: { age: "18-25", anglais: "moyen", langues: ["es"], zone: "peu-importe" }, priorites: ["prix"], reponses: { aout: "a", janvier: "b" } },
  { nom: "f) Hiérarchie plate, consensus, collègues vus après le travail", profil: { age: "26-27", anglais: "courant", zone: "peu-importe" }, priorites: [], reponses: { "reunion-directeur": "a", "idee-reunion": "b", "vendredi-18h": "b" } },
];
console.log("\nPersonas de contrôle : top 5 (score)");
for (const p of PERSONAS) {
  const ordre = Object.keys(p.reponses);
  const etat: Etat = { ...demarrerDilemmes({ ...ETAT_VIDE, profil: p.profil, priorites: p.priorites }), reponses: p.reponses, ordre };
  const lignes = calculer(etat);
  const top = lignes.filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 5);
  const s = paysSurprise(etat, lignes, top.slice(0, 3));
  console.log(`  ${p.nom}\n    ${top.map((l) => `${l.pays.nom} ${Math.round(l.score)}`).join(", ")}`);
  console.log(`    fiabilité du top 3 : ${top.slice(0, 3).map((l) => `${l.pays.nom} ${l.fiabilite.verifies}/${l.fiabilite.total}`).join(", ")} ; pays surprise : ${s ? `${s.ligne.pays.nom} ${Math.round(s.score)} % (${s.cause})` : "aucun"}`);
}
