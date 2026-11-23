// Le registre unique des formats : un type d'élément → son composant.
// Tous reçoivent les mêmes props (PropsFormat) et répondent avec le même schéma (Valeur, ou « passer »).
import type { ComponentType } from "react";
import type { TypeElement } from "@/lib/donnees";
import Ambiances from "./Ambiances";
import BlindTest from "./BlindTest";
import Enveloppe from "./Enveloppe";
import Seuil from "./Seuil";
import Timeline from "./Timeline";
import TriZones from "./TriZones";
import CarteMonde from "./CarteMonde";
import ChoixCartes from "./ChoixCartes";
import Classement from "./Classement";
import Curseur from "./Curseur";
import Dilemme from "./Dilemme";
import Swipe from "./Swipe";
import Thermometre from "./Thermometre";
import TriLimites from "./TriLimites";
import type { PropsFormat } from "./commun";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FORMATS: Record<TypeElement, ComponentType<PropsFormat<any>>> = {
  "choix-cartes": ChoixCartes,
  classement: Classement,
  curseur: Curseur,
  swipe: Swipe,
  ambiances: Ambiances,
  thermometre: Thermometre,
  "carte-monde": CarteMonde,
  "tri-limites": TriLimites,
  dilemme: Dilemme,
  timeline: Timeline,
  enveloppe: Enveloppe,
  seuil: Seuil,
  "tri-zones": TriZones,
  "blind-test": BlindTest,
};
