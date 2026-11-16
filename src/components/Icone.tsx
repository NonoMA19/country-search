// Icônes libres (Lucide, licence ISC).
import {
  Backpack, Banknote, Bed, BookOpen, Briefcase, Building2, CircleHelp, ClipboardList, Clock, Cpu, Factory, Globe, GraduationCap, House, Landmark,
  PiggyBank, Plane, Scale, ShieldCheck, ShoppingBag, Stethoscope, Sun, Trees, TrendingUp, Users, type LucideProps,
} from "lucide-react";

const ICONES = {
  briefcase: Briefcase, banknote: Banknote, "piggy-bank": PiggyBank, clock: Clock, sun: Sun, plane: Plane,
  shield: ShieldCheck, users: Users, travailler: Briefcase, vivre: House, valeurs: Scale,
  "graduation-cap": GraduationCap, backpack: Backpack, "trending-up": TrendingUp, "circle-help": CircleHelp, landmark: Landmark,
  "clipboard-list": ClipboardList, factory: Factory, cpu: Cpu, "shopping-bag": ShoppingBag, stethoscope: Stethoscope, bed: Bed,
  "book-open": BookOpen, "building-2": Building2, house: House, trees: Trees, globe: Globe,
};

export default function Icone({ nom, ...props }: { nom: string } & LucideProps) {
  const Composant = ICONES[nom as keyof typeof ICONES] ?? Briefcase;
  return <Composant aria-hidden="true" {...props} />;
}
