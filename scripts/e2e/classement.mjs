// Test de bout en bout du classement des envies (glisser-déposer), dans un vrai navigateur.
// Usage : lancer le site (npm run dev ou npm start), puis : npm run e2e:classement
// (adresse du site : variable BASE, par défaut http://localhost:3000).
// Vérifie : souris (1440 px), doigt (375 px, vrais événements tactiles), clavier, annulation,
// défilement de la page pendant le geste, rotation de l'écran, mouvement réduit.
// À chaque pas, l'écart entre le doigt et le centre de la ligne tenue doit rester stable (pas de saut),
// et l'ordre final doit être celui attendu.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { chromium } from "./playwright.mjs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SESSIONS = new URL("./.sessions.json", import.meta.url).pathname;
execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--import", "./scripts/chargeur.mjs", "scripts/e2e/sessions.ts", SESSIONS], { stdio: "ignore" });
const session = JSON.stringify(JSON.parse(fs.readFileSync(SESSIONS, "utf8")).classement);

let echecs = 0, essais = 0;
const verifier = (ok, message) => { essais++; if (!ok) { echecs++; console.log(`  ✗ ${message}`); } };
const SAUT_MAX = 12; // px : au-delà, la ligne a « sauté » loin du doigt

const MOBILE = { viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 };
const ORDI = { viewport: { width: 1440, height: 900 } };

async function ouvrir(browser, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem("country-search:quiz")) sessionStorage.setItem("country-search:quiz", s); }, session);
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.goto(`${BASE}/quiz`);
  await page.waitForSelector("ol li [data-poignee]");
  return { ctx, page, erreurs };
}
const ordre = (page) => page.$$eval("ol li[data-item]", (l) => l.map((x) => x.dataset.flip));
// Le centre de la ligne tenue : sa copie qui suit le pointeur pendant le geste, sinon la ligne elle-même.
const centreDe = (page, id) => page.evaluate((id) => { const el = document.querySelector(`[data-copie="${id}"]`) ?? document.querySelector(`ol li[data-flip="${id}"]`); const r = el.getBoundingClientRect(); return r.top + r.height / 2; }, id);
// Centre vertical de la place n (avant le geste) : là où il faut lâcher pour arriver à cette place.
const places = (page) => page.$$eval("ol li[data-item]", (l) => l.map((x) => { const r = x.getBoundingClientRect(); return r.top + r.height / 2; }));

// Un geste : appui sur la poignée de la ligne « de », glissement vers le centre de la place « vers ».
// « pendant » : une action au milieu du geste (défilement, rotation…).
// L'ordre attendu se calcule là où le doigt lâche, en coordonnées de la page : si la page a défilé
// (défilement automatique près du bord, molette), la ligne doit arriver à la place qui est sous le doigt.
async function glisser(page, mode, de, vers, { pas = 30, pendant } = {}) {
  const avant = await ordre(page);
  const id = avant[de];
  const poignee = page.locator(`ol li[data-flip="${id}"] [data-poignee]`);
  await poignee.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(100);
  const sy0 = await page.evaluate(() => scrollY);
  const cibles = (await places(page)).map((c) => c + sy0); // centres des places, en coordonnées de la page
  const b = await poignee.boundingBox();
  const x = b.x + b.width / 2, y0 = b.y + b.height / 2;
  const prise = y0 + sy0 - cibles[de]; // décalage doigt / centre de la ligne
  const y1 = cibles[vers] + prise - sy0;
  const cdp = mode === "doigt" ? await page.context().newCDPSession(page) : null;
  const toucher = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
  if (cdp) { await toucher("touchStart", y0); await page.waitForTimeout(180); } // appui un peu plus long que 120 ms
  else { await page.mouse.move(x, y0); await page.mouse.down(); }
  const ecarts = [];
  let decalage = 0, y = y0; // ce que la page a défilé à cause de « pendant »
  for (let k = 1; k <= pas; k++) {
    if (pendant && k === Math.floor(pas / 2)) decalage += (await pendant(page)) ?? 0;
    y = y0 + ((y1 - y0) * k) / pas - decalage;
    if (cdp) await toucher("touchMove", y); else await page.mouse.move(x, y);
    await page.waitForTimeout(16);
    // Chrome garde pour lui les mouvements du doigt tant qu'il n'a pas bougé de 15 px (zone morte du navigateur) : on n'en tient pas compte.
    if (!cdp || Math.abs(y - y0) > 16) ecarts.push((await centreDe(page, id)) - y);
  }
  const syFin = await page.evaluate(() => scrollY);
  if (cdp) await toucher("touchEnd"); else await page.mouse.up();
  await page.waitForTimeout(350);
  const centreFin = y + syFin - prise;
  const sousLeDoigt = cibles.reduce((m, c, k) => (Math.abs(c - centreFin) < Math.abs(cibles[m] - centreFin) ? k : m), 0);
  const sauts = ecarts.slice(1).map((e, k) => Math.abs(e - ecarts[k]));
  return { id, avant, apres: await ordre(page), sautMax: Math.max(0, ...sauts), ecarts, sousLeDoigt };
}
const attendu = (avant, de, vers) => { const o = [...avant]; const [x] = o.splice(de, 1); o.splice(vers, 0, x); return o; };

const browser = await chromium.launch();
for (const [mode, opts] of [["souris", ORDI], ["doigt", MOBILE]]) {
  console.log(`— ${mode}`);
  for (const [de, vers, pas] of [[2, 0, 30], [0, 4, 40], [4, 1, 30], [0, 4, 4], [3, 2, 12]]) {
    const { ctx, page, erreurs } = await ouvrir(browser, opts);
    const r = await glisser(page, mode, de, vers, { pas });
    verifier(r.apres.join() === attendu(r.avant, de, vers).join(), `${mode} ${de + 1}e → ${vers + 1}e (${pas} pas) : ordre ${r.apres.join(",")}`);
    if (pas >= 12) verifier(r.sautMax <= SAUT_MAX, `${mode} ${de + 1}e → ${vers + 1}e : la ligne saute de ${Math.round(r.sautMax)} px (${r.ecarts.map(Math.round).join(" ")})`);
    verifier(erreurs.length === 0, `${mode} : erreurs ${erreurs.join(" | ")}`);
    await ctx.close();
  }
  // Aller-retour : l'ordre revient à l'identique.
  {
    const { ctx, page } = await ouvrir(browser, opts);
    const r1 = await glisser(page, mode, 1, 3);
    const r2 = await glisser(page, mode, 3, 1);
    verifier(r2.apres.join() === r1.avant.join(), `${mode} aller-retour : ${r2.apres.join(",")}`);
    await ctx.close();
  }
  // Annuler avec Échap pendant le geste : rien ne change.
  {
    const { ctx, page } = await ouvrir(browser, opts);
    const r = await glisser(page, mode, 0, 3, { pendant: async (p) => { await p.keyboard.press("Escape"); return 0; } });
    verifier(r.apres.join() === r.avant.join(), `${mode} Échap : l'ordre a changé (${r.apres.join(",")})`);
    await ctx.close();
  }
  // La page défile pendant le geste (molette, ou défilement automatique près du bord) : la ligne reste sous le doigt.
  {
    const { ctx, page } = await ouvrir(browser, mode === "doigt" ? { ...opts, viewport: { width: 375, height: 520 } } : { ...opts, viewport: { width: 1440, height: 520 } });
    const r = await glisser(page, mode, 0, 3, { pas: 40, pendant: async (p) => p.evaluate(() => { const avant = scrollY; scrollBy(0, 60); return scrollY - avant; }) });
    verifier(r.apres.join() === attendu(r.avant, 0, r.sousLeDoigt).join(), `${mode} défilement pendant le geste : ordre ${r.apres.join(",")}, attendu la place ${r.sousLeDoigt + 1}`);
    verifier(r.sautMax <= SAUT_MAX, `${mode} défilement pendant le geste : la ligne saute de ${Math.round(r.sautMax)} px`);
    await ctx.close();
  }
}

// Doigt : un balayage rapide sur la poignée (sans l'appui de 120 ms) ne déplace rien.
{
  const { ctx, page } = await ouvrir(browser, MOBILE);
  const avant = await ordre(page);
  const b = await page.locator("ol li [data-poignee]").first().boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
  for (let k = 1; k <= 6; k++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + 30 * k, id: 1 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(300);
  verifier((await ordre(page)).join() === avant.join(), "doigt : un balayage rapide a déplacé une ligne");
  await ctx.close();
}

// Rotation de l'écran pendant le geste : le geste s'annule proprement, puis un nouveau geste marche en paysage.
{
  const { ctx, page } = await ouvrir(browser, MOBILE);
  const r = await glisser(page, "doigt", 0, 2, { pendant: async (p) => { await p.setViewportSize({ width: 667, height: 375 }); await p.waitForTimeout(100); return 0; } });
  verifier(r.apres.join() === r.avant.join() || r.apres.join() === attendu(r.avant, 0, 2).join(), `rotation pendant le geste : ordre incohérent ${r.apres.join(",")}`);
  const r2 = await glisser(page, "doigt", 3, 0);
  verifier(r2.apres.join() === attendu(r2.avant, 3, 0).join(), `après rotation : ordre ${r2.apres.join(",")}`);
  verifier(r2.sautMax <= SAUT_MAX, `après rotation : la ligne saute de ${Math.round(r2.sautMax)} px`);
  await ctx.close();
}

// Clavier : la poignée prend le focus, Espace soulève, flèches, Espace pose ; Échap annule.
for (const opts of [ORDI, MOBILE]) {
  const { ctx, page } = await ouvrir(browser, opts);
  const avant = await ordre(page);
  await page.locator("ol li [data-poignee]").first().focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  for (let k = 0; k < 2; k++) { await page.keyboard.press("ArrowDown"); await page.waitForTimeout(150); }
  await page.keyboard.press("Space");
  await page.waitForTimeout(350);
  const apres = await ordre(page);
  verifier(apres.join() === attendu(avant, 0, 2).join(), `clavier : ordre ${apres.join(",")}`);
  await page.locator("ol li [data-poignee]").first().focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(350);
  verifier((await ordre(page)).join() === apres.join(), "clavier : Échap n'annule pas");
  // Flèches de secours.
  const premier = apres[0];
  await page.locator(`#descendre-${premier}`).click();
  await page.waitForTimeout(400);
  verifier((await ordre(page))[1] === premier, "bouton « descendre » sans effet");
  verifier(await page.evaluate((id) => document.activeElement?.id === `descendre-${id}`, premier), "bouton « descendre » : le focus est perdu");
  await ctx.close();
}

// Mouvement réduit : les autres lignes ne glissent pas (aucune transition), le geste marche.
{
  const { ctx, page } = await ouvrir(browser, { ...ORDI, reducedMotion: "reduce" });
  const avant = await ordre(page);
  const b = await page.locator("ol li [data-poignee]").first().boundingBox();
  await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down();
  await page.mouse.move(b.x + 20, b.y + 60, { steps: 4 }); await page.mouse.move(b.x + 20, b.y + 160, { steps: 8 });
  const transitions = await page.$$eval("ol li[data-item]", (l) => l.map((x) => x.style.transition).filter((t) => t && t.includes("transform")));
  await page.mouse.up();
  await page.waitForTimeout(300);
  verifier(transitions.length === 0, `mouvement réduit : transitions ${transitions.join(" | ")}`);
  verifier((await ordre(page)).join() !== avant.join(), "mouvement réduit : le geste ne marche pas");
  await ctx.close();
}

await browser.close();
console.log(echecs ? `\n${echecs} échec(s) sur ${essais} vérifications.` : `\nClassement : ${essais} vérifications, toutes réussies.`);
process.exit(echecs ? 1 : 0);
