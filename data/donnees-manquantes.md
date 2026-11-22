# Données manquantes : ce qui écarte des pays du top 3

Simulation de 5000 parcours tirés au hasard (graine 20261115), le 2026-11-22 (`npm run donnees`).
Règle : un pays à qui il manque une donnée sur une des 3 premières envies de la personne ne peut pas entrer dans son top 3. C'est un filet de sécurité, pas une solution : la solution est de collecter la donnée.

- Parcours dont le top 3 change à cause de la règle : **551 sur 5000 (11,0 %)**.
- Impact d'un pays = nombre de parcours où il aurait été dans le top 3 sans la règle.

## Matrice pays × donnée manquante (triée par impact)

| Pays | Impact | Complétude du pays | Heures de travail | Salaire brut moyen (pouvoir d’achat) | Sécurité | Ton secteur (enseignement et recherche) | Ton secteur (marketing et commerce) | Français sur place | Ton secteur (hôtellerie et tourisme) | Ton secteur (tech et data) | Ton secteur (ingénierie et industrie) | Ton secteur (conseil et audit) | Ton secteur (santé) | Ton secteur (finance et banque) | Coût de la vie | Indemnité VIE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maroc | 154 (3,1 %) | 86 % | 65 | 62 |  | 9 | 5 |  | 9 | 9 | 3 | 7 | 5 | 5 |  |  |
| Australie | 127 (2,5 %) | 93 % | 127 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Singapour | 97 (1,9 %) | 89 % | 61 | 46 |  |  |  |  |  |  |  |  |  |  |  |  |
| Japon | 55 (1,1 %) | 93 % | 55 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Côte d’Ivoire | 52 (1,0 %) | 61 % |  | 36 | 18 |  |  |  |  |  |  |  |  |  |  |  |
| Hong Kong | 44 (0,9 %) | 75 % | 13 | 17 |  | 3 | 1 | 16 |  | 1 | 2 | 2 | 1 |  |  |  |
| Sénégal | 31 (0,6 %) | 61 % |  | 23 | 8 |  |  |  |  |  |  |  |  |  |  |  |
| Canada | 29 (0,6 %) | 96 % |  |  |  | 5 | 7 |  | 4 | 3 | 3 | 1 | 3 | 3 |  |  |
| Nouvelle‑Zélande | 26 (0,5 %) | 93 % | 18 |  |  |  | 2 |  | 2 | 1 | 2 | 1 |  |  |  |  |
| Chine | 24 (0,5 %) | 89 % | 7 | 11 |  | 5 | 3 |  | 1 |  | 2 |  |  | 1 |  |  |
| Argentine | 10 (0,2 %) | 89 % |  | 10 |  |  |  |  |  |  |  |  |  |  |  |  |
| Brésil | 10 (0,2 %) | 89 % |  | 10 |  |  |  |  |  |  |  |  |  |  |  |  |
| Vietnam | 8 (0,2 %) | 61 % |  | 5 | 3 |  |  |  |  |  |  |  |  |  |  |  |
| Uruguay | 7 (0,1 %) | 64 % |  | 5 |  |  |  |  |  |  |  |  |  |  |  | 2 |
| Taïwan | 4 (0,1 %) | 61 % | 2 | 2 |  |  |  | 1 |  |  |  |  |  |  | 2 |  |
| Émirats arabes unis | 3 (0,1 %) | 89 % |  | 3 |  |  |  |  |  |  |  |  |  |  |  |  |
| Pérou | 2 (0,0 %) | 64 % |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |
| Thaïlande | 2 (0,0 %) | 61 % |  | 1 | 1 |  |  |  |  |  |  |  |  |  |  |  |

## À collecter, pays par pays

### Maroc
- **Heures de travail** (écarte le pays dans 65 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 62 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 9 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 9 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 9 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Australie
- **Heures de travail** (écarte le pays dans 127 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Singapour
- **Heures de travail** (écarte le pays dans 61 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 46 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Japon
- **Heures de travail** (écarte le pays dans 55 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Côte d’Ivoire
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 36 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 18 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Hong Kong
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 17 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Français sur place** (écarte le pays dans 16 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Heures de travail** (écarte le pays dans 13 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Sénégal
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 23 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 8 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Canada
- **Ton secteur (marketing et commerce)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Nouvelle‑Zélande
- **Heures de travail** (écarte le pays dans 18 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Chine
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 11 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Heures de travail** (écarte le pays dans 7 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Argentine
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 10 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Brésil
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 10 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Vietnam
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 5 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 3 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).

### Uruguay
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 5 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Indemnité VIE** (écarte le pays dans 2 parcours) : Indemnité VIE mensuelle (ville la plus probable pour un VIE). Source probable : voir /methode.

### Taïwan
- **Coût de la vie** (écarte le pays dans 2 parcours) : Niveau des prix (PPA ÷ taux de change). Source probable : Banque mondiale (PA.NUS.PRVT.PP, PA.NUS.FCRF).
- **Heures de travail** (écarte le pays dans 2 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 2 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Français sur place** (écarte le pays dans 1 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.

### Émirats arabes unis
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 3 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Pérou
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 2 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Thaïlande
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 1 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 1 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
