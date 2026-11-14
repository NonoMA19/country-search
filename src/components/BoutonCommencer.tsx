"use client";

import { useState } from "react";

// Bouton provisoire : le quiz n'existe pas encore.
export default function BoutonCommencer() {
  const [clique, setClique] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setClique(true)}
        className="w-full rounded-lg bg-bleu px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu sm:w-auto"
      >
        Commencer
      </button>
      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-sm text-gris">
        {clique ? "Bientôt disponible" : ""}
      </p>
    </div>
  );
}
