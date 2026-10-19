export type EquipmentCategory =
  | "panel"
  | "hybrid-inverter"
  | "grid-tie-inverter"
  | "off-grid-inverter"
  | "microinverter"
  | "battery"
  | "mppt"
  | "mounting"
  | "monitoring"
  | "balance";

export interface CatalogItem {
  id: string;
  category: EquipmentCategory;
  /** Always false for the shipped sample set. */
  verified: false;
  sample: true;
  manufacturer: string;
  model: string;
  summary: string;
  specs: Record<string, string>;
}

const note = "Illustrative sample. Not a manufacturer-certified datasheet.";

/**
 * Development catalog. Values are typical teaching numbers for fictional models.
 * They are not copies of a commercial datasheet and must not be presented as verified.
 */
export const SAMPLE_CATALOG: CatalogItem[] = [
  {
    id: "sample-panel-400",
    category: "panel",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Module 400",
    summary: note,
    specs: {
      "STC power": "400 W",
      Vmp: "31.0 V",
      Imp: "12.9 A",
      Voc: "37.2 V",
      Isc: "13.7 A",
      "Voc coefficient": "-0.28 %/°C",
      "Power coefficient": "-0.35 %/°C",
      Dimensions: "1722 × 1134 × 30 mm",
      Weight: "21 kg",
      Warranty: "Sample 25-year product term, not a real warranty",
    },
  },
  {
    id: "sample-hybrid-8",
    category: "hybrid-inverter",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Hybrid 8",
    summary: note,
    specs: {
      "Rated AC power": "8 kW",
      "Surge power": "12 kW for 10 s, sample only",
      "MPPT range": "120–450 V",
      "Maximum DC voltage": "500 V",
      "Maximum DC current": "26 A",
      "Battery voltage": "48 V nominal",
      Certification: "Uncertified sample",
    },
  },
  {
    id: "sample-string-7-6",
    category: "grid-tie-inverter",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Grid 7.6",
    summary: note,
    specs: {
      "Rated AC power": "7.6 kW",
      "MPPT range": "200–480 V",
      "Maximum DC voltage": "500 V",
      "Maximum DC current": "20 A",
      Certification: "Uncertified sample",
    },
  },
  {
    id: "sample-offgrid-5",
    category: "off-grid-inverter",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Island 5",
    summary: note,
    specs: {
      "Rated AC power": "5 kW",
      "Surge power": "10 kW for 5 s, sample only",
      "Battery voltage": "48 V",
      Certification: "Uncertified sample",
    },
  },
  {
    id: "sample-micro-400",
    category: "microinverter",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Micro 400",
    summary: note,
    specs: {
      "Rated AC power": "400 W",
      "Module compatibility": "One 400 W sample module",
      Certification: "Uncertified sample",
    },
  },
  {
    id: "sample-lfp-5",
    category: "battery",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-LFP 5.1",
    summary: note,
    specs: {
      Chemistry: "LiFePO4 sample",
      "Nominal voltage": "51.2 V",
      "Amp-hours": "100 Ah",
      "Nominal energy": "5.12 kWh",
      "Suggested usable depth of discharge": "90%",
      "Continuous discharge": "5 kW",
    },
  },
  {
    id: "sample-lead-200",
    category: "battery",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Lead 200",
    summary: note,
    specs: {
      Chemistry: "Lead-acid sample",
      "Nominal voltage": "12 V",
      "Amp-hours": "200 Ah",
      "Suggested usable depth of discharge": "50%",
      "Continuous discharge": "1 kW",
    },
  },
  {
    id: "sample-mppt-100",
    category: "mppt",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-MPPT 100",
    summary: note,
    specs: {
      "Battery voltage": "48 V",
      "Maximum PV voltage": "150 V",
      "Charge current": "100 A",
    },
  },
  {
    id: "sample-rail",
    category: "mounting",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Rail",
    summary: "Sample roof attachment. Structural capacity is not rated here.",
    specs: { Material: "Aluminum sample", "Roof types": "Composition, metal — verify locally" },
  },
  {
    id: "sample-monitor",
    category: "monitoring",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-View",
    summary: note,
    specs: { Connection: "Sample Wi-Fi gateway" },
  },
  {
    id: "sample-disconnect",
    category: "balance",
    verified: false,
    sample: true,
    manufacturer: "Sample Catalog",
    model: "SF-Disconnect",
    summary: "Placeholder balance-of-system item. Ampacity and voltage must be chosen from the adopted code.",
    specs: { Role: "DC disconnect sample", Rating: "Not a listed device" },
  },
];

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  panel: "Solar panels",
  "hybrid-inverter": "Hybrid inverters",
  "grid-tie-inverter": "Grid-tie inverters",
  "off-grid-inverter": "Off-grid inverters",
  microinverter: "Microinverters",
  battery: "Batteries",
  mppt: "MPPT charge controllers",
  mounting: "Mounting",
  monitoring: "Monitoring",
  balance: "Balance of system",
};
