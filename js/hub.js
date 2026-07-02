(function () {
  "use strict";

  const THEME_KEY = "retroforge-theme";
  const PLAYTIME_KEY = "retroforge-playtime-total";

  const boot = document.getElementById("boot-sequence");
  if (boot) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReduced ? 0 : 2400;
    setTimeout(() => boot.remove(), delay);
  }

  const themeSelect = document.getElementById("themeSelect");

  function applyTheme(theme) {
    if (theme && theme !== "default") {
      document.body.setAttribute("data-theme", theme);
    } else {
      document.body.removeAttribute("data-theme");
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "default";
    applyTheme(saved);
    if (themeSelect) themeSelect.value = saved;
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      const value = themeSelect.value;
      localStorage.setItem(THEME_KEY, value);
      applyTheme(value);
    });
  }

  const configBtn = document.getElementById("configBtn");
  const modal = document.getElementById("configModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const resetScoresBtn = document.getElementById("resetScoresBtn");

  function openModal() {
    if (!modal) return;
    modal.classList.add("open");
    if (themeSelect) themeSelect.focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    if (configBtn) configBtn.focus();
  }

  if (configBtn) configBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  }
  document.addEventListener("keydown", (e) => {
    if (modal && e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  if (resetScoresBtn) {
    resetScoresBtn.addEventListener("click", () => {
      const confirmed = confirm("Effacer tous les scores et statistiques de toutes les cabines ?");
      if (!confirmed) return;
      Object.keys(localStorage)
        .filter((k) => k.startsWith("scores-history-"))
        .forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(PLAYTIME_KEY);
      refreshGlobalStats();
    });
  }

  const statGames = document.getElementById("statGames");
  const statTime = document.getElementById("statTime");

  function refreshGlobalStats() {
    let totalGames = 0;
    Object.keys(localStorage)
      .filter((k) => k.startsWith("scores-history-"))
      .forEach((k) => {
        try {
          const arr = JSON.parse(localStorage.getItem(k));
          if (Array.isArray(arr)) totalGames += arr.length;
        } catch (e) { /* cle corrompue, on ignore */ }
      });
    const totalMinutes = parseInt(localStorage.getItem(PLAYTIME_KEY), 10) || 0;
    if (statGames) statGames.textContent = totalGames;
    if (statTime) statTime.textContent = totalMinutes + " min";
  }

  loadTheme();
  refreshGlobalStats();
})();
