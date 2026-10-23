import { calculateELiquid, formatNumber } from "./calculators/e-liquid.js";
import { load, save, remove } from "./storage.js";

const STORAGE_KEY = "e-liquid";

const DEFAULTS = {
  finalVolume: 30,
  targetNicotine: 3,
  nicotineBaseStrength: 20,
  nicotineBasePg: 50,
  nicotineBaseVg: 50,
  targetPg: 50,
  targetVg: 50,
  flavorPercent: 10,
  flavorCarrier: "pg",
  flavorPg: 100,
  flavorVg: 0,
};

/**
 * @param {HTMLFormElement} form
 */
function readForm(form) {
  const get = (name) => form.elements.namedItem(name);

  const num = (name) => {
    const el = /** @type {HTMLInputElement | null} */ (get(name));
    if (!el || el.value.trim() === "") return null;
    return Number(el.value);
  };

  const carrier = /** @type {HTMLSelectElement} */ (get("flavorCarrier")).value;
  let flavorPg = num("flavorPg");
  let flavorVg = num("flavorVg");

  if (carrier === "pg") {
    flavorPg = 100;
    flavorVg = 0;
  } else if (carrier === "vg") {
    flavorPg = 0;
    flavorVg = 100;
  }

  return {
    finalVolume: num("finalVolume"),
    targetNicotine: num("targetNicotine"),
    nicotineBaseStrength: num("nicotineBaseStrength"),
    nicotineBasePg: num("nicotineBasePg"),
    nicotineBaseVg: num("nicotineBaseVg"),
    targetPg: num("targetPg"),
    targetVg: num("targetVg"),
    flavorPercent: num("flavorPercent"),
    flavorPg,
    flavorVg,
    flavorCarrier: carrier,
  };
}

/**
 * @param {HTMLFormElement} form
 * @param {typeof DEFAULTS} values
 */
function writeForm(form, values) {
  for (const [key, value] of Object.entries(values)) {
    const el = form.elements.namedItem(key);
    if (!el || !("value" in el)) continue;
    /** @type {HTMLInputElement | HTMLSelectElement} */ (el).value = String(value);
  }
  syncFlavorCarrierUi(form);
  syncLinkedRatios(form, "nicotineBase");
  syncLinkedRatios(form, "target");
  syncLinkedRatios(form, "flavor");
}

/**
 * Keep PG/VG pairs totaling 100 when one side changes.
 * @param {HTMLFormElement} form
 * @param {"nicotineBase" | "target" | "flavor"} prefix
 * @param {"pg" | "vg"} [source]
 */
function syncLinkedRatios(form, prefix, source) {
  const pgEl = /** @type {HTMLInputElement | null} */ (
    form.elements.namedItem(`${prefix}Pg`)
  );
  const vgEl = /** @type {HTMLInputElement | null} */ (
    form.elements.namedItem(`${prefix}Vg`)
  );
  if (!pgEl || !vgEl) return;

  if (source === "pg") {
    const pg = Number(pgEl.value);
    if (Number.isFinite(pg)) vgEl.value = String(clampPercent(100 - pg));
  } else if (source === "vg") {
    const vg = Number(vgEl.value);
    if (Number.isFinite(vg)) pgEl.value = String(clampPercent(100 - vg));
  }
}

/**
 * @param {number} value
 */
function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * @param {HTMLFormElement} form
 */
function syncFlavorCarrierUi(form) {
  const carrier = /** @type {HTMLSelectElement} */ (
    form.elements.namedItem("flavorCarrier")
  ).value;
  const custom = form.querySelector("[data-flavor-custom]");
  if (!custom) return;

  const hidden = carrier !== "custom";
  custom.hidden = hidden;
  custom.querySelectorAll("input").forEach((input) => {
    input.disabled = hidden;
  });

  if (carrier === "pg") {
    /** @type {HTMLInputElement} */ (form.elements.namedItem("flavorPg")).value = "100";
    /** @type {HTMLInputElement} */ (form.elements.namedItem("flavorVg")).value = "0";
  } else if (carrier === "vg") {
    /** @type {HTMLInputElement} */ (form.elements.namedItem("flavorPg")).value = "0";
    /** @type {HTMLInputElement} */ (form.elements.namedItem("flavorVg")).value = "100";
  }
}

/**
 * @param {ReturnType<typeof readForm>} data
 */
function persist(data) {
  save(STORAGE_KEY, {
    finalVolume: data.finalVolume,
    targetNicotine: data.targetNicotine,
    nicotineBaseStrength: data.nicotineBaseStrength,
    nicotineBasePg: data.nicotineBasePg,
    nicotineBaseVg: data.nicotineBaseVg,
    targetPg: data.targetPg,
    targetVg: data.targetVg,
    flavorPercent: data.flavorPercent,
    flavorCarrier: data.flavorCarrier,
    flavorPg: data.flavorPg,
    flavorVg: data.flavorVg,
  });
}

function loadSaved() {
  const saved = load(STORAGE_KEY);
  if (!saved || typeof saved !== "object") return { ...DEFAULTS };

  const next = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in saved)) continue;
    const value = saved[key];
    if (key === "flavorCarrier") {
      if (value === "pg" || value === "vg" || value === "custom") {
        next.flavorCarrier = value;
      }
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = value;
    }
  }
  return next;
}

/**
 * @param {import("./calculators/e-liquid.js").ELiquidResult} result
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

  if (!result.ok) {
    if (alert) {
      alert.hidden = false;
      alert.className = "alert alert--danger";
      alert.textContent = result.errors[0] || "Invalid input.";
    }
    if (empty) empty.hidden = false;
    if (content) content.hidden = true;
    if (copyBtn) copyBtn.disabled = true;
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

  const setValue = (key, value, unit = "ml") => {
    const el = root.querySelector(`[data-result="${key}"]`);
    if (el) el.textContent = `${formatNumber(value)} ${unit}`;
  };

  setValue("nicotineBaseMl", result.nicotineBaseMl);
  setValue("flavorMl", result.flavorMl);
  setValue("additionalPgMl", result.additionalPgMl);
  setValue("additionalVgMl", result.additionalVgMl);
  setValue("finalVolumeMl", result.finalVolumeMl);
  setValue("finalNicotine", result.finalNicotine, "mg/ml");

  const ratioEl = root.querySelector(`[data-result="finalRatio"]`);
  if (ratioEl) {
    ratioEl.textContent = `${formatNumber(result.finalPg, 1)} / ${formatNumber(result.finalVg, 1)}`;
  }

  const total = result.totalMl || 1;
  const segments = [
    ["nicotine", result.nicotineBaseMl],
    ["flavor", result.flavorMl],
    ["pg", result.additionalPgMl],
    ["vg", result.additionalVgMl],
  ];

  for (const [name, value] of segments) {
    const el = /** @type {HTMLElement | null} */ (
      root.querySelector(`[data-segment="${name}"]`)
    );
    if (!el) continue;
    const share = Math.max(0, (value / total) * 100);
    el.style.flexGrow = String(share);
    el.style.flexBasis = "0";
    el.setAttribute("title", `${formatNumber(value)} ml`);
  }

  if (status) {
    status.textContent = `Results updated. Nicotine base ${formatNumber(result.nicotineBaseMl)} milliliters.`;
  }
}

/**
 * @param {import("./calculators/e-liquid.js").ELiquidResult} result
 */
function resultsText(result) {
  if (!result.ok) return "";
  return [
    "Vapor — E-Liquid Calculator",
    `Nicotine Base: ${formatNumber(result.nicotineBaseMl)} ml`,
    `Flavor Concentrate: ${formatNumber(result.flavorMl)} ml`,
    `Additional PG: ${formatNumber(result.additionalPgMl)} ml`,
    `Additional VG: ${formatNumber(result.additionalVgMl)} ml`,
    `Final Volume: ${formatNumber(result.finalVolumeMl)} ml`,
    `Final Nicotine: ${formatNumber(result.finalNicotine)} mg/ml`,
    `Final PG/VG: ${formatNumber(result.finalPg, 1)} / ${formatNumber(result.finalVg, 1)}`,
  ].join("\n");
}

function init() {
  const form = /** @type {HTMLFormElement | null} */ (
    document.querySelector("[data-e-liquid-form]")
  );
  const root = document.querySelector("[data-e-liquid-root]");
  if (!form || !root) return;

  writeForm(form, loadSaved());

  let latest = calculateELiquid(readForm(form));

  const update = () => {
    const data = readForm(form);
    latest = calculateELiquid(data);
    renderResults(latest, root);
    if (latest.ok) persist(data);
  };

  form.addEventListener("input", (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    const name = target.getAttribute("name");

    if (name === "nicotineBasePg") syncLinkedRatios(form, "nicotineBase", "pg");
    if (name === "nicotineBaseVg") syncLinkedRatios(form, "nicotineBase", "vg");
    if (name === "targetPg") syncLinkedRatios(form, "target", "pg");
    if (name === "targetVg") syncLinkedRatios(form, "target", "vg");
    if (name === "flavorPg") syncLinkedRatios(form, "flavor", "pg");
    if (name === "flavorVg") syncLinkedRatios(form, "flavor", "vg");
    if (name === "flavorCarrier") syncFlavorCarrierUi(form);

    update();
  });

  form.addEventListener("change", update);

  root.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const pg = Number(button.getAttribute("data-pg"));
      const vg = Number(button.getAttribute("data-vg"));
      if (!Number.isFinite(pg) || !Number.isFinite(vg)) return;
      /** @type {HTMLInputElement} */ (form.elements.namedItem("targetPg")).value =
        String(pg);
      /** @type {HTMLInputElement} */ (form.elements.namedItem("targetVg")).value =
        String(vg);
      root.querySelectorAll("[data-preset]").forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn === button));
      });
      update();
    });
  });

  const resetBtn = root.querySelector("[data-reset]");
  resetBtn?.addEventListener("click", () => {
    remove(STORAGE_KEY);
    writeForm(form, { ...DEFAULTS });
    root.querySelectorAll("[data-preset]").forEach((btn) => {
      const pressed =
        btn.getAttribute("data-pg") === "50" &&
        btn.getAttribute("data-vg") === "50";
      btn.setAttribute("aria-pressed", String(pressed));
    });
    update();
  });

  const copyBtn = root.querySelector("[data-copy-results]");
  const feedback = root.querySelector("[data-copy-feedback]");
  copyBtn?.addEventListener("click", async () => {
    if (!latest.ok) return;
    const text = resultsText(latest);
    try {
      await navigator.clipboard.writeText(text);
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
