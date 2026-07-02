(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-bricks";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = 640, H = 480;
  canvas.width = W; canvas.height = H;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elLives = document.getElementById("hudLives");
  const elSpeedToggle = document.getElementById("adaptiveSpeed");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const ROWS = 6, COLS = 10, BRICK_W = 56, BRICK_H = 20, BRICK_GAP = 4, BRICK_TOP = 50, BRICK_LEFT = (W - COLS * (BRICK_W + BRICK_GAP)) / 2;
  const PADDLE_W = 90, PADDLE_H = 12, PADDLE_SPEED = 8;
  const ROW_COLORS = ["#ff3d9a", "#ff9d4d", "#ffcf4d", "#4dff7a", "#2ee6d6", "#4d7bff"];

  let bricks, paddleX, ball, score, lives, elapsedSeconds = 0, timerId = null, running = false, loopId = null;
  const keys = {};

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

  function buildBricks() {
    bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // rangees du haut = plus resistantes (2 coups)
        bricks.push({ r, c, hp: r < 2 ? 2 : 1, alive: true });
      }
    }
  }

  function resetBall() {
    ball = { x: W / 2, y: H - 70, vx: 3.2 * (Math.random() < 0.5 ? 1 : -1), vy: -3.6, r: 6 };
  }

  function resetState() {
    buildBricks();
    paddleX = W / 2 - PADDLE_W / 2;
    score = 0; lives = 3;
    elScore.textContent = "0"; elLives.textContent = "3";
    resetBall();
  }

  function update() {
    if (keys["q"] || keys["Q"] || keys["ArrowLeft"]) paddleX -= PADDLE_SPEED;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) paddleX += PADDLE_SPEED;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x <= ball.r || ball.x >= W - ball.r) ball.vx *= -1;
    if (ball.y <= ball.r) ball.vy *= -1;

    if (ball.y >= H - 22 - ball.r && ball.y <= H - 10 && ball.x >= paddleX && ball.x <= paddleX + PADDLE_W && ball.vy > 0) {
      const hitPos = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      ball.vy = -Math.abs(ball.vy);
      ball.vx = hitPos * 4.5;
    }

    if (ball.y > H) return loseLife();

    for (const b of bricks) {
      if (!b.alive) continue;
      const bx = BRICK_LEFT + b.c * (BRICK_W + BRICK_GAP);
      const by = BRICK_TOP + b.r * (BRICK_H + BRICK_GAP);
      if (ball.x + ball.r > bx && ball.x - ball.r < bx + BRICK_W && ball.y + ball.r > by && ball.y - ball.r < by + BRICK_H) {
        b.hp--;
        if (b.hp <= 0) { b.alive = false; score += 10; } else { score += 5; }
        elScore.textContent = score;
        ball.vy *= -1;
        if (elSpeedToggle.checked) {
          const speedUp = 1.015;
          ball.vx *= speedUp; ball.vy *= speedUp;
        }
        break;
      }
    }

    if (bricks.every((b) => !b.alive)) levelClear();
  }

  function levelClear() {
    score += 100;
    elScore.textContent = score;
    buildBricks();
    resetBall();
  }

  function loseLife() {
    lives--;
    elLives.textContent = lives;
    if (lives <= 0) return gameOver();
    resetBall();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    bricks.forEach((b) => {
      if (!b.alive) return;
      const bx = BRICK_LEFT + b.c * (BRICK_W + BRICK_GAP);
      const by = BRICK_TOP + b.r * (BRICK_H + BRICK_GAP);
      ctx.fillStyle = ROW_COLORS[b.r % ROW_COLORS.length];
      ctx.globalAlpha = b.hp > 1 ? 1 : 0.75;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fillRect(bx, by, BRICK_W, BRICK_H);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    ctx.fillStyle = "#2ee6d6";
    ctx.shadowColor = "#2ee6d6"; ctx.shadowBlur = 8;
    ctx.fillRect(paddleX, H - 22, PADDLE_W, PADDLE_H);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#fff"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
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
    overlayMsg.textContent = "Score final : " + score + " — appuie sur une touche pour rejouer";
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

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "BRICK BREAKER";
  overlayMsg.textContent = "Q/D ou fleches pour deplacer la raquette. Appuie pour demarrer";
  overlay.classList.add("show");
})();
