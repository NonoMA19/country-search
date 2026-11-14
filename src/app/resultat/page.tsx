import type { Metadata } from "next";
import Resultat from "@/components/resultat/Resultat";

export const metadata: Metadata = { title: "Ton résultat | Country Search" };

export default function PageResultat() {
  return <Resultat />;
}
