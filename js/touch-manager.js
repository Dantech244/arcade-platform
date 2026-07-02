const TouchManager = (function () {
  "use strict";
  const KEY_MAP = { up: "z", down: "s", left: "q", right: "d" };

  function fireKey(type, key) {
    const eventType = type === "down" ? "keydown" : "keyup";
    window.dispatchEvent(new KeyboardEvent(eventType, { key }));
  }

  function bind(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.querySelectorAll("[data-dir]").forEach((btn) => {
      const dir = btn.getAttribute("data-dir");
      const key = KEY_MAP[dir];
      if (!key) return;
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); fireKey("down", key); }, { passive: false });
      btn.addEventListener("touchend", (e) => { e.preventDefault(); fireKey("up", key); }, { passive: false });
    });
  }

  return { bind };
})();
