(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-space-invaders";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = 640, H = 520;
  canvas.width = W; canvas.height = H;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elLives = document.getElementById("hudLives");
  const elWave = document.getElementById("hudWave");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const ROWS = 4, COLS = 8, INV_W = 32, INV_H = 20, GAP = 14, TOP = 50, LEFT = (W - COLS * (INV_W + GAP)) / 2;
  const PLAYER_W = 34, PLAYER_H = 16, PLAYER_SPEED = 6;
  const ROW_COLORS = ["#ff3d9a", "#ffcf4d", "#4dff7a", "#2ee6d6"];

  let invaders, invDir, invSpeed, playerX, bullets, enemyBullets, score, lives, wave, elapsedSeconds = 0, timerId = null, running = false, loopId = null;
  const keys = {};
  let lastShot = 0;

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

  function buildWave() {
    invaders = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) invaders.push({ r, c, alive: true });
    invDir = 1;
    invSpeed = 0.6 + (wave - 1) * 0.25;
  }

  function resetState() {
    playerX = W / 2 - PLAYER_W / 2;
    bullets = []; enemyBullets = [];
    score = 0; lives = 3; wave = 1;
    elScore.textContent = "0"; elLives.textContent = "3"; elWave.textContent = "1";
    buildWave();
  }

  function invaderPos(inv) {
    return { x: LEFT + inv.c * (INV_W + GAP) + inv.offsetX, y: TOP + inv.r * (INV_H + GAP) };
  }

  let waveOffsetX = 0, waveOffsetY = 0;

  function update() {
    if (keys["q"] || keys["Q"] || keys["ArrowLeft"]) playerX -= PLAYER_SPEED;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) playerX += PLAYER_SPEED;
    playerX = Math.max(0, Math.min(W - PLAYER_W, playerX));

    const now = Date.now();
    if ((keys[" "] || keys["z"] || keys["Z"]) && now - lastShot > 320) {
      bullets.push({ x: playerX + PLAYER_W / 2, y: H - 46 });
      lastShot = now;
    }

    bullets.forEach((b) => (b.y -= 7));
    bullets = bullets.filter((b) => b.y > 0);

    waveOffsetX += invDir * invSpeed;
    let hitEdge = false;
    invaders.forEach((inv) => {
      if (!inv.alive) return;
      const x = LEFT + inv.c * (INV_W + GAP) + waveOffsetX;
      if (x <= 10 || x + INV_W >= W - 10) hitEdge = true;
    });
    if (hitEdge) { invDir *= -1; waveOffsetY += 16; }

    if (Math.random() < 0.02 + wave * 0.005) {
      const alive = invaders.filter((i) => i.alive);
      if (alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        const x = LEFT + shooter.c * (INV_W + GAP) + waveOffsetX + INV_W / 2;
        const y = TOP + shooter.r * (INV_H + GAP) + waveOffsetY + INV_H;
        enemyBullets.push({ x, y });
      }
    }
    enemyBullets.forEach((b) => (b.y += 4.5));
    enemyBullets = enemyBullets.filter((b) => b.y < H);

    bullets.forEach((b) => {
      invaders.forEach((inv) => {
        if (!inv.alive) return;
        const x = LEFT + inv.c * (INV_W + GAP) + waveOffsetX;
        const y = TOP + inv.r * (INV_H + GAP) + waveOffsetY;
        if (b.x > x && b.x < x + INV_W && b.y > y && b.y < y + INV_H) {
          inv.alive = false;
          b.y = -100;
          score += 10 * (ROWS - inv.r);
          elScore.textContent = score;
        }
      });
    });
    bullets = bullets.filter((b) => b.y > -50);

    enemyBullets.forEach((b) => {
      if (b.x > playerX && b.x < playerX + PLAYER_W && b.y > H - 46 && b.y < H - 30) {
        b.y = H + 100;
        loseLife();
      }
    });

    invaders.forEach((inv) => {
      if (!inv.alive) return;
      const y = TOP + inv.r * (INV_H + GAP) + waveOffsetY;
      if (y + INV_H >= H - 40) loseLife();
    });

    if (invaders.every((i) => !i.alive)) nextWave();
  }

  function nextWave() {
    wave++;
    elWave.textContent = wave;
    score += 100;
    elScore.textContent = score;
    waveOffsetX = 0; waveOffsetY = 0;
    buildWave();
  }

  function loseLife() {
    lives--;
    elLives.textContent = lives;
    if (lives <= 0) return gameOver();
    enemyBullets = [];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    invaders.forEach((inv) => {
      if (!inv.alive) return;
      const x = LEFT + inv.c * (INV_W + GAP) + waveOffsetX;
      const y = TOP + inv.r * (INV_H + GAP) + waveOffsetY;
      ctx.fillStyle = ROW_COLORS[inv.r % ROW_COLORS.length];
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
      ctx.fillRect(x, y, INV_W, INV_H);
      ctx.shadowBlur = 0;
    });

    ctx.fillStyle = "#2ee6d6";
    ctx.shadowColor = "#2ee6d6"; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_W / 2, H - 46);
    ctx.lineTo(playerX, H - 30);
    ctx.lineTo(playerX + PLAYER_W, H - 30);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#aef9f0";
    bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));
    ctx.fillStyle = "#ff3d9a";
    enemyBullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));
  }

  function loop() { update(); draw(); }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.textContent = "Score final : " + score + " (vague " + wave + ") — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    waveOffsetX = 0; waveOffsetY = 0;
    resetState();
    draw();
    refreshStatsPanel();
    running = true;
    loopId = setInterval(loop, 1000 / 60);
    startTimer();
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!running && (e.key === "Enter")) startGame();
    if (!running && e.key === " ") { startGame(); }
    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const setHeld = (val) => { if (dir === "left") keys["q"] = val; if (dir === "right") keys["d"] = val; };
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) return startGame(); setHeld(true); }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); setHeld(false); }, { passive: false });
  });
  document.querySelectorAll("[data-action='fire']").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) return startGame(); keys[" "] = true; }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[" "] = false; }, { passive: false });
  });

  waveOffsetX = 0; waveOffsetY = 0;
  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "SPACE INVADERS";
  overlayMsg.textContent = "Q/D deplacer, ESPACE/Z tirer. Appuie pour demarrer";
  overlay.classList.add("show");
})();
