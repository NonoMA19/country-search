// Sessions prêtes : pour chaque format, une session dont l'écran suivant est de ce format.
import fs from "node:fs";
import { hasard, reponseAuHasard } from "../hasard";
import { ETAT_VIDE, etatDepart, repondre } from "@/lib/moteur";
import { prochainElement } from "@/lib/parcours";
import { SESSION_VIDE } from "@/lib/memoire";
const r = hasard(7);
let etat = etatDepart({ ...ETAT_VIDE, graine: 12345 });
const parType: Record<string, unknown> = {};
const ordreTypes: string[] = [];
for (let n = 0; n < 60; n++) {
  const el = prochainElement(etat);
  if (!el) break;
  if (!parType[el.type]) { parType[el.type] = { ...SESSION_VIDE, etat, chapitresVus: [1, 2, 3, 4, 5] }; ordreTypes.push(`${el.type}:${el.id}`); }
  const v = el.id === "envies" ? ["salaire", "travail", "securite", "climat", "proche"] : reponseAuHasard(el, etat, r);
  etat = repondre(etat, el.id, v);
}
parType.resultat = { ...SESSION_VIDE, etat, etape: { t: "portrait" }, chapitresVus: [1, 2, 3, 4, 5] };
fs.writeFileSync(process.argv[2] ?? "sessions.json", JSON.stringify(parType));
console.log(ordreTypes.join("\n"));
