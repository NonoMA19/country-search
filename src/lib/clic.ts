// Garde anti double clic : après une action qui change l'écran ou la liste, les clics arrivés trop vite
// sont ignorés. Un double clic ne doit pas répondre aussi à la question suivante, ni remonter deux pays.
export const DELAI_CLIC = 400;
let dernierChangement = -Infinity;
export const clicLibre = () => performance.now() - dernierChangement >= DELAI_CLIC;
export const marquerChangement = () => { dernierChangement = performance.now(); };
// Exécute l'action seulement si le clic est libre, puis bloque les clics pendant 400 ms.
export function uneFois(action: () => void) {
  if (!clicLibre()) return;
  marquerChangement();
  action();
}
// Le retour du navigateur n'est pas un double clic : il libère la garde.
export const marquerLibre = () => { dernierChangement = -Infinity; };
