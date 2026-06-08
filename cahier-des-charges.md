# 🕹️ RETRO_FORGE // SPÉCIFICATIONS TECHNIQUES

Ce document regroupe le plan de conception, l'architecture et la logique de notre plateforme de jeux d'arcade rétro.

---

## 1. OBJECTIFS DU PROJET
* **But principal :** Créer un hub centralisé de jeux vidéo rétro émulés nativement en HTML5, CSS3 et JavaScript Vanille.
* **Thématique visuelle :** Ambiance borne d'arcade rétro-futuriste, interface sombre avec des touches lumineuses néon (Cyan et Rose).
* **Objectif Hack Club :** Valider entre 80 et 100 heures de code d'ici le 29 août pour débloquer le Flipper Zero et la Pinetime.

---

## 2. ARBORESCENCE DU PROJET
Pour garder un code propre et structuré sur des dizaines d'heures de dev, voici l'organisation de nos dossiers :

📁 retroforge/
│
├── 📄 index.html                  <-- Hub d'accueil responsive (Grille des 10 jeux)
├── 📄 cahier-des-charges.md       <-- Ton plan de vol avec tes idées (vitesse adaptative, stats...)
│
├── 📁 games/                      <-- Les pages de tes 10 modules de jeu
│   ├── 📄 snake.html
│   ├── 📄 tetris.html
│   ├── 📄 pong.html
│   ├── 📄 demineur.html
│   ├── 📄 pacman.html
│   ├── 📄 bricks.html
│   ├── 📄 space-invaders.html     <-- (Bonus jeu 7)
│   ├── 📄 frogger.html            <-- (Bonus jeu 8)
│   ├── 📄 flappy.html             <-- (Bonus jeu 9)
│   └── 📄 asteroides.html         <-- (Bonus jeu 10)
│
├── 📁 css/
│   ├── 📄 global.css              <-- Design du Hub + menu de config (PC & Mobile)
│   ├── 📄 mobile-controls.css     <-- Interface de la manette virtuelle (D-Pad tactile)
│   └── 📁 modules/                <-- Styles spécifiques aux écrans de chaque jeu
│       ├── 📄 snake.css
│       ├── 📄 tetris.css
│       ├── 📄 pong.css
│       ├── 📄 demineur.css
│       ├── 📄 pacman.css
│       ├── 📄 bricks.css
│       ├── 📄 space-invaders.css
│       ├── 📄 frogger.css
│       ├── 📄 flappy.css
│       └── 📄 asteroides.css
│
└── 📁 js/
    ├── 📄 hub.js                  <-- Gestionnaire de la modale, thèmes et scores globaux
    ├── 📄 touch-manager.js        <-- Émulateur des touches clavier (Z,Q,S,D) via écran tactile
    └── 📁 engines/                <-- Les moteurs physiques et logiques de tes jeux
        ├── 📄 snake.js
        ├── 📄 tetris.js
        ├── 📄 pong.js
        ├── 📄 demineur.js
        ├── 📄 pacman.js
        ├── 📄 bricks.js
        ├── 📄 space-invaders.js
        ├── 📄 frogger.js
        ├── 📄 flappy.js
        └── 📄 asteroides.js
---

## 4. CAHIER DES CHARGES DES MODULES DE JEU (OBJECTIF : 10 JEUX)

Chaque jeu de la plateforme doit intégrer les fonctionnalités standardisées suivantes :
* **Contrôles universels :** Prise en charge double : Flèches directionnelles OU touches du clavier (`Z, Q, S, D` ou `W, A, S, D`).
* **Panneau de statistiques en direct :** Chronomètre de la partie, Score actuel, Meilleur score (High Score) et Moyenne des scores de toutes les parties jouées.
* **Vitesse Adaptative (Optionnelle) :** Si activée, le jeu commence en niveau "Facile" et la vitesse du moteur physique accélère automatiquement par paliers à chaque fois que le score augmente.
* **Sélecteur de thèmes graphiques :** Choix du design de l'interface (ex: Cyberpunk, Rétro Vert Phosphore, Classic GameBoy).

---

### LISTE INITIALE DES MODULES DU SYSTÈME :

1. **SNAKE PROTOCOL**
   * *Modes :* Solo uniquement.
   * *Mécanique :* Vitesse adaptative. Le serpent accélère à chaque fois qu'il mange un octet.

2. **TETRIS MATRIX**
   * *Modes :* Solo.
   * *Mécanique :* Choix entre difficultés fixes OU mode Adaptatif (les pièces tombent de plus en plus vite à chaque ligne complétée).

3. **PONG VECTOR**
   * *Modes :* Solo VS IA ou 2 Joueurs en local.
   * *Mécanique :* Mode adaptatif. La balle accélère après chaque rebond sur une raquette pour créer de l'intensité.

4. **CYBER DÉMINEUR**
   * *Modes :* Solo.
   * *Mécanique :* Configuration personnalisée de la grille de jeu : choix du nombre total de cases et du nombre de bombes à cacher. Déplacement au clavier ou à la souris.

5. **PACMAN MAZE**
   * *Modes :* Solo.
   * *Mécanique :* L'agressivité et la vitesse des fantômes augmentent au fur et à mesure que le joueur mange les pac-gommes sur la carte.

6. **BRICK BREAKER (BRICKS)**
   * *Modes :* Solo.
   * *Mécanique :* Difficulté liée à l'agencement des blocs (lignes blindées, briques à détruire en plusieurs coups) combinée à une vitesse de balle adaptative.

*(Note : 4 autres jeux seront ajoutés à la liste au fil du développement pour atteindre la barre des 10 modules).*

---

## 5. RELEVÉ ET FORMULES DES STATISTIQUES (LOGIQUE JS)
Pour afficher la moyenne des scores d'un jeu, nous allons devoir stocker un tableau de scores dans le `localStorage` pour chaque module :
* `scores-history-snake` : Contient la liste de toutes les fins de parties, ex : `[120, 250, 400]`.
* *Formule de la moyenne :* Somme de tous les scores de l'historique divisée par le nombre total de parties jouées.



index : visuel ecrand ordi sympas arcade , sponsor, ou style machine arcade flipper

boutton start , changelent de decor chois du jeux : des ligne de 4 rectancle comme des cadre au coinc arrondie avec une image principale du jeu quand on passe la souri dessu , une petit video animation du jeux. si on clique, nouvel page , un visuel large rectangle prend pas tout l'écran masi presque avec des proposition de lancement. 

dans le site possibiliter de se crée un compte lier avec une addresse mail (le compte n'est pas obligatiore) uniquement si il veulen concerver les parametre de lang theme ou score , jeux favories...

liste des jeux :

snake : option solo choix du designe du serpent , fecil moyen difficile ou alor adaptatif: le jeux commance en facile et plus le score augmente plus la vitesse augmente. pour jouer, les flacghe directionel ou les lettre qzd .affichage du chrono/ meilleur score et score actuel +moyenne des score.

tetris :  option solo choix du designe , fecil moyen difficile ou alor adaptatif: le jeux commance en facile et plus le score augmente plus la vitesse augmente. pour jouer, les flacghe directionel ou les lettre .affichage du chrono/ meilleur score et score actuel +moyenne des score.

pong :  option solo vs IA ou 2jouer choix du designe , fecil moyen difficile ou alor adaptatif: le jeux commance en facile et plus le score augmente plus la vitesse augmente.  pour jouer, les flacghe directionel ou les lettre .affichage du chrono/ meilleur score et score actuel +moyenne des score.

demineur :  option solo choix du designe , choix du nombre de casse et de bombe. pour jouer, les flacghe directionel ou les lettre .affichage du chrono/ meilleur score et score actuel +moyenne des score.

packman :  option solo choix du designe , fecil moyen difficile ou alor adaptatif: le jeux commance en facile et plus le score augmente plus la vitesse augmente. pour jouer, les flacghe directionel ou les lettre .affichage du chrono/ meilleur score et score actuel +moyenne des score.

briks : option solo choix du designe , fecil moyen difficile ou alor adaptatif: le jeux commance en facile et plus le score augmente plus la vitesse augmente. pour jouer, les flacghe directionel ou les lettre .affichage du chrono/ meilleur score et score actuel +moyenne des score. et des niveux de difficulter en lien avec les bloc 

au mieux il faudrais pour commancer une 10 jeux 