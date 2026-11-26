// Les emojis du site : Fluent Emoji de Microsoft (style « flat », licence MIT), en fichiers SVG dans public/emojis.
// Même rendu sur tous les téléphones (pas les emojis du système). Source : paquet @iconify-json/fluent-emoji-flat.
// Le script cherche chaque champ « emoji » de content/*.json et la liste content/emojis-interface.json (emojis de l'interface),
// puis écrit un SVG par emoji. Un nom inconnu arrête le script. Usage : node scripts/emojis.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const RACINE = path.resolve(import.meta.dirname, "..");
const SORTIE = path.join(RACINE, "public", "emojis");
const jeu = require("@iconify-json/fluent-emoji-flat/icons.json");
const info = require("@iconify-json/fluent-emoji-flat/info.json");

const noms = new Set(JSON.parse(fs.readFileSync(path.join(RACINE, "content", "emojis-interface.json"), "utf8")).emojis);
const parcourir = (x) => {
  if (Array.isArray(x)) return x.forEach(parcourir);
  if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { if (k === "emoji" && typeof v === "string") noms.add(v); else parcourir(v); }
};
for (const f of fs.readdirSync(path.join(RACINE, "content"))) if (f.endsWith(".json")) parcourir(JSON.parse(fs.readFileSync(path.join(RACINE, "content", f), "utf8")));

const icone = (nom) => jeu.icons[nom] ?? (jeu.aliases?.[nom] ? jeu.icons[jeu.aliases[nom].parent] : undefined);
const inconnus = [...noms].filter((n) => !icone(n));
if (inconnus.length) { console.error(`Emojis inconnus dans ${info.name} : ${inconnus.join(", ")}`); process.exit(1); }
fs.rmSync(SORTIE, { recursive: true, force: true });
fs.mkdirSync(SORTIE, { recursive: true });
for (const n of [...noms].sort()) {
  const i = icone(n);
  const l = i.width ?? jeu.width ?? 32, h = i.height ?? jeu.height ?? 32;
  fs.writeFileSync(path.join(SORTIE, `${n}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l} ${h}" width="${l}" height="${h}">${i.body}</svg>\n`);
}
fs.writeFileSync(path.join(SORTIE, "LICENCE.txt"), `Fluent Emoji (style flat), Microsoft Corporation.\nLicence MIT : ${info.license.url}\nCopie tirée du paquet @iconify-json/fluent-emoji-flat (Iconify).\n`);
console.log(`${noms.size} emojis écrits dans public/emojis.`);
