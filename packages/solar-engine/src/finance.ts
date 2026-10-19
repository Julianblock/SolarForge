import { assertRange } from "./errors";

export interface FinanceInput {
  /** Installed cost before incentives, USD. */
  installedCostUsd: number;
  /** Incentives that are actually available to this project, USD. Do not assume a national credit. */
  incentiveUsd?: number;
  /** Annual AC production, kWh/year. */
  annualProductionKwh: number;
  /** Annual AC consumption, kWh/year. */
  annualConsumptionKwh: number;
  /** Energy charge for imported electricity, USD/kWh. */
  importRateUsdPerKwh: number;
  /** Credit for exported electricity, USD/kWh. Zero means exports are unpaid. */
  exportRateUsdPerKwh?: number;
  /**
   * Fraction of production used on site when no hourly dispatch is available.
   * When omitted, it is min(1, consumption / production).
   */
  selfConsumptionFraction?: number;
  /** Annual increase in electricity prices. */
  escalationRate?: number;
  /** Discount rate for present value. */
  discountRate?: number;
  analysisYears?: number;
  /** Optional battery replacement. */
  batteryReplacementUsd?: number;
  batteryReplacementYear?: number;
  annualMaintenanceUsd?: number;
}

export interface FinanceYear {
  year: number;
  savingsUsd: number;
  presentValueUsd: number;
}

export interface FinanceScenario {
  name: "low" | "medium" | "high";
  netCostUsd: number;
  firstYearSavingsUsd: number;
  lifetimeSavingsUsd: number;
  /** Simple payback, years. Null when savings are not positive. */
  simplePaybackYears: number | null;
  netPresentValueUsd: number;
  years: FinanceYear[];
}

export interface FinanceResult {
  scenarios: FinanceScenario[];
  assumptions: string[];
}

function payback(netCost: number, firstYear: number, escalation: number, maintenance: number): number | null {
  if (firstYear - maintenance <= 0) return null;
  let cumulative = 0;
  for (let year = 1; year <= 60; year += 1) {
    const savings = firstYear * (1 + escalation) ** (year - 1) - maintenance;
    const previous = cumulative;
    cumulative += savings;
    if (cumulative >= netCost) {
      const needed = netCost - previous;
      return year - 1 + needed / savings;
    }
  }
  return null;
}

function projectScenario(
  name: FinanceScenario["name"],
  input: FinanceInput,
  productionScale: number,
  costScale: number,
  escalationDelta: number,
): FinanceScenario {
  const yearsCount = input.analysisYears ?? 25;
  const escalation = (input.escalationRate ?? 0.02) + escalationDelta;
  const discount = input.discountRate ?? 0.05;
  const exportRate = input.exportRateUsdPerKwh ?? 0;
  const production = input.annualProductionKwh * productionScale;
  const self =
    input.selfConsumptionFraction ??
    (production <= 0 ? 0 : Math.min(1, input.annualConsumptionKwh / production));
  const onSite = production * self;
  const exported = production - onSite;
  const firstYear = onSite * input.importRateUsdPerKwh + exported * exportRate;
  const maintenance = input.annualMaintenanceUsd ?? 0;
  const netCost = Math.max(0, input.installedCostUsd * costScale - (input.incentiveUsd ?? 0));
  const years: FinanceYear[] = [];
  let lifetime = 0;
  let npv = -netCost;
  for (let year = 1; year <= yearsCount; year += 1) {
    let savings = firstYear * (1 + escalation) ** (year - 1) - maintenance;
    if (input.batteryReplacementYear === year) savings -= input.batteryReplacementUsd ?? 0;
    const present = savings / (1 + discount) ** year;
    lifetime += savings;
    npv += present;
    years.push({ year, savingsUsd: savings, presentValueUsd: present });
  }
  return {
    name,
    netCostUsd: netCost,
    firstYearSavingsUsd: firstYear,
    lifetimeSavingsUsd: lifetime,
    simplePaybackYears: payback(netCost, firstYear, escalation, maintenance),
    netPresentValueUsd: npv,
    years,
  };
}

/**
 * Bill savings, simple payback, and net present value.
 *
 * On-site energy is valued at the import rate. Exports use the export rate,
 * which defaults to zero rather than an assumed net-metering policy.
 * Low and high cases scale production and cost. They are sensitivity cases,
 * not confidence intervals from measured weather.
 *
 * Incentives are included only when the caller passes a verified dollar amount.
 */
export function estimateFinance(input: FinanceInput): FinanceResult {
  assertRange(input.installedCostUsd, "Installed cost", 0, 100_000_000);
  assertRange(input.annualProductionKwh, "Annual production", 0, 100_000_000);
  assertRange(input.annualConsumptionKwh, "Annual consumption", 0, 100_000_000);
  assertRange(input.importRateUsdPerKwh, "Import rate", 0, 5);
  if (input.exportRateUsdPerKwh !== undefined) assertRange(input.exportRateUsdPerKwh, "Export rate", 0, 5);
  if (input.selfConsumptionFraction !== undefined) assertRange(input.selfConsumptionFraction, "Self-consumption", 0, 1);
  if (input.escalationRate !== undefined) assertRange(input.escalationRate, "Escalation", -0.05, 0.15);
  if (input.discountRate !== undefined) assertRange(input.discountRate, "Discount rate", 0, 0.2);
  if (input.incentiveUsd !== undefined) assertRange(input.incentiveUsd, "Incentive", 0, input.installedCostUsd);
  return {
    scenarios: [
      projectScenario("low", input, 0.85, 1.1, -0.01),
      projectScenario("medium", input, 1, 1, 0),
      projectScenario("high", input, 1.1, 0.95, 0.01),
    ],
    assumptions: [
      "Savings value on-site solar at the import rate and exports at the export rate. Export rate defaults to zero.",
      "Self-consumption defaults to the lesser of consumption and production. That is an annual ratio, not an hourly load shape.",
      "Low and high cases are sensitivity bands: production ±15% and 10%, cost +10% and −5%.",
      "No tax credit or rebate is applied unless an incentive amount is entered.",
      "Simple payback ignores discounting. Net present value uses the discount rate and any battery replacement you entered.",
    ],
  };
}
