(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-pong";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = 700, H = 440;
  canvas.width = W; canvas.height = H;

  const PADDLE_W = 10, PADDLE_H = 80, PADDLE_SPEED = 6;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elSpeedToggle = document.getElementById("adaptiveSpeed");
  const elMode = document.getElementById("modeSelect");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let p1y, p2y, ball, score1, score2, elapsedSeconds = 0, timerId = null, running = false, loopId = null;
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

  function resetBall(direction) {
    ball = { x: W / 2, y: H / 2, vx: 4.5 * direction, vy: (Math.random() * 4 - 2) };
  }

  function resetState() {
    p1y = H / 2 - PADDLE_H / 2;
    p2y = H / 2 - PADDLE_H / 2;
    score1 = 0; score2 = 0;
    elScore.textContent = "0 — 0";
    resetBall(Math.random() < 0.5 ? 1 : -1);
  }

  function update() {
    if (keys["z"] || keys["Z"] || keys["w"] || keys["W"]) p1y -= PADDLE_SPEED;
    if (keys["s"] || keys["S"]) p1y += PADDLE_SPEED;
    p1y = Math.max(0, Math.min(H - PADDLE_H, p1y));

    if (elMode.value === "ai") {
      const target = ball.y - PADDLE_H / 2;
      const aiSpeed = PADDLE_SPEED * 0.82;
      if (p2y < target) p2y = Math.min(p2y + aiSpeed, target);
      else if (p2y > target) p2y = Math.max(p2y - aiSpeed, target);
    } else {
      if (keys["ArrowUp"]) p2y -= PADDLE_SPEED;
      if (keys["ArrowDown"]) p2y += PADDLE_SPEED;
    }
    p2y = Math.max(0, Math.min(H - PADDLE_H, p2y));

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y <= 6 || ball.y >= H - 6) ball.vy *= -1;

    // raquette gauche
    if (ball.x <= PADDLE_W + 8 && ball.y >= p1y && ball.y <= p1y + PADDLE_H && ball.vx < 0) {
      ball.vx *= elSpeedToggle.checked ? -1.08 : -1;
      const hitPos = (ball.y - (p1y + PADDLE_H / 2)) / (PADDLE_H / 2);
      ball.vy = hitPos * 5;
    }
    // raquette droite
    if (ball.x >= W - PADDLE_W - 8 && ball.y >= p2y && ball.y <= p2y + PADDLE_H && ball.vx > 0) {
      ball.vx *= elSpeedToggle.checked ? -1.08 : -1;
      const hitPos = (ball.y - (p2y + PADDLE_H / 2)) / (PADDLE_H / 2);
      ball.vy = hitPos * 5;
    }

    if (ball.x < 0) { score2++; pointScored(); }
    if (ball.x > W) { score1++; pointScored(); }
  }

  function pointScored() {
    elScore.textContent = score1 + " — " + score2;
    if (score1 >= 5 || score2 >= 5) return matchOver();
    resetBall(ball.x < 0 ? 1 : -1);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(46,230,214,0.15)";
    ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#2ee6d6"; ctx.shadowColor = "#2ee6d6"; ctx.shadowBlur = 8;
    ctx.fillRect(8, p1y, PADDLE_W, PADDLE_H);
    ctx.fillStyle = "#ff3d9a"; ctx.shadowColor = "#ff3d9a";
    ctx.fillRect(W - 8 - PADDLE_W, p2y, PADDLE_W, PADDLE_H);

    ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop() { update(); draw(); }

  function matchOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score1);
    refreshStatsPanel();
    const winner = score1 > score2 ? "JOUEUR 1" : (elMode.value === "ai" ? "L'IA" : "JOUEUR 2");
    overlayTitle.textContent = winner + " GAGNE";
    overlayMsg.textContent = "Score final : " + score1 + " — " + score2 + " — appuie sur une touche pour rejouer";
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
    if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    const setHeld = (val) => { if (dir === "up") keys["z"] = val; if (dir === "down") keys["s"] = val; };
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) return startGame(); setHeld(true); }, { passive: false });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); setHeld(false); }, { passive: false });
  });

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "PONG VECTOR";
  overlayMsg.textContent = "Z/S pour bouger (joueur 1), Fleches pour joueur 2. Appuie sur une touche pour demarrer";
  overlay.classList.add("show");
})();
