import { assertRange, SolarInputError } from "./errors";

export type BatteryChemistry = "lifepo4" | "other-lithium" | "lead-acid";

export interface BatteryModule {
  chemistry: BatteryChemistry;
  /** Nominal voltage of one module or monobloc, V. */
  nominalVoltageV: number;
  /** Nameplate charge, amp-hours. */
  ampHours: number;
  /** Usable fraction of nameplate charge. Lead-acid is often near 0.5; LiFePO4 often near 0.8 to 0.9. */
  usableDepthOfDischarge: number;
  /** One-way discharge efficiency, 0 to 1. */
  dischargeEfficiency: number;
  /** Continuous discharge power of one module, kW. Optional. */
  continuousDischargeKw?: number;
  /** Capacity multiplier at the design temperature. 1 means no derate. */
  temperatureFactor?: number;
}

export interface BatterySizingInput {
  /** AC energy to support from the battery per day, kWh/day. */
  dailyAcKwh: number;
  daysOfAutonomy: number;
  /** Inverter efficiency when discharging, 0.5 to 1. */
  inverterEfficiency: number;
  module: BatteryModule;
  /** Desired battery bus voltage, V. */
  busVoltageV: number;
  /** Optional AC power the bank should be able to deliver, kW. */
  peakAcKw?: number;
}

export interface BatterySizingResult {
  /** AC energy reserved, kWh. */
  reserveAcKwh: number;
  /** DC energy that must leave the cells, kWh. */
  requiredDcKwh: number;
  /** Nameplate energy after depth of discharge and temperature, kWh. */
  requiredNominalKwh: number;
  seriesCount: number;
  parallelCount: number;
  moduleCount: number;
  nominalBankKwh: number;
  usableBankKwh: number;
  /** Hours of backup at the entered daily average, not at peak power. */
  backupHoursAtAverageLoad: number;
  continuousDischargeKw: number | null;
  warnings: string[];
  assumptions: string[];
}

export function nominalModuleKwh(module: BatteryModule): number {
  return (module.nominalVoltageV * module.ampHours) / 1000;
}

/**
 * Size a single-chemistry battery bank.
 *
 *   reserve AC kWh = daily AC kWh × days
 *   DC kWh = reserve / inverter efficiency
 *   nominal kWh = DC kWh / (DoD × discharge efficiency × temperature factor)
 *
 * Series count is bus voltage / module voltage, rounded to the nearest integer.
 * A mismatch above 8% is rejected rather than silently rewired.
 * Parallel count covers both energy and, when provided, continuous power.
 *
 * Nominal kWh is the nameplate. Usable kWh is nominal × DoD × discharge efficiency
 * × temperature factor. They differ because the full nameplate cannot be removed
 * every cycle without leaving the allowed window, and because discharge is not lossless.
 *
 * Limitations: no hourly dispatch, no cycle-life model, and modules of different
 * chemistries or brands are not combined by this function.
 */
export function sizeBatteryBank(input: BatterySizingInput): BatterySizingResult {
  assertRange(input.dailyAcKwh, "Daily battery load", 0, 100_000);
  assertRange(input.daysOfAutonomy, "Days of autonomy", 0.05, 14);
  assertRange(input.inverterEfficiency, "Inverter efficiency", 0.5, 1);
  assertRange(input.busVoltageV, "Bus voltage", 12, 1000);
  const module = input.module;
  assertRange(module.nominalVoltageV, "Module voltage", 2, 1000);
  assertRange(module.ampHours, "Module amp-hours", 1, 100_000);
  assertRange(module.usableDepthOfDischarge, "Depth of discharge", 0.1, 1);
  assertRange(module.dischargeEfficiency, "Discharge efficiency", 0.5, 1);
  const temperature = module.temperatureFactor ?? 1;
  assertRange(temperature, "Temperature factor", 0.4, 1);
  if (module.continuousDischargeKw !== undefined) {
    assertRange(module.continuousDischargeKw, "Continuous discharge", 0.05, 1000);
  }

  const seriesExact = input.busVoltageV / module.nominalVoltageV;
  const seriesCount = Math.max(1, Math.round(seriesExact));
  const voltageError = Math.abs(seriesCount * module.nominalVoltageV - input.busVoltageV) / input.busVoltageV;
  if (voltageError > 0.08) {
    throw new SolarInputError(
      `Module voltage ${module.nominalVoltageV} V cannot make a ${input.busVoltageV} V bank within 8%. Choose a different module or bus voltage.`,
    );
  }

  const reserveAcKwh = input.dailyAcKwh * input.daysOfAutonomy;
  const requiredDcKwh = reserveAcKwh / input.inverterEfficiency;
  const usableFraction = module.usableDepthOfDischarge * module.dischargeEfficiency * temperature;
  const requiredNominalKwh = requiredDcKwh / usableFraction;
  const moduleKwh = nominalModuleKwh(module);
  let parallelCount = Math.max(1, Math.ceil(requiredNominalKwh / (seriesCount * moduleKwh)));

  let continuousDischargeKw: number | null = null;
  if (module.continuousDischargeKw !== undefined) {
    if (input.peakAcKw !== undefined) {
      assertRange(input.peakAcKw, "Peak AC power", 0.05, 10_000);
      const dcPeakKw = input.peakAcKw / input.inverterEfficiency;
      const parallelForPower = Math.ceil(dcPeakKw / (seriesCount * module.continuousDischargeKw));
      parallelCount = Math.max(parallelCount, parallelForPower);
    }
    continuousDischargeKw = seriesCount * parallelCount * module.continuousDischargeKw;
  } else if (input.peakAcKw !== undefined) {
    throw new SolarInputError("Peak power was entered, but this module has no continuous discharge rating.");
  }

  const moduleCount = seriesCount * parallelCount;
  const nominalBankKwh = moduleCount * moduleKwh;
  const usableBankKwh = nominalBankKwh * usableFraction;
  const backupHours = input.dailyAcKwh > 0 ? (usableBankKwh * input.inverterEfficiency * 24) / input.dailyAcKwh : 0;
  const warnings: string[] = [];
  if (voltageError > 0.03) {
    warnings.push(
      `Series string voltage is ${(seriesCount * module.nominalVoltageV).toFixed(1)} V versus the requested ${input.busVoltageV} V bus.`,
    );
  }
  if (module.chemistry === "lead-acid" && module.usableDepthOfDischarge > 0.6) {
    warnings.push("Lead-acid depth of discharge above 60% is aggressive for cycle life. Confirm the manufacturer limit.");
  }
  if (module.chemistry === "lifepo4" && module.usableDepthOfDischarge > 0.95) {
    warnings.push("LiFePO4 usable depth of discharge above 95% leaves little reserve. Confirm the battery management limits.");
  }

  return {
    reserveAcKwh,
    requiredDcKwh,
    requiredNominalKwh,
    seriesCount,
    parallelCount,
    moduleCount,
    nominalBankKwh,
    usableBankKwh,
    backupHoursAtAverageLoad: backupHours,
    continuousDischargeKw,
    warnings,
    assumptions: [
      "Nominal capacity is nameplate voltage × amp-hours. Usable capacity multiplies by depth of discharge, discharge efficiency, and temperature.",
      "Backup duration uses the average daily energy, not the peak power. A high surge can empty the power limit before the energy limit.",
      "Only identical modules of one chemistry are combined. Do not series-connect different brands or chemistries from this result.",
      "Charge time, inverter surge, and code-required disconnects are not certified here.",
    ],
  };
}
