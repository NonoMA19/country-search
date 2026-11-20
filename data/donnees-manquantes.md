# Données manquantes : ce qui écarte des pays du top 3

Simulation de 5000 parcours tirés au hasard (graine 20261115), le 2026-11-20 (`npm run donnees`).
Règle : un pays à qui il manque une donnée sur une des 3 premières envies de la personne ne peut pas entrer dans son top 3. C'est un filet de sécurité, pas une solution : la solution est de collecter la donnée.

- Parcours dont le top 3 change à cause de la règle : **680 sur 5000 (13,6 %)**.
- Impact d'un pays = nombre de parcours où il aurait été dans le top 3 sans la règle.

## Matrice pays × donnée manquante (triée par impact)

| Pays | Impact | Complétude du pays | Heures de travail | Salaire brut moyen (pouvoir d’achat) | Ton secteur (hôtellerie et tourisme) | Ton secteur (marketing et commerce) | Ton secteur (enseignement et recherche) | Ton secteur (ingénierie et industrie) | Sécurité | Ton secteur (tech et data) | Ton secteur (finance et banque) | Ton secteur (conseil et audit) | Ton secteur (santé) | Français sur place | Chômage des jeunes | Indemnité VIE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autriche | 161 (3,2 %) | 64 % |  | 69 | 21 | 18 | 13 | 15 |  | 7 | 13 | 9 | 3 |  |  |  |
| Maroc | 139 (2,8 %) | 86 % | 54 | 52 | 14 | 8 | 4 | 7 |  | 7 | 1 | 6 | 4 |  |  |  |
| Australie | 118 (2,4 %) | 93 % | 118 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Singapour | 75 (1,5 %) | 89 % | 46 | 34 |  |  |  |  |  |  |  |  |  |  |  |  |
| Japon | 73 (1,5 %) | 93 % | 73 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Côte d’Ivoire | 70 (1,4 %) | 61 % |  | 37 | 4 | 2 | 5 | 2 | 16 | 3 |  | 1 | 3 |  |  |  |
| Canada | 41 (0,8 %) | 96 % |  |  | 10 | 10 | 4 | 4 |  | 6 | 3 | 3 | 1 |  |  |  |
| Sénégal | 41 (0,8 %) | 61 % |  | 20 | 2 |  | 4 | 2 | 11 | 2 | 1 |  | 2 |  |  |  |
| Hong Kong | 38 (0,8 %) | 75 % | 12 | 14 |  | 3 | 1 |  |  | 1 | 2 | 1 |  | 13 |  |  |
| Nouvelle‑Zélande | 20 (0,4 %) | 93 % | 12 |  | 1 | 3 | 1 | 1 |  | 1 | 3 |  |  |  |  |  |
| Uruguay | 8 (0,2 %) | 64 % |  | 6 | 4 |  |  |  |  |  | 1 |  |  |  |  | 1 |
| Émirats arabes unis | 7 (0,1 %) | 89 % |  | 7 |  |  |  |  |  |  |  |  |  |  |  |  |
| Vietnam | 7 (0,1 %) | 61 % |  | 3 |  |  | 1 |  | 2 |  |  |  | 1 |  |  |  |
| Pérou | 5 (0,1 %) | 64 % |  | 4 |  |  | 1 |  |  |  |  |  |  |  |  |  |
| Taïwan | 4 (0,1 %) | 61 % | 1 | 1 |  |  |  |  |  |  |  |  |  | 1 | 2 |  |
| Chine | 2 (0,0 %) | 93 % | 1 |  |  | 1 |  |  |  |  |  |  |  |  |  |  |

## À collecter, pays par pays

### Autriche
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 69 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 21 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 18 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 15 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 13 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 13 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 9 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Maroc
- **Heures de travail** (écarte le pays dans 54 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 52 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 14 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 8 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 7 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 6 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Australie
- **Heures de travail** (écarte le pays dans 118 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Singapour
- **Heures de travail** (écarte le pays dans 46 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 34 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Japon
- **Heures de travail** (écarte le pays dans 73 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Côte d’Ivoire
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 37 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 16 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 5 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Canada
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 10 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 10 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 6 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Sénégal
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 20 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 11 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Hong Kong
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 14 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Français sur place** (écarte le pays dans 13 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Heures de travail** (écarte le pays dans 12 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 2 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (conseil et audit)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Nouvelle‑Zélande
- **Heures de travail** (écarte le pays dans 12 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
- **Ton secteur (marketing et commerce)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (finance et banque)** (écarte le pays dans 3 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (ingénierie et industrie)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (tech et data)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Uruguay
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 6 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (hôtellerie et tourisme)** (écarte le pays dans 4 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Indemnité VIE** (écarte le pays dans 1 parcours) : Indemnité VIE mensuelle (ville la plus probable pour un VIE). Source probable : voir /methode.
- **Ton secteur (finance et banque)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Émirats arabes unis
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 7 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.

### Vietnam
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 3 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Sécurité** (écarte le pays dans 2 parcours) : Homicides volontaires pour 100 000 habitants, année 2019 ou plus récente. Source probable : ONUDC (dataUNODC), reprise par la Banque mondiale (VC.IHR.PSRC.P5).
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Ton secteur (santé)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Pérou
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 4 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Ton secteur (enseignement et recherche)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).

### Taïwan
- **Chômage des jeunes** (écarte le pays dans 2 parcours) : Taux de chômage des 15-24 ans. Source probable : OIT, estimations modélisées (Banque mondiale SL.UEM.1524.ZS).
- **Français sur place** (écarte le pays dans 1 parcours) : Français inscrits au registre consulaire. Source probable : Rapport du Gouvernement sur les Français établis hors de France ; population : Banque mondiale.
- **Salaire brut moyen (pouvoir d’achat)** (écarte le pays dans 1 parcours) : Salaire annuel moyen d'un salarié à temps plein, en dollars à parité de pouvoir d'achat, même série que les autres pays. Source probable : OCDE « Average annual wages » pour ses membres ; hors OCDE, OIT ILOSTAT (gains mensuels moyens) ou l'institut national (ANSD au Sénégal, INS en Côte d'Ivoire), à signaler comme source différente.
- **Heures de travail** (écarte le pays dans 1 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).

### Chine
- **Ton secteur (marketing et commerce)** (écarte le pays dans 1 parcours) : Part de l'emploi du pays dans ce secteur (CITI rév. 4), 2019 ou plus récente. Source probable : OIT, ILOSTAT (EMP_TEMP_SEX_ECO_NB_A).
- **Heures de travail** (écarte le pays dans 1 parcours) : Heures réellement travaillées par semaine (moyenne, tous salariés). Source probable : OIT, ILOSTAT (HOW_TEMP_SEX_NB_A) ; sinon l'institut national de statistique (ABS en Australie, e-Stat au Japon, MOM à Singapour, C&SD à Hong Kong, Stats NZ, NBS en Chine, HCP au Maroc).
