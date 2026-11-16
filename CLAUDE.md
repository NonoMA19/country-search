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
Données de l'OMS (obésité des adultes, mesure « Manger sainement ») : CC BY-NC-SA 3.0 IGO, usage non commercial seulement (à revoir si le site devient payant).

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
- Biais de classement (remesuré au prompt 3e, `npm run simulation`, 5 000 profils) : Pays-Bas n°1 dans 18,9 % des profils, Belgique 10,1 %, Suisse 9,6 %, Allemagne 8,6 % (l'Allemagne a perdu son salaire, passé « à vérifier »). La Colombie et le Chili restent presque absents du top 3 (0,0 % et 0,2 %).
- Restes du prompt 3c : visas de travail « à vérifier » (Corée du Sud, Colombie, Brésil, Chine, Maroc), lien avec l'employeur inconnu (Mexique, Corée du Sud, Colombie, Brésil, Maroc) ; culture au travail « à vérifier » : décision (Hong Kong, Brésil), vie pro et vie perso (Argentine, Colombie, Émirats arabes unis, Maroc) ; Alliance française par pays ; population de Taïwan (absente de la Banque mondiale) pour le réseau français.
- Question facultative sur l'expérience pro (aucune, moins de 2 ans, 2 ans ou plus) et le diplôme. Depuis le prompt 3d, la fiche de faisabilité affiche « Ton expérience pro n'est pas connue du site » : elle permettrait de changer le badge des visas qui exigent de l'expérience (Australie : 1 an ; Nouvelle-Zélande : 2 ans ou une licence ; Taïwan : master, ou licence et 2 ans ; Japon : diplôme universitaire). Pour l'instant, la condition est seulement affichée dans la carte du visa.
- Témoignages de confiance « moyenne » : ils comptent comme les autres. Piste proposée, non appliquée : les compter à 75 % de leur importance.
- Salaire net et simulateur « Ta vie là-bas » (prompt 4) : salaire net après impôts (OCDE), loyer, coût de la vie comparés à la France ; puis un profil enregistré dans le navigateur, sans compte (ville, métier, salaire) ; plus tard, entreprises à viser.
- Accompagner les dilemmes entre pays : quand le choix oppose un meilleur cadre de vie à une culture de travail plus adaptée, l'expliquer.
- Décisions en attente (prompts 3d et 3e) : (1) badge de fiabilité : « Notre avis » n'y compte pas, mais la règle des 60 % du calcul le compte encore : choisir une seule règle ; (2) pays surprise : 38,9 % des profils au prompt 3e (51 % avant), presque toujours un pays écarté par la zone choisie : le réserver aux pénalités, ou au n° 1 seulement ? (3) « Montrer seulement les portes ouvertes » est resté au-dessus du top 3.
- Regarder comment les concurrents présentent leurs résultats (classement, comparaison, fiches) avant la refonte du prompt 5.
- Secteurs et stages : croiser le top 3 avec les secteurs qui recrutent et les offres de stage (sources ouvertes à trouver).
- Couleurs par pays : à décider avec la direction artistique (prompt 5), pas avant.
- Écran Valeurs (stabilité, libertés, air) en fin de parcours : à repenser (il arrive tard et change le top 3 après le portrait).
- Direction artistique, mascotte et illustrations : au prompt 5, une fois la DA choisie (pas avant).
- Prompt 5 : refonte visuelle et animations (vitesse et ambiance du top 3 animé à revoir), mise en page du PDF (il reprend les points par catégorie sous forme de liste simple depuis le prompt 3d), couleurs par pays.
- Budget sur 3 mois.
- Checklist Jour J (J-90 à J+30).
- Comparateur de pays : réutiliser la comparaison côte à côte du départage (`comparer` dans `src/lib/moteur.ts`) pour 2 pays au choix.
- Fiches ★ complètes à construire (banque, SIM, santé, logement, CV, codes culturels) : la promesse affichée est « fiche détaillée à venir en priorité ».
- Congés payés légaux : à remettre dans le calcul quand ils seront vérifiés pays par pays dans les textes de loi.
- Égalité femmes-hommes dans la loi : `scripts/collecte.mjs` sait déjà la télécharger (Banque mondiale, indicateur GD_WBL_OVL_LAW, source 14) ; l'API était trop lente depuis la session du prompt 3.
- Salaire de l'OCDE (prompt 3e, en attente) : l'API sdmx.oecd.org était inaccessible depuis la session. Nolhan fournira le salaire annuel moyen de l'OCDE (dollars PPA, prix constants, même année pour tous) : remplacer la source `oit-ilostat` de la mesure `salaire` dans `scripts/collecte.mjs` (notes « annuel ÷ 12 » ou nouvelles bornes à décider), puis `node scripts/collecte.mjs --textes`. En attendant, l'OIT reste incohérente : Belgique 8 077 $, Luxembourg 9 275 $, France 3 084 $ par mois (même source, même année 2025).
- Années trop éloignées entre pays (prompt 3e) : niveau des prix (Argentine 2021, les autres 2025) et homicides (de 2020 pour la Chine à 2023). L'année est dite dans chaque preuve. Choisir : passer en « à vérifier » ou garder.
- Données par ville (plus tard) : climat, loyer, qualité de l'air et culture n'ont pas la même valeur partout dans un pays (exemple : Lisbonne et Porto, Barcelone et Madrid, Sydney et Melbourne). Thèmes à étudier par ville : culture sportive, alimentation.
- Vie active et sportive : la part d'adultes à l'activité physique insuffisante (OMS) n'était téléchargeable ni sur le site de l'OMS (bloqué depuis la session) ni sur la Banque mondiale. Mesure et dilemme « Ton dimanche » à faire quand la donnée sera trouvée.
- Licence non commerciale : les données de l'OMS (mesure « Manger sainement », obésité des adultes) sont sous CC BY-NC-SA 3.0 IGO. Si le site devient payant ou commercial, retirer la mesure ou trouver une autre source.
- Relire les 66 scènes avec des testeurs (équilibre des options) ; ajouter des scènes si deux personnes se plaignent encore de questions répétées.

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

### 15 novembre 2026 : données vérifiées hors session (prompt 3c)
**Ce qui est fait** (une pull request, un commit par partie)
- Partie 1, culture au travail : notes « décision » et « vie pro et vie perso » des 30 pays dans `content/saisie/culture.json` (résumés reformulés, sources, confiance), lues par `scripts/collecte.mjs`. Nouveau niveau de preuve « Témoignages » (au moins deux sources concordantes), pastille à part, « confiance moyenne » écrite sur la pastille, fenêtre avec sources cliquables et mise en garde ; méthode et limites sur /methode#temoignages. D7 (« Ton idée en réunion », nouvel identifiant `idee-reunion`) et D8 actifs : 28 et 26 pays notés sur 30.
- Partie 2, visas de travail de 13 pays dans `content/portes.json` (champ `detail` : nom, employeur requis, lien avec l'employeur, conditions, page officielle), vérifiés le 15 novembre 2026. Officiel : Australie, Argentine, Japon, Nouvelle-Zélande, Taïwan, Hong Kong, Chili, Mexique. À vérifier : Corée du Sud, Colombie, Brésil, Chine, Maroc. Carte du visa (`src/components/CarteVisa.tsx`) dans la fiche pays, le résultat et le PDF ; diplôme ou expérience exigés mis en avant ; Taïwan sans montant de salaire. D18 : un visa non lié (Chili) ou en partie lié (Japon, Argentine) à l'employeur n'écarte plus le pays.
- Partie 3 : saison 2026 du PVT Canada fermée (mention, badge et score inchangés) ; UFE Berlin et UFE Japon ; un seul lien « Trouver une section Français du monde » ; consulat à Buenos Aires ; date de vérification par lien.
- Partie 4 : D10 B devient une pénalité (mesure interne « Langue à apprendre ») ; mention « carrière longue » retirée ; portrait sans phrase qui répète une priorité ; « À égalité avec … » ; réseau français pour 100 000 habitants (`node scripts/collecte.mjs --population`) ; textes épicènes ; `scripts/typo.py` traite aussi les mesures ; 6 personas dans `npm run simulation`.
- Simulation avant / après : Allemagne n°1 30,1 % → 13,6 % (top 3 : 50,7 % → 33,1 %) ; Pays-Bas n°1 13,6 % → 16,9 % ; Belgique 8,3 % → 9,8 % ; Suisse 4,3 % → 9,3 % ; Portugal 2,8 % → 5,4 % ; Irlande 0,2 % → 2,9 % ; top 3 différent selon l'objectif 50,6 % → 55,8 %.

**Ce qui reste à faire**
- Voir « Restes du prompt 3c » dans les idées ci-dessus.
- Personas : le profil « parle espagnol, chaleur, vie moins chère » a la Chine dans son top 5, car parler espagnol ne compte que si un dilemme fait entrer la langue du quotidien dans le calcul.
- Décisions en attente de Nolhan : D18 filtre ou pénalité ; pondération des témoignages de confiance moyenne ; question facultative sur l'expérience.

### 15 novembre 2026 : un résultat plus clair et plus honnête (prompt 3d)
**Ce qui est fait** (deux pull requests : lots 1 et 5, puis lots 2, 3, 4 et 6 ; un commit par lot)
- Lot 1 : « Pourquoi on te demande ça » en panneau déplié (`src/components/Pourquoi.tsx`) : enjeu en gras, une mini-carte par option. Champ `aide` dans `content/quiz.json` (questions, dilemmes, `aides.priorites`, `aides.sujets`), 60 mots au plus. Textes de D1, D9, D11, D12, D13, D16, D17, D18 corrigés pour coller au calcul.
- Lot 5 : `content/glossaire.json` et `src/components/Definition.tsx` (définition au toucher, `AvecDefinitions` sur PVT, VIE, PPA, PM2,5, Banque mondiale) ; `src/components/LienOfficiel.tsx` (carte « Site officiel ») ; `_europe` dans `content/portes.json` (Union, Norvège, Suisse ; inscription sur place, source `europa-sejour` ; permis de séjour suisse, France Diplomatie).
- Lot 2 : page résultat réordonnée (portrait, top 3, « Et si… ? », pays surprise, VIE, tous les pays). Cartes : verdict en gros, points par catégorie (Travailler, Vivre, Culture au travail ; 2 forts et 1 faible au plus). Égalités nommées avec rang hors vue. 4 curseurs concrets (`GROUPES`, `effetsAjustes`, session v5). Pays surprise (`paysSurprise`, seuil n° 3 ou 75 %). Comparaison côte à côte (`comparer`). Vraies valeurs et mots (`valeurLisible`, champs `court`, `affichage`, `etiquettes`, `theme` dans `criteres.json`). « Ton profil de travail » supprimé (phrase dans le portrait).
- Lot 3 : `faisabilite`, `visaSimple`, `fiabiliteDe` ; `src/components/resultat/Faisabilite.tsx` (aussi sur la fiche pays, si le quiz est fait).
- Lot 4 : `src/components/resultat/BlocVie.tsx`, offres de VIE Business France (source `businessfrance-vie`).
- Lot 6 : test du moteur (aides, curseurs, pays surprise, égalités, valeurs, fiabilité, faisabilité, VIE) ; simulation avec pays surprise et fiabilité.
- Simulation (5 000 profils) : classement identique au prompt 3c (aucune règle de score changée). Pays surprise : 51,1 % des profils. Fiabilité du top 3 : complètes 1,1 %, partielles 82,1 %, peu de données 16,7 %.

**Ce qui reste à faire**
- Décisions listées dans les idées (« Prompt 3d, décisions en attente »).
- Condition de nationalité du VIE : non sourcée dans `/content`, donc pas affichée.
- « Espace économique européen » et « accord sur la libre circulation » : pas trouvés sur une page officielle lisible depuis la session ; l'explication reste sans détail juridique.


### 16 novembre 2026 : fiabilité et questions (prompt 3e)
**Ce qui est fait** (une pull request, un commit par lot)
- Lot 1, données : l'API de l'OCDE est inaccessible depuis la session, le salaire reste celui de l'OIT ; un pays dont l'année s'écarte de plus d'un an de l'année médiane (2025) passe « à vérifier » (Allemagne, Australie, Japon, Nouvelle-Zélande, Corée du Sud, Singapour, Chine), la valeur écartée reste dans `ancien`. Libellé « Salaire brut moyen, avant impôts, en pouvoir d'achat » et avertissement dans la preuve (champ `avertissement` des mesures). Année de la donnée dans chaque preuve, années par mesure sur /methode#annees. La France, pays repère non classé (`reference.france` dans `scores.json`, `node scripts/collecte.mjs --france`), affichée « Pour comparer, France : … ».
- Lot 2, options équilibrées : ligne « + » et ligne « − » sur chaque option ; 8 dilemmes en échelle (Plutôt A, Un peu A, Un peu B, Plutôt B ; « Un peu » = importance 0,5 ou position à mi-chemin de 3) ; nouvelle forme des dilemmes (`options` = effets, `scenes` = textes) ; 18 dilemmes réécrits sans « bonne réponse » ; « Janvier » A favorise désormais les hivers froids (position 2).
- Lot 3, 22 dilemmes et 66 scènes (3 par dilemme). Nouveaux : travailler en anglais, climat doux, qualité de l'air, « Manger sainement » (obésité des adultes, OMS via la Banque mondiale, `node scripts/collecte.mjs --oms`). Graine par parcours (`graine`, `dejaVues` dans l'état, session v7) : scène tirée au hasard, jamais une scène vue dans un parcours précédent ; 4 premiers dilemmes tirés parmi ceux à 60 % ou plus de la meilleure utilité. Mesure de diversité dans `npm run simulation` (`scripts/diversite.ts`).
- Lot 4, départage : seulement des dilemmes dont une mesure sépare les deux pays de 2 niveaux ou plus (données vérifiées des deux côtés), phrase « On te pose cette question parce que… » (champ `sujet` des mesures), 5 questions au plus tant que l'écart reste de 5 points ou moins, bilan cohérent, « Non comparable » dans la comparaison.
- Lot 5 : accueil en trois lignes, bouton « Trouver mon pays », PVT défini dès l'accueil ; bouton « Pourquoi on te demande ça ? » visible, sous la question ; budget en tranches (« au moins », « pourrait te manquer jusqu'à ») ; thème en pastille.
- Lot 6 : garde anti double clic partagée (`src/lib/clic.ts`) ; accords au pluriel (`pluriel` dans `pays.json`) ; égalités en chaîne de voisins ; retour du navigateur dans le quiz ; focus sur le titre de /resultat ; Échap du glossaire ; nom accessible des cartes « Site officiel » ; `--gris` #5e6e84 (4,75:1 sur `--creux`) ; zones tactiles de 44 px ; pays surprise seulement s'il serait n° 1 ou n° 2 ; D18 devient une pénalité (mesure interne `employeur-libre`), plus aucun dilemme n'écarte de pays.
- Simulation avant / après (5 000 profils, et 1 000 parcours pour la diversité) : questions identiques entre deux parcours (Jaccard) 51,4 % → 11,6 % ; profils types qui commencent par les 3 mêmes questions 34 à 75 % → 0,5 à 1,5 % ; même n° 1 qu'avec tous les dilemmes 92,0 % → 82,7 %, perte moyenne sur le n° 1 0,17 → 0,42 point ; pays surprise 51,1 % → 38,9 % ; Allemagne n° 1 13,6 % → 8,6 %, Pays-Bas 16,9 % → 18,9 %.

**Ce qui reste à faire**
- Chiffres de l'OCDE pour le salaire (Nolhan) ; Belgique et Luxembourg restent anormalement hauts avec l'OIT.
- Voir les idées : années des prix et des homicides, vie active et sportive, pays surprise par la zone, données par ville.
