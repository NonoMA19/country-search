# Orizo

## Mission
Aider les étudiants et jeunes diplômés francophones à choisir le pays où partir travailler, puis à arriver prêts le jour J : visa, banque, carte SIM, santé, logement, CV local, codes culturels.

## Cible et périmètre
- Étudiants et jeunes diplômés francophones. Site en français uniquement.
- Passeport français uniquement, avec une question « As-tu une autre nationalité ? » qui affiche avantages et pièges.
- Gratuit et open source. Aucune publicité, aucune affiliation (hébergement Vercel gratuit, usage non commercial).

## Version 1 (ce qu'on construit maintenant)
- Quiz en 5 chapitres (banque v2 du prompt 6 : 120 éléments sur 53 écrans possibles, 30 à 40 écrans par parcours, environ 9 minutes) : point de départ, critères, travail, vie, limites et valeurs ; 14 formats (cartes, carte du monde, frise, enveloppe, thermomètre, dilemme, ambiances, phrases à glisser, test à l'aveugle, tri des limites, seuil, tri en zones…) ; chaque option garde son avantage et son prix ; sans compte. Deux mesures par pays : « Il te ressemble » et « Il t'est accessible ».
- Trois modes d'affichage, détectés par CSS seulement : téléphone (moins de 768 px), tablette, ordinateur (1024 px et plus, variante `lg:`). `pointeur-fin:` = souris ou pavé tactile (`src/app/globals.css`).
- Classement des 38 pays par un calcul transparent (pas d'IA), avec le « pourquoi » de chaque score et une méthode publiée.
- Top 3 pays, fiches pays, checklist Jour J de J-90 à J+30.
- 10 fiches complètes, 28 fiches courtes.
- Pas de compte, pas d'IA en direct, pas de témoignages (prévus en version 2).

## Les 38 pays (★ = fiche complète)
Europe sans visa : Belgique★, Suisse★, Allemagne★, Irlande★, Luxembourg, Espagne, Italie, Pays-Bas, Portugal, Norvège, Suède, Danemark, Autriche.
PVT : Canada★, Australie★, Japon★, Nouvelle-Zélande, Corée du Sud, Taïwan, Hong Kong, Argentine, Chili, Colombie, Mexique, Brésil, Pérou, Uruguay.
Visa de travail : Royaume-Uni★, États-Unis★, Singapour★, Émirats arabes unis, Chine, Maroc, Thaïlande, Vietnam, Inde, Côte d'Ivoire, Sénégal.

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
- Biais de classement (remesuré au prompt 3h, 5 000 parcours, 38 pays) : n° 1 européen 84,8 % → 86,8 % (le correctif de la pénalité « hors d'Europe » la fait monter, la carte et les langues la font peu baisser) ; Suisse 25,2 % et Allemagne 22,2 % au-dessus de 20 % (meilleures notes moyennes sur les mesures les plus demandées) ; Chili, Colombie, États-Unis, Chine, Brésil, Inde et Thaïlande jamais n° 1 (notes basses sur salaire, sécurité, santé et distance, PVT fermés après 30 ans ; pas un manque de données). Le salaire OCDE des États-Unis (70 627 $) passe sous l'Allemagne (88 144 $) : à revérifier dans le tableau saisi.
- Restes du prompt 3c : visas de travail « à vérifier » (Corée du Sud, Colombie, Brésil, Chine, Maroc), lien avec l'employeur inconnu (Mexique, Corée du Sud, Colombie, Brésil, Maroc) ; culture au travail « à vérifier » : décision (Hong Kong, Brésil), vie pro et vie perso (Argentine, Colombie, Émirats arabes unis, Maroc) ; Alliance française par pays ; population de Taïwan (absente de la Banque mondiale) pour le réseau français.
- Question facultative sur l'expérience pro (aucune, moins de 2 ans, 2 ans ou plus) et le diplôme. Depuis le prompt 3d, la fiche de faisabilité affiche « Ton expérience pro n'est pas connue du site » : elle permettrait de changer le badge des visas qui exigent de l'expérience (Australie : 1 an ; Nouvelle-Zélande : 2 ans ou une licence ; Taïwan : master, ou licence et 2 ans ; Japon : diplôme universitaire). Pour l'instant, la condition est seulement affichée dans la carte du visa.
- Témoignages de confiance « moyenne » : ils comptent comme les autres. Piste proposée, non appliquée : les compter à 75 % de leur importance.
- Simulateur « Ta vie là-bas » (prompt 6) : salaire net (la part après impôts de l'OCDE est déjà affichée), loyer, coût de la vie comparés à la France ; puis un profil enregistré dans le navigateur, sans compte (ville, métier, salaire) ; plus tard, entreprises à viser.
- Accompagner les dilemmes entre pays : quand le choix oppose un meilleur cadre de vie à une culture de travail plus adaptée, l'expliquer.
- Décisions en attente (prompt 3k) : (1) langue parlée dans « travail facile » : simulée seulement (seul le profil espagnol change : Argentine n° 2, Pérou dans le top 5) ; (2) échelle du coût de la vie centrée sur la France (3 = ±15 %, 4 = de 15 à 40 % moins cher) : répartition équilibrée sur les 38 pays, mais le Japon à 83 % frôle le seuil de 85 % ; (3) part européenne en n° 1 : 90,1 % depuis la nouvelle série de salaire (Pays-Bas 30,5 %) ; (4) chômage des jeunes gardé, mention « Économie informelle » sur 12 pays (part des jeunes ni en emploi ni en formation absente pour Corée du Sud, Taïwan, Chine, Maroc).
- Décisions validées au prompt 3h : carte = bonus de rang 5 (1,1), sans malus ; langue parlée = bonus modéré (1), sans malus ; une seule règle « données disponibles » (Notre avis compte, « à vérifier » jamais) ; ambiances et phrases obligatoires ; « Montrer seulement les portes ouvertes » sous le top 3.
- Décisions validées au prompt 3g : « Je préfère éviter » = importance 1 ; Rédhibitoire aux seuils de 10 homicides pour 100 000, −5 °C en janvier, santé notée 1 ou 2 ; « Pas vraiment » = position modérée ; 2,5 = moyen ; deux thèmes au plus dans le chapitre 4 ; données de secteur de 2019 ou après.
- Regarder comment les concurrents présentent leurs résultats (classement, comparaison, fiches) avant la refonte du prompt 5.
- Secteurs et stages : le poids du secteur dans l'emploi est fait (prompt 3f, ILOSTAT) ; reste à croiser avec les offres ouvertes et les stages (sources ouvertes à trouver), et les salaires par secteur.
- Couleurs par pays : à décider avec la direction artistique (prompt 5), pas avant.
- Écran Valeurs : revenu au prompt 3g, facultatif, en fin de chapitre 5 (libertés, stabilité). L'égalité femmes-hommes dans la loi reste masquée (donnée non téléchargée).
- Nom Orizo (texte en place depuis le prompt 3h), mascotte caméléon, direction artistique « Atlas pop », logo, couleurs, illustrations finales des cartes (aujourd'hui des icônes Lucide sur fond uni, avec texte alternatif) : au prompt 5, pas avant.
- Prompt 5 : refonte visuelle et animations (vitesse et ambiance du top 3 animé à revoir), mise en page pour ordinateur (le site reste pensé d'abord pour le téléphone), mise en page du PDF, couleurs par pays, carte du monde dessinée.
- Budget sur 3 mois.
- Checklist Jour J (J-90 à J+30).
- Comparateur de pays : réutiliser la comparaison côte à côte du départage (`comparer` dans `src/lib/moteur.ts`) pour 2 pays au choix.
- Fiches ★ complètes à construire (banque, SIM, santé, logement, CV, codes culturels) : la promesse affichée est « fiche détaillée à venir en priorité ».
- Congés payés légaux : à remettre dans le calcul quand ils seront vérifiés pays par pays dans les textes de loi.
- Égalité femmes-hommes dans la loi : `scripts/collecte.mjs` sait déjà la télécharger (Banque mondiale, indicateur GD_WBL_OVL_LAW, source 14) ; l'API était trop lente depuis la session du prompt 3.
- Salaires des 5 pays sans chiffre comparable de l'OCDE (Taïwan, Hong Kong, Singapour, Émirats arabes unis, Maroc) et part après impôts de 8 pays (dont Argentine, Brésil, Chine) : à trouver. Barème VIE : le relire sur mon-vie-via.businessfrance.fr (illisible depuis la session) et le mettre à jour chaque trimestre.
- Années trop éloignées entre pays (prompt 3e) : niveau des prix (Argentine 2021, les autres 2025) et homicides (de 2020 pour la Chine à 2023). L'année est dite dans chaque preuve. Choisir : passer en « à vérifier » ou garder.
- Données par ville (plus tard) : climat, loyer, qualité de l'air et culture n'ont pas la même valeur partout dans un pays (exemple : Lisbonne et Porto, Barcelone et Madrid, Sydney et Melbourne). Thèmes à étudier par ville : culture sportive, alimentation.
- Vie active et sportive : la part d'adultes à l'activité physique insuffisante (OMS) n'était téléchargeable ni sur le site de l'OMS (bloqué depuis la session) ni sur la Banque mondiale. Mesure et dilemme « Ton dimanche » à faire quand la donnée sera trouvée.
- Licence non commerciale : les données de l'OMS (mesure « Manger sainement », obésité des adultes) sont sous CC BY-NC-SA 3.0 IGO. Si le site devient payant ou commercial, retirer la mesure ou trouver une autre source.
- Décisions en attente (prompt 6) : (1) poids de « Il t'est accessible » dans le classement (0,3) : c'est lui qui porte l'essentiel de la part européenne en n° 1 (84,1 % ; 73,7 % avec 0,15 ; 58,3 % sans) ; (2) montants des obstacles (visa de travail −20, limite rédhibitoire −35…, `OBSTACLES` dans `src/config.ts`) ; (3) règle des 30 pays : le salaire moyen (23 pays OCDE) ne bouge plus le classement hors VIE ; (4) diversité des chapitres 3 et 4 : contenu lu identique 41 % (20,6 % avant, objectif 30 %), la banque limitée à 120 éléments laisse moins de choix (5 activités vues par tous) ; (5) couple ou famille : −10 d'accès hors libre circulation, sans source sur les droits des familles visa par visa (dit « à vérifier ») ; (6) relire la banque avec docs/quiz-v2-notes.md et le point d'étape, absents de la session.
- Relire les 66 scènes avec des testeurs (équilibre des options) ; ajouter des scènes si deux personnes se plaignent encore de questions répétées.

- Données par ville : climat, loyer, qualité de l'air, indemnité VIE par ville (déjà dans le détail) ; choisir sa ville dans le pays.
- Portrait rédigé par une IA (plus tard, version 2) : aujourd'hui le portrait est calculé, sans IA.
- Carte « Où te vois-tu vivre ? » (prompt 4) : petite au téléphone (335 px de large) ; un zoom ou une carte plus haute à étudier au prompt 5. La simulation et le test du moteur tirent encore les anciennes régions (`scripts/hasard.ts`, gardé pour comparer avant / après) : mesurer l'effet des cercles dans `npm run simulation` plus tard.
- Indicateurs collectés au prompt 5a, hors calcul (`data/indicators`, `data/couverture.md`) : décider lesquels entrent dans le classement. Avant : licences « pas de modification » de RSF et de Transparency International (une transformation en note demande leur accord) ; Freedom House à demander (https://freedomhouse.org/data-request) ; WJP sans licence trouvée (remplacé par la Banque mondiale).
- À relire quand Firecrawl aura des crédits : visas du Maroc, de la Corée du Sud et de la Colombie (pages illisibles par script) ; seconde lecture de NORMLEX et du WEF ; durée d'ensoleillement Open-Meteo (quota épuisé) ; transports ONU-Habitat ODD 11.2.1 (couverture des 38 villes et licence) ; logement OCDE HC1.2 (22 pays) et Eurostat (13 pays).
- Chine : la page du visa Z citée est celle de l'ambassade en Papouasie-Nouvelle-Guinée ; trouver la page de l'ambassade ou du centre de visas en France.
- Blind test : faire passer le quiz à des testeurs sans leur montrer le nom des pays, puis comparer leur intuition (carte du début) et leur résultat.
- Salaires par secteur (OCDE ou ILOSTAT), pour remplacer le salaire moyen tous métiers quand le secteur est connu.

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

### 16 novembre 2026 : le quiz Orizo (prompt 3f)
**Ce qui est fait** (une pull request, un commit par lot)
- Lot 1 : `content/quiz.json` devient une banque de 43 éléments (format, chapitre, thème, dimensions, conditions, « déjà couvert par ») ; schéma de réponse commun (`src/lib/elements.ts`, certitude par réponse) ; 9 composants de format et un registre (`src/components/formats`) ; carte du monde Natural Earth (`scripts/carte.mjs`, `content/carte-monde.json`) ; session v8.
- Lot 2 : 5 chapitres, barre par chapitre, écrans d'ouverture, envies (5 parmi 9) puis classement (2 ; 1,75 ; 1,5 ; 1,25 ; 1,1), deux thermomètres d'anglais, secteur, 4 questions selon le projet ou le secteur, ambiances, 15 phrases à glisser, tri des limites (« Rédhibitoire » = Moins adaptés), écran « Ton intuition et tes réponses » (`src/lib/intuition.ts`), 48 variantes de texte selon le projet sur 14 dilemmes. La question de zone et l'écran Valeurs disparaissent.
- Lot 3 : profil par dimension (`src/lib/profil.ts` : importance, sources déclarées ou déduites, certitude) ; le calcul lit ce profil (`profilCalcul`) ; 7 règles de contradiction (jamais sur une seule réponse) ; portrait avec titre, phrases, hésitation et « Ce qu'on va chercher pour toi ».
- Lot 4 : score des écrans adaptatifs (importance × incertitude × départage), tirage parmi les 60 % meilleurs, règles (dimension, format, thèmes, obligatoires), fin de chapitre de 4 à 7 écrans. 22,9 écrans en moyenne (20 à 28).
- Lot 5 : salaire OCDE 2024 (25 pays, `content/saisie/ocde.json`, `--ocde`), part après impôts (Taxing Wages 2026, hors score), indemnité VIE au 1er janvier 2026 (relayée, à vérifier, `content/saisie/vie-indemnites.json`, `--vie`) utilisée à la place du salaire pour un VIE.
- Lot 6 : part de l'emploi par secteur (ILOSTAT, CITI rév. 4, `--secteur`), 25 pays sur 30 ; ligne « Ton secteur » sous le top 3 ; profil finance : Royaume-Uni n° 3 (n° 7 sans le secteur).
- Lot 7 : tests (221 617 vérifications), simulation avant / après, `npm run banque` (`docs/banque-quiz.md`) et `npm run exemples` (`docs/parcours-exemples.md`).

**Ce qui reste à faire**
- Décisions de Nolhan : voir le rapport du prompt 3f (biais européen sans question de zone, poids de « Je préfère éviter », seuils des limites, éléments communs entre deux parcours 35,8 % au lieu de moins de 30 %).
- Relire la banque (`docs/banque-quiz.md`) et les variantes avec des testeurs.
- Barème VIE et salaires manquants (voir les idées).

### 16 novembre 2026 : quiz réparé et rééquilibré (prompt 3g)
**Ce qui est fait** (une pull request, un commit par lot)
- Lot 1 : plus de page vide en fin d'affinage : retour au portrait avec « Tu as répondu à tout. Ton portrait est à jour. » ; écran de secours dans `Cadre` à la place de chaque `return null` ; session « affiner » sans question restante ramenée au portrait (`src/lib/memoire.ts`) ; `src/app/quiz/error.tsx` et `src/app/global-error.tsx` (`src/components/Erreur.tsx`) ; « Encore N questions possibles » ; test d'un affinage jusqu'au bout.
- Lot 2 : retour depuis le portrait et l'intuition ; classement avec zone morte de 12 px (plus de place sautée) ; swipe protégé du double tap et des touches maintenues ; « Tout passer » distinct de « curseurs à zéro » avec bouton vers les 3 questions clés ; curseur de budget aligné sur la liste ; `scroll-padding-bottom` sous la barre collée ; focus des flèches du classement ; `aria-describedby` des « + » et « − ».
- Lot 3 : mesure « Dépaysement » (inverse de la proximité), envie « Vivre un vrai dépaysement » (5 parmi 10), phrase « J'ai envie d'une vie très différente… » (S16, ajoutée si la carte ne coche que des zones hors d'Europe), Noël C et S2 à 0,5 sur le dépaysement ; « Climat doux » n° 1 vérifié dans le calcul.
- Lot 4 : diversité mesurée sur le contenu lu ; écran Valeurs facultatif en fin de chapitre 5 ; « Tu pars pour combien de temps ? » au chapitre 1 ; décisions validées appliquées (voir les idées).
- Lot 5 : tuiles de 64 px avec pastille de 40 px ; langues en pastilles à cocher ; classement animé (soulèvement, ressort, défilement près des bords, vibration Android) ; swipe en pile (tampons, envol de 300 ms, vers le bas = « Ça dépend », points, boutons ✕ et ✓, « Revenir à la phrase précédente », réponse d'avant visible) ; transition de 200 ms entre écrans ; fondu simple en mouvement réduit.
- Lot 6 : variantes de scènes et titres selon le projet, titre du portrait PVT, résultat provisoire, longues égalités résumées, Hong Kong, lien coréen, secteur « par rapport aux 30 pays », espaces insécables, « Environ 8 minutes », message hors ligne, 320 px sans débordement.
- Simulation avant / après (5 000 parcours) : n° 1 européen 95,5 % → 84,8 % ; Allemagne 31,2 % → 27,4 % ; Suisse 21,4 % → 19,9 % ; contenu lu identique entre deux parcours 20,7 % (objectif : moins de 30 %) ; profil Karim : Australie 74, Japon 72, Allemagne 70.

**Ce qui reste à faire**
- Profil « parle espagnol, chaleur, vie moins chère » : Japon et Corée du Sud en tête, aucun pays hispanophone avant l'Argentine (n° 4) ; parler espagnol ne compte toujours que si la langue du quotidien entre dans le calcul.
- Allemagne encore au-dessus de 20 % de n° 1.
- Tests avec de vraies personnes (équilibre des scènes, blind test).

### 17 novembre 2026 : décisions, VIE officiel, visas jeunes, 38 pays, nom Orizo (prompt 3h)
**Ce qui est fait** (une pull request, un commit par lot)
- Lot 1 : carte du début = bonus de rang 5 aux pays des régions cochées (mesure interne `region-carte`), langue parlée = bonus de 1 (`langue-parlee`), sans malus ni effet sur la couverture ; badge « Données disponibles (n sur N) » avec le détail par niveau de preuve, même règle que les 60 % ; filtre des portes ouvertes sous le top 3. Correctif : « Je préfère éviter » hors d'Europe et « ni français ni anglais » n'avaient aucun effet (mesures calculées vues comme sans données).
- Lot 2 : barème VIE officiel du 1er octobre 2026 (Journal officiel, 36 destinations), `content/saisie/vie-bareme.json` et `scripts/vie.mjs` (base de janvier et taux trimestriels quand ils seront saisis, contrôle, arrondi au centime par trimestre, option `--essai`) ; Pérou et Uruguay hors des destinations de Business France ; seuils 2 650, 2 900, 3 200, 3 550 €.
- Lot 3 : quotas PVT « fixés chaque année entre les deux pays » ; Australie 417 ; Nouvelle-Zélande 4 200 NZD ; Canada 2027 sans date, Jeunes professionnels et Stage coop ; ressources Colombie et Corée « à vérifier » ; J-1, H-1B, GAE, Youth Mobility fermé aux Français, WHP et TEP de Singapour, visa Z, visas des Émirats et sécurité ; Suisse (permis L ou B, 14 jours) et Norvège (police) ; porte « Autres visas pour les jeunes ».
- Lot 4 : Autriche, Pérou, Uruguay, Thaïlande, Vietnam, Inde, Côte d'Ivoire, Sénégal (`collecte.mjs --ajout`, `dossiers.mjs --pays`), carte à 9 régions, vigilance de la capitale.
- Lot 5 : tests (254 000 vérifications), simulation, navigateur à 375 et 1440 px (toucher et clavier), /methode.
- Lot 6 : nom Orizo dans les textes (clé de stockage `country-search:quiz` gardée pour ne pas perdre les quiz en cours).
- Simulation (5 000 parcours) : n° 1 européen 84,8 % → 86,8 % ; Suisse 25,2 %, Allemagne 22,2 % ; nouveaux pays en n° 1 : Autriche 3,1 %, Sénégal 1,5 %, Côte d'Ivoire 0,3 %, Vietnam, Pérou, Uruguay 0,1 %, Inde et Thaïlande 0 % ; contenu lu identique 20,8 %.

**Ce qui reste à faire**
- Saisir : salaire OCDE 2024 de l'Autriche, base de janvier et taux trimestriels VIE de 2026 (Legifrance bloqué depuis la session), Français inscrits des 8 pays (Rapport du Gouvernement 2025), Notre avis (anglais au travail, culture, villes) des 8 pays, emploi par secteur (OIT injoignable).
- Vérifier : Dakar et New Delhi (niveau de vigilance sur la carte), visas de travail des 7 nouveaux pays hors Europe, Stavanger, reste de la Suisse et de la Chine pour le VIE.

### 20 novembre 2026 : données manquantes, inscrits 2025, VIE recalculé, profils fixes (prompt 3i)
**Ce qui est fait** (une pull request après la fusion de la n° 12)
- Un pays à qui il manque une donnée sur une des 3 premières envies ne peut pas entrer dans le top 3 (`mesuresPrincipales`, champ `manquePrincipal` des lignes) ; il reste dans la liste avec son pourcentage et « Donnée manquante : … ». /methode corrigé. Simulation : 0 place du top 3 sur 15 000 ne tient à une donnée manquante sur ces envies ; la règle retire au moins un pays dans 14,3 % des parcours.
- Français inscrits des 8 pays ajoutés : Rapport du Gouvernement 2025 (au 31 décembre 2025, `content/saisie/inscrits-2025.json`, `collecte.mjs --inscrits2025`), population 2025 de la Banque mondiale, même échelle ; les 30 autres gardent le registre de fin 2020.
- VIE : base du 1er janvier 2026 et taux d'avril, juillet et octobre saisis ; le script retrouve les montants du Journal officiel (38 identiques, 15 à un centime près) et affiche Stavanger, Suisse et Chine « autres villes ».
- Simulation : 6 profils fixes (top 3) en plus des parcours au hasard ; /methode : échelle de vigilance de France Diplomatie.
- Salaire : non changé, l'OCDE est injoignable depuis la session.

### 20 novembre 2026 : causes des données manquantes, inscrits 2025, audit (prompt 3j)
**Ce qui est fait** (une pull request après la fusion de la n° 13)
- Salaire : non changé, `data/oecd-average-annual-wages.csv` n'existe pas.
- `data/donnees-manquantes.md` et `data/a-verifier.md` (`npm run donnees`, tirés des données) ; règle des 3 premières envies gardée comme filet : le top 3 change dans 13,6 % des parcours (Autriche 161, Maroc 139, Australie 118, Singapour 75, Japon 73, Côte d'Ivoire 70…) ; complétude des données sous chaque pays recommandé (`completudePays`) ; section « Ce qui reste à vérifier » sur /methode (`src/lib/averifier.ts`).
- Français inscrits : tous les pays au 31 décembre 2025 (Rapport du Gouvernement 2025, lu en entier), sauf Hong Kong (pas de ligne) et Taïwan (population absente) ; Pays-Bas, Japon et Maroc +1, Chili et Colombie −1.
- Bug de données corrigé : homicides du Sénégal de 2015 passés « à vérifier » (règle : pas de donnée d'avant 2019).
- Profils fixes et types dans `scripts/profils.ts` ; Japon du profil e bien visible dans « Moins adaptés », avec la raison.
- Simulation : n° 1 européen 88,7 % → 89,0 % ; Suisse 22,1 %, Allemagne 21,1 %, Pays-Bas 20,1 %.

### 20 novembre 2026 : salaire OCDE, visas officiels, proche 2/3 vol (prompt 3k)
**Ce qui est fait** (une pull request après la fusion de la n° 14 ; données lues par Firecrawl, sites officiels seulement)
- Salaire : OCDE « Average annual wages » (USD PPA, prix constants 2025, dernière année : 2025, Colombie 2024, Chili 2023), `data/oecd-average-annual-wages.csv` ; 23 pays de l'OCDE notés, seuils 51 500, 61 500, 72 500, 79 500 $ ; Argentine, Brésil, Chine et autres pays hors OCDE « à vérifier ».
- Secteurs de l'Autriche : Eurostat 2024 (`content/saisie/secteurs-eurostat.json`), comparés à la médiane des 30 pays ; Canada « à vérifier » (nomenclature SCIAN différente).
- Heures (Australie, Japon, Singapour, Maroc), homicides (Thaïlande, Vietnam, Côte d'Ivoire, Sénégal), vigilance de Dakar et New Delhi : « à vérifier », avec la raison exacte du blocage.
- Visas de travail lus sur les sites officiels : Maroc, Corée du Sud, Chine, Colombie, Brésil, Thaïlande, Inde, Pérou, Uruguay ; Vietnam, Côte d'Ivoire et Sénégal « à vérifier » (aucune page officielle avec les conditions).
- « Proche de la France » : 2/3 vol, 1/3 décalage (`parts` dans `quiz.json`). Mention « Économie informelle » sous le chômage des jeunes de 12 pays (classement de revenu de la Banque mondiale, `content/saisie/revenu-bm.json`).
- Simulation : n° 1 européen 89,0 % → 90,1 % ; Pays-Bas 30,5 %, Suisse 21,7 %, Allemagne 10,3 %, Autriche 10,1 % ; la règle des 3 premières envies change le top 3 dans 11,3 % des parcours.

### 21 novembre 2026 : classement réparé, site ordinateur, carte des zones (prompt 4)
**Ce qui est fait** (une pull request, un commit par lot ; aucun changement des poids ni des formules du calcul)
- Lot A, classement des envies : cause du bug reproduite avec Playwright (doigt à 375 px, souris à 1440 px). À chaque échange de place, React déplaçait la ligne tenue dans la page : la capture du pointeur était perdue (`lostpointercapture` au premier échange), la position de départ était lue dans un état périmé (saut d'une hauteur de ligne, environ 90 px) et les voisins étaient mesurés en pleine animation. Résultat : la ligne s'éloignait du doigt et l'ordre final était faux (1re → 5e finissait 3e au doigt). Correction : dnd-kit (MIT), capteurs souris, doigt (appui de 120 ms), clavier ; une copie fixe suit le pointeur même si la page défile ; l'ordre ne change qu'au relâchement ; poignée de 44 px en `touch-action: none` ; flèches gardées ; mouvement réduit respecté. `npm run e2e:classement` (50 vérifications).
- Lot B, ordinateur : quiz en deux colonnes (question à gauche ; avancement, « Pourquoi on te demande ça ? » déplié, top 5 qui bouge, raccourcis à droite) ; raccourcis 1 à 9, Entrée, Retour arrière ; résultat avec le classement à gauche et la fiche du pays choisi à droite ; accueil en deux colonnes ; sommaire collé sur /methode ; page pays en grille ; boutons à leur taille naturelle ; focus visible partout. Drapeaux des 8 pays du prompt 3h ajoutés (ils étaient vides). `npm run e2e:ordinateur` (56 vérifications, aucun défilement horizontal de 320 à 1920 px).
- Lot C, carte : jusqu'à 3 zones (centre et rayon réel, distance sur la sphère, `src/lib/zones.ts`), dessin avec d3-geo (antiméridien géré), rayon par le bord ou un curseur gradué (500 à 10 000 km), fantôme à la souris, aperçu au doigt, 6 régions en boutons (`groupes` dans `content/quiz.json`) et une liste de villes. Calcul : même bonus qu'avant (importance 1,1) aux pays dont la ville de référence est dans la zone (`paysCarte` du profil), jamais de malus ; avec l'envie « Proche de la France », une zone qui contient la France ne donne pas de bonus. Mesure : environ +2 points pour un pays de la zone ; un n° 10 passe en général n° 8. /methode : section « Ta zone sur la carte ». `npm run test:zones` (40), `npm run e2e:carte` (30).
- Captures avant / après à 375, 768, 1024, 1440 et 1920 px (accueil, 9 formats, résultat, /methode), hors du dépôt.

**Ce qui reste à faire**
- Voir les idées : carte petite au téléphone, simulation avec des cercles.
- Les tests navigateur (`scripts/e2e`) ont besoin d'un site lancé (`npm run build && npm start`, puis `BASE=http://localhost:3000`).

### 22 novembre 2026 : indicateurs, seconde lecture des visas, « à vérifier » par impact (prompt 5a)
**Ce qui est fait** (une pull request ; aucun changement d'interface ni du calcul, seulement des données et leur documentation)
- 13 fichiers CSV dans `data/indicators` (`node scripts/indicateurs.mjs`) : RSF 2026 (38), V-Dem v16 (38), Transparency International CPI 2025 (38), NASA POWER ensoleillement (38), Yale EPI 2026 (37), Banque mondiale État de droit (37), OMS PM2,5 2023 (36), OMS couverture santé 2023 (36), ND-GAIN 2024 (36), WEF 2026 (36), OIT conventions fondamentales (36) ; Freedom House et WJP : liens seulement (licence). Extraction par des agents Haiku, seconde lecture indépendante par des agents Sonnet, comparaison par script ; lecture par script dès que le fichier officiel était joignable. Niveaux de preuve et licences : `data/indicators/README.md`.
- `data/couverture.md` : couverture, pays manquants et raison, sources remplacées (WJP par la Banque mondiale), propositions pour le logement (OCDE HC1.2, 22 pays), les transports (ONU-Habitat ODD 11.2.1) et l'ensoleillement.
- Visas : seconde lecture de 6 pages officielles sur 9 (`data/visas-relecture.md`, phrases exactes) ; 4 conditions corrigées (Brésil, Pérou, Uruguay), 5 liens avec l'employeur passés « à vérifier » (Chine, Brésil, Pérou, Inde, Thaïlande), libellé de la page chinoise corrigé ; Maroc, Corée du Sud et Colombie illisibles : passés « à vérifier » avec la raison.
- Emploi par secteur de 7 pays de plus (Pérou, Uruguay, Thaïlande, Vietnam, Inde, Côte d'Ivoire, Sénégal), OIT 2019 à 2025, même médiane des 30 pays (`scripts/secteurs-complement.mjs`) ; raisons exactes des heures travaillées (l'OIT a 2020 ou 2022 : trop ancien).
- `data/a-verifier-par-impact.md` (`npm run donnees`) : chaque point classé par nombre de parcours simulés touchés. La règle des 3 premières envies change le top 3 dans 11,0 % des parcours (11,3 % avant).
- Réseau : 20 sites officiels ajoutés à la liste autorisée de l'environnement.

**Ce qui reste à faire**
- Voir les idées (« Indicateurs collectés au prompt 5a », « À relire quand Firecrawl aura des crédits »).

### 23 novembre 2026 : quiz v2, deux mesures, échelles continues (prompt 6)
**Ce qui est fait** (une pull request, un commit par lot)
- Données : 8 familles de secteurs de plus (ILOSTAT, 32 pays, `scripts/secteurs16.mjs`) ; 8 indicateurs de `data/indicators` entrent dans les données (`scripts/valeurs.mjs`) : ensoleillement (NASA), soins pour tous (OMS), État de droit (Banque mondiale), liberté d'expression (V-Dem), égalité femmes-hommes (WEF, transformation signalée), droits des travailleurs (OIT), environnement (Yale), préparation au climat (ND-GAIN). RSF et Transparency International restent hors calcul (licence « pas de modification »).
- Banque v2 (`content/quiz.json`, `docs/quiz-v2-banque.md` par `npm run banque`, `src/lib/banque.ts`) : 120 éléments (84 Classement, 17 Portrait, 19 Accès), une fiche chacun (identifiant, chapitre, format, type, donnée et fichier, effet exact, condition, « Pourquoi »). Motivation et relances, projet, scénario idéal, seul / à deux / en famille et relances, frise de durée (« Et après ? »), enveloppe de budget, 16 secteurs, 25 critères en trois temps (5 au plus, le plus dur à sacrifier 2, le second plan 1,1, les autres 1,5) et « Quel avantage te ferait changer d'avis ? » (1), activités du week-end, test à l'aveugle, limites en 5 familles, 2 seuils, 2 limites conditionnelles, 16 valeurs (tri en zones, top 3 des libertés, duel). Formats écartés : distribution de points, pyramide, pays idéal à assembler, trois horizons (raisons dans la fiche). Les notes `docs/quiz-v2-notes.md` et le point d'étape n'étaient pas dans la session.
- Moteur : « Il te ressemble » (tes goûts) et « Il t'est accessible » (100 moins chaque obstacle : porte d'entrée, budget, durée, famille, langue de travail, limites, valeurs indispensables) ; score = ressemble × (1 − 0,3 × (100 − accès) ÷ 100). Les limites ne retirent plus aucun pays ; seule l'impossibilité légale (projet de PVT fermé à ton âge) est à part (« Fermés par la loi pour ton projet »). Notes continues entre les seuils (`noteContinue`). Règle des 30 pays (`mesureClassante`). Règle des 3 premiers critères gardée, complétude affichée.
- Écrans : frise, enveloppe, seuil, tri en zones, test à l'aveugle ; « Ce qu'on ne t'a pas demandé, et pourquoi » avant l'intuition ; les deux mesures et les obstacles sous chaque pays (et dans le PDF) ; plus aucune importance chiffrée à l'écran ; « Pourquoi on te demande ça ? » dit quand une réponse n'a pas assez de données.
- Vérifications : build, tsc, lint, `npm run test:moteur` (591 281 vérifications), `npm run e2e:ordinateur` (79, nouveaux formats de 320 à 1920 px), `npm run e2e:parcours` (nouveau : parcours complet à 375 et 1440 px, 37 à 39 écrans, aucune erreur).
- Simulation (5 000 parcours, `npm run simulation`) : n° 1 européen 89,5 % → 84,1 % ; aucun pays au-dessus de 20 % (Suisse 18,5 %, Pays-Bas 14,6 %, Allemagne 14,2 %) ; 35 écrans en moyenne (29 à 41) ; profils fixes : 33 à 35 écrans, environ 9 minutes ; pays surprise 3,4 % → 14,4 % (limites rédhibitoires seulement). Une règle retirée à la fois : sans « Il t'est accessible », 58,3 % (Australie 19,8 %) ; marches au lieu de notes continues, 84,8 % ; salaire compté en marches (comme avant), Pays-Bas 23,5 % → 19,0 % en notes continues.

**Ce qui reste à faire**
- Voir « Décisions en attente (prompt 6) » dans les idées.
- Tester la banque avec de vraies personnes (durée réelle, compréhension des seuils et du tri en zones).

