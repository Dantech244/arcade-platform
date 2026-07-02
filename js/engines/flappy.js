(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-flappy";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = 480, H = 560;
  canvas.width = W; canvas.height = H;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const GRAVITY = 0.45, FLAP = -8, BIRD_R = 12, PIPE_W = 56;
  let GAP = 158;
  let SPEED = 2.6;

  let bird, pipes, score, elapsedSeconds = 0, timerId = null, running = false, loopId = null, frame = 0;

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

  function resetState() {
    bird = { x: 110, y: H / 2, vy: 0 };
    pipes = [];
    score = 0;
    GAP = 158; SPEED = 2.6;
    elScore.textContent = "0";
    spawnPipe(W + 100);
  }

  function spawnPipe(x) {
    const margin = 60;
    const top = margin + Math.random() * (H - GAP - margin * 2);
    pipes.push({ x, top, passed: false });
  }

  function flap() {
    if (!running) return;
    bird.vy = FLAP;
  }

  function update() {
    bird.vy += GRAVITY;
    bird.y += bird.vy;

    if (bird.y - BIRD_R <= 0) { bird.y = BIRD_R; bird.vy = 0; }
    if (bird.y + BIRD_R >= H) return crash();

    pipes.forEach((p) => (p.x -= SPEED));
    if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
    if (pipes.length === 0 || pipes[pipes.length - 1].x < W - 230) spawnPipe(W);

    pipes.forEach((p) => {
      const withinX = bird.x + BIRD_R > p.x && bird.x - BIRD_R < p.x + PIPE_W;
      const withinGap = bird.y - BIRD_R > p.top && bird.y + BIRD_R < p.top + GAP;
      if (withinX && !withinGap) crash();

      if (!p.passed && p.x + PIPE_W < bird.x) {
        p.passed = true;
        score++;
        elScore.textContent = score;
        // resserre les tubes progressivement : plus dur au fil du score
        GAP = Math.max(112, 158 - Math.floor(score / 4) * 4);
        SPEED = Math.min(5.2, 2.6 + Math.floor(score / 5) * 0.25);
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#2ee6d6";
    ctx.shadowColor = "#2ee6d6"; ctx.shadowBlur = 8;
    pipes.forEach((p) => {
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      ctx.fillRect(p.x, p.top + GAP, PIPE_W, H - (p.top + GAP));
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffcf4d";
    ctx.shadowColor = "#ffcf4d"; ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, BIRD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop() { update(); draw(); }

  function crash() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "SIGNAL PERDU";
    overlayMsg.textContent = "Score final : " + score + " — appuie/tape/clique pour rejouer";
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
    if (e.key === " " || e.key === "ArrowUp" || e.key === "z" || e.key === "Z") {
      e.preventDefault();
      if (!running) startGame();
      else flap();
    }
  });

  canvas.addEventListener("mousedown", () => { if (!running) startGame(); else flap(); });
  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); if (!running) startGame(); else flap(); }, { passive: false });
  overlay.addEventListener("click", () => { if (!running) startGame(); });

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "FLAPPY SIGNAL";
  overlayMsg.textContent = "ESPACE / Z / clic / tap pour voler. Les tubes se resserrent avec le score";
  overlay.classList.add("show");
})();
