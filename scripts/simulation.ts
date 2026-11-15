// Simulation : 5 000 quiz tirés au hasard (graine fixe, toujours les mêmes).
// Elle mesure les biais du classement : part de chaque pays en n°1 et dans le top 3,
// effet du projet (objectif) sur le top 3, et sensibilité de chaque question.
// Usage : npm run simulation   (ou : npm run simulation -- 1000 pour moins de quiz)
import { quiz } from "@/lib/donnees";
import { ETAT_VIDE, calculer, cleTop3, demarrerDilemmes, prochainDilemme, questionProfilVisible, repondre, resultatPret, type Etat, type Profil } from "@/lib/moteur";
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
const reponsesPossibles = (q: Question) => q.options.map((o) => o.id);
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

for (let i = 0; i < NB; i++) {
  const etat = quizAuHasard(r);
  const top = cleTop3(calculer(etat)).split(",").filter(Boolean);
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
