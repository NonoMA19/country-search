// La banque du quiz, élément par élément (prompt 6) : chaque critère, valeur, limite, secteur, activité, motivation
// et chaque question a sa fiche. Un écran peut porter plusieurs éléments (les 25 critères sont 25 cartes d'un écran).
// Sert à docs/quiz-v2-banque.md (npm run banque) et au test du moteur. Aucune fiche n'est écrite à la main :
// la couverture des données et le type (Classement, Portrait, Accès) sont recalculés à chaque fois.
import { mesures, quiz, sources, type EffetDilemme, type Element } from "./donnees";
import { mesureClassante, mesureReelle, paysCouverts } from "./moteur";
import { pays } from "./pays";

export type TypeItem = "Classement" | "Portrait" | "Accès";
export type Item = {
  id: string; chapitre: number; format: string; type: TypeItem; ecran: string;
  texte: string; donnee: string; effet: string; condition: string; pourquoi: string;
};

const NOMS_FORMATS: Record<string, string> = {
  "choix-cartes": "Cartes", classement: "Classement", curseur: "Curseur", swipe: "Phrases à glisser", ambiances: "Ambiances",
  thermometre: "Thermomètre", "carte-monde": "Carte du monde", "tri-limites": "Tri des limites", dilemme: "Dilemme",
  timeline: "Frise", enveloppe: "Enveloppe", seuil: "Seuil", "tri-zones": "Tri en zones", "blind-test": "Test à l’aveugle",
};
// D'où viennent les valeurs d'une mesure : le fichier de data/ quand il existe, sinon content/scores.json.
const FICHIERS: Record<string, string> = {
  soleil: "data/indicators/ensoleillement-nasa.csv", "sante-systeme": "data/indicators/sante-couverture-oms.csv", justice: "data/indicators/etat-de-droit-bm.csv",
  expression: "data/indicators/liberte-expression-vdem.csv", "egalite-genre": "data/indicators/egalite-genre-wef.csv", "droits-travail": "data/indicators/droits-travailleurs-oit.csv",
  environnement: "data/indicators/environnement-epi.csv", "climat-prepare": "data/indicators/risques-climat-ndgain.csv", salaire: "data/oecd-average-annual-wages.csv",
};
const CALCULEES: Record<string, string> = {
  depaysement: "calculée : inverse du temps de vol et du décalage (content/scores.json)", "employeur-libre": "calculée : porte d’entrée et visa de travail (content/portes.json)",
  "en-europe": "calculée : content/pays.json", "region-carte": "calculée : ta carte et content/carte-monde.json", "langue-parlee": "calculée : content/saisie/avis.json",
  "langue-cible": "calculée : content/saisie/avis.json", "langue-travail": "calculée : content/saisie/avis.json et la note d’anglais",
};
const P = pays.length;
export const donneeDe = (m: string): string => {
  if (m === "secteur") return "la mesure de ton secteur (ILOSTAT, content/scores.json)";
  const d = mesures[m];
  const src = Object.values(sources).length ? (Object.entries(sources).find(([k]) => d?.critere.sources.includes(k))?.[1].nom ?? "") : "";
  const ou = CALCULEES[m] ?? FICHIERS[m] ?? "content/scores.json";
  return `${d?.court ?? d?.nom ?? m} : ${paysCouverts(m)}/${P} pays${src && !CALCULEES[m] ? ` (${src})` : ""} — ${ou}`;
};
const fr = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const effetTexte = (effets: EffetDilemme[] | undefined, n = 1) =>
  !effets?.length ? "aucun effet sur le calcul" : effets.map((e) => `${e.mesures.map((m) => mesures[m]?.court ?? m).join(" et ")} ${e.position !== undefined ? `(position ${fr(e.position)}${e.poids !== undefined && e.poids !== 1 ? `, importance ${fr(e.poids * n)}` : ""})` : `(importance ${fr((e.poids ?? 1) * n)})`}`).join(" ; ");
const mesuresDe = (effets: EffetDilemme[] | undefined) => [...new Set((effets ?? []).flatMap((e) => e.mesures))];
const classante = (ms: string[]) => ms.some((m) => { const r = mesureReelle(m, {}); return m === "secteur" || (!!r && mesureClassante(r)); });
const typeDe = (ms: string[]): TypeItem => (classante(ms) ? "Classement" : "Portrait");
const donnees = (ms: string[]) => (ms.length ? ms.map(donneeDe).join(" ; ") : "Portrait seulement");
const condition = (el: Element) => [
  el.relanceDe ? `Relance de « ${el.relanceDe.element} » (${el.relanceDe.reponses.join(", ")})` : "",
  el.regleAffichage ?? (el.condition ? `Condition : ${el.condition}` : ""),
  quiz.chapitres.find((c) => c.numero === el.chapitre)?.adaptatif && !el.relanceDe ? "Chapitre adaptatif : posé s’il départage tes premiers pays" : "",
  el.obligatoire ? "Toujours posé dans son chapitre" : "",
].filter(Boolean).join(" ; ") || "Toujours posé";
const pourquoi = (el: Element, carte?: string) => `${el.aide.enjeu}${carte ? ` ${carte}` : ""}`;

// Ce que le site fait pour les éléments qui pèsent sur l'accès (rédigé ici, d'après moteur.ts accesPays).
const ACCES: Record<string, string> = {
  age: "Il t’est accessible : PVT fermé à ton âge = −20 (visa de travail à la place) ; pour un projet de PVT, impossibilité légale traitée à part (le pays reste visible, jamais dans le top 3). VIE fermé après 28 ans (dit, pas de points).",
  budget: "Il t’est accessible : −15 s’il te manque à coup sûr de l’argent pour les ressources demandées par un PVT. Ne change jamais « Il te ressemble ».",
  timeline: "Il t’est accessible : −10 aux pays dont la seule porte est un PVT (un an), si tu veux rester plus d’un an ou « plus longtemps si je me plais ». « Et après » : portrait.",
  compagnie: "Portrait et résultat : en famille, hors libre circulation, « droits de la famille selon le visa : à vérifier » (aucun point retiré, faute de source visa par visa).",
  "couple-travail": "Il t’est accessible : « Oui », −10 aux pays hors libre circulation (un droit au travail pour ton ou ta partenaire). Ouvre la limite « partenaire-visa ».",
  nationalite: "Il t’est accessible : une nationalité canadienne, irlandaise ou américaine ouvre ce pays (porte « nationalité », 0 obstacle). Cas vérifiés seulement (content/double-nationalite.json).",
  "pret-anglais": "Il t’est accessible : « Non », −30 aux pays où l’on ne peut pas travailler en français (content/saisie/avis.json).",
};

export function itemsBanque(): Item[] {
  const items: Item[] = [];
  const ajouter = (x: Item) => items.push(x);
  for (const el of quiz.elements) {
    const base = { chapitre: el.chapitre, format: NOMS_FORMATS[el.type] ?? el.type, ecran: el.id, condition: condition(el) };
    if (el.type === "choix-cartes" && el.source === "envies") {
      for (const c of quiz.envies) {
        const ms = c.mesures;
        const parts = c.parts ? ` (parts ${c.parts.join(" et ")})` : "";
        ajouter({ ...base, id: `critere/${c.id}`, texte: c.label, type: typeDe(ms), donnee: donnees(ms),
          effet: ms.length ? `Il te ressemble : ${ms.map((m, k) => `${mesures[m]?.court ?? m}${c.positions?.[k] !== undefined ? ` (position ${c.positions[k]})` : ""}`).join(" et ")}${parts}, importance 2 (le plus dur à sacrifier), 1,5, ou 1,1 (second plan)${classante(ms) ? "" : " — sous 30 pays : portrait seulement"}${c.id === "salaire" ? " ; pour un VIE, l’indemnité VIE (36 pays) compte à la place" : ""}` : "Portrait seulement : aucune donnée pays",
          pourquoi: pourquoi(el) });
      }
      continue;
    }
    if (el.type === "choix-cartes" && (el.id === "motivation" || el.id === "secteur")) {
      for (const o of el.options.filter((x) => x.id !== "autre" && x.id !== "inconnu")) {
        const ms = el.id === "secteur" ? [`secteur-${o.id}`] : mesuresDe(o.effets);
        const effet = el.id === "secteur" ? `Il te ressemble : part de l’emploi dans ce secteur, si tu choisis le critère « Évoluer dans mon secteur » (importance du critère) ou la motivation carrière (0,5). Section CITI ${o.citi}.`
          : `Il te ressemble : ${effetTexte(o.effets)}${o.sansPenalite?.length ? ` ; retire la pénalité « ${o.sansPenalite.join(", ")} »` : ""}`;
        ajouter({ ...base, id: `${el.id}/${o.id}`, texte: o.label, type: typeDe(ms), donnee: donnees(ms), effet, pourquoi: pourquoi(el) });
      }
      continue;
    }
    if (el.type === "tri-zones") {
      for (const c of el.cartes) ajouter({ ...base, id: `valeur/${c.id}`, texte: c.label, type: typeDe(c.mesures), donnee: donnees(c.mesures),
        effet: c.mesures.length ? `Il te ressemble : ${c.mesures.map((m) => mesures[m]?.court ?? m).join(", ")}${c.mesures.length > 1 ? ` (${c.mesures.length} mesures, l’importance 1 partagée entre elles)` : ""} : carte touchée 1, non touchée : rien. 3 cartes au plus.` : "Portrait seulement : pas de donnée pays pour 30 pays (ou licence qui interdit de transformer la note).",
        pourquoi: pourquoi(el) });
      continue;
    }
    if (el.type === "tri-limites") {
      for (const s of el.situations) ajouter({ ...base, id: `limite/${s.id}`, texte: s.texte, type: "Accès", donnee: donnees([s.mesure].filter((m) => mesures[m])),
        effet: "Il t’est accessible : « Je préfère éviter » −10, « Rédhibitoire » −15 aux pays touchés. Jamais retiré du classement ; « Le remonter » annule.",
        condition: [base.condition, s.condition ? `Condition : ${s.condition === "veut-rester" ? "tu veux rester plus d’un an" : "ton ou ta partenaire veut travailler"}` : "", "Posée si elle touche un de tes 10 premiers pays"].filter(Boolean).join(" ; "), pourquoi: pourquoi(el) });
      continue;
    }
    if (el.type === "swipe") {
      for (const ph of el.phrases) { const ms = mesuresDe([...ph.oui, ...ph.non]); ajouter({ ...base, id: `activite/${ph.id}`, texte: ph.texte, type: typeDe(ms), donnee: donnees(ms), effet: ms.length ? `Il te ressemble : « Ça me correspond » : ${effetTexte(ph.oui)}` : "Portrait seulement", pourquoi: pourquoi(el) }); }
      continue;
    }
    // Les autres éléments : une fiche chacun.
    let ms: string[] = [], effet = "", type: TypeItem = "Portrait";
    switch (el.type) {
      case "dilemme": ms = el.options.flatMap((o) => mesuresDe(o.effets)); effet = `Il te ressemble : ${el.options.map((o, i) => `${"AB"[i]} : ${effetTexte(o.effets)}`).join(" ; ")}${el.echelle ? " ; « Un peu » : moitié de l’importance (ou position à mi-chemin de 3)" : ""}`; break;
      case "choix-cartes": ms = (el.options ?? []).flatMap((o) => mesuresDe(o.effets)); effet = ms.length ? `Il te ressemble : ${(el.options ?? []).filter((o) => o.effets?.length).map((o) => `« ${o.label} » : ${effetTexte(o.effets)}`).join(" ; ")}` : el.profil ? `Remplit ton profil (${el.profil})` : "Portrait"; break;
      case "ambiances": ms = el.options.flatMap((o) => mesuresDe(o.effets)); effet = `Il te ressemble : ${el.options.map((o) => `« ${o.label} » : ${effetTexte(o.effets)}`).join(" ; ")}`; break;
      case "carte-monde": ms = ["region-carte"]; effet = "Il te ressemble : bonus d’importance 1,1 aux pays de ta zone, jamais de malus ; pas de bonus pour une zone autour de la France si « Proche de la France » est choisi."; break;
      case "blind-test": ms = el.mesures; effet = "Il te ressemble : les 4 faits montrés deviennent des positions préférées (la note du pays choisi), importance 0,5."; break;
      case "seuil": ms = [el.mesure]; type = "Accès"; effet = "Il t’est accessible : au-delà de ton seuil, « Je préfère éviter » −10, « Rédhibitoire » −15. « Aucune limite » : rien."; break;
      case "thermometre": effet = "Ton niveau d’anglais (moyenne des deux thermomètres) : décide si on te demande « Travailler en anglais, ça te va ? » et si le travail en anglais entre dans ton projet."; break;
      case "timeline": case "enveloppe": type = "Accès"; break;
    }
    if (el.id === "langues") { ms = ["langue"]; effet = "Il te ressemble : « Langue du quotidien » compte pour tous les pays (importance 1) ; un pays où tu parles la langue est noté 5, comme un pays francophone."; }
    if (el.id === "relance-langue") { ms = ["langue-cible"]; effet = "Il te ressemble : bonus d’importance 1 aux pays où cette langue est officielle ou très parlée ; apprendre la langue n’est plus une pénalité."; }
    if (el.id === "objectif") { ms = Object.values(quiz.objectifs).flatMap((o) => o.effets.flatMap((e) => e.mesures)); effet = `Il te ressemble : poids de départ 0,5 par projet (${Object.entries(quiz.objectifs).map(([k, o]) => `${k} : ${o.effets.flatMap((e) => e.mesures).map((m) => mesures[m]?.court ?? m).join(", ")}`).join(" ; ")}), retirés si un dilemme va dans un autre sens. Un projet de PVT fermé à ton âge : impossibilité légale.`; }
    if (ACCES[el.id]) { type = "Accès"; effet = ACCES[el.id]; }
    if (type !== "Accès") type = ms.length ? typeDe(ms) : "Portrait";
    if (el.id === "famille-ecole") effet = "Portrait seulement : pas de donnée sur les écoles en français ; rappelé dans ta checklist.";
    if (el.type === "choix-cartes" && el.source && el.source !== "envies") { type = "Classement"; effet = el.id === "sacrifice" ? "Il te ressemble : ce critère compte 2 (les autres 1,5)." : el.id === "second-plan" ? "Il te ressemble : ce critère compte 1,1." : "Il te ressemble : ce critère non choisi compte 1 ; « Aucun » : rien."; }
    const critere = el.type === "choix-cartes" && !!el.source;
    ajouter({ ...base, id: el.id, texte: el.titre, type, donnee: critere ? "Les données des critères choisis (fiches critere/…)" : type === "Accès" && !ms.length ? (el.id === "budget" ? "Ressources demandées par les PVT : content/portes.json (officiel)" : "Portes d’entrée : content/portes.json, content/double-nationalite.json") : donnees([...new Set(ms)].filter((m) => mesures[m] || m === "secteur")), effet: effet || "Portrait seulement", pourquoi: pourquoi(el) });
  }
  return items;
}
