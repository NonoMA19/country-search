// Un emoji Fluent (Microsoft, licence MIT) en image : même rendu sur tous les téléphones.
// Les fichiers sont dans public/emojis (node scripts/emojis.mjs). Décoratif par défaut (alt vide) : le texte à côté dit tout.
export default function Emoji({ nom, className = "h-6 w-6", alt = "" }: { nom: string; className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/emojis/${nom}.svg`} alt={alt} aria-hidden={alt ? undefined : true} width={32} height={32} draggable={false} loading="lazy" decoding="async" className={`shrink-0 select-none ${className}`} />
  );
}
