import { assertLatitude, assertLongitude, degreesToRadians, radiansToDegrees, wrap360 } from "./angles";
import { assertRange, SolarInputError } from "./errors";

/**
 * Clock time at a site. `timezoneOffsetHours` is hours east of UTC for that clock,
 * including daylight saving when it is in effect (US Pacific Daylight Time is -7).
 */
export interface CivilTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  second?: number;
  timezoneOffsetHours: number;
}

export interface SolarPosition {
  /** Julian day at the corresponding UTC instant. */
  julianDay: number;
  /** Solar declination, degrees north of the celestial equator. */
  declinationDeg: number;
  /** Equation of time, minutes. Solar time minus mean time, approximately. */
  equationOfTimeMin: number;
  /** Hour angle, degrees. 0 at solar noon, negative in the morning. */
  hourAngleDeg: number;
  /** Apparent elevation above the horizon after refraction, degrees. */
  elevationDeg: number;
  /** Apparent zenith angle, degrees. */
  zenithDeg: number;
  /**
   * Solar azimuth, degrees clockwise from true north.
   * 0 north, 90 east, 180 south, 270 west.
   */
  azimuthDeg: number;
  /** True solar time, minutes past local midnight. */
  trueSolarTimeMin: number;
}

export interface SunriseSunset {
  /** Local clock hours from midnight, or null during polar day/night. */
  sunriseLocalHours: number | null;
  sunsetLocalHours: number | null;
  polar: "day" | "night" | null;
  declinationDeg: number;
  equationOfTimeMin: number;
}

/**
 * Julian day for a UTC calendar date.
 *
 * Model: integer Gregorian conversion used by the NOAA Solar Calculator.
 * Input calendar components are UTC. Output is the Julian day number,
 * where 2451545.0 is 2000-01-01 12:00 UT.
 * Source: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 */
export function julianDayUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  const fraction = (hour + minute / 60 + second / 3600) / 24;
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + fraction + b - 1524.5;
}

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

function geomMeanLongSunDeg(t: number): number {
  let l0 = 280.46646 + t * (36000.76983 + t * 0.0003032);
  l0 %= 360;
  if (l0 < 0) l0 += 360;
  return l0;
}

function geomMeanAnomalySunDeg(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function eccentricityEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function sunEqOfCenterDeg(t: number): number {
  const m = degreesToRadians(geomMeanAnomalySunDeg(t));
  return (
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289
  );
}

function sunTrueLongDeg(t: number): number {
  return geomMeanLongSunDeg(t) + sunEqOfCenterDeg(t);
}

function sunApparentLongDeg(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return sunTrueLongDeg(t) - 0.00569 - 0.00478 * Math.sin(degreesToRadians(omega));
}

function meanObliquityDeg(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23 + (26 + seconds / 60) / 60;
}

function obliquityCorrectionDeg(t: number): number {
  const omega = 125.04 - 1934.136 * t;
  return meanObliquityDeg(t) + 0.00256 * Math.cos(degreesToRadians(omega));
}

/**
 * Solar declination for a Julian century.
 * Model: NOAA / Meeus. Output degrees.
 */
export function solarDeclinationDeg(julianCentury: number): number {
  const epsilon = degreesToRadians(obliquityCorrectionDeg(julianCentury));
  const lambda = degreesToRadians(sunApparentLongDeg(julianCentury));
  return radiansToDegrees(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));
}

/**
 * Equation of time.
 * Model: NOAA / Meeus. Output minutes.
 */
export function equationOfTimeMin(julianCentury: number): number {
  const epsilon = obliquityCorrectionDeg(julianCentury);
  const l0 = geomMeanLongSunDeg(julianCentury);
  const e = eccentricityEarthOrbit(julianCentury);
  const m = geomMeanAnomalySunDeg(julianCentury);
  const y = Math.tan(degreesToRadians(epsilon) / 2);
  const y2 = y * y;
  const sin2l0 = Math.sin(2 * degreesToRadians(l0));
  const sinM = Math.sin(degreesToRadians(m));
  const cos2l0 = Math.cos(2 * degreesToRadians(l0));
  const sin4l0 = Math.sin(4 * degreesToRadians(l0));
  const sin2m = Math.sin(2 * degreesToRadians(m));
  const eTime = y2 * sin2l0 - 2 * e * sinM + 4 * e * y2 * sinM * cos2l0 - 0.5 * y2 * y2 * sin4l0 - 1.25 * e * e * sin2m;
  return radiansToDegrees(eTime) * 4;
}

function sunriseHourAngleRad(latitudeDeg: number, declinationDeg: number): number | "day" | "night" {
  const lat = degreesToRadians(latitudeDeg);
  const dec = degreesToRadians(declinationDeg);
  const argument = Math.cos(degreesToRadians(90.833)) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec);
  if (argument > 1) return "night";
  if (argument < -1) return "day";
  return Math.acos(argument);
}

function utcFromCivil(time: CivilTime): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  assertRange(time.month, "Month", 1, 12);
  assertRange(time.day, "Day", 1, 31);
  assertRange(time.hour, "Hour", 0, 23);
  const minute = time.minute ?? 0;
  const second = time.second ?? 0;
  assertRange(minute, "Minute", 0, 59);
  assertRange(second, "Second", 0, 59);
  assertRange(time.timezoneOffsetHours, "Timezone offset", -12, 14);
  const utcMs = Date.UTC(time.year, time.month - 1, time.day, time.hour, minute, second) - time.timezoneOffsetHours * 3600 * 1000;
  const utc = new Date(utcMs);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    hour: utc.getUTCHours(),
    minute: utc.getUTCMinutes(),
    second: utc.getUTCSeconds(),
  };
}

/**
 * Apparent solar position for a local civil time.
 *
 * Model: NOAA Solar Calculator (Meeus / Astronomical Almanac) with the
 * Bennett-style refraction correction used by NOAA.
 * Source: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 *
 * Longitude is degrees east of Greenwich (west is negative), matching GPS.
 * Azimuth is degrees clockwise from true north.
 *
 * Limitations: typical accuracy is well under 0.1° away from the horizon.
 * Refraction near the horizon is approximate and ignores local pressure
 * and temperature. This is not the NREL Solar Position Algorithm.
 */
export function solarPosition(latitudeDeg: number, longitudeDeg: number, time: CivilTime): SolarPosition {
  assertLatitude(latitudeDeg);
  assertLongitude(longitudeDeg);
  const utc = utcFromCivil(time);
  const jd = julianDayUtc(utc.year, utc.month, utc.day, utc.hour, utc.minute, utc.second);
  const t = julianCenturies(jd);
  const declination = solarDeclinationDeg(t);
  const eqTime = equationOfTimeMin(t);
  const localMinutes = time.hour * 60 + (time.minute ?? 0) + (time.second ?? 0) / 60;
  let trueSolarTime = localMinutes + eqTime + 4 * longitudeDeg - 60 * time.timezoneOffsetHours;
  trueSolarTime = ((trueSolarTime % 1440) + 1440) % 1440;
  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;

  const latRad = degreesToRadians(latitudeDeg);
  const decRad = degreesToRadians(declination);
  const haRad = degreesToRadians(hourAngle);
  let cosZenith = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  cosZenith = Math.min(1, Math.max(-1, cosZenith));
  const zenithGeometric = radiansToDegrees(Math.acos(cosZenith));
  const elevationGeometric = 90 - zenithGeometric;

  let azimuth: number;
  const azDenom = Math.cos(latRad) * Math.sin(degreesToRadians(zenithGeometric));
  if (Math.abs(azDenom) > 0.001) {
    let azRad = (Math.sin(latRad) * Math.cos(degreesToRadians(zenithGeometric)) - Math.sin(decRad)) / azDenom;
    azRad = Math.min(1, Math.max(-1, azRad));
    azimuth = 180 - radiansToDegrees(Math.acos(azRad));
    if (hourAngle > 0) azimuth = -azimuth;
  } else {
    azimuth = latitudeDeg > 0 ? 180 : 0;
  }
  if (azimuth < 0) azimuth += 360;

  let refraction = 0;
  if (elevationGeometric <= 85) {
    const te = Math.tan(degreesToRadians(elevationGeometric));
    if (elevationGeometric > 5) {
      refraction = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / (te * te * te * te * te);
    } else if (elevationGeometric > -0.575) {
      refraction =
        1735 +
        elevationGeometric * (-518.2 + elevationGeometric * (103.4 + elevationGeometric * (-12.79 + elevationGeometric * 0.711)));
    } else {
      refraction = -20.774 / te;
    }
    refraction /= 3600;
  }
  const zenithDeg = zenithGeometric - refraction;
  return {
    julianDay: jd,
    declinationDeg: declination,
    equationOfTimeMin: eqTime,
    hourAngleDeg: hourAngle,
    elevationDeg: 90 - zenithDeg,
    zenithDeg,
    azimuthDeg: wrap360(azimuth),
    trueSolarTimeMin: trueSolarTime,
  };
}

/**
 * Sunrise and sunset in local clock hours for a calendar date.
 *
 * Model: NOAA geometric sunrise at 90.833° zenith (0.833° refraction and
 * solar radius). Output hours are local civil time using the supplied offset.
 * Polar day and polar night return null clock times.
 *
 * Limitations: one timezone offset is applied to the whole date, so a
 * daylight-saving transition morning is not modeled unless the caller passes
 * the offset in effect. Mountains and terrain are ignored.
 */
export function sunriseSunset(latitudeDeg: number, longitudeDeg: number, time: Omit<CivilTime, "hour" | "minute" | "second">): SunriseSunset {
  assertLatitude(latitudeDeg);
  assertLongitude(longitudeDeg);
  const utcNoonGuess = utcFromCivil({ ...time, hour: 12 });
  const jd = julianDayUtc(utcNoonGuess.year, utcNoonGuess.month, utcNoonGuess.day);
  const t = julianCenturies(jd);
  const declination = solarDeclinationDeg(t);
  const eqTime = equationOfTimeMin(t);
  const ha = sunriseHourAngleRad(latitudeDeg, declination);
  if (ha === "day" || ha === "night") {
    return {
      sunriseLocalHours: null,
      sunsetLocalHours: null,
      polar: ha,
      declinationDeg: declination,
      equationOfTimeMin: eqTime,
    };
  }
  const haDeg = radiansToDegrees(ha);
  const sunriseUtcMin = 720 - 4 * (longitudeDeg + haDeg) - eqTime;
  const sunsetUtcMin = 720 - 4 * (longitudeDeg - haDeg) - eqTime;
  const toLocal = (utcMin: number) => {
    const local = utcMin / 60 + time.timezoneOffsetHours;
    return ((local % 24) + 24) % 24;
  };
  return {
    sunriseLocalHours: toLocal(sunriseUtcMin),
    sunsetLocalHours: toLocal(sunsetUtcMin),
    polar: null,
    declinationDeg: declination,
    equationOfTimeMin: eqTime,
  };
}

/** Day of year, 1 through 365 or 366. */
export function dayOfYear(year: number, month: number, day: number): number {
  const utc = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  const n = Math.floor((utc - start) / 86_400_000) + 1;
  if (n < 1 || n > 366) throw new SolarInputError("Date is outside a calendar year.");
  return n;
}

/**
 * Hourly solar positions from local hour 0 through 23.
 * Useful for sun-path drawings. Each sample is the start of that clock hour.
 */
export function dailySunPath(latitudeDeg: number, longitudeDeg: number, time: Omit<CivilTime, "hour" | "minute" | "second">): SolarPosition[] {
  return Array.from({ length: 24 }, (_, hour) => solarPosition(latitudeDeg, longitudeDeg, { ...time, hour, minute: 0 }));
}
