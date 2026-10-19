import type { BatterySizingResult } from "./battery";
import { sizeBatteryBank, type BatteryModule } from "./battery";
import { orientationAdvice } from "./guidance";
import { sizeArray, type ArraySizingResult } from "./sizing";

export type ScenarioId = "lowest-cost" | "max-production" | "best-backup" | "independence" | "balanced";

export interface ScenarioInput {
  dailyAcKwh: number;
  latitudeDeg: number;
  /** Roof or site azimuth constraint. When omitted, the equator-facing direction is used. */
  azimuthDeg?: number;
  tiltDeg?: number;
  panelWatts: number;
  maxPanels?: number;
  shading?: number;
  monthlyHorizontalKwhPerM2Day?: number[];
  /** Included when the scenario adds storage. */
  battery?: BatteryModule & { busVoltageV: number; inverterEfficiency: number };
}

export interface DesignScenario {
  id: ScenarioId;
  title: string;
  description: string;
  array: ArraySizingResult;
  battery: BatterySizingResult | null;
}

const COPY: Record<ScenarioId, { title: string; description: string }> = {
  "lowest-cost": {
    title: "Spend less",
    description: "Fewer panels. Covers about 70% of a year of electricity. No battery.",
  },
  "max-production": {
    title: "Make the most electricity",
    description: "Enough panels to match a full year of use. No battery, so nights still come from the power company.",
  },
  "best-backup": {
    title: "Keep the lights on",
    description: "Panels for your usage, plus a battery for about two days without sun, if you turned a battery on.",
  },
  independence: {
    title: "Cover more than you use",
    description: "About 20% extra panels, plus a battery for about three days, if you turned a battery on.",
  },
  balanced: {
    title: "A middle option",
    description: "Enough panels for a full year, and one day of battery if you turned a battery on.",
  },
};

/**
 * Five planning scenarios that share one weather model and module rating.
 * Battery scenarios are omitted, not faked, when no module is supplied.
 */
export function designScenarios(input: ScenarioInput): DesignScenario[] {
  const advice = orientationAdvice(input.latitudeDeg);
  const azimuth = input.azimuthDeg ?? advice.preferredAzimuthDeg;
  const thumb = input.tiltDeg ?? advice.ruleOfThumbTiltDeg;
  const bestTilt = advice.modeledBestTiltDeg;
  const plans: { id: ScenarioId; offset: number; tilt: number; autonomy: number | null }[] = [
    { id: "lowest-cost", offset: 0.7, tilt: thumb, autonomy: null },
    { id: "max-production", offset: 1, tilt: bestTilt, autonomy: null },
    { id: "best-backup", offset: 1, tilt: thumb, autonomy: 2 },
    { id: "independence", offset: 1.2, tilt: bestTilt, autonomy: 3 },
    { id: "balanced", offset: 1, tilt: thumb, autonomy: 1 },
  ];
  return plans.map((plan) => {
    const array = sizeArray({
      dailyAcKwh: input.dailyAcKwh,
      latitudeDeg: input.latitudeDeg,
      tiltDeg: plan.tilt,
      azimuthDeg: azimuth,
      offsetFraction: plan.offset,
      panelWatts: input.panelWatts,
      maxPanels: input.maxPanels,
      shading: input.shading,
      monthlyHorizontalKwhPerM2Day: input.monthlyHorizontalKwhPerM2Day,
    });
    let battery: BatterySizingResult | null = null;
    if (plan.autonomy !== null && input.battery) {
      battery = sizeBatteryBank({
        dailyAcKwh: input.dailyAcKwh,
        daysOfAutonomy: plan.autonomy,
        inverterEfficiency: input.battery.inverterEfficiency,
        busVoltageV: input.battery.busVoltageV,
        module: input.battery,
      });
    }
    return {
      id: plan.id,
      title: COPY[plan.id].title,
      description: COPY[plan.id].description,
      array,
      battery,
    };
  });
}
