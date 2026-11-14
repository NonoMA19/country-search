import Link from "next/link";

// Le pied de page commun : l'avertissement juridique est visible sur chaque page.
export default function PiedDePage({ liens = [] }: { liens?: { href: string; texte: string }[] }) {
  const tous = [...liens, { href: "/mentions-legales", texte: "Mentions légales" }];
  return (
    <footer className="mt-10 border-t border-bord pt-5 text-sm text-gris">
      <p>Les informations sur les visas et les impôts ne constituent pas un conseil juridique. Vérifie toujours auprès des sources officielles.</p>
      <ul className="mt-2 flex flex-wrap gap-x-4">
        {tous.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-11 items-center text-lien underline">{l.texte}</Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
