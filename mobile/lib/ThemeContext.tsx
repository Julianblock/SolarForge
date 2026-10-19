import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, type ThemeColors } from "@/constants/theme";

const KEY = "solarforge.mobile.theme";

interface ThemeContextValue {
  colors: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") setChoice(stored);
      })
      .catch(() => undefined);
  }, []);

  const scheme = choice ?? (system === "light" ? "light" : "dark");
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === "light" ? lightColors : darkColors,
      toggle: () => {
        const next = scheme === "light" ? "dark" : "light";
        setChoice(next);
        void AsyncStorage.setItem(KEY, next).catch(() => undefined);
      },
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

type Styles = object;
const cache = new WeakMap<(c: ThemeColors) => Styles, Map<ThemeColors, Styles>>();

/** Run a `StyleSheet.create` factory against the active colors; results are cached per theme. */
export function useStyles<T extends Styles>(factory: (c: ThemeColors) => T): T {
  const { colors } = useTheme();
  let byTheme = cache.get(factory);
  if (!byTheme) {
    byTheme = new Map();
    cache.set(factory, byTheme);
  }
  let styles = byTheme.get(colors);
  if (!styles) {
    styles = factory(colors);
    byTheme.set(colors, styles);
  }
  return styles as T;
}
