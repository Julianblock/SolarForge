export const palette = {
  bg: "#05070d",
  surface: "#0e1320",
  surfaceRaised: "#151c2e",
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

export const gradients = {
  sun: ["#ffd25a", "#ff9f1a", "#ff6a13"] as const,
  dusk: ["rgba(5,7,13,0)", "rgba(5,7,13,0.55)", "#05070d"] as const,
  sky: ["#5ac8fa", "#3a7bfd"] as const,
  leaf: ["#5af08a", "#1fb455"] as const,
};

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
  cloudyField: unsplash("photo-1509391366360-2e959784a276", 800),
  windSunset: unsplash("photo-1466611653911-95081537e5b7", 800),
};
