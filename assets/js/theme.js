import { load, save } from "./storage.js";

const THEME_KEY = "theme";
const VALID = new Set(["light", "dark"]);

/**
 * @returns {"light" | "dark" | "system"}
 */
export function getStoredTheme() {
  const stored = load(THEME_KEY);
  if (VALID.has(stored)) return stored;
  return "system";
}

/**
 * Resolve the effective theme for the current environment.
 * @param {"light" | "dark" | "system"} preference
 * @returns {"light" | "dark"}
 */
export function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

/**
 * @param {"light" | "dark"} theme
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Toggle between light and dark, persisting the explicit choice.
 * @returns {"light" | "dark"}
 */
export function toggleTheme() {
  const current = resolveTheme(getStoredTheme());
  const next = current === "dark" ? "light" : "dark";
  save(THEME_KEY, next);
  applyTheme(next);
  return next;
}

/**
 * Initialize theme from storage / system preference and wire the toggle.
 */
export function initTheme() {
  const preference = getStoredTheme();
  if (preference === "light" || preference === "dark") {
    applyTheme(preference);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  button.addEventListener("click", () => {
    const next = toggleTheme();
    button.setAttribute("aria-label", `Switch to ${next === "dark" ? "light" : "dark"} theme`);
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getStoredTheme() === "system") {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(onChange);
  }
}
