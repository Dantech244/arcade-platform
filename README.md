# RetroForge 

Hub d'arcade rétro-futuriste — 10 jeux classiques réémulés en HTML5, CSS3 et JavaScript Vanille, jouables directement dans le navigateur.

---

## . OBJECTIFS DU PROJET
* **But principal :** Créer un hub centralisé de jeux vidéo rétro émulés nativement en HTML5, CSS3 et JavaScript Vanille.
* **Thématique visuelle :** Ambiance borne d'arcade rétro-futuriste, interface sombre avec des touches lumineuses néon (Cyan et Rose), overlay CRT et scanlines.

---
## . LISTE DES 15 MODULES

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

## . RELEVÉ ET FORMULES DES STATISTIQUES (LOGIQUE JS)

Chaque module stocke son historique de scores dans le `localStorage` :
* `scores-history-<nom-du-jeu>` : liste de toutes les fins de partie, ex. `[120, 250, 400]`.
* **Formule de la moyenne :** somme de tous les scores de l'historique divisée par le nombre total de parties jouées.
* `retroforge-playtime-total` : cumul du temps de jeu en minutes, toutes cabines confondues, affiché sur le hub.
* `retroforge-theme` : thème graphique sélectionné, persistant entre les sessions.

---

## . LANCER LE PROJET

Aucune dépendance, aucun build : ouvrir `index.html` dans un navigateur suffit.
