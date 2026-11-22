# Couverture des indicateurs

Tirée des fichiers de data/indicators le 2026-11-22 (`node scripts/indicateurs.mjs`). Un indicateur couvert pour moins de 30 pays sur 38 est signalé : il ne doit pas faire bouger le classement. Aucun de ces indicateurs n'est utilisé par le calcul aujourd'hui.

| Indicateur | Source | Pays avec valeur | Signalé (< 30) | Niveau de preuve | Licence |
| --- | --- | --- | --- | --- | --- |
| Qualité de l'air : particules fines PM2,5 | Organisation mondiale de la santé, Global Health Observatory, indicateur SDGPM25 (ODD 11.6.2) | 36 / 38 | non | Donnée officielle, lue par script | CC BY-NC-SA 3.0 IGO : usage non commercial, en citant l'OMS |
| Santé : indice de couverture des services de santé essentiels | Organisation mondiale de la santé, Global Health Observatory, indicateur UHC_INDEX_REPORTED (ODD 3.8.1) | 36 / 38 | non | Donnée officielle, lue par script | CC BY-NC-SA 3.0 IGO : usage non commercial, en citant l'OMS |
| Liberté de la presse (RSF) | Reporters sans frontières, Classement mondial de la liberté de la presse 2026 | 38 / 38 | non | Donnée officielle, lue par script | Creative Commons « Attribution – Pas de modification », usage commercial interdit (page de méthodologie 2026) : citer « Reporters sans frontières / RSF.org » ; valeur reproduite telle quelle, à ne pas transformer en note sans l'accord de RSF |
| Liberté d'expression et pluralisme de l'information (V-Dem) | V-Dem (Varieties of Democracy), republié par Our World in Data, V-Dem v16 (mars 2026), indicateur v2x_freexp_altinf | 38 / 38 | non | Donnée officielle, lue par script | CC BY-SA 4.0 (jeu de données V-Dem) : citer V-Dem et Our World in Data |
| Environnement : Environmental Performance Index | Yale Center for Environmental Law & Policy, Environmental Performance Index 2026 (Yale) | 37 / 38 | non | Donnée officielle, lue par script | CC BY-NC-SA 4.0 : usage non commercial, en citant l'EPI (Yale) |
| Ensoleillement : rayonnement solaire reçu au sol | NASA Langley Research Center, projet POWER, NASA POWER, API de climatologie v2.10.2 | 38 / 38 | non | Donnée officielle, lue par script | Aucune restriction indiquée ; la NASA demande de citer POWER et d'être prévenue en cas de redistribution |
| État de droit (Banque mondiale, indicateurs de gouvernance) | Banque mondiale, Worldwide Governance Indicators, série GOV_WGI_RL.SC (mise à jour du 2026-09-25) | 37 / 38 | non | Donnée officielle, lue par script | CC BY 4.0, en citant la Banque mondiale |
| Corruption perçue (Transparency International) | Transparency International, Corruption Perceptions Index 2025 (publié le 10 février 2026) | 38 / 38 | non | Lecture automatique, recoupée (deux agents indépendants, aucun écart) | CC BY-ND 4.0 : citer « Corruption Perceptions Index 2025 by Transparency International is licensed under CC BY-ND 4.0 » avec un lien ; ne pas modifier (pas de transformation en note sans accord) |
| Risques climatiques : préparation face au changement climatique (ND-GAIN) | Notre Dame Global Adaptation Initiative (université Notre-Dame), ND-GAIN Country Index, données 2005 à 2024 | 36 / 38 | non | Lecture automatique, recoupée (deux agents indépendants, aucun écart) | CC BY 3.0 (page de téléchargement des données ND-GAIN) |
| Égalité femmes-hommes : Global Gender Gap Index | Forum économique mondial (World Economic Forum), Global Gender Gap Report 2026 (publié le 16 septembre 2026) | 36 / 38 | non | Lecture automatique | Données du WEF : reproduction et diffusion autorisées si elles restent exactes et attribuées au World Economic Forum ; toute transformation doit être signalée ; vente interdite sans accord (« Terms of use and disclaimer » du rapport 2026) |
| Droits des travailleurs : conventions fondamentales de l'OIT ratifiées et en vigueur | Organisation internationale du travail, NORMLEX, NORMLEX (OIT), état au 21 novembre 2026 | 36 / 38 | non | Lecture automatique | CC BY 4.0 (bases de données de l'OIT, depuis le 3 mai 2023) |
| Libertés politiques et civiles (Freedom House) | Freedom House, Freedom in the World 2026 (année 2025) | 0 / 38 | **oui** | Lien seulement (valeur non reproduite) | Republication des données soumise à l'accord écrit de Freedom House (formulaire de demande : « may not be resold or redistributed without prior written permission ») : valeurs non reproduites |
| État de droit (World Justice Project) | World Justice Project, Rule of Law Index 2026 | 0 / 38 | **oui** | Lien seulement (valeur non reproduite) | Licence des données non trouvée (page de téléchargement refusée aux scripts, erreur 403 ; seule mention lue : « rights: World Justice Project ») : valeurs non reproduites |

## Pays manquants, indicateur par indicateur

### Qualité de l'air : particules fines PM2,5

- **Taïwan** : Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).
- **Hong Kong** : Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).

### Santé : indice de couverture des services de santé essentiels

- **Taïwan** : Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).
- **Hong Kong** : Aucune ligne pour ce territoire dans le Global Health Observatory (l'OMS ne le publie pas à part).

### Liberté de la presse (RSF)

Aucun : les 38 pays ont une valeur.

### Liberté d'expression et pluralisme de l'information (V-Dem)

Aucun : les 38 pays ont une valeur.

### Environnement : Environmental Performance Index

- **Hong Kong** : Absent du classement 2026 (177 pays) : la page pays ne contient aucun score.

### Ensoleillement : rayonnement solaire reçu au sol

Aucun : les 38 pays ont une valeur.

### État de droit (Banque mondiale, indicateurs de gouvernance)

- **Taïwan** : Taïwan n'est pas servi par l'API de la Banque mondiale.

### Corruption perçue (Transparency International)

Aucun : les 38 pays ont une valeur.

### Risques climatiques : préparation face au changement climatique (ND-GAIN)

- **Taïwan** : Non couvert : le classement ND-GAIN 2024 (https://gain-new.crc.nd.edu/ranking, « Scores for 2024 ») liste 192 pays et ne contient pas Taïwan (aucune ligne id="country-TWN", pas de page pays). Aucune valeur saisie.
- **Hong Kong** : Non couvert : le classement ND-GAIN 2024 (https://gain-new.crc.nd.edu/ranking, « Scores for 2024 ») liste 192 pays et ne contient pas Hong Kong (aucune ligne id="country-HKG", pas de page pays). Aucune valeur saisie.

### Égalité femmes-hommes : Global Gender Gap Index

- **Taïwan** : Taïwan absent du tableau des 145 économies de l'édition 2026 (aucune ligne « Taiwan » dans le tableau à scores du PDF).
- **Hong Kong** : Hong Kong absent du tableau des 145 économies (« Hong Kong SAR, China » n'apparaît que dans des sections d'enquête et de sous-indices, sans score global).

### Droits des travailleurs : conventions fondamentales de l'OIT ratifiées et en vigueur

- **Taïwan** : Taïwan n'est pas membre de l'OIT ; pas de valeur.
- **Hong Kong** : Hong Kong n'a pas de ratification : NORMLEX donne des déclarations d'application (valeur non comptée). Non compté dans la valeur.

### Libertés politiques et civiles (Freedom House)

- **Belgique** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Suisse** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Allemagne** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Irlande** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Luxembourg** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Espagne** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Italie** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Pays‑Bas** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Portugal** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Norvège** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Suède** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Danemark** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Autriche** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Canada** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Australie** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Japon** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Nouvelle‑Zélande** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Corée du Sud** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Taïwan** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Hong Kong** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Argentine** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Chili** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Colombie** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Mexique** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Brésil** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Pérou** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Uruguay** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Royaume‑Uni** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **États‑Unis** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Singapour** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Émirats arabes unis** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Chine** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Maroc** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Thaïlande** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Vietnam** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Inde** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Côte d’Ivoire** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).
- **Sénégal** : Valeur lue (deux lectures concordantes) mais non reproduite : la republication demande l'accord écrit de Freedom House (https://freedomhouse.org/data-request).

### État de droit (World Justice Project)

- **Belgique** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Suisse** : Absent du tableau 2026 (143 pays).
- **Allemagne** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Irlande** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Luxembourg** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Espagne** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Italie** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Pays‑Bas** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Portugal** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Norvège** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Suède** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Danemark** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Autriche** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Canada** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Australie** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Japon** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Nouvelle‑Zélande** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Corée du Sud** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Taïwan** : Absent du tableau 2026 (143 pays).
- **Hong Kong** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Argentine** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Chili** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Colombie** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Mexique** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Brésil** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Pérou** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Uruguay** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Royaume‑Uni** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **États‑Unis** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Singapour** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Émirats arabes unis** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Chine** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Maroc** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Thaïlande** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Vietnam** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Inde** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Côte d’Ivoire** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.
- **Sénégal** : Valeur lue (deux lectures concordantes) mais non reproduite tant que la licence n'est pas connue.


## Sources remplacées, et pourquoi

- **État de droit** : le World Justice Project est remplacé par la Banque mondiale (indicateurs de gouvernance, « Rule of Law », score de 0 à 100). La licence des données du WJP n'a pas pu être trouvée (page de téléchargement refusée aux scripts) ; la Banque mondiale publie sous CC BY 4.0, couvre 37 pays sur 38 et c'est déjà la famille des notes « stabilité » et « libertés » du site. Le fichier du WJP reste, avec ses liens seulement.
- **Libertés** : Freedom House interdit de republier ses données sans accord écrit. RSF (presse, CSV officiel) et V-Dem (expression et pluralisme, CC BY-SA 4.0) couvrent les 38 pays et suffisent. Pour publier Freedom House, il faut faire la demande sur https://freedomhouse.org/data-request.

## Logement, transports, ensoleillement : la meilleure source ouverte

- **Logement** : OCDE, Affordable Housing Database, indicateur HC1.2 « Housing costs over income » (part du revenu consacrée au logement). Pourquoi : même définition pour tous les pays, source officielle, réutilisation permise en citant l'OCDE. Limite : 22 pays sur 38 (années de 2017 à 2024 selon le pays), donc **signalé** : information seulement, jamais dans le classement. Complément pour l'Europe : Eurostat ilc_mded01 (13 pays, 2025, réutilisation permise en citant Eurostat). Écartés : Numbeo (licence), l'indicateur ODD 11.1.1 (bidonvilles : pas le bon sujet pour notre public). Non collecté dans cette session.
- **Transports** : ONU-Habitat, indicateur ODD 11.2.1 « part de la population ayant un accès pratique aux transports publics », mesuré par ville (2020 et 2025). Pourquoi : seul indicateur comparable entre pays, et il se lit à l'échelle de la ville, comme nos villes de référence. Limites : seule la première page sur 30 de la base a été lue (Buenos Aires, Sydney) ; la licence n'est pas lue ; la couverture de nos 38 villes n'est pas établie. À collecter quand unstats.un.org sera lisible.
- **Ensoleillement** : collecté avec NASA POWER (rayonnement solaire reçu au sol, moyenne 2001-2020, à la ville de référence ; 38 pays sur 38, lu par script). Pourquoi : donnée ouverte, même méthode pour toutes les villes, sans restriction de réutilisation. La meilleure mesure pour une personne serait la durée d'ensoleillement en heures, avec Open-Meteo (réanalyse ERA5, CC BY 4.0, déjà la source du climat du site) : le quota quotidien de l'API était épuisé pendant la session. À ajouter ensuite, avec la même ville de référence.
