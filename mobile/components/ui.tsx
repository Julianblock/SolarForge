import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, onPhoto, radius, type ThemeColors } from "@/constants/theme";
import { useStyles, useTheme } from "@/lib/ThemeContext";

export function tap() {
  void Haptics.selectionAsync().catch(() => undefined);
}

export function ThemeToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, toggle } = useTheme();
  const styles = useStyles(makeStyles);
  const dark = colors.scheme === "dark";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dark ? "Switch to light mode" : "Switch to dark mode"}
      hitSlop={10}
      onPress={() => {
        tap();
        toggle();
      }}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed, style]}
    >
      <SymbolView
        name={dark ? { ios: "sun.max.fill", android: "light_mode", web: "light_mode" } : { ios: "moon.fill", android: "dark_mode", web: "dark_mode" }}
        tintColor={onPhoto.text}
        size={18}
      />
    </Pressable>
  );
}

export function Hero({
  image,
  eyebrow,
  title,
  subtitle,
  height = 360,
  children,
}: {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  height?: number;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.hero, { height: height + insets.top }]}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient colors={gradients.photoScrim} locations={[0.25, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <ThemeToggle style={[styles.heroToggle, { top: insets.top + 8 }]} />
      <View style={styles.heroBody}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const styles = useStyles(makeStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

export function StepTitle({ step, title, caption }: { step: number; title: string; caption?: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stepTitle}>
      <LinearGradient colors={gradients.sun} style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionHeading}>{title}</Text>
        {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

export function Stat({
  icon,
  label,
  value,
  unit,
  tint,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
  unit?: string;
  tint?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const color = tint ?? colors.sun;
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <SymbolView name={icon} tintColor={color} size={18} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: SymbolViewProps["name"];
  disabled?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [styles.primaryWrap, pressed && styles.pressed, disabled && { opacity: 0.4 }]}
    >
      <LinearGradient colors={gradients.sun} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        <Text style={styles.primaryText}>{label}</Text>
        {icon ? <SymbolView name={icon} tintColor={onPhoto.onSun} size={18} /> : null}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: SymbolViewProps["name"] }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
    >
      {icon ? <SymbolView name={icon} tintColor={colors.text} size={16} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  hint,
  format = (n) => String(n),
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min: number;
  max: number;
  hint?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next * 100) / 100));
    if (clamped !== value) {
      tap();
      onChange(clamped);
    }
  };
  return (
    <View style={styles.stepper}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperValue}>
          {format(value)}
          {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
        </Text>
        {hint ? <Text style={styles.stepperHint}>{hint}</Text> : null}
      </View>
      <Pressable hitSlop={8} onPress={() => set(value - step)} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "minus", android: "remove", web: "remove" }} tintColor={colors.text} size={16} />
      </Pressable>
      <Pressable hitSlop={8} onPress={() => set(value + step)} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor={colors.text} size={16} />
      </Pressable>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              tap();
              onChange(option.value);
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Pill({ label, tint }: { label: string; tint?: string }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const color = tint ?? colors.sun;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1f`, borderColor: `${color}55` }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: "hidden", backgroundColor: "#111" },
    heroToggle: { position: "absolute", left: 20 },
    heroBody: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 24, gap: 6 },
    eyebrow: { color: "#ffc247", fontSize: 13, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
    heroTitle: { color: onPhoto.text, fontSize: 34, fontWeight: "800", letterSpacing: -0.8, lineHeight: 39 },
    heroSubtitle: { color: onPhoto.muted, fontSize: 16, lineHeight: 22 },
    toggle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(0,0,0,0.35)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 18,
      gap: 12,
    },
    sectionTitle: { paddingHorizontal: 4, gap: 2, marginTop: 10 },
    sectionHeading: { color: c.text, fontSize: 21, fontWeight: "700", letterSpacing: -0.4 },
    sectionCaption: { color: c.textMuted, fontSize: 14, lineHeight: 19 },
    stepTitle: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 14, paddingHorizontal: 2 },
    stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 1 },
    stepBadgeText: { color: onPhoto.onSun, fontSize: 14, fontWeight: "800" },
    stat: {
      flexGrow: 1,
      flexBasis: "45%",
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: 16,
      gap: 6,
    },
    statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
    statLabel: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    statValue: { color: c.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
    statUnit: { color: c.textMuted, fontSize: 15, fontWeight: "500" },
    primaryWrap: { borderRadius: radius.pill, overflow: "hidden" },
    primary: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 17,
      paddingHorizontal: 22,
    },
    primaryText: { color: onPhoto.onSun, fontSize: 17, fontWeight: "700" },
    pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
    ghost: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceRaised,
    },
    ghostText: { color: c.text, fontSize: 15, fontWeight: "600" },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: c.surfaceRaised },
    chipActive: { backgroundColor: c.sun },
    chipText: { color: c.text, fontSize: 14, fontWeight: "600" },
    chipTextActive: { color: onPhoto.onSun },
    stepper: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
    stepperLabel: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    stepperValue: { color: c.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
    stepperHint: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    stepButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    segmented: { flexDirection: "row", backgroundColor: c.surfaceRaised, borderRadius: radius.pill, padding: 4 },
    segment: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
    segmentActive: { backgroundColor: c.scheme === "dark" ? "rgba(255,255,255,0.16)" : "#ffffff" },
    segmentText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
    segmentTextActive: { color: c.text },
    pill: { alignSelf: "flex-start", borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
    pillText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  });
