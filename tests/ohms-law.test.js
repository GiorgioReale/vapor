import { describe, expect, it } from "vitest";
import {
  calculateOhmsLaw,
  formatOhmValue,
  validateOhmInput,
} from "../assets/js/calculators/ohms-law.js";

describe("calculateOhmsLaw", () => {
  it("calculates from voltage + current", () => {
    const result = calculateOhmsLaw({
      pair: "VI",
      voltage: 4.2,
      current: 8.4,
    });

    expect(result.ok).toBe(true);
    expect(result.resistance).toBeCloseTo(0.5, 10);
    expect(result.power).toBeCloseTo(35.28, 10);
    expect(result.inputs).toEqual(["voltage", "current"]);
  });

  it("calculates from voltage + resistance", () => {
    const result = calculateOhmsLaw({
      pair: "VR",
      voltage: 3.7,
      resistance: 0.5,
    });

    expect(result.ok).toBe(true);
    expect(result.current).toBeCloseTo(7.4, 10);
    expect(result.power).toBeCloseTo(27.38, 10);
  });

  it("calculates from voltage + power", () => {
    const result = calculateOhmsLaw({
      pair: "VP",
      voltage: 4,
      power: 40,
    });

    expect(result.ok).toBe(true);
    expect(result.current).toBeCloseTo(10, 10);
    expect(result.resistance).toBeCloseTo(0.4, 10);
  });

  it("calculates from current + resistance", () => {
    const result = calculateOhmsLaw({
      pair: "IR",
      current: 5,
      resistance: 0.8,
    });

    expect(result.ok).toBe(true);
    expect(result.voltage).toBeCloseTo(4, 10);
    expect(result.power).toBeCloseTo(20, 10);
  });

  it("calculates from current + power", () => {
    const result = calculateOhmsLaw({
      pair: "IP",
      current: 10,
      power: 50,
    });

    expect(result.ok).toBe(true);
    expect(result.voltage).toBeCloseTo(5, 10);
    expect(result.resistance).toBeCloseTo(0.5, 10);
  });

  it("calculates from resistance + power", () => {
    const result = calculateOhmsLaw({
      pair: "RP",
      resistance: 0.5,
      power: 32,
    });

    expect(result.ok).toBe(true);
    expect(result.voltage).toBeCloseTo(4, 10);
    expect(result.current).toBeCloseTo(8, 10);
  });

  it("rejects division by zero via zero resistance", () => {
    const result = calculateOhmsLaw({
      pair: "VR",
      voltage: 4.2,
      resistance: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid resistance", () => {
    const errors = validateOhmInput({
      pair: "IR",
      current: 2,
      resistance: -1,
    });

    expect(errors.some((e) => /resistance/i.test(e))).toBe(true);
  });

  it("rejects invalid power", () => {
    const result = calculateOhmsLaw({
      pair: "VP",
      voltage: 3.7,
      power: 0,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects incomplete inputs", () => {
    const result = calculateOhmsLaw({
      pair: "VI",
      voltage: 3.7,
      current: null,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /required/i.test(e))).toBe(true);
  });

  it("rejects invalid numbers", () => {
    const result = calculateOhmsLaw({
      pair: "VR",
      voltage: Number.NaN,
      resistance: 0.5,
    });

    expect(result.ok).toBe(false);
  });

  it("handles boundary-like small values", () => {
    const result = calculateOhmsLaw({
      pair: "VR",
      voltage: 0.001,
      resistance: 0.001,
    });

    expect(result.ok).toBe(true);
    expect(result.current).toBeCloseTo(1, 10);
    expect(result.power).toBeCloseTo(0.001, 10);
  });
});

describe("formatOhmValue", () => {
  it("formats ordinary and extreme magnitudes", () => {
    expect(formatOhmValue(3.7)).toBe("3.7");
    expect(formatOhmValue(0.0000123)).toMatch(/e/i);
  });
});
