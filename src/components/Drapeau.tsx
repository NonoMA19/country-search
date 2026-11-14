// Drapeaux libres de droits (paquet country-flag-icons, licence MIT).
import { AE, AR, AU, BE, BR, CA, CH, CL, CN, CO, DE, DK, ES, GB, HK, IE, IT, JP, KR, LU, MA, MX, NL, NO, NZ, PT, SE, SG, TW, US } from "country-flag-icons/react/3x2";

const DRAPEAUX = { AE, AR, AU, BE, BR, CA, CH, CL, CN, CO, DE, DK, ES, GB, HK, IE, IT, JP, KR, LU, MA, MX, NL, NO, NZ, PT, SE, SG, TW, US };

export default function Drapeau({ iso2, className = "h-8 w-12" }: { iso2: string; className?: string }) {
  const Composant = DRAPEAUX[iso2 as keyof typeof DRAPEAUX];
  if (!Composant) return <span aria-hidden="true" className={className} />;
  return <Composant aria-hidden="true" className={`${className} shrink-0 rounded-md shadow-sm ring-1 ring-black/10`} />;
}
