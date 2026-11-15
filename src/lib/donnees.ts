// Charge les fichiers de /content et leur donne un type.
import criteresData from "../../content/criteres.json";
import scoresData from "../../content/scores.json";
import quizData from "../../content/quiz.json";
import sourcesData from "../../content/sources.json";
import portesData from "../../content/portes.json";
import avisData from "../../content/saisie/avis.json";
import doubleData from "../../content/double-nationalite.json";

export type TypeSource = "officiel" | "donnee-ouverte" | "notre-avis";
export type FamilleScore = "travailler" | "vivre" | "valeurs";
export type Sens = "haut" | "bas";

export type Source = { nom: string; url: string; licence: string; type: TypeSource; page?: string };

export type DefMesure = {
  id: string;
  nom: string;
  sens: "haut" | "position";
  fait?: string | string[]; // la phrase du résultat : un modèle avec {mot}, ou une phrase par niveau
  unite?: string;
  bornes?: number[];
  notes?: number[];
  echelle: string[];
  mots: string[];
  explications?: string[];
  regle?: string;
};

export type Critere = {
  numero: number;
  id: string;
  famille: "partir" | FamilleScore;
  nom: string;
  definition: string;
  type: TypeSource;
  role?: string;
  echelle?: string[];
  sources: string[];
  mesures: DefMesure[];
};

export type Note = {
  statut: "verifie" | "a-verifier";
  note: number | null;
  texte: string;
  valeur?: number;
  annee?: string | null;
  source?: string | null;
  lien?: string | null;
  verifieLe?: string | null;
};

// Un dilemme : une scène, 2 ou 3 options. Chaque option agit sur des mesures existantes.
// « poids » pour une mesure « haut » (1 = normal, 0,5 = léger) ; « position » pour une mesure « position ».
export type EffetDilemme = { mesures: string[]; poids?: number; position?: number };
export type OptionDilemme = {
  id: string;
  texte: string;
  detail?: string; // la ligne grise : l'avantage ou le prix de l'option
  effets: EffetDilemme[];
  ecart?: { regle: string; raison: string }; // fait descendre des pays dans « Moins adaptés pour toi »
  portrait: string; // la phrase du portrait si tu choisis cette option
  preference?: string; // ce que tu préfères, pour « À savoir » (« tu préférais un hiver doux »)
  style?: string; // pour « Ton profil de travail »
};
export type Dilemme = {
  id: string;
  theme: string;
  titre: string;
  scene: string;
  pourquoi: string;
  exemple?: boolean; // les montants et durées sont des exemples fictifs
  axe?: string; // axe du style de travail
  afficheSi?: string;
  regleAffichage?: string;
  options: OptionDilemme[];
};

export type OptionProfil = { id: string; label: string; ageMax?: number; euros?: number; mois?: number; codes?: string[] };
export type QuestionProfil = {
  id: string;
  question: string;
  pourquoi: string;
  influence: string[];
  multiple?: boolean;
  aucun?: string;
  afficheSi?: string;
  regleAffichage?: string;
  options: OptionProfil[];
};
// Ton projet donne des poids de départ, plus légers qu'une réponse de dilemme.
export type Objectif = { nom: string; explication: string; effets: { mesures: string[]; afficheSi?: string }[] };
export type Priorite = { id: string; label: string; icone: string; famille: FamilleScore; mesures: string[]; sens: Sens };
export type Sujet = { id: string; label: string; mesure: string };

export type PorteBrute = {
  type: "ue" | "pvt" | "vie" | "visa-travail";
  nom: string;
  texte: string;
  ageMax?: number;
  quota?: number | null;
  invitation?: boolean;
  invitationTexte?: string;
  invitationSource?: { source: string; lien: string; verifieLe: string };
  fonds?: { texte: string; euros: number | null };
  dureeMois?: number;
  employeur?: boolean;
  conditions?: string[];
  detailsAVerifier?: boolean; // l'entrée est vérifiée, mais pas les conditions détaillées du visa de travail
  source: string | null;
  lien: string | null;
  verifieLe: string | null;
  statut: "verifie" | "a-verifier";
};

export type Avis = { langues: string[]; francaisAuTravail: boolean; autreEcriture: boolean };

export type CasDouble = {
  id: string;
  nationalite: string;
  pays: string;
  genre: "avantage" | "piege";
  titre: string;
  texte: string;
  source: string;
  lien: string;
  licence: string;
  type: TypeSource;
  verifieLe: string;
  acces?: string; // si ce cas t'ouvre le pays : la phrase affichée avec le badge
};

export const criteres = criteresData as Critere[];
export const sources = sourcesData as Record<string, Source>;
export const quiz = quizData as unknown as {
  profil: QuestionProfil[];
  objectifs: Record<string, Objectif>;
  priorites: Priorite[];
  sujets: Sujet[];
  dilemmes: Dilemme[];
};
const scores = scoresData as unknown as {
  genereLe: string;
  villes: Record<string, { nom: string; lat: number; lon: number; fuseau: string }>;
  pays: Record<string, Record<string, Note>>;
};
export const dateDonnees = scores.genereLe;
export const notes = scores.pays;
const portesToutes = portesData as unknown as Record<string, PorteBrute[] | Record<string, unknown>>;
export const portes = (id: string) => (portesToutes[id] as PorteBrute[]) ?? [];
export type PresenceVie = { texte: string; source: string; lien: string; verifieLe: string };
export const vie = portesToutes._vie as unknown as PorteBrute & { ageMaxCandidature: number; presence?: Record<string, PresenceVie> };
export const avis = avisData as unknown as Record<string, Avis>;
export const doubleNationalite = doubleData as unknown as { cas: CasDouble[]; autre: string; autresPays: string; avertissement: string };

export const mesures: Record<string, DefMesure & { critere: Critere }> = Object.fromEntries(
  criteres.flatMap((c) => c.mesures.map((m) => [m.id, { ...m, critere: c }])),
);

export const LIBELLE_TYPE: Record<TypeSource | "a-verifier", string> = {
  officiel: "Officiel",
  "donnee-ouverte": "Donnée ouverte",
  "notre-avis": "Notre avis",
  "a-verifier": "À vérifier",
};

// Une phrase courte pour expliquer chaque étiquette, la première fois qu'on la rencontre.
export const EXPLICATION_TYPE: Record<TypeSource | "a-verifier", string> = {
  officiel: "Information lue sur le site d’un État ou d’un organisme public.",
  "donnee-ouverte": "Chiffre tiré d’une base de données publique, libre de réutilisation (donnée ouverte).",
  "notre-avis": "Jugement de la rédaction, justifié par écrit. C’est un avis, pas un fait.",
  "a-verifier": "Information pas encore vérifiée sur une source officielle.",
};

// Une preuve : ce qu'on affiche quand la personne touche une pastille.
export type Preuve = {
  type: TypeSource | "a-verifier";
  titre: string;
  texte: string;
  source: string | null;
  lien: string | null;
  page?: string | null; // page de présentation lisible de la source, si le lien est un fichier brut
  verifieLe: string | null;
  licence: string | null;
};

export function preuveMesure(paysId: string, mesureId: string): Preuve {
  const n = notes[paysId]?.[mesureId];
  const m = mesures[mesureId];
  if (!n || n.statut !== "verifie" || !n.source) {
    return { type: "a-verifier", titre: m?.nom ?? mesureId, texte: n?.texte ?? "À vérifier.", source: null, lien: null, verifieLe: null, licence: null };
  }
  const s = sources[n.source];
  return {
    type: s.type,
    titre: m.nom,
    texte: n.texte,
    source: s.nom,
    lien: n.lien ?? (s.url.startsWith("http") ? s.url : null),
    // Les liens de données ouvertes sont des fichiers bruts : on donne aussi la page de présentation.
    page: n.lien && s.page && n.lien !== s.page ? s.page : null,
    verifieLe: n.verifieLe ?? null,
    licence: s.licence,
  };
}

export function preuveSource(titre: string, texte: string, sourceId: string | null, lien: string | null, verifieLe: string | null): Preuve {
  const s = sourceId ? sources[sourceId] : null;
  if (!s) return { type: "a-verifier", titre, texte, source: null, lien: null, verifieLe: null, licence: null };
  return { type: s.type, titre, texte, source: s.nom, lien: lien ?? s.url, verifieLe, licence: s.licence };
}

export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
