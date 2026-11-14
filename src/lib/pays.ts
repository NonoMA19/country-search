import paysData from "../../content/pays.json";

export type Famille = "Europe sans visa" | "PVT" | "Visa de travail";

export type Pays = {
  nom: string;
  id: string;
  famille: Famille;
  ficheComplete: boolean;
};

export const FAMILLES: Famille[] = ["Europe sans visa", "PVT", "Visa de travail"];

export const pays = paysData as Pays[];

export function paysParFamille(famille: Famille): Pays[] {
  return pays.filter((p) => p.famille === famille);
}
