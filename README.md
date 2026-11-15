# Country Search

> **Statut : en construction.** Le site n'est pas encore utilisable. Pour l'instant, il n'y a qu'une page d'accueil provisoire.

Country Search aide les étudiants et jeunes diplômés francophones à choisir le pays où partir travailler, puis à arriver prêts le jour J : visa, banque, carte SIM, santé, logement, CV local, codes culturels.

- Site en français, pour les titulaires d'un passeport français.
- Gratuit et open source. Aucune publicité, aucune affiliation.
- Pas de compte, pas d'IA en direct.

## Ce qui est prévu (version 1)

- Un quiz de dilemmes (de petites scènes à 2 ou 3 options), sans compte.
- Un classement des 30 pays par un calcul transparent, avec le « pourquoi » de chaque score.
- Un top 3, des fiches pays (10 complètes, 20 courtes) et une checklist Jour J, de J-90 à J+30.

## Avertissement

Les informations sur les visas et les impôts ne sont pas un conseil juridique. Vérifie toujours auprès des sources officielles.

## Lancer le site chez soi

Il faut [Node.js](https://nodejs.org) (version LTS).

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000.

## Organisation du projet

- `src/` : le code du site (Next.js, TypeScript, Tailwind).
- `content/pays.json` : la liste des 30 pays.
- `content/pays/` : les fiches pays en Markdown. `_modele.md` est le modèle vide.
- `CLAUDE.md` : les règles du projet.

## Licences

- Code : [MIT](LICENSE).
- Contenu des fiches (`content/`) : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr).
