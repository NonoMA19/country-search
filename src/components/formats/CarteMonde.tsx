"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as EvenementPointeur } from "react";
import { geoCircle, geoEquirectangular, geoPath } from "d3-geo";
import { Check, X } from "lucide-react";
import carte from "../../../content/carte-monde.json";
import { villes, type CarteMonde as TCarte } from "@/lib/donnees";
import { nomCercle } from "@/lib/intuition";
import { pays } from "@/lib/pays";
import {
  AUCUNE_ZONE, MAX_CERCLES, RAYONS, RAYON_DEPART, RAYON_TERRE, bornerRayon, contientParis, distanceKm, ecrireCercle, lireCercle,
  paysDansCercle, pointA, type Cercle, type Point,
} from "@/lib/zones";
import { Actions, BOUTON_PLEIN, EnTete, FOCUS, type PropsFormat } from "./commun";

const DESSIN = carte as { largeur: number; hauteur: number; zones: Record<string, string> };
const L = DESSIN.largeur, H = DESSIN.hauteur; // 360 × 146
// Même projection que scripts/carte.mjs : x = longitude + 180, y = 84 − latitude (équirectangulaire, sans l'Antarctique).
// d3-geo (licence ISC) dessine les cercles : il les coupe proprement à l'antiméridien (Nouvelle-Zélande, Fidji) et autour des pôles.
const projection = geoEquirectangular().scale(180 / Math.PI).translate([180, 84]).clipExtent([[0, 0], [L, H]]).precision(0.2);
const chemin = geoPath(projection);
const xy = (p: Point): [number, number] => [p.lon + 180, 84 - p.lat];
const dessinCercle = (c: Cercle) => chemin(geoCircle().center([c.lon, c.lat]).radius(((c.km / RAYON_TERRE) * 180) / Math.PI).precision(1)()) ?? "";
const TERRES = Object.values(DESSIN.zones).join("");
const VILLES = pays.filter((p) => villes[p.id]).map((p) => ({ id: p.id, nom: p.nom, ville: villes[p.id].nom, point: { lat: villes[p.id].lat, lon: villes[p.id].lon } }));
const nomPays = (id: string) => pays.find((p) => p.id === id)?.nom ?? id;
const km = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} km`;
const cranDe = (k: number) => RAYONS.reduce((m, r, i) => (Math.abs(r - k) < Math.abs(RAYONS[m] - k) ? i : m), 0);
// Les anciennes régions (parcours d'avant) se montrent comme le groupe le plus proche.
const GROUPE_DE_REGION: Record<string, string[]> = {
  europe: ["g-europe"], "amerique-nord": ["g-ameriques"], "amerique-latine": ["g-ameriques"], "asie-est": ["g-asie"], "asie-sud-est": ["g-asie"],
  "asie-sud": ["g-asie"], oceanie: ["g-oceanie"], "moyen-orient": ["g-moyen-orient", "g-maghreb-afrique-ouest"], afrique: ["g-maghreb-afrique-ouest"],
};

// La poignée du rayon : le point du bord à l'est, ou à l'ouest, au sud, au nord si l'est sort de la carte.
function poignee(c: Cercle): [number, number] {
  const [cx] = xy(c);
  for (const cap of [90, 270, 180, 0]) {
    const [x, y] = xy(pointA(c, c.km, cap));
    if (x >= 2 && x <= L - 2 && y >= 2 && y <= H - 2 && Math.abs(x - cx) < L / 2) return [x, y];
  }
  return xy(c);
}

// Liste lisible : « Belgique, Suisse et Allemagne », ou les 8 premiers et « 5 autres ».
function liste(ids: string[]): string {
  const noms = ids.map(nomPays).sort((a, b) => a.localeCompare(b, "fr"));
  if (noms.length <= 8) return noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : noms[0] ?? "";
  return `${noms.slice(0, 8).join(", ")} et ${noms.length - 8} autres`;
}

// « Où te vois-tu vivre ? » : un planisphère où l'on place jusqu'à 3 zones (un centre et un rayon réel en km).
// Souris : un cercle fantôme suit le curseur, les pays dedans s'éclairent ; un clic le pose.
// Doigt : on touche, l'aperçu suit le doigt, le cercle se pose au relâchement. Le bord (ou sa poignée) se glisse pour changer le rayon.
// Clavier et lecteur d'écran : le curseur gradué, la liste des villes et les 6 groupes de pays font la même chose.
export default function CarteMonde({ element: el, etat, valeur, repondre, passer, libellePasser, titreId }: PropsFormat<TCarte>) {
  const depart = Array.isArray(valeur) ? (valeur as string[]) : [];
  const [cercles, setCercles] = useState<Cercle[]>(() => depart.map(lireCercle).filter((c): c is Cercle => !!c));
  const [groupes, setGroupes] = useState<string[]>(() => [...new Set(depart.flatMap((x) => (el.groupes.some((g) => g.id === x) ? [x] : GROUPE_DE_REGION[x] ?? [])))]);
  const [actif, setActif] = useState<number | null>(() => (cercles.length ? cercles.length - 1 : null));
  const [rayon, setRayon] = useState(RAYON_DEPART); // le rayon du prochain cercle
  const [fantome, setFantome] = useState<Point | null>(null);
  const [message, setMessage] = useState("");
  const [echelle, setEchelle] = useState(1); // pixels par unité de la carte
  const svg = useRef<SVGSVGElement>(null);
  const geste = useRef<{ type: "placer" | "rayon" | "choisir"; index?: number; pointeur: string } | null>(null);

  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const mesurer = () => setEchelle(s.getBoundingClientRect().width / L || 1);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(s);
    return () => ro.disconnect();
  }, []);

  const rayonCourant = actif !== null && cercles[actif] ? cercles[actif].km : rayon;
  const plein = cercles.length >= MAX_CERCLES;
  const procheChoisi = Array.isArray(etat.reponses.envies) && (etat.reponses.envies as string[]).includes("proche");
  const dansCercles = useMemo(() => cercles.map(paysDansCercle), [cercles]);
  const dansGroupes = el.groupes.filter((g) => groupes.includes(g.id)).flatMap((g) => g.pays);
  const dansZone = [...new Set([...dansCercles.flat(), ...dansGroupes])];
  const apercu = fantome ? paysDansCercle({ ...fantome, km: rayon }) : [];
  const aUneZone = cercles.length + groupes.length > 0;

  // ---------- Gestes sur la carte ----------
  const versPoint = (e: EvenementPointeur): Point => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * L, y = ((e.clientY - r.top) / r.height) * H;
    return { lon: Math.min(179.9, Math.max(-179.9, x - 180)), lat: Math.min(84, Math.max(-62, 84 - y)) };
  };
  const placer = (p: Point) => {
    if (plein) { setMessage(`${MAX_CERCLES} zones au plus : efface une zone pour en placer une autre.`); return; }
    const c = { lat: Math.round(p.lat * 10) / 10, lon: Math.round(p.lon * 10) / 10, km: bornerRayon(rayon) };
    setCercles((l) => [...l, c]);
    setActif(cercles.length);
    setMessage("");
  };
  const bas = (e: EvenementPointeur<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const cible = e.target as Element;
    const bord = cible.closest("[data-bord]")?.getAttribute("data-bord");
    e.currentTarget.setPointerCapture(e.pointerId);
    if (bord !== null && bord !== undefined) {
      geste.current = { type: "rayon", index: Number(bord), pointeur: e.pointerType };
      setActif(Number(bord));
      setFantome(null);
      return;
    }
    // Toucher le centre d'une zone la sélectionne (pour régler son rayon ou l'effacer), sans en créer une autre.
    const p = versPoint(e);
    const tolerance = (e.pointerType === "mouse" ? 10 : 22) / echelle;
    const proche = cercles.findIndex((c) => { const [x, y] = xy(c), [px, py] = xy(p); return Math.hypot(x - px, y - py) <= tolerance; });
    if (proche >= 0) { geste.current = { type: "choisir", pointeur: e.pointerType }; setActif(proche); setFantome(null); return; }
    geste.current = { type: "placer", pointeur: e.pointerType };
    if (!plein) setFantome(p);
    else setMessage(`${MAX_CERCLES} zones au plus : efface une zone pour en placer une autre.`);
  };
  const bouge = (e: EvenementPointeur<SVGSVGElement>) => {
    const g = geste.current;
    const p = versPoint(e);
    if (g?.type === "rayon" && g.index !== undefined) {
      const c = cercles[g.index];
      if (!c) return;
      const nouveau = bornerRayon(distanceKm(c, p));
      setCercles((l) => l.map((x, i) => (i === g.index ? { ...x, km: nouveau } : x)));
      return;
    }
    if (g?.type === "placer" && !plein) { setFantome(p); return; }
    if (!g && e.pointerType === "mouse" && !plein) setFantome(p);
  };
  const haut = (e: EvenementPointeur<SVGSVGElement>) => {
    const g = geste.current;
    geste.current = null;
    if (g?.type === "placer" && !plein) placer(versPoint(e));
    if (e.pointerType !== "mouse") setFantome(null);
  };
  const annuler = () => { geste.current = null; setFantome(null); };

  // ---------- Commandes ----------
  const changerRayon = (k: number) => {
    if (actif !== null && cercles[actif]) setCercles((l) => l.map((x, i) => (i === actif ? { ...x, km: k } : x)));
    else setRayon(k);
  };
  const effacerZone = (i: number) => {
    setCercles((l) => l.filter((_, k) => k !== i));
    setActif((a) => (a === null || cercles.length <= 1 ? null : a === i ? Math.max(0, i - 1) : a > i ? a - 1 : a));
    setMessage("");
  };
  const toutEffacer = () => { setCercles([]); setGroupes([]); setActif(null); setMessage(""); };
  const basculerGroupe = (id: string) => setGroupes((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const surVille = (id: string) => { const v = VILLES.find((x) => x.id === id); if (v) placer(v.point); };

  // ---------- Le texte vivant ----------
  let resume: string;
  if (!aUneZone) resume = "Pas encore de zone. Touche la carte pour placer la première, ou choisis une région plus bas.";
  else if (dansZone.length) resume = `${dansZone.length} pays de notre base dans ta zone${" "}: ${liste(dansZone)}.`;
  else {
    // Aucun pays : on dit le plus proche du bord d'une zone, sans bloquer.
    let best = { id: "", d: Infinity };
    for (const c of cercles) for (const v of VILLES) { const d = distanceKm(c, v.point) - c.km; if (d < best.d) best = { id: v.id, d }; }
    const v = VILLES.find((x) => x.id === best.id);
    resume = v ? `Aucun pays de notre base dans ta zone. Le plus proche${" "}: ${v.nom} (${v.ville}), à ${km(best.d)} de son bord. Tu peux agrandir le rayon, ou continuer quand même.` : "Aucun pays de notre base dans ta zone.";
  }
  const doublon = procheChoisi && (cercles.some(contientParis) || groupes.includes("g-europe"));
  const valeurFinale = [...cercles.map(ecrireCercle), ...groupes];

  return (
    <>
      <EnTete element={el} titreId={titreId} />
      <div className="relative mt-5">
        <svg ref={svg} viewBox={`0 0 ${L} ${H}`} role="img" data-valeur={valeurFinale.join(" ")} aria-labelledby="carte-titre" aria-describedby="carte-resume"
          className={`block w-full touch-none rounded-2xl bg-creux select-none ${plein ? "cursor-default" : "cursor-crosshair"}`}
          onPointerDown={bas} onPointerMove={bouge} onPointerUp={haut} onPointerCancel={annuler} onPointerLeave={(e) => { if (!geste.current && e.pointerType === "mouse") setFantome(null); }}>
          <title id="carte-titre">{`Carte du monde${cercles.length ? `, ${cercles.length} zone${cercles.length > 1 ? "s" : ""} placée${cercles.length > 1 ? "s" : ""}` : ""}`}</title>
          <path d={TERRES} className="fill-bord" />
          {cercles.map((c, i) => (
            <g key={`${i}-${c.lat}-${c.lon}`}>
              <path d={dessinCercle(c)} className={`${i === actif ? "fill-bleu/20 stroke-bleu" : "fill-bleu/10 stroke-bleu/60"}`} strokeWidth={1.4 / echelle} />
              {/* Le bord se glisse pour changer le rayon : une large bande invisible le rend facile à attraper. */}
              <path d={dessinCercle(c)} data-bord={i} fill="none" stroke="transparent" strokeWidth={14 / echelle} style={{ pointerEvents: "stroke", cursor: "ew-resize" }} />
            </g>
          ))}
          {fantome && <path d={dessinCercle({ ...fantome, km: rayon })} className="pointer-events-none fill-bleu/10 stroke-bleu" strokeDasharray={`${4 / echelle} ${3 / echelle}`} strokeWidth={1.2 / echelle} />}
          {VILLES.map((v) => {
            const [x, y] = xy(v.point);
            const dedans = dansZone.includes(v.id), vise = apercu.includes(v.id);
            return <circle key={v.id} cx={x} cy={y} r={(dedans || vise ? 4 : 2.6) / echelle} className={`pointer-events-none ${dedans ? "fill-bleu" : vise ? "fill-lien" : "fill-gris"} stroke-carte`} strokeWidth={1 / echelle} />;
          })}
          {cercles.map((c, i) => {
            const [cx, cy] = xy(c), [px, py] = poignee(c);
            return (
              <g key={`p${i}`}>
                <circle cx={cx} cy={cy} r={3 / echelle} className="pointer-events-none fill-carte stroke-bleu" strokeWidth={1.5 / echelle} />
                <g data-bord={i} style={{ cursor: "ew-resize" }}>
                  <circle cx={px} cy={py} r={22 / echelle} fill="transparent" />
                  <circle cx={px} cy={py} r={(i === actif ? 6 : 4.5) / echelle} className="fill-carte stroke-bleu" strokeWidth={2 / echelle} />
                </g>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 text-xs text-gris">
          Carte : Natural Earth (domaine public). Un point = la ville de référence d’un pays de notre base.
          <span className="hidden pointeur-fin:inline"> Clique pour placer une zone ; glisse son bord pour changer le rayon.</span>
          <span className="pointeur-fin:hidden"> Touche et glisse pour placer une zone ; glisse son bord pour changer le rayon.</span>
        </p>
      </div>

      <p id="carte-resume" className="mt-3 font-medium" aria-live="polite">{resume}</p>
      {fantome && !plein && <p className="mt-1 text-sm text-gris" aria-hidden="true">Ici, {nomCercle({ ...fantome, km: rayon })}{" "}: {apercu.length ? `${apercu.length} pays (${liste(apercu)})` : "aucun pays de notre base"}.</p>}
      {message && <p role="status" className="mt-2 text-sm font-medium text-lien">{message}</p>}
      {doublon && <p className="mt-2 text-sm text-gris">Ta zone contient la France et tu as choisi l’envie « Proche de la France »{" "}: elle ne donne pas de bonus en plus, la proximité compte déjà une fois.</p>}

      {cercles.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tes zones">
          {cercles.map((c, i) => (
            <li key={`z${i}`} className={`flex items-center rounded-full border-2 ${i === actif ? "border-bleu bg-bleu-doux" : "border-bord bg-carte"}`}>
              <button type="button" aria-pressed={i === actif} onClick={() => setActif(i)} className={`min-h-11 rounded-l-full py-1 pr-2 pl-4 text-left text-sm font-medium ${FOCUS}`}>
                Zone {i + 1}{" "}: {nomCercle(c)}, {km(c.km)}
              </button>
              <button type="button" onClick={() => effacerZone(i)} aria-label={`Effacer la zone ${i + 1}`} className={`flex h-11 w-11 items-center justify-center rounded-r-full text-gris hover:text-encre ${FOCUS}`}>
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-4 block">
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-medium">{actif !== null && cercles[actif] ? `Rayon de la zone ${actif + 1}` : "Rayon de ta prochaine zone"}</span>
          <span className="font-semibold text-lien tabular-nums">{km(rayonCourant)}</span>
        </span>
        <input type="range" min={0} max={RAYONS.length - 1} step={1} value={cranDe(rayonCourant)} onChange={(e) => changerRayon(RAYONS[Number(e.target.value)])}
          aria-valuetext={km(rayonCourant)} className="mt-2 h-10 w-full accent-bleu" />
        <span className="flex justify-between text-xs text-gris tabular-nums" aria-hidden="true">{RAYONS.map((r) => <span key={r}>{r.toLocaleString("fr-FR")}</span>)}</span>
      </label>

      <label className="mt-4 block">
        <span className="font-medium">Ou place une zone autour d’une ville</span>
        <select value="" onChange={(e) => surVille(e.target.value)} disabled={plein}
          className={`mt-2 block min-h-12 w-full rounded-2xl border-2 border-bord bg-carte px-3 text-base disabled:opacity-50 lg:max-w-md ${FOCUS}`}>
          <option value="">{plein ? `${MAX_CERCLES} zones placées` : "Choisir une ville…"}</option>
          {[...VILLES].sort((a, b) => a.ville.localeCompare(b.ville, "fr")).map((v) => <option key={v.id} value={v.id}>{v.ville} ({v.nom})</option>)}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="font-medium">Ou choisis une ou plusieurs régions</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {el.groupes.map((g) => {
            const on = groupes.includes(g.id);
            return (
              <button key={g.id} type="button" aria-pressed={on} onClick={() => basculerGroupe(g.id)}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-medium ${on ? "border-bleu bg-bleu text-white" : "border-bord bg-carte hover:border-bleu"} ${FOCUS}`}>
                {on && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}{g.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        {aUneZone && <button type="button" onClick={toutEffacer} className={`inline-flex min-h-11 items-center rounded-full border border-bord px-4 text-sm font-medium hover:border-bleu ${FOCUS}`}>Effacer</button>}
        <button type="button" onClick={() => repondre([AUCUNE_ZONE])} className={`inline-flex min-h-11 items-center rounded-full border border-dashed border-gris px-4 text-sm font-medium hover:border-bleu ${FOCUS}`}>Je n’ai pas de zone précise</button>
      </div>
      <p className="mt-3 text-xs text-gris">Limite : une seule ville de référence par pays (souvent la capitale ou la plus grande ville). Un cercle peut toucher un pays sans contenir sa ville : il ne compte alors pas ce pays.</p>

      <Actions passer={passer} libellePasser={libellePasser}>
        <button type="button" data-valider disabled={!aUneZone} onClick={() => repondre(valeurFinale)} className={BOUTON_PLEIN}>Continuer</button>
      </Actions>
    </>
  );
}
