export interface ThemeColors {
  scheme: "light" | "dark";
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  sun: string;
  sunDeep: string;
  sky: string;
  leaf: string;
  danger: string;
}

export const darkColors: ThemeColors = {
  scheme: "dark",
  bg: "#05070d",
  surface: "#0e1320",
  surfaceRaised: "#1a2235",
  border: "rgba(255,255,255,0.08)",
  text: "#f5f7fb",
  textMuted: "#9aa5b8",
  textFaint: "#5d6880",
  sun: "#ffb224",
  sunDeep: "#ff7a1a",
  sky: "#5ac8fa",
  leaf: "#30d158",
  danger: "#ff453a",
};

export const lightColors: ThemeColors = {
  scheme: "light",
  bg: "#f2f3f7",
  surface: "#ffffff",
  surfaceRaised: "#eceef3",
  border: "rgba(10,15,30,0.08)",
  text: "#0b0d12",
  textMuted: "#5f6878",
  textFaint: "#9aa1ad",
  sun: "#e8930c",
  sunDeep: "#ff6a13",
  sky: "#0a84ff",
  leaf: "#1fa347",
  danger: "#ff3b30",
};

export const gradients = {
  sun: ["#ffd25a", "#ff9f1a", "#ff6a13"] as const,
  photoScrim: ["rgba(0,0,0,0)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.78)"] as const,
};

/** Text and icons drawn on top of photos or the sun gradient, in either theme. */
export const onPhoto = { text: "#ffffff", muted: "rgba(255,255,255,0.82)", onSun: "#1a0f00" };

export const radius = { sm: 12, md: 18, lg: 26, pill: 999 };

/** Unsplash photos, free to use under the Unsplash License. */
const unsplash = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=75`;

export const photos = {
  sunsetRoof: unsplash("photo-1613665813446-82a78c468a1d"),
  rooftopInstall: unsplash("photo-1624397640148-949b1732bb0a"),
  pinkSkyArray: unsplash("photo-1611365892117-00ac5ef43c90"),
  blueSkyField: unsplash("photo-1508514177221-188b1cf16e9d"),
  aerialPanels: unsplash("photo-1497440001374-f26997328c1b", 800),
  windSunset: unsplash("photo-1466611653911-95081537e5b7", 800),
};

export interface City {
  name: string;
  latitudeDeg: number;
  longitudeDeg: number;
  timezoneOffsetHours: number;
}

/** Standard-time offsets; the engine takes a fixed offset, not a DST rule. */
export const CITIES: City[] = [
  { name: "Phoenix", latitudeDeg: 33.45, longitudeDeg: -112.07, timezoneOffsetHours: -7 },
  { name: "Los Angeles", latitudeDeg: 34.05, longitudeDeg: -118.24, timezoneOffsetHours: -8 },
  { name: "Denver", latitudeDeg: 39.74, longitudeDeg: -104.99, timezoneOffsetHours: -7 },
  { name: "Austin", latitudeDeg: 30.27, longitudeDeg: -97.74, timezoneOffsetHours: -6 },
  { name: "Miami", latitudeDeg: 25.76, longitudeDeg: -80.19, timezoneOffsetHours: -5 },
  { name: "Chicago", latitudeDeg: 41.88, longitudeDeg: -87.63, timezoneOffsetHours: -6 },
  { name: "New York", latitudeDeg: 40.71, longitudeDeg: -74.01, timezoneOffsetHours: -5 },
  { name: "Seattle", latitudeDeg: 47.61, longitudeDeg: -122.33, timezoneOffsetHours: -8 },
];
