// Écrit docs/parcours-exemples.md : 3 parcours très différents, écran par écran (réponses tirées au hasard, graines fixes,
// sauf le profil de départ imposé), avec l'écran « Ton intuition », le portrait et le top 3. Usage : npm run exemples
import fs from "node:fs";
import { quiz, trouverElement, type Valeur } from "@/lib/donnees";
import { LIBELLE_LIMITE, LIBELLE_SWIPE, libelleCurseur, optionsDe } from "@/lib/elements";
import { calculer, libelleReponse, sceneDe, type Etat } from "@/lib/moteur";
import { chapitreDe, etatAvant } from "@/lib/parcours";
import { intuition, nomCercle } from "@/lib/intuition";
import { portraitComplet } from "@/lib/portrait";
import { lireCercle } from "@/lib/zones";
import { hasard, parcoursAuHasard, reponseAuHasard } from "./hasard";

function enMots(id: string, v: Valeur, etat: Etat): string {
  const el = trouverElement(id)!;
  if (v === "passer") return "Passer";
  const av = etatAvant(etat, id);
  switch (el.type) {
    case "choix-cartes": { const o = optionsDe(el); return (Array.isArray(v) ? v : [v]).map((x) => o.find((y) => y.id === x)?.label ?? x).join(", ") || (el.aucun ?? "aucune"); }
    case "classement": return (v as string[]).map((x, i) => `${i + 1}. ${quiz.envies.find((e) => e.id === x)?.label}`).join(" ; ");
    case "curseur": return `${v} sur 100 (« ${libelleCurseur(el, v as number)} »)`;
    case "thermometre": return el.niveaux[(v as number) - 1];
    case "carte-monde": return (v as string[]).map((z) => z === "aucune" ? "Pas de zone précise" : lireCercle(z) ? `${nomCercle(lireCercle(z)!)} (${lireCercle(z)!.km} km)` : (el.zones.find((x) => x.id === z) ?? el.groupes.find((x) => x.id === z))?.label).join(", ");
    case "ambiances": return (v as string[]).map((x) => el.options.find((o) => o.id === x)?.label).join(", ");
    case "swipe": return Object.entries(v as Record<string, string>).map(([p, r]) => `« ${el.phrases.find((x) => x.id === p)?.texte} » → ${LIBELLE_SWIPE[r as "oui"]}`).join(" ; ");
    case "tri-limites": return Object.entries(v as Record<string, string>).map(([s, r]) => `${el.situations.find((x) => x.id === s)?.texte} → ${LIBELLE_LIMITE[r as "ok"]}`).join(" ; ");
    case "dilemme": return libelleReponse(el, v, av);
  }
}
const titre = (id: string, etat: Etat) => { const el = trouverElement(id)!; if (el.type !== "dilemme") return el.titre; const s = sceneDe(el, etatAvant(etat, id)); return `${s.titre} — ${s.texte}`; };
const CAS = [
  { nom: "Parcours 1 : stage ou VIE, 23 ans, anglais moyen, marketing", graine: 101, force: { objectif: "stage-vie", age: "18-25", secteur: "commerce", "anglais-reunion": 3, "anglais-vie": 3 } as Record<string, Valeur> },
  { nom: "Parcours 2 : année d’aventure (PVT), 24 ans, anglais débutant, sans secteur", graine: 202, force: { objectif: "aventure", age: "18-25", secteur: "autre", "anglais-reunion": 1, "anglais-vie": 2, langues: ["es"] } as Record<string, Valeur> },
  { nom: "Parcours 3 : carrière longue, 29 ans, anglais courant, tech et data", graine: 303, force: { objectif: "carriere", age: "28-30", secteur: "tech", "anglais-reunion": 5, "anglais-vie": 4 } as Record<string, Valeur> },
];
const out: string[] = ["# Trois parcours réels (prompt 3f)", "", "Générés par `npm run exemples`. Les réponses non imposées sont tirées au hasard (graine fixe).", ""];
for (const c of CAS) {
  const r = hasard(c.graine);
  const etat = parcoursAuHasard(r, { passer: 0.04, repondeur: (el, e) => c.force[el.id] ?? reponseAuHasard(el, e, r) });
  out.push(`### ${c.nom}`, "", `${etat.ordre.length} écrans (sans compter les écrans d’ouverture de chapitre ni le portrait).`, "");
  let ch = 0;
  etat.ordre.forEach((id, i) => {
    const el = trouverElement(id)!;
    if (chapitreDe(id) !== ch) { ch = chapitreDe(id); out.push(`- **Chapitre ${ch} : ${quiz.chapitres[ch - 1].titre}**`); }
    out.push(`  ${i + 1}. [${el.type}] ${titre(id, etat)} → ${enMots(id, etat.reponses[id], etat)}`);
  });
  const it = intuition(etat);
  const p = portraitComplet(etat);
  const top = calculer(etat).filter((l) => !l.ecart && !l.peuDeDonnees).slice(0, 3);
  out.push(`- **Ton intuition** : ${it.phrase}${it.raisons.length ? ` Ce qui a compté : ${it.raisons.join(" ; ")}.` : ""}`);
  out.push(`- **Portrait** : ${p.titre}. ${p.lignes.map((l) => l.texte).join(" ")}${p.contradiction ? ` Hésitation : ${p.contradiction.texte}` : ""} Ce qu’on va chercher : ${p.cherche.join(", ")}.`);
  out.push(`- **Top 3** : ${top.map((l) => `${l.pays.nom} ${Math.round(l.score)} %`).join(", ")}`, "");
}
fs.writeFileSync("docs/parcours-exemples.md", out.join("\n") + "\n");
console.log("docs/parcours-exemples.md écrit.");
