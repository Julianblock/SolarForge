import { assertLatitude } from "./angles";
import { assertRange } from "./errors";
import { estimateIrradiation } from "./irradiance";

export interface OrientationAdvice {
  hemisphere: "north" | "south" | "equatorial";
  /** Preferred fixed azimuth, degrees clockwise from true north. */
  preferredAzimuthDeg: number;
  /** Rule-of-thumb tilt, degrees from horizontal. */
  ruleOfThumbTiltDeg: number;
  /** Tilt with the highest annual plane-of-array energy in the approximate model. */
  modeledBestTiltDeg: number;
  modeledBestAzimuthDeg: number;
  summary: string;
}

/**
 * Suggest a fixed orientation.
 *
 * The rule of thumb faces the equator: south (180°) when latitude is north of 2°,
 * north (0°) when latitude is south of −2°. Tilt starts near the absolute latitude,
 * capped at 40° for the rule of thumb.
 *
 * The modeled best tilt and azimuth search the approximate climate model on a
 * 15° azimuth grid and a 5° tilt grid. It is a comparison inside that model,
 * not a measured optimum for the roof.
 */
export function orientationAdvice(latitudeDeg: number): OrientationAdvice {
  assertLatitude(latitudeDeg);
  const hemisphere = latitudeDeg > 2 ? "north" : latitudeDeg < -2 ? "south" : "equatorial";
  const preferredAzimuthDeg = hemisphere === "south" ? 0 : hemisphere === "north" ? 180 : 180;
  const ruleOfThumbTiltDeg = hemisphere === "equatorial" ? 10 : Math.min(40, Math.round(Math.abs(latitudeDeg)));

  let bestAzimuth = preferredAzimuthDeg;
  let bestTilt = ruleOfThumbTiltDeg;
  let bestEnergy = -1;
  const azimuths = hemisphere === "equatorial" ? [90, 180, 270] : [preferredAzimuthDeg];
  for (const azimuth of azimuths) {
    for (let tilt = 0; tilt <= 60; tilt += 5) {
      const energy = estimateIrradiation({ latitudeDeg, tiltDeg: tilt, azimuthDeg: azimuth }).annualPlaneOfArrayKwhPerM2;
      if (energy > bestEnergy) {
        bestEnergy = energy;
        bestAzimuth = azimuth;
        bestTilt = tilt;
      }
    }
  }

  const summary =
    hemisphere === "south"
      ? "This site is in the southern hemisphere. A fixed array should generally face north, not south."
      : hemisphere === "north"
        ? "This site is in the northern hemisphere. A fixed array should generally face south."
        : "This site is near the equator. Tilt matters less, and east-of-north or west-of-north trade morning and afternoon energy.";

  return { hemisphere, preferredAzimuthDeg, ruleOfThumbTiltDeg, modeledBestTiltDeg: bestTilt, modeledBestAzimuthDeg: bestAzimuth, summary };
}

/**
 * Fraction of the modeled best fixed orientation captured by the chosen angles.
 * 1 means equal to the best point on the search grid.
 */
export function orientationCaptureFraction(latitudeDeg: number, tiltDeg: number, azimuthDeg: number): number {
  assertRange(tiltDeg, "Tilt", 0, 90);
  assertRange(azimuthDeg, "Azimuth", 0, 360);
  const advice = orientationAdvice(latitudeDeg);
  const chosen = estimateIrradiation({ latitudeDeg, tiltDeg, azimuthDeg }).annualPlaneOfArrayKwhPerM2;
  const best = estimateIrradiation({
    latitudeDeg,
    tiltDeg: advice.modeledBestTiltDeg,
    azimuthDeg: advice.modeledBestAzimuthDeg,
  }).annualPlaneOfArrayKwhPerM2;
  if (best <= 0) return 0;
  return chosen / best;
}
