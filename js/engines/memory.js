(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-memory";
  const PLAYTIME_KEY = "retroforge-playtime-total";
  const ICONS = ["🐍","🧱","🏓","💣","👻","🧩","👾","🐸","🐦","☄️","🕹️","💎","🔥","⚡","🌙","⭐"];

  const boardEl = document.getElementById("memoryBoard");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const elMoves = document.getElementById("hudMoves");
  const sizeSelect = document.getElementById("sizeSelect");
  const newGameBtn = document.getElementById("newGameBtn");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let cards, moves, matchedCount, flipped, lockBoard, elapsedSeconds = 0, timerId = null, running = false;

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

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function buildDeck(pairCount) {
    const chosen = ICONS.slice(0, pairCount);
    const deck = shuffle([...chosen, ...chosen]);
    return deck.map((icon, i) => ({ id: i, icon, matched: false }));
  }

  function render() {
    const cols = cards.length <= 16 ? 4 : 6;
    boardEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    boardEl.innerHTML = "";
    cards.forEach((c, i) => {
      const div = document.createElement("div");
      const isFlipped = flipped.includes(i);
      div.className = "mem-card" + (isFlipped || c.matched ? " flipped" : "") + (c.matched ? " matched" : "");
      div.textContent = (isFlipped || c.matched) ? c.icon : "";
      div.addEventListener("click", () => handleFlip(i));
      boardEl.appendChild(div);
    });
  }

  function handleFlip(i) {
    if (!running || lockBoard) return;
    if (flipped.includes(i) || cards[i].matched) return;
    flipped.push(i);
    render();
    if (flipped.length === 2) {
      moves++;
      elMoves.textContent = moves;
      lockBoard = true;
      const [a, b] = flipped;
      if (cards[a].icon === cards[b].icon) {
        cards[a].matched = true;
        cards[b].matched = true;
        matchedCount += 2;
        flipped = [];
        lockBoard = false;
        render();
        if (matchedCount === cards.length) finishGame();
      } else {
        setTimeout(() => {
          flipped = [];
          lockBoard = false;
          render();
        }, 750);
      }
    }
  }

  function finishGame() {
    running = false;
    stopTimer();
    const pairs = cards.length / 2;
    const score = Math.max(0, Math.round(pairs * 120 - moves * 8 - elapsedSeconds * 3));
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "GRILLE COMPLETE";
    overlayMsg.textContent = "Score : " + score + " en " + moves + " coups — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    const pairCount = parseInt(sizeSelect.value, 10);
    cards = buildDeck(pairCount);
    moves = 0; matchedCount = 0; flipped = []; lockBoard = false;
    elMoves.textContent = "0";
    render();
    refreshStatsPanel();
    running = true;
    startTimer();
  }

  newGameBtn.addEventListener("click", startGame);
  overlay.addEventListener("click", () => { if (!running) startGame(); });

  cards = buildDeck(parseInt(sizeSelect.value, 10));
  flipped = [];
  render();
  refreshStatsPanel();
  overlayTitle.textContent = "CYBER MEMORY";
  overlayMsg.textContent = "Retrouve les paires. Choisis ta difficulte puis appuie pour demarrer";
  overlay.classList.add("show");
})();
