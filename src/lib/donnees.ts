// Charge les fichiers de /content et leur donne un type.
import criteresData from "../../content/criteres.json";
import scoresData from "../../content/scores.json";
import quizData from "../../content/quiz.json";
import sourcesData from "../../content/sources.json";
import portesData from "../../content/portes.json";
import avisData from "../../content/saisie/avis.json";
import doubleData from "../../content/double-nationalite.json";
import glossaireData from "../../content/glossaire.json";

export type TypeSource = "officiel" | "donnee-ouverte" | "notre-avis" | "temoignages";
// Confiance d'une note tirée de témoignages : « bonne » (sources nombreuses et concordantes) ou « moyenne ».
export type Confiance = "bonne" | "moyenne";
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
  interne?: boolean; // mesure de calcul seulement (pénalité d'un dilemme) : pas de carte dans la fiche pays
  court?: string; // libellé court et compréhensible (« Sécurité », pas « Homicides pour 100 000 habitants »)
  affichage?: string; // la vraie valeur avec son unité : « {v} h de vol »
  affichageSingulier?: string; // sous 2 : « 0,6 homicide »
  decimales?: number;
  theme?: string; // pour les phrases de synthèse : « la distance », « le climat »
  etiquettes?: string[]; // un mot par niveau, à côté de la valeur : « Très sûr », « Hiver doux »
  avertissement?: string; // une phrase de prudence affichée dans la fenêtre de preuve (salaire brut moyen…)
  sujet?: string; // pour le départage : « l’Allemagne et la Belgique diffèrent surtout sur la ponctualité »
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
  liens?: string[]; // témoignages : toutes les sources, au moins deux
  confiance?: Confiance;
  ancien?: { valeur: number; annee: string }; // valeur écartée (année trop éloignée des autres pays), hors calcul
  resteSur100?: number; // salaire : ce qui reste sur 100 € bruts après impôt sur le revenu et cotisations (OCDE), hors score
  ville?: string | null; // indemnité VIE : la ville retenue pour le score
  autres?: { ville: string; montant: number | null }[]; // indemnité VIE : les autres villes du barème
};

// « Pourquoi on te demande ça » : une phrase d'enjeu, puis une mini-carte par option (ou groupe d'options).
// 60 mots au maximum en tout (vérifié par npm run test:moteur).
export type Aide = { enjeu: string; cartes: { pastille: string; texte: string }[] };

// Un dilemme : une mesure, 2 options (A et B), et plusieurs scènes de la vie réelle qui posent la même question.
// Chaque option agit sur des mesures existantes : « poids » pour une mesure « haut » (1 = normal, 0,5 = léger),
// « position » pour une mesure « position ». Les effets sont ceux du dilemme : la scène ne change que les mots.
export type EffetDilemme = { mesures: string[]; poids?: number; position?: number };
export type OptionDilemme = {
  id: string;
  effets: EffetDilemme[];
  portrait: string; // la phrase du portrait si tu choisis cette option
  portraitPeu?: string; // la phrase du portrait pour « Un peu A » (dilemmes en échelle)
  preference?: string; // ce que tu préfères, pour « À savoir » (« tu préférais un hiver doux »)
  preferencePeu?: string;
  style?: string; // pour la phrase de style de travail du portrait
};
// Une option dans une scène : son texte, son avantage (+) et son prix (−), affichés sur la carte.
export type OptionScene = { texte: string; plus: string; moins: string };
export type Scene = {
  id: string;
  titre: string;
  texte: string;
  exemple?: boolean; // les montants et durées sont des exemples fictifs
  options: OptionScene[]; // dans l'ordre des options du dilemme
  variantes?: Record<string, string>; // le texte de la scène selon ton projet (« ta mission de VIE », « ton job de PVT »)
  variantesTitre?: Record<string, string>; // le titre de la scène selon ton projet (« La recherche de poste »)
};

// ---------- La banque d'éléments (prompt 3f) ----------
// Tout ce que le quiz montre est un élément : une question du profil, une carte, un dilemme, un curseur…
// Chaque élément a un format (« type »), un chapitre, un thème, les dimensions du profil qu'il touche,
// et des conditions d'apparition. Un composant React par format (src/components/formats).
export type TypeElement = "choix-cartes" | "classement" | "curseur" | "swipe" | "ambiances" | "thermometre" | "carte-monde" | "tri-limites" | "dilemme";
type BaseElement = {
  id: string;
  chapitre: number;
  theme: string;
  titre: string;
  texte?: string;
  aide: Aide;
  dimensions: string[]; // les dimensions du profil touchées (salaire, climat, langue…)
  condition?: string; // condition d'apparition (projet, secteur, langues, anglais…)
  regleAffichage?: string;
  dejaCouvertPar?: string[]; // si l'un de ces éléments a déjà mesuré la même chose, celui-ci n'est posé que si la certitude reste faible
  obligatoire?: boolean; // toujours posé dans son chapitre
};
// Une carte (choix unique ou multiple). « profil » : la réponse remplit ce champ de ton profil (âge, projet…).
export type OptionCarte = {
  id: string; label: string; phrase?: string; icone?: string; plus?: string; moins?: string;
  effets?: EffetDilemme[]; portrait?: string; sansPenalite?: string[]; citi?: string;
  ageMax?: number; min?: number; max?: number; mois?: number; codes?: string[];
};
export type ChoixCartes = BaseElement & {
  type: "choix-cartes"; profil?: string; source?: "envies"; multiple?: boolean; nombre?: number; aucun?: string;
  sansImage?: boolean; avecPlusMoins?: boolean; options: OptionCarte[];
};
export type Classement = BaseElement & { type: "classement"; source: "envies" };
export type Pole = { label: string; effets: EffetDilemme[]; portrait: string };
export type Curseur = BaseElement & { type: "curseur"; gauche: Pole; droite: Pole; libelles: { jusqua: number; texte: string }[] };
export type PhraseSwipe = { id: string; texte: string; oui: EffetDilemme[]; non: EffetDilemme[]; portraitOui: string; portraitNon: string; dimensions: string[] };
export type Swipe = BaseElement & { type: "swipe"; nombre: number; phrases: PhraseSwipe[] };
export type Ambiances = BaseElement & { type: "ambiances"; max: number; options: (OptionCarte & { effets: EffetDilemme[] })[] };
export type Thermometre = BaseElement & { type: "thermometre"; niveaux: string[] };
export type Zone = { id: string; label: string; detail?: string; pays: string[] };
export type CarteMonde = BaseElement & { type: "carte-monde"; zones: Zone[] };
export type Situation = { id: string; texte: string; mesure: string; raison: string; dimension: string };
export type TriLimites = BaseElement & { type: "tri-limites"; nombre: number; situations: Situation[] };
export type Dilemme = BaseElement & {
  type: "dilemme";
  echelle?: boolean; // 4 réponses : Plutôt A, Un peu A, Un peu B, Plutôt B
  axe?: string; // axe du style de travail
  afficheSi?: string;
  options: OptionDilemme[];
  scenes: Scene[];
};
export type Element = ChoixCartes | Classement | Curseur | Swipe | Ambiances | Thermometre | CarteMonde | TriLimites | Dilemme;
export const TYPES_ELEMENT: TypeElement[] = ["choix-cartes", "classement", "curseur", "swipe", "ambiances", "thermometre", "carte-monde", "tri-limites", "dilemme"];

// Le schéma de réponse commun : une valeur par élément, ou « passer ».
// choix-cartes : un identifiant (ou une liste) ; classement et ambiances : une liste ; curseur : 0 à 100 ;
// thermomètre : 1 à 5 ; carte : une liste de zones, ou ["aucune"] ; swipe et tri des limites : une réponse par phrase ou situation.
export type Valeur = string | string[] | number | Record<string, string>;

export type Chapitre = { numero: number; titre: string; phrase: string; adaptatif?: boolean; min?: number; max?: number };
export type Envie = { id: string; label: string; icone: string; famille: FamilleScore; mesures: string[] };
export type Dimension = { nom: string; mesures: string[] };

// Budget : une tranche (« de 2 000 à 5 000 € ») : min et max en euros (pas de max pour « plus de 10 000 € »).
export type OptionProfil = OptionCarte;
export type QuestionProfil = { id: string; question: string; aide: Aide; multiple?: boolean; aucun?: string; afficheSi?: string; regleAffichage?: string; options: OptionProfil[] };
// Ton projet donne des poids de départ, plus légers qu'une réponse de dilemme.
export type Objectif = { nom: string; explication: string; effets: { mesures: string[]; afficheSi?: string }[] };

// Le visa de travail, lu sur la page officielle du pays (prompt 3c).
// « statut » : « verifie » (pastille Officiel) ou « a-verifier » (lu sur une page officielle, pas encore vérifié en détail).
export type LieEmployeur = "oui" | "partiellement" | "non" | "a-verifier";
export type DetailVisa = {
  nom: string;
  employeurRequis: boolean;
  lieEmployeur: LieEmployeur;
  experience?: string; // diplôme ou expérience exigés, mis en avant pour un jeune diplômé
  jeuneDiplome?: string;
  conditions: string[];
  liens: { url: string; libelle: string }[];
  source: string;
  statut: "verifie" | "a-verifier";
  verifieLe: string;
};
// Le statut du moment d'une porte (exemple : saison du PVT fermée), avec sa source.
export type StatutPorte = { texte: string; citation: string; source: string; lien: string; datePage: string; verifieLe: string; statut?: "verifie" | "a-verifier" };
// Une note sourcée attachée à une porte : changement de procédure, visa jeunes fermé, contexte de sécurité.
export type NotePorte = { texte: string; source: string; lien: string; verifieLe: string; statut?: "verifie" | "a-verifier" };

export type PorteBrute = {
  type: "ue" | "pvt" | "vie" | "visa-travail" | "visas-jeunes";
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
  detail?: DetailVisa;
  saison?: StatutPorte;
  fondsAVerifier?: boolean; // les ressources demandées ne sont pas claires (pages officielles contradictoires)
  changement?: NotePorte; // la procédure change bientôt
  jeunes?: NotePorte; // visa jeunes : ouvert ou non aux Français
  securite?: NotePorte; // contexte de sécurité (France Diplomatie)
  visas?: DetailVisa[]; // « visas-jeunes » : stage, formation, premier emploi
  datePage?: string;
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
const banque = quizData as unknown as {
  chapitres: Chapitre[];
  objectifs: Record<string, Objectif>;
  envies: Envie[];
  poidsRang: number[];
  dimensions: Record<string, Dimension>;
  elements: Element[];
};
const elementsBanque = banque.elements;
export const quiz = {
  ...banque,
  dilemmes: elementsBanque.filter((e): e is Dilemme => e.type === "dilemme"),
  // Les questions du profil (âge, projet, langues…) : les cartes qui remplissent un champ du profil.
  profil: elementsBanque.filter((e): e is ChoixCartes => e.type === "choix-cartes" && !!e.profil).map((e) => ({
    id: e.profil!, question: e.titre, aide: e.aide, multiple: e.multiple, aucun: e.aucun, afficheSi: e.condition, regleAffichage: e.regleAffichage, options: e.options,
  })) as QuestionProfil[],
};
export const trouverElement = (id: string) => elementsBanque.find((e) => e.id === id);
// Une mesure → sa dimension du profil.
export const dimensionDe: Record<string, string> = Object.fromEntries(Object.entries(banque.dimensions).flatMap(([d, x]) => x.mesures.map((m) => [m, d])));

const scores = scoresData as unknown as {
  genereLe: string;
  villes: Record<string, { nom: string; lat: number; lon: number; fuseau: string }>;
  pays: Record<string, Record<string, Note>>;
  reference?: { france?: { nom: string; notes: Record<string, Note> } };
};
export const dateDonnees = scores.genereLe;
export const notes = scores.pays;
// La France : pays repère, jamais classé. Mêmes sources et mêmes règles que les 30 pays.
export const notesFrance: Record<string, Note> = scores.reference?.france?.notes ?? {};
const portesToutes = portesData as unknown as Record<string, PorteBrute[] | Record<string, unknown>>;
export const portes = (id: string) => (portesToutes[id] as PorteBrute[]) ?? [];
export type PresenceVie = { texte: string; source: string; lien: string; verifieLe: string };
export const vie = portesToutes._vie as unknown as PorteBrute & {
  ageMaxCandidature: number; dureeMoisMin: number; dureeMoisMax: number; presence?: Record<string, PresenceVie>;
  resume: string[]; offres: { url: string; nom: string; source: string; verifieLe: string };
};
// L'indemnité VIE d'un pays en une phrase (barème officiel, voir scripts/vie.mjs), ou null.
export const RAPPEL_VIE = "Barème du 1er octobre 2026 : révisé chaque trimestre ; l’indemnité supplémentaire est réduite de 20 % si l’entreprise te loge.";
export function phraseIndemniteVie(paysId: string): string | null {
  const n = notes[paysId]?.["indemnite-vie"];
  if (!n || n.statut !== "verifie" || typeof n.valeur !== "number") return null;
  const euro = (x: number) => `${Math.round(x).toLocaleString("fr-FR")}\u00a0€`;
  return `Indemnité VIE${n.ville ? ` (${n.ville})` : ""}\u00a0: ${euro(n.valeur)} par mois${n.autres?.length ? ` ; ${n.autres.map((a) => `${a.ville}\u00a0: ${a.montant ? euro(a.montant) : "à vérifier"}`).join("\u00a0; ")}` : ""}.`;
}
export const avis = avisData as unknown as Record<string, Avis>;
// « Europe sans visa » : ce qui diffère entre l'Union, la Norvège et la Suisse, avec ses sources.
export type NoteSourcee = { texte: string; source: string; lien: string; verifieLe: string; datePage?: string; court?: string; etape?: string };
export const europe = portesToutes._europe as unknown as { texte: string; court: string; inscription: NoteSourcee; pays: Record<string, NoteSourcee> };
export const doubleNationalite = doubleData as unknown as { cas: CasDouble[]; autre: string; autresPays: string; avertissement: string };

export const mesures: Record<string, DefMesure & { critere: Critere }> = Object.fromEntries(
  criteres.flatMap((c) => c.mesures.map((m) => [m.id, { ...m, critere: c }])),
);

export const LIBELLE_TYPE: Record<TypeSource | "a-verifier", string> = {
  officiel: "Officiel",
  "donnee-ouverte": "Donnée ouverte",
  "notre-avis": "Notre avis",
  temoignages: "Témoignages",
  "a-verifier": "À vérifier",
};

// Les petites définitions au toucher (PVT, VIE, PPA…), toutes dans content/glossaire.json.
export type CleGlossaire = keyof typeof glossaireData;
export const glossaire = glossaireData as Record<CleGlossaire, { terme: string; definition: string }>;

// Une phrase courte pour expliquer chaque étiquette, la première fois qu'on la rencontre.
export const EXPLICATION_TYPE: Record<TypeSource | "a-verifier", string> = {
  officiel: glossaire.officiel.definition,
  "donnee-ouverte": glossaire["donnee-ouverte"].definition,
  "notre-avis": glossaire["notre-avis"].definition,
  temoignages: glossaire.temoignages.definition,
  "a-verifier": glossaire["a-verifier"].definition,
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
  liens?: string[]; // témoignages : la liste des sources
  confiance?: Confiance;
  annee?: string | null; // l'année de la donnée, toujours dite quand elle est connue
  avertissement?: string | null; // une phrase de prudence propre à la mesure
};

export function preuveMesure(paysId: string, mesureId: string): Preuve {
  const n = notes[paysId]?.[mesureId];
  const m = mesures[mesureId];
  if (!n || n.statut !== "verifie" || !n.source) {
    return { type: "a-verifier", titre: m?.nom ?? mesureId, texte: n?.texte ?? "À vérifier.", source: null, lien: null, verifieLe: null, licence: null, avertissement: m?.avertissement ?? null };
  }
  const s = sources[n.source];
  return {
    type: s.type,
    titre: m.nom,
    // Un avis sans phrase rédigée : on affiche l'explication du niveau, jamais une fenêtre vide.
    texte: n.texte || (n.note !== null ? (m.explications?.[n.note - 1] ?? m.mots[n.note - 1]) : ""),
    source: s.nom,
    lien: n.lien ?? (s.url.startsWith("http") ? s.url : null),
    // Les liens de données ouvertes sont des fichiers bruts : on donne aussi la page de présentation.
    page: n.lien && s.page && n.lien !== s.page ? s.page : null,
    verifieLe: n.verifieLe ?? null,
    licence: s.licence,
    annee: n.annee ?? null,
    avertissement: m.avertissement ?? null,
    ...(s.type === "temoignages" ? { liens: n.liens ?? [], confiance: n.confiance } : {}),
  };
}

// La preuve d'une note de porte : « À vérifier » garde le lien de la page lue.
export function preuveNote(titre: string, n: NotePorte): Preuve {
  const p = preuveSource(titre, n.texte, n.source, n.lien, n.verifieLe);
  return n.statut === "a-verifier" ? { ...p, type: "a-verifier" } : p;
}

export function preuveSource(titre: string, texte: string, sourceId: string | null, lien: string | null, verifieLe: string | null): Preuve {
  const s = sourceId ? sources[sourceId] : null;
  if (!s) return { type: "a-verifier", titre, texte, source: null, lien: null, verifieLe: null, licence: null };
  return { type: s.type, titre, texte, source: s.nom, lien: lien ?? s.url, verifieLe, licence: s.licence };
}

// La preuve d'un visa de travail. « À vérifier » garde le lien de la page officielle lue.
export function preuveVisa(d: DetailVisa): Preuve {
  const s = sources[d.source];
  const texte = d.conditions.length ? d.conditions.join(" ") : "Conditions à vérifier sur le site officiel.";
  if (d.statut === "verifie") return { type: s.type, titre: d.nom, texte, source: s.nom, lien: d.liens[0]?.url ?? s.url, verifieLe: d.verifieLe, licence: s.licence };
  return { type: "a-verifier", titre: d.nom, texte, source: s?.nom ?? null, lien: d.liens[0]?.url ?? null, verifieLe: d.verifieLe, licence: s?.licence ?? null };
}

export const dateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
