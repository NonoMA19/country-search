import { ExternalLink } from "lucide-react";

// « www.canada.ca/fr/… » devient « canada.ca » : assez pour reconnaître le site.
export const domaine = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

// Un lien officiel en petite carte : « Site officiel », le nom de la page et le nom de domaine.
// Aucun logo de gouvernement ou d'organisme.
export default function LienOfficiel({ url, nom, titre = "Site officiel", className = "mt-2" }: { url: string; nom: string; titre?: string; className?: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex min-h-11 items-center gap-3 rounded-xl border border-bord bg-carte px-3 py-2 hover:border-bleu ${className}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-gris">{titre}</span>
        <span className="block font-medium break-words text-lien underline underline-offset-2">{nom}</span>
        <span className="block text-xs text-gris">{domaine(url)}<span className="sr-only"> (s’ouvre dans un nouvel onglet)</span></span>
      </span>
      <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-gris" />
    </a>
  );
}
