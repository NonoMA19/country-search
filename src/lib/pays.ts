import paysData from "../../content/pays.json";

export type Famille = "Europe sans visa" | "PVT" | "Visa de travail";

export type Pays = {
  nom: string;
  id: string;
  famille: Famille;
  ficheComplete: boolean;
  iso2: string;
  iso3: string;
  zone: "europe" | "hors-europe";
  ville: string;
  villeRecherche: string;
  en: string; // « en Belgique », « au Canada »…
  le: string; // « la Belgique », « le Canada »…
};

// Le nom affiché de chaque famille, sans sigle obscur.
export const NOM_FAMILLE: Record<Famille, string> = {
  "Europe sans visa": "Europe sans visa",
  PVT: "PVT (Programme Vacances-Travail)",
  "Visa de travail": "Visa de travail",
};

export const FAMILLES: Famille[] = ["Europe sans visa", "PVT", "Visa de travail"];

export const pays = paysData as Pays[];

export function paysParFamille(famille: Famille): Pays[] {
  return pays.filter((p) => p.famille === famille);
}

export function trouverPays(id: string): Pays | undefined {
  return pays.find((p) => p.id === id);
}
