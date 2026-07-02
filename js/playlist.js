/* =========================================================
   RETROFORGE — PLAYLIST.JS
   Detection automatique de assets/music/music1.mp3, music2.mp3...
   Lecture aleatoire en boucle, bouton "piste suivante", volume.
   Persistance de l'ordre, de la piste et de la position via localStorage.
   ========================================================= */

(function () {
  "use strict";

  const MAX_PROBE = 20;
  const PROBE_TIMEOUT = 1500;
  const BASE = (window.RETROFORGE_ASSET_BASE || "assets/") + "music/";

  const LS_ORDER = "rf-music-order";
  const LS_INDEX = "rf-music-index";
  const LS_PLAYING = "rf-music-playing";
  const LS_VOLUME = "rf-music-volume";
  const LS_COUNT = "rf-music-track-count";
  const LS_POSITION = "rf-music-position";

  function probeTrack(n) {
    return new Promise((resolve) => {
      const url = BASE + "music" + n + ".mp3";
      const audio = new Audio();
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        resolve(ok ? url : null);
      };
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () => finish(true), { once: true });
      audio.addEventListener("error", () => finish(false), { once: true });
      setTimeout(() => finish(false), PROBE_TIMEOUT);
      audio.src = url;
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  async function init() {
    const probes = [];
    for (let n = 1; n <= MAX_PROBE; n++) probes.push(probeTrack(n));
    const results = (await Promise.all(probes)).filter(Boolean);
    if (results.length === 0) return; // aucune piste trouvee, pas de widget

    let order = null;
    const savedCount = parseInt(localStorage.getItem(LS_COUNT), 10);
    if (savedCount === results.length) {
      try {
        const parsed = JSON.parse(localStorage.getItem(LS_ORDER));
        if (Array.isArray(parsed) && parsed.length === results.length) order = parsed;
      } catch (e) { /* ignore, on re-mélange */ }
    }
    if (!order) {
      order = shuffle(results.map((_, i) => i));
      localStorage.setItem(LS_ORDER, JSON.stringify(order));
      localStorage.setItem(LS_COUNT, String(results.length));
    }

    let index = parseInt(localStorage.getItem(LS_INDEX), 10);
    if (isNaN(index) || index < 0 || index >= order.length) index = 0;

    const savedVolume = localStorage.getItem(LS_VOLUME);
    const volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;
    const wantsPlaying = localStorage.getItem(LS_PLAYING) !== "false"; // actif par defaut

    buildPlayer(results, order, index, volume, wantsPlaying);
  }

  function buildPlayer(tracks, order, startIndex, volume, wantsPlaying) {
    let index = startIndex;
    const audio = new Audio();
    audio.volume = volume;

    const wrap = document.createElement("div");
    wrap.className = "music-player";
    wrap.innerHTML =
      '<button class="mp-btn" id="mpToggle" title="Lecture / Pause" aria-label="Lecture ou pause">▶</button>' +
      '<span class="mp-track" id="mpTrack">—</span>' +
      '<button class="mp-btn" id="mpNext" title="Piste suivante" aria-label="Piste suivante">⏭</button>' +
      '<input type="range" id="mpVolume" class="mp-volume" min="0" max="1" step="0.05" aria-label="Volume">';
    document.body.appendChild(wrap);

    const btnToggle = wrap.querySelector("#mpToggle");
    const btnNext = wrap.querySelector("#mpNext");
    const elTrack = wrap.querySelector("#mpTrack");
    const elVolume = wrap.querySelector("#mpVolume");
    elVolume.value = volume;

    function trackLabel(i) { return "Piste " + (i + 1) + "/" + order.length; }

    function loadTrack(i, resumePosition) {
      index = i;
      localStorage.setItem(LS_INDEX, String(index));
      audio.src = tracks[order[index]];
      elTrack.textContent = trackLabel(index);
      if (resumePosition) {
        const pos = parseFloat(localStorage.getItem(LS_POSITION));
        if (!isNaN(pos)) {
          audio.addEventListener("loadedmetadata", () => { audio.currentTime = pos; }, { once: true });
        }
      }
    }

    function play() {
      audio.play().then(() => {
        btnToggle.textContent = "⏸";
        localStorage.setItem(LS_PLAYING, "true");
      }).catch(() => {
        btnToggle.textContent = "▶";
      });
    }

    function pause() {
      audio.pause();
      btnToggle.textContent = "▶";
      localStorage.setItem(LS_PLAYING, "false");
    }

    function next() {
      const nextIndex = (index + 1) % order.length;
      loadTrack(nextIndex, false);
      play();
    }

    audio.addEventListener("ended", next);
    audio.addEventListener("timeupdate", () => {
      // sauvegarde legere de la position pour reprendre entre les pages
      if (Math.floor(audio.currentTime * 2) % 4 === 0) {
        localStorage.setItem(LS_POSITION, String(audio.currentTime));
      }
    });

    btnToggle.addEventListener("click", () => { if (audio.paused) play(); else pause(); });
    btnNext.addEventListener("click", next);
    elVolume.addEventListener("input", () => {
      audio.volume = parseFloat(elVolume.value);
      localStorage.setItem(LS_VOLUME, elVolume.value);
    });

    loadTrack(index, true);

    if (wantsPlaying) {
      audio.play().then(() => {
        btnToggle.textContent = "⏸";
      }).catch(() => {
        // lecture auto bloquee par le navigateur : on attend une premiere interaction
        btnToggle.textContent = "▶";
        const resume = () => {
          audio.play().then(() => {
            btnToggle.textContent = "⏸";
            localStorage.setItem(LS_PLAYING, "true");
          });
          document.removeEventListener("click", resume);
          document.removeEventListener("keydown", resume);
        };
        document.addEventListener("click", resume, { once: true });
        document.addEventListener("keydown", resume, { once: true });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
