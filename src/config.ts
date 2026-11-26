// Réglages du site.

// Adresse qui reçoit les signalements (« Signaler un problème »).
// Tant qu'elle est vide, le bouton affiche « Les signalements seront ouverts bientôt. »
// Rien n'est envoyé ni stocké par le site : le bouton ouvre seulement
// l'application de courriel de la personne, avec un message prérempli.
export const CONTACT_EMAIL = "";

// Un pays à 5 points ou moins du premier de son groupe est affiché à égalité avec lui.
export const ECART_EX_AEQUO = 5;


// « Il t'est accessible » (0 à 100) pèse sur le classement : score = « Il te ressemble » × (1 − POIDS_ACCES × (100 − accès) ÷ 100).
// Avec 0,15 (prompt 7) : le classement suit surtout « Il te ressemble ». Un pays accessible à 80 garde 97 % de son score ;
// à 65 (un visa de travail et une limite rédhibitoire), 94,75 %.
export const POIDS_ACCES = 0.15;
// Ce que chaque obstacle retire à « Il t'est accessible » (sur 100).
export const OBSTACLES = {
  pvt: 5, // un PVT à demander
  pvtDifficile: 15, // PVT sur invitation ou à quota très faible
  visa: 20, // un visa de travail, en général avec un employeur
  pvtFerme: 20, // PVT fermé à ton âge : reste le visa de travail
  manque: 15, // il te manquerait de l'argent à coup sûr pour le PVT
  manquePossible: 5, // il pourrait te manquer de l'argent
  duree: 10, // tu veux rester plus d'un an, ta seule porte est un PVT
  francais: 30, // tu veux travailler en français, ce n'est pas possible ici
  eviter: 10, // une de tes limites « Je préfère éviter »
  redhibitoire: 15, // une de tes limites « Rédhibitoire »
  valeur: 15, // une valeur « Indispensable » mal notée ici
};
// Une mesure ne bouge le classement que si au moins ce nombre de pays (sur 38) ont une donnée.
export const SEUIL_PAYS_CLASSEMENT = 30;
// Les critères essentiels comptent toujours, même notés pour moins de 30 pays : salaire (ou indemnité VIE),
// coût de la vie, sécurité, langue de travail. Un pays sans donnée sur l'un d'eux ne peut pas entrer dans le top 3
// si c'est une de tes 3 premières envies (règle des 3 premières envies).
export const MESURES_ESSENTIELLES = ["salaire", "indemnite-vie", "prix", "securite", "langue-travail", "anglais"];
