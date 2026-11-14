// Icônes libres (Lucide, licence ISC).
import { Banknote, Briefcase, Clock, House, PiggyBank, Plane, Scale, ShieldCheck, Sun, Users, type LucideProps } from "lucide-react";

const ICONES = {
  briefcase: Briefcase, banknote: Banknote, "piggy-bank": PiggyBank, clock: Clock, sun: Sun, plane: Plane,
  shield: ShieldCheck, users: Users, travailler: Briefcase, vivre: House, valeurs: Scale,
};

export default function Icone({ nom, ...props }: { nom: string } & LucideProps) {
  const Composant = ICONES[nom as keyof typeof ICONES] ?? Briefcase;
  return <Composant aria-hidden="true" {...props} />;
}
