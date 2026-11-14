# Country Search (nom de code)

## Mission
Aider les étudiants et jeunes diplômés francophones à choisir le pays où partir travailler, puis à arriver prêts le jour J : visa, banque, carte SIM, santé, logement, CV local, codes culturels.

## Cible et périmètre
- Étudiants et jeunes diplômés francophones. Site en français uniquement.
- Passeport français uniquement, avec une question « As-tu une autre nationalité ? » qui affiche avantages et pièges.
- Gratuit et open source. Aucune publicité, aucune affiliation (hébergement Vercel gratuit, usage non commercial).

## Version 1 (ce qu'on construit maintenant)
- Quiz façon Elyze : des phrases à valider ou rejeter, sans compte.
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
- Signalements par e-mail : remplir `CONTACT_EMAIL` dans `src/config.ts`.

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
