// « Les liens qui pourraient t'intéresser » (prompt 7) : les liens vérifiés d'un pays, rangés par étape (ton visa,
// trouver un emploi, te loger, t'installer), chacun avec le nom du site, à quoi il sert et sa date de vérification.
// Utilisé par la fiche pays et le dossier PDF. Seuls les liens réellement ouverts et vérifiés sont montrés.
import { vie } from "./donnees";
import { lienOffresVie } from "./vie-offres";
import { liensVerifies, type Dossier } from "./dossiers";

export type EtapeLien = "visa" | "emploi" | "logement" | "installer";
export const ETAPES_LIENS: { id: EtapeLien; titre: string; emoji: string }[] = [
  { id: "visa", titre: "Ton visa", emoji: "passport-control" },
  { id: "emploi", titre: "Trouver un emploi", emoji: "briefcase" },
  { id: "logement", titre: "Te loger", emoji: "house" },
  { id: "installer", titre: "T’installer", emoji: "round-pushpin" },
];
// À quoi sert chaque lien du dossier (le type de lien, pas le contenu du site : rien n'est copié).
const ROLE: Record<string, { etape: EtapeLien; role: string }> = {
  visa: { etape: "visa", role: "Les règles officielles pour vivre et travailler dans ce pays." },
  pvt: { etape: "visa", role: "Le Programme Vacances-Travail, expliqué par France Diplomatie." },
  cci: { etape: "emploi", role: "Le réseau des entreprises françaises sur place : utile pour viser un poste." },
  conseils: { etape: "installer", role: "La sécurité et les alertes du moment." },
  consulat: { etape: "installer", role: "Les contacts de l’ambassade et des consulats de France." },
  registre: { etape: "installer", role: "Te déclarer comme Français à l’étranger : utile en cas de crise ou pour voter." },
  ufe: { etape: "installer", role: "Rencontrer d’autres Français sur place." },
  adfe: { etape: "installer", role: "Rencontrer d’autres Français sur place." },
};
export type LienUtile = { id: string; site: string; titre: string; role: string; url: string; verifieLe: string };
// Le nom du site : la partie entre parenthèses du nom (« … (France Diplomatie) »), sinon le nom, sinon l'adresse.
const siteDe = (nom: string | null, url: string) => nom?.match(/\(([^()]+)\)\s*$/)?.[1] ?? nom ?? new URL(url).hostname.replace(/^www\./, "");

export function liensParEtape(dossier: Dossier | null, paysId: string): { etape: (typeof ETAPES_LIENS)[number]; liens: LienUtile[] }[] {
  const tous: (LienUtile & { etape: EtapeLien })[] = [];
  if (dossier) {
    for (const l of [...liensVerifies(dossier.liens), ...liensVerifies(dossier.associations)]) {
      const r = ROLE[l.id];
      if (!r || !l.url) continue;
      tous.push({ id: l.id, etape: r.etape, site: siteDe(l.nom, l.url), titre: l.titre, role: r.role, url: l.url, verifieLe: l.verifieLe ?? dossier.verifieLe });
    }
  }
  // Les offres de VIE de Business France, si le pays fait partie de ses destinations.
  if (vie.presence?.[paysId] && vie.offres?.url) {
    tous.push({ id: "vie", etape: "emploi", site: "Business France", titre: "Offres de VIE", role: "Les missions de VIE ouvertes dans ce pays.", url: lienOffresVie([paysId]), verifieLe: vie.offres.verifieLe });
  }
  return ETAPES_LIENS.map((etape) => ({ etape, liens: tous.filter((l) => l.etape === etape.id) })).filter((g) => g.liens.length > 0);
}
