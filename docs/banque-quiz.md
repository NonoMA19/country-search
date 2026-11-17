# La banque du quiz (prompt 3f)

Générée par `npm run banque` depuis `content/quiz.json`. Les montants et durées des scènes sont des exemples fictifs.

## Chapitre 1 : Ton point de départ (posé à tout le monde)

_Ton projet, ton secteur, tes langues : de quoi poser le décor._

### carte · CarteMonde · thème « Ton intuition »

**Avant de commencer : où pensais-tu partir ?** Coche une ou plusieurs régions. Ta réponse ne change pas ton classement : on la garde pour la fin.

- Dimensions : aucune
- Europe
- Amérique du Nord (Canada, États-Unis)
- Amérique latine
- Asie de l’Est (Japon, Corée du Sud, Taïwan, Hong Kong, Chine)
- Asie du Sud-Est (Singapour)
- Océanie
- Moyen-Orient et Afrique du Nord (Émirats arabes unis, Maroc)
- « Aucune idée pour l’instant » ; aucun effet sur le score

### objectif · ChoixCartes · thème « Ton projet »

**Quel est ton projet ?**

- Dimensions : aucune
- Remplit le profil : objectif
- Un stage ou un VIE (Volontariat international en entreprise, ou stage.)
- Un premier poste (Un vrai contrat pour lancer ta vie pro.)
- Une année d’aventure (PVT) (Travailler et voyager, un an au plus.)
- Une carrière longue (T’installer pour plusieurs années.)
- Je ne sais pas encore (Aucun poids de départ.)

### secteur · ChoixCartes · thème « Ton projet »

**Ton secteur ?** Celui où tu veux travailler, ou celui de tes études.

- Dimensions : secteur
- Remplit le profil : secteur
- Finance et banque
- Conseil et audit
- Ingénierie et industrie
- Tech et data
- Marketing et commerce
- Santé
- Hôtellerie et tourisme
- Enseignement et recherche
- Autre ou je ne sais pas

### age · ChoixCartes · thème « Ton profil »

**Quel âge as-tu ?**

- Dimensions : aucune
- Remplit le profil : age
- 18 à 25 ans
- 26 ou 27 ans
- 28 à 30 ans
- 31 à 35 ans
- 36 ans ou plus

### budget · ChoixCartes · thème « Ton profil »

**Tu pars avec combien d’argent de côté ?**

- Dimensions : aucune
- Remplit le profil : budget
- Moins de 2 000 €
- De 2 000 à 5 000 €
- De 5 000 à 10 000 €
- Plus de 10 000 €
- Je ne sais pas encore

### duree · ChoixCartes · thème « Ton profil »

**Tu pars pour combien de temps ?**

- Dimensions : aucune
- Remplit le profil : duree
- Moins de 6 mois
- 6 à 12 mois
- 1 à 2 ans
- Plus de 2 ans

### anglais-reunion · Thermomètre · thème « Ton anglais »

**Mener une réunion de travail entièrement en anglais** À quel point tu te sens à l’aise ?

- Dimensions : langue
- Niveaux : Pas à l’aise · Peu à l’aise · Plutôt à l’aise · À l’aise · Très à l’aise

### anglais-vie · Thermomètre · thème « Ton anglais »

**Gérer ta vie de tous les jours en anglais** Le médecin, la banque, ton bail… À quel point tu te sens à l’aise ?

- Dimensions : langue
- Niveaux : Pas à l’aise · Peu à l’aise · Plutôt à l’aise · À l’aise · Très à l’aise

### langues · ChoixCartes · thème « Tes langues »

**Tu parles d’autres langues ?**

- Dimensions : langue
- Remplit le profil : langues
- Espagnol
- Allemand
- Italien
- Portugais
- Néerlandais
- Suédois, danois ou norvégien
- Japonais
- Coréen
- Chinois
- Arabe

### pret-anglais · ChoixCartes · thème « Tes langues »

**Travailler en anglais, ça te va ?**

- Dimensions : langue
- Condition : Seulement si ton anglais est débutant et que tu ne parles aucune autre langue.
- Remplit le profil : pret-anglais
- Oui
- Non

### nationalite · ChoixCartes · thème « Ton profil »

**As-tu une autre nationalité ?**

- Dimensions : aucune
- Remplit le profil : nationalite
- Non
- Oui

### nationalite-laquelle · ChoixCartes · thème « Ton profil »

**Laquelle ?**

- Dimensions : aucune
- Condition : Seulement si tu as répondu oui à la question précédente.
- Remplit le profil : nationalite-laquelle
- Irlandaise
- Canadienne
- Américaine
- Une autre

## Chapitre 2 : Tes envies (posé à tout le monde)

_Cinq envies, puis leur ordre : c’est le cœur de ton classement._

### envies · ChoixCartes · thème « Tes envies »

**Choisis 5 envies** Les cinq qui comptent le plus pour ton départ, parmi dix.

- Dimensions : aucune
- Bon salaire : Salaire brut moyen (pouvoir d’achat)
- Travail facile à trouver : Chômage des jeunes
- Vie pas chère : Coût de la vie
- Climat doux : Climat doux
- Sécurité : Sécurité
- Proche de la France : Distance et Décalage horaire
- Français sur place : Français sur place
- Équilibre vie pro et vie perso : Heures de travail
- Évoluer dans mon secteur : ton secteur
- Vivre un vrai dépaysement : Dépaysement
- Exactement 5 choix

### classement · Classement · thème « Tes envies »

**Range-les de la plus importante à la moins importante** Glisse-les, ou utilise les flèches.

- Dimensions : aucune
- Poids par rang : 1 = 2 ; 2 = 1,75 ; 3 = 1,5 ; 4 = 1,25 ; 5 = 1,1

## Chapitre 3 : Ton travail (adaptatif, 4 à 7 écrans)

_Quelques scènes de la vie au bureau. Il n’y a pas de bonne réponse._

### equilibre · Curseur · thème « Ton poste »

**Ton équilibre idéal : plus de temps libre ou plus de salaire ?**

- Dimensions : equilibre, salaire
- Gauche « Plus de temps libre » → Heures de travail (importance 1) ; droite « Plus de salaire » → Salaire brut moyen (pouvoir d’achat) (importance 1) (part continue de 0 à 1)
- Libellés : jusqu’à 35 « Plutôt du temps libre » ; jusqu’à 64 « Un équilibre » ; jusqu’à 100 « Plutôt le salaire »

### promotion · Dilemme · thème « Ton poste »

**Salaire ou temps libre**

- Dimensions : equilibre, salaire
- Déjà couvert par : equilibre (posé seulement si la certitude reste faible)
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Salaire brut moyen (pouvoir d’achat) (importance 1) ; B → Heures de travail (importance 1)
- Scène « La promotion » : On te propose une promotion, avec des journées plus longues.
  - A. Tu acceptes : 20 % de plus, fin à 20 h · + Ta paie et ton CV font un bond. · − Tes soirées en semaine disparaissent.
  - B. Tu refuses et tu finis à 17 h 30 · + Du temps pour le sport, les amis, la ville. · − Ta paie ne bouge pas cette année.
  - Variante un stage ou un VIE : Pendant ta mission de VIE, on te propose plus de responsabilités, avec des journées plus longues.
  - Variante une année d’aventure : Ton job de PVT te propose plus d’heures, mieux payées.
  - Variante une carrière longue : Après deux ans, on te propose une promotion, avec des journées plus longues.
- Scène « Deux rythmes » : Ton entreprise propose deux formules.
  - A. Semaine de 45 h, avec une prime chaque trimestre · + Tu mets vite de l’argent de côté. · − Peu de temps pour profiter du pays.
  - B. Semaine de 35 h, vendredi après-midi libre · + Un long week-end chaque semaine pour explorer. · − Pas de prime, et une paie plus basse.
  - Variante un stage ou un VIE : L’entreprise de ta mission de VIE propose deux formules.
  - Variante une année d’aventure : Pour ton job de PVT, deux employeurs proposent deux rythmes.
- Scène « Le projet urgent » : Un gros client demande un rendu dans deux semaines.
  - A. Tu fais les heures en plus, bien payées · + Une belle somme à la fin du mois. · − Deux semaines sans vraie soirée.
  - B. Tu gardes tes horaires, une collègue s’en charge · + Ton rythme reste tranquille. · − Tu passes à côté de l’argent et de la visibilité.
  - Variante un stage ou un VIE : Pendant ta mission de VIE, un gros client demande un rendu dans deux semaines.

### deux-offres · Dilemme · thème « Ton poste »

**Salaire ou coût de la vie**

- Dimensions : cout, salaire
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Salaire brut moyen (pouvoir d’achat) (importance 1) ; B → Coût de la vie (importance 1)
- Scène « Deux offres » : Pour le même poste, on te propose deux contrats.
  - A. 3 400 € par mois, 1 500 € de loyer · + Plus d’argent à mettre de côté, si tu tiens ton budget. · − Tout coûte cher autour de toi : sorties, transports, courses.
  - B. 2 300 € par mois, 650 € de loyer · + La vie est simple et pas chère, même avec un petit salaire. · − Tu mets moins de côté, et un billet pour la France pèse plus lourd.
  - Variante un stage ou un VIE : Pour la même mission de VIE, deux villes te sont proposées.
  - Variante une année d’aventure : Pour ton job de PVT, deux villes te tentent.
  - Variante une carrière longue : Pour le même poste, deux villes te proposent un contrat de longue durée.
- Scène « Le colocataire » : Ton colocataire gagne 1 000 € de plus que toi, mais son loyer est le double du tien.
  - A. Tu préfères sa situation · + Un salaire plus haut, qui compte pour la suite. · − Une grosse part de sa paie part dans le loyer.
  - B. Tu préfères la tienne · + Ton loyer léger te laisse respirer. · − Ton salaire progresse moins vite.
- Scène « La sortie du vendredi » : Ce soir, ton équipe dîne au restaurant.
  - A. Le repas coûte 45 €, et les salaires sont hauts · + Tu suis sans problème, et ta paie grimpe vite. · − Chaque sortie pèse dans ton budget.
  - B. Le repas coûte 12 €, et les salaires sont modestes · + Tu sors autant que tu veux, sans compter. · − Ton salaire vaut peu une fois converti en euros.
  - Variante un stage ou un VIE : Ce soir, l’équipe de ta mission de VIE dîne au restaurant.
  - Variante une année d’aventure : Ce soir, tes collègues de PVT dînent au restaurant.

### sortie-ecole · Dilemme · thème « Ton poste »

**Trouver vite ou gagner plus**

- Dimensions : emploi, salaire
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Chômage des jeunes (importance 1) ; B → Salaire brut moyen (pouvoir d’achat) (importance 1)
- Scène « La sortie d’école » : Tu viens de finir tes études et tu cherches ton premier poste.
  - A. Tu signes en trois semaines, salaire correct · + Tu démarres vite et tu prends de l’expérience. · − Le salaire reste modeste au début.
  - B. Six mois de recherche, salaire bien plus haut · + Ton premier salaire est nettement meilleur. · − Six mois à vivre sur tes économies.
  - Variante un stage ou un VIE : Tu cherches ta mission de VIE.
  - Variante une année d’aventure : Tu arrives pour ton PVT et tu cherches un job.
  - Variante une carrière longue : Tu cherches le poste qui lancera ta carrière là-bas.
- Scène « Deux marchés du travail » : Deux pays te tentent pour ton premier poste.
  - A. Ici, les jeunes trouvent un emploi en quelques semaines · + Tu as vite le choix entre plusieurs offres. · − Les salaires y sont moyens.
  - B. Là-bas, les salaires sont hauts, mais un jeune sur cinq cherche un emploi · + Un poste décroché paie très bien. · − La recherche peut durer, sans garantie.
  - Variante un stage ou un VIE : Deux pays te tentent pour ta mission de VIE, puis pour un premier poste.
  - Variante une année d’aventure : Deux pays te tentent pour ton PVT.
  - Variante une carrière longue : Deux pays te tentent pour t’installer.
- Scène « La fin du stage » : Ton stage se termine.
  - A. L’entreprise t’embauche tout de suite, au salaire de départ · + Pas de recherche, et une équipe que tu connais. · − Peu de marge pour négocier ton salaire.
  - B. Tu refuses pour viser un poste mieux payé ailleurs · + Tu peux décrocher bien mieux. · − Tu repars de zéro, sans garantie.
  - Variante un stage ou un VIE : Ta mission de VIE se termine.
  - Variante une année d’aventure : Ton premier job de PVT se termine.
  - Variante un premier poste : Ta période d’essai se termine.
  - Variante une carrière longue : Ton premier contrat sur place se termine.

### langue-bureau · Dilemme · thème « Ton poste »

**Anglais ou langue du pays au bureau**

- Dimensions : langue
- 2 options ; A → Travailler en anglais (importance 1) ; B → aucun effet
- Scène « Ta première réunion » : Ta première réunion d’équipe commence.
  - A. Tout le monde parle anglais · + Tu es à l’aise dès le premier jour. · − Tu progresses peu dans la langue du pays.
  - B. Tout se passe dans la langue du pays · + Tu apprends vite et tu t’intègres. · − Les premiers mois, tu comprends la moitié.
  - Variante un stage ou un VIE : La première réunion de ta mission de VIE commence.
  - Variante une année d’aventure : Premier jour de ton job de PVT : l’équipe se présente.
- Scène « Les offres d’emploi » : Tu lis les offres d’emploi.
  - A. La plupart sont en anglais : tu peux postuler partout · + Beaucoup d’offres à ta portée. · − Face à toi, des candidats du monde entier.
  - B. La plupart demandent la langue du pays · + Si tu l’apprends, elle te démarque. · − Moins d’offres au début.
  - Variante un stage ou un VIE : Tu lis les offres de VIE.
  - Variante une année d’aventure : Tu lis les offres de jobs pour ton PVT.
- Scène « La pause café » : C’est la pause café.
  - A. On parle anglais, avec des collègues du monde entier · + Une ambiance internationale. · − Tu restes un peu à part de la vie locale.
  - B. On parle la langue du pays, tu suis comme tu peux · + Tu entres dans la culture du pays. · − Les blagues t’échappent pendant des mois.

### job-de-reve · Dilemme · thème « Ton poste »

**Visa lié à l’employeur, ou pas**

- Dimensions : visa
- 2 options ; A → aucun effet ; B → Changer d’employeur (importance 1)
- Scène « Le job de rêve » : On t’offre le poste de tes rêves. Seul détail : ton visa dépend de cette entreprise. Si ça tourne mal, tu as 60 jours pour retrouver un poste ou partir.
  - A. Tu prends le risque · + Le poste de tes rêves. · − Tu dépends de ton employeur.
  - B. Tu préfères pouvoir changer d’employeur librement · + Tu peux partir quand tu veux. · − Tu vises peut-être moins haut.
  - Variante un stage ou un VIE : Après ton VIE, on t’offre le poste de tes rêves sur place. Seul détail : ton visa dépend de cette entreprise. Si ça tourne mal, tu as 60 jours pour retrouver un poste ou partir.
  - Variante une carrière longue : On t’offre le poste qui lancerait ta carrière. Seul détail : ton visa dépend de cette entreprise. Si ça tourne mal, tu as 60 jours pour retrouver un poste ou partir.
- Scène « Le manager difficile » : Six mois après ton arrivée, ton manager devient insupportable.
  - A. Ton visa est lié à l’entreprise : tu tiens bon, ou tu quittes le pays · + Des pays avec de beaux postes restent possibles. · − Changer de poste devient compliqué.
  - B. Tu veux pouvoir démissionner et chercher ailleurs, sur place · + Tu restes libre. · − Moins de pays possibles.
  - Variante une carrière longue : Deux ans après ton arrivée, ton manager devient insupportable.
- Scène « L’offre concurrente » : Une autre entreprise te propose mieux.
  - A. Il faudrait refaire ton dossier de visa : tu acceptes cette règle · + Plus de pays possibles. · − Saisir une meilleure offre prend du temps.
  - B. Tu veux pouvoir dire oui tout de suite · + Tu saisis les occasions. · − Moins de pays possibles.

### premier-dossier · Dilemme · thème « Culture au travail »

**Franc ou diplomate**

- Dimensions : communication
- 2 options ; A → Communication (position 1) ; B → Communication (position 5)
- Scène « Ton premier dossier rendu » : Tu rends ton premier dossier. Ta manager te répond.
  - A. « Trois erreurs page 2, corrige avant midi. » · + Tu sais tout de suite quoi corriger. · − Le ton est sec, il faut encaisser.
  - B. « Très bon travail ! Peut-être revoir un ou deux points. » · + L’ambiance reste douce et encourageante. · − Il faut lire entre les lignes pour savoir ce qui ne va pas.
  - Variante un stage ou un VIE : Tu rends ton premier dossier de VIE. Ta manager te répond.
  - Variante une année d’aventure : Premier jour de ton job de PVT : ta responsable regarde ton travail.
- Scène « Le désaccord » : Tu n’es pas d’accord avec un collègue.
  - A. Tu le lui dis franchement, en réunion · + Tout est clair, le débat avance vite. · − Ça peut froisser devant tout le monde.
  - B. Tu le lui fais comprendre en privé, avec tact · + Personne ne perd la face. · − Le message passe plus lentement, parfois pas du tout.
- Scène « L’entretien annuel » : C’est ton premier entretien annuel.
  - A. Ta manager liste tes trois points faibles, sans détour · + Tu sais exactement sur quoi progresser. · − Ça pique, même quand c’est juste.
  - B. Ta manager commence par tes réussites, puis glisse une piste · + Tu en sors avec le moral. · − Les vrais reproches restent flous.
  - Variante un stage ou un VIE : C’est le bilan de mi-mission de ton VIE.
  - Variante une année d’aventure : Ton job de PVT se termine : ta responsable fait le point avec toi.

### reunion-directeur · Dilemme · thème « Culture au travail »

**Hiérarchie plate ou marquée**

- Dimensions : hierarchie
- 2 options ; A → Hiérarchie (position 1) ; B → Hiérarchie (position 5)
- Scène « La réunion avec le directeur » : Le directeur propose une idée que tu trouves fragile.
  - A. Ici, tout le monde peut le contredire, même les stagiaires · + Ta voix compte dès le premier jour. · − Il faut oser parler et défendre ton avis.
  - B. Personne ne le contredit en réunion : on lui en parle après, en privé · + Les rôles sont clairs, chacun sait qui décide. · − Tes idées passent par les bons canaux, et ça prend du temps.
  - Variante un stage ou un VIE : Le directeur de la filiale où tu fais ton VIE propose une idée que tu trouves fragile.
  - Variante une année d’aventure : Le patron de ton job de PVT propose une idée que tu trouves fragile.
- Scène « L’ascenseur » : Premier jour : tu croises la directrice générale dans l’ascenseur.
  - A. Tu l’appelles par son prénom, comme tout le monde · + L’ambiance est simple, tu peux lui parler facilement. · − Les règles du jeu sont moins visibles.
  - B. Tu la salues avec son titre, comme tout le monde · + Le respect des rôles est clair : pas de faux pas. · − Tu restes loin des personnes qui décident.
  - Variante un stage ou un VIE : Premier jour de ton VIE : tu croises la directrice générale dans l’ascenseur.
  - Variante une année d’aventure : Premier jour de ton job de PVT : tu croises la patronne à l’entrée.
- Scène « Le mail au client » : Un client important attend une réponse.
  - A. Tu lui écris directement, sans demander · + Tu gagnes du temps et de l’autonomie. · − Si ça se passe mal, c’est pour toi.
  - B. Tu passes par ton chef, qui relit et envoie · + Ta hiérarchie te couvre. · − Chaque réponse prend un jour de plus.

### reunion-9h · Dilemme · thème « Culture au travail »

**Ponctualité stricte ou souple**

- Dimensions : ponctualite
- 2 options ; A → Ponctualité (position 5) ; B → Ponctualité (position 1)
- Scène « Réunion à 9 h » : Ton équipe a une réunion à 9 h.
  - A. À 9 h pile, la porte est fermée · + Tout commence et finit à l’heure : tes journées sont prévisibles. · − Une minute de retard se remarque.
  - B. On démarre vers 9 h 15, après le café · + L’ambiance est détendue, personne ne court. · − Il faut accepter d’attendre, et les journées débordent.
  - Variante un stage ou un VIE : L’équipe de ta mission de VIE a une réunion à 9 h.
  - Variante une année d’aventure : Ton équipe de PVT commence son service à 9 h.
- Scène « Le dîner chez ta collègue » : Ta collègue t’invite à 20 h.
  - A. Tu arrives à 20 h pile, comme tout le monde · + Pas de surprise : l’heure dite est l’heure. · − Arriver en retard serait mal vu.
  - B. Tu arrives vers 20 h 30 : arriver à l’heure serait presque impoli · + Personne ne stresse pour l’heure. · − Difficile de savoir quand les choses commencent vraiment.
- Scène « Le rendez-vous client » : Tu as rendez-vous chez un client.
  - A. Le client t’attend à 10 h, et il regarde sa montre · + Tu peux tout prévoir à la minute. · − Aucune marge : le moindre imprévu se voit.
  - B. Le client te dit « vers 10 h », et personne ne regarde l’heure · + Pas de stress si tu as un peu de retard. · − Tu peux aussi attendre une demi-heure à ton tour.
  - Variante un stage ou un VIE : Pendant ton VIE, tu as rendez-vous chez un client.

### idee-reunion · Dilemme · thème « Culture au travail »

**Décider vite ou ensemble**

- Dimensions : decision
- 2 options ; A → Prise de décision (position 1) ; B → Prise de décision (position 5)
- Scène « Ton idée en réunion » : Tu proposes une amélioration.
  - A. Ton chef répond : « OK, on teste lundi. » · + C’est décidé en cinq minutes. · − Si ça rate, c’est pour toi.
  - B. « Bonne idée, on en reparle avec toute l’équipe. » · + Ensuite, toute l’équipe porte le projet avec toi. · − Trois semaines de discussions avant de commencer.
  - Variante un stage ou un VIE : Pendant ta mission de VIE, tu proposes une amélioration.
  - Variante une année d’aventure : Dans ton job de PVT, tu proposes une amélioration.
- Scène « Le nouvel outil » : L’équipe doit choisir un nouveau logiciel.
  - A. La responsable choisit seule, en un jour · + Tu l’utilises dès la semaine prochaine. · − Personne ne t’a demandé ton avis.
  - B. Tout le monde teste et vote, pendant un mois · + Chacun a eu son mot à dire. · − Un mois de réunions pour un logiciel.
  - Variante un stage ou un VIE : L’équipe de ta mission de VIE doit choisir un nouveau logiciel.
- Scène « Le séminaire » : Il faut choisir le lieu du séminaire d’équipe.
  - A. Ton chef tranche : ce sera à la montagne · + C’est réglé tout de suite. · − Tant pis si tu préférais la mer.
  - B. On cherche un lieu qui convient à tout le monde · + Personne ne se sent mis de côté. · − Les échanges durent des semaines.

### vendredi-18h · Dilemme · thème « Culture au travail »

**Collègues ou vie à part**

- Dimensions : pro-perso
- 2 options ; A → Vie pro et vie perso (position 1) ; B → Vie pro et vie perso (position 5)
- Scène « Vendredi 18 h » : La semaine de travail est finie.
  - A. Chacun rentre chez soi · + Tes soirées sont à toi. · − Il faudra te faire des amis ailleurs qu’au bureau.
  - B. L’afterwork est presque obligatoire · + C’est là que se créent les liens et les promotions. · − Tes soirées appartiennent un peu au bureau.
  - Variante un stage ou un VIE : La semaine de ta mission de VIE est finie.
  - Variante une année d’aventure : La semaine de ton job de PVT est finie.
- Scène « L’anniversaire » : C’est l’anniversaire d’une collègue.
  - A. Un gâteau à la pause, puis chacun retourne travailler · + Simple, rapide, sans obligation. · − Tu connais peu la vie de tes collègues.
  - B. Toute l’équipe est invitée chez elle samedi · + Tes collègues deviennent vite des amis. · − Ton week-end se mêle au travail.
- Scène « Le tournoi du samedi » : Ton équipe organise un tournoi de foot le samedi.
  - A. Presque personne n’y va : le week-end, c’est sacré · + Ton samedi reste libre. · − Moins d’occasions de créer des liens.
  - B. Tout le monde y va, même la direction · + Tu crées des liens qui comptent au travail. · − Ne pas venir se remarque.
  - Variante une année d’aventure : Tes collègues de PVT organisent un tournoi de foot le samedi.

### secteur-ville · ChoixCartes · thème « Ton projet »

**Pour ta carrière, tu vises plutôt une grande ville où ton secteur est concentré, ou tu peux travailler n’importe où ?**

- Dimensions : secteur, ville
- Condition : secteur-choisi
- Une grande ville où mon secteur est concentré · + Plus d’offres et de contacts dans ton domaine. · − La vie y coûte souvent plus cher. → Grandes villes (importance 0,5) ; secteur (importance 0,5)
- Je peux travailler n’importe où · + Tu choisis ta ville pour la vie qu’elle offre. · − Moins d’offres dans ton domaine, parfois. → aucun effet

### mission-vie · ChoixCartes · thème « Ton projet »

**Ta mission idéale : une grande ville internationale où la vie coûte cher, ou une ville plus calme où ton indemnité va plus loin ?**

- Dimensions : cout, ville
- Condition : projet:stage-vie
- Une grande ville internationale · + Un réseau, des sorties, une vie animée. · − Le loyer mange une bonne part de ton indemnité. → Grandes villes (importance 1)
- Une ville plus calme · + Ton indemnité va plus loin. · − Moins de sorties et de contacts. → Coût de la vie (importance 1)

### pvt-boulots · ChoixCartes · thème « Ton projet »

**Pendant ton PVT, tu veux surtout enchaîner les petits boulots pour voyager, ou trouver un poste dans ton domaine ?**

- Dimensions : emploi, secteur
- Condition : projet:aventure
- Enchaîner les petits boulots · + Plus de liberté pour voyager. · − Moins d’expérience dans ton domaine. → Chômage des jeunes (importance 1)
- Un poste dans mon domaine · + Une vraie ligne sur ton CV. · − Plus long à trouver. → secteur (importance 1)

### dans-5-ans · ChoixCartes · thème « Ton projet »

**Dans 5 ans, tu te vois plutôt installé là-bas pour de bon, ou rentré en France avec une belle expérience ?**

- Dimensions : distance, langue, sante, valeurs
- Condition : projet:carriere
- Installé là-bas pour de bon · + Tu construis ta vie sur place. · − Il faudra s’adapter à fond, langue comprise. → Stabilité politique (importance 1) ; Santé à l’arrivée (importance 1)
- Rentré en France avec une belle expérience · + Ton expérience comptera à ton retour. · − Tu restes un peu entre deux pays. → Distance (importance 0,5)

## Chapitre 4 : Ta vie (adaptatif, 4 à 7 écrans)

_Ton décor, ton quotidien, ce qui fait qu’on se sent bien quelque part._

### ambiances · Ambiances · thème « Ton décor »

**Dans quel décor imagines-tu ton quotidien ?** Choisis-en deux au plus.

- Dimensions : climat, ville
- Toujours posé dans son chapitre
- Une grande métropole (Du monde, des sorties, tout à pied ou en métro.) → Grandes villes (importance 1)
- Une ville à taille humaine (Assez grande pour bouger, assez calme pour souffler.) → Villes moyennes (importance 1)
- La nature à portée de main (Forêts, lacs ou montagnes, pas loin de chez toi.) → Nature (importance 1)
- Du soleil toute l’année (Des hivers doux et des étés chauds.) → Climat doux (importance 1) ; Été (position 4)
- 2 choix au plus

### phrases · Swipe · thème « Ton quotidien »

**Ça te correspond ?** Glisse la carte à droite si la phrase te correspond, à gauche sinon. Ou utilise les boutons.

- Dimensions : climat, communication, cout, decision, depaysement, distance, langue, pro-perso, reseau, salaire, sante, securite, valeurs, ville
- Toujours posé dans son chapitre
- S1 « Je pourrais vivre dans un pays dont je ne parle pas la langue. » · Ça me correspond → aucun effet · Pas vraiment → Langue du quotidien (importance 1)
- S2 « Je pourrais m’éloigner de ma famille plusieurs années. » · Ça me correspond → Dépaysement (importance 0,5) · Pas vraiment → Distance et Décalage horaire (importance 0,5)
- S3 « Un pays cher ne me dérange pas si les salaires suivent. » · Ça me correspond → Salaire brut moyen (pouvoir d’achat) (importance 1) · Pas vraiment → Coût de la vie (importance 1)
- S4 « Je préfère une petite ville à une grande métropole. » · Ça me correspond → Villes moyennes (importance 1) · Pas vraiment → Grandes villes (importance 1)
- S5 « Un hiver de cinq mois ne me fait pas peur s’il y a du travail. » · Ça me correspond → aucun effet · Pas vraiment → Hiver (position 4)
- S6 « Je veux pouvoir rentrer en France le temps d’un week-end. » · Ça me correspond → Distance (importance 1) · Pas vraiment → aucun effet
- S7 « Je préfère un pays stable, même s’il s’y passe moins de choses. » · Ça me correspond → Stabilité politique (importance 1) · Pas vraiment → aucun effet
- S8 « Payer une assurance santé privée chaque mois, ça me va. » · Ça me correspond → aucun effet · Pas vraiment → Santé à l’arrivée (importance 1)
- S9 « Je veux pouvoir faire du sport dehors presque toute l’année. » · Ça me correspond → Climat doux (importance 1) · Pas vraiment → aucun effet
- S10 « Manger sain doit être facile au quotidien. » · Ça me correspond → Manger sainement (importance 1) · Pas vraiment → aucun effet
- S11 « Je me sens bien dans une ville où il faut rester vigilant. » · Ça me correspond → aucun effet · Pas vraiment → Sécurité (importance 1)
- S12 « J’aime l’idée de me faire des amis surtout par le travail. » · Ça me correspond → Vie pro et vie perso (position 5) · Pas vraiment → Vie pro et vie perso (position 2)
- S13 « Un chef qui décide seul et vite me convient. » · Ça me correspond → Prise de décision (position 1) · Pas vraiment → Prise de décision (position 4)
- S14 « Je préfère qu’on me dise les choses franchement, même si ça pique. » · Ça me correspond → Communication (position 1) · Pas vraiment → Communication (position 4)
- S15 « Retrouver d’autres Français sur place me rassurerait. » · Ça me correspond → Français sur place (importance 1) · Pas vraiment → aucun effet
- S16 « J’ai envie d’une vie très différente de celle que je connais en France. » · Ça me correspond → Dépaysement (importance 1) · Pas vraiment → Distance et Décalage horaire (importance 0,5)
- 5 phrases tirées parmi 16 ; « Ça dépend » ne compte pas

### janvier · Dilemme · thème « Ton décor »

**Vrai hiver ou hiver doux**

- Dimensions : climat
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Hiver (position 2) ; B → Hiver (position 4)
- Scène « Janvier » : C’est l’hiver dans ta nouvelle ville.
  - A. −10 °C et de la neige · + Des pistes de ski à une heure, des paysages blancs. · − Des mois de froid et de longues nuits.
  - B. 12 °C, gris et pluie · + Pas besoin de doudoune. · − Pas de neige, et un ciel souvent gris.
- Scène « Ta valise d’hiver » : Tu fais ta valise pour l’hiver.
  - A. Doudoune, bonnet, bottes de neige · + Patins, luge, soirées au chaud : l’hiver a ses plaisirs. · − Il fait nuit à 16 h.
  - B. Un imperméable suffit · + Tu sors toute l’année sans trop te couvrir. · − L’hiver ressemble à un long automne.
- Scène « Un week-end de février » : Tu as un week-end libre en février.
  - A. Ski de fond sur un lac gelé · + Des activités qu’on ne trouve qu’avec un vrai hiver. · − Il faut supporter le froid.
  - B. Terrasse au soleil, à 14 °C · + Tu profites de la ville dehors. · − Pas de neige près de chez toi.

### aout · Dilemme · thème « Ton décor »

**Été chaud ou tempéré**

- Dimensions : climat
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Été (position 4) ; B → Été (position 2)
- Scène « Août » : C’est l’été dans ta nouvelle ville.
  - A. 35 °C · + La plage le soir. · − Dormir sans clim devient difficile.
  - B. 22 °C · + Tu peux marcher et courir toute la journée. · − Un pull le soir, et une mer froide.
- Scène « Le bureau en juillet » : C’est l’été, au bureau.
  - A. La clim tourne, et dehors c’est un four · + Des soirées tièdes en terrasse jusqu’à minuit. · − Chaque trajet en plein jour est pénible.
  - B. Fenêtres ouvertes, il fait 21 °C · + Tu travailles au frais, sans clim. · − L’été passe vite, et il pleut parfois.
- Scène « Tes vacances sur place » : Tu restes dans le pays pour tes vacances d’été.
  - A. Soleil et chaleur garantis · + La mer est chaude et les journées longues. · − Difficile de bouger entre midi et 16 h.
  - B. Douceur et ciel changeant · + Randonnée, vélo : tout est agréable. · − La baignade est fraîche, et le soleil n’est pas garanti.

### saisons · Dilemme · thème « Ton décor »

**Douceur ou saisons marquées**

- Dimensions : climat
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Climat doux (importance 1) ; B → aucun effet
- Scène « Ton année météo » : Tu imagines ton année sur place.
  - A. Ni trop chaud, ni trop froid, presque toute l’année · + Tu vis dehors en toute saison. · − Les saisons se ressemblent.
  - B. Un vrai hiver et un vrai été · + Chaque saison a ses plaisirs. · − Il faut supporter le froid ou la chaleur.
- Scène « Ta garde-robe » : Tu fais ta valise pour l’année.
  - A. Un jean, un pull léger, une veste · + Une seule valise suffit pour l’année. · − Pas de changement de décor.
  - B. Doudoune et maillot de bain · + Tu vis des saisons très différentes. · − Deux garde-robes, et des mois difficiles.
- Scène « Le sport dehors » : Tu fais du sport dehors.
  - A. Tu cours toute l’année sans souci de météo · + Aucun mois perdu. · − Ni ski l’hiver, ni grosse chaleur pour la plage.
  - B. Ski l’hiver, mer l’été · + Des activités qui changent avec les saisons. · − Certains mois, il fait trop froid ou trop chaud pour sortir.

### appartement · Dilemme · thème « Ton décor »

**Grande ville ou nature**

- Dimensions : ville
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Grandes villes (importance 1) ; B → Villes moyennes et Nature (importance 1)
- Scène « Ton appartement » : Pour le même loyer, on te propose deux appartements.
  - A. 25 m² en plein centre d’une capitale · + Tout est à pied : bars, musées, concerts. · − Petit, bruyant, et la nature est loin.
  - B. 60 m² dans une ville moyenne, à 15 minutes de la nature · + De l’espace et du calme. · − Moins de sorties, et la grande ville est loin.
- Scène « Ton samedi » : C’est samedi.
  - A. Expo, marché, concert : tu as l’embarras du choix · + Il se passe toujours quelque chose. · − La foule partout, et la campagne à deux heures.
  - B. Lac, forêt ou randonnée, à vingt minutes · + Tu respires, loin du bruit. · − Le soir, la ville s’endort tôt.
- Scène « Le trajet du matin » : Tu pars au travail.
  - A. 35 minutes de métro bondé · + Tu vis au cœur de la ville et de ses offres d’emploi. · − Bruit et foule chaque jour.
  - B. 15 minutes à vélo le long d’une rivière · + Un trajet calme et agréable. · − Moins d’entreprises et d’offres d’emploi.

### air-pur · Dilemme · thème « Ton décor »

**Air pur ou grande métropole**

- Dimensions : sante
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Qualité de l’air (importance 1) ; B → aucun effet
- Scène « Ta fenêtre » : Tu ouvres ta fenêtre le matin.
  - A. Un air pur, dans une ville plus calme · + Tu respires à pleins poumons. · − Moins d’agitation et d’offres autour de toi.
  - B. Une métropole très animée, avec des jours de pollution · + Travail, sorties, rencontres : tout se passe ici. · − Certains jours, l’air pique la gorge.
- Scène « Ton footing » : Tu cours le matin.
  - A. Le long de la mer ou d’un parc, l’air est frais · + Ton sport reste un plaisir. · − La ville est plus petite et plus calme.
  - B. Une appli te dit si l’air est assez bon pour courir · + Tu vis au cœur d’une ville géante. · − Certains jours, tu restes à l’intérieur.
- Scène « Deux entreprises » : Deux entreprises te veulent.
  - A. Une ville moyenne, réputée pour son air pur · + Une vie saine et tranquille. · − Moins de grandes entreprises autour.
  - B. Une mégapole, avec des pics de pollution en hiver · + Le cœur des affaires, des occasions partout. · − Tu surveilles la qualité de l’air.

### nuit · Dilemme · thème « Ton quotidien »

**Sécurité avant tout, ou pas**

- Dimensions : securite
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Sécurité (importance 1) ; B → aucun effet
- Scène « 1 h du matin » : Tu rentres à pied d’une soirée, sans personne avec toi.
  - A. Tu veux pouvoir le faire sans y penser · + Tu es libre, à toute heure. · − Moins de pays possibles.
  - B. Tu prendras un taxi : ce n’est pas ce qui décidera · + Des pays passionnants restent possibles. · − Il faudra rester sur tes gardes le soir.
- Scène « Ton téléphone » : Tu sors ton téléphone dans le métro.
  - A. Tu veux un pays où personne n’y prête attention · + Tu vis sans te méfier. · − Moins de pays possibles.
  - B. Tu le gardes dans ta poche : c’est une habitude à prendre · + Plus de pays possibles. · − Une vigilance de tous les jours.
- Scène « Le choix du quartier » : Tu cherches un logement.
  - A. Tu veux pouvoir habiter n’importe où, sans te poser de question · + Ton choix de logement est simple. · − Moins de pays possibles.
  - B. Tu te renseigneras sur les quartiers à éviter · + Des pays plus animés ou moins chers restent possibles. · − Il faut bien choisir où tu vis.

### poignet · Dilemme · thème « Ton quotidien »

**Couverture publique ou assurance privée**

- Dimensions : sante
- 2 options ; A → Santé à l’arrivée (importance 1) ; B → aucun effet
- Scène « Le poignet cassé » : Tu te casses le poignet le deuxième mois.
  - A. Tout est remboursé, mais 4 h d’attente aux urgences · + Tu ne paies rien. · − Une longue attente.
  - B. Soigné en 30 minutes, avec ton assurance privée à 120 € par mois · + Des soins rapides. · − Une dépense chaque mois, malade ou pas.
- Scène « Le jour de ton arrivée » : Tu poses tes valises dans le pays.
  - A. Tu veux être couvert par le système du pays dès le premier jour · + Aucune assurance à chercher. · − Moins de pays possibles.
  - B. Tu prends une assurance privée et tu n’y penses plus · + Tous les pays restent possibles. · − Un budget de plus, à trouver toi-même.
- Scène « La grosse grippe » : Tu as une grosse grippe en plein hiver.
  - A. Un médecin public, gratuit ou presque · + Ça ne te coûte rien. · − Il faut parfois attendre plusieurs jours.
  - B. Une clinique privée, le jour même, 90 € la visite · + Tu es soigné le jour même. · − Tu avances les frais, puis ton assurance rembourse.

### repas · Dilemme · thème « Ton quotidien »

**Cuisine maison ou repas rapides**

- Dimensions : sante
- Échelle : Plutôt A, Un peu A, Un peu B, Plutôt B ; A → Manger sainement (importance 1) ; B → aucun effet
- Scène « Tes repas » : Tu découvres comment on mange dans ton nouveau pays.
  - A. Produits frais et cuisine maison · + Tu manges bien sans y penser. · − Moins de plats rapides et pas chers.
  - B. Tout est rapide et pas cher, partout · + Tu manges vite, partout, à toute heure. · − Il faut faire attention à ce que tu manges.
- Scène « Le déjeuner au travail » : C’est l’heure du déjeuner.
  - A. Une vraie pause, avec un plat préparé et des légumes · + Tu manges équilibré sans effort. · − Le déjeuner prend une heure.
  - B. Un sandwich ou un burger devant l’écran · + Rapide et pas cher. · − Difficile de manger équilibré.
- Scène « Les courses » : Tu fais tes courses de la semaine.
  - A. Un marché de produits frais au coin de la rue · + Tu cuisines facilement. · − Il faut prendre le temps de cuisiner.
  - B. Des plats tout prêts partout, jour et nuit · + Pas de cuisine, pas de vaisselle. · − Les choix sains sont plus rares.

### noel · Dilemme · thème « Ton quotidien »

**Près ou loin de la France**

- Dimensions : depaysement, distance
- 2 options ; A → Distance et Décalage horaire (importance 1) ; B → aucun effet
- Scène « Noël approche » : Tu veux voir ta famille pour les fêtes.
  - A. 2 h de vol · + Tu rentres pour le réveillon et tu repars le 26. · − Moins de dépaysement.
  - B. 12 h de vol ou plus · + Un vrai changement de monde. · − Tu rentres une fois par an, c’est le jeu.
  - undefined. Tu fêtes Noël sur place, à la mode du pays · + Une fête que tu n’oublieras pas. · − Ta famille te manque ce soir-là.
- Scène « Le mariage de ta cousine » : Ta cousine se marie un samedi, en France.
  - A. Tu pars le vendredi soir et tu reviens le dimanche · + Tu ne rates aucun moment en famille. · − Ton nouveau pays ressemble un peu au tien.
  - B. Il te faut une semaine de congés et un billet cher · + Tu vis à l’autre bout du monde, avec tout ce qu’il offre. · − Tu rates souvent les fêtes de famille.
  - undefined. Tu suis le mariage en vidéo, depuis l’autre bout du monde · + Tu vis pleinement ta nouvelle vie. · − Tu rates un moment de famille.
- Scène « Les appels du dimanche » : Tu appelles tes proches chaque dimanche.
  - A. Même heure qu’en France : tu appelles quand tu veux · + Aucun calcul de fuseau horaire. · − Ton pays reste proche de ce que tu connais.
  - B. Ils dorment quand tu te réveilles · + Tu vis vraiment ailleurs. · − Il faut caler les appels tôt le matin ou tard le soir.
  - undefined. Vous vous écrivez surtout : tu vis à un tout autre rythme · + Tu te sens vraiment ailleurs, et ça te plaît. · − Les appels en direct se font rares.

### premier-mois · Dilemme · thème « Ton quotidien »

**Réseau français ou immersion**

- Dimensions : reseau
- 2 options ; A → Français sur place (importance 1) ; B → aucun effet
- Scène « Ton premier mois » : Tu viens d’arriver dans ta nouvelle ville.
  - A. Un groupe de Français t’accueille · + Logement, banque : on te donne les bons conseils. · − Tu risques de rester dans une bulle française.
  - B. Tu n’as aucun contact français · + Tu plonges dans la vie locale. · − Tu te fais des amis plus lentement.
  - Variante un stage ou un VIE : Tu viens d’arriver pour ta mission de VIE.
  - Variante une année d’aventure : Tu viens d’arriver pour ton année de PVT.
- Scène « La recherche de stage » : Tu cherches un stage sur place.
  - A. Le réseau des Français t’ouvre des portes · + Une recommandation vaut mieux que cent CV. · − Tu travailles souvent dans un milieu français.
  - B. Tu postules comme tout le monde · + Tu entres dans des équipes locales. · − Plus long, sans coup de pouce.
  - Variante un stage ou un VIE : Tu cherches ta mission de VIE sur place.
  - Variante une année d’aventure : Tu cherches un job pour ton PVT.
  - Variante un premier poste : Tu cherches ton premier poste sur place.
  - Variante une carrière longue : Tu cherches ton poste sur place.
  - Variante inconnu : Tu cherches tes premières pistes de travail sur place.
- Scène « Ton premier dimanche » : C’est ton premier dimanche sur place.
  - A. Brunch avec d’autres Français, dans ta langue · + Tu te sens vite chez toi. · − Tu progresses moins vite dans la langue du pays.
  - B. Tu pars découvrir la ville par toi-même · + Tout est nouveau, tu apprends vite. · − Les premiers week-ends peuvent sembler longs.

### deux-langues · Dilemme · thème « Ton quotidien »

**Vivre dans une langue inconnue**

- Dimensions : langue
- 2 options ; A → aucun effet ; B → Langue du quotidien (importance 1)
- Scène « Ta vie en deux langues » : Au bureau, tout se passe en anglais. Chez le médecin ou pour signer ton bail, c’est la langue locale, que tu ne parles pas.
  - A. Tu te débrouilles avec une appli de traduction · + Tu découvres une langue nouvelle au quotidien. · − Chaque démarche prend plus de temps.
  - B. Tu veux gérer ton quotidien sans aide · + Médecin, banque, bail : tout est simple. · − Moins de pays possibles.
- Scène « Le rendez-vous à la banque » : Tu dois ouvrir un compte en banque.
  - A. Le conseiller ne parle que la langue locale : tu sors ton téléphone · + Une petite aventure, et tu apprends des mots. · − Tu ne sais jamais si tu as tout compris.
  - B. Tout se fait dans une langue que tu comprends · + Tu signes en sachant ce que tu signes. · − Moins de pays possibles.
- Scène « La fuite d’eau » : Ton voisin frappe pour te parler d’une fuite d’eau.
  - A. Vous vous comprenez avec des gestes et quelques mots · + Ça crée des liens, et ça fait rire. · − Les vrais problèmes sont durs à régler.
  - B. Vous parlez la même langue : tout est réglé en cinq minutes · + Ta vie de tous les jours est simple. · − Moins de dépaysement.

### cours-offerts · Dilemme · thème « Ton quotidien »

**Apprendre une nouvelle langue**

- Dimensions : langue
- 2 options ; A → aucun effet ; B → Langue à apprendre (importance 1)
- Scène « Les cours offerts » : Ton entreprise te paie 3 h de cours par semaine pendant un an, dans une langue avec un autre alphabet.
  - A. Tu y vas · + Un vrai atout, au travail comme dans la vie. · − Trois soirées par semaine y passent.
  - B. Tu gardes ces soirées pour toi : l’anglais te suffit · + Ton temps libre reste à toi. · − Tu fermes quelques portes.
- Scène « Le menu » : Au restaurant, le menu n’est écrit que dans la langue du pays, avec un autre alphabet.
  - A. Tu apprends à lire les plats, un mot après l’autre · + Au bout de quelques mois, tu lis partout. · − Il faut des mois d’efforts.
  - B. Tu préfères un pays où tu lis déjà tout · + Tout est lisible dès le premier jour. · − Moins de choix de pays.
- Scène « Le défi de l’année » : Une amie te lance un défi : apprendre une nouvelle langue pendant ton année.
  - A. Tu relèves le défi · + Tu reviens avec une langue de plus sur ton CV. · − Ça demande du temps et de la patience.
  - B. Tu gardes cette énergie pour ton travail · + Toute ton énergie va à ta carrière. · − Moins de pays possibles.

## Chapitre 5 : Tes limites (posé à tout le monde)

_Ce qui ne te gêne pas, ce que tu préfères éviter, et ce qui est hors de question._

### limites · TriLimites · thème « Tes limites »

**Pour chaque situation, dis-nous ce que tu en penses**

- Dimensions : climat, distance, langue, sante, securite, visa, zone
- Vivre hors d’Europe · Je préfère éviter → En Europe (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Apprendre une langue avec un autre alphabet · Je préfère éviter → Langue à apprendre (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Un visa qui dépend de ton employeur · Je préfère éviter → Changer d’employeur (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Plus de 10 h de vol pour rentrer · Je préfère éviter → Distance (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Un hiver très froid · Je préfère éviter → Hiver (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Une ville où il faut rester vigilant · Je préfère éviter → Sécurité (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Ne travailler ni en français ni en anglais · Je préfère éviter → Travailler en français ou en anglais (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- Payer une assurance santé privée · Je préfère éviter → Santé à l’arrivée (importance 1) · Rédhibitoire → « Moins adaptés pour toi »
- 6 situations tirées parmi 8

### valeurs · ChoixCartes · thème « Tes valeurs »

**Tes valeurs, si tu veux aller plus loin** C’est facultatif. Coche ce qui compte pour toi, ou passe.

- Dimensions : sante, valeurs
- Stabilité politique → Stabilité politique (importance 1)
- Libertés d’expression et de la presse → Libertés (importance 1)
- Égalité femmes-hommes dans la loi → Égalité femmes-hommes (importance 1)
- Qualité de l’air → Qualité de l’air (importance 1)

