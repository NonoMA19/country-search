// Un parcours complet, du premier écran au résultat, au doigt (375 px) et à la souris (1440 px) :
// compte les écrans, vérifie qu'aucun ne déborde en largeur, que l'écran final et les deux mesures s'affichent.
// Usage : site lancé, puis npm run e2e:parcours (BASE=…, CAPTURES=dossier pour garder une image de chaque nouveau format ;
// TOUS=1 en plus pour une image de chaque écran).
import fs from "node:fs";
import { chromium } from "./playwright.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const CAPTURES = process.env.CAPTURES ?? null;
let echecs = 0, essais = 0;
const verifier = (ok, message) => { essais++; if (!ok) { echecs++; console.log(`  ✗ ${message}`); } };
const browser = await chromium.launch();
const NOUVEAUX = ["Combien de temps", "Ton budget", "Le test à l’aveugle", "Tes limites : la distance", "Tes valeurs", "Avant ton résultat"];

for (const [mode, options] of [["telephone", { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true }], ["ordinateur", { viewport: { width: 1440, height: 900 } }]]) {
  const ctx = await browser.newContext({ ...options, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text().slice(0, 400)); });
  await page.goto(BASE + "/quiz", { waitUntil: "networkidle" });
  const vus = [];
  let ecrans = 0;
  for (let n = 0; n < 90; n++) {
    await page.waitForTimeout(460);
    if (page.url().includes("/resultat")) break;
    const titre = (await page.locator("#titre-ecran").innerText().catch(() => "")).trim();
    const theme = (await page.locator("main p.rounded-full").first().innerText().catch(() => "")).trim();
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    verifier(deborde <= 0, `${mode} : « ${titre} » déborde de ${deborde} px`);
    if (CAPTURES && (process.env.TOUS || (NOUVEAUX.some((t) => theme.startsWith(t)) && !vus.includes(theme)))) {
      fs.mkdirSync(CAPTURES, { recursive: true });
      await page.screenshot({ path: `${CAPTURES}/${mode}-${String(vus.length).padStart(2, "0")}.png`, fullPage: true });
    }
    vus.push(theme);
    const bouton = (nom) => page.getByRole("button", { name: nom }).first();
    if (await bouton(/^Commencer le chapitre/).isVisible().catch(() => false)) { await bouton(/^Commencer le chapitre/).click(); continue; }
    if (await bouton(/C’est moi, voir mon résultat/).isVisible().catch(() => false)) { await bouton(/C’est moi, voir mon résultat/).click(); await page.waitForURL(/resultat/); break; }
    if (await bouton(/Voir mon portrait/).isVisible().catch(() => false)) { await bouton(/Voir mon portrait/).click(); continue; }
    if (titre.startsWith("Ce qu’on ne t’a pas demandé")) { verifier((await page.locator("details").count()) > 0, `${mode} : écran final sans raison`); await bouton(/^Continuer$/).click(); continue; }
    ecrans++;
    // Répondre : les situations à classer d'abord (un bouton par groupe), puis les options, puis valider ; sinon « Passer ».
    const groupes = page.locator("main [role='group']");
    const nbGroupes = await groupes.count();
    if (nbGroupes > 1) for (let g = 0; g < nbGroupes; g++) await groupes.nth(g).locator("button").first().click();
    const options = page.locator("main [data-option]:not([disabled])");
    const nbOptions = await options.count();
    const valider = page.locator("main [data-valider]:not([disabled])").first();
    if (titre.startsWith("Choisis jusqu’à 5")) { for (let k = 0; k < 5; k++) await options.nth(k * 2).click(); }
    else if (nbOptions && nbGroupes <= 1 && !(await valider.isVisible().catch(() => false))) await options.first().click();
    else if (nbOptions && nbGroupes <= 1 && /test à l’aveugle|frise|durée|temps/i.test(theme + titre)) await options.first().click();
    await page.waitForTimeout(120);
    if (await page.locator("main [data-valider]:not([disabled])").first().isVisible().catch(() => false)) { await page.locator("main [data-valider]:not([disabled])").first().click(); continue; }
    const passer = page.getByRole("button", { name: /^(Passer|Je ne sais pas encore)$/ }).first();
    if (await passer.isVisible().catch(() => false)) await passer.click();
  }
  verifier(page.url().includes("/resultat"), `${mode} : le parcours n'arrive pas au résultat`);
  await page.waitForTimeout(800);
  verifier(await page.getByText("Il te ressemble").first().isVisible(), `${mode} : « Il te ressemble » absent du résultat`);
  verifier(await page.getByText("Il t’est accessible").first().isVisible(), `${mode} : « Il t’est accessible » absent du résultat`);
  verifier(!(await page.getByText(/importance \d/).count()), `${mode} : une importance chiffrée est affichée`);
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  verifier(deborde <= 0, `${mode} : le résultat déborde de ${deborde} px`);
  if (CAPTURES) { await page.screenshot({ path: `${CAPTURES}/${mode}-resultat.png` }); fs.writeFileSync(`${CAPTURES}/${mode}-session.json`, await page.evaluate(() => sessionStorage.getItem("country-search:quiz"))); }
  verifier(erreurs.length === 0, `${mode} : erreurs JavaScript : ${erreurs.join(" | ")}`);
  verifier(ecrans >= 28 && ecrans <= 42, `${mode} : ${ecrans} écrans de questions`);
  console.log(`${mode} : ${ecrans} écrans de questions jusqu’au résultat.`);
  await ctx.close();
}
await browser.close();
console.log(echecs ? `\n${echecs} échec(s) sur ${essais} vérifications.` : `\nParcours complet : ${essais} vérifications, toutes réussies.`);
process.exit(echecs ? 1 : 0);
