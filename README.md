# RetroForge 

Hub d'arcade rétro-futuriste — 10 jeux classiques réémulés en HTML5, CSS3 et JavaScript Vanille, jouables directement dans le navigateur.

---

## 1. OBJECTIFS DU PROJET
* **But principal :** Créer un hub centralisé de jeux vidéo rétro émulés nativement en HTML5, CSS3 et JavaScript Vanille.
* **Thématique visuelle :** Ambiance borne d'arcade rétro-futuriste, interface sombre avec des touches lumineuses néon (Cyan et Rose), overlay CRT et scanlines.

---

## 2. ARBORESCENCE DU PROJET

📁 retroforge/
│
├── 📄 index.html                  <-- Hub d'accueil responsive (grille des 10 jeux)
├── 📄 README.md                   <-- Ce fichier
├── 📄 cahier-des-charges.md       <-- Plan de vol original (vitesse adaptative, stats...)
│
├── 📁 assets/
│   └── 📁 music/                  <-- Playlist : music1.mp3, music2.mp3, ... (detection auto)
│       └── 📄 README.txt
│
├── 📁 games/                      <-- Les 15 pages de jeu
│   ├── 📄 snake.html
│   ├── 📄 tetris.html
│   ├── 📄 pong.html
│   ├── 📄 demineur.html
│   ├── 📄 pacman.html
│   ├── 📄 bricks.html
│   ├── 📄 space-invaders.html
│   ├── 📄 frogger.html
│   ├── 📄 flappy.html
│   ├── 📄 asteroides.html
│   ├── 📄 2048.html
│   ├── 📄 memory.html
│   ├── 📄 sequence.html
│   ├── 📄 moles.html
│   └── 📄 connect4.html
│
├── 📁 css/
│   ├── 📄 global.css              <-- Design tokens, hub, modale de config, lecteur musical
│   ├── 📄 mobile-controls.css     <-- Interface de la manette virtuelle (D-Pad tactile)
│   └── 📁 modules/                <-- Styles spécifiques à l'écran de chaque jeu
│       ├── 📄 snake.css
│       ├── 📄 tetris.css
│       ├── 📄 pong.css
│       ├── 📄 demineur.css
│       ├── 📄 pacman.css
│       ├── 📄 bricks.css
│       ├── 📄 space-invaders.css
│       ├── 📄 frogger.css
│       ├── 📄 flappy.css
│       ├── 📄 asteroides.css
│       ├── 📄 2048.css
│       ├── 📄 memory.css
│       ├── 📄 sequence.css
│       ├── 📄 moles.css
│       └── 📄 connect4.css
│
└── 📁 js/
    ├── 📄 hub.js                  <-- Gestionnaire de la modale, thèmes et scores globaux
    ├── 📄 touch-manager.js        <-- Émulateur des touches clavier (Z,Q,S,D) via écran tactile
    ├── 📄 playlist.js             <-- Lecteur de playlist musicale aléatoire
    └── 📁 engines/                <-- Moteurs physiques et logiques de chaque jeu
        ├── 📄 snake.js
        ├── 📄 tetris.js
        ├── 📄 pong.js
        ├── 📄 demineur.js
        ├── 📄 pacman.js
        ├── 📄 bricks.js
        ├── 📄 space-invaders.js
        ├── 📄 frogger.js
        ├── 📄 flappy.js
        ├── 📄 asteroides.js
        ├── 📄 2048.js
        ├── 📄 memory.js
        ├── 📄 sequence.js
        ├── 📄 moles.js
        └── 📄 connect4.js

---

## 3. FONCTIONNALITÉS STANDARDISÉES

Chaque jeu de la plateforme intègre :
* **Contrôles universels :** Flèches directionnelles OU touches clavier (`Z, Q, S, D` / `W, A, S, D`), plus un D-Pad tactile sur mobile.
* **Panneau de statistiques en direct :** Chronomètre, score actuel, meilleur score, moyenne de toutes les parties jouées.
* **Vitesse adaptative (activable) :** Le jeu accélère par paliers à mesure que le score augmente.
* **Sélecteur de thèmes graphiques :** Cyberpunk Néon, Rétro Vert Phosphore, Classic GameBoy — accessible via la molette ⚙ en haut à droite du hub.
* **Playlist musicale :** lecture aléatoire en boucle, piste suivante à la demande, volume réglable, position mémorisée entre les pages.

---

## 4. LISTE DES 10 MODULES

| # | Jeu | Mode(s) | Mécanique adaptative |
|---|-----|---------|------------------------|
| 01 | Snake Protocol | Solo | Accélère à chaque octet mangé |
| 02 | Tetris Matrix | Solo | Pièces plus rapides à chaque ligne complétée |
| 03 | Pong Vector | Solo vs IA / 2 joueurs | Balle qui accélère à chaque rebond |
| 04 | Cyber Démineur | Solo | Grille et nombre de mines personnalisables |
| 05 | Pacman Maze | Solo | Fantômes plus agressifs avec le score |
| 06 | Brick Breaker | Solo | Briques renforcées + balle adaptative |
| 07 | Space Invaders | Solo | Vagues plus rapides et plus nombreuses |
| 08 | Frogger Crossing | Solo | Circulation qui s'accélère à chaque traversée |
| 09 | Flappy Signal | Solo | Tubes resserrés progressivement |
| 10 | Astéroïdes Drift | Solo | Vagues plus rapides, astéroïdes qui se scindent |
| 11 | 2048 | Solo | Puzzle de fusion de tuiles, classique |
| 12 | Cyber Memory | Solo | Paires de cartes, 3 niveaux de difficulté |
| 13 | Cyber Sequence | Solo | Simon-like, la vitesse augmente à chaque niveau |
| 14 | Cyber Moles | Solo | Chrono 45s, taupes plus rapides avec le score |
| 15 | Puissance 4 | Solo vs IA / 2 joueurs | IA qui bloque/gagne, ou 2 joueurs en local |

---

## 5. RELEVÉ ET FORMULES DES STATISTIQUES (LOGIQUE JS)

Chaque module stocke son historique de scores dans le `localStorage` :
* `scores-history-<nom-du-jeu>` : liste de toutes les fins de partie, ex. `[120, 250, 400]`.
* **Formule de la moyenne :** somme de tous les scores de l'historique divisée par le nombre total de parties jouées.
* `retroforge-playtime-total` : cumul du temps de jeu en minutes, toutes cabines confondues, affiché sur le hub.
* `retroforge-theme` : thème graphique sélectionné, persistant entre les sessions.

---

## 6. LANCER LE PROJET

Aucune dépendance, aucun build : ouvrir `index.html` dans un navigateur suffit.

Pour activer la playlist, déposer des fichiers `music1.mp3`, `music2.mp3`, etc. dans `assets/music/` (voir `assets/music/README.txt`).