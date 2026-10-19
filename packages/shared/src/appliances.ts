export interface ApplianceTemplate {
  id: string;
  name: string;
  watts: number;
  hoursPerDay: number;
  daysPerWeek: number;
  dutyCycle: number;
  note: string;
}

/** Starting points a person can edit. Duty cycle is the fraction of nameplate power while "on". */
export const APPLIANCE_TEMPLATES: ApplianceTemplate[] = [
  { id: "fridge", name: "Refrigerator", watts: 150, hoursPerDay: 24, daysPerWeek: 7, dutyCycle: 0.35, note: "Compressor cycles, so the nameplate is not a continuous draw." },
  { id: "ac", name: "Air conditioner", watts: 1500, hoursPerDay: 6, daysPerWeek: 7, dutyCycle: 0.7, note: "Highly seasonal. A summer bill is a better check than this average." },
  { id: "heat", name: "Electric heater", watts: 1500, hoursPerDay: 4, daysPerWeek: 5, dutyCycle: 1, note: "Resistance heat dominates many off-grid budgets." },
  { id: "lights", name: "Lighting", watts: 60, hoursPerDay: 5, daysPerWeek: 7, dutyCycle: 1, note: "LED lighting is usually a small share of a home." },
  { id: "tv", name: "Television", watts: 80, hoursPerDay: 4, daysPerWeek: 7, dutyCycle: 1, note: "Use the measured draw if the set is large." },
  { id: "computer", name: "Computer", watts: 120, hoursPerDay: 8, daysPerWeek: 5, dutyCycle: 0.6, note: "Desktops vary widely with the display and load." },
  { id: "pump", name: "Water pump", watts: 750, hoursPerDay: 1, daysPerWeek: 7, dutyCycle: 1, note: "Starting surge is higher than running watts." },
  { id: "washer", name: "Washing machine", watts: 500, hoursPerDay: 1, daysPerWeek: 4, dutyCycle: 0.6, note: "Heating the water, if electric, belongs in a separate line." },
  { id: "microwave", name: "Microwave", watts: 1200, hoursPerDay: 0.25, daysPerWeek: 7, dutyCycle: 1, note: "Short run time, high power." },
  { id: "ev", name: "EV charger", watts: 7200, hoursPerDay: 2, daysPerWeek: 5, dutyCycle: 1, note: "Level 2 charging can exceed the rest of the house." },
  { id: "pool", name: "Pool pump", watts: 1100, hoursPerDay: 6, daysPerWeek: 7, dutyCycle: 1, note: "Often worth a variable-speed replacement before more panels." },
  { id: "rv-fridge", name: "RV compressor fridge", watts: 80, hoursPerDay: 24, daysPerWeek: 7, dutyCycle: 0.4, note: "A common van load. Absorption fridges on electric mode use much more." },
];
