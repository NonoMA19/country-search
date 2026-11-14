import Link from "next/link";

// Affiché tant que la page n'a pas lu tes réponses dans le navigateur.
// Si JavaScript est coupé, ou si les scripts ne chargent pas, on le dit au lieu d'attendre sans fin.
export default function Chargement() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
      <p className="text-gris">Chargement…</p>
      <noscript>
        <p className="mt-4 rounded-2xl border border-bord bg-carte p-4">
          Cette page a besoin de JavaScript pour fonctionner. Active-le dans ton navigateur, puis recharge la page.{" "}
          <Link href="/" className="text-lien underline">Retour à l’accueil</Link>
        </p>
        <style>{".apparait-tard{display:none}"}</style>
      </noscript>
      <p className="apparait-tard mt-4 rounded-2xl border border-bord bg-carte p-4">
        Ça prend du temps ? Vérifie ta connexion et recharge la page.{" "}
        <Link href="/" className="text-lien underline">Retour à l’accueil</Link>
      </p>
    </main>
  );
}
