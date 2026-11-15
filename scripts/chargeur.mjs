// Permet à Node de lancer les fichiers TypeScript du site sans outil en plus :
// « @/… » pointe vers src/, les imports sans extension trouvent le fichier .ts,
// et les fichiers .json sont lus comme des modules.
// Usage : node --import ./scripts/chargeur.mjs scripts/test-moteur.ts
import { registerHooks } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(import.meta.dirname, "..", "src");
const essais = (base) => [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];

registerHooks({
  resolve(specifier, context, next) {
    let cible = null;
    if (specifier.startsWith("@/")) cible = path.join(SRC, specifier.slice(2));
    else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      cible = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (cible) {
      const trouve = essais(cible).find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
      if (trouve) return { url: pathToFileURL(trouve).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".json")) {
      return { format: "module", source: `export default ${fs.readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
    }
    return next(url, context);
  },
});
