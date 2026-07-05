(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-moles";
  const PLAYTIME_KEY = "retroforge-playtime-total";
  const ROUND_SECONDS = 45;
  const HOLE_COUNT = 9;

  const boardEl = document.getElementById("molesBoard");
  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  let holes, score, timeLeft, running = false, roundTimerId = null, spawnTimerId = null, activeHole = -1, hideTimerId = null;

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

  function render() {
    boardEl.innerHTML = "";
    holes = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
      const hole = document.createElement("button");
      hole.className = "mole-hole";
      hole.addEventListener("click", () => whack(i));
      boardEl.appendChild(hole);
      holes.push(hole);
    }
  }

  function whack(i) {
    if (!running) return;
    if (i !== activeHole) return;
    holes[i].classList.remove("up");
    activeHole = -1;
    clearTimeout(hideTimerId);
    score += 10;
    elScore.textContent = score;
  }

  function spawnMole() {
    if (!running) return;
    if (activeHole !== -1) holes[activeHole].classList.remove("up");
    let next;
    do { next = Math.floor(Math.random() * HOLE_COUNT); } while (next === activeHole && HOLE_COUNT > 1);
    activeHole = next;
    holes[activeHole].classList.add("up");

    // vitesse adaptative : la taupe reste moins longtemps quand le score augmente
    const upDuration = Math.max(420, 1000 - score * 4);
    hideTimerId = setTimeout(() => {
      if (activeHole === next) { holes[next].classList.remove("up"); activeHole = -1; }
    }, upDuration);

    const nextSpawnDelay = Math.max(500, 950 - score * 3);
    spawnTimerId = setTimeout(spawnMole, nextSpawnDelay);
  }

  function tickRound() {
    timeLeft--;
    elTime.textContent = "0:" + String(timeLeft).padStart(2, "0");
    if (timeLeft <= 0) endRound();
  }

  function endRound() {
    running = false;
    clearInterval(roundTimerId);
    clearTimeout(spawnTimerId);
    clearTimeout(hideTimerId);
    if (activeHole !== -1) holes[activeHole].classList.remove("up");
    const minutes = Math.round(ROUND_SECONDS / 60);
    if (minutes > 0) addPlaytime(minutes);
    saveScore(score);
    refreshStatsPanel();
    overlayTitle.textContent = "TEMPS ECOULE";
    overlayMsg.textContent = "Score final : " + score + " — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    score = 0;
    timeLeft = ROUND_SECONDS;
    elScore.textContent = "0";
    elTime.textContent = "0:" + String(timeLeft).padStart(2, "0");
    render();
    refreshStatsPanel();
    running = true;
    roundTimerId = setInterval(tickRound, 1000);
    spawnMole();
  }

  overlay.addEventListener("click", () => { if (!running) startGame(); });
  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) startGame();
  });

  render();
  refreshStatsPanel();
  overlayTitle.textContent = "CYBER MOLES";
  overlayMsg.textContent = "45 secondes pour taper un maximum de taupes. Appuie pour demarrer";
  overlay.classList.add("show");
})();
