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
