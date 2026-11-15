# Country Search (nom de code)

## Mission
Aider les étudiants et jeunes diplômés francophones à choisir le pays où partir travailler, puis à arriver prêts le jour J : visa, banque, carte SIM, santé, logement, CV local, codes culturels.

## Cible et périmètre
- Étudiants et jeunes diplômés francophones. Site en français uniquement.
- Passeport français uniquement, avec une question « As-tu une autre nationalité ? » qui affiche avantages et pièges.
- Gratuit et open source. Aucune publicité, aucune affiliation (hébergement Vercel gratuit, usage non commercial).

## Version 1 (ce qu'on construit maintenant)
- Quiz de dilemmes : de petites scènes à 2 ou 3 options, chacune avec un avantage et un prix, sans compte.
- Classement des 30 pays par un calcul transparent (pas d'IA), avec le « pourquoi » de chaque score et une méthode publiée.
- Top 3 pays, fiches pays, checklist Jour J de J-90 à J+30.
- 10 fiches complètes, 20 fiches courtes.
- Pas de compte, pas d'IA en direct, pas de témoignages (prévus en version 2).

## Les 30 pays (★ = fiche complète)
Europe sans visa : Belgique★, Suisse★, Allemagne★, Irlande★, Luxembourg, Espagne, Italie, Pays-Bas, Portugal, Norvège, Suède, Danemark.
PVT : Canada★, Australie★, Japon★, Nouvelle-Zélande, Corée du Sud, Taïwan, Hong Kong, Argentine, Chili, Colombie, Mexique, Brésil.
Visa de travail : Royaume-Uni★, États-Unis★, Singapour★, Émirats arabes unis, Chine, Maroc.

## Règles d'or
1. L'IA parle, le calcul classe, la base de fiches fournit les faits. Rien n'est inventé.
2. Chaque information a une source (lien) et une date « vérifié le ». Sinon elle est marquée « à vérifier ».
3. Données personnelles minimales. Ne jamais demander opinions politiques, religion ou santé.
4. Avertissement visible : visas et impôts ne sont pas un conseil juridique.
5. Respecter la licence de chaque source de données et la citer. Ne jamais copier le contenu d'un autre site.

## Fiche pays (structure fixe)
Résumé · Visa et statut possible (UE, PVT, VIE, visa de travail) · Double nationalité · Coût de la vie · Banque · Téléphone et SIM · Santé et assurance · Logement · Emploi et secteurs qui recrutent · CV et candidature à la locale · Codes culturels au travail · Codes culturels au quotidien · Checklist Jour J · Sources et dates.

## Technique
Next.js, TypeScript, Tailwind. Contenu des fiches en fichiers Markdown dans /content. Pas de base de données en version 1. Site pensé d'abord pour le téléphone, accessible, rapide.

## Design (provisoire)
Sobre, moderne, orienté travail, jamais « vacances ». Palette Ardoise et bleu : #0F172A, #2563EB, #64748B, #F8FAFC. Mascotte pas encore choisie : laisser un emplacement vide.

## Licences
Code : MIT. Contenu des fiches : CC BY-SA 4.0.

## Comment travailler avec Nolhan
- Expliquer simplement, en français, sans jargon.
- Petites étapes. Après chaque étape : dire ce qui a changé et comment le tester sur téléphone.
- Demander avant toute décision importante ou tout ajout payant.
- Messages de commit clairs, en français.

## Idées pour plus tard
- Loyer moyen par ville.
- Impôts : combien il reste sur 100 € bruts.
- Villes d'arrivée conseillées, transports.
- Reconnaissance du CV et des diplômes par secteur.
- Parcours (diplôme et expériences), reconversion.
- Croisement avec les offres d'emploi par secteur.
- Signalements par e-mail : remplir `CONTACT_EMAIL` dans `src/config.ts` (le bouton reste désactivé tant qu'il est vide).
- Biais de classement (remesuré au prompt 3b, `npm run simulation`, 5 000 profils) : l'Allemagne reste n°1 dans 30 % des profils (31 % avant), la Colombie et le Chili sont dans le top 3 dans 0,1 % des profils. Raison : l'Allemagne a la note maximale sur 8 des 15 mesures « plus c'est mieux » (chômage des jeunes, heures, vol, décalage, sécurité, santé, Français inscrits, villes moyennes) ; la Colombie et le Chili ont les mêmes points forts que le Mexique et le Brésil (prix, nature, langue proche) avec de moins bonnes notes ailleurs : même avec les réponses les plus favorables, leur meilleur rang est 8 et 7. Pistes, sans pondération arbitraire : (1) « Réseau français » compte des inscrits en valeur absolue, ce qui avantage les grands pays : passer à une part de la population ou à la ville d'arrivée (prompt 3c) ; (2) 8 dilemmes actifs sur 16 ont une option « ne change rien » : leur donner un effet contraire quand une donnée existe (par exemple « Aucun contact français » = position « peu de Français ») ; (3) remplir « décision » et « vie pro et vie perso » (D7, D8), où l'Allemagne n'est pas forcément favorisée.
- Prompt 3c : données vérifiées en fichiers. Visas de travail (conditions détaillées), liens manquants (UFE, ADFE, consulat en Argentine, Alliance française), culture du travail pour les mesures « decision » et « pro-perso » (dilemmes D7 et D8, inactifs tant qu'elles sont notées pour moins de 60 % des pays).
- Prompt 4 « Ta vie là-bas » : salaire net après impôts (OCDE), loyer, coût de la vie comparés à la France ; puis un profil enregistré dans le navigateur, sans compte (ville, métier, salaire) ; plus tard, entreprises à viser.
- Accompagner les dilemmes entre pays : quand le choix oppose un meilleur cadre de vie à une culture de travail plus adaptée, l'expliquer.
- Écran Valeurs (stabilité, libertés, air) en fin de parcours : à repenser (il arrive tard et change le top 3 après le portrait).
- Direction artistique et mascotte.
- Prompt 5 : refonte visuelle et animations (vitesse et ambiance du top 3 animé à revoir).
- Budget sur 3 mois.
- Checklist Jour J (J-90 à J+30).
- Comparateur de pays.
- Fiches ★ complètes à construire (banque, SIM, santé, logement, CV, codes culturels) : la promesse affichée est « fiche détaillée à venir en priorité ».
- Congés payés légaux : à remettre dans le calcul quand ils seront vérifiés pays par pays dans les textes de loi.
- Égalité femmes-hommes dans la loi : `scripts/collecte.mjs` sait déjà la télécharger (Banque mondiale, indicateur GD_WBL_OVL_LAW, source 14) ; l'API était trop lente depuis la session du prompt 3.

## Journal

### 14 novembre 2026 : quiz adaptatif et résultat (prompt n°2)
**Ce qui est fait**
- Données dans `/content` : `criteres.json` (16 critères + taille de ville), `scores.json` (notes des 30 pays, chacune avec source, lien et date), `quiz.json` (profil, 8 priorités, 22 phrases avec leurs règles d'affichage), `portes.json` (UE, PVT, VIE, visa de travail), `double-nationalite.json` (Irlande, Canada, États-Unis), `sources.json`, `saisie/avis.json` (« Notre avis » rédigé et justifié pays par pays), `dossiers/<pays>.json`.
- `scripts/collecte.mjs` télécharge les données ouvertes (Banque mondiale, OIT, data.gouv.fr, Open-Meteo) et recalcule `scores.json`. `scripts/dossiers.mjs` ouvre chaque lien des dossiers un par un : 159 liens vérifiés, 22 « à compléter ».
- Quiz `/quiz` : profil en boutons, « Tes 3 priorités », sujets en option, phrases choisies une par une (celle qui départage le plus les 5 premiers pays), résultat proposé quand le top 3 ne bouge plus pendant 3 réponses (au moins 6 phrases), retour, Passer, glissement du doigt, « ? » sous chaque question. Réponses gardées dans le navigateur (sessionStorage), rien n'est envoyé.
- Résultat `/resultat` : cartes pays (drapeau, %, verdict, jauges par famille), badge de faisabilité, interrupteur « portes ouvertes », pourquoi / ce qui peut coincer / porte d'entrée, preuves en un tap avec « Signaler un problème », pays surprise, curseurs « Et si… ? » (familles et budget), profil de travail, double nationalité, « Moins adaptés pour toi » avec bouton pour remonter, secteur facultatif, PDF généré dans le navigateur (jsPDF), Recommencer.
- Pages `/methode` et `/pays/[id]` (30 pages).
- Règle ajoutée pendant les tests : un pays noté sur moins de 60 % des critères de la personne ne peut pas entrer dans le top 3 (il restait premier avec trop peu de données).
- Tests : build sans erreur, 3 profils testés de bout en bout sur un écran de téléphone (aventure 22 ans ; 32 ans hors Europe avec nationalité canadienne ; VIE 27 ans, français seulement, Europe).

**Ce qui reste à faire**
- Remplir les notes « à vérifier » ci-dessous.
- Vérifier sur les sites officiels les visas de travail du Japon, de la Corée du Sud, de Taïwan, de Hong Kong, de l'Australie, de la Nouvelle-Zélande, de l'Argentine, du Chili, de la Colombie, du Mexique, du Brésil, de la Chine et du Maroc, ainsi que les quotas et le tirage au sort des visas américains.
- Vérifier la présence de missions VIE par pays (Business France).
- Compléter les liens « à compléter » : sites de l'UFE et de Français du monde-ADFE (inaccessibles depuis la session), contacts consulaires de l'Argentine et de Hong Kong.
- Fiches complètes des 10 pays ★ et checklist Jour J.
- Le registre des Français date de fin 2020 (dernière version publiée sur data.gouv.fr).

**Notes « à vérifier » (hors calcul)**
- Congés payés légaux : les 30 pays (texte de loi de chaque pays à lire).
- Égalité femmes-hommes dans la loi : les 30 pays (indice de la Banque mondiale non téléchargeable).
- Heures travaillées : Australie, Japon, Nouvelle-Zélande, Taïwan, Hong Kong, Singapour, Chine, Maroc.
- Salaire moyen : Taïwan, Hong Kong, Émirats arabes unis, Maroc (absent, ou donnée de plus de six ans).
- Qualité de l'air : Taïwan, Hong Kong.
- Français inscrits au consulat : Hong Kong.
- Chômage des jeunes, niveau des prix, homicides, stabilité politique, libertés : Taïwan (absent des bases de la Banque mondiale).

### 14 et 15 novembre 2026 : corrections après la passe QA (prompt 3)
**Ce qui est fait** (deux pull requests : lots 1 à 3, puis lots 4 à 6)
- Lot 1, robustesse : garde anti double clic (400 ms) dans le quiz ; session validée avec un numéro de version (`src/lib/memoire.ts`) ; fenêtre de preuve en portail (plus d'erreur React 418) ; page 404 en français et 404 pour tout pays inconnu (`src/proxy.ts`) ; capture du pointeur pour le glissement ; erreur PDF visible ; message sans JavaScript ; en-têtes de sécurité dans `next.config.ts`.
- Lot 2, honnêteté : « ★ = fiche détaillée à venir en priorité » ; plus aucun « Bientôt » ni « À compléter » visible ; « Notre avis » réécrit sans doublon (`content/saisie/avis.json`, nouvelle forme : `villes` regroupe les trois mesures de taille de ville, phrases de style rattachées à un seul axe) ; page `/mentions-legales` ; une description par page ; jargon expliqué ; « importance » au lieu de « poids » ; congés payés retirés du calcul.
- Lot 3, moteur : donnée manquante sur une priorité comptée à 50 % ; couverture en nombre de mesures ; importance maximale (pas la somme) ; mesure « Climat doux » ; égalités au premier du groupe ; « Fermé à ton âge » hors du top 3 ; badge « Porte ouverte grâce à ta nationalité » (cas de `double-nationalite.json`, champ `acces`) ; « Passer » ne compte plus ; `npm run test:moteur` (`scripts/test-moteur.ts`, chargeur `scripts/chargeur.mjs`, aucune dépendance en plus).
- Lot 4, données : visas de travail de 10 pays d'après France Diplomatie « Entrée et séjour » (vérifiés le 14 novembre 2026, conditions détaillées encore « à vérifier », champ `detailsAVerifier`) ; lien consulaire de Hong Kong ; pages de présentation lisibles des sources (champ `page` de `sources.json`) ; Norvège et Suède recalculées (17,74 °C réels).
- Lot 5, accessibilité : focus sur le titre à chaque écran, phrase en h1, aria-pressed et coche, annonces polies, curseurs nommés, contrastes, mode contraste forcé, « Reprendre mon quiz ».
- Lot 6, responsive : détails repliés sous chaque carte, « Et si… ? » sous le top 3, barre d'action collée en bas du quiz, zones tactiles de 44 px, typographie (insécables, apostrophes) avec `scripts/typo.py`.
- `node scripts/collecte.mjs --textes` réécrit les phrases de `scores.json` sans rien télécharger (valeurs et dates inchangées).

**Ce qui reste à faire**
- Visas de travail : conditions détaillées des 10 pays ci-dessus sur les sites officiels des pays (inaccessibles depuis la session) ; Brésil, Maroc et Hong Kong (aucune information travail sur France Diplomatie, page Hong Kong absente) ; quotas et tirage au sort américains.
- Canada : statut 2026 des invitations EIC (canada.ca inaccessible depuis la session).
- Présence de missions VIE par pays (Business France) : toujours « à vérifier ».
- UFE et Français du monde-ADFE : sites inaccessibles, liens masqués. Consulat en Argentine : page France Diplomatie refusée (403), lien masqué.
- Alliance française : retrouver la page de chaque pays (l'ancien lien était le même pour tous).
- Page de présentation lisible pour les indicateurs de la Banque mondiale (donnees.banquemondiale.org inaccessible depuis la session).
- Zoom 200 % à 160 px : 2 px de défilement horizontal restant sur /resultat, sans élément visible en cause.

**Notes « à vérifier » (hors calcul)**
- Égalité femmes-hommes dans la loi : 30 pays (sujet masqué).
- Heures travaillées : Australie, Japon, Nouvelle-Zélande, Taïwan, Hong Kong, Singapour, Chine, Maroc (aucune donnée OIT, même avec d'autres indicateurs).
- Salaire moyen : Taïwan, Hong Kong (2016, écarté), Émirats arabes unis (2009, écarté), Maroc.
- Qualité de l'air : Taïwan, Hong Kong. Français inscrits : Hong Kong.
- Taïwan : chômage des jeunes, prix, homicides, stabilité, libertés (absent des bases de la Banque mondiale).
- Français inscrits : la donnée la plus récente sur data.gouv.fr date de fin 2020 (vérifié le 14 novembre 2026), elle est affichée comme ancienne.

### 15 novembre 2026 : le moteur te comprend (prompt 3b)
**Ce qui est fait** (une pull request, un commit par lot)
- Lot 1 : les 22 phrases sont remplacées par 18 dilemmes (`content/quiz.json`, clé `dilemmes` : thème, titre, scène, options avec ligne grise, effets, phrase de portrait, préférence). Effets mesure par mesure : poids 1 ou 0,5 pour les mesures « haut », position préférée pour les mesures « position » (accord = 1 − écart / 4). Poids d'une mesure = maximum, jamais la somme. Un dilemme dont une mesure est notée pour moins de 60 % des pays n'est jamais posé. Nouvelles mesures `decision` et `pro-perso` (critère style de travail), « à vérifier » pour les 30 pays : D7 et D8 inactifs. Le choix du dilemme ignore une option qui ne ferait que redonner une importance déjà acquise. Écran Valeurs déplacé en fin de parcours.
- Lot 2 : `objectifs` dans `quiz.json` : poids de départ 0,5 par projet, retirés quand une réponse de dilemme va dans un autre sens.
- Lot 3 : écran « Ton portrait » (4 à 6 phrases, « Ce n'est pas moi » rouvre le dilemme, les priorités ou le projet), repris en haut de /resultat et dans le PDF.
- Lot 4 : « Pour toi » et « À savoir » sous chaque pays (modèles `fait` dans `criteres.json`), jamais la même phrase sous deux pays ; « Moins adaptés pour toi » regroupé par raison.
- Lot 5 : départage quand le n°1 et le n°2 sont à 5 points ou moins (3 dilemmes au plus, ou comparaison côte à côte).
- Lot 6 : top 3 animé (FLIP, `src/lib/animation.ts`), révélation du n°1, rien avec prefers-reduced-motion.
- Lot 7 : été frais (sous 18 °C) noté 4 dans « climat doux » (Bogotá 5 → 4) ; 14 textes « Notre avis » qui n'ajoutaient que des noms de villes vidés ; nationalité non couverte dite clairement ; profil de travail sans phrase répétée.
- Lot 8 : nouveaux invariants dans `npm run test:moteur` ; `npm run simulation` (5 000 profils).
- Simulation avant / après : Allemagne n°1 31,4 % → 30,1 % ; top 3 différent selon l'objectif 0 % → 50,6 % des profils ; Colombie et Chili dans le top 3 : 0,4 % et 0,1 % → 0,1 % et 0,1 %.

**Ce qui reste à faire**
- Données de D7 et D8 (prompt 3c), puis vérifier qu'ils sont bien posés.
- Décisions en attente de Nolhan : voir le rapport du prompt 3b (positions des dilemmes de culture, « été chaud » = niveau 4, option « Je garde ces soirées » qui fait aussi descendre les pays à autre écriture).

