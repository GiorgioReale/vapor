import {
  calculateOhmsLaw,
  formatOhmValue,
  OHM_PAIRS,
} from "./calculators/ohms-law.js";
import { load, save, remove } from "./storage.js";

const STORAGE_KEY = "ohms-law";

const DEFAULTS = {
  pair: "VR",
  voltage: 3.7,
  current: "",
  resistance: 0.5,
  power: "",
};

const FIELD_META = {
  voltage: { label: "Voltage", unit: "V", name: "voltage" },
  current: { label: "Current", unit: "A", name: "current" },
  resistance: { label: "Resistance", unit: "Ω", name: "resistance" },
  power: { label: "Power", unit: "W", name: "power" },
};

/**
 * @param {HTMLFormElement} form
 */
function getPair(form) {
  const selected = form.querySelector('input[name="pair"]:checked');
  return selected ? selected.value : "VR";
}

/**
 * @param {HTMLFormElement} form
 */
function readForm(form) {
  const pair = getPair(form);
  const num = (name) => {
    const el = /** @type {HTMLInputElement | null} */ (
      form.elements.namedItem(name)
    );
    if (!el || el.disabled || el.value.trim() === "") return null;
    return Number(el.value);
  };

  return {
    pair,
    voltage: num("voltage"),
    current: num("current"),
    resistance: num("resistance"),
    power: num("power"),
  };
}

/**
 * @param {HTMLFormElement} form
 * @param {string} pairId
 */
function syncPairFields(form, pairId) {
  const pair = OHM_PAIRS.find((item) => item.id === pairId) || OHM_PAIRS[1];
  const active = new Set(pair.fields);

  for (const key of Object.keys(FIELD_META)) {
    const field = form.querySelector(`[data-field="${key}"]`);
    const input = /** @type {HTMLInputElement | null} */ (
      form.elements.namedItem(key)
    );
    if (!field || !input) continue;

    const enabled = active.has(key);
    field.hidden = !enabled;
    input.disabled = !enabled;
    if (!enabled) input.value = "";
  }
}

/**
 * @param {Record<string, unknown>} saved
 */
function loadSaved() {
  const saved = load(STORAGE_KEY);
  if (!saved || typeof saved !== "object") return { ...DEFAULTS };

  const next = { ...DEFAULTS };
  if (OHM_PAIRS.some((p) => p.id === saved.pair)) {
    next.pair = saved.pair;
  }

  for (const key of ["voltage", "current", "resistance", "power"]) {
    const value = saved[key];
    if (value === "" || value === null || value === undefined) {
      next[key] = "";
    } else if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = value;
    }
  }

  return next;
}

/**
 * @param {HTMLFormElement} form
 * @param {ReturnType<typeof loadSaved>} values
 */
function writeForm(form, values) {
  const pairInput = form.querySelector(
    `input[name="pair"][value="${values.pair}"]`
  );
  if (pairInput) /** @type {HTMLInputElement} */ (pairInput).checked = true;

  syncPairFields(form, values.pair);

  for (const key of ["voltage", "current", "resistance", "power"]) {
    const input = /** @type {HTMLInputElement | null} */ (
      form.elements.namedItem(key)
    );
    if (!input || input.disabled) continue;
    input.value =
      values[key] === "" || values[key] === null || values[key] === undefined
        ? ""
        : String(values[key]);
  }
}

/**
 * @param {ReturnType<typeof readForm>} data
 */
function persist(data) {
  const pair = OHM_PAIRS.find((item) => item.id === data.pair);
  const payload = {
    pair: data.pair,
    voltage: "",
    current: "",
    resistance: "",
    power: "",
  };

  if (pair) {
    for (const field of pair.fields) {
      payload[field] = data[field];
    }
  }

  save(STORAGE_KEY, payload);
}

/**
 * @param {import("./calculators/ohms-law.js").OhmResult} result
 * @param {HTMLElement} root
 */
function renderResults(result, root) {
  const alert = root.querySelector("[data-calc-alert]");
  const empty = root.querySelector("[data-results-empty]");
  const content = root.querySelector("[data-results-content]");
  const status = root.querySelector("[data-sr-status]");
  const copyBtn = /** @type {HTMLButtonElement | null} */ (
    root.querySelector("[data-copy-results]")
  );
  const formulas = root.querySelector("[data-formulas-used]");

  if (!result.ok) {
    if (alert) {
      alert.hidden = false;
      alert.className = "alert alert--danger";
      alert.textContent = result.errors[0] || "Invalid input.";
    }
    if (empty) empty.hidden = false;
    if (content) content.hidden = true;
    if (copyBtn) copyBtn.disabled = true;
    if (formulas) formulas.innerHTML = "";
    if (status) status.textContent = result.errors[0] || "Invalid input.";
    return;
  }

  if (alert) {
    alert.hidden = true;
    alert.textContent = "";
  }
  if (empty) empty.hidden = true;
  if (content) content.hidden = false;
  if (copyBtn) copyBtn.disabled = false;

  for (const key of ["voltage", "current", "resistance", "power"]) {
    const item = root.querySelector(`[data-result-item="${key}"]`);
    const valueEl = root.querySelector(`[data-result="${key}"]`);
    if (!item || !valueEl) continue;

    const unit = FIELD_META[key].unit;
    valueEl.textContent = `${formatOhmValue(result[key])} ${unit}`;

    item.classList.toggle("result-item--input", result.inputs.includes(key));
    item.classList.toggle(
      "result-item--calculated",
      result.calculated.includes(key)
    );
  }

  if (formulas) {
    formulas.innerHTML = result.formulas
      .map((formula) => `<li>${formula}</li>`)
      .join("");
  }

  if (status) {
    status.textContent = `Results updated. Power ${formatOhmValue(result.power)} watts.`;
  }
}

/**
 * @param {import("./calculators/ohms-law.js").OhmResult} result
 */
function resultsText(result) {
  if (!result.ok) return "";
  return [
    "Vapor — Ohm's Law Calculator",
    `Voltage: ${formatOhmValue(result.voltage)} V`,
    `Current: ${formatOhmValue(result.current)} A`,
    `Resistance: ${formatOhmValue(result.resistance)} Ω`,
    `Power: ${formatOhmValue(result.power)} W`,
    `Formulas: ${result.formulas.join("; ")}`,
  ].join("\n");
}

function init() {
  const form = /** @type {HTMLFormElement | null} */ (
    document.querySelector("[data-ohms-form]")
  );
  const root = document.querySelector("[data-ohms-root]");
  if (!form || !root) return;

  writeForm(form, loadSaved());

  let latest = calculateOhmsLaw(readForm(form));

  const update = () => {
    const data = readForm(form);
    latest = calculateOhmsLaw(data);
    renderResults(latest, root);
    if (latest.ok) persist(data);
  };

  form.addEventListener("input", update);
  form.addEventListener("change", (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (target.getAttribute("name") === "pair") {
      syncPairFields(form, getPair(form));
    }
    update();
  });

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    remove(STORAGE_KEY);
    writeForm(form, { ...DEFAULTS });
    update();
  });

  const feedback = root.querySelector("[data-copy-feedback]");
  root.querySelector("[data-copy-results]")?.addEventListener("click", async () => {
    if (!latest.ok) return;
    try {
      await navigator.clipboard.writeText(resultsText(latest));
      if (feedback) feedback.textContent = "Copied to clipboard.";
    } catch {
      if (feedback) feedback.textContent = "Unable to copy. Copy manually instead.";
    }
    window.setTimeout(() => {
      if (feedback) feedback.textContent = "";
    }, 2000);
  });

  update();
}

init();
