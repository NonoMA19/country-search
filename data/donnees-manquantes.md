# Données manquantes : ce qui écarte des pays du top 3

Simulation de 5000 parcours tirés au hasard (graine 20261115), le 2026-11-23 (`npm run donnees`).
Règle : un pays à qui il manque une donnée sur une des 3 premières envies de la personne ne peut pas entrer dans son top 3. C'est un filet de sécurité, pas une solution : la solution est de collecter la donnée.

- Parcours dont le top 3 change à cause de la règle : **407 sur 5000 (8,1 %)**.
- Impact d'un pays = nombre de parcours où il aurait été dans le top 3 sans la règle.

## Matrice pays × donnée manquante (triée par impact)

| Pays | Impact | Complétude du pays | Heures de travail | Grandes villes | Travailler en anglais | Nature | Hiérarchie | Villes moyennes | Communication | Français sur place | Qualité de l’air | Ton secteur (marketing et commerce) | Manger sainement | Ton secteur (services aux entreprises (RH, intérim, support)) | Ton secteur (conseil et audit) | Ton secteur (enseignement et recherche) | Ton secteur (agriculture et l’agroalimentaire) | Ton secteur (bâtiment et l’architecture) | Sécurité | Ton secteur (ingénierie et industrie) | Ton secteur (transport et la logistique) | Ton secteur (culture, les arts et le sport) | Ton secteur (finance et banque) | Ton secteur (hôtellerie et tourisme) | Ton secteur (administration et le service public) | Ton secteur (santé) | Ton secteur (énergie, l’eau et l’environnement) | Ton secteur (immobilier) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autriche | 196 (3,9 %) | 75 % |  | 52 | 50 | 37 | 27 | 28 | 18 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Australie | 62 (1,2 %) | 94 % | 62 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Hong Kong | 35 (0,7 %) | 67 % | 7 |  |  |  |  |  |  | 12 | 11 |  | 5 | 2 | 1 | 1 |  |  |  |  |  |  |  | 1 | 1 |  |  |  |
| Canada | 29 (0,6 %) | 97 % |  |  |  |  |  |  |  |  |  | 4 |  | 1 | 3 | 2 | 5 | 2 |  | 3 | 2 | 2 | 1 | 1 | 1 | 1 | 1 |  |
| Sénégal | 26 (0,5 %) | 69 % |  | 5 | 3 | 4 | 9 | 3 | 5 |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |  |
| Uruguay | 25 (0,5 %) | 72 % |  | 7 | 6 | 4 | 3 | 4 | 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Nouvelle‑Zélande | 23 (0,5 %) | 94 % | 8 |  |  |  |  |  |  |  |  | 3 |  | 2 | 1 | 2 |  | 2 |  |  | 1 | 1 | 2 |  |  |  |  | 1 |
| Japon | 18 (0,4 %) | 94 % | 18 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Côte d’Ivoire | 10 (0,2 %) | 69 % |  | 1 |  | 2 | 3 | 2 | 2 |  |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |
| Vietnam | 7 (0,1 %) | 69 % |  |  | 3 |  | 1 | 3 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Thaïlande | 4 (0,1 %) | 69 % |  | 1 | 1 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Singapour | 2 (0,0 %) | 92 % | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Inde | 1 (0,0 %) | 69 % |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Maroc | 1 (0,0 %) | 89 % | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Pérou | 1 (0,0 %) | 72 % |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## À collecter, pays par pays

### Autriche
- **Grandes villes** (écarte le pays dans 52 parcours) : Grandes villes animées. Source probable : voir /methode.
- **Travailler en anglais** (écarte le pays dans 50 parcours) : Travailler en anglais. Source probable : voir /methode.
- **Nature** (écarte le pays dans 37 parcours) : Nature à proximité. Source probable : voir /methode.
- **Villes moyennes** (écarte le pays dans 28 parcours) : Villes moyennes actives. Source probable : voir /methode.
- **Hiérarchie** (écarte le pays dans 27 parcours) : Hiérarchie. Source probable : voir /methode.
- **Communication** (écarte le pays dans 18 parcours) : Communication. Source probable : voir /methode.

### Australie
- **Heures de travail** (écarte le pays dans 62 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Hong Kong
- **Français sur place** (écarte le pays dans 12 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Qualité de l’air** (écarte le pays dans 11 parcours) : Qualité de l’air (particules fines PM2,5). Source probable : voir /methode.
- **Heures de travail** (écarte le pays dans 7 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Manger sainement** (écarte le pays dans 5 parcours) : Obésité des adultes (manger sainement). Source probable : voir /methode.
- **Ton secteur (services aux entreprises (RH, intérim, support))** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (administration et le service public)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Canada
- **Ton secteur (agriculture et l’agroalimentaire)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (bâtiment et l’architecture)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (transport et la logistique)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (culture, les arts et le sport)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (énergie, l’eau et l’environnement)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (administration et le service public)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (services aux entreprises (RH, intérim, support))** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Sénégal
- **Hiérarchie** (écarte le pays dans 9 parcours) : Hiérarchie. Source probable : voir /methode.
- **Grandes villes** (écarte le pays dans 5 parcours) : Grandes villes animées. Source probable : voir /methode.
- **Communication** (écarte le pays dans 5 parcours) : Communication. Source probable : voir /methode.
- **Nature** (écarte le pays dans 4 parcours) : Nature à proximité. Source probable : voir /methode.
- **Travailler en anglais** (écarte le pays dans 3 parcours) : Travailler en anglais. Source probable : voir /methode.
- **Villes moyennes** (écarte le pays dans 3 parcours) : Villes moyennes actives. Source probable : voir /methode.
- **Sécurité** (écarte le pays dans 2 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Uruguay
- **Grandes villes** (écarte le pays dans 7 parcours) : Grandes villes animées. Source probable : voir /methode.
- **Communication** (écarte le pays dans 6 parcours) : Communication. Source probable : voir /methode.
- **Travailler en anglais** (écarte le pays dans 6 parcours) : Travailler en anglais. Source probable : voir /methode.
- **Nature** (écarte le pays dans 4 parcours) : Nature à proximité. Source probable : voir /methode.
- **Villes moyennes** (écarte le pays dans 4 parcours) : Villes moyennes actives. Source probable : voir /methode.
- **Hiérarchie** (écarte le pays dans 3 parcours) : Hiérarchie. Source probable : voir /methode.

### Nouvelle‑Zélande
- **Heures de travail** (écarte le pays dans 8 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (services aux entreprises (RH, intérim, support))** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (bâtiment et l’architecture)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (immobilier)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (culture, les arts et le sport)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (transport et la logistique)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Japon
- **Heures de travail** (écarte le pays dans 18 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Côte d’Ivoire
- **Hiérarchie** (écarte le pays dans 3 parcours) : Hiérarchie. Source probable : voir /methode.
- **Nature** (écarte le pays dans 2 parcours) : Nature à proximité. Source probable : voir /methode.
- **Villes moyennes** (écarte le pays dans 2 parcours) : Villes moyennes actives. Source probable : voir /methode.
- **Communication** (écarte le pays dans 2 parcours) : Communication. Source probable : voir /methode.
- **Grandes villes** (écarte le pays dans 1 parcours) : Grandes villes animées. Source probable : voir /methode.
- **Sécurité** (écarte le pays dans 1 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Vietnam
- **Travailler en anglais** (écarte le pays dans 3 parcours) : Travailler en anglais. Source probable : voir /methode.
- **Villes moyennes** (écarte le pays dans 3 parcours) : Villes moyennes actives. Source probable : voir /methode.
- **Hiérarchie** (écarte le pays dans 1 parcours) : Hiérarchie. Source probable : voir /methode.

### Thaïlande
- **Communication** (écarte le pays dans 2 parcours) : Communication. Source probable : voir /methode.
- **Travailler en anglais** (écarte le pays dans 1 parcours) : Travailler en anglais. Source probable : voir /methode.
- **Grandes villes** (écarte le pays dans 1 parcours) : Grandes villes animées. Source probable : voir /methode.

### Singapour
- **Heures de travail** (écarte le pays dans 2 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Inde
- **Grandes villes** (écarte le pays dans 1 parcours) : Grandes villes animées. Source probable : voir /methode.

### Maroc
- **Heures de travail** (écarte le pays dans 1 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Pérou
- **Villes moyennes** (écarte le pays dans 1 parcours) : Villes moyennes actives. Source probable : voir /methode.
