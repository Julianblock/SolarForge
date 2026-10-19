import { describe, expect, it } from "vitest";
import { sizeBatteryBank } from "./battery";
import { estimateConsumption } from "./consumption";
import { checkStrings, coldVoc } from "./electrical";
import { SolarInputError } from "./errors";
import { estimateFinance } from "./finance";
import { orientationAdvice } from "./guidance";
import { cosineOfIncidence, estimateIrradiation } from "./irradiance";
import { estimateProduction } from "./production";
import { sizeArray } from "./sizing";
import { solarPosition, sunriseSunset } from "./solar-position";
import { wattsToKilowatts } from "./units";

const sampleModule = {
  stcWatts: 400,
  vmpV: 31,
  impA: 12.9,
  vocV: 37,
  iscA: 13.7,
  betaVocPerC: -0.0028,
  betaVmpPerC: -0.0032,
  alphaIscPerC: 0.0005,
};

describe("solar position", () => {
  it("places the June solstice declination near 23.44 degrees", () => {
    const position = solarPosition(40, -105, {
      year: 2024,
      month: 6,
      day: 21,
      hour: 12,
      timezoneOffsetHours: -6,
    });
    expect(position.declinationDeg).toBeGreaterThan(23.2);
    expect(position.declinationDeg).toBeLessThan(23.5);
  });

  it("places the December solstice declination near -23.44 degrees", () => {
    const position = solarPosition(40, -105, {
      year: 2024,
      month: 12,
      day: 21,
      hour: 12,
      timezoneOffsetHours: -7,
    });
    expect(position.declinationDeg).toBeLessThan(-23.2);
    expect(position.declinationDeg).toBeGreaterThan(-23.5);
  });

  it("puts the northern sun in the south at solar noon", () => {
    let best = solarPosition(40, -105, { year: 2024, month: 3, day: 20, hour: 0, timezoneOffsetHours: -6 });
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 20, 40]) {
        const sample = solarPosition(40, -105, { year: 2024, month: 3, day: 20, hour, minute, timezoneOffsetHours: -6 });
        if (Math.abs(sample.hourAngleDeg) < Math.abs(best.hourAngleDeg)) best = sample;
      }
    }
    expect(Math.abs(best.hourAngleDeg)).toBeLessThan(3);
    expect(best.azimuthDeg).toBeGreaterThan(175);
    expect(best.azimuthDeg).toBeLessThan(185);
    expect(best.elevationDeg).toBeGreaterThan(45);
    expect(best.elevationDeg).toBeLessThan(55);
  });

  it("puts the southern sun in the north at solar noon", () => {
    let best = solarPosition(-33.9, 151.2, { year: 2024, month: 3, day: 20, hour: 0, timezoneOffsetHours: 11 });
    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 20, 40]) {
        const sample = solarPosition(-33.9, 151.2, {
          year: 2024,
          month: 3,
          day: 20,
          hour,
          minute,
          timezoneOffsetHours: 11,
        });
        if (Math.abs(sample.hourAngleDeg) < Math.abs(best.hourAngleDeg)) best = sample;
      }
    }
    expect(Math.abs(best.hourAngleDeg)).toBeLessThan(3);
    const fromNorth = Math.min(best.azimuthDeg, 360 - best.azimuthDeg);
    expect(fromNorth).toBeLessThan(8);
  });

  it("keeps the same solar azimuth for one UTC instant labeled in two offsets", () => {
    const standard = solarPosition(37, -122, { year: 2024, month: 6, day: 21, hour: 11, timezoneOffsetHours: -7 });
    const daylight = solarPosition(37, -122, { year: 2024, month: 6, day: 21, hour: 12, timezoneOffsetHours: -6 });
    expect(daylight.azimuthDeg).toBeCloseTo(standard.azimuthDeg, 5);
    expect(daylight.elevationDeg).toBeCloseTo(standard.elevationDeg, 5);
  });

  it("orders sunrise before sunset at mid-latitude", () => {
    const day = sunriseSunset(40, -105, { year: 2024, month: 6, day: 21, timezoneOffsetHours: -6 });
    expect(day.sunriseLocalHours).not.toBeNull();
    expect(day.sunsetLocalHours).not.toBeNull();
    expect(day.sunriseLocalHours!).toBeLessThan(day.sunsetLocalHours!);
    expect(day.sunsetLocalHours! - day.sunriseLocalHours!).toBeGreaterThan(12);
  });
});

describe("irradiation and production", () => {
  it("faces the winter sun toward the equator at solar noon", () => {
    const south = cosineOfIncidence(40, 30, 180, -23.44, 0);
    const north = cosineOfIncidence(40, 30, 0, -23.44, 0);
    expect(south).toBeGreaterThan(0.8);
    expect(north).toBeLessThan(0);
    const southPoleward = cosineOfIncidence(-33, 25, 0, 23.44, 0);
    const southFacing = cosineOfIncidence(-33, 25, 180, 23.44, 0);
    expect(southPoleward).toBeGreaterThan(southFacing);
  });

  it("favors a south-facing array in the northern hemisphere", () => {
    const bright = Array<number>(12).fill(5);
    const south = estimateIrradiation({ latitudeDeg: 40, tiltDeg: 30, azimuthDeg: 180, monthlyHorizontalKwhPerM2Day: bright });
    const north = estimateIrradiation({ latitudeDeg: 40, tiltDeg: 30, azimuthDeg: 0, monthlyHorizontalKwhPerM2Day: bright });
    expect(south.annualPlaneOfArrayKwhPerM2).toBeGreaterThan(north.annualPlaneOfArrayKwhPerM2 * 1.2);
    const planning = estimateIrradiation({ latitudeDeg: 40, tiltDeg: 30, azimuthDeg: 180 });
    const away = estimateIrradiation({ latitudeDeg: 40, tiltDeg: 30, azimuthDeg: 0 });
    expect(planning.annualPlaneOfArrayKwhPerM2).toBeGreaterThan(away.annualPlaneOfArrayKwhPerM2);
    expect(planning.source).toBe("approximate-clearness-model");
  });

  it("favors a north-facing array in the southern hemisphere", () => {
    const bright = Array<number>(12).fill(5);
    const north = estimateIrradiation({ latitudeDeg: -33, tiltDeg: 25, azimuthDeg: 0, monthlyHorizontalKwhPerM2Day: bright });
    const south = estimateIrradiation({ latitudeDeg: -33, tiltDeg: 25, azimuthDeg: 180, monthlyHorizontalKwhPerM2Day: bright });
    expect(north.annualPlaneOfArrayKwhPerM2).toBeGreaterThan(south.annualPlaneOfArrayKwhPerM2 * 1.15);
  });

  it("keeps a mid-latitude annual yield inside a broad physical band", () => {
    const result = estimateProduction({ latitudeDeg: 37, tiltDeg: 25, azimuthDeg: 180, arrayKw: 1 });
    expect(result.annualAcKwh).toBeGreaterThan(900);
    expect(result.annualAcKwh).toBeLessThan(2200);
    expect(result.monthly).toHaveLength(12);
    expect(result.capacityFactor).toBeCloseTo(result.annualAcKwh / 8760, 6);
  });

  it("uses supplied irradiation instead of the clearness model", () => {
    const flat = Array(12).fill(4);
    const result = estimateIrradiation({
      latitudeDeg: 35,
      tiltDeg: 0,
      azimuthDeg: 180,
      monthlyHorizontalKwhPerM2Day: flat,
    });
    expect(result.source).toBe("user-supplied-horizontal");
    expect(result.monthly[0]?.horizontalKwhPerM2Day).toBe(4);
  });
});

describe("consumption and array size", () => {
  it("converts appliance watts into weekly-average kilowatt-hours", () => {
    const result = estimateConsumption({
      appliances: [
        { id: "fridge", name: "Refrigerator", watts: 150, quantity: 1, hoursPerDay: 8, daysPerWeek: 7, dutyCycle: 0.5 },
      ],
    });
    expect(result.dailyAcKwh).toBeCloseTo(0.6, 6);
    expect(result.nameplateSumKw).toBeCloseTo(wattsToKilowatts(150), 6);
    expect(result.annualAcKwh).toBeCloseTo(0.6 * 365, 6);
  });

  it("does not treat a bill total as a power rating", () => {
    const result = estimateConsumption({ monthlyKwh: 900 });
    expect(result.dailyAcKwh).toBeCloseTo((900 * 12) / 365, 5);
    expect(result.monthlyAcKwh).toBe(900);
  });

  it("rounds the array up to whole modules", () => {
    const sized = sizeArray({
      dailyAcKwh: 30,
      latitudeDeg: 35,
      tiltDeg: 25,
      azimuthDeg: 180,
      offsetFraction: 1,
      panelWatts: 400,
    });
    expect(sized.panelCount).toBeGreaterThan(10);
    expect(sized.arrayKw).toBeCloseTo((sized.panelCount * 400) / 1000, 6);
    expect(sized.production.annualAcKwh).toBeGreaterThan(30 * 365 * 0.9);
  });
});

describe("battery", () => {
  const module = {
    chemistry: "lifepo4" as const,
    nominalVoltageV: 51.2,
    ampHours: 100,
    usableDepthOfDischarge: 0.9,
    dischargeEfficiency: 0.96,
    continuousDischargeKw: 5,
    temperatureFactor: 1,
  };

  it("separates nominal energy from usable energy", () => {
    const bank = sizeBatteryBank({
      dailyAcKwh: 10,
      daysOfAutonomy: 2,
      inverterEfficiency: 0.95,
      busVoltageV: 51.2,
      module,
    });
    const expectedDc = 20 / 0.95;
    const expectedNominal = expectedDc / (0.9 * 0.96);
    expect(bank.requiredNominalKwh).toBeCloseTo(expectedNominal, 5);
    expect(bank.nominalBankKwh).toBeGreaterThan(bank.usableBankKwh);
    expect(bank.seriesCount).toBe(1);
    expect(bank.moduleCount).toBeGreaterThanOrEqual(Math.ceil(expectedNominal / 5.12));
  });

  it("rejects a bus voltage the module cannot build", () => {
    expect(() =>
      sizeBatteryBank({
        dailyAcKwh: 5,
        daysOfAutonomy: 1,
        inverterEfficiency: 0.95,
        busVoltageV: 120,
        module,
      }),
    ).toThrow(SolarInputError);
  });
});

describe("electrical", () => {
  it("raises cold open-circuit voltage when the coefficient is negative", () => {
    const warm = coldVoc(sampleModule, 25);
    const cold = coldVoc(sampleModule, -10);
    expect(warm).toBeCloseTo(37, 6);
    expect(cold).toBeGreaterThan(warm);
    expect(cold).toBeCloseTo(37 * (1 + -0.0028 * -35), 5);
  });

  it("flags a string that exceeds inverter voltage", () => {
    const result = checkStrings({
      module: sampleModule,
      inverter: { ratedAcKw: 7.6, maxDcVoltageV: 500, mpptMinV: 200, mpptMaxV: 480, maxDcCurrentA: 20 },
      modulesInSeries: 16,
      parallelStrings: 1,
      coldCellC: -10,
      hotCellC: 60,
    });
    expect(result.compatible).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("Cold string Voc"))).toBe(true);
  });
});

describe("orientation guidance", () => {
  it("recommends south in the north and north in the south", () => {
    expect(orientationAdvice(39).preferredAzimuthDeg).toBe(180);
    expect(orientationAdvice(39).hemisphere).toBe("north");
    expect(orientationAdvice(-33).preferredAzimuthDeg).toBe(0);
    expect(orientationAdvice(-33).summary).toMatch(/north/i);
  });
});

describe("finance", () => {
  it("pays back a simple project without inventing an incentive", () => {
    const result = estimateFinance({
      installedCostUsd: 10000,
      annualProductionKwh: 8000,
      annualConsumptionKwh: 8000,
      importRateUsdPerKwh: 0.2,
      exportRateUsdPerKwh: 0,
      escalationRate: 0,
      discountRate: 0,
      analysisYears: 20,
      annualMaintenanceUsd: 0,
    });
    const medium = result.scenarios.find((scenario) => scenario.name === "medium");
    expect(medium?.firstYearSavingsUsd).toBeCloseTo(1600, 5);
    expect(medium?.simplePaybackYears).toBeCloseTo(6.25, 2);
    expect(result.assumptions.some((line) => line.includes("unless an incentive"))).toBe(true);
  });
});
