import { initTheme } from "./theme.js";
import { initPwa } from "./pwa.js";

function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const open = panel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
}

function markCurrentNav() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    const url = new URL(href, window.location.href);
    const linkPath = url.pathname.replace(/\/$/, "") || "/";
    const isCurrent =
      linkPath === path ||
      (linkPath.endsWith("/index.html") && path.endsWith(linkPath.replace(/\/index\.html$/, "")));

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

initTheme();
initNav();
markCurrentNav();
initPwa();
