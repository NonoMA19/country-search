# Données manquantes : ce qui écarte des pays du top 3

Simulation de 5000 parcours tirés au hasard (graine 20261115), le 2026-11-20 (`npm run donnees`).
Règle : un pays à qui il manque une donnée sur une des 3 premières envies de la personne ne peut pas entrer dans son top 3. C'est un filet de sécurité, pas une solution : la solution est de collecter la donnée.

- Parcours dont le top 3 change à cause de la règle : **564 sur 5000 (11,3 %)**.
- Impact d'un pays = nombre de parcours où il aurait été dans le top 3 sans la règle.

## Matrice pays × donnée manquante (triée par impact)

| Pays | Impact | Complétude du pays | Heures de travail | Salaire brut moyen (pouvoir d’achat) | Ton secteur (enseignement et recherche) | Ton secteur (hôtellerie et tourisme) | Sécurité | Ton secteur (marketing et commerce) | Ton secteur (ingénierie et industrie) | Français sur place | Ton secteur (tech et data) | Ton secteur (santé) | Ton secteur (conseil et audit) | Ton secteur (finance et banque) | Coût de la vie | Indemnité VIE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maroc | 162 (3,2 %) | 86 % | 61 | 59 | 14 | 9 |  | 11 | 10 |  | 7 | 5 | 7 | 3 |  |  |
| Australie | 127 (2,5 %) | 93 % | 127 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Singapour | 75 (1,5 %) | 89 % | 44 | 36 |  |  |  |  |  |  |  |  |  |  |  |  |
| Côte d’Ivoire | 53 (1,1 %) | 61 % |  | 28 | 2 | 3 | 12 | 3 | 5 |  | 1 | 3 | 4 | 1 |  |  |
| Japon | 50 (1,0 %) | 93 % | 50 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Hong Kong | 50 (1,0 %) | 75 % | 13 | 19 | 2 |  |  | 3 | 1 | 18 |  |  |  |  |  |  |
| Sénégal | 39 (0,8 %) | 61 % |  | 19 | 1 | 3 | 10 | 2 | 2 |  | 3 | 2 | 2 | 2 |  |  |
| Nouvelle‑Zélande | 33 (0,7 %) | 93 % | 21 |  | 2 | 5 |  |  |  |  | 3 | 3 | 1 | 1 |  |  |
| Canada | 27 (0,5 %) | 96 % |  |  | 5 | 7 |  | 5 | 5 |  | 3 |  |  | 2 |  |  |
| Chine | 22 (0,4 %) | 89 % | 8 | 6 | 3 | 1 |  | 2 | 1 |  |  | 1 |  | 2 |  |  |
| Uruguay | 19 (0,4 %) | 64 % |  | 11 | 1 |  |  |  | 2 |  | 1 | 1 |  | 2 |  | 1 |
| Argentine | 14 (0,3 %) | 89 % |  | 14 |  |  |  |  |  |  |  |  |  |  |  |  |
| Brésil | 14 (0,3 %) | 89 % |  | 14 |  |  |  |  |  |  |  |  |  |  |  |  |
| Taïwan | 6 (0,1 %) | 61 % | 3 |  |  |  | 1 |  |  | 3 |  |  |  |  | 3 |  |
| Pérou | 6 (0,1 %) | 64 % |  | 6 |  |  |  |  |  |  |  |  |  |  |  |  |
| Vietnam | 5 (0,1 %) | 61 % |  | 1 |  | 1 | 3 |  |  |  |  |  |  |  |  |  |
| Émirats arabes unis | 2 (0,0 %) | 89 % |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |
| Thaïlande | 1 (0,0 %) | 61 % |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |

## À collecter, pays par pays

### Maroc
- **Heures de travail** (écarte le pays dans 61 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 59 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 14 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 11 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 10 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 9 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Australie
- **Heures de travail** (écarte le pays dans 127 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Singapour
- **Heures de travail** (écarte le pays dans 44 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 36 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Côte d’Ivoire
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 28 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 12 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Japon
- **Heures de travail** (écarte le pays dans 50 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Hong Kong
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 19 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Français sur place** (écarte le pays dans 18 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Heures de travail** (écarte le pays dans 13 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Sénégal
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 19 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 10 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Nouvelle‑Zélande
- **Heures de travail** (écarte le pays dans 21 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Canada
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Chine
- **Heures de travail** (écarte le pays dans 8 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 6 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Uruguay
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 11 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Indemnité VIE** (écarte le pays dans 1 parcours) : Indemnité VIE mensuelle (ville la plus probable pour un VIE). Source probable : voir /methode.
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Argentine
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 14 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Brésil
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 14 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Taïwan
- **Coût de la vie** (écarte le pays dans 3 parcours) : Niveau des prix (PPA ÷ taux de change). Source probable : Banque mondiale (PA.NUS.PRVT.PP, PA.NUS.FCRF).
- **Français sur place** (écarte le pays dans 3 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Heures de travail** (écarte le pays dans 3 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Sécurité** (écarte le pays dans 1 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Pérou
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 6 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Vietnam
- **Sécurité** (écarte le pays dans 3 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 1 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Émirats arabes unis
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 2 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Thaïlande
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 1 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
