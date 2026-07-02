(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-asteroides";
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
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let ship, bullets, rocks, score, lives, elapsedSeconds = 0, timerId = null, running = false, loopId = null, spawnTimer = 0, wave;
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

  function wrap(v, max) { if (v < 0) return v + max; if (v > max) return v - max; return v; }

  function spawnRock(size) {
    size = size || 3;
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = 0; y = Math.random() * H; }
    else if (edge === 1) { x = W; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = 0; }
    else { x = Math.random() * W; y = H; }
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.6 + Math.random() * 0.8) * (1 + (wave - 1) * 0.18);
    rocks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, r: size * 12 });
  }

  function resetState() {
    ship = { x: W / 2, y: H / 2, angle: -Math.PI / 2, vx: 0, vy: 0 };
    bullets = [];
    rocks = [];
    score = 0; lives = 3; wave = 1;
    elScore.textContent = "0"; elLives.textContent = "3";
    for (let i = 0; i < 4; i++) spawnRock();
  }

  function update() {
    if (keys["q"] || keys["Q"] || keys["ArrowLeft"]) ship.angle -= 0.06;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) ship.angle += 0.06;
    if (keys["z"] || keys["Z"] || keys["w"] || keys["W"] || keys["ArrowUp"]) {
      ship.vx += Math.cos(ship.angle) * 0.14;
      ship.vy += Math.sin(ship.angle) * 0.14;
    }
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x = wrap(ship.x + ship.vx, W);
    ship.y = wrap(ship.y + ship.vy, H);

    const now = Date.now();
    if (keys[" "] && now - lastShot > 260) {
      bullets.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.angle) * 6 + ship.vx, vy: Math.sin(ship.angle) * 6 + ship.vy, life: 60 });
      lastShot = now;
    }
    bullets.forEach((b) => { b.x = wrap(b.x + b.vx, W); b.y = wrap(b.y + b.vy, H); b.life--; });
    bullets = bullets.filter((b) => b.life > 0);

    rocks.forEach((r) => { r.x = wrap(r.x + r.vx, W); r.y = wrap(r.y + r.vy, H); });

    bullets.forEach((b) => {
      rocks.forEach((r) => {
        if (r.hit) return;
        const dx = b.x - r.x, dy = b.y - r.y;
        if (Math.sqrt(dx * dx + dy * dy) < r.r) {
          r.hit = true; b.life = 0;
          score += (4 - r.size) * 20;
          elScore.textContent = score;
          if (r.size > 1) {
            for (let i = 0; i < 2; i++) spawnRock(r.size - 1);
          }
        }
      });
    });
    rocks = rocks.filter((r) => !r.hit);

    rocks.forEach((r) => {
      const dx = ship.x - r.x, dy = ship.y - r.y;
      if (Math.sqrt(dx * dx + dy * dy) < r.r + 8) loseLife();
    });

    if (rocks.length === 0) nextWave();
  }

  function nextWave() {
    wave++;
    score += 50;
    elScore.textContent = score;
    for (let i = 0; i < 3 + wave; i++) spawnRock();
  }

  function loseLife() {
    lives--;
    elLives.textContent = lives;
    if (lives <= 0) return gameOver();
    ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0;
    rocks = rocks.filter((r) => Math.hypot(r.x - ship.x, r.y - ship.y) > 100);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "#aef9f0";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#2ee6d6"; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x + Math.cos(ship.angle) * 12, ship.y + Math.sin(ship.angle) * 12);
    ctx.lineTo(ship.x + Math.cos(ship.angle + 2.5) * 10, ship.y + Math.sin(ship.angle + 2.5) * 10);
    ctx.lineTo(ship.x + Math.cos(ship.angle - 2.5) * 10, ship.y + Math.sin(ship.angle - 2.5) * 10);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffcf4d";
    bullets.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill(); });

    ctx.strokeStyle = "#ff3d9a";
    ctx.shadowColor = "#ff3d9a"; ctx.shadowBlur = 5;
    rocks.forEach((r) => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  function loop() { update(); draw(); }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "VAISSEAU DETRUIT";
    overlayMsg.textContent = "Score final : " + score + " — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    resetState();
    draw();
    refreshStatsPanel();
    running = true;
    loopId = setInterval(loop, 1000 / 60);
    startTimer();
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!running && (e.key === " " || e.key === "Enter")) startGame();
    if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const map = { left: "q", right: "d", up: "z" };
    const setHeld = (val) => { keys[map[dir]] = val; };
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) return startGame(); setHeld(true); }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); setHeld(false); }, { passive: false });
  });
  document.querySelectorAll("[data-action='fire']").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) return startGame(); keys[" "] = true; }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[" "] = false; }, { passive: false });
  });

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "ASTEROIDES DRIFT";
  overlayMsg.textContent = "Q/D tourner, Z avancer, ESPACE tirer. Appuie pour demarrer";
  overlay.classList.add("show");
})();
