import type { ProjectResults } from "./evaluate";
import type { SolarProject } from "./project";

export interface AssistantReply {
  answer: string;
  assumptions: string[];
  usedEngine: true;
}

function fmt(value: number, digits = 0): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

/**
 * Answer a planning question from the project and the calculation engine.
 * It does not invent a measurement and it does not replace the engine's arithmetic.
 * Wiring, structure, and permits always get a verification warning.
 */
export function answerProjectQuestion(question: string, project: SolarProject, results: ProjectResults): AssistantReply {
  const q = question.toLowerCase();
  const assumptions = results.assumptions.slice(0, 4);
  const production = results.array.production.annualAcKwh;
  const safety = /wire|wiring|nec|permit|code|ground|breaker|conductor|structural|load|fire/.test(q);

  let answer: string;
  if (/panel|how many/.test(q)) {
    answer = `${project.name} needs about ${results.panelCount} modules of ${project.array.panelWatts} W to aim for ${Math.round(project.goals.offsetFraction * 100)}% of annual use. That is ${results.arrayKw.toFixed(2)} kW DC and about ${fmt(production)} kWh AC per year under the current weather assumption.`;
  } else if (/azimuth|direction|face|orientation/.test(q)) {
    answer = `${results.orientation.summary} The rule-of-thumb azimuth is ${results.orientation.preferredAzimuthDeg}° and the tilt search in the approximate model prefers about ${results.orientation.modeledBestTiltDeg}°. Your design is set to ${Math.round(project.array.azimuthDeg)}° azimuth and ${Math.round(project.array.tiltDeg)}° tilt. Azimuth is degrees clockwise from true north.`;
  } else if (/inverter|5 kw|8 kw|kw inverter/.test(q)) {
    const ratio5 = results.arrayKw / 5;
    const ratio8 = results.arrayKw / 8;
    answer = `The sized array is ${results.arrayKw.toFixed(2)} kW DC. A 5 kW inverter would be a DC/AC ratio of ${ratio5.toFixed(2)}. An 8 kW inverter would be ${ratio8.toFixed(2)}. Ratios above about 1.5 often clip, and this tool does not simulate hourly clipping. Match the MPPT window to the cold string voltage before buying either one.`;
  } else if (/battery|autonomy|off-grid|cabin/.test(q)) {
    answer = results.battery
      ? `The battery result is ${results.battery.nominalBankKwh.toFixed(1)} kWh nominal and ${results.battery.usableBankKwh.toFixed(1)} kWh usable: ${results.battery.seriesCount} in series and ${results.battery.parallelCount} in parallel. Nominal is larger because depth of discharge and discharge efficiency are not 100%. Average backup is about ${results.battery.backupHoursAtAverageLoad.toFixed(0)} hours, not a guarantee at peak power.`
      : `No battery is enabled. Daily use is ${results.consumption.dailyAcKwh.toFixed(1)} kWh. Turn on storage and set days of autonomy to size a bank. An off-grid cabin also needs a winter production check, because annual kWh can hide a dark month.`;
  } else if (/winter|season|monthly|lower/.test(q)) {
    const months = results.array.production.monthly;
    const low = months.reduce((best, row) => (row.acKwh < best.acKwh ? row : best));
    const high = months.reduce((best, row) => (row.acKwh > best.acKwh ? row : best));
    answer = `${low.month} is the low month at about ${fmt(low.acKwh)} kWh, and ${high.month} is the high month at about ${fmt(high.acKwh)} kWh. The sun is lower in the local winter, days are shorter, and the default clearness index drops. That gap is why off-grid designs size for the dark month rather than the annual average.`;
  } else if (safety) {
    answer = `I can show the planning numbers, but I cannot certify wiring, grounding, structural attachment, or a permit. The array estimate is ${results.panelCount} panels and ${fmt(production)} kWh/year. A qualified person has to apply the code edition your jurisdiction has adopted.`;
  } else {
    answer = `${project.name} at ${project.location.latitudeDeg.toFixed(2)}°, ${project.location.longitudeDeg.toFixed(2)}° is estimated at ${results.panelCount} panels, ${results.arrayKw.toFixed(2)} kW DC, and ${fmt(production)} kWh AC per year. Daily use in the model is ${results.consumption.dailyAcKwh.toFixed(1)} kWh. Ask about panel count, azimuth, inverter size, battery size, or winter production and I will read those results back.`;
  }

  if (safety && !/cannot certify/.test(answer)) {
    answer += " Wiring, structural design, and permitting still have to be verified by a qualified person.";
  }
  if (project.experience === "beginner") {
    answer += " Beginner view: kW is the size of the system at one moment, and kWh is the energy it makes or uses over time.";
  }
  return { answer, assumptions, usedEngine: true };
}
