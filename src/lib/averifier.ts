// Ce qui reste « à vérifier », tiré des données elles-mêmes (jamais une liste tapée à la main) :
// la même liste sert à /methode et à data/a-verifier.md (npm run a-verifier).
import { notes, portes } from "./donnees";
import { pays } from "./pays";

export type PointAVerifier = { categorie: string; pays: string; detail: string };

const SECTEURS = (id: string) => Object.keys(notes[id] ?? {}).filter((m) => m.startsWith("secteur-"));

export function listeAVerifier(): PointAVerifier[] {
  const res: PointAVerifier[] = [];
  for (const p of pays) {
    const n = notes[p.id] ?? {};
    if (n.salaire?.statut !== "verifie") res.push({ categorie: "Salaire", pays: p.nom, detail: n.salaire?.texte ?? "Pas de donnée." });
    if (n.securite?.statut !== "verifie") res.push({ categorie: "Homicides (sécurité)", pays: p.nom, detail: n.securite?.texte ?? "Pas de donnée." });
    const sect = SECTEURS(p.id);
    if (sect.length && sect.every((m) => n[m]?.statut !== "verifie")) res.push({ categorie: "Emploi par secteur", pays: p.nom, detail: n[sect[0]]?.texte ?? "Pas de donnée." });
    if (n.heures?.statut !== "verifie") res.push({ categorie: "Heures travaillées", pays: p.nom, detail: n.heures?.texte ?? "Pas de donnée." });
    if (n.francais?.statut !== "verifie") res.push({ categorie: "Français inscrits", pays: p.nom, detail: n.francais?.texte ?? "Pas de donnée." });
    for (const b of portes(p.id)) {
      if (b.type === "visa-travail" && (b.statut !== "verifie" || b.detailsAVerifier || (b.detail && b.detail.statut !== "verifie"))) {
        res.push({ categorie: "Visa de travail", pays: p.nom, detail: b.raisonAVerifier ?? (b.detail ? `${b.detail.nom} : conditions détaillées à vérifier sur le site officiel du pays.` : "Conditions détaillées (employeur, salaire, diplôme) à vérifier sur le site officiel du pays.") });
      }
      if (b.type === "pvt" && b.fondsAVerifier) res.push({ categorie: "Ressources du PVT", pays: p.nom, detail: b.fonds?.texte ?? "Montant à vérifier." });
      if (b.type === "pvt" && b.changement?.statut === "a-verifier") res.push({ categorie: "Procédure du PVT", pays: p.nom, detail: b.changement.texte });
      if (b.securite?.statut === "a-verifier") res.push({ categorie: "Vigilance (France Diplomatie)", pays: p.nom, detail: b.securite.texte });
      for (const v of b.visas ?? []) if (v.statut !== "verifie") res.push({ categorie: "Autres visas pour les jeunes", pays: p.nom, detail: `${v.nom} : détails à vérifier.` });
    }
  }
  return res;
}

// Regroupé par catégorie, dans l'ordre de la liste.
export function aVerifierParCategorie(): [string, PointAVerifier[]][] {
  const groupes = new Map<string, PointAVerifier[]>();
  for (const x of listeAVerifier()) groupes.set(x.categorie, [...(groupes.get(x.categorie) ?? []), x]);
  return [...groupes.entries()];
}
