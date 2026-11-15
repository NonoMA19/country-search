// Fabrique le dossier PDF dans le navigateur (bibliothèque libre jsPDF, licence MIT).
// Aucun serveur, aucun compte : le fichier est créé sur l'appareil de la personne.
import { LIBELLE_TYPE, dateFr, type Preuve } from "./donnees";
import { chargerDossier, liensVerifies } from "./dossiers";
import { LIBELLE_BADGE, verdict, type Alerte, type Argument, type Ligne, type Porte } from "./moteur";
import type { Pays } from "./pays";

// Les polices de base du PDF ne connaissent que l'alphabet latin simple.
const propre = (t: string) =>
  t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—−]/g, "-").replace(/…/g, "...").replace(/œ/g, "oe").replace(/Œ/g, "OE")
    .replace(/€/g, "euros").replace(/[  ]/g, " ").replace(/µ/g, "u").replace(/[^\x00-\xff]/g, "");

export async function telechargerDossier({ pays, ligne, porte, raisons, coince, portrait }: {
  pays: Pays;
  portrait?: string[];
  ligne?: Ligne | null;
  porte?: Porte | null;
  raisons?: Argument[];
  coince?: { arguments: Argument[]; alertes: Alerte[] };
}) {
  const { jsPDF } = await import("jspdf");
  const dossier = await chargerDossier(pays.id);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const MARGE = 48, LARGEUR = doc.internal.pageSize.getWidth() - 2 * MARGE, BAS = doc.internal.pageSize.getHeight() - 56;
  let y = 60;
  const sources = new Map<string, Preuve>();

  const ecrire = (texte: string, { taille = 11, gras = false, gris = false, apres = 6, retrait = 0 } = {}) => {
    doc.setFont("helvetica", gras ? "bold" : "normal");
    doc.setFontSize(taille);
    doc.setTextColor(gris ? 100 : 15, gris ? 116 : 23, gris ? 139 : 42);
    for (const l of doc.splitTextToSize(propre(texte), LARGEUR - retrait) as string[]) {
      if (y > BAS) { doc.addPage(); y = 60; }
      doc.text(l, MARGE + retrait, y);
      y += taille * 1.35;
    }
    y += apres;
  };
  const titre = (t: string) => { y += 8; ecrire(t, { taille: 14, gras: true, apres: 4 }); };
  const preuve = (p: Preuve | null) => {
    if (!p) return;
    if (p.type === "a-verifier") { ecrire("À vérifier.", { taille: 9, gris: true, retrait: 12 }); return; }
    ecrire(`${LIBELLE_TYPE[p.type]} - ${p.source} - vérifié le ${dateFr(p.verifieLe)}`, { taille: 9, gris: true, retrait: 12 });
    if (p.source) sources.set(p.source, p);
  };

  ecrire(`Mon dossier : ${pays.nom}`, { taille: 22, gras: true, apres: 2 });
  ecrire(`Country Search - dossier créé le ${dateFr(new Date().toISOString().slice(0, 10))}`, { taille: 10, gris: true, apres: 10 });

  if (portrait?.length) {
    titre("Ton portrait");
    for (const t of portrait) ecrire(`- ${t}`, { apres: 2 });
  }
  if (ligne) {
    titre("Ton résultat");
    ecrire(`${Math.round(ligne.score)} % - ${verdict(Math.round(ligne.score))}. C’est un indicateur, pas une vérité.`);
  }
  const laPorte = porte ?? ligne?.porte ?? null;
  if (laPorte) {
    titre("Ta porte d’entrée");
    ecrire(`${LIBELLE_BADGE[laPorte.badge]} - ${laPorte.nom}`, { gras: true, apres: 2 });
    ecrire(laPorte.phrase, { apres: 2 });
    ecrire(laPorte.preuve.texte, { apres: 2 });
    preuve(laPorte.preuve);
    laPorte.autres.forEach((a) => ecrire(a, { gris: true }));
  }
  if (raisons?.length) {
    titre("Pourquoi ce pays");
    for (const a of raisons) { ecrire(`- ${a.titre}. ${a.texte}`, { apres: 2 }); preuve(a.preuve); }
  }
  if (coince && (coince.arguments.length || coince.alertes.length)) {
    titre("Ce qui peut coincer");
    for (const a of coince.arguments) { ecrire(`- ${a.titre}. ${a.texte}`, { apres: 2 }); preuve(a.preuve); }
    for (const a of coince.alertes) { ecrire(`- ${a.texte}`, { apres: 2 }); preuve(a.preuve); }
  }

  // Seuls les liens réellement vérifiés sont imprimés.
  const liens = dossier ? liensVerifies(dossier.liens) : [];
  const associations = dossier ? liensVerifies(dossier.associations) : [];
  if (liens.length) {
    titre("Liens officiels");
    for (const l of liens) {
      ecrire(`${l.titre}${l.nom ? ` : ${l.nom}` : ""}`, { gras: true, apres: 1 });
      ecrire(`${l.url} (vérifié le ${dateFr(dossier?.verifieLe)})`, { taille: 10 });
    }
  }
  if (associations.length) {
    titre("Associations et réseaux");
    for (const l of associations) {
      ecrire(l.nom ?? l.titre, { gras: true, apres: 1 });
      ecrire(`${l.url} (vérifié le ${dateFr(dossier?.verifieLe)})`, { taille: 10 });
    }
  }

  if (sources.size) {
    titre("Sources");
    for (const p of sources.values()) ecrire(`- ${p.source} (${p.licence})${p.lien ? ` : ${p.lien}` : ""}`, { taille: 9, apres: 2 });
  }
  y += 10;
  ecrire("Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.", { taille: 9, gris: true });

  doc.save(`dossier-${pays.id}.pdf`);
}
