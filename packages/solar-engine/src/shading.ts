import { assertAzimuth, assertLatitude, signedAngleDelta } from "./angles";
import { assertRange } from "./errors";
import { solarPosition, type CivilTime } from "./solar-position";

export type ObstacleKind = "tree" | "building" | "roof" | "terrain" | "chimney";

export interface ShadeObstacle {
  id: string;
  label: string;
  kind: ObstacleKind;
  /** Height of the obstacle above the array plane, meters. */
  heightM: number;
  /** Horizontal distance from the array to the obstacle, meters. */
  distanceM: number;
  /** Direction from the array toward the obstacle, degrees clockwise from north. */
  azimuthDeg: number;
  /** Obstacle width, meters. Used to estimate the angle it subtends. */
  widthM?: number;
}

export interface ShadingInput {
  latitudeDeg: number;
  longitudeDeg: number;
  timezoneOffsetHours: number;
  obstacles: ShadeObstacle[];
  /** Year used for the representative sun path. Geometry changes little year to year. */
  year?: number;
}

export interface ShadingResult {
  /** Fraction of sampled sun-up hours with the beam blocked. */
  annualSunlightBlockedFraction: number;
  monthlyBlockedFraction: number[];
  /** Suggested energy derate. Beam-only, so it is smaller than a total blackout of those hours. */
  suggestedEnergyLossFraction: number;
  preliminary: true;
  notes: string[];
}

const SAMPLE_DAYS = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

/**
 * Geometric shading screen.
 *
 * For each representative day and each clock hour, the sun is blocked when it is
 * above the horizon, its azimuth is inside the obstacle's angular width, and its
 * elevation is below atan(height / distance).
 *
 * Angular width defaults from the obstacle width. When width is omitted, a 20°
 * width is assumed and called out.
 *
 * The energy loss suggestion multiplies the blocked-hour fraction by 0.7, because
 * diffuse light still reaches a tilted array. That factor is an assumption, not a
 * measured diffuse split.
 *
 * Limitations: no 3D roof, no LiDAR, no mutual row shade, and a single timezone
 * offset for the year. Treat the result as preliminary.
 */
export function estimateShading(input: ShadingInput): ShadingResult {
  assertLatitude(input.latitudeDeg);
  assertRange(input.longitudeDeg, "Longitude", -180, 180);
  assertRange(input.timezoneOffsetHours, "Timezone offset", -12, 14);
  const year = input.year ?? 2023;
  const notes = [
    "Shading is a geometric screen on a representative day each month, not a LiDAR or photographic shade study.",
    "Diffuse irradiance is assumed to cover about 30% of the energy in a blocked hour.",
  ];
  if (input.obstacles.length === 0) {
    return {
      annualSunlightBlockedFraction: 0,
      monthlyBlockedFraction: Array(12).fill(0),
      suggestedEnergyLossFraction: 0,
      preliminary: true,
      notes: ["No obstacles were entered.", ...notes],
    };
  }

  const prepared = input.obstacles.map((obstacle) => {
    assertRange(obstacle.heightM, `${obstacle.label} height`, 0, 200);
    assertRange(obstacle.distanceM, `${obstacle.label} distance`, 0.2, 5000);
    assertAzimuth(obstacle.azimuthDeg);
    let widthDeg = 20;
    if (obstacle.widthM !== undefined) {
      assertRange(obstacle.widthM, `${obstacle.label} width`, 0.1, 500);
      widthDeg = (2 * Math.atan(obstacle.widthM / 2 / obstacle.distanceM) * 180) / Math.PI;
    } else {
      notes.push(`${obstacle.label} has no width, so a 20° angular width was assumed.`);
    }
    const elevationLimit = (Math.atan(obstacle.heightM / obstacle.distanceM) * 180) / Math.PI;
    return { ...obstacle, widthDeg, elevationLimit };
  });

  const monthlyBlocked: number[] = [];
  let sunUp = 0;
  let blocked = 0;
  for (let month = 0; month < 12; month += 1) {
    const day = SAMPLE_DAYS[month] ?? 15;
    const date = new Date(Date.UTC(year, 0, day));
    let monthUp = 0;
    let monthBlocked = 0;
    for (let hour = 0; hour < 24; hour += 1) {
      const time: CivilTime = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour,
        timezoneOffsetHours: input.timezoneOffsetHours,
      };
      const sun = solarPosition(input.latitudeDeg, input.longitudeDeg, time);
      if (sun.elevationDeg <= 0) continue;
      monthUp += 1;
      const hit = prepared.some(
        (obstacle) =>
          Math.abs(signedAngleDelta(sun.azimuthDeg, obstacle.azimuthDeg)) <= obstacle.widthDeg / 2 &&
          sun.elevationDeg < obstacle.elevationLimit,
      );
      if (hit) monthBlocked += 1;
    }
    sunUp += monthUp;
    blocked += monthBlocked;
    monthlyBlocked.push(monthUp === 0 ? 0 : monthBlocked / monthUp);
  }
  const annual = sunUp === 0 ? 0 : blocked / sunUp;
  return {
    annualSunlightBlockedFraction: annual,
    monthlyBlockedFraction: monthlyBlocked,
    suggestedEnergyLossFraction: Math.min(0.9, annual * 0.7),
    preliminary: true,
    notes,
  };
}
