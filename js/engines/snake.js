(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-snake";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const CELL = 20;
  const COLS = 28;
  const ROWS = 22;
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elSpeedToggle = document.getElementById("adaptiveSpeed");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let snake, dir, nextDir, food, score, baseInterval, currentInterval;
  let loopId = null;
  let elapsedSeconds = 0;
  let timerId = null;
  let running = false;

  function getHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }

  function saveScore(value) {
    const history = getHistory();
    history.push(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function addPlaytime(minutes) {
    const total = parseInt(localStorage.getItem(PLAYTIME_KEY), 10) || 0;
    localStorage.setItem(PLAYTIME_KEY, String(total + minutes));
  }

  function refreshStatsPanel() {
    const history = getHistory();
    const best = history.length ? Math.max(...history) : 0;
    const avg = history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : 0;
    elBest.textContent = best;
    elAvg.textContent = avg;
  }

  function startTimer() {
    elapsedSeconds = 0;
    elTime.textContent = "0:00";
    timerId = setInterval(() => {
      elapsedSeconds++;
      const m = Math.floor(elapsedSeconds / 60);
      const s = elapsedSeconds % 60;
      elTime.textContent = m + ":" + String(s).padStart(2, "0");
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerId);
    const minutes = Math.round(elapsedSeconds / 60);
    if (minutes > 0) addPlaytime(minutes);
  }

  function randomFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function resetState() {
    snake = [{ x: 6, y: 11 }, { x: 5, y: 11 }, { x: 4, y: 11 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food = randomFood();
    score = 0;
    baseInterval = 130;
    currentInterval = baseInterval;
    elScore.textContent = "0";
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
        snake.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      elScore.textContent = score;
      food = randomFood();
      if (elSpeedToggle.checked) {
        const palier = Math.floor(score / 5);
        currentInterval = Math.max(55, baseInterval - palier * 8);
        restartLoop();
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function restartLoop() {
    clearInterval(loopId);
    loopId = setInterval(tick, currentInterval);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(46,230,214,0.05)";
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = "#ff3d9a";
    ctx.shadowColor = "#ff3d9a";
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
    ctx.shadowBlur = 0;

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#aef9f0" : "#2ee6d6";
      ctx.shadowColor = "#2ee6d6";
      ctx.shadowBlur = i === 0 ? 12 : 4;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.shadowBlur = 0;
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "GAME OVER";
    overlayMsg.textContent = "Score final : " + score + " — appuie sur une touche ou tape l'ecran pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    resetState();
    draw();
    refreshStatsPanel();
    running = true;
    restartLoop();
    startTimer();
  }

  const KEYS = {
    z: { x: 0, y: -1 }, w: { x: 0, y: -1 }, ArrowUp: { x: 0, y: -1 },
    s: { x: 0, y: 1 }, ArrowDown: { x: 0, y: 1 },
    q: { x: -1, y: 0 }, a: { x: -1, y: 0 }, ArrowLeft: { x: -1, y: 0 },
    d: { x: 1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  };

  function handleDirection(newDir) {
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    nextDir = newDir;
  }

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    const mapped = KEYS[e.key];
    if (mapped) { e.preventDefault(); handleDirection(mapped); }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!running) return startGame();
      handleDirection(map[btn.getAttribute("data-dir")]);
    }, { passive: false });
    btn.addEventListener("click", () => {
      if (!running) return startGame();
      handleDirection(map[btn.getAttribute("data-dir")]);
    });
  });

  resetState();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "SNAKE PROTOCOL";
  overlayMsg.textContent = "Appuie sur une touche, ESPACE, ou tape l'ecran pour demarrer";
  overlay.classList.add("show");
})();
