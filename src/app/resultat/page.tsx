import type { Metadata } from "next";
import Resultat from "@/components/resultat/Resultat";

export const metadata: Metadata = {
  title: "Ton résultat | Country Search",
  description: "Ton top 3 des pays où partir travailler, avec le pourquoi de chaque score, ta porte d’entrée et les preuves.",
};

export default function PageResultat() {
  return <Resultat />;
}
