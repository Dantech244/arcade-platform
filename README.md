# RetroForge 🕹️

Hub d'arcade rétro-futuriste — 10 jeux classiques réémulés en HTML5, CSS3 et JavaScript Vanille, jouables directement dans le navigateur.

---

## 1. OBJECTIFS DU PROJET
* **But principal :** Créer un hub centralisé de jeux vidéo rétro émulés nativement en HTML5, CSS3 et JavaScript Vanille.
* **Thématique visuelle :** Ambiance borne d'arcade rétro-futuriste, interface sombre avec des touches lumineuses néon (Cyan et Rose), overlay CRT et scanlines.
* **Objectif Hack Club :** Valider entre 80 et 100 heures de code d'ici le 29 août pour débloquer le Flipper Zero et la Pinetime.

---

## 2. FONCTIONNALITÉS STANDARDISÉES

Chaque jeu de la plateforme intègre :
* **Contrôles universels :** Flèches directionnelles OU touches clavier (`Z, Q, S, D` / `W, A, S, D`), plus un D-Pad tactile sur mobile.
* **Panneau de statistiques en direct :** Chronomètre, score actuel, meilleur score, moyenne de toutes les parties jouées.
* **Vitesse adaptative (activable) :** Le jeu accélère par paliers à mesure que le score augmente.
* **Sélecteur de thèmes graphiques :** Cyberpunk Néon, Rétro Vert Phosphore, Classic GameBoy — accessible via la molette ⚙ en haut à droite du hub.
* **Playlist musicale :** lecture aléatoire en boucle, piste suivante à la demande, volume réglable, position mémorisée entre les pages.

---

## 3. LISTE DES 10 MODULES

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

---

## 4. RELEVÉ ET FORMULES DES STATISTIQUES (LOGIQUE JS)

Chaque module stocke son historique de scores dans le `localStorage` :
* `scores-history-<nom-du-jeu>` : liste de toutes les fins de partie, ex. `[120, 250, 400]`.
* **Formule de la moyenne :** somme de tous les scores de l'historique divisée par le nombre total de parties jouées.
* `retroforge-playtime-total` : cumul du temps de jeu en minutes, toutes cabines confondues, affiché sur le hub.
* `retroforge-theme` : thème graphique sélectionné, persistant entre les sessions.

---

## 5. LANCER LE PROJET

Aucune dépendance, aucun build : ouvrir `index.html` dans un navigateur suffit.

Pour activer la playlist, déposer des fichiers `music1.mp3`, `music2.mp3`, etc. dans `assets/music/` (voir `assets/music/README.txt`).
