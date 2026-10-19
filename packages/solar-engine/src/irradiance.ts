import {
  assertAzimuth,
  assertLatitude,
  assertTilt,
  degreesToRadians,
  northClockwiseToSouthZero,
} from "./angles";
import { assertRange } from "./errors";
import { solarDeclinationDeg, julianDayUtc } from "./solar-position";
import { wattHoursToKilowattHours } from "./units";

/** Duffie & Beckman recommended average days, day-of-year. */
export const REPRESENTATIVE_DAY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344] as const;

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Solar constant, W/m². */
export const SOLAR_CONSTANT_W_M2 = 1367;

export type IrradianceSource = "approximate-clearness-model" | "user-supplied-horizontal";

export interface IrradianceInput {
  latitudeDeg: number;
  /** Degrees clockwise from true north. */
  tiltDeg: number;
  azimuthDeg: number;
  /**
   * Optional measured or imported average daily global horizontal irradiation,
   * kWh/m²/day, length 12. When omitted, a latitude-shaped clearness index is used
   * and the result is labeled approximate.
   */
  monthlyHorizontalKwhPerM2Day?: number[];
  /** Ground reflectance, 0 to 1. Default 0.2. */
  albedo?: number;
}

export interface MonthlyIrradiation {
  monthIndex: number;
  month: string;
  days: number;
  /** Average daily extraterrestrial horizontal irradiation, kWh/m²/day. */
  extraTerrestrialKwhPerM2Day: number;
  clearnessIndex: number;
  /** Average daily global horizontal irradiation, kWh/m²/day. */
  horizontalKwhPerM2Day: number;
  /** Average daily plane-of-array irradiation, kWh/m²/day. */
  planeOfArrayKwhPerM2Day: number;
  /** Monthly plane-of-array total, kWh/m². */
  planeOfArrayKwhPerM2: number;
}

export interface IrradiationResult {
  source: IrradianceSource;
  monthly: MonthlyIrradiation[];
  /** Annual plane-of-array total, kWh/m²/year. */
  annualPlaneOfArrayKwhPerM2: number;
  /** Annual horizontal total, kWh/m²/year. */
  annualHorizontalKwhPerM2: number;
  limitations: string[];
}

function monthDays(index: number): number {
  const days = DAYS_IN_MONTH[index];
  if (days === undefined) throw new Error(`Month ${index} is out of range.`);
  return days;
}

function representativeDay(index: number): number {
  const day = REPRESENTATIVE_DAY[index];
  if (day === undefined) throw new Error(`Month ${index} is out of range.`);
  return day;
}

/**
 * Default monthly clearness index Kt.
 *
 * This is not weather data. It is a bright-temperate planning curve so orientation
 * still matters when the user has not imported a weather file: higher in the local
 * summer, lower in winter, slightly lower at high latitudes. Cloudy coastal sites
 * will produce less than this curve. Replace it with NREL, PVGIS, or measured
 * monthly irradiation before treating results as site-specific.
 *
 * Output is dimensionless, about 0.40 to 0.70.
 */
export function approximateClearnessIndex(latitudeDeg: number, monthIndex: number): number {
  assertLatitude(latitudeDeg);
  assertRange(monthIndex, "Month index", 0, 11);
  const summerPeak = latitudeDeg >= 0 ? 6 : 0;
  const seasonal = Math.cos((2 * Math.PI * (monthIndex - summerPeak)) / 12);
  const latitudePenalty = Math.min(0.12, Math.abs(latitudeDeg) / 750);
  const kt = 0.6 + 0.08 * seasonal - latitudePenalty;
  return Math.min(0.75, Math.max(0.38, kt));
}

/**
 * Cosine of the angle between the sun and the module normal.
 *
 * Model: Duffie & Beckman eq. 1.6.2.
 * Surface azimuth is converted from degrees clockwise from north into the
 * Duffie convention (0° due south, east negative, west positive).
 * Hour angle is degrees, negative in the morning, zero at solar noon.
 * Output is dimensionless. Negative means the sun is behind the module.
 */
export function cosineOfIncidence(
  latitudeDeg: number,
  tiltDeg: number,
  azimuthFromNorthDeg: number,
  declinationDeg: number,
  hourAngleDeg: number,
): number {
  const phi = degreesToRadians(latitudeDeg);
  const delta = degreesToRadians(declinationDeg);
  const beta = degreesToRadians(tiltDeg);
  const gamma = degreesToRadians(northClockwiseToSouthZero(azimuthFromNorthDeg));
  const omega = degreesToRadians(hourAngleDeg);
  return (
    Math.sin(delta) * Math.sin(phi) * Math.cos(beta) -
    Math.sin(delta) * Math.cos(phi) * Math.sin(beta) * Math.cos(gamma) +
    Math.cos(delta) * Math.cos(phi) * Math.cos(beta) * Math.cos(omega) +
    Math.cos(delta) * Math.sin(phi) * Math.sin(beta) * Math.cos(gamma) * Math.cos(omega) +
    Math.cos(delta) * Math.sin(beta) * Math.sin(gamma) * Math.sin(omega)
  );
}

/**
 * Daily extraterrestrial horizontal irradiation.
 *
 * Model: Duffie & Beckman eq. 1.10.2.
 * H0 = (24/π) Gsc (1 + 0.033 cos(2π n / 365)) (cos φ cos δ sin ωs + ωs sin φ sin δ)
 *
 * Inputs: latitude degrees, day of year, declination degrees.
 * Output: kWh/m²/day.
 * Polar night returns 0. Polar day uses ωs = π.
 */
export function extraterrestrialHorizontalKwh(latitudeDeg: number, dayOfYear: number, declinationDeg: number): number {
  const phi = degreesToRadians(latitudeDeg);
  const delta = degreesToRadians(declinationDeg);
  const cosArg = -Math.tan(phi) * Math.tan(delta);
  let omegaS: number;
  if (cosArg <= -1) omegaS = Math.PI;
  else if (cosArg >= 1) return 0;
  else omegaS = Math.acos(cosArg);
  const eccentricity = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const bracket = Math.cos(phi) * Math.cos(delta) * Math.sin(omegaS) + omegaS * Math.sin(phi) * Math.sin(delta);
  const wattHours = ((24 / Math.PI) * SOLAR_CONSTANT_W_M2 * eccentricity * bracket);
  return Math.max(0, wattHoursToKilowattHours(wattHours));
}

function declinationForDay(year: number, dayOfYear: number): number {
  const date = new Date(Date.UTC(year, 0, dayOfYear));
  const jd = julianDayUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 12, 0, 0);
  return solarDeclinationDeg((jd - 2451545.0) / 36525.0);
}

/**
 * Hourly transposition for one average day.
 *
 * Diffuse fraction: Erbs et al. correlation on the daily clearness index.
 * Hourly global fraction: Collares-Pereira & Rabl (1979).
 * Hourly diffuse fraction: Liu & Jordan.
 * Sky model: isotropic (Liu & Jordan). Ground reflection uses a constant albedo.
 *
 * Surface azimuth is converted from north-clockwise to the Duffie south-zero convention.
 * Beam is omitted when the sun is below 5°, where 1/cos(zenith) becomes unstable.
 *
 * Output of the sum is Wh/m² for that day.
 */
function hourlyPlaneOfArray(
  latitudeDeg: number,
  tiltDeg: number,
  azimuthFromNorthDeg: number,
  declinationDeg: number,
  dailyHorizontalKwh: number,
  clearness: number,
  albedo: number,
): { poaWh: number; horizontalWh: number } {
  const phi = degreesToRadians(latitudeDeg);
  const delta = degreesToRadians(declinationDeg);
  const beta = degreesToRadians(tiltDeg);
  const hWh = dailyHorizontalKwh * 1000;
  const cosArg = -Math.tan(phi) * Math.tan(delta);
  const omegaS = cosArg <= -1 ? Math.PI : cosArg >= 1 ? 0 : Math.acos(Math.min(1, Math.max(-1, cosArg)));
  if (omegaS === 0 || hWh <= 0) return { poaWh: 0, horizontalWh: 0 };

  let kd: number;
  if (clearness <= 0.22) kd = 1 - 0.09 * clearness;
  else if (clearness <= 0.8) {
    kd = 0.9511 - 0.1604 * clearness + 4.388 * clearness ** 2 - 16.638 * clearness ** 3 + 12.336 * clearness ** 4;
  } else kd = 0.165;
  kd = Math.min(1, Math.max(0, kd));
  const hd = kd * hWh;
  const denom = Math.sin(omegaS) - omegaS * Math.cos(omegaS);
  const a = 0.409 + 0.5016 * Math.sin(omegaS - Math.PI / 3);
  const b = 0.6609 - 0.4767 * Math.sin(omegaS - Math.PI / 3);

  let poaWh = 0;
  let horizontalWh = 0;
  for (let hour = 0; hour < 24; hour += 1) {
    const omega = degreesToRadians((hour + 0.5 - 12) * 15);
    if (Math.abs(omega) >= omegaS) continue;
    const rt = (Math.PI / 24) * (a + b * Math.cos(omega)) * ((Math.cos(omega) - Math.cos(omegaS)) / denom);
    const rd = (Math.PI / 24) * ((Math.cos(omega) - Math.cos(omegaS)) / denom);
    const i = Math.max(0, rt) * hWh;
    const id = Math.min(i, Math.max(0, rd) * hd);
    const ib = Math.max(0, i - id);
    const cosZenith = Math.sin(delta) * Math.sin(phi) + Math.cos(delta) * Math.cos(phi) * Math.cos(omega);
    if (cosZenith <= Math.cos(degreesToRadians(85))) {
      horizontalWh += i;
      poaWh += id * ((1 + Math.cos(beta)) / 2) + i * albedo * ((1 - Math.cos(beta)) / 2);
      continue;
    }
    const cosIncidence = cosineOfIncidence(
      latitudeDeg,
      tiltDeg,
      azimuthFromNorthDeg,
      declinationDeg,
      (hour + 0.5 - 12) * 15,
    );
    const beam = (ib / cosZenith) * Math.max(0, cosIncidence);
    const diffuse = id * ((1 + Math.cos(beta)) / 2);
    const ground = i * albedo * ((1 - Math.cos(beta)) / 2);
    poaWh += beam + diffuse + ground;
    horizontalWh += i;
  }
  return { poaWh, horizontalWh };
}

/**
 * Monthly and annual irradiation on a fixed plane.
 *
 * When `monthlyHorizontalKwhPerM2Day` is provided, those values are the horizontal
 * resource and only the transposition is modeled. Otherwise horizontal irradiation
 * is H0 × an approximate clearness index and must be presented as an estimate.
 *
 * Declination uses the NOAA formula at solar noon of the representative day in a
 * non-leap reference year (2023).
 *
 * Limitations: isotropic sky, no horizon profile, no snow, 365-day year,
 * and the default clearness index is not a weather file.
 */
export function estimateIrradiation(input: IrradianceInput): IrradiationResult {
  assertLatitude(input.latitudeDeg);
  assertTilt(input.tiltDeg);
  assertAzimuth(input.azimuthDeg);
  const albedo = input.albedo ?? 0.2;
  assertRange(albedo, "Albedo", 0, 1);
  const supplied = input.monthlyHorizontalKwhPerM2Day;
  if (supplied && supplied.length !== 12) {
    throw new Error("monthlyHorizontalKwhPerM2Day must contain 12 values.");
  }
  supplied?.forEach((value, index) => assertRange(value, `Horizontal irradiation month ${index + 1}`, 0, 12));

  const monthly: MonthlyIrradiation[] = [];
  for (let month = 0; month < 12; month += 1) {
    const n = representativeDay(month);
    const declination = declinationForDay(2023, n);
    const h0 = extraterrestrialHorizontalKwh(input.latitudeDeg, n, declination);
    const suppliedDay = supplied?.[month];
    const kt = suppliedDay !== undefined && h0 > 0.2 ? Math.min(0.85, suppliedDay / h0) : approximateClearnessIndex(input.latitudeDeg, month);
    const horizontal = suppliedDay ?? h0 * kt;
    const split = hourlyPlaneOfArray(input.latitudeDeg, input.tiltDeg, input.azimuthDeg, declination, horizontal, kt, albedo);
    const poaDay = wattHoursToKilowattHours(split.poaWh);
    const days = monthDays(month);
    const name = MONTH_NAMES[month];
    monthly.push({
      monthIndex: month,
      month: name ?? String(month + 1),
      days,
      extraTerrestrialKwhPerM2Day: h0,
      clearnessIndex: kt,
      horizontalKwhPerM2Day: horizontal,
      planeOfArrayKwhPerM2Day: poaDay,
      planeOfArrayKwhPerM2: poaDay * days,
    });
  }
  const source: IrradianceSource = supplied ? "user-supplied-horizontal" : "approximate-clearness-model";
  return {
    source,
    monthly,
    annualPlaneOfArrayKwhPerM2: monthly.reduce((sum, row) => sum + row.planeOfArrayKwhPerM2, 0),
    annualHorizontalKwhPerM2: monthly.reduce((sum, row) => sum + row.horizontalKwhPerM2Day * row.days, 0),
    limitations: [
      source === "approximate-clearness-model"
        ? "Horizontal irradiation uses an approximate clearness model, not measured or NREL site data."
        : "Horizontal irradiation was supplied by the user. Transposition to the array plane is still a model.",
      "The sky model is isotropic. Nearby obstacles, snow, and horizon shading are not included unless a shading loss is applied separately.",
      "The year is modeled as 365 days.",
    ],
  };
}
