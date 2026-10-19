import { z } from "zod";

export const systemTypes = ["grid-tied", "off-grid", "hybrid", "rv", "cabin", "residential", "commercial"] as const;

export const systemTypeLabels: Record<(typeof systemTypes)[number], string> = {
  "grid-tied": "Grid-tied solar",
  "off-grid": "Off-grid solar",
  hybrid: "Hybrid solar with battery",
  rv: "RV and van solar",
  cabin: "Cabin solar",
  residential: "Residential solar",
  commercial: "Commercial solar",
};

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  createdAt: z.string(),
  updatedAt: z.string(),
  experience: z.enum(["beginner", "advanced"]),
  systemType: z.enum(systemTypes),
  location: z.object({
    label: z.string().max(120),
    latitudeDeg: z.number().gte(-90).lte(90),
    longitudeDeg: z.number().gte(-180).lte(180),
    elevationM: z.number().gte(-100).lte(9000).optional(),
    timezoneOffsetHours: z.number().gte(-12).lte(14),
  }),
  site: z.object({
    mount: z.enum(["roof", "ground", "rv", "unknown"]),
    areaM2: z.number().positive().max(100000).optional(),
    roofPitchDeg: z.number().gte(0).lte(90).optional(),
    roofAzimuthDeg: z.number().gte(0).lte(360).optional(),
    grid: z.enum(["grid-tied", "off-grid", "hybrid", "unspecified"]),
    backupHours: z.number().gte(0).lte(240).optional(),
  }),
  usage: z.object({
    monthlyKwh: z.number().gte(0).max(1_000_000).optional(),
    annualKwh: z.number().gte(0).max(20_000_000).optional(),
    monthlyBillUsd: z.number().gte(0).max(1_000_000).optional(),
    rateUsdPerKwh: z.number().gt(0).lte(5).optional(),
    appliances: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().min(1).max(80),
          watts: z.number().gte(0).max(100_000),
          quantity: z.number().int().gte(0).max(1000),
          hoursPerDay: z.number().gte(0).lte(24),
          daysPerWeek: z.number().gte(0).lte(7),
          dutyCycle: z.number().gte(0).lte(1),
        }),
      )
      .max(40),
  }),
  goals: z.object({
    offsetFraction: z.number().gte(0.05).lte(2),
    budgetUsd: z.number().gte(0).max(100_000_000).optional(),
    autonomyDays: z.number().gte(0).lte(14).optional(),
  }),
  array: z.object({
    panelWatts: z.number().gte(50).lte(800),
    tiltDeg: z.number().gte(0).lte(90),
    azimuthDeg: z.number().gte(0).lte(360),
    shadingLoss: z.number().gte(0).lte(0.9),
  }),
  battery: z
    .object({
      enabled: z.boolean(),
      chemistry: z.enum(["lifepo4", "other-lithium", "lead-acid"]),
      nominalVoltageV: z.number().positive(),
      ampHours: z.number().positive(),
      usableDepthOfDischarge: z.number().gt(0).lte(1),
      dischargeEfficiency: z.number().gt(0).lte(1),
      continuousDischargeKw: z.number().positive().optional(),
      temperatureFactor: z.number().gt(0).lte(1).optional(),
      busVoltageV: z.number().positive(),
      inverterEfficiency: z.number().gt(0).lte(1),
      daysOfAutonomy: z.number().positive().max(14),
    })
    .optional(),
  finance: z
    .object({
      installedCostUsd: z.number().gte(0).optional(),
      usdPerWatt: z.number().gt(0).lte(20).optional(),
      incentiveUsd: z.number().gte(0).optional(),
      importRateUsdPerKwh: z.number().gte(0).lte(5),
      exportRateUsdPerKwh: z.number().gte(0).lte(5),
      escalationRate: z.number().gte(-0.05).lte(0.15),
      discountRate: z.number().gte(0).lte(0.2),
      analysisYears: z.number().int().gte(5).lte(40),
      annualMaintenanceUsd: z.number().gte(0),
    })
    .optional(),
  layout: z
    .object({
      widthM: z.number().positive(),
      lengthM: z.number().positive(),
      portrait: z.boolean(),
      spacingM: z.number().gte(0).lte(1),
      panels: z.array(
        z.object({
          id: z.string(),
          xM: z.number(),
          yM: z.number(),
          rotationDeg: z.number(),
        }),
      ),
      obstacles: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(["vent", "skylight", "chimney", "exclusion"]),
          xM: z.number(),
          yM: z.number(),
          widthM: z.number().positive(),
          heightM: z.number().positive(),
        }),
      ),
    })
    .optional(),
  shadeObstacles: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        kind: z.enum(["tree", "building", "roof", "terrain", "chimney"]),
        heightM: z.number().nonnegative(),
        distanceM: z.number().positive(),
        azimuthDeg: z.number().gte(0).lte(360),
        widthM: z.number().positive().optional(),
      }),
    )
    .optional(),
});

export type SolarProject = z.infer<typeof projectSchema>;

export function browserTimezoneOffsetHours(date = new Date()): number {
  return -date.getTimezoneOffset() / 60;
}

export function createProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sf-${Date.now()}`;
}

/** A labeled example site, not a detected location. */
export function exampleProject(partial?: Partial<SolarProject>): SolarProject {
  const now = new Date().toISOString();
  const base: SolarProject = {
    id: createProjectId(),
    name: "My solar project",
    createdAt: now,
    updatedAt: now,
    experience: "beginner",
    systemType: "residential",
    location: {
      label: "Example coordinates — Denver, not your roof",
      latitudeDeg: 39.74,
      longitudeDeg: -104.99,
      timezoneOffsetHours: -6,
    },
    site: {
      mount: "roof",
      grid: "grid-tied",
    },
    usage: {
      monthlyKwh: 900,
      rateUsdPerKwh: 0.16,
      appliances: [],
    },
    goals: {
      offsetFraction: 1,
      autonomyDays: 1,
    },
    array: {
      panelWatts: 400,
      tiltDeg: 30,
      azimuthDeg: 180,
      shadingLoss: 0,
    },
    finance: {
      usdPerWatt: 2.5,
      importRateUsdPerKwh: 0.16,
      exportRateUsdPerKwh: 0,
      escalationRate: 0.02,
      discountRate: 0.05,
      analysisYears: 25,
      annualMaintenanceUsd: 150,
    },
  };
  return {
    ...base,
    ...partial,
    location: { ...base.location, ...partial?.location },
    site: { ...base.site, ...partial?.site },
    usage: { ...base.usage, ...partial?.usage },
    goals: { ...base.goals, ...partial?.goals },
    array: { ...base.array, ...partial?.array },
    finance: { ...base.finance!, ...partial?.finance },
  };
}
