/* Early theme bootstrap to reduce incorrect-theme flash. Classic script (not a module). */
(function () {
  try {
    var raw = localStorage.getItem("vapor.theme");
    if (!raw) return;
    var theme = JSON.parse(raw);
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {
    /* Storage unavailable — rely on prefers-color-scheme. */
  }
})();
