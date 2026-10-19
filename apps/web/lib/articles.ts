export interface Article {
  slug: string;
  title: string;
  description: string;
  paragraphs: string[];
}

export const articles: Article[] = [
  {
    slug: "what-is-solar-azimuth",
    title: "What is solar azimuth?",
    description: "Azimuth tells you which compass direction a panel faces. SolarForge uses degrees clockwise from true north.",
    paragraphs: [
      "Azimuth is the compass direction of a surface. In SolarForge, 0° is true north, 90° is east, 180° is south, and 270° is west. That matches a compass and the NREL PVWatts convention. Some textbooks instead call south 0° and treat east as negative. The physics is the same if you translate the number. Mixing the two conventions without saying so will aim the array the wrong way.",
      "A fixed array in the northern hemisphere usually wants to face toward the equator, which is south, 180°. In the southern hemisphere the equator is north, so the usual direction is 0°. Near the equator the daily path is high overhead and the east-west choice trades morning energy for afternoon energy.",
      "Roof azimuth is the direction the roof slope faces, not the direction of the ridge. A compass reading on a phone is magnetic unless the app corrects to true north. Magnetic declination can be several degrees, so a planning study should say which one it used.",
      "Tilt is separate. It is the angle between the module and the horizontal. A steeper winter tilt catches a low sun and gives up some summer sky. The calculator searches that tradeoff inside its weather assumption. It does not know your ridge height, your neighbor's tree, or the fire setback.",
    ],
  },
  {
    slug: "how-to-size-a-solar-system",
    title: "How to size a solar system",
    description: "Start from energy in kilowatt-hours, then divide by the site's specific yield.",
    paragraphs: [
      "Size follows energy, not a catalog photo. Add up the kilowatt-hours you want to cover in a year. A monthly bill can be turned into kilowatt-hours only if you know the energy rate and you have removed fixed charges. Otherwise use the utility's kWh line.",
      "Specific yield is the AC kilowatt-hours one kilowatt of modules makes in a year at your tilt and azimuth. SolarForge estimates that from plane-of-array irradiation, a temperature adjustment, and a PVWatts-style loss stack. Required kilowatts are the annual target divided by that yield. The app then rounds up to whole modules.",
      "A 100% annual offset is not a house that never imports. Night, clouds, and winter still pull from the grid or the battery. The finance tool values on-site energy at the import rate and exports at the export rate you enter, which defaults to zero.",
      "Power and energy are different units. A 5 kW array is a power rating. If it runs at that rating for one hour it has made 5 kWh. Nameplate watts of appliances are power. Leaving a 1,500 W heater on for four hours is 6 kWh, before any thermostat cycling.",
    ],
  },
  {
    slug: "how-to-size-a-battery-bank",
    title: "How to size a battery bank",
    description: "Usable kilowatt-hours are smaller than the nameplate because of depth of discharge and efficiency.",
    paragraphs: [
      "Decide how many days the bank should carry the load you actually want backed up. Whole-home backup and a critical-load panel are different problems. The daily kilowatt-hours in the model are whatever you entered, not a measured outage.",
      "The cells have to supply more than the AC load because the inverter is not lossless. SolarForge divides AC energy by inverter efficiency, then divides again by usable depth of discharge, discharge efficiency, and a temperature factor. That is why nominal kWh is larger than usable kWh.",
      "Lead-acid and LiFePO4 are not interchangeable. A lead-acid bank is often limited to about half its nameplate if you care about cycle life. A LiFePO4 bank can often use most of its nameplate, within the battery management limits. Do not series different chemistries or brands to hit a voltage.",
      "Energy capacity and power are also different. A bank can hold 10 kWh and still be unable to start a well pump if the continuous discharge rating is too small. Enter that rating when you have it. Backup hours in the result are at the average daily load, not at the surge.",
    ],
  },
  {
    slug: "solar-panels-series-vs-parallel",
    title: "Solar panels in series and parallel",
    description: "Series adds voltage. Parallel adds current. The cold open-circuit voltage has to stay under the inverter limit.",
    paragraphs: [
      "Modules in series add their voltages and keep the string current near the current of one module. Modules in parallel add current and keep the voltage of one string. A rooftop string inverter usually wants enough series modules for the MPPT window without exceeding the maximum DC voltage on the coldest morning.",
      "Open-circuit voltage rises as the cells get colder. The coefficient is negative, so a temperature below 25 °C pushes Voc up. SolarForge multiplies STC Voc by one plus the coefficient times the difference from 25 °C. If that string voltage is above the inverter maximum, the design is flagged. It is still not a code certification.",
      "Hot weather does the opposite to operating voltage. Vmp can fall out of the bottom of the MPPT window. If a Vmp coefficient is missing, the tool reuses the Voc coefficient and says so.",
      "Conductor size, fuses, grounding, and disconnects are not chosen by this screen. A common US reference is 1.25 times Isc for continuous current, and the adopted NEC edition is not the same in every city. A qualified person has to finish that part.",
    ],
  },
];

export function articleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
