import { describe, expect, it } from "vitest";
import {
  calculateELiquid,
  formatNumber,
  sanitizeZero,
  validateELiquidInput,
} from "../assets/js/calculators/e-liquid.js";

const baseInput = {
  finalVolume: 200,
  targetNicotine: 5,
  nicotineBaseStrength: 20,
  nicotineBasePg: 50,
  nicotineBaseVg: 50,
  targetPg: 50,
  targetVg: 50,
  flavorPercent: 10,
  flavorPg: 100,
  flavorVg: 0,
};

describe("calculateELiquid", () => {
  it("matches the required 50/50 reference case", () => {
    const result = calculateELiquid(baseInput);

    expect(result.ok).toBe(true);
    expect(result.nicotineBaseMl).toBeCloseTo(50, 10);
    expect(result.flavorMl).toBeCloseTo(20, 10);
    expect(result.additionalPgMl).toBeCloseTo(55, 10);
    expect(result.additionalVgMl).toBeCloseTo(75, 10);
    expect(result.totalMl).toBeCloseTo(200, 10);
  });

  it("handles a standard 70/30 target mix", () => {
    const result = calculateELiquid({
      ...baseInput,
      targetPg: 70,
      targetVg: 30,
    });

    expect(result.ok).toBe(true);
    expect(result.additionalPgMl).toBeCloseTo(95, 10);
    expect(result.additionalVgMl).toBeCloseTo(35, 10);
    expect(result.totalMl).toBeCloseTo(200, 10);
  });

  it("supports zero nicotine", () => {
    const result = calculateELiquid({
      ...baseInput,
      targetNicotine: 0,
      nicotineBaseStrength: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.nicotineBaseMl).toBe(0);
    expect(result.flavorMl).toBeCloseTo(20, 10);
    expect(result.additionalPgMl).toBeCloseTo(80, 10);
    expect(result.additionalVgMl).toBeCloseTo(100, 10);
    expect(result.totalMl).toBeCloseTo(200, 10);
  });

  it("supports full PG flavor carrier", () => {
    const result = calculateELiquid({
      ...baseInput,
      flavorPg: 100,
      flavorVg: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.additionalPgMl).toBeCloseTo(55, 10);
  });

  it("supports full VG flavor carrier", () => {
    const result = calculateELiquid({
      ...baseInput,
      flavorPg: 0,
      flavorVg: 100,
    });

    expect(result.ok).toBe(true);
    expect(result.additionalPgMl).toBeCloseTo(75, 10);
    expect(result.additionalVgMl).toBeCloseTo(55, 10);
  });

  it("supports mixed PG/VG flavor carrier", () => {
    const result = calculateELiquid({
      ...baseInput,
      flavorPg: 50,
      flavorVg: 50,
    });

    expect(result.ok).toBe(true);
    expect(result.additionalPgMl).toBeCloseTo(65, 10);
    expect(result.additionalVgMl).toBeCloseTo(65, 10);
    expect(result.totalMl).toBeCloseTo(200, 10);
  });

  it("rejects impossible nicotine strength", () => {
    const result = calculateELiquid({
      ...baseInput,
      targetNicotine: 25,
      nicotineBaseStrength: 20,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /exceed/i.test(e))).toBe(true);
  });

  it("rejects impossible PG/VG ratios", () => {
    const result = calculateELiquid({
      ...baseInput,
      targetPg: 10,
      targetVg: 90,
      flavorPercent: 40,
      flavorPg: 100,
      flavorVg: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /impossible/i.test(e))).toBe(true);
  });

  it("rejects zero volume", () => {
    const result = calculateELiquid({
      ...baseInput,
      finalVolume: 0,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /volume/i.test(e))).toBe(true);
  });

  it("rejects invalid percentages", () => {
    const errors = validateELiquidInput({
      ...baseInput,
      targetPg: 120,
      targetVg: -20,
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it("keeps floating-point totals stable", () => {
    const result = calculateELiquid({
      finalVolume: 100,
      targetNicotine: 3,
      nicotineBaseStrength: 18,
      nicotineBasePg: 50,
      nicotineBaseVg: 50,
      targetPg: 40,
      targetVg: 60,
      flavorPercent: 12.5,
      flavorPg: 100,
      flavorVg: 0,
    });

    expect(result.ok).toBe(true);
    expect(result.totalMl).toBeCloseTo(100, 8);
    expect(
      result.nicotineBaseMl +
        result.flavorMl +
        result.additionalPgMl +
        result.additionalVgMl
    ).toBeCloseTo(100, 8);
  });

  it("ensures ingredient sum equals final volume", () => {
    const result = calculateELiquid(baseInput);
    const sum =
      result.nicotineBaseMl +
      result.flavorMl +
      result.additionalPgMl +
      result.additionalVgMl;

    expect(sum).toBeCloseTo(result.finalVolumeMl, 10);
  });
});

describe("helpers", () => {
  it("sanitizes near-zero noise", () => {
    expect(sanitizeZero(1e-12)).toBe(0);
    expect(sanitizeZero(-1e-12)).toBe(0);
    expect(sanitizeZero(1.5)).toBe(1.5);
  });

  it("formats numbers without negative zero", () => {
    expect(formatNumber(-0.0001)).toBe("0.00");
    expect(formatNumber(55)).toBe("55.00");
  });
});
