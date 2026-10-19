/** Watts per kilowatt. Power and energy units are never mixed inside a formula. */
export const WATTS_PER_KILOWATT = 1000;

/** Watt-hours per kilowatt-hour. */
export const WATT_HOURS_PER_KILOWATT_HOUR = 1000;

export const HOURS_PER_DAY = 24;
export const DAYS_PER_NON_LEAP_YEAR = 365;
export const HOURS_PER_NON_LEAP_YEAR = DAYS_PER_NON_LEAP_YEAR * HOURS_PER_DAY;

/**
 * Convert power in watts to power in kilowatts.
 * Formula: kW = W / 1000
 */
export function wattsToKilowatts(watts: number): number {
  return watts / WATTS_PER_KILOWATT;
}

/**
 * Convert power in kilowatts to power in watts.
 * Formula: W = kW * 1000
 */
export function kilowattsToWatts(kilowatts: number): number {
  return kilowatts * WATTS_PER_KILOWATT;
}

/**
 * Convert energy in watt-hours to energy in kilowatt-hours.
 * Formula: kWh = Wh / 1000
 */
export function wattHoursToKilowattHours(wattHours: number): number {
  return wattHours / WATT_HOURS_PER_KILOWATT_HOUR;
}

/**
 * Convert energy in kilowatt-hours to energy in watt-hours.
 * Formula: Wh = kWh * 1000
 */
export function kilowattHoursToWattHours(kilowattHours: number): number {
  return kilowattHours * WATT_HOURS_PER_KILOWATT_HOUR;
}

/**
 * Average power (kW) implied by energy (kWh) over a duration (hours).
 * Formula: kW = kWh / h
 */
export function averageKilowatts(kilowattHours: number, hours: number): number {
  if (hours <= 0) {
    throw new Error("Duration in hours must be greater than zero.");
  }
  return kilowattHours / hours;
}
