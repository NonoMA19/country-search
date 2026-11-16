"use client";

import "./globals.css";
import Erreur from "@/components/Erreur";

// Une erreur dans la mise en page elle-même : la page remplace tout, avec ses propres balises html et body.
export default function ErreurGlobale({ error }: { error: unknown; retry: () => void }) {
  if (typeof window !== "undefined") console.error(error);
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col bg-fond text-encre">
        <Erreur titre="Oups, le site n’a pas pu s’afficher" />
      </body>
    </html>
  );
}
