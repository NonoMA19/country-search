// Avant d'afficher une fiche pays, on vérifie que le pays existe.
// Sans ce contrôle, une adresse inconnue répondait parfois « 200 » (page vide)
// ou « 500 » (adresse mal encodée) au lieu de « 404 ».
import { NextResponse, type NextRequest } from "next/server";
import paysData from "../content/pays.json";

const IDS = new Set((paysData as { id: string }[]).map((p) => p.id));

export function proxy(request: NextRequest) {
  const morceau = request.nextUrl.pathname.slice("/pays/".length).replace(/\/$/, "");
  let id: string | null = null;
  try {
    id = decodeURIComponent(morceau);
  } catch {
    id = null;
  }
  if (id !== null && IDS.has(id)) return NextResponse.next();
  // Une adresse qui n'existe pas : Next affiche la page 404 avec le bon code.
  return NextResponse.rewrite(new URL("/pays-introuvable", request.url));
}

export const config = {
  matcher: "/pays/:id*",
};
