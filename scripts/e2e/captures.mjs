// Les captures du rapport (prompt 7), au téléphone (375 px, au doigt, thème sombre) : secteurs, langues, portrait, résultat.
// Le parcours répond comme une vraie personne : secteur tech, espagnol et allemand, 5 critères, puis le plus simple ailleurs.
// Usage : site lancé (npm run build && npm start), puis SORTIE=dossier node scripts/e2e/captures.mjs
import fs from "node:fs";
import { chromium } from "./playwright.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SORTIE = process.env.SORTIE ?? "captures";
fs.mkdirSync(SORTIE, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, colorScheme: "dark" });
const page = await ctx.newPage();
page.setDefaultTimeout(5000);
const erreurs = [];
page.on("pageerror", (e) => erreurs.push(String(e)));
await page.goto(BASE + "/quiz", { waitUntil: "networkidle" });
const bouton = (nom) => page.getByRole("button", { name: nom }).first();
const visible = (l) => l.isVisible().catch(() => false);
// Pleine page : la barre d'action collée en bas est remise à sa place, sinon elle s'imprime au milieu de l'image.
const capture = async (nom, pleine = true) => {
  await page.waitForTimeout(900);
  const style = pleine ? await page.addStyleTag({ content: ".sticky { position: static !important; }" }) : null;
  await page.screenshot({ path: `${SORTIE}/${nom}.png`, fullPage: pleine });
  if (style) await style.evaluate((n) => n.remove());
  console.log(`capture : ${nom}`);
};

for (let n = 0; n < 120; n++) {
  await page.waitForTimeout(450);
  if (page.url().includes("/resultat")) break;
  const titre = (await page.locator("#titre-ecran").innerText().catch(() => "")).trim();
  if (process.env.BAVARD) console.log(n, titre);
  if (await visible(bouton(/^Commencer le chapitre/))) { await bouton(/^Commencer le chapitre/).click(); continue; }
  if (titre === "Ton portrait") { await capture("3-portrait"); await bouton(/C’est moi, voir mon résultat/).click(); await page.waitForURL(/resultat/); break; }
  if (await visible(bouton(/Voir mon portrait/))) { await bouton(/Voir mon portrait/).click(); continue; }
  if (titre.startsWith("Ton secteur")) { await capture("1-secteurs"); await page.getByRole("button", { name: /Tech et data/ }).click(); continue; }
  if (titre.startsWith("Tu parles d’autres langues")) {
    await page.getByRole("checkbox", { name: /Espagnol/ }).click();
    await page.getByRole("checkbox", { name: /Allemand/ }).click();
    await capture("2-langues");
    await page.locator("main [data-valider]").first().click();
    continue;
  }
  if (titre.startsWith("Qu’est-ce qui te pousse")) { await page.getByRole("button", { name: /carrière/ }).click(); continue; }
  if (titre.startsWith("Et sous quelle forme")) { await page.getByRole("button", { name: /premier poste/i }).click(); continue; }
  if (titre.startsWith("Choisis jusqu’à 5")) {
    for (const nom of [/Bon salaire/, /Trouver du travail/, /Soleil et chaleur/, /Vie pas chère/, /Sécurité/]) await page.getByRole("button", { name: nom }).first().click();
    await page.locator("main [data-valider]:not([disabled])").first().click();
    continue;
  }
  // Ailleurs : les situations à classer, puis la première option, puis valider ; sinon « Passer ».
  const groupes = page.locator("main [role='group']");
  const nbGroupes = await groupes.count();
  if (nbGroupes > 1) for (let g = 0; g < nbGroupes; g++) await groupes.nth(g).locator("button").first().click();
  const options = page.locator("main [data-option]:not([disabled])");
  const valider = page.locator("main [data-valider]:not([disabled])").first();
  if ((await options.count()) && nbGroupes <= 1 && !(await visible(valider))) await options.first().click();
  else if ((await options.count()) && /aveugle|durée|temps/i.test(titre)) await options.first().click();
  await page.waitForTimeout(150);
  if (await visible(page.locator("main [data-valider]:not([disabled])").first())) { await page.locator("main [data-valider]:not([disabled])").first().click(); continue; }
  const passer = page.getByRole("button", { name: /^(Passer|Je ne sais pas encore)$/ }).first();
  if (await visible(passer)) await passer.click();
}
await page.waitForTimeout(1500);
// Le haut du résultat (portrait compact, top 3, pays surprise), sur 2 400 px de haut.
await page.screenshot({ path: `${SORTIE}/4-resultat.png`, fullPage: true, clip: { x: 0, y: 0, width: 375, height: 2400 } });
await page.screenshot({ path: `${SORTIE}/4-resultat-page.png`, fullPage: true });
console.log("capture : 4-resultat");
const deborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(`débordement horizontal du résultat : ${deborde} px ; erreurs JavaScript : ${erreurs.length ? erreurs.join(" | ") : "aucune"}`);
// Une fiche pays (portes d'entrée, secteurs, liens), pour vérifier la mise en page.
await page.goto(BASE + "/pays/australie", { waitUntil: "networkidle" });
await page.screenshot({ path: `${SORTIE}/5-fiche-pays.png`, fullPage: true });
await browser.close();
