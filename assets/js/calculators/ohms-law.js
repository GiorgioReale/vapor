/**
 * Pure Ohm's law calculations for an ideal resistive DC circuit.
 */

/**
 * @typedef {"VI" | "VR" | "VP" | "IR" | "IP" | "RP"} OhmPair
 */

/**
 * @typedef {object} OhmInput
 * @property {OhmPair} pair
 * @property {number | null | undefined} voltage
 * @property {number | null | undefined} current
 * @property {number | null | undefined} resistance
 * @property {number | null | undefined} power
 */

/**
 * @typedef {object} OhmResult
 * @property {boolean} ok
 * @property {string[]} errors
 * @property {number | null} voltage
 * @property {number | null} current
 * @property {number | null} resistance
 * @property {number | null} power
 * @property {("voltage" | "current" | "resistance" | "power")[]} inputs
 * @property {("voltage" | "current" | "resistance" | "power")[]} calculated
 * @property {string[]} formulas
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * @param {number} value
 * @param {number} [digits=3]
 * @returns {string}
 */
export function formatOhmValue(value, digits = 3) {
  if (!isFiniteNumber(value)) return "—";
  if (Object.is(value, -0)) value = 0;

  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.001 || abs >= 10000)) {
    return value.toExponential(3);
  }
  return Number(value.toFixed(digits)).toString();
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string | null}
 */
function requirePositive(value, label) {
  if (value === null || value === undefined || value === "") {
    return `${label} is required.`;
  }
  if (!isFiniteNumber(value)) {
    return `${label} must be a valid number.`;
  }
  if (value < 0) {
    return `${label} cannot be negative.`;
  }
  if (value === 0) {
    return `${label} must be greater than zero.`;
  }
  return null;
}

/**
 * @param {OhmInput} input
 * @returns {string[]}
 */
export function validateOhmInput(input) {
  const errors = [];
  const { pair } = input;

  const checks = {
    VI: [
      ["voltage", "Voltage"],
      ["current", "Current"],
    ],
    VR: [
      ["voltage", "Voltage"],
      ["resistance", "Resistance"],
    ],
    VP: [
      ["voltage", "Voltage"],
      ["power", "Power"],
    ],
    IR: [
      ["current", "Current"],
      ["resistance", "Resistance"],
    ],
    IP: [
      ["current", "Current"],
      ["power", "Power"],
    ],
    RP: [
      ["resistance", "Resistance"],
      ["power", "Power"],
    ],
  };

  if (!checks[pair]) {
    return ["Select a valid known-value pair."];
  }

  for (const [key, label] of checks[pair]) {
    const error = requirePositive(input[key], label);
    if (error) errors.push(error);
  }

  return errors;
}

/**
 * Calculate the missing Ohm's law values from a known pair.
 * @param {OhmInput} input
 * @returns {OhmResult}
 */
export function calculateOhmsLaw(input) {
  const empty = {
    ok: false,
    errors: [],
    voltage: null,
    current: null,
    resistance: null,
    power: null,
    inputs: [],
    calculated: [],
    formulas: [],
  };

  const errors = validateOhmInput(input);
  if (errors.length) {
    return { ...empty, errors };
  }

  const { pair } = input;
  let voltage = null;
  let current = null;
  let resistance = null;
  let power = null;
  /** @type {OhmResult["inputs"]} */
  let inputs = [];
  /** @type {OhmResult["calculated"]} */
  let calculated = [];
  /** @type {string[]} */
  let formulas = [];

  try {
    switch (pair) {
      case "VI": {
        voltage = /** @type {number} */ (input.voltage);
        current = /** @type {number} */ (input.current);
        resistance = voltage / current;
        power = voltage * current;
        inputs = ["voltage", "current"];
        calculated = ["resistance", "power"];
        formulas = ["R = V ÷ I", "P = V × I"];
        break;
      }
      case "VR": {
        voltage = /** @type {number} */ (input.voltage);
        resistance = /** @type {number} */ (input.resistance);
        current = voltage / resistance;
        power = (voltage * voltage) / resistance;
        inputs = ["voltage", "resistance"];
        calculated = ["current", "power"];
        formulas = ["I = V ÷ R", "P = V² ÷ R"];
        break;
      }
      case "VP": {
        voltage = /** @type {number} */ (input.voltage);
        power = /** @type {number} */ (input.power);
        current = power / voltage;
        resistance = (voltage * voltage) / power;
        inputs = ["voltage", "power"];
        calculated = ["current", "resistance"];
        formulas = ["I = P ÷ V", "R = V² ÷ P"];
        break;
      }
      case "IR": {
        current = /** @type {number} */ (input.current);
        resistance = /** @type {number} */ (input.resistance);
        voltage = current * resistance;
        power = current * current * resistance;
        inputs = ["current", "resistance"];
        calculated = ["voltage", "power"];
        formulas = ["V = I × R", "P = I² × R"];
        break;
      }
      case "IP": {
        current = /** @type {number} */ (input.current);
        power = /** @type {number} */ (input.power);
        voltage = power / current;
        resistance = power / (current * current);
        inputs = ["current", "power"];
        calculated = ["voltage", "resistance"];
        formulas = ["V = P ÷ I", "R = P ÷ I²"];
        break;
      }
      case "RP": {
        resistance = /** @type {number} */ (input.resistance);
        power = /** @type {number} */ (input.power);
        voltage = Math.sqrt(power * resistance);
        current = Math.sqrt(power / resistance);
        inputs = ["resistance", "power"];
        calculated = ["voltage", "current"];
        formulas = ["V = √(P × R)", "I = √(P ÷ R)"];
        break;
      }
      default:
        return { ...empty, errors: ["Select a valid known-value pair."] };
    }
  } catch {
    return {
      ...empty,
      errors: ["Unable to calculate with the provided values."],
    };
  }

  const values = { voltage, current, resistance, power };
  for (const [key, value] of Object.entries(values)) {
    if (!isFiniteNumber(value) || value < 0) {
      return {
        ...empty,
        errors: [
          `Unable to calculate a valid ${key} from the provided inputs.`,
        ],
      };
    }
  }

  return {
    ok: true,
    errors: [],
    voltage,
    current,
    resistance,
    power,
    inputs,
    calculated,
    formulas,
  };
}

export const OHM_PAIRS = [
  { id: "VI", label: "Voltage + Current", fields: ["voltage", "current"] },
  { id: "VR", label: "Voltage + Resistance", fields: ["voltage", "resistance"] },
  { id: "VP", label: "Voltage + Power", fields: ["voltage", "power"] },
  { id: "IR", label: "Current + Resistance", fields: ["current", "resistance"] },
  { id: "IP", label: "Current + Power", fields: ["current", "power"] },
  { id: "RP", label: "Resistance + Power", fields: ["resistance", "power"] },
];
