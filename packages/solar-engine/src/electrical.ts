import { assertRange, SolarInputError } from "./errors";

export interface ModuleElectrical {
  stcWatts: number;
  vmpV: number;
  impA: number;
  vocV: number;
  iscA: number;
  /** Open-circuit temperature coefficient, fraction per °C (negative for silicon). */
  betaVocPerC: number;
  /** Optional maximum-power voltage coefficient, fraction per °C. */
  betaVmpPerC?: number;
  /** Short-circuit current coefficient, fraction per °C. */
  alphaIscPerC?: number;
}

export interface InverterElectrical {
  ratedAcKw: number;
  /** Maximum DC input voltage, V. */
  maxDcVoltageV: number;
  /** MPPT window, V. */
  mpptMinV: number;
  mpptMaxV: number;
  /** Maximum DC input current, A. Optional when the datasheet is incomplete. */
  maxDcCurrentA?: number;
  /** Number of MPPT inputs. Default 1. */
  mpptCount?: number;
}

export interface StringCheckInput {
  module: ModuleElectrical;
  inverter: InverterElectrical;
  /** Modules in series in one string. */
  modulesInSeries: number;
  /** Parallel strings on one MPPT, or on the inverter if it has a single input. */
  parallelStrings: number;
  /** Coldest expected cell temperature, °C. */
  coldCellC: number;
  /** Hottest expected operating cell temperature, °C. */
  hotCellC: number;
}

export interface StringCheckResult {
  coldVocV: number;
  hotVmpV: number;
  stcVmpV: number;
  coldIscA: number;
  arrayStcKw: number;
  dcAcRatio: number;
  maxSeriesByVoltage: number;
  compatible: boolean;
  warnings: string[];
  /**
   * Reference only. A common US continuous-current factor is 1.25 × Isc.
   * It is not a code certification and the adopted NEC edition varies.
   */
  necContinuousCurrentReferenceA: number;
}

/**
 * Cold open-circuit voltage of one module.
 * Formula: Voc(T) = Voc_stc × (1 + β (T - 25 °C))
 * β is a fraction per °C. Output volts.
 */
export function coldVoc(module: ModuleElectrical, coldCellC: number): number {
  return module.vocV * (1 + module.betaVocPerC * (coldCellC - 25));
}

/**
 * Check one string design against inverter voltage and current limits.
 *
 * Voltage must remain at or below the inverter maximum at the cold cell
 * temperature, and the hot-cell Vmp should sit inside the MPPT window.
 * Current uses cold Isc when a current coefficient is supplied, otherwise STC Isc,
 * multiplied by the number of parallel strings.
 *
 * This does not size conductors, fuses, grounding, or rapid shutdown, and it
 * does not certify compliance with any electrical code.
 */
export function checkStrings(input: StringCheckInput): StringCheckResult {
  const { module, inverter } = input;
  assertRange(module.stcWatts, "Module watts", 50, 1000);
  assertRange(module.vmpV, "Vmp", 10, 200);
  assertRange(module.impA, "Imp", 0.5, 30);
  assertRange(module.vocV, "Voc", 10, 250);
  assertRange(module.iscA, "Isc", 0.5, 30);
  assertRange(module.betaVocPerC, "Voc temperature coefficient", -0.01, 0);
  assertRange(input.modulesInSeries, "Modules in series", 1, 40);
  assertRange(input.parallelStrings, "Parallel strings", 1, 40);
  assertRange(input.coldCellC, "Cold cell temperature", -40, 25);
  assertRange(input.hotCellC, "Hot cell temperature", 25, 85);
  assertRange(inverter.ratedAcKw, "Inverter power", 0.2, 10000);
  assertRange(inverter.maxDcVoltageV, "Inverter maximum DC voltage", 50, 2000);
  if (inverter.mpptMinV >= inverter.mpptMaxV) {
    throw new SolarInputError("MPPT minimum must be below the MPPT maximum.");
  }

  const moduleColdVoc = coldVoc(module, input.coldCellC);
  const betaVmp = module.betaVmpPerC ?? module.betaVocPerC;
  const moduleHotVmp = module.vmpV * (1 + betaVmp * (input.hotCellC - 25));
  const alpha = module.alphaIscPerC ?? 0.0005;
  const moduleColdIsc = module.iscA * (1 + alpha * (input.coldCellC - 25));
  const coldStringVoc = moduleColdVoc * input.modulesInSeries;
  const hotStringVmp = moduleHotVmp * input.modulesInSeries;
  const stcStringVmp = module.vmpV * input.modulesInSeries;
  const current = moduleColdIsc * input.parallelStrings;
  const arrayStcKw = (module.stcWatts * input.modulesInSeries * input.parallelStrings) / 1000;
  const maxSeries = Math.floor(inverter.maxDcVoltageV / moduleColdVoc);
  const warnings: string[] = [];

  if (coldStringVoc > inverter.maxDcVoltageV) {
    warnings.push(
      `Cold string Voc ${coldStringVoc.toFixed(0)} V exceeds the inverter maximum of ${inverter.maxDcVoltageV} V. Reduce series modules.`,
    );
  }
  if (hotStringVmp < inverter.mpptMinV) {
    warnings.push(
      `Hot-weather Vmp ${hotStringVmp.toFixed(0)} V is below the MPPT window starting at ${inverter.mpptMinV} V.`,
    );
  }
  if (stcStringVmp > inverter.mpptMaxV) {
    warnings.push(`STC string Vmp ${stcStringVmp.toFixed(0)} V is above the MPPT maximum of ${inverter.mpptMaxV} V.`);
  }
  if (inverter.maxDcCurrentA === undefined) {
    warnings.push("Inverter maximum input current was not provided, so current compatibility was not checked.");
  } else if (current > inverter.maxDcCurrentA) {
    warnings.push(
      `Estimated string current ${current.toFixed(1)} A exceeds the inverter input limit of ${inverter.maxDcCurrentA} A.`,
    );
  }
  if (arrayStcKw / inverter.ratedAcKw > 1.5) {
    warnings.push(
      `DC/AC ratio ${(arrayStcKw / inverter.ratedAcKw).toFixed(2)} is above 1.5. Clipping is likely and was not simulated hour by hour.`,
    );
  }
  if (module.betaVmpPerC === undefined) {
    warnings.push("Vmp temperature coefficient was missing, so the Voc coefficient was reused for the hot Vmp estimate.");
  }
  warnings.push("Conductor ampacity, grounding, overcurrent protection, and disconnects must be verified against the adopted code by a qualified person.");

  return {
    coldVocV: coldStringVoc,
    hotVmpV: hotStringVmp,
    stcVmpV: stcStringVmp,
    coldIscA: current,
    arrayStcKw,
    dcAcRatio: arrayStcKw / inverter.ratedAcKw,
    maxSeriesByVoltage: Math.max(0, maxSeries),
    compatible: warnings.filter((item) => !item.startsWith("Conductor") && !item.startsWith("Vmp temperature") && !item.startsWith("DC/AC") && !item.startsWith("Inverter maximum input current was not")).length === 0,
    warnings,
    necContinuousCurrentReferenceA: module.iscA * input.parallelStrings * 1.25,
  };
}
