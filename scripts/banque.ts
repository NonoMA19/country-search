// Écrit docs/banque-quiz.md : toute la banque d'éléments, chapitre par chapitre, pour relecture.
// Usage : npm run banque
import fs from "node:fs";
import { mesures, quiz, type EffetDilemme, type Element } from "@/lib/donnees";
import { LIBELLE_ECHELLE } from "@/lib/elements";

const NOMS_FORMATS: Record<string, string> = {
  "choix-cartes": "ChoixCartes", classement: "Classement", curseur: "Curseur", swipe: "Swipe", ambiances: "Ambiances",
  thermometre: "Thermomètre", "carte-monde": "CarteMonde", "tri-limites": "TriLimites", dilemme: "Dilemme",
};
const effet = (effets: EffetDilemme[] | undefined) =>
  !effets?.length ? "aucun effet" : effets.map((e) => `${e.mesures.map((m) => mesures[m]?.court ?? m).join(" et ")} ${e.position !== undefined ? `(position ${e.position})` : `(importance ${String(e.poids ?? 1).replace(".", ",")})`}`).join(" ; ");
const lignes: string[] = ["# La banque du quiz (prompt 3f)", "", "Générée par `npm run banque` depuis `content/quiz.json`. Les montants et durées des scènes sont des exemples fictifs.", ""];
const ecrire = (t = "") => lignes.push(t);

function element(el: Element) {
  ecrire(`### ${el.id} · ${NOMS_FORMATS[el.type]} · thème « ${el.theme} »`);
  ecrire("");
  ecrire(`**${el.type === "dilemme" ? el.titre : el.titre}**${el.texte ? ` ${el.texte}` : ""}`);
  ecrire("");
  const infos = [
    `Dimensions : ${el.dimensions.join(", ") || "aucune"}`,
    el.condition ? `Condition : ${el.regleAffichage ?? el.condition}` : "",
    el.dejaCouvertPar ? `Déjà couvert par : ${el.dejaCouvertPar.join(", ")} (posé seulement si la certitude reste faible)` : "",
    el.obligatoire ? "Toujours posé dans son chapitre" : "",
    el.type === "choix-cartes" && el.profil ? `Remplit le profil : ${el.profil}` : "",
  ].filter(Boolean);
  for (const i of infos) ecrire(`- ${i}`);
  switch (el.type) {
    case "choix-cartes":
      if (el.source === "envies") for (const e of quiz.envies) ecrire(`- ${e.label} : ${e.mesures.map((m) => mesures[m]?.court ?? (m === "secteur" ? "ton secteur" : m)).join(" et ")}`);
      else for (const o of el.options) ecrire(`- ${o.label}${o.phrase ? ` (${o.phrase})` : ""}${o.plus ? ` · + ${o.plus} · − ${o.moins}` : ""}${o.effets ? ` → ${effet(o.effets)}` : ""}`);
      if (el.nombre) ecrire(`- Exactement ${el.nombre} choix`);
      break;
    case "classement": ecrire(`- Poids par rang : ${quiz.poidsRang.map((p, i) => `${i + 1} = ${String(p).replace(".", ",")}`).join(" ; ")}`); break;
    case "curseur":
      ecrire(`- Gauche « ${el.gauche.label} » → ${effet(el.gauche.effets)} ; droite « ${el.droite.label} » → ${effet(el.droite.effets)} (part continue de 0 à 1)`);
      ecrire(`- Libellés : ${el.libelles.map((l) => `jusqu’à ${l.jusqua} « ${l.texte} »`).join(" ; ")}`);
      break;
    case "thermometre": ecrire(`- Niveaux : ${el.niveaux.join(" · ")}`); break;
    case "carte-monde": for (const z of el.zones) ecrire(`- ${z.label}${z.detail ? ` (${z.detail})` : ""}`); ecrire("- « Aucune idée pour l’instant » ; aucun effet sur le score"); break;
    case "ambiances": for (const o of el.options) ecrire(`- ${o.label} (${o.phrase}) → ${effet(o.effets)}`); ecrire(`- ${el.max} choix au plus`); break;
    case "swipe": for (const p of el.phrases) ecrire(`- ${p.id} « ${p.texte} » · Ça me correspond → ${effet(p.oui)} · Pas vraiment → ${effet(p.non)}`); ecrire(`- ${el.nombre} phrases tirées parmi ${el.phrases.length} ; « Ça dépend » ne compte pas`); break;
    case "tri-limites": for (const s of el.situations) ecrire(`- ${s.texte} · Je préfère éviter → ${mesures[s.mesure]?.court ?? s.mesure} (importance 1) · Rédhibitoire → « Moins adaptés pour toi »`); ecrire(`- ${el.nombre} situations tirées parmi ${el.situations.length}`); break;
    case "dilemme":
      ecrire(`- ${el.echelle ? `Échelle : ${Object.values(LIBELLE_ECHELLE).join(", ")}` : "2 options"} ; A → ${effet(el.options[0].effets)} ; B → ${effet(el.options[1].effets)}`);
      for (const sc of el.scenes) {
        ecrire(`- Scène « ${sc.titre} » : ${sc.texte}`);
        sc.options.forEach((o, i) => ecrire(`  - ${"AB"[i]}. ${o.texte} · + ${o.plus} · − ${o.moins}`));
        for (const [projet, t] of Object.entries(sc.variantes ?? {})) ecrire(`  - Variante ${quiz.objectifs[projet]?.nom ?? projet} : ${t}`);
      }
      break;
  }
  ecrire("");
}

for (const ch of quiz.chapitres) {
  ecrire(`## Chapitre ${ch.numero} : ${ch.titre}${ch.adaptatif ? ` (adaptatif, ${ch.min} à ${ch.max} écrans)` : " (posé à tout le monde)"}`);
  ecrire("");
  ecrire(`_${ch.phrase}_`);
  ecrire("");
  for (const el of quiz.elements.filter((x) => x.chapitre === ch.numero)) element(el);
}
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/banque-quiz.md", lignes.join("\n") + "\n");
console.log(`docs/banque-quiz.md : ${quiz.elements.length} éléments, ${quiz.dilemmes.reduce((n, d) => n + d.scenes.length, 0)} scènes, ${quiz.dilemmes.reduce((n, d) => n + d.scenes.reduce((k, s) => k + Object.keys(s.variantes ?? {}).length, 0), 0)} variantes.`);
