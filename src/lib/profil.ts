// La couche profil : ce que le site a compris de toi, dimension par dimension, séparé du calcul.
// Pour chaque dimension (salaire, coût de la vie, climat, culture au travail…) : la position ou l'importance,
// la source des réponses (déclaré : envies, limites, thermomètres, secteur ; déduit : dilemmes, curseur,
// phrases, ambiances), et une certitude (faible, moyenne, forte) selon le nombre de réponses et leur cohérence.
// Le calcul des scores lit la partie « importance » (profilCalcul, dans moteur.ts). Aucune IA.
import { dimensionDe, mesures, quiz, trouverElement, type CarteMonde, type EffetDilemme, type Element, type Valeur } from "./donnees";
import { PASSER, certitudeReponse, dimensionsReponse, effetsReponse, optionReponse, type Certitude } from "./elements";
import { enviesDe, listeFr, profilCalcul, type Etat } from "./moteur";
import { pays } from "./pays";
import { lireCarte } from "./zones";

export type Signal = { element: string; declare: boolean; certitude: Certitude; sens: 1 | -1 | 0; position?: number };
export type DimensionProfil = {
  id: string;
  nom: string;
  poids: number; // la plus grande importance d'une mesure de la dimension (0 : ne compte pas)
  position: number | null; // pour la culture au travail, l'hiver, l'été : la position préférée (1 à 5)
  mesures: { mesure: string; poids: number; position?: number }[];
  declare: string[]; // éléments (ou envies) qui l'ont dit directement
  deduit: string[]; // éléments qui le laissent deviner
  reponses: number;
  coherente: boolean;
  certitude: Certitude;
};
export type ProfilStructure = Record<string, DimensionProfil>;

const POINTS: Record<Certitude, number> = { faible: 0.5, moyenne: 1, forte: 1.5 };
const DECLARES = new Set(["choix-cartes", "classement", "tri-limites", "thermometre"]);
const estDeclare = (el: Element) => DECLARES.has(el.type) && !(el.type === "choix-cartes" && el.condition?.startsWith("projet:")) && el.id !== "secteur-ville";

// Ce que les autres réponses possibles d'un élément auraient visé (pour savoir si un choix « tourne le dos » à une dimension).
function alternatives(el: Element): EffetDilemme[][] {
  switch (el.type) {
    case "dilemme": return el.options.map((o) => o.effets);
    case "choix-cartes": return el.profil || el.source ? [] : el.options.map((o) => o.effets ?? []);
    case "curseur": return [el.gauche.effets, el.droite.effets];
    default: return [];
  }
}
const dimsDe = (effets: EffetDilemme[]) => new Set(effets.flatMap((e) => e.mesures.map((m) => dimensionDe[m] ?? m)));

// Les signaux d'une réponse sur chaque dimension : +1 (ça compte), −1 (ça ne compte pas, ou l'autre option était choisie), ou une position.
export function signaux(etat: Etat): Map<string, Signal[]> {
  const res = new Map<string, Signal[]>();
  const ajouter = (d: string, s: Signal) => res.set(d, [...(res.get(d) ?? []), s]);
  enviesDe(etat).forEach((id) => {
    const en = quiz.envies.find((e) => e.id === id);
    for (const m of en?.mesures ?? []) ajouter(dimensionDe[m] ?? m, { element: `envie:${id}`, declare: true, certitude: "forte", sens: 1 });
  });
  for (const id of etat.ordre) {
    const el = trouverElement(id);
    const v = etat.reponses[id];
    if (!el || v === undefined || v === PASSER || el.id === "envies" || el.id === "classement" || el.type === "carte-monde") continue;
    const declare = estDeclare(el);
    if (el.type === "tri-limites") {
      for (const [sid, r] of Object.entries(v as Record<string, string>)) {
        const s = el.situations.find((x) => x.id === sid);
        if (s) ajouter(s.dimension, { element: `limite:${sid}`, declare: true, certitude: "forte", sens: r === "ok" ? -1 : 1 });
      }
      continue;
    }
    if (el.type === "swipe") {
      for (const [pid, r] of Object.entries(v as Record<string, string>)) {
        const p = el.phrases.find((x) => x.id === pid);
        if (!p || r === "depend") continue;
        const effets = r === "oui" ? p.oui : p.non;
        const autres = r === "oui" ? p.non : p.oui;
        for (const d of p.dimensions) {
          const pos = effets.find((e) => e.position !== undefined && e.mesures.some((m) => dimensionDe[m] === d))?.position;
          const vise = dimsDe(effets).has(d);
          ajouter(d, { element: `${id}/${pid}`, declare: false, certitude: "moyenne", sens: pos !== undefined ? 0 : vise ? 1 : dimsDe(autres).has(d) ? -1 : -1, position: pos });
        }
      }
      continue;
    }
    const certitude = certitudeReponse(el, v);
    const choisis = effetsReponse(el, v).map((x) => x.effet);
    const vises = dimsDe(choisis);
    const autres = new Set(alternatives(el).flatMap((x) => [...dimsDe(x)]));
    for (const d of dimensionsReponse(el, v)) {
      const pos = choisis.find((e) => e.position !== undefined && e.mesures.some((m) => (dimensionDe[m] ?? m) === d))?.position;
      const poids = choisis.filter((e) => e.mesures.some((m) => (dimensionDe[m] ?? m) === d)).reduce((a, e) => Math.max(a, e.poids ?? 1), 0);
      // Le curseur au milieu dit « les deux » : pas un refus.
      const sens: 1 | -1 | 0 = pos !== undefined ? 0 : vises.has(d) && poids >= 0.35 ? 1 : autres.has(d) || el.type === "choix-cartes" ? -1 : 0;
      ajouter(d, { element: id, declare, certitude, sens, position: pos });
    }
  }
  return res;
}

// Certitude : points (forte 1,5 ; moyenne 1 ; faible 0,5). Moins de 1,5 : faible ; moins de 2,5 : moyenne ; sinon forte.
// Des réponses qui se contredisent nettement (une forte « ça compte » et une forte « ça ne compte pas »,
// ou deux positions à 3 niveaux ou plus) font baisser la certitude d'un cran.
export function niveauCertitude(liste: Signal[]): { certitude: Certitude; coherente: boolean } {
  const total = liste.reduce((a, s) => a + POINTS[s.certitude], 0);
  const nets = liste.filter((s) => s.certitude !== "faible");
  const positions = liste.map((s) => s.position).filter((p): p is number => p !== undefined);
  const coherente = !(nets.some((s) => s.sens === 1) && nets.some((s) => s.sens === -1)) && !(positions.length > 1 && Math.max(...positions) - Math.min(...positions) >= 3);
  let rang = total < 1.5 ? 0 : total < 2.5 ? 1 : 2;
  if (!coherente) rang = Math.max(0, rang - 1);
  return { certitude: (["faible", "moyenne", "forte"] as Certitude[])[rang], coherente };
}

const memo = new WeakMap<Etat, ProfilStructure>();
export function construireProfil(etat: Etat): ProfilStructure {
  const deja = memo.get(etat);
  if (deja) return deja;
  const calcul = profilCalcul(etat);
  const sig = signaux(etat);
  const res: ProfilStructure = {};
  for (const [id, dim] of Object.entries(quiz.dimensions)) {
    const liste = sig.get(id) ?? [];
    const ms = [...(calcul.get(id)?.values() ?? [])];
    const positions = ms.filter((e) => e.sens === "position" && e.position !== undefined);
    const { certitude, coherente } = niveauCertitude(liste);
    res[id] = {
      id, nom: dim.nom,
      poids: Math.max(0, ...ms.map((e) => e.poids)),
      position: positions.length ? positions.reduce((a, e) => a + (e.position ?? 3), 0) / positions.length : null,
      mesures: ms.map((e) => ({ mesure: e.mesure, poids: e.poids, position: e.position })),
      declare: [...new Set(liste.filter((s) => s.declare).map((s) => s.element))],
      deduit: [...new Set(liste.filter((s) => !s.declare).map((s) => s.element))],
      reponses: liste.length,
      coherente,
      certitude,
    };
  }
  memo.set(etat, res);
  return res;
}

// « Déjà couvert par » : un élément n'est reposé que si l'une de ses dimensions reste à certitude faible.
export const certitudeFaible = (el: Element, etat: Etat) => {
  const p = construireProfil(etat);
  return el.dimensions.some((d) => p[d]?.certitude === "faible");
};

// ---------- Les contradictions ----------
// Des règles simples et prudentes : on ne parle de contradiction que si au moins deux réponses s'opposent nettement
// (une envie bien classée ou une limite d'un côté, une réponse franche, « Plutôt » ou « Ça me correspond », de l'autre).
// Sinon, c'est un compromis, pas une contradiction : on n'en dit rien.
export type Contradiction = { id: string; texte: string; reponses: string[]; revoir: string };
const rangEnvie = (etat: Etat, id: string) => { const i = enviesDe(etat).indexOf(id); return i < 0 ? 99 : i + 1; };
const rep = (etat: Etat, id: string) => etat.reponses[id];
const swipe = (etat: Etat, p: string) => ((rep(etat, "phrases") ?? {}) as Record<string, string>)[p];
const limite = (etat: Etat, s: string) => ((rep(etat, "limites") ?? {}) as Record<string, string>)[s];
const nombre = (v: Valeur | undefined) => (typeof v === "number" ? v : null);

export function contradictions(etat: Etat): Contradiction[] {
  const res: Contradiction[] = [];
  // 1. « Vie pas chère » classée n° 1 ou 2, mais au moins deux fois l'option chère et bien payée.
  const cheres = [rep(etat, "deux-offres") === "a" ? "deux-offres" : "", swipe(etat, "S3") === "oui" ? "phrases" : "", rep(etat, "mission-vie") === "a" ? "mission-vie" : ""].filter(Boolean);
  if (rangEnvie(etat, "prix") <= 2 && cheres.length >= 2) res.push({ id: "prix", reponses: ["envie:prix", ...cheres], revoir: "classement", texte: "Tu as classé « Vie pas chère » tout en haut, mais tu as choisi deux fois la vie chère et bien payée. Les deux comptent dans ton calcul : à toi de voir ce qui pèse le plus." });
  // 2. « Proche de la France », mais 12 h de vol pour Noël, c'est le jeu.
  const loin = [rep(etat, "noel") === "b" || rep(etat, "noel") === "c" ? "noel" : "", swipe(etat, "S6") === "non" ? "phrases" : ""].filter(Boolean);
  if (rangEnvie(etat, "proche") <= 3 && loin.length >= 1) res.push({ id: "proche", reponses: ["envie:proche", ...loin], revoir: loin[0], texte: "Tu as choisi « Proche de la France » parmi tes envies, mais un long vol pour rentrer ne te gêne pas vraiment. On garde la distance dans ton calcul, avec son rang." });
  // 3. « Sécurité », mais une ville où il faut rester vigilant te va.
  const vigilant = [swipe(etat, "S11") === "oui" ? "phrases" : "", rep(etat, "nuit") === "b" ? "nuit" : ""].filter(Boolean);
  if (rangEnvie(etat, "securite") <= 5 && vigilant.length >= 1) res.push({ id: "securite", reponses: ["envie:securite", ...vigilant], revoir: vigilant[0], texte: "Tu as choisi « Sécurité » parmi tes envies, mais tu dis aussi te sentir bien dans une ville où il faut rester vigilant." });
  // 4. « Bon salaire » n° 1, mais le curseur tout près du temps libre.
  const cur = nombre(rep(etat, "equilibre"));
  if (rangEnvie(etat, "salaire") === 1 && cur !== null && cur <= 25) res.push({ id: "salaire", reponses: ["envie:salaire", "equilibre"], revoir: "equilibre", texte: "Ton envie n° 1 est un bon salaire, mais ton curseur penche nettement vers le temps libre." });
  // 5. « Équilibre » n° 1 ou 2, mais le curseur tout près du salaire.
  if (rangEnvie(etat, "equilibre") <= 2 && cur !== null && cur >= 75) res.push({ id: "equilibre", reponses: ["envie:equilibre", "equilibre"], revoir: "equilibre", texte: "Tu as classé l’équilibre vie pro et vie perso tout en haut, mais ton curseur penche nettement vers le salaire." });
  // 6. « Vivre hors d'Europe » rédhibitoire, alors que ta zone sur la carte ne contenait aucun pays européen.
  const carte = lireCarte(trouverElement("carte") as CarteMonde | undefined, rep(etat, "carte"), false);
  const aUneZone = carte.regions.length + carte.cercles.length + carte.groupes.length > 0;
  const zoneEuropeenne = carte.regions.includes("europe") || carte.dansZone.some((id) => pays.find((p) => p.id === id)?.zone === "europe");
  if (limite(etat, "hors-europe") === "redhibitoire" && aUneZone && !zoneEuropeenne) res.push({ id: "europe", reponses: ["limites", "carte"], revoir: "limites", texte: "Tu pensais partir hors d’Europe, mais tu as dit que vivre hors d’Europe était rédhibitoire. Les pays hors d’Europe sont dans « Moins adaptés pour toi » : tu peux les remonter." });
  // 7. Un autre alphabet rédhibitoire, mais « Tu y vas » aux cours de langue.
  if (limite(etat, "alphabet") === "redhibitoire" && rep(etat, "cours-offerts") === "a") res.push({ id: "alphabet", reponses: ["limites", "cours-offerts"], revoir: "limites", texte: "Tu as dit qu’apprendre un autre alphabet était rédhibitoire, mais tu irais aux cours de langue offerts." });
  return res;
}

// ---------- Ton portrait ----------
// Un titre, 4 à 6 phrases nuancées tirées du profil (« Tes réponses montrent… », « Tu acceptes plus facilement… »,
// jamais « Tu es… »), une phrase sur une contradiction s'il y en a une, et « Ce qu'on va chercher pour toi » (3 critères).
export type LignePortrait = { cle: string; texte: string; revoir: { t: "element"; id: string } | null };
export type Portrait = { titre: string; lignes: LignePortrait[]; contradiction: LignePortrait | null; cherche: string[] };
export const MAX_PORTRAIT = 6;
const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const TITRES: Record<string, string> = {
  salaire: "Tu cherches avant tout une expérience qui fait avancer ta carrière",
  emploi: "Tu cherches avant tout une expérience qui fait avancer ta carrière",
  secteur: "Tu cherches avant tout une expérience qui fait avancer ta carrière",
  equilibre: "Tu cherches avant tout un bon équilibre entre travail et vie perso",
  cout: "Tu cherches avant tout une vie à l’étranger qui reste abordable",
  climat: "Tu cherches avant tout un cadre de vie qui te ressemble",
  ville: "Tu cherches avant tout un cadre de vie qui te ressemble",
  distance: "Tu cherches avant tout un départ qui te garde proche des tiens",
  reseau: "Tu cherches avant tout un départ entouré, avec des repères",
  securite: "Tu cherches avant tout un pays sûr et stable",
  sante: "Tu cherches avant tout un pays où tu te sens protégé au quotidien",
  valeurs: "Tu cherches avant tout un pays sûr et stable",
  langue: "Tu cherches avant tout un pays où la langue ne sera pas un mur",
};
const TITRE_TRAVAIL: Record<string, string> = {
  carriere: "Tu cherches avant tout une expérience qui fait avancer ta carrière",
  "premier-poste": "Tu cherches avant tout un premier poste qui lance ta vie pro",
  "stage-vie": "Tu cherches avant tout une première expérience qui compte sur ton CV",
  aventure: "Tu cherches avant tout une année d’aventure où le travail se trouve facilement",
};
const CULTURE = ["hierarchie", "communication", "ponctualite", "decision", "pro-perso"];

// La phrase de portrait d'une réponse (dilemme, curseur, phrase, ambiance, question du projet).
function phrasesReponse(etat: Etat, id: string): { texte: string; poids: number; accepte: boolean; dims: string[] }[] {
  const el = trouverElement(id);
  const v = etat.reponses[id];
  if (!el || v === undefined || v === PASSER) return [];
  const poids = (effets: EffetDilemme[]) => effets.reduce((a, e) => a + (e.position !== undefined ? 1 : (e.poids ?? 1)), 0);
  switch (el.type) {
    case "dilemme": {
      const o = optionReponse(el, v);
      return o?.portrait ? [{ texte: o.portrait, poids: poids(o.effets) * (String(v).startsWith("peu-") ? 0.5 : 1), accepte: o.effets.length === 0, dims: el.dimensions }] : [];
    }
    case "curseur": {
      const n = v as number;
      if (n > 35 && n < 65) return [];
      const pole = n <= 35 ? el.gauche : el.droite;
      return [{ texte: pole.portrait, poids: Math.abs(n - 50) / 50, accepte: false, dims: el.dimensions }];
    }
    case "swipe": return Object.entries(v as Record<string, string>).flatMap(([pid, r]) => {
      const p = el.phrases.find((x) => x.id === pid);
      if (!p || r === "depend") return [];
      const effets = r === "oui" ? p.oui : p.non;
      return [{ texte: r === "oui" ? p.portraitOui : p.portraitNon, poids: poids(effets) * 0.8, accepte: effets.length === 0, dims: p.dimensions }];
    });
    case "ambiances": return (v as string[]).flatMap((oid) => {
      const o = el.options.find((x) => x.id === oid);
      return o?.portrait ? [{ texte: o.portrait, poids: 0.9, accepte: false, dims: el.dimensions }] : [];
    });
    case "choix-cartes": {
      if (el.profil || el.source) return [];
      const o = el.options.find((x) => x.id === v);
      return o?.portrait ? [{ texte: o.portrait, poids: poids(o.effets ?? []), accepte: (o.effets ?? []).length === 0, dims: el.dimensions }] : [];
    }
    default: return [];
  }
}

export function portraitComplet(etat: Etat): Portrait {
  const profil = construireProfil(etat);
  const dims = Object.values(profil).filter((d) => d.poids > 0).sort((a, b) => b.poids - a.poids);
  const premiere = dims.find((d) => TITRES[d.id]) ?? null;
  const obj = typeof etat.profil.objectif === "string" ? etat.profil.objectif : undefined;
  let titre = premiere ? TITRES[premiere.id] : CULTURE.some((c) => profil[c]?.poids) ? "Tu cherches avant tout une culture de travail qui te ressemble" : "Tu cherches un pays qui te ressemble";
  if (obj === "aventure" && premiere && ["cout", "climat", "ville"].includes(premiere.id)) titre = "Tu cherches avant tout une aventure qui te ressemble, sans te ruiner";
  // Le travail en tête : la phrase suit ton projet (un PVT de petits boulots ne parle pas de « carrière »).
  if (premiere && ["salaire", "emploi", "secteur"].includes(premiere.id)) titre = TITRE_TRAVAIL[obj ?? ""] ?? "Tu cherches avant tout un pays où le travail ne manque pas";
  if (premiere?.id === "depaysement") titre = obj === "aventure" ? "Tu cherches avant tout une aventure loin de tes repères" : "Tu cherches avant tout un vrai dépaysement";

  const lignes: LignePortrait[] = [];
  const projet = obj ? quiz.objectifs[obj] : undefined;
  if (projet) lignes.push({ cle: "objectif", texte: `Tu pars pour ${projet.nom}.`, revoir: { t: "element", id: "objectif" } });
  // Ce qui compte beaucoup, avec une certitude forte ou moyenne.
  const fortes = dims.filter((d) => d.poids >= 1.25 && d.certitude !== "faible" && !CULTURE.includes(d.id)).slice(0, 3);
  if (fortes.length) lignes.push({ cle: "fortes", texte: `Tes réponses montrent que ${listeFr(fortes.map((d) => minuscule(d.nom)))} ${fortes.length > 1 ? "comptent" : "compte"} beaucoup pour toi.`, revoir: { t: "element", id: "classement" } });
  // La culture au travail, en une phrase.
  const styles = etat.ordre.flatMap((id) => {
    const el = trouverElement(id);
    if (el?.type !== "dilemme" || !el.axe) return [];
    const o = optionReponse(el, etat.reponses[id]);
    return o?.style ? [{ id, style: o.style }] : [];
  });
  if (styles.length) lignes.push({ cle: "style", texte: `Au travail, tu préfères ${listeFr(styles.map((s) => s.style))}.`, revoir: { t: "element", id: styles[0].id } });
  // Les réponses les plus fortes, sans répéter une dimension déjà dite ni une envie ; puis ce que tu acceptes plus facilement.
  const dites = new Set([...fortes.map((d) => d.id), ...(styles.length ? CULTURE : [])]);
  const enviesDims = new Set(enviesDe(etat).flatMap((id) => quiz.envies.find((e) => e.id === id)?.mesures.map((m) => dimensionDe[m] ?? m) ?? []));
  const candidates = etat.ordre.flatMap((id, rang) => phrasesReponse(etat, id).map((p) => ({ ...p, id, rang })));
  const vues = new Set<string>();
  const accepte: { texte: string; id: string }[] = [];
  for (const c of [...candidates].sort((a, b) => b.poids - a.poids || a.rang - b.rang)) {
    if (lignes.length >= MAX_PORTRAIT - 1) break;
    if (vues.has(c.texte) || /^Tu es\b/.test(c.texte)) continue;
    if (c.accepte) { accepte.push({ texte: c.texte, id: c.id }); continue; }
    if (c.dims.some((d) => dites.has(d)) || c.dims.every((d) => enviesDims.has(d) && profil[d]?.coherente)) continue;
    vues.add(c.texte);
    c.dims.forEach((d) => dites.add(d));
    lignes.push({ cle: `element:${c.id}:${lignes.length}`, texte: c.texte, revoir: { t: "element", id: c.id } });
  }
  if (accepte.length && lignes.length < MAX_PORTRAIT) {
    const a = accepte[0];
    const t = /^Tu acceptes plus facilement/.test(a.texte) ? a.texte : `Tu acceptes plus facilement certains compromis : ${minuscule(a.texte)}`;
    lignes.push({ cle: `accepte:${a.id}`, texte: t, revoir: { t: "element", id: a.id } });
  }
  // Tes limites, en une phrase.
  const lim = (rep(etat, "limites") ?? {}) as Record<string, string>;
  const situ = (s: string) => { const el = trouverElement("limites"); return el?.type === "tri-limites" ? el.situations.find((x) => x.id === s)?.texte ?? s : s; };
  const eviter = Object.entries(lim).filter(([, r]) => r === "eviter").map(([s]) => minuscule(situ(s)));
  const non = Object.entries(lim).filter(([, r]) => r === "redhibitoire").map(([s]) => minuscule(situ(s)));
  if ((eviter.length || non.length) && lignes.length < MAX_PORTRAIT) {
    const morceaux = [eviter.length ? `Tu préfères éviter${" "}: ${listeFr(eviter)}.` : "", non.length ? `Hors de question pour toi${" "}: ${listeFr(non)}.` : ""].filter(Boolean);
    lignes.push({ cle: "limites", texte: morceaux.join(" "), revoir: { t: "element", id: "limites" } });
  }
  const c = contradictions(etat)[0];
  const contradiction = c ? { cle: `contradiction:${c.id}`, texte: c.texte, revoir: { t: "element" as const, id: c.revoir } } : null;
  // Ce qu'on va chercher pour toi : les 3 critères les plus importants.
  const cherche = [...profilCalcul(etat).values()].flatMap((m) => [...m.values()])
    .filter((e) => !mesures[e.mesure]?.interne)
    .sort((a, b) => b.poids - a.poids)
    .map((e) => mesures[e.mesure]?.court ?? mesures[e.mesure]?.nom ?? e.mesure)
    .filter((x, i, l) => l.indexOf(x) === i)
    .slice(0, 3);
  return { titre, lignes: lignes.slice(0, MAX_PORTRAIT), contradiction, cherche };
}

// Les phrases du portrait, à plat (PDF, résumé).
export function portrait(etat: Etat): LignePortrait[] {
  const p = portraitComplet(etat);
  return [...p.lignes, ...(p.contradiction ? [p.contradiction] : [])];
}
