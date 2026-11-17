"use client";

import { useEffect } from "react";
import Erreur from "@/components/Erreur";

// Une erreur dans le quiz : jamais une page sans issue.
export default function ErreurQuiz({ error }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <Erreur />;
}
