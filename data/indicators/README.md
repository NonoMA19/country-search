# Indicateurs pays (data/indicators)

Un fichier CSV par indicateur, une ligne par pays (les 38 pays du site). Ces indicateurs ne sont **pas** utilisés par le calcul du site : ce sont des données prêtes, documentées, en attente d'une décision. Couverture et pays manquants : `data/couverture.md`.

Reconstruire : `node scripts/indicateurs.mjs` (télécharge dans `scripts/.cache/indicateurs` ce qui manque, puis écrit les CSV et `data/couverture.md`).

## Colonnes

`pays_id, pays, iso3, valeur, unite, rang, annee_donnee, edition, source, url, niveau_preuve, lu_le, licence, remarque`

- `valeur` vide : pas de valeur, la raison est dans `remarque`. Jamais de valeur estimée, arrondie ou déduite.
- `url` : la page, le fichier ou l'appel d'API exact d'où vient la valeur.
- `lu_le` : date de lecture.

## Niveaux de preuve

| Niveau | Ce que ça veut dire | Indicateurs |
| --- | --- | --- |
| Donnée officielle, lue par script | Le fichier ou l'API de l'éditeur est téléchargé, puis lu par un programme : aucune valeur n'est recopiée à la main. | OMS PM2,5 et couverture santé ; RSF ; V-Dem ; Yale EPI ; NASA POWER ; Banque mondiale (État de droit) |
| Lecture automatique, recoupée | Deux agents ont lu la source séparément (un modèle Haiku, puis un modèle Sonnet qui ne voyait pas la première lecture) ; leurs valeurs ont été comparées par script, sans aucun écart. | Transparency International (CPI) ; ND-GAIN |
| Lecture automatique | Un seul agent a lu la source ; pas de seconde lecture indépendante. | WEF (contrôlé par script sur le texte du PDF que l'agent a extrait) ; OIT NORMLEX |
| Lien seulement | La valeur a été lue mais n'est pas reproduite, à cause de la licence. | Freedom House ; World Justice Project |

Les preuves des lectures par agents (valeur, URL, extrait mot pour mot, seconde lecture) sont dans `lectures/` : `cpi.json`, `ndgain.json`, `wef.json`, `normlex.json`.

Pour les sources lues par script, les lectures par agents ont aussi servi de contrôle : RSF (CSV officiel), EPI (tableau officiel), V-Dem (API officielle de v-dem.net) et NASA POWER concordent pour tous les pays avec la lecture par script.

## Licences : ce qu'on peut faire

| Source | Licence lue | Conséquence |
| --- | --- | --- |
| RSF | Creative Commons « Attribution – Pas de modification », usage commercial interdit (méthodologie 2026) | Valeur reproduite telle quelle, en citant « Reporters sans frontières / RSF.org ». La transformer en note du classement demande l'accord de RSF. |
| V-Dem | CC BY-SA 4.0 | Libre, en citant V-Dem (et Our World in Data, qui la republie). |
| Freedom House | Données libres pour un usage non lucratif, mais « may not be resold or redistributed without prior written permission » | **Valeurs non reproduites.** Demande à faire : https://freedomhouse.org/data-request |
| World Justice Project | Licence non trouvée (téléchargement refusé, erreur 403) | **Valeurs non reproduites.** Remplacé par la Banque mondiale (CC BY 4.0). |
| WEF | Données reproductibles et diffusables si elles restent exactes et attribuées au WEF ; transformation à signaler ; vente interdite sans accord | Valeur reproduite, en citant le WEF. |
| Transparency International | CC BY-ND 4.0 (FAQ du CPI) ; les conditions du site ajoutent « no commercial » | Valeur reproduite avec la phrase de citation exigée. La transformer en note demande l'accord de Transparency International. |
| OMS | CC BY-NC-SA 3.0 IGO | Usage non commercial seulement (comme la mesure « Manger sainement »). |
| Yale EPI | CC BY-NC-SA 4.0 | Usage non commercial seulement. |
| OIT NORMLEX | CC BY 4.0 (bases de données de l'OIT depuis le 3 mai 2023) | Libre, en citant l'OIT. |
| ND-GAIN | CC BY 3.0 | Libre, en citant ND-GAIN. |
| NASA POWER | Aucune restriction indiquée ; la NASA demande d'être citée et prévenue en cas de redistribution | Libre, en citant POWER. |
| Banque mondiale | CC BY 4.0 | Libre, en citant la Banque mondiale. |

Si le site devenait commercial, les données RSF, Transparency International, OMS et EPI devraient être retirées ou faire l'objet d'un accord.
