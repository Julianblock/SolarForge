import {
  designScenarios,
  estimateConsumption,
  estimateFinance,
  estimateShading,
  orientationAdvice,
  sizeArray,
  sizeBatteryBank,
  type ArraySizingResult,
  type BatterySizingResult,
  type ConsumptionResult,
  type DesignScenario,
  type FinanceResult,
  type OrientationAdvice,
  type ShadingResult,
} from "@solarforge/engine";
import type { SolarProject } from "./project";

export interface ProjectResults {
  preliminary: true;
  consumption: ConsumptionResult;
  orientation: OrientationAdvice;
  array: ArraySizingResult;
  scenarios: DesignScenario[];
  battery: BatterySizingResult | null;
  shading: ShadingResult | null;
  finance: FinanceResult;
  /** Installed DC nameplate from the sized array, kW. */
  arrayKw: number;
  panelCount: number;
  assumptions: string[];
}

const MODULE_AREA_M2 = 1.722 * 1.134;

/**
 * Run the shared planning pipeline for a saved project.
 * Web and mobile both call this so the numbers match.
 *
 * Roof area, when entered, caps the module count at 70% of that area.
 * The 70% is a packing allowance, not a fire-setback survey.
 * Cost uses the entered price per watt, or $2.50/W when none is entered.
 * That allowance is a placeholder for quotes, not a market index.
 */
export function evaluateProject(project: SolarProject): ProjectResults {
  const consumption = estimateConsumption({
    monthlyKwh: project.usage.monthlyKwh,
    annualKwh: project.usage.annualKwh,
    monthlyBillUsd: project.usage.monthlyBillUsd,
    rateUsdPerKwh: project.usage.rateUsdPerKwh,
    appliances: project.usage.appliances,
  });
  const orientation = orientationAdvice(project.location.latitudeDeg);
  const shading = project.shadeObstacles && project.shadeObstacles.length > 0
    ? estimateShading({
        latitudeDeg: project.location.latitudeDeg,
        longitudeDeg: project.location.longitudeDeg,
        timezoneOffsetHours: project.location.timezoneOffsetHours,
        obstacles: project.shadeObstacles,
      })
    : null;
  const shadingLoss = Math.min(0.9, project.array.shadingLoss + (shading?.suggestedEnergyLossFraction ?? 0));
  const maxPanels = project.site.areaM2 ? Math.max(1, Math.floor((project.site.areaM2 * 0.7) / MODULE_AREA_M2)) : undefined;
  const array = sizeArray({
    dailyAcKwh: Math.max(consumption.dailyAcKwh, 0.1),
    latitudeDeg: project.location.latitudeDeg,
    tiltDeg: project.array.tiltDeg,
    azimuthDeg: project.array.azimuthDeg,
    offsetFraction: project.goals.offsetFraction,
    panelWatts: project.array.panelWatts,
    maxPanels,
    shading: shadingLoss,
  });
  const batteryInput = project.battery?.enabled
    ? {
        chemistry: project.battery.chemistry,
        nominalVoltageV: project.battery.nominalVoltageV,
        ampHours: project.battery.ampHours,
        usableDepthOfDischarge: project.battery.usableDepthOfDischarge,
        dischargeEfficiency: project.battery.dischargeEfficiency,
        continuousDischargeKw: project.battery.continuousDischargeKw,
        temperatureFactor: project.battery.temperatureFactor,
        busVoltageV: project.battery.busVoltageV,
        inverterEfficiency: project.battery.inverterEfficiency,
      }
    : undefined;
  const scenarios = designScenarios({
    dailyAcKwh: Math.max(consumption.dailyAcKwh, 0.1),
    latitudeDeg: project.location.latitudeDeg,
    azimuthDeg: project.array.azimuthDeg,
    tiltDeg: project.array.tiltDeg,
    panelWatts: project.array.panelWatts,
    maxPanels,
    shading: shadingLoss,
    battery: batteryInput,
  });
  let battery: BatterySizingResult | null = null;
  if (project.battery?.enabled) {
    battery = sizeBatteryBank({
      dailyAcKwh: Math.max(consumption.dailyAcKwh, 0.1),
      daysOfAutonomy: project.battery.daysOfAutonomy,
      inverterEfficiency: project.battery.inverterEfficiency,
      busVoltageV: project.battery.busVoltageV,
      peakAcKw:
        project.battery.continuousDischargeKw && consumption.nameplateSumKw > 0
          ? consumption.nameplateSumKw
          : undefined,
      module: {
        chemistry: project.battery.chemistry,
        nominalVoltageV: project.battery.nominalVoltageV,
        ampHours: project.battery.ampHours,
        usableDepthOfDischarge: project.battery.usableDepthOfDischarge,
        dischargeEfficiency: project.battery.dischargeEfficiency,
        continuousDischargeKw: project.battery.continuousDischargeKw,
        temperatureFactor: project.battery.temperatureFactor ?? 1,
      },
    });
  }
  const usdPerWatt = project.finance?.usdPerWatt ?? 2.5;
  const installed = project.finance?.installedCostUsd ?? array.arrayKw * 1000 * usdPerWatt;
  const finance = estimateFinance({
    installedCostUsd: installed,
    incentiveUsd: project.finance?.incentiveUsd,
    annualProductionKwh: array.production.annualAcKwh,
    annualConsumptionKwh: consumption.annualAcKwh,
    importRateUsdPerKwh: project.finance?.importRateUsdPerKwh ?? project.usage.rateUsdPerKwh ?? 0.16,
    exportRateUsdPerKwh: project.finance?.exportRateUsdPerKwh ?? 0,
    escalationRate: project.finance?.escalationRate ?? 0.02,
    discountRate: project.finance?.discountRate ?? 0.05,
    analysisYears: project.finance?.analysisYears ?? 25,
    annualMaintenanceUsd: project.finance?.annualMaintenanceUsd ?? 0,
    batteryReplacementUsd: battery ? battery.nominalBankKwh * 250 : undefined,
    batteryReplacementYear: battery ? 12 : undefined,
  });
  const assumptions = [
    "This is a preliminary planning estimate, not an engineering-certified design, permit set, or structural analysis.",
    orientation.summary,
    ...array.assumptions,
    ...consumption.assumptions,
    ...finance.assumptions,
    project.site.areaM2
      ? "Usable area is assumed to be 70% of the area you entered. Fire setbacks and structure are not checked."
      : "No roof area was entered, so the array was not limited by space.",
    project.finance?.installedCostUsd
      ? "Installed cost is the amount you entered."
      : `Installed cost uses ${usdPerWatt.toFixed(2)} USD per watt DC as a placeholder. Replace it with installer quotes.`,
    battery ? "Battery replacement is assumed at year 12 and 250 USD per nominal kWh. That is a planning allowance, not a quote." : "No battery replacement was included.",
    shading ? "Shading loss was added from the geometric obstacle screen and is still preliminary." : "No shading obstacles were modeled.",
  ];
  return {
    preliminary: true,
    consumption,
    orientation,
    array,
    scenarios,
    battery,
    shading,
    finance,
    arrayKw: array.arrayKw,
    panelCount: array.panelCount,
    assumptions,
  };
}
