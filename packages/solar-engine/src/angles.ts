import { assertRange } from "./errors";

/** Azimuth is degrees clockwise from true north: 0 N, 90 E, 180 S, 270 W. */
export const AZIMUTH_CONVENTION = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
  unit: "degrees clockwise from true north",
} as const;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Wrap degrees into [0, 360). */
export function wrap360(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Smallest signed difference a - b in degrees, range (-180, 180]. */
export function signedAngleDelta(aDeg: number, bDeg: number): number {
  return ((wrap360(aDeg) - wrap360(bDeg) + 540) % 360) - 180;
}

/**
 * Duffie & Beckman surface azimuth uses 0° due south, east negative, west positive.
 * SolarForge azimuth uses 0° north clockwise.
 * Formula: γ = wrapSigned(azimuthFromNorth - 180)
 */
export function northClockwiseToSouthZero(azimuthFromNorthDeg: number): number {
  const gamma = wrap360(azimuthFromNorthDeg) - 180;
  return gamma > 180 ? gamma - 360 : gamma;
}

export function assertLatitude(latitudeDeg: number): void {
  assertRange(latitudeDeg, "Latitude", -90, 90);
}

export function assertLongitude(longitudeDeg: number): void {
  assertRange(longitudeDeg, "Longitude", -180, 180);
}

export function assertAzimuth(azimuthDeg: number): void {
  assertRange(azimuthDeg, "Azimuth", 0, 360);
}

export function assertTilt(tiltDeg: number): void {
  assertRange(tiltDeg, "Tilt", 0, 90);
}
