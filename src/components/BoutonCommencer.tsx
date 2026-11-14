import Link from "next/link";

export default function BoutonCommencer() {
  return (
    <div>
      <Link
        href="/quiz"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-bleu px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu sm:w-auto"
      >
        Commencer
      </Link>
      <p className="mt-3 text-sm text-gris">
        Quelques minutes, sans compte. Tes réponses restent dans ton navigateur.
      </p>
    </div>
  );
}
