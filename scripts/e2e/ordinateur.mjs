// Test de bout en bout des trois modes (téléphone, tablette, ordinateur) : panneau du quiz, raccourcis clavier,
// résultat côte à côte, aucun défilement horizontal. Usage : site lancé, puis npm run e2e:ordinateur (BASE=…).
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "./playwright.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SESSIONS = new URL("./.sessions.json", import.meta.url).pathname;
execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--import", "./scripts/chargeur.mjs", "scripts/e2e/sessions.ts", SESSIONS], { stdio: "ignore" });
const S = JSON.parse(fs.readFileSync(SESSIONS, "utf8"));

let echecs = 0, essais = 0;
const verifier = (ok, message) => { essais++; if (!ok) { echecs++; console.log(`  ✗ ${message}`); } };
const browser = await chromium.launch();
const MODES = {
  telephone: { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true },
  tablette: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true },
  ordinateur: { viewport: { width: 1440, height: 900 } },
};
async function ouvrir(mode, session, url = "/quiz") {
  const ctx = await browser.newContext(MODES[mode]);
  await ctx.addInitScript((s) => { if (s && !sessionStorage.getItem("country-search:quiz")) sessionStorage.setItem("country-search:quiz", s); }, session ? JSON.stringify(session) : null);
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  return { ctx, page };
}
const lireSession = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem("country-search:quiz")));
const titre = (page) => page.locator("#titre-ecran").innerText();
const visible = (page, sel) => page.locator(sel).first().isVisible();

// Panneau : visible seulement sur ordinateur. Le bouton « Pourquoi » de la question : partout (prompt 7, le panneau ne garde que les étapes).
for (const mode of Object.keys(MODES)) {
  const { ctx, page } = await ouvrir(mode, S.dilemme);
  const panneau = await visible(page, "aside");
  const pourquoi = await page.getByRole("button", { name: /Pourquoi on te demande/ }).isVisible();
  verifier(panneau === (mode === "ordinateur"), `${mode} : panneau ${panneau ? "visible" : "caché"}`);
  verifier(pourquoi, `${mode} : bouton « Pourquoi » caché`);
  // Zones tactiles : chaque bouton visible fait au moins 44 px de haut (téléphone et tablette).
  if (mode !== "ordinateur") {
    const petits = await page.$$eval("main button, main a", (l) => l.filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44 && !b.closest("p, li")).map((b) => b.textContent.trim().slice(0, 30)));
    verifier(petits.length === 0, `${mode} : boutons de moins de 44 px : ${petits.join(" | ")}`);
  }
  await ctx.close();
}

// Raccourcis clavier (ordinateur).
{
  const { ctx, page } = await ouvrir("ordinateur", S["choix-cartes"]);
  const avant = await titre(page);
  // Prompt 7 : la motivation et le projet sont un seul écran en deux temps. La touche 2 ouvre le deuxième temps,
  // la touche 1 y répond : les deux réponses sont alors enregistrées ensemble.
  await page.keyboard.press("2");
  await page.waitForTimeout(500);
  verifier((await titre(page)).startsWith("Et sous quelle forme"), "touche 2 : le deuxième temps (la forme du départ) ne s'ouvre pas");
  await page.keyboard.press("1");
  await page.waitForTimeout(500);
  const s = await lireSession(page);
  verifier(s.etat.reponses.motivation !== undefined && s.etat.reponses.objectif !== undefined, "touches 2 puis 1 : la motivation et le projet ne sont pas enregistrés ensemble");
  verifier((await titre(page)) !== avant, "touche 2 : l'écran n'a pas changé");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(500);
  verifier((await titre(page)) === avant, "Retour arrière : pas revenu à l'écran précédent");
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir("ordinateur", S.ambiances);
  const avant = await titre(page);
  await page.keyboard.press("1");
  await page.keyboard.press("2");
  await page.waitForTimeout(450);
  const coches = await page.locator("main [data-option][aria-pressed='true']").count();
  verifier(coches === 2, `touches 1 et 2 : ${coches} ambiances cochées`);
  await page.locator("#titre-ecran").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  verifier((await titre(page)) !== avant, "Entrée : l'écran n'a pas été validé");
  await ctx.close();
}
// Résultat : sur ordinateur, la liste à gauche et la fiche à droite ; un clic change la fiche.
{
  const { ctx, page } = await ouvrir("ordinateur", S.resultat, "/resultat");
  const liste = page.getByRole("navigation", { name: "Ton classement" });
  verifier(await liste.isVisible(), "résultat : la liste de gauche n'est pas visible");
  const fiches = await page.locator("#fiche-choisie article h3:visible").allInnerTexts();
  verifier(fiches.length === 1, `résultat : ${fiches.length} fiches visibles au lieu d'une`);
  const cinquieme = liste.locator("li button").nth(4);
  const nom = (await cinquieme.innerText()).split("\n").find((t) => t.length > 2 && !/^\d+$/.test(t) && !t.includes("%"));
  await cinquieme.click();
  await page.waitForTimeout(300);
  const apres = await page.locator("#fiche-choisie article h3:visible").allInnerTexts();
  verifier(apres.length === 1 && apres[0] === nom, `résultat : la fiche affichée est ${apres.join(",")} au lieu de ${nom}`);
  const boxListe = await liste.boundingBox(), boxFiche = await page.locator("article:visible").first().boundingBox();
  verifier(boxListe.x + boxListe.width <= boxFiche.x, "résultat : la liste et la fiche ne sont pas côte à côte");
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir("telephone", S.resultat, "/resultat");
  verifier(!(await page.getByRole("navigation", { name: "Ton classement" }).isVisible()), "téléphone : la liste de gauche est visible");
  verifier((await page.locator("#fiche-choisie article h3:visible").count()) >= 3, "téléphone : le top 3 n'est pas affiché en entier");
  await ctx.close();
}

// Aucun défilement horizontal, sur toutes les pages et largeurs.
for (const largeur of [320, 375, 768, 1024, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width: largeur, height: 900 } });
  for (const [url, session] of [["/", null], ["/quiz", S["carte-monde"]], ["/quiz", S.timeline], ["/quiz", S.enveloppe], ["/quiz", S["blind-test"]], ["/quiz", S.seuil], ["/quiz", S["tri-zones"]], ["/resultat", S.resultat], ["/methode", null], ["/pays/japon", null]]) {
    const page = await ctx.newPage();
    await page.addInitScript((s) => { sessionStorage.clear(); if (s) sessionStorage.setItem("country-search:quiz", s); }, session ? JSON.stringify(session) : null);
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    verifier(deborde <= 0, `${url} à ${largeur} px : ${deborde} px de défilement horizontal`);
    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(echecs ? `\n${echecs} échec(s) sur ${essais} vérifications.` : `\nOrdinateur, tablette, téléphone : ${essais} vérifications, toutes réussies.`);
process.exit(echecs ? 1 : 0);
