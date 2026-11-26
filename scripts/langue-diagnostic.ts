// Diagnostic du profil « parle espagnol, aime la chaleur, vie moins chère » (prompt 7, lot 1, point 4) :
// le détail du score du Japon face à l'Espagne, l'Argentine et le Mexique, mesure par mesure.
// Usage : node --import ./scripts/chargeur.mjs scripts/langue-diagnostic.ts
import { mesures } from "@/lib/donnees";
import { calculer, effetsActifs } from "@/lib/moteur";
import { PROFILS_FIXES, repondeurFixe } from "./profils";
import { hasard, parcoursAuHasard } from "./hasard";

const p = PROFILS_FIXES.find((x) => x.nom.startsWith("d)"))!;
const etat = parcoursAuHasard(hasard(p.graine * 1000 + 7), { passer: 0, repondeur: repondeurFixe(p) });
console.log(`Profil : ${p.nom}\nLangues : ${JSON.stringify(etat.profil.langues)} ; réponses : ${etat.ordre.map((id) => `${id}=${JSON.stringify(etat.reponses[id])}`).join(" ; ")}\n`);
console.log("Effets actifs (mesure, poids, origine) :");
for (const e of effetsActifs(etat)) console.log(`  ${e.mesure.padEnd(18)} ${e.poids.toFixed(2)} ${e.sens}${e.position !== undefined ? ` ${e.position}` : ""} ${e.origine}`);
const lignes = calculer(etat);
const ids = ["japon", "espagne", "argentine", "mexique"];
const L = (id: string) => lignes.find((l) => l.pays.id === id)!;
console.log("\nRang | score | ressemble | accès");
for (const id of ids) { const l = L(id); console.log(`  ${l.pays.nom.padEnd(10)} n° ${lignes.indexOf(l) + 1} | ${l.score.toFixed(1)} | ${l.ressemble.toFixed(1)} | ${l.acces} ${l.obstacles.map((o) => `(${o.texte} −${o.points})`).join(" ")}${l.peuDeDonnees ? " [peu de données : " + l.manquePrincipal.join(", ") + "]" : ""}`); }
const total = Object.fromEntries(ids.map((id) => [id, L(id).details.reduce((t, d) => t + d.poids, 0)]));
console.log("\nPoints par mesure (poids × accord) / poids — Japon | Espagne | Argentine | Mexique");
const toutes = [...new Set(ids.flatMap((id) => L(id).details.map((d) => d.mesure)))];
for (const m of toutes) {
  const cell = (id: string) => { const d = L(id).details.find((x) => x.mesure === m); return d ? `${(d.poids * d.accord).toFixed(2)}/${d.poids.toFixed(2)}${d.neutre ? "*" : ""}` : "   —   "; };
  console.log(`  ${(mesures[m]?.court ?? m).slice(0, 28).padEnd(28)} ${ids.map(cell).map((c) => c.padStart(10)).join(" ")}`);
}
console.log(`  ${"Total des poids".padEnd(28)} ${ids.map((id) => total[id].toFixed(2).padStart(10)).join(" ")}`);
