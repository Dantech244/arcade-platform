(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-connect4";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const COLS = 7, ROWS = 6, CELL = 64;
  canvas.width = COLS * CELL;
  canvas.height = (ROWS + 1) * CELL; // rangee du haut pour l'indicateur de colonne

  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elTurn = document.getElementById("hudTurn");
  const modeSelect = document.getElementById("modeSelect");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const P1_COLOR = "#2ee6d6", P2_COLOR = "#ff3d9a";

  let board, currentPlayer, running = false, elapsedSeconds = 0, timerId = null, hoverCol = -1, aiThinking = false;

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

  function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }

  function dropDisc(b, col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === 0) { b[r][col] = player; return r; }
    }
    return -1;
  }

  function columnFull(col) { return board[0][col] !== 0; }
  function boardFull() { for (let c = 0; c < COLS; c++) if (!columnFull(c)) return false; return true; }

  function checkWin(b, player) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r][c+1] === player && b[r][c+2] === player && b[r][c+3] === player) return true;
    }
    for (let c = 0; c < COLS; c++) for (let r = 0; r <= ROWS - 4; r++) {
      if (b[r][c] === player && b[r+1][c] === player && b[r+2][c] === player && b[r+3][c] === player) return true;
    }
    for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r+1][c+1] === player && b[r+2][c+2] === player && b[r+3][c+3] === player) return true;
    }
    for (let r = 3; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) {
      if (b[r][c] === player && b[r-1][c+1] === player && b[r-2][c+2] === player && b[r-3][c+3] === player) return true;
    }
    return false;
  }

  function findCriticalMove(b, player) {
    for (let c = 0; c < COLS; c++) {
      if (columnFullOn(b, c)) continue;
      const test = b.map((r) => r.slice());
      dropDisc(test, c, player);
      if (checkWin(test, player)) return c;
    }
    return -1;
  }
  function columnFullOn(b, c) { return b[0][c] !== 0; }

  function aiMove() {
    // 1. gagner immediatement si possible
    let col = findCriticalMove(board, 2);
    // 2. sinon bloquer le joueur
    if (col === -1) col = findCriticalMove(board, 1);
    // 3. sinon jouer plutot vers le centre (pondere)
    if (col === -1) {
      const weights = [1, 2, 3, 4, 3, 2, 1];
      const candidates = [];
      for (let c = 0; c < COLS; c++) if (!columnFull(c)) for (let w = 0; w < weights[c]; w++) candidates.push(c);
      col = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : -1;
    }
    if (col === -1) return;
    playMove(col);
  }

  function playMove(col) {
    if (!running || columnFull(col)) return;
    const row = dropDisc(board, col, currentPlayer);
    draw();
    if (checkWin(board, currentPlayer)) return finishGame(currentPlayer);
    if (boardFull()) return finishGame(0);

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnLabel();

    if (modeSelect.value === "ai" && currentPlayer === 2) {
      aiThinking = true;
      setTimeout(() => { aiThinking = false; aiMove(); }, 550);
    }
  }

  function updateTurnLabel() {
    if (modeSelect.value === "ai") {
      elTurn.textContent = currentPlayer === 1 ? "Toi" : "IA";
    } else {
      elTurn.textContent = currentPlayer === 1 ? "Joueur 1" : "Joueur 2";
    }
  }

  function finishGame(winner) {
    running = false;
    stopTimer();
    let scoreValue;
    let message;
    if (winner === 0) {
      scoreValue = 50;
      message = "Match nul !";
    } else if (modeSelect.value === "ai") {
      scoreValue = winner === 1 ? 100 : 0;
      message = winner === 1 ? "Tu gagnes !" : "L'IA gagne !";
    } else {
      scoreValue = 100;
      message = (winner === 1 ? "Joueur 1" : "Joueur 2") + " gagne !";
    }
    saveScore(scoreValue);
    refreshStatsPanel();
    overlayTitle.textContent = message;
    overlayMsg.textContent = "Appuie sur une touche pour rejouer";
    overlay.classList.add("show");
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hoverCol >= 0 && running && !aiThinking && !columnFull(hoverCol)) {
      ctx.fillStyle = currentPlayer === 1 ? P1_COLOR : P2_COLOR;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(hoverCol * CELL + CELL / 2, CELL / 2, CELL / 2 - 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "#0d0a18";
    ctx.fillRect(0, CELL, canvas.width, canvas.height - CELL);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = c * CELL + CELL / 2;
        const cy = (r + 1) * CELL + CELL / 2;
        const v = board[r][c];
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 - 6, 0, Math.PI * 2);
        if (v === 0) {
          ctx.fillStyle = "#1a1430";
        } else {
          ctx.fillStyle = v === 1 ? P1_COLOR : P2_COLOR;
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  function colFromX(x) { return Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))); }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    hoverCol = colFromX((e.clientX - rect.left) * scale);
    draw();
  });
  canvas.addEventListener("mouseleave", () => { hoverCol = -1; draw(); });
  canvas.addEventListener("click", (e) => {
    if (!running) return startGame();
    if (aiThinking) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const col = colFromX((e.clientX - rect.left) * scale);
    playMove(col);
  });
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!running) return startGame();
    if (aiThinking) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const col = colFromX((e.touches[0].clientX - rect.left) * scale);
    playMove(col);
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    if (!running || aiThinking) return;
    const numKeys = ["1","2","3","4","5","6","7"];
    const idx = numKeys.indexOf(e.key);
    if (idx !== -1) playMove(idx);
  });

  overlay.addEventListener("click", (e) => { e.stopPropagation(); if (!running) startGame(); });

  function startGame() {
    overlay.classList.remove("show");
    board = emptyBoard();
    currentPlayer = 1;
    updateTurnLabel();
    draw();
    refreshStatsPanel();
    running = true;
    startTimer();
  }

  board = emptyBoard();
  currentPlayer = 1;
  updateTurnLabel();
  draw();
  refreshStatsPanel();
  overlayTitle.textContent = "PUISSANCE 4";
  overlayMsg.textContent = "Choisis ton mode puis clique/tape une colonne pour demarrer";
  overlay.classList.add("show");
})();
