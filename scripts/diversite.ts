// Diversité des questions (prompt 3e, lot 3.4) : deux personnes ont-elles les mêmes questions ?
// Chaque parcours a ses vraies préférences cachées (une réponse fixée d'avance pour chaque dilemme),
// répond au quiz comme le site le propose, et s'arrête comme une vraie personne.
// - Questions en commun : indice de Jaccard (questions communes ÷ questions posées par l'un ou l'autre),
//   sur des paires de parcours tirées au hasard. « Question » = la scène montrée (dilemme et scène).
// - Débuts identiques : part des paires qui commencent par les 3 mêmes questions, dans le même ordre.
// - Profils types : pour chacun, part des parcours qui commencent par ses 3 questions les plus fréquentes.
// - Qualité : écart entre le n° 1 du parcours et le n° 1 qu'on aurait trouvé en posant tous les dilemmes,
//   mesuré avec toutes les réponses (en points de pourcentage).
// Ce fichier n'utilise que des fonctions présentes avant le prompt 3e, pour mesurer aussi l'ancienne version.
import { quiz, type Dilemme } from "@/lib/donnees";
import * as M from "@/lib/moteur";
import type { Etat, Profil } from "@/lib/moteur";

type Alea = () => number;
const choisir = <T,>(r: Alea, l: T[]): T => l[Math.floor(r() * l.length)];
// Fonctions du prompt 3e, absentes de l'ancienne version : on s'en passe si elles manquent.
const X = M as unknown as {
  reponsesDe?: (d: Dilemme) => string[];
  sceneDe?: (d: Dilemme, e: Etat) => { id: string };
};
const reponses = (d: Dilemme) => X.reponsesDe?.(d) ?? d.options.map((o) => o.id);
const cle = (d: Dilemme, e: Etat) => (X.sceneDe ? `${d.id}/${X.sceneDe(d, e).id}` : d.id);

export type Parcours = { questions: string[]; dilemmes: string[]; perte: number; memeN1: boolean };

export function parcours(r: Alea, profil: Profil, priorites: string[], sujets: string[] = []): Parcours {
  const cachees = Object.fromEntries(quiz.dilemmes.map((d) => [d.id, choisir(r, reponses(d))]));
  const depart = { ...M.ETAT_VIDE, profil, priorites, sujets, graine: Math.floor(r() * 2 ** 31) } as Etat;
  let etat = M.demarrerDilemmes(depart);
  const questions: string[] = [];
  for (let n = 0; n < 30; n++) {
    const d = M.prochainDilemme(etat);
    if (!d) break;
    questions.push(cle(d, etat));
    etat = M.repondre(etat, d.id, cachees[d.id]);
    if (M.resultatPret(etat) && r() < 0.7) break;
  }
  // Toutes les réponses : le classement qu'on aurait avec tous les dilemmes posés.
  let complet = M.demarrerDilemmes(depart);
  for (const d of quiz.dilemmes) if (M.dilemmeVisible(d, complet)) complet = { ...complet, reponses: { ...complet.reponses, [d.id]: cachees[d.id] }, ordre: [...complet.ordre, d.id] };
  const lignesCompletes = M.calculer(complet).filter((l) => !l.ecart && !l.peuDeDonnees);
  const n1 = M.calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees)[0];
  const scoreComplet = (id?: string) => lignesCompletes.find((l) => l.pays.id === id)?.score ?? 0;
  const perte = lignesCompletes.length && n1 ? lignesCompletes[0].score - scoreComplet(n1.pays.id) : 0;
  return { questions, dilemmes: etat.ordre, perte, memeN1: n1?.pays.id === lignesCompletes[0]?.pays.id };
}

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 1;
};

export function statistiques(liste: Parcours[], r: Alea, paires = 3000) {
  let jq = 0, jd = 0, debut = 0;
  for (let k = 0; k < paires; k++) {
    const a = choisir(r, liste), b = choisir(r, liste);
    jq += jaccard(a.questions, b.questions);
    jd += jaccard(a.dilemmes, b.dilemmes);
    if (a.questions.length >= 3 && a.questions.slice(0, 3).join() === b.questions.slice(0, 3).join()) debut++;
  }
  const n = liste.length;
  return {
    questionsCommunes: jq / paires,
    dilemmesCommuns: jd / paires,
    memeDebut: debut / paires,
    perteMoyenne: liste.reduce((s, p) => s + p.perte, 0) / n,
    memeN1: liste.filter((p) => p.memeN1).length / n,
    questionsParParcours: liste.reduce((s, p) => s + p.questions.length, 0) / n,
  };
}

// Pour un profil type : part des parcours qui commencent par les 3 questions les plus fréquentes.
export function debutModal(liste: Parcours[]) {
  const comptes = new Map<string, number>();
  for (const p of liste) {
    const k = p.questions.slice(0, 3).join(" · ");
    comptes.set(k, (comptes.get(k) ?? 0) + 1);
  }
  const [k, n] = [...comptes].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  return { debut: k, part: n / liste.length };
}

const pct = (x: number) => `${(100 * x).toFixed(1).replace(".", ",")} %`;
const pts = (x: number) => `${x.toFixed(2).replace(".", ",")} point${x >= 2 ? "s" : ""}`;

// Affiche toute la mesure. « profilAuHasard » et « prioritesAuHasard » : les mêmes tirages que la simulation.
export function rapportDiversite(r: Alea, nb: number, profilAuHasard: (r: Alea) => Profil, prioritesAuHasard: (r: Alea) => string[]) {
  const tous = Array.from({ length: nb }, () => parcours(r, profilAuHasard(r), prioritesAuHasard(r)));
  const s = statistiques(tous, r);
  console.log(`\nDiversité des questions (${nb} parcours, préférences cachées tirées au hasard) :`);
  console.log(`  Questions strictement identiques entre deux parcours (Jaccard) : ${pct(s.questionsCommunes)} (dilemmes en commun : ${pct(s.dilemmesCommuns)})`);
  console.log(`  Paires qui commencent par les 3 mêmes questions : ${pct(s.memeDebut)}`);
  console.log(`  Questions par parcours : ${s.questionsParParcours.toFixed(1).replace(".", ",")}`);
  console.log(`  Qualité : même n° 1 qu'avec tous les dilemmes dans ${pct(s.memeN1)} des parcours ; perte moyenne sur le n° 1 : ${pts(s.perteMoyenne)}`);
  console.log("  Profils types (200 parcours chacun) : début le plus fréquent | Jaccard entre deux parcours du même profil | perte sur le n° 1");
  for (const p of PROFILS_TYPES) {
    const l = Array.from({ length: 200 }, () => parcours(r, p.profil, p.priorites));
    const m = debutModal(l);
    const st = statistiques(l, r, 1000);
    console.log(`    ${p.nom.padEnd(42)} ${pct(m.part).padStart(7)} | ${pct(st.questionsCommunes).padStart(7)} | ${pts(st.perteMoyenne)}`);
  }
  return s;
}

export const PROFILS_TYPES: { nom: string; profil: Profil; priorites: string[] }[] = [
  { nom: "a) Premier poste, anglais courant", profil: { objectif: "premier-poste", age: "18-25", anglais: "courant", zone: "peu-importe" }, priorites: ["salaire", "travail", "francais"] },
  { nom: "b) Année d'aventure, 22 ans", profil: { objectif: "aventure", age: "18-25", anglais: "moyen", zone: "peu-importe" }, priorites: ["prix", "climat", "securite"] },
  { nom: "c) Stage ou VIE, près de la France", profil: { objectif: "stage-vie", age: "18-25", anglais: "moyen", zone: "peu-importe" }, priorites: ["francais", "proche", "travail"] },
  { nom: "d) Carrière longue, sécurité et équilibre", profil: { objectif: "carriere", age: "26-27", anglais: "courant", zone: "peu-importe" }, priorites: ["securite", "equilibre", "salaire"] },
  { nom: "e) Parle espagnol, vie moins chère", profil: { age: "18-25", anglais: "moyen", langues: ["es"], zone: "peu-importe" }, priorites: ["prix", "climat", "travail"] },
  { nom: "f) Europe seulement, proche et sûr", profil: { age: "26-27", anglais: "courant", zone: "europe" }, priorites: ["proche", "securite", "equilibre"] },
];
