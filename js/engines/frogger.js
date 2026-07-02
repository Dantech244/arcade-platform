(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-frogger";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const CELL = 32, COLS = 14, ROWS = 14;
  canvas.width = COLS * CELL; canvas.height = ROWS * CELL;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elLives = document.getElementById("hudLives");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  // Rangées de route (voitures) : y, direction, vitesse de base, densite
  const ROAD_ROWS = [9, 10, 11, 12];
  // Rangées de riviere (buches) : y, direction, vitesse
  const RIVER_ROWS = [1, 2, 3, 4];

  let frog, cars, logs, score, lives, bestRow, difficultyFactor, elapsedSeconds = 0, timerId = null, running = false, loopId = null;

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

  function buildEntities() {
    cars = ROAD_ROWS.map((y, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = (0.9 + i * 0.25) * difficultyFactor;
      const items = [];
      const count = 3;
      for (let k = 0; k < count; k++) items.push({ x: k * (COLS / count) * CELL, w: CELL * 1.4 });
      return { y, dir, speed, items };
    });
    logs = RIVER_ROWS.map((y, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      const speed = (0.6 + i * 0.15) * difficultyFactor * 0.85;
      const items = [];
      const count = 3;
      for (let k = 0; k < count; k++) items.push({ x: k * (COLS / count) * CELL, w: CELL * 2.2 });
      return { y, dir, speed, items };
    });
  }

  function resetFrog() {
    frog = { x: Math.floor(COLS / 2), y: ROWS - 1, onLog: null };
  }

  function resetState() {
    score = 0; lives = 3; bestRow = ROWS - 1; difficultyFactor = 1;
    elScore.textContent = "0"; elLives.textContent = "3";
    buildEntities();
    resetFrog();
  }

  function update() {
    cars.forEach((row) => row.items.forEach((it) => {
      it.x += row.dir * row.speed;
      if (row.dir > 0 && it.x > canvas.width) it.x = -it.w;
      if (row.dir < 0 && it.x < -it.w) it.x = canvas.width;
    }));
    logs.forEach((row) => row.items.forEach((it) => {
      it.x += row.dir * row.speed;
      if (row.dir > 0 && it.x > canvas.width) it.x = -it.w;
      if (row.dir < 0 && it.x < -it.w) it.x = canvas.width;
    }));

    const carRow = cars.find((r) => r.y === frog.y);
    if (carRow) {
      const fx = frog.x * CELL + CELL / 2;
      const hit = carRow.items.some((it) => fx > it.x && fx < it.x + it.w);
      if (hit) return loseLife();
    }

    const logRow = logs.find((r) => r.y === frog.y);
    if (logRow) {
      const fx = frog.x * CELL + CELL / 2;
      const onLog = logRow.items.find((it) => fx > it.x && fx < it.x + it.w);
      if (!onLog) return loseLife();
      frog.x += (logRow.dir * logRow.speed) / CELL;
      if (frog.x < 0 || frog.x > COLS - 1) return loseLife();
    }

    if (frog.y === 0) return reachGoal();
  }

  function reachGoal() {
    score += 50;
    elScore.textContent = score;
    difficultyFactor += 0.12;
    buildEntities();
    resetFrog();
  }

  function loseLife() {
    lives--;
    elLives.textContent = lives;
    if (lives <= 0) return gameOver();
    resetFrog();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      let color = "#0d0a18";
      if (RIVER_ROWS.includes(y)) color = "#0a1a2a";
      if (ROAD_ROWS.includes(y)) color = "#12101d";
      if (y === 0) color = "#0d2418";
      ctx.fillStyle = color;
      ctx.fillRect(0, y * CELL, canvas.width, CELL);
    }

    logs.forEach((row) => row.items.forEach((it) => {
      ctx.fillStyle = "#8a5a2a";
      ctx.fillRect(it.x, row.y * CELL + 4, it.w, CELL - 8);
    }));

    cars.forEach((row) => row.items.forEach((it) => {
      ctx.fillStyle = "#ff3d9a";
      ctx.shadowColor = "#ff3d9a"; ctx.shadowBlur = 6;
      ctx.fillRect(it.x, row.y * CELL + 5, it.w, CELL - 10);
      ctx.shadowBlur = 0;
    }));

    ctx.fillStyle = "#4dff7a";
    ctx.shadowColor = "#4dff7a"; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(frog.x * CELL + CELL / 2, frog.y * CELL + CELL / 2, CELL / 2 - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop() { update(); draw(); }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.textContent = "Score final : " + score + " — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    resetState();
    draw();
    refreshStatsPanel();
    running = true;
    loopId = setInterval(loop, 1000 / 30);
    startTimer();
  }

  const DIR = {
    z: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowUp: { x: 0, y: -1 },
    s: { x: 0, y: 1 }, ArrowDown: { x: 0, y: 1 },
    q: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowLeft: { x: -1, y: 0 },
    d: { x: 1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  };

  function hop(d) {
    frog.x = Math.max(0, Math.min(COLS - 1, Math.round(frog.x) + d.x));
    frog.y = Math.max(0, Math.min(ROWS - 1, frog.y + d.y));
  }

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    const mapped = DIR[e.key];
    if (mapped && running) { e.preventDefault(); hop(mapped); }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!running) return startGame();
      hop(DIR[{ up: "z", down: "s", left: "q", right: "d" }[btn.getAttribute("data-dir")]]);
    }, { passive: false });
    btn.addEventListener("click", () => {
      if (!running) return startGame();
      hop(DIR[{ up: "z", down: "s", left: "q", right: "d" }[btn.getAttribute("data-dir")]]);
    });
  });

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "FROGGER CROSSING";
  overlayMsg.textContent = "ZQSD / fleches pour sauter d'une case. Appuie pour demarrer";
  overlay.classList.add("show");
})();
