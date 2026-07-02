(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-demineur";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const grid = document.getElementById("mineGrid");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elMines = document.getElementById("hudMinesLeft");
  const sizeInput = document.getElementById("gridSize");
  const minesInput = document.getElementById("mineCount");
  const newGameBtn = document.getElementById("newGameBtn");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let size, mineCount, cells, revealedCount, flagsLeft, running, elapsedSeconds = 0, timerId = null;

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

  function idx(x, y) { return y * size + x; }

  function neighbors(x, y) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) out.push({ x: nx, y: ny });
    }
    return out;
  }

  function buildBoard(safeX, safeY) {
    cells = Array.from({ length: size * size }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }));
    let placed = 0;
    while (placed < mineCount) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      if ((x === safeX && y === safeY) || cells[idx(x, y)].mine) continue;
      cells[idx(x, y)].mine = true;
      placed++;
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (cells[idx(x, y)].mine) continue;
      cells[idx(x, y)].count = neighbors(x, y).filter((n) => cells[idx(n.x, n.y)].mine).length;
    }
  }

  function render() {
    grid.style.gridTemplateColumns = "repeat(" + size + ", 26px)";
    grid.innerHTML = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = cells[idx(x, y)];
        const div = document.createElement("div");
        div.className = "mine-cell" + (c.revealed ? " revealed" : "") + (c.flagged ? " flagged" : "") + (c.revealed && c.mine ? " mine" : "");
        if (c.revealed && c.mine) div.textContent = "💣";
        else if (c.revealed && c.count > 0) { div.textContent = c.count; div.dataset.count = c.count; }
        else if (c.flagged) div.textContent = "🚩";
        div.addEventListener("click", () => handleReveal(x, y));
        div.addEventListener("contextmenu", (e) => { e.preventDefault(); handleFlag(x, y); });
        let pressTimer;
        div.addEventListener("touchstart", (e) => { pressTimer = setTimeout(() => handleFlag(x, y), 420); }, { passive: true });
        div.addEventListener("touchend", (e) => {
          clearTimeout(pressTimer);
        });
        grid.appendChild(div);
      }
    }
  }

  let firstClick = true;

  function handleReveal(x, y) {
    if (!running) return;
    const c = cells[idx(x, y)];
    if (c.revealed || c.flagged) return;

    if (firstClick) { buildBoard(x, y); firstClick = false; }

    revealCell(x, y);
    render();
    checkWin();
  }

  function revealCell(x, y) {
    const c = cells[idx(x, y)];
    if (c.revealed || c.flagged) return;
    c.revealed = true;
    revealedCount++;
    if (c.mine) return gameOver(false);
    if (c.count === 0) neighbors(x, y).forEach((n) => revealCell(n.x, n.y));
  }

  function handleFlag(x, y) {
    if (!running) return;
    const c = cells[idx(x, y)];
    if (c.revealed) return;
    c.flagged = !c.flagged;
    flagsLeft += c.flagged ? -1 : 1;
    elMines.textContent = flagsLeft;
    render();
  }

  function checkWin() {
    const totalSafe = size * size - mineCount;
    if (revealedCount >= totalSafe) gameOver(true);
  }

  function gameOver(won) {
    running = false;
    stopTimer();
    const finalScore = won ? Math.max(10, (size * size) - Math.round(elapsedSeconds)) : 0;
    saveScore(finalScore);
    refreshStatsPanel();

    cells.forEach((c) => { if (c.mine) c.revealed = true; });
    render();

    overlayTitle.textContent = won ? "GRILLE DECRYPTEE" : "BOOM";
    overlayMsg.textContent = won
      ? "Score : " + finalScore + " — appuie pour rejouer"
      : "Mine touchee — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    size = Math.max(6, Math.min(20, parseInt(sizeInput.value, 10) || 10));
    const maxMines = Math.floor(size * size * 0.35);
    mineCount = Math.max(3, Math.min(maxMines, parseInt(minesInput.value, 10) || 12));
    sizeInput.value = size;
    minesInput.value = mineCount;

    cells = Array.from({ length: size * size }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }));
    revealedCount = 0;
    flagsLeft = mineCount;
    elMines.textContent = flagsLeft;
    firstClick = true;
    running = true;
    render();
    refreshStatsPanel();
    startTimer();
  }

  newGameBtn.addEventListener("click", startGame);
  overlay.addEventListener("click", () => { if (!running) startGame(); });

  size = 10; mineCount = 12;
  cells = Array.from({ length: size * size }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }));
  render();
  refreshStatsPanel();
  overlayTitle.textContent = "CYBER DEMINEUR";
  overlayMsg.textContent = "Clic gauche pour reveler, clic droit (ou appui long) pour marquer. Appuie pour demarrer";
  overlay.classList.add("show");
})();
