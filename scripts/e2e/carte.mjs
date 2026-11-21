// Test de bout en bout de la carte « Où te vois-tu vivre ? ». Usage : site lancé, puis npm run e2e:carte (BASE=…).
// Souris (fantôme, clic, glisser le bord, 3 zones au plus), doigt (aperçu, pose au relâchement, la page ne défile pas),
// clavier (curseur gradué, liste des villes, groupes), antiméridien, zone sans pays, « Je n'ai pas de zone précise ».
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "./playwright.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SESSIONS = new URL("./.sessions.json", import.meta.url).pathname;
execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--import", "./scripts/chargeur.mjs", "scripts/e2e/sessions.ts", SESSIONS], { stdio: "ignore" });
const session = JSON.stringify(JSON.parse(fs.readFileSync(SESSIONS, "utf8"))["carte-monde"]);

let echecs = 0, essais = 0;
const verifier = (ok, message) => { essais++; if (!ok) { echecs++; console.log(`  ✗ ${message}`); } };
const browser = await chromium.launch();

async function ouvrir(opts) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem("country-search:quiz")) sessionStorage.setItem("country-search:quiz", s); }, session);
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.goto(`${BASE}/quiz`);
  await page.waitForSelector("svg[data-valeur]");
  await page.waitForTimeout(400); // fin de l'animation d'entrée de l'écran
  const carte = page.locator("svg[data-valeur]");
  // La carte est remesurée à chaque fois : un clic sur un bouton peut faire défiler la page.
  const ecran = async (lon, lat) => { const b = await carte.boundingBox(); return { x: b.x + ((lon + 180) / 360) * b.width, y: b.y + ((84 - lat) / 146) * b.height }; };
  const valeur = async () => ((await carte.getAttribute("data-valeur")) || "").split(" ").filter(Boolean);
  // Texte normalisé : espaces insécables et traits d'union insécables deviennent des caractères simples.
  const resume = async () => (await page.locator("#carte-resume").innerText()).replace(/[\u00a0\u202f]/g, " ").replace(/\u2011/g, "-");
  return { ctx, page, erreurs, ecran, valeur, resume };
}

// ---------- Souris ----------
{
  const { ctx, page, erreurs, ecran, valeur, resume } = await ouvrir({ viewport: { width: 1440, height: 900 } });
  const tokyo = await ecran(139.7, 35.7);
  await page.mouse.move(tokyo.x, tokyo.y);
  await page.waitForTimeout(150);
  verifier(await page.locator("svg[data-valeur] path[stroke-dasharray]").count() === 1, "souris : pas de cercle fantôme au survol");
  verifier((await page.getByText(/^Ici, autour de Tokyo/).count()) === 1, "souris : l'aperçu ne nomme pas Tokyo");
  verifier((await valeur()).length === 0, "souris : le survol a posé une zone");
  await page.mouse.click(tokyo.x, tokyo.y);
  await page.waitForTimeout(150);
  let v = await valeur();
  verifier(v.length === 1 && v[0].startsWith("c:35.") && v[0].endsWith(",1500"), `souris : clic → ${v.join(" ")}`);
  verifier((await resume()).includes("Japon") && (await resume()).includes("Corée du Sud"), `souris : texte « ${await resume()} »`);
  // Glisser la poignée du bord vers l'extérieur : le rayon grandit.
  const poignee = await page.locator("svg g[data-bord] circle").nth(1).boundingBox();
  await page.mouse.move(poignee.x + poignee.width / 2, poignee.y + poignee.height / 2);
  await page.mouse.down();
  await page.mouse.move(poignee.x + 90, poignee.y + poignee.height / 2, { steps: 8 });
  await page.mouse.up();
  v = await valeur();
  const rayon = Number(v[0]?.split(",")[2]);
  verifier(v.length === 1 && rayon > 2500, `souris : glisser le bord → ${v.join(" ")}`);
  // Deux autres zones, puis une 4e refusée avec un message.
  for (const [lon, lat] of [[-74, 40.7], [-58.4, -34.6]]) { const p = await ecran(lon, lat); await page.mouse.click(p.x, p.y); await page.waitForTimeout(100); }
  const moscou = await ecran(37.6, 55.7);
  await page.mouse.click(moscou.x, moscou.y);
  await page.waitForTimeout(150);
  verifier((await valeur()).filter((x) => x.startsWith("c:")).length === 3, `souris : ${(await valeur()).length} zones (3 au plus)`);
  verifier((await page.getByRole("status").innerText()).includes("3 zones au plus"), "souris : pas de message à la 4e zone");
  // Effacer une zone, puis tout.
  await page.getByRole("button", { name: "Effacer la zone 3" }).click();
  verifier((await valeur()).length === 2, "souris : « Effacer la zone 3 » sans effet");
  await page.getByRole("button", { name: "Effacer", exact: true }).click();
  verifier((await valeur()).length === 0, "souris : « Effacer » sans effet");
  verifier(await page.getByRole("button", { name: "Continuer" }).isDisabled(), "souris : « Continuer » actif sans zone");
  verifier(erreurs.length === 0, `souris : erreurs ${erreurs.join(" | ")}`);
  await ctx.close();
}

// ---------- Antiméridien et zone sans pays ----------
{
  const { ctx, page, ecran, valeur, resume } = await ouvrir({ viewport: { width: 1440, height: 900 } });
  await page.locator("input[type=range]").focus();
  await page.keyboard.press("ArrowRight"); // 1 500 → 3 000 km, au clavier
  verifier((await page.locator("input[type=range]").getAttribute("aria-valuetext")).replace(/\s/g, "") === "3000km", "clavier : le curseur ne passe pas à 3 000 km");
  const fidji = await ecran(178.4, -18.1);
  await page.mouse.click(fidji.x, fidji.y);
  await page.waitForTimeout(150);
  verifier((await resume()).includes("Nouvelle-Zélande"), `antiméridien : « ${await resume()} »`);
  const d = await page.locator("svg[data-valeur] g path").first().getAttribute("d");
  verifier((d.match(/M/g) ?? []).length >= 2, "antiméridien : le cercle n'est pas coupé en deux morceaux");
  await page.getByRole("button", { name: "Effacer", exact: true }).click();
  await page.locator("input[type=range]").fill("0");
  const ocean = await ecran(-140, -30);
  await page.mouse.click(ocean.x, ocean.y);
  await page.waitForTimeout(150);
  const t = await resume();
  verifier(t.startsWith("Aucun pays de notre base dans ta zone. Le plus proche"), `zone vide : « ${t} »`);
  verifier(await page.getByRole("button", { name: "Continuer" }).isEnabled(), "zone vide : on ne peut pas continuer");
  verifier((await valeur()).length === 1, "zone vide : la zone n'est pas gardée");
  await ctx.close();
}

// ---------- Doigt : aperçu pendant le glissement, pose au relâchement ----------
{
  const { ctx, page, ecran, valeur } = await ouvrir({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const cdp = await ctx.newCDPSession(page);
  const a = await ecran(100, 15), z = await ecran(-3.7, 40.4); // de l'Asie vers Madrid
  const sy = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x, y: a.y, id: 1 }] });
  for (let k = 1; k <= 12; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: a.x + ((z.x - a.x) * k) / 12, y: a.y + ((z.y - a.y) * k) / 12, id: 1 }] });
  await page.waitForTimeout(100);
  verifier(await page.locator("svg[data-valeur] path[stroke-dasharray]").count() === 1, "doigt : pas d'aperçu pendant le glissement");
  verifier((await valeur()).length === 0, "doigt : une zone posée avant le relâchement");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(150);
  const v = await valeur();
  const [lat, lon] = (v[0] ?? "c:0,0").slice(2).split(",").map(Number);
  verifier(v.length === 1 && Math.abs(lat - 40.4) < 4 && Math.abs(lon + 3.7) < 4, `doigt : zone posée à ${v.join(" ")} (attendu : Madrid)`);
  verifier((await page.evaluate(() => scrollY)) === sy, "doigt : la page a défilé pendant le geste");
  verifier(await page.locator("svg[data-valeur] path[stroke-dasharray]").count() === 0, "doigt : l'aperçu reste après le relâchement");
  // Zones tactiles : 44 px au moins pour les boutons sous la carte.
  const petits = await page.$$eval("main button, main select", (l) => l.filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent.trim().slice(0, 30)));
  verifier(petits.length === 0, `doigt : boutons de moins de 44 px : ${petits.join(" | ")}`);
  await ctx.close();
}

// ---------- Clavier et lecteur d'écran : ville, groupes, réponse enregistrée ----------
{
  const { ctx, page, valeur } = await ouvrir({ viewport: { width: 1024, height: 768 } });
  await page.locator("select").selectOption({ label: "Dakar (Sénégal)" });
  verifier((await valeur())[0]?.startsWith("c:14.7,-17.4"), `ville : ${(await valeur()).join(" ")}`);
  await page.getByRole("button", { name: "Océanie" }).click();
  verifier(await page.getByRole("button", { name: "Océanie" }).getAttribute("aria-pressed") === "true", "groupe : Océanie pas coché");
  verifier((await page.locator("#carte-resume").getAttribute("aria-live")) === "polite", "texte vivant : pas d'aria-live");
  verifier((await page.locator("#carte-resume").innerText()).includes("Australie"), "groupe : Australie absente du texte");
  const attendu = await valeur();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => JSON.parse(sessionStorage.getItem("country-search:quiz")));
  verifier(JSON.stringify(s.etat.reponses.carte) === JSON.stringify(attendu), `réponse enregistrée : ${JSON.stringify(s.etat.reponses.carte)}`);
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await page.getByRole("button", { name: "Je n’ai pas de zone précise" }).click();
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => JSON.parse(sessionStorage.getItem("country-search:quiz")));
  verifier(JSON.stringify(s.etat.reponses.carte) === '["aucune"]', `pas de zone : ${JSON.stringify(s.etat.reponses.carte)}`);
  await ctx.close();
}

await browser.close();
console.log(echecs ? `\n${echecs} échec(s) sur ${essais} vérifications.` : `\nCarte : ${essais} vérifications, toutes réussies.`);
process.exit(echecs ? 1 : 0);
