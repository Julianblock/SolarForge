import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, palette, radius } from "@/constants/theme";

export function tap() {
  void Haptics.selectionAsync().catch(() => undefined);
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
  return (
    <View style={{ height: height + insets.top }}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient colors={gradients.dusk} locations={[0.2, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.heroBody, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }} />
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

export function Stat({
  icon,
  label,
  value,
  unit,
  tint = palette.sun,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
  unit?: string;
  tint?: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${tint}22` }]}>
        <SymbolView name={icon} tintColor={tint} size={18} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: SymbolViewProps["name"] }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [styles.primaryWrap, pressed && styles.pressed]}
    >
      <LinearGradient colors={gradients.sun} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        {icon ? <SymbolView name={icon} tintColor="#1a0f00" size={18} /> : null}
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: SymbolViewProps["name"] }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
    >
      {icon ? <SymbolView name={icon} tintColor={palette.text} size={16} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
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
  format = (n) => String(n),
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min: number;
  max: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
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
      </View>
      <Pressable hitSlop={8} onPress={() => set(value - step)} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "minus", android: "remove", web: "remove" }} tintColor={palette.text} size={16} />
      </Pressable>
      <Pressable hitSlop={8} onPress={() => set(value + step)} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "plus", android: "add", web: "add" }} tintColor={palette.text} size={16} />
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

export function Pill({ label, tint = palette.sun }: { label: string; tint?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${tint}1f`, borderColor: `${tint}55` }]}>
      <Text style={[styles.pillText, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBody: { flex: 1, paddingHorizontal: 22, paddingBottom: 22, gap: 6 },
  eyebrow: { color: palette.sun, fontSize: 13, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  heroTitle: { color: palette.text, fontSize: 36, fontWeight: "800", letterSpacing: -0.8, lineHeight: 40 },
  heroSubtitle: { color: "rgba(245,247,251,0.78)", fontSize: 16, lineHeight: 22 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: 18,
    gap: 12,
  },
  sectionTitle: { paddingHorizontal: 4, gap: 2, marginTop: 8 },
  sectionHeading: { color: palette.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  sectionCaption: { color: palette.textMuted, fontSize: 14 },
  stat: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: 16,
    gap: 6,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "500" },
  statValue: { color: palette.text, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  statUnit: { color: palette.textMuted, fontSize: 15, fontWeight: "500" },
  primaryWrap: { borderRadius: radius.pill, overflow: "hidden" },
  primary: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 22 },
  primaryText: { color: "#1a0f00", fontSize: 17, fontWeight: "700" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  ghost: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ghostText: { color: palette.text, fontSize: 15, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  stepperLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "500" },
  stepperValue: { color: palette.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  segmented: { flexDirection: "row", backgroundColor: palette.surfaceRaised, borderRadius: radius.pill, padding: 4 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: "center" },
  segmentActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  segmentText: { color: palette.textMuted, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: palette.text },
  pill: { alignSelf: "flex-start", borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
});
