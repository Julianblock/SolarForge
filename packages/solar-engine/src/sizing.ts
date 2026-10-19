import { assertRange } from "./errors";
import { estimateProduction, type LossInputs, type ProductionResult } from "./production";
import { wattsToKilowatts } from "./units";

export interface ArraySizingInput {
  /** Average daily AC consumption, kWh/day. */
  dailyAcKwh: number;
  latitudeDeg: number;
  tiltDeg: number;
  azimuthDeg: number;
  /** Fraction of annual consumption the array should supply. 1 = 100%. */
  offsetFraction: number;
  /** STC watts of one module. */
  panelWatts: number;
  /** Optional cap on module count from roof area. */
  maxPanels?: number;
  shading?: number;
  losses?: LossInputs;
  monthlyHorizontalKwhPerM2Day?: number[];
  gammaPerC?: number;
}

export interface ArraySizingResult {
  /** DC nameplate required before rounding up to whole modules, kW. */
  requiredArrayKw: number;
  panelCount: number;
  /** Installed DC nameplate, kW. */
  arrayKw: number;
  /** Module footprint is not computed here; this is electrical size only. */
  production: ProductionResult;
  /** annual AC production / annual AC consumption. */
  offsetFraction: number;
  /** Production above consumption, kWh/year. Zero when the array is smaller than the load. */
  surplusAcKwh: number;
  /** Consumption not covered by the annual total, kWh/year. This is not an hourly import. */
  residualAcKwh: number;
  limitedByMaxPanels: boolean;
  assumptions: string[];
}

/**
 * Size a fixed array to a target annual offset.
 *
 * Method: estimate the specific yield (kWh AC per kW DC) of a 1 kW reference
 * array at the same orientation, then
 *   kW = (daily kWh × 365 × offset) / specific yield.
 * Module count is rounded up. The reported production is resimulated at the
 * rounded size so temperature and losses match that array.
 *
 * Limitations: annual energy balance, not hourly self-consumption. A 100%
 * annual offset still imports at night unless storage or net metering is modeled
 * in the finance module.
 */
export function sizeArray(input: ArraySizingInput): ArraySizingResult {
  assertRange(input.dailyAcKwh, "Daily consumption", 0, 100_000);
  assertRange(input.offsetFraction, "Offset", 0.05, 2);
  assertRange(input.panelWatts, "Panel rating", 50, 1000);
  const reference = estimateProduction({
    latitudeDeg: input.latitudeDeg,
    tiltDeg: input.tiltDeg,
    azimuthDeg: input.azimuthDeg,
    arrayKw: 1,
    monthlyHorizontalKwhPerM2Day: input.monthlyHorizontalKwhPerM2Day,
    gammaPerC: input.gammaPerC,
    losses: { ...input.losses, shading: input.shading ?? input.losses?.shading },
  });
  const annualTargetKwh = input.dailyAcKwh * 365 * input.offsetFraction;
  const specific = Math.max(reference.specificYieldKwhPerKw, 50);
  const requiredArrayKw = annualTargetKwh / specific;
  let panelCount = Math.max(1, Math.ceil((requiredArrayKw * 1000) / input.panelWatts));
  let limited = false;
  if (input.maxPanels !== undefined) {
    assertRange(input.maxPanels, "Maximum panels", 1, 100_000);
    if (panelCount > input.maxPanels) {
      panelCount = input.maxPanels;
      limited = true;
    }
  }
  const arrayKw = wattsToKilowatts(panelCount * input.panelWatts);
  const production = estimateProduction({
    latitudeDeg: input.latitudeDeg,
    tiltDeg: input.tiltDeg,
    azimuthDeg: input.azimuthDeg,
    arrayKw,
    monthlyHorizontalKwhPerM2Day: input.monthlyHorizontalKwhPerM2Day,
    gammaPerC: input.gammaPerC,
    losses: { ...input.losses, shading: input.shading ?? input.losses?.shading },
  });
  const annualLoad = input.dailyAcKwh * 365;
  const offsetFraction = annualLoad > 0 ? production.annualAcKwh / annualLoad : 0;
  return {
    requiredArrayKw,
    panelCount,
    arrayKw,
    production,
    offsetFraction,
    surplusAcKwh: Math.max(0, production.annualAcKwh - annualLoad),
    residualAcKwh: Math.max(0, annualLoad - production.annualAcKwh),
    limitedByMaxPanels: limited,
    assumptions: [
      ...production.assumptions,
      "Array size targets annual energy, then rounds up to a whole module.",
      "Specific yield below 50 kWh/kW is treated as a model failure and is not used.",
    ],
  };
}
