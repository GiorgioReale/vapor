/**
 * Pure e-liquid mixing calculations.
 * All functions are DOM-free and side-effect free.
 */

const EPSILON = 1e-9;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Clamp tiny floating-point noise around zero for display prep.
 * Does not alter meaningful negatives.
 * @param {number} value
 * @returns {number}
 */
export function sanitizeZero(value) {
  if (!isFiniteNumber(value)) return value;
  return Math.abs(value) < EPSILON ? 0 : value;
}

/**
 * Round for display only. Calculations should use full precision.
 * @param {number} value
 * @param {number} [digits=2]
 * @returns {string}
 */
export function formatNumber(value, digits = 2) {
  if (!isFiniteNumber(value)) return "—";
  const cleaned = sanitizeZero(value);
  const fixed = cleaned.toFixed(digits);
  // Avoid "-0.00"
  if (Object.is(Number(fixed), -0) || fixed === (-0).toFixed(digits)) {
    return (0).toFixed(digits);
  }
  return fixed;
}

/**
 * @typedef {object} ELiquidInput
 * @property {number} finalVolume
 * @property {number} targetNicotine
 * @property {number} nicotineBaseStrength
 * @property {number} nicotineBasePg
 * @property {number} nicotineBaseVg
 * @property {number} targetPg
 * @property {number} targetVg
 * @property {number} flavorPercent
 * @property {number} flavorPg
 * @property {number} flavorVg
 */

/**
 * @typedef {object} ELiquidResult
 * @property {boolean} ok
 * @property {string[]} errors
 * @property {number | null} nicotineBaseMl
 * @property {number | null} flavorMl
 * @property {number | null} additionalPgMl
 * @property {number | null} additionalVgMl
 * @property {number | null} finalVolumeMl
 * @property {number | null} finalNicotine
 * @property {number | null} finalPg
 * @property {number | null} finalVg
 * @property {number | null} totalMl
 */

/**
 * Validate e-liquid calculator inputs.
 * @param {Partial<ELiquidInput>} input
 * @returns {string[]}
 */
export function validateELiquidInput(input) {
  const errors = [];

  const required = [
    ["finalVolume", "Final volume"],
    ["targetNicotine", "Target nicotine strength"],
    ["nicotineBaseStrength", "Nicotine base strength"],
    ["nicotineBasePg", "Nicotine base PG"],
    ["nicotineBaseVg", "Nicotine base VG"],
    ["targetPg", "Target PG"],
    ["targetVg", "Target VG"],
    ["flavorPercent", "Flavor percentage"],
    ["flavorPg", "Flavor carrier PG"],
    ["flavorVg", "Flavor carrier VG"],
  ];

  for (const [key, label] of required) {
    const value = input[key];
    if (value === undefined || value === null || value === "") {
      errors.push(`${label} is required.`);
      continue;
    }
    if (!isFiniteNumber(value)) {
      errors.push(`${label} must be a valid number.`);
    }
  }

  if (errors.length) return errors;

  const {
    finalVolume,
    targetNicotine,
    nicotineBaseStrength,
    nicotineBasePg,
    nicotineBaseVg,
    targetPg,
    targetVg,
    flavorPercent,
    flavorPg,
    flavorVg,
  } = /** @type {ELiquidInput} */ (input);

  if (finalVolume <= 0) {
    errors.push("Final volume must be greater than zero.");
  }

  if (targetNicotine < 0) {
    errors.push("Target nicotine strength cannot be negative.");
  }

  if (nicotineBaseStrength < 0) {
    errors.push("Nicotine base strength cannot be negative.");
  }

  if (targetNicotine > 0 && nicotineBaseStrength <= 0) {
    errors.push("Nicotine base strength must be greater than zero when target nicotine is set.");
  }

  if (targetNicotine > nicotineBaseStrength && nicotineBaseStrength > 0) {
    errors.push(
      "Target nicotine strength cannot exceed the nicotine base strength."
    );
  }

  const percentFields = [
    [nicotineBasePg, "Nicotine base PG"],
    [nicotineBaseVg, "Nicotine base VG"],
    [targetPg, "Target PG"],
    [targetVg, "Target VG"],
    [flavorPercent, "Flavor percentage"],
    [flavorPg, "Flavor carrier PG"],
    [flavorVg, "Flavor carrier VG"],
  ];

  for (const [value, label] of percentFields) {
    if (value < 0) errors.push(`${label} cannot be negative.`);
    if (value > 100) errors.push(`${label} cannot exceed 100%.`);
  }

  if (Math.abs(nicotineBasePg + nicotineBaseVg - 100) > EPSILON) {
    errors.push("Nicotine base PG and VG must add up to 100%.");
  }

  if (Math.abs(targetPg + targetVg - 100) > EPSILON) {
    errors.push("Target PG and VG must add up to 100%.");
  }

  if (Math.abs(flavorPg + flavorVg - 100) > EPSILON) {
    errors.push("Flavor carrier PG and VG must add up to 100%.");
  }

  return errors;
}

/**
 * Calculate e-liquid ingredient volumes.
 * @param {Partial<ELiquidInput>} input
 * @returns {ELiquidResult}
 */
export function calculateELiquid(input) {
  const empty = {
    ok: false,
    errors: [],
    nicotineBaseMl: null,
    flavorMl: null,
    additionalPgMl: null,
    additionalVgMl: null,
    finalVolumeMl: null,
    finalNicotine: null,
    finalPg: null,
    finalVg: null,
    totalMl: null,
  };

  const errors = validateELiquidInput(input);
  if (errors.length) {
    return { ...empty, errors };
  }

  const {
    finalVolume,
    targetNicotine,
    nicotineBaseStrength,
    nicotineBasePg,
    nicotineBaseVg,
    targetPg,
    targetVg,
    flavorPercent,
    flavorPg,
    flavorVg,
  } = /** @type {ELiquidInput} */ (input);

  const nicotineBaseMl =
    targetNicotine === 0
      ? 0
      : (finalVolume * targetNicotine) / nicotineBaseStrength;

  const flavorMl = (finalVolume * flavorPercent) / 100;

  const targetPgMl = (finalVolume * targetPg) / 100;
  const targetVgMl = (finalVolume * targetVg) / 100;

  const pgFromNicotine = nicotineBaseMl * (nicotineBasePg / 100);
  const vgFromNicotine = nicotineBaseMl * (nicotineBaseVg / 100);
  const pgFromFlavor = flavorMl * (flavorPg / 100);
  const vgFromFlavor = flavorMl * (flavorVg / 100);

  const additionalPgMl = targetPgMl - pgFromNicotine - pgFromFlavor;
  const additionalVgMl = targetVgMl - vgFromNicotine - vgFromFlavor;

  const resultErrors = [];

  if (additionalPgMl < -EPSILON) {
    resultErrors.push(
      "The selected PG/VG ratio is impossible with the chosen nicotine base and flavor carrier. Reduce flavor percentage, change the flavor carrier, or adjust PG/VG targets."
    );
  }

  if (additionalVgMl < -EPSILON) {
    resultErrors.push(
      "The selected PG/VG ratio is impossible with the chosen nicotine base and flavor carrier. Reduce flavor percentage, change the flavor carrier, or adjust PG/VG targets."
    );
  }

  if (nicotineBaseMl + flavorMl > finalVolume + EPSILON) {
    resultErrors.push(
      "Nicotine base and flavor volumes exceed the final volume. Lower the target nicotine or flavor percentage."
    );
  }

  if (resultErrors.length) {
    return { ...empty, errors: resultErrors };
  }

  const cleanPg = sanitizeZero(additionalPgMl);
  const cleanVg = sanitizeZero(additionalVgMl);
  const cleanNic = sanitizeZero(nicotineBaseMl);
  const cleanFlavor = sanitizeZero(flavorMl);
  const totalMl = cleanNic + cleanFlavor + cleanPg + cleanVg;

  const actualPgMl = pgFromNicotine + pgFromFlavor + cleanPg;
  const actualVgMl = vgFromNicotine + vgFromFlavor + cleanVg;
  const finalPg = totalMl > 0 ? (actualPgMl / totalMl) * 100 : 0;
  const finalVg = totalMl > 0 ? (actualVgMl / totalMl) * 100 : 0;

  return {
    ok: true,
    errors: [],
    nicotineBaseMl: cleanNic,
    flavorMl: cleanFlavor,
    additionalPgMl: cleanPg,
    additionalVgMl: cleanVg,
    finalVolumeMl: finalVolume,
    finalNicotine: targetNicotine,
    finalPg: sanitizeZero(finalPg),
    finalVg: sanitizeZero(finalVg),
    totalMl: sanitizeZero(totalMl),
  };
}
