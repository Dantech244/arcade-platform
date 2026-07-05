(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-2048";
  const PLAYTIME_KEY = "retroforge-playtime-total";
  const SIZE = 4;

  const boardEl = document.getElementById("board2048");
  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const TILE_COLORS = {
    2: "#241c3d", 4: "#2a2354", 8: "#2ee6d6", 16: "#26c9bb",
    32: "#ff3d9a", 64: "#e0338a", 128: "#ffcf4d", 256: "#f0bd2f",
    512: "#4dff7a", 1024: "#38d666", 2048: "#ffffff",
  };

  let board, score, elapsedSeconds = 0, timerId = null, running = false;

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

  function emptyBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }

  function emptyCells() {
    const cells = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (board[y][x] === 0) cells.push({ x, y });
    return cells;
  }

  function addRandomTile() {
    const cells = emptyCells();
    if (cells.length === 0) return;
    const cell = cells[Math.floor(Math.random() * cells.length)];
    board[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideRow(row) {
    let arr = row.filter((v) => v !== 0);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gained += arr[i];
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < row.length) arr.push(0);
    return { row: arr, gained };
  }

  function transpose(b) { return b[0].map((_, c) => b.map((r) => r[c])); }
  function reverseRows(b) { return b.map((r) => r.slice().reverse()); }

  function move(dir) {
    let b = board.map((r) => r.slice());
    let gained = 0;
    let transformed = false;

    if (dir === "up" || dir === "down") { b = transpose(b); transformed = true; }
    if (dir === "right" || dir === "down") { b = reverseRows(b); }

    const before = JSON.stringify(b);
    b = b.map((row) => {
      const res = slideRow(row);
      gained += res.gained;
      return res.row;
    });
    const moved = before !== JSON.stringify(b);

    if (dir === "right" || dir === "down") { b = reverseRows(b); }
    if (transformed) { b = transpose(b); }

    if (moved) {
      board = b;
      score += gained;
      elScore.textContent = score;
      addRandomTile();
      render();
      if (!hasMovesLeft()) gameOver();
    }
  }

  function hasMovesLeft() {
    if (emptyCells().length > 0) return true;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = board[y][x];
        if (x < SIZE - 1 && board[y][x + 1] === v) return true;
        if (y < SIZE - 1 && board[y + 1][x] === v) return true;
      }
    }
    return false;
  }

  function render() {
    boardEl.innerHTML = "";
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = board[y][x];
        const tile = document.createElement("div");
        tile.className = "tile2048" + (v ? " filled" : "");
        if (v) {
          tile.textContent = v;
          tile.style.background = TILE_COLORS[v] || "#ffffff";
          tile.style.color = v <= 4 ? "var(--text-main)" : "#0a0814";
          tile.style.fontSize = v >= 1024 ? "16px" : v >= 128 ? "19px" : "22px";
        }
        boardEl.appendChild(tile);
      }
    }
  }

  function gameOver() {
    running = false;
    stopTimer();
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "PLUS DE COUPS POSSIBLES";
    overlayMsg.textContent = "Score final : " + score + " — appuie sur une touche pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    board = emptyBoard();
    score = 0;
    elScore.textContent = "0";
    addRandomTile();
    addRandomTile();
    render();
    refreshStatsPanel();
    running = true;
    startTimer();
  }

  const DIR = {
    z: "up", w: "up", ArrowUp: "up",
    s: "down", ArrowDown: "down",
    q: "left", a: "left", ArrowLeft: "left",
    d: "right", ArrowRight: "right",
  };

  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    const mapped = DIR[e.key];
    if (mapped && running) { e.preventDefault(); move(mapped); }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  let touchStartX = 0, touchStartY = 0;
  boardEl.addEventListener("touchstart", (e) => {
    if (!running) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  boardEl.addEventListener("touchend", (e) => {
    if (!running) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  }, { passive: true });

  board = emptyBoard();
  score = 0;
  addRandomTile();
  addRandomTile();
  render();
  refreshStatsPanel();
  overlayTitle.textContent = "2048";
  overlayMsg.textContent = "ZQSD / fleches / glisser sur mobile. Appuie pour demarrer";
  overlay.classList.add("show");
})();
