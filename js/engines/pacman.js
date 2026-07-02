(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-pacman";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Labyrinthe genere sur une grille de "salles" ROOM_COLS x ROOM_ROWS,
  // chaque salle occupe une cellule impaire dans la grille finale (murs entre elles).
  const ROOM_COLS = 10, ROOM_ROWS = 8;
  const COLS = ROOM_COLS * 2 + 1; // 21
  const ROWS = ROOM_ROWS * 2 + 1; // 17
  const CELL = 24;
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elLives = document.getElementById("hudLives");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let grid, pac, ghosts, score, lives, dotsLeft, elapsedSeconds = 0, timerId = null, running = false, loopId = null, ghostSpeedFactor;

  function getHistory() {
    try { const r = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(r) ? r : []; }
    catch (e) { return []; }
  }
  function saveScore(v) { const h = getHistory(); h.push(v); localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }
  function addPlaytime(m) { const t = parseInt(localStorage.getItem(PLAYTIME_KEY), 10) || 0; localStorage.setItem(PLAYTIME_KEY, String(t + m)); }
  function refreshStatsPanel() {
    const h = getHistory();
    elBest.textContent = h.length ? Math.max(...h) : 0;
    elAvg.textContent = h.length ? Math.round(h.reduce((a, b) => a + b, 0) / h.length) : 0;
  }
  function startTimer() {
    elapsedSeconds = 0; elTime.textContent = "0:00";
    timerId = setInterval(() => {
      elapsedSeconds++;
      elTime.textContent = Math.floor(elapsedSeconds / 60) + ":" + String(elapsedSeconds % 60).padStart(2, "0");
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); const m = Math.round(elapsedSeconds / 60); if (m > 0) addPlaytime(m); }

  /* ---------- Generation procedurale du labyrinthe (parcours en profondeur) ---------- */
  function buildMaze() {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    const visited = Array.from({ length: ROOM_ROWS }, () => Array(ROOM_COLS).fill(false));

    // Chaque salle est toujours un couloir ouvert : aucun risque de spawn dans un mur.
    for (let ry = 0; ry < ROOM_ROWS; ry++) {
      for (let rx = 0; rx < ROOM_COLS; rx++) g[ry * 2 + 1][rx * 2 + 1] = 0;
    }

    // Parcours en profondeur : garantit que toutes les salles sont reliees entre elles.
    const stack = [[0, 0]];
    visited[0][0] = true;
    while (stack.length) {
      const [rx, ry] = stack[stack.length - 1];
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
        const nx = rx + dx, ny = ry + dy;
        return nx >= 0 && nx < ROOM_COLS && ny >= 0 && ny < ROOM_ROWS && !visited[ny][nx];
      });
      if (dirs.length === 0) { stack.pop(); continue; }
      const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = rx + dx, ny = ry + dy;
      g[ry * 2 + 1 + dy][rx * 2 + 1 + dx] = 0; // casse le mur entre les deux salles
      visited[ny][nx] = true;
      stack.push([nx, ny]);
    }

    // Ajoute quelques boucles pour un vrai labyrinthe "pacman" (pas juste un arbre sans issue)
    for (let ry = 0; ry < ROOM_ROWS; ry++) {
      for (let rx = 0; rx < ROOM_COLS; rx++) {
        if (rx < ROOM_COLS - 1 && Math.random() < 0.14) g[ry * 2 + 1][rx * 2 + 2] = 0;
        if (ry < ROOM_ROWS - 1 && Math.random() < 0.14) g[ry * 2 + 2][rx * 2 + 1] = 0;
      }
    }

    grid = g;
    dotsLeft = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === 0) dotsLeft++;
  }

  function roomToGrid(rx, ry) { return { x: rx * 2 + 1, y: ry * 2 + 1 }; }

  function walkable(x, y) {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return false;
    return grid[y][x] !== 1;
  }

  function resetActors() {
    const pacRoom = roomToGrid(Math.floor(ROOM_COLS / 2), ROOM_ROWS - 1);
    pac = { x: pacRoom.x, y: pacRoom.y, dir: { x: 0, y: 0 }, next: { x: 0, y: 0 } };

    const cx = Math.floor(ROOM_COLS / 2), cy = Math.floor(ROOM_ROWS / 2);
    const spots = [[cx, cy], [Math.max(0, cx - 1), cy], [Math.min(ROOM_COLS - 1, cx + 1), cy]];
    const colors = ["#ff3d9a", "#ffcf4d", "#4d7bff"];
    ghosts = spots.map(([rx, ry], i) => {
      const p = roomToGrid(rx, ry);
      return { x: p.x, y: p.y, color: colors[i], dir: { x: i % 2 === 0 ? 1 : -1, y: 0 } };
    });
  }

  function movePac() {
    const tryDir = pac.next;
    if (!(tryDir.x === 0 && tryDir.y === 0) && walkable(pac.x + tryDir.x, pac.y + tryDir.y)) {
      pac.dir = tryDir;
    }
    const nx = pac.x + pac.dir.x, ny = pac.y + pac.dir.y;
    if (walkable(nx, ny)) { pac.x = nx; pac.y = ny; }

    if (grid[pac.y][pac.x] === 0) {
      grid[pac.y][pac.x] = 2;
      dotsLeft--;
      score += 10;
      elScore.textContent = score;
      if (dotsLeft <= 0) return levelClear();
    }
  }

  function moveGhosts() {
    ghosts.forEach((g) => {
      let pool = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
        .filter((d) => walkable(g.x + d.x, g.y + d.y) && !(d.x === -g.dir.x && d.y === -g.dir.y));
      if (pool.length === 0) {
        const back = { x: -g.dir.x, y: -g.dir.y };
        pool = walkable(g.x + back.x, g.y + back.y) ? [back] : [];
      }
      if (pool.length === 0) return; // impasse temporaire, on retente au prochain tick

      const aggression = Math.min(0.85, 0.15 + score / 400);
      let chosen;
      if (Math.random() < aggression) {
        pool = pool.slice().sort((a, b) => {
          const da = Math.abs((g.x + a.x) - pac.x) + Math.abs((g.y + a.y) - pac.y);
          const db = Math.abs((g.x + b.x) - pac.x) + Math.abs((g.y + b.y) - pac.y);
          return da - db;
        });
        chosen = pool[0];
      } else {
        chosen = pool[Math.floor(Math.random() * pool.length)];
      }
      g.dir = chosen;
      g.x += chosen.x;
      g.y += chosen.y;
    });
  }

  function checkCollisions() {
    for (const g of ghosts) if (g.x === pac.x && g.y === pac.y) return loseLife();
  }

  function loseLife() {
    lives--;
    elLives.textContent = lives;
    if (lives <= 0) return gameOver();
    resetActors();
  }

  function levelClear() {
    score += 200;
    elScore.textContent = score;
    buildMaze();
    resetActors();
    ghostSpeedFactor = Math.max(0.45, ghostSpeedFactor - 0.08);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === 1) {
          ctx.fillStyle = "#1a1430";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        } else if (v === 0) {
          ctx.fillStyle = "#ffcf4d";
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = "#ffe14d";
    ctx.shadowColor = "#ffe14d";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pac.x * CELL + CELL / 2, pac.y * CELL + CELL / 2, CELL / 2 - 2, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(pac.x * CELL + CELL / 2, pac.y * CELL + CELL / 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ghosts.forEach((g) => {
      ctx.fillStyle = g.color;
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(g.x * CELL + CELL / 2, g.y * CELL + CELL / 2, CELL / 2 - 2, Math.PI, 0);
      ctx.lineTo(g.x * CELL + CELL - 2, g.y * CELL + CELL - 2);
      ctx.lineTo(g.x * CELL + 2, g.y * CELL + CELL - 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  let ghostTickAccum = 0;
  function loop() {
    movePac();
    ghostTickAccum++;
    if (ghostTickAccum >= Math.round(1 / ghostSpeedFactor)) { moveGhosts(); ghostTickAccum = 0; }
    checkCollisions();
    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.textContent = "Score final : " + score + " — appuie sur une touche pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    buildMaze();
    resetActors();
    score = 0; lives = 3; ghostSpeedFactor = 1;
    elScore.textContent = "0"; elLives.textContent = "3";
    draw();
    refreshStatsPanel();
    running = true;
    loopId = setInterval(loop, 180);
    startTimer();
  }

  const DIR = {
    z: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowUp: { x: 0, y: -1 },
    s: { x: 0, y: 1 }, ArrowDown: { x: 0, y: 1 },
    q: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowLeft: { x: -1, y: 0 },
    d: { x: 1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  };

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    const mapped = DIR[e.key];
    if (mapped) { e.preventDefault(); pac.next = mapped; }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!running) return startGame();
      pac.next = map[btn.getAttribute("data-dir")];
    }, { passive: false });
    btn.addEventListener("click", () => {
      if (!running) return startGame();
      pac.next = map[btn.getAttribute("data-dir")];
    });
  });

  buildMaze();
  resetActors();
  score = 0; lives = 3; ghostSpeedFactor = 1;
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "PACMAN MAZE";
  overlayMsg.textContent = "ZQSD / fleches pour te deplacer. Appuie sur une touche pour demarrer";
  overlay.classList.add("show");
})();
