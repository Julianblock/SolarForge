import { assertRange } from "./errors";
import { wattsToKilowatts } from "./units";

export interface ApplianceLoad {
  id: string;
  name: string;
  /** Nameplate power of one unit, watts. */
  watts: number;
  quantity: number;
  /** Average hours the appliance runs on a day it is used. */
  hoursPerDay: number;
  /** Days per week the appliance is used. */
  daysPerWeek: number;
  /** Fraction of nameplate power while running. Default 1. */
  dutyCycle?: number;
}

export interface ConsumptionInput {
  appliances?: ApplianceLoad[];
  /** Used when the bill or a utility total is the source, kWh/month. */
  monthlyKwh?: number;
  /** kWh/year. Overrides the monthly total when both are set. */
  annualKwh?: number;
  monthlyBillUsd?: number;
  /** Energy charge used to convert a bill into kWh, $/kWh. */
  rateUsdPerKwh?: number;
}

export interface ConsumptionResult {
  source: "appliances" | "annual-kwh" | "monthly-kwh" | "bill";
  /** Average daily AC energy, kWh/day. */
  dailyAcKwh: number;
  /** Average monthly AC energy, kWh/month, on a 365-day year. */
  monthlyAcKwh: number;
  /** Annual AC energy, kWh/year. */
  annualAcKwh: number;
  /**
   * Sum of nameplate power, kW. This is an upper bound, not a measured
   * coincident demand.
   */
  nameplateSumKw: number;
  applianceDailyKwh: { id: string; name: string; dailyAcKwh: number }[];
  assumptions: string[];
}

/**
 * Daily energy of one appliance.
 *
 * Formula:
 *   kWh/day = W × quantity × hours/day × (days/week / 7) × duty × (1 kW / 1000 W)
 *
 * Hours are averaged across the week, so a weekend-only load is not a daily peak.
 */
export function applianceDailyKwh(load: ApplianceLoad): number {
  assertRange(load.watts, `${load.name} watts`, 0, 1_000_000);
  assertRange(load.quantity, `${load.name} quantity`, 0, 10_000);
  assertRange(load.hoursPerDay, `${load.name} hours per day`, 0, 24);
  assertRange(load.daysPerWeek, `${load.name} days per week`, 0, 7);
  const duty = load.dutyCycle ?? 1;
  assertRange(duty, `${load.name} duty cycle`, 0, 1);
  return wattsToKilowatts(load.watts) * load.quantity * load.hoursPerDay * (load.daysPerWeek / 7) * duty;
}

/**
 * Estimate household or site AC consumption.
 *
 * Precedence: annual kWh, then monthly kWh, then bill divided by the energy rate,
 * then the appliance list. A bill includes fixed charges unless the user enters
 * only the energy portion, so bill-derived kWh are approximate.
 *
 * Monthly energy is annual / 12, not a calendar-month bill.
 */
export function estimateConsumption(input: ConsumptionInput): ConsumptionResult {
  const appliances = input.appliances ?? [];
  const applianceDaily = appliances.map((load) => ({
    id: load.id,
    name: load.name,
    dailyAcKwh: applianceDailyKwh(load),
  }));
  const nameplateSumKw = appliances.reduce((sum, load) => sum + wattsToKilowatts(load.watts) * load.quantity, 0);
  const assumptions = [
    "Power (kW) and energy (kWh) are reported separately. Nameplate sum is not coincident demand.",
    "Monthly energy is the annual total divided by 12.",
  ];

  if (input.annualKwh !== undefined) {
    assertRange(input.annualKwh, "Annual consumption", 0, 100_000_000);
    const annualAcKwh = input.annualKwh;
    return {
      source: "annual-kwh",
      dailyAcKwh: annualAcKwh / 365,
      monthlyAcKwh: annualAcKwh / 12,
      annualAcKwh,
      nameplateSumKw,
      applianceDailyKwh: applianceDaily,
      assumptions,
    };
  }
  if (input.monthlyKwh !== undefined) {
    assertRange(input.monthlyKwh, "Monthly consumption", 0, 10_000_000);
    const annualAcKwh = input.monthlyKwh * 12;
    return {
      source: "monthly-kwh",
      dailyAcKwh: annualAcKwh / 365,
      monthlyAcKwh: input.monthlyKwh,
      annualAcKwh,
      nameplateSumKw,
      applianceDailyKwh: applianceDaily,
      assumptions,
    };
  }
  if (input.monthlyBillUsd !== undefined) {
    assertRange(input.monthlyBillUsd, "Monthly bill", 0, 10_000_000);
    const rate = input.rateUsdPerKwh ?? 0.16;
    assertRange(rate, "Electricity rate", 0.01, 5);
    const monthlyAcKwh = input.monthlyBillUsd / rate;
    const annualAcKwh = monthlyAcKwh * 12;
    assumptions.push("Bill ÷ energy rate ignores fixed charges, taxes, and demand charges unless they were excluded from the bill amount.");
    return {
      source: "bill",
      dailyAcKwh: annualAcKwh / 365,
      monthlyAcKwh,
      annualAcKwh,
      nameplateSumKw,
      applianceDailyKwh: applianceDaily,
      assumptions,
    };
  }
  const dailyAcKwh = applianceDaily.reduce((sum, row) => sum + row.dailyAcKwh, 0);
  const annualAcKwh = dailyAcKwh * 365;
  assumptions.push("Appliance totals use the hours and duty cycle you entered. Standby loads you did not list are omitted.");
  return {
    source: "appliances",
    dailyAcKwh,
    monthlyAcKwh: annualAcKwh / 12,
    annualAcKwh,
    nameplateSumKw,
    applianceDailyKwh: applianceDaily,
    assumptions,
  };
}
