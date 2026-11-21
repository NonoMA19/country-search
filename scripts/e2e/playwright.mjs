// Trouve Playwright : celui du projet s'il est installé, sinon celui installé pour tout l'ordinateur.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

function charger() {
  const essais = [import.meta.url];
  try { essais.push(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "/")); } catch { /* npm absent */ }
  essais.push("/opt/node-tools/node_modules/");
  for (const base of essais) {
    try { return createRequire(base)("playwright"); } catch { /* essai suivant */ }
  }
  throw new Error("Playwright introuvable : installe-le (npm i -g playwright) puis relance.");
}
export const { chromium } = charger();
