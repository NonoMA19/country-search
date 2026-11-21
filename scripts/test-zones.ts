// Test de la carte « Où te vois-tu vivre ? » : distances, cercles, groupes, règle contre le double comptage,
// et effet sur le calcul (un bonus aux pays de ta zone, jamais de pays retiré). Usage : npm run test:zones
import { trouverElement, villes, type CarteMonde } from "@/lib/donnees";
import { valeurValide } from "@/lib/elements";
import { intuition, nomCercle } from "@/lib/intuition";
import { ETAT_VIDE, POIDS_CARTE, calculer, effetsActifs, etatDepart, repondre, type Etat } from "@/lib/moteur";
import { pays } from "@/lib/pays";
import { PARIS, contientParis, distanceKm, ecrireCercle, lireCarte, lireCercle, paysDansCercle, pointA, villeLaPlusProche } from "@/lib/zones";

let n = 0;
const echecs: string[] = [];
const verifier = (ok: boolean, m: string) => { n++; if (!ok) echecs.push(m); };
const carte = trouverElement("carte") as CarteMonde;
const proche = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

// Distances sur la sphère (valeurs de référence : grand cercle, rayon 6 371 km).
verifier(proche(distanceKm(PARIS, { lat: 35.6895, lon: 139.6917 }), 9712, 30), "Paris–Tokyo ≠ 9 712 km");
verifier(proche(distanceKm({ lat: -36.85, lon: 174.76 }, { lat: -18.14, lon: 178.44 }), 2111, 20), "Auckland–Suva ≠ 2 111 km");
verifier(proche(distanceKm(pointA(PARIS, 1500, 90), PARIS), 1500, 1), "pointA : mauvais rayon");
verifier(distanceKm({ lat: 0, lon: 179.5 }, { lat: 0, lon: -179.5 }) < 120, "antiméridien : 1° de longitude n'est pas proche");

// Écrire et relire une zone.
const c = { lat: 35.68, lon: 139.69, km: 1530 };
verifier(ecrireCercle(c) === "c:35.7,139.7,1550", `écriture : ${ecrireCercle(c)}`);
verifier(JSON.stringify(lireCercle("c:35.7,139.7,1550")) === JSON.stringify({ lat: 35.7, lon: 139.7, km: 1550 }), "lecture");
for (const faux of ["c:95,0,1000", "c:0,200,1000", "c:0,0,50", "c:0,0,20000", "c:0,0,1234", "c:abc", "mars"]) verifier(!valeurValide(carte, [faux]), `valide à tort : ${faux}`);
verifier(valeurValide(carte, ["c:35.7,139.7,1500", "g-europe", "europe"]), "cercle + groupe + ancienne région refusés");
verifier(!valeurValide(carte, ["c:1,1,500", "c:2,2,500", "c:3,3,500", "c:4,4,500"]), "4 cercles acceptés");
verifier(valeurValide(carte, ["aucune"]), "« aucune » refusée");

// Qui est dans un cercle : la ville de référence, à moins du rayon.
const tokyo = paysDansCercle({ lat: 35.7, lon: 139.7, km: 1500 });
verifier(tokyo.includes("japon") && tokyo.includes("coree-du-sud") && !tokyo.includes("chine"), `Tokyo 1 500 km : ${tokyo.join(",")}`);
// Antiméridien : un cercle centré sur les Fidji contient Auckland, de l'autre côté du 180e méridien.
verifier(paysDansCercle({ lat: -18.1, lon: 178.4, km: 3000 }).includes("nouvelle-zelande"), "Fidji 3 000 km : pas la Nouvelle-Zélande");
verifier(paysDansCercle({ lat: -36.8, lon: 174.7, km: 3000 }).includes("australie"), "Auckland 3 000 km : pas l'Australie (Sydney à 2 160 km)");
verifier(paysDansCercle({ lat: -30, lon: -140, km: 500 }).length === 0, "Pacifique : un pays dans le cercle");
verifier(villeLaPlusProche({ lat: -30, lon: -140 }).paysId !== "", "le plus proche : rien");
verifier(nomCercle({ ...PARIS, km: 500 }) === "autour de Paris", nomCercle({ ...PARIS, km: 500 }));
verifier(nomCercle({ lat: -36.8, lon: 174.7, km: 500 }) === "autour d’Auckland", nomCercle({ lat: -36.8, lon: 174.7, km: 500 }));

// Double comptage avec « Proche de la France ».
const autourParis = ["c:48.9,2.3,1500"], autourTokyo = ["c:35.7,139.7,1500"];
verifier(contientParis(lireCercle(autourParis[0])!), "Paris pas dans son cercle");
verifier(lireCarte(carte, autourParis, false).bonus.length > 0, "sans l'envie : pas de bonus autour de Paris");
verifier(lireCarte(carte, autourParis, true).bonus.length === 0 && lireCarte(carte, autourParis, true).dansZone.length > 0, "avec l'envie : bonus autour de Paris");
verifier(lireCarte(carte, ["g-europe"], true).bonus.length === 0, "avec l'envie : bonus au groupe Europe");
verifier(lireCarte(carte, autourTokyo, true).bonus.includes("japon"), "avec l'envie : pas de bonus autour de Tokyo");
verifier(lireCarte(carte, [...autourParis, ...autourTokyo], true).bonus.join() === lireCarte(carte, autourTokyo, true).bonus.join(), "avec l'envie : la zone de Paris compte quand même");
verifier(lireCarte(carte, ["aucune"], false).dansZone.length === 0, "« aucune » : des pays dans la zone");
// Les 6 groupes couvrent les 38 pays, chacun une fois.
const tousGroupes = carte.groupes.flatMap((g) => g.pays);
verifier(tousGroupes.length === pays.length && pays.every((p) => tousGroupes.includes(p.id)), "groupes : il manque un pays ou un pays est en double");

// Effet sur le calcul : un bonus de 1,1 aux pays de la zone, aucun pays retiré, rien sans zone.
const base = (envies: string[]): Etat => repondre(repondre(etatDepart({ ...ETAT_VIDE, graine: 3 }), "envies", envies), "classement", envies);
const e = base(["salaire", "travail", "securite", "climat", "francais"]);
const avec = repondre(e, "carte", autourTokyo);
const bonus = effetsActifs(avec).find((x) => x.mesure === "region-carte");
verifier(bonus?.poids === POIDS_CARTE, `bonus : ${bonus?.poids}`);
verifier(effetsActifs(repondre(e, "carte", ["aucune"])).every((x) => x.mesure !== "region-carte"), "« aucune » donne un bonus");
const lignesSans = calculer(e), lignesAvec = calculer(avec);
verifier(lignesSans.filter((l) => !l.ecart).length === lignesAvec.filter((l) => !l.ecart).length, "la carte écarte un pays");
const score = (ls: ReturnType<typeof calculer>, id: string) => ls.find((l) => l.pays.id === id)!.score;
verifier(score(lignesAvec, "japon") > score(lignesSans, "japon"), "Japon : pas de bonus dans sa zone");
verifier(lignesAvec.find((l) => l.pays.id === "japon")!.details.some((d) => d.mesure === "region-carte" && d.accord === 1), "Japon : le détail ne montre pas le bonus");
verifier(!lignesAvec.find((l) => l.pays.id === "bresil")!.details.some((d) => d.mesure === "region-carte" && d.accord > 0), "Brésil hors zone : un bonus");
// Avec « Proche de la France », un cercle autour de Paris ne change rien au calcul.
const eProche = base(["proche", "salaire", "travail", "securite", "climat"]);
verifier(JSON.stringify(calculer(repondre(eProche, "carte", autourParis)).map((l) => [l.pays.id, l.score])) === JSON.stringify(calculer(eProche).map((l) => [l.pays.id, l.score])), "double comptage : le cercle autour de Paris change le classement");
// Intuition : un n° 1 dans ta zone est reconnu ; hors de ta zone, on le dit.
const n1 = calculer(avec).find((l) => !l.ecart && !l.peuDeDonnees)!;
const v1 = villes[n1.pays.id];
verifier(intuition(repondre(e, "carte", [ecrireCercle({ lat: v1.lat, lon: v1.lon, km: 200 })])).cas === "bonne", "intuition : le n° 1 dans ta zone n'est pas reconnu");
const loin = intuition(repondre(e, "carte", ["c:-30,-140,500"]));
verifier(loin.cas === "autre" && loin.phrase.startsWith("Tu pensais autour"), `intuition hors zone : ${loin.phrase}`);

if (echecs.length) { console.log(`✗ ${echecs.length} échec(s) sur ${n} vérifications :\n  - ${echecs.join("\n  - ")}`); process.exit(1); }
console.log(`✓ Carte : ${n} vérifications réussies.`);
