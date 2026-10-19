import { assertRange } from "./errors";
import { estimateIrradiation, type IrradianceInput, type IrradiationResult } from "./irradiance";
import { HOURS_PER_NON_LEAP_YEAR, kilowattsToWatts, wattHoursToKilowattHours } from "./units";

/**
 * NREL PVWatts v5 default loss stack, with the 3% shading term removed so that
 * shading is applied once, from the shading tool or an explicit user input.
 * Inverter efficiency is separate from this product.
 *
 * Source: NREL/TP-6A20-62641, PVWatts Version 5 Manual, Table 2.
 */
export const PVWATTS_DEFAULT_LOSSES = {
  soiling: 0.02,
  mismatch: 0.02,
  wiring: 0.02,
  connections: 0.005,
  lightInducedDegradation: 0.015,
  nameplate: 0.01,
  availability: 0.03,
} as const;

export interface LossInputs {
  soiling?: number;
  mismatch?: number;
  wiring?: number;
  connections?: number;
  lightInducedDegradation?: number;
  nameplate?: number;
  availability?: number;
  /** Additional shading loss as a fraction of plane-of-array energy, 0 to 0.95. */
  shading?: number;
  /** Inverter weighted efficiency, 0.5 to 1. */
  inverterEfficiency?: number;
}

export interface ProductionInput extends IrradianceInput {
  /** Array DC nameplate at STC, kilowatts. */
  arrayKw: number;
  /**
   * Module temperature coefficient of power, per °C.
   * Crystalline silicon is often near -0.0035. This default is typical, not a datasheet.
   */
  gammaPerC?: number;
  /** Nominal operating cell temperature, °C. Default 45. */
  noctC?: number;
  /** Optional monthly daytime ambient temperature, °C, length 12. */
  monthlyAmbientC?: number[];
  losses?: LossInputs;
}

export interface ProductionMonth {
  month: string;
  monthIndex: number;
  /** AC energy, kWh. */
  acKwh: number;
  /** Average daily plane-of-array irradiation, kWh/m²/day. */
  poaKwhPerM2Day: number;
  /** Effective full-sun hours per day, h/day. */
  peakSunHours: number;
}

export interface ProductionResult {
  irradiation: IrradiationResult;
  /** Annual AC energy, kWh/year. */
  annualAcKwh: number;
  monthly: ProductionMonth[];
  /** Specific yield, kWh/kW/year. */
  specificYieldKwhPerKw: number;
  /** annualAcKwh / (arrayKw × 8760). */
  capacityFactor: number;
  /** Combined non-temperature derate, including inverter efficiency and shading. */
  systemDerate: number;
  assumptions: string[];
}

function lossFraction(value: number | undefined, fallback: number, label: string): number {
  const used = value ?? fallback;
  assertRange(used, label, 0, 0.5);
  return used;
}

/**
 * Multiply the PVWatts-style loss factors.
 * Output is dimensionless. A result of 0.82 means 18% of DC energy is lost
 * before it is counted as AC, excluding the temperature term.
 */
export function systemDerate(losses: LossInputs = {}): number {
  const shading = losses.shading ?? 0;
  assertRange(shading, "Shading loss", 0, 0.95);
  const inverter = losses.inverterEfficiency ?? 0.96;
  assertRange(inverter, "Inverter efficiency", 0.5, 1);
  const factors = [
    1 - lossFraction(losses.soiling, PVWATTS_DEFAULT_LOSSES.soiling, "Soiling"),
    1 - lossFraction(losses.mismatch, PVWATTS_DEFAULT_LOSSES.mismatch, "Mismatch"),
    1 - lossFraction(losses.wiring, PVWATTS_DEFAULT_LOSSES.wiring, "Wiring"),
    1 - lossFraction(losses.connections, PVWATTS_DEFAULT_LOSSES.connections, "Connections"),
    1 - lossFraction(losses.lightInducedDegradation, PVWATTS_DEFAULT_LOSSES.lightInducedDegradation, "Light-induced degradation"),
    1 - lossFraction(losses.nameplate, PVWATTS_DEFAULT_LOSSES.nameplate, "Nameplate"),
    1 - lossFraction(losses.availability, PVWATTS_DEFAULT_LOSSES.availability, "Availability"),
    1 - shading,
    inverter,
  ];
  return factors.reduce((product, factor) => product * factor, 1);
}

function ambientC(latitudeDeg: number, monthIndex: number, override?: number[]): number {
  const supplied = override?.[monthIndex];
  if (supplied !== undefined) {
    assertRange(supplied, `Ambient temperature month ${monthIndex + 1}`, -40, 55);
    return supplied;
  }
  const annual = 28 - 0.55 * Math.abs(latitudeDeg);
  const amplitude = Math.min(18, 6 + 0.12 * Math.abs(latitudeDeg));
  const warmest = latitudeDeg >= 0 ? 6 : 0;
  return annual + amplitude * Math.cos((2 * Math.PI * (monthIndex - warmest)) / 12);
}

/**
 * Estimate AC energy from a fixed array.
 *
 * Model: monthly plane-of-array energy from `estimateIrradiation`, then a
 * PVWatts-style temperature correction using a single daytime cell temperature
 * per month:
 *   Tcell = Tamb + (Gday / 800) (NOCT - 20)
 *   P = Pstc (G / 1000) (1 + γ (Tcell - 25))
 * Integrated over the month and multiplied by the loss derate.
 *
 * Gday is the average plane-of-array irradiance during an assumed 8-hour
 * productive day, in W/m². That is only a temperature estimate. Energy itself
 * uses the monthly kWh/m² total, so stretching the same energy over more hours
 * would not change kWh except through temperature.
 *
 * Output energy is kilowatt-hours AC. Capacity factor uses 8760 hours.
 *
 * Limitations: no hourly weather file, no inverter clipping, no snow, and the
 * default ambient temperatures are a latitude curve rather than climate normals.
 */
export function estimateProduction(input: ProductionInput): ProductionResult {
  assertRange(input.arrayKw, "Array size", 0.05, 100000);
  const gamma = input.gammaPerC ?? -0.0035;
  assertRange(gamma, "Temperature coefficient", -0.01, 0);
  const noct = input.noctC ?? 45;
  assertRange(noct, "NOCT", 30, 55);
  if (input.monthlyAmbientC && input.monthlyAmbientC.length !== 12) {
    throw new Error("monthlyAmbientC must contain 12 values.");
  }
  const derate = systemDerate(input.losses);
  const irradiation = estimateIrradiation(input);
  const arrayW = kilowattsToWatts(input.arrayKw);
  const monthly = irradiation.monthly.map((row) => {
    const productiveHours = 8;
    const averageIrradiance = (row.planeOfArrayKwhPerM2Day * 1000) / productiveHours;
    const tamb = ambientC(input.latitudeDeg, row.monthIndex, input.monthlyAmbientC);
    const tCell = tamb + (averageIrradiance / 800) * (noct - 20);
    const temperatureFactor = Math.max(0, 1 + gamma * (tCell - 25));
    const dcWh = arrayW * row.planeOfArrayKwhPerM2 * temperatureFactor;
    const acKwh = wattHoursToKilowattHours(dcWh) * derate;
    return {
      month: row.month,
      monthIndex: row.monthIndex,
      acKwh,
      poaKwhPerM2Day: row.planeOfArrayKwhPerM2Day,
      peakSunHours: row.planeOfArrayKwhPerM2Day,
    };
  });
  const annualAcKwh = monthly.reduce((sum, row) => sum + row.acKwh, 0);
  return {
    irradiation,
    annualAcKwh,
    monthly,
    specificYieldKwhPerKw: annualAcKwh / input.arrayKw,
    capacityFactor: annualAcKwh / (input.arrayKw * HOURS_PER_NON_LEAP_YEAR),
    systemDerate: derate,
    assumptions: [
      ...irradiation.limitations,
      `Power temperature coefficient ${gamma} per °C and NOCT ${noct} °C are module assumptions, not a named datasheet.`,
      input.monthlyAmbientC
        ? "Cell temperature uses the ambient temperatures you entered."
        : "Cell temperature uses a latitude-based ambient curve, not a weather station.",
      "Inverter clipping, snow, and mismatch beyond the default loss factors are not simulated hour by hour.",
      `Non-temperature system derate is ${(derate * 100).toFixed(1)}%, including inverter efficiency and shading.`,
    ],
  };
}
