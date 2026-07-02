(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-tetris";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const COLS = 10, ROWS = 20, CELL = 24;
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elLevel = document.getElementById("hudLevel");
  const elSpeedToggle = document.getElementById("adaptiveSpeed");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const COLORS = { I: "#2ee6d6", O: "#ffcf4d", T: "#ff3d9a", S: "#4dff7a", Z: "#ff5e5e", J: "#4d7bff", L: "#ff9d4d" };

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
  };

  let board, current, score, lines, level, baseInterval, currentInterval;
  let loopId = null, elapsedSeconds = 0, timerId = null, running = false;

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

  function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }

  function rotateMatrix(m) {
    const n = m.length;
    const res = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) res[x][n - 1 - y] = m[y][x];
    return res;
  }

  function spawnPiece() {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const matrix = SHAPES[type].map((row) => row.slice());
    const piece = { type, matrix, x: Math.floor((COLS - matrix.length) / 2), y: -2 };
    if (collide(board, piece, { x: 0, y: 0 })) gameOver();
    return piece;
  }

  function collide(b, piece, offset) {
    const m = piece.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m.length; x++) {
        if (!m[y][x]) continue;
        const ny = piece.y + y + offset.y;
        const nx = piece.x + x + offset.x;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && b[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    const m = current.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m.length; x++) {
        if (!m[y][x]) continue;
        const ny = current.y + y, nx = current.x + x;
        if (ny >= 0) board[ny][nx] = current.type;
      }
    }
  }

  function sweep() {
    let cleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
      for (let x = 0; x < COLS; x++) if (!board[y][x]) continue outer;
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
    return cleared;
  }

  function applyLineScore(cleared) {
    if (!cleared) return;
    const table = { 1: 100, 2: 300, 3: 500, 4: 800 };
    score += (table[cleared] || 0) * level;
    lines += cleared;
    elScore.textContent = score;
    if (elSpeedToggle.checked) {
      level = 1 + Math.floor(lines / 10);
      currentInterval = Math.max(90, baseInterval - (level - 1) * 60);
      restartLoop();
    }
    elLevel.textContent = level;
  }

  function lockPiece() {
    // Regle du vrai Tetris : si une partie de la piece se verrouille encore
    // au-dessus du cadre visible (row < 0), c'est une defaite immediate.
    const m = current.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m.length; x++) {
        if (m[y][x] && current.y + y < 0) return gameOver();
      }
    }
    merge();
    const cleared = sweep();
    applyLineScore(cleared);
    current = spawnPiece();
  }

  function restartLoop() { clearInterval(loopId); loopId = setInterval(tick, currentInterval); }

  function tick() {
    if (!collide(board, current, { x: 0, y: 1 })) {
      current.y++;
    } else {
      lockPiece();
    }
    draw();
  }

  function move(dx) { if (!collide(board, current, { x: dx, y: 0 })) { current.x += dx; draw(); } }
  function softDrop() { if (!collide(board, current, { x: 0, y: 1 })) { current.y++; draw(); } else { lockPiece(); draw(); } }
  function hardDrop() { while (!collide(board, current, { x: 0, y: 1 })) current.y++; lockPiece(); draw(); }
  function rotate() {
    const rotated = rotateMatrix(current.matrix);
    const test = { ...current, matrix: rotated };
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collide(board, test, { x: kick, y: 0 })) { current.matrix = rotated; current.x += kick; draw(); return; }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(46,230,214,0.05)";
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke(); }

    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (board[y][x]) drawCell(x, y, COLORS[board[y][x]]);
    }
    const m = current.matrix;
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
      if (m[y][x] && current.y + y >= 0) drawCell(current.x + x, current.y + y, COLORS[current.type]);
    }
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    ctx.shadowBlur = 0;
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
    board = emptyBoard();
    score = 0; lines = 0; level = 1;
    baseInterval = 700; currentInterval = baseInterval;
    elScore.textContent = "0"; elLevel.textContent = "1";
    current = spawnPiece();
    draw();
    refreshStatsPanel();
    running = true;
    restartLoop();
    startTimer();
  }

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    if (!running) return;
    switch (e.key) {
      case "q": case "Q": case "ArrowLeft": e.preventDefault(); move(-1); break;
      case "d": case "D": case "ArrowRight": e.preventDefault(); move(1); break;
      case "s": case "S": case "ArrowDown": e.preventDefault(); softDrop(); break;
      case "z": case "Z": case "ArrowUp": case "w": case "W": e.preventDefault(); rotate(); break;
      case " ": e.preventDefault(); hardDrop(); break;
    }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  document.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (!running) return startGame();
      const dir = btn.getAttribute("data-dir");
      if (dir === "left") move(-1);
      if (dir === "right") move(1);
      if (dir === "down") softDrop();
      if (dir === "up") rotate();
    }, { passive: false });
    btn.addEventListener("click", () => {
      if (!running) return startGame();
      const dir = btn.getAttribute("data-dir");
      if (dir === "left") move(-1);
      if (dir === "right") move(1);
      if (dir === "down") softDrop();
      if (dir === "up") rotate();
    });
  });

  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); if (running) hardDrop(); }, { passive: false });
    btn.addEventListener("click", () => { if (running) hardDrop(); });
  });

  board = emptyBoard();
  score = 0; level = 1;
  current = spawnPiece();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "TETRIS MATRIX";
  overlayMsg.textContent = "ZQSD pour deplacer/tourner, ESPACE pour chute rapide. Appuie sur une touche pour demarrer";
  overlay.classList.add("show");
})();
