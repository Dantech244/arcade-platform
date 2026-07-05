(function () {
  "use strict";

  const STORAGE_KEY = "scores-history-sequence";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const elScore = document.getElementById("hudScore");
  const elBest = document.getElementById("hudBest");
  const elAvg = document.getElementById("hudAvg");
  const elTime = document.getElementById("hudTime");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayMsg = document.getElementById("overlayMsg");

  const pads = Array.from(document.querySelectorAll(".seq-pad"));

  let sequence, playerStep, level, accepting, elapsedSeconds = 0, timerId = null, running = false;

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

  function flash(padIndex, duration) {
    return new Promise((resolve) => {
      const pad = pads[padIndex];
      pad.classList.add("active");
      setTimeout(() => {
        pad.classList.remove("active");
        setTimeout(resolve, duration * 0.3);
      }, duration * 0.7);
    });
  }

  async function playSequence() {
    accepting = false;
    const speed = Math.max(280, 750 - level * 25);
    await new Promise((r) => setTimeout(r, 400));
    for (const idx of sequence) {
      await flash(idx, speed);
    }
    playerStep = 0;
    accepting = true;
  }

  function handlePadInput(padIndex) {
    if (!running || !accepting) return;
    const pad = pads[padIndex];
    pad.classList.add("active");
    setTimeout(() => pad.classList.remove("active"), 180);

    if (padIndex === sequence[playerStep]) {
      playerStep++;
      if (playerStep === sequence.length) {
        accepting = false;
        level++;
        elScore.textContent = level - 1;
        sequence.push(Math.floor(Math.random() * pads.length));
        setTimeout(playSequence, 500);
      }
    } else {
      failSequence();
    }
  }

  function failSequence() {
    running = false;
    accepting = false;
    stopTimer();
    const finalScore = (level - 1) * 10;
    saveScore(finalScore);
    refreshStatsPanel();
    overlayTitle.textContent = "SEQUENCE BRISEE";
    overlayMsg.textContent = "Niveau atteint : " + (level - 1) + " (score " + finalScore + ") — appuie pour rejouer";
    overlay.classList.add("show");
  }

  function startGame() {
    overlay.classList.remove("show");
    sequence = [Math.floor(Math.random() * pads.length)];
    level = 1;
    playerStep = 0;
    elScore.textContent = "0";
    refreshStatsPanel();
    running = true;
    startTimer();
    playSequence();
  }

  pads.forEach((pad, i) => {
    pad.addEventListener("click", () => handlePadInput(i));
  });

  const KEY_TO_PAD = { z: 0, ArrowUp: 0, q: 1, ArrowLeft: 1, d: 2, ArrowRight: 2, s: 3, ArrowDown: 3 };
  window.addEventListener("keydown", (e) => {
    if (!running && (e.key === " " || e.key === "Enter")) { startGame(); return; }
    const idx = KEY_TO_PAD[e.key];
    if (idx !== undefined) { e.preventDefault(); handlePadInput(idx); }
  });

  overlay.addEventListener("click", () => { if (!running) startGame(); });

  refreshStatsPanel();
  overlayTitle.textContent = "CYBER SEQUENCE";
  overlayMsg.textContent = "Regarde la sequence puis reproduis-la. ZQSD/fleches ou clic. Appuie pour demarrer";
  overlay.classList.add("show");
})();
