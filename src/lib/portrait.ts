// Ton portrait : quelques phrases tirées de tes vraies réponses (jamais d'une réponse passée).
// « Ce n'est pas moi » rouvre l'élément concerné.
import { quiz, trouverElement } from "./donnees";
import { PASSER, optionReponse } from "./elements";
import { enviesDe, listeFr, type Etat } from "./moteur";

export type LignePortrait = { cle: string; texte: string; revoir: { t: "element"; id: string } | null };
export const MAX_PORTRAIT = 6;
const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export function portrait(etat: Etat): LignePortrait[] {
  const res: LignePortrait[] = [];
  const obj = typeof etat.profil.objectif === "string" ? quiz.objectifs[etat.profil.objectif] : undefined;
  if (obj) res.push({ cle: "objectif", texte: `Tu pars pour ${obj.nom}.`, revoir: { t: "element", id: "objectif" } });
  const envies = enviesDe(etat).map((id) => quiz.envies.find((e) => e.id === id)?.label).filter((x): x is string => !!x);
  if (envies.length) res.push({ cle: "envies", texte: `Ce qui compte le plus pour toi : ${listeFr(envies.slice(0, 3).map(minuscule))}.`, revoir: { t: "element", id: "classement" } });
  const vus = new Set<string>();
  for (const id of etat.ordre) {
    if (res.length >= MAX_PORTRAIT) break;
    const el = trouverElement(id);
    const v = etat.reponses[id];
    if (!el || v === PASSER || el.type !== "dilemme") continue;
    const o = optionReponse(el, v);
    if (!o?.portrait || vus.has(o.portrait)) continue;
    vus.add(o.portrait);
    res.push({ cle: `element:${id}`, texte: o.portrait, revoir: { t: "element", id } });
  }
  return res;
}
