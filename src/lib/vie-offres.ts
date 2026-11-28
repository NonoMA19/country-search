// Le lien vers les offres de VIE de Business France, filtré par pays et par secteur (prompt 8).
// Le site lit ses filtres dans l'adresse : countriesIds (code pays à deux lettres) et specializationsIds (numéro de
// spécialité), répétables. Les codes ont été relevés une seule fois sur le site (content/saisie/vie-filtres.json,
// 28 novembre 2026) : Orizo n'appelle jamais leur API. Un secteur sans spécialité équivalente : filtre pays seul.
import filtres from "../../content/saisie/vie-filtres.json";
import { vie } from "./donnees";
import { pays } from "./pays";

const RECHERCHE = "https://mon-vie-via.businessfrance.fr/offres/recherche";

// Nos 16 secteurs → les spécialités du site (libellés dans vie-filtres.json). Absents : pas d'équivalent clair.
export const SPECIALITES_VIE: Record<string, string[]> = {
  finance: ["19"], // FINANCE COMPTABILITE GESTION BANQUE
  tech: ["24", "212"], // SYSTEMES ET LOGICIELS INFORMATIQUES ; INFORMATIQUE SCIENTIFIQUE ET INDUSTRIELLE
  ingenierie: ["59", "58"], // PRODUCTION INDUSTRIELLE ; GESTION DE LA PRODUCTION INDUSTRIELLE
  commerce: ["216", "193"], // MARKETING - COMMUNICATION ; COMMERCE
  services: ["100", "89"], // RESSOURCES HUMAINES ; COMMERCES SERVICES
  sante: ["81"], // SANTE BEAUTE PARAMEDICAL
  agriculture: ["190"], // AGRI AGRO
  btp: ["196"], // CONSTRUCTION
  culture: ["36"], // ARTS ET LITTERATURE
  enseignement: ["239"], // SCIENCES ACADEMIQUES
  transport: ["243"], // ACHATS LOGISTIQUE TRANSPORT
  public: ["227"], // PUBLIC & PARAPUBLIC
  // conseil, energie, hotellerie, immobilier, autre : pas de spécialité équivalente → pays seul.
};

const SPECIALITES_CONNUES = new Set(filtres.specialites.map((s) => s.id));
const PAYS_CONNUS = new Set(filtres.pays);
// Un pays a un lien filtré s'il fait partie des destinations VIE de Business France et que le site connaît son code.
export const codeVie = (paysId: string): string | null => {
  const iso2 = pays.find((p) => p.id === paysId)?.iso2;
  return iso2 && vie.presence?.[paysId] && PAYS_CONNUS.has(iso2) ? iso2 : null;
};

export function lienOffresVie(paysIds: string[], secteur?: unknown): string {
  const q = new URLSearchParams();
  for (const id of paysIds) { const c = codeVie(id); if (c) q.append("countriesIds", c); }
  for (const s of typeof secteur === "string" ? SPECIALITES_VIE[secteur] ?? [] : []) if (SPECIALITES_CONNUES.has(s)) q.append("specializationsIds", s);
  const t = q.toString();
  return t ? `${RECHERCHE}?${t}` : vie.offres.url;
}
// En mots, ce que le lien filtre (« en Australie, finance »).
export const secteurFiltreVie = (secteur: unknown) => typeof secteur === "string" && !!SPECIALITES_VIE[secteur];
