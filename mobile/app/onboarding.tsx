import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { orientationAdvice } from "@solarforge/engine";
import { Chip, GhostButton, PrimaryButton, Stepper, ThemeToggle, tap } from "@/components/ui";
import { CITIES, gradients, onPhoto, photos, radius, type ThemeColors } from "@/constants/theme";
import { cityPlace, gpsPlace, moveTo } from "@/lib/location";
import { useProject } from "@/lib/ProjectContext";
import { useStyles, useTheme } from "@/lib/ThemeContext";

const FACINGS: { label: string; deg: number; icon: SymbolViewProps["name"] }[] = [
  { label: "North", deg: 0, icon: { ios: "arrow.up", android: "north", web: "north" } },
  { label: "East", deg: 90, icon: { ios: "arrow.right", android: "east", web: "east" } },
  { label: "South", deg: 180, icon: { ios: "arrow.down", android: "south", web: "south" } },
  { label: "West", deg: 270, icon: { ios: "arrow.left", android: "west", web: "west" } },
];

const SLOPES = [
  { label: "Flat", tilt: 10 },
  { label: "Gentle", tilt: 20 },
  { label: "Steep", tilt: 35 },
];

const ARROW_RIGHT: SymbolViewProps["name"] = { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" };

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { project, update, finishOnboarding } = useProject();
  const [step, setStep] = useState(0);
  const [placeChosen, setPlaceChosen] = useState(false);
  const [gpsNote, setGpsNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [bill, setBill] = useState(() => Math.round(((project.usage.monthlyKwh ?? 900) * (project.usage.rateUsdPerKwh ?? 0.16)) / 10) * 10);
  const [slope, setSlope] = useState<string | null>(null);

  const rate = project.usage.rateUsdPerKwh ?? 0.16;
  const advice = orientationAdvice(project.location.latitudeDeg);

  function finish() {
    finishOnboarding();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function useGps() {
    setLocating(true);
    const result = await gpsPlace();
    setLocating(false);
    if ("reason" in result) {
      setGpsNote(result.reason);
      return;
    }
    update((p) => moveTo(p, result.place));
    setPlaceChosen(true);
    setGpsNote(null);
  }

  if (step === 0) {
    return (
      <View style={styles.welcome}>
        <Image source={{ uri: photos.sunsetRoof }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient colors={gradients.photoScrim} locations={[0.1, 0.45, 0.9]} style={StyleSheet.absoluteFill} />
        <ThemeToggle style={{ position: "absolute", top: insets.top + 8, left: 20 }} />
        <View style={[styles.welcomeBody, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.welcomeEyebrow}>SolarForge</Text>
          <Text style={styles.welcomeTitle}>Will solar pay off for your home?</Text>
          <Text style={styles.welcomeCopy}>Answer three quick questions and get a system size, the savings, and how long it takes to pay for itself.</Text>
          <PrimaryButton label="Get started" icon={ARROW_RIGHT} onPress={() => setStep(1)} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            tap();
            setStep(step - 1);
          }}
          style={styles.back}
        >
          <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} tintColor={colors.text} size={18} />
        </Pressable>
        <View style={styles.progressTrack}>
          <LinearGradient colors={gradients.sun} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{step} of 3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={styles.title}>Where’s your home?</Text>
            <Text style={styles.copy}>Sunshine depends on where you live. We only use this to work out the sun’s path.</Text>
            <GhostButton label={locating ? "Finding you…" : "Use my current location"} icon={{ ios: "location.fill", android: "my_location", web: "my_location" }} onPress={() => void useGps()} />
            {gpsNote ? <Text style={styles.note}>{gpsNote}</Text> : null}
            <Text style={styles.label}>Or pick the nearest city</Text>
            <View style={styles.chips}>
              {CITIES.map((city) => (
                <Chip
                  key={city.name}
                  label={city.name}
                  active={placeChosen && project.location.label === city.name}
                  onPress={() => {
                    update((p) => moveTo(p, cityPlace(city)));
                    setPlaceChosen(true);
                  }}
                />
              ))}
            </View>
            {placeChosen && project.location.label === "Your location" ? (
              <View style={styles.found}>
                <SymbolView name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} tintColor={colors.leaf} size={20} />
                <Text style={styles.foundText}>Got it — using your current location.</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>What’s your monthly electric bill?</Text>
            <Text style={styles.copy}>A rough average is fine. This tells us how much electricity the panels need to make.</Text>
            <View style={styles.card}>
              <Stepper
                label="Average bill"
                value={bill}
                step={10}
                min={20}
                max={1500}
                format={(v) => `$${v}`}
                unit="/ month"
                hint={`About ${Math.round(bill / rate).toLocaleString()} kWh a month at $${rate.toFixed(2)} per kWh`}
                onChange={setBill}
              />
            </View>
            <Text style={styles.note}>You can change your electricity rate later on the Savings tab.</Text>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.title}>Which way does your roof face?</Text>
            <Text style={styles.copy}>Pick the side of the roof the panels would go on. Not sure? We’ll use the best direction.</Text>
            <View style={styles.facings}>
              {FACINGS.map((facing) => {
                const active = project.array.azimuthDeg === facing.deg;
                const best = facing.deg === advice.preferredAzimuthDeg;
                return (
                  <Pressable
                    key={facing.label}
                    onPress={() => {
                      tap();
                      update((p) => ({ ...p, array: { ...p.array, azimuthDeg: facing.deg } }));
                    }}
                    style={[styles.facing, active && styles.facingActive]}
                  >
                    <SymbolView name={facing.icon} tintColor={active ? onPhoto.onSun : colors.text} size={26} />
                    <Text style={[styles.facingText, active && { color: onPhoto.onSun }]}>{facing.label}</Text>
                    {best ? <Text style={[styles.bestTag, active && { color: onPhoto.onSun }]}>Best</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>How steep is it?</Text>
            <View style={styles.chips}>
              {SLOPES.map((s) => (
                <Chip
                  key={s.label}
                  label={s.label}
                  active={slope === s.label}
                  onPress={() => {
                    setSlope(s.label);
                    update((p) => ({ ...p, array: { ...p.array, tiltDeg: s.tilt } }));
                  }}
                />
              ))}
              <Chip
                label="Not sure"
                active={slope === "unsure"}
                onPress={() => {
                  setSlope("unsure");
                  update((p) => ({ ...p, array: { ...p.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg } }));
                }}
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 1 ? <PrimaryButton label="Next" icon={ARROW_RIGHT} disabled={!placeChosen} onPress={() => setStep(2)} /> : null}
        {step === 2 ? (
          <PrimaryButton
            label="Next"
            icon={ARROW_RIGHT}
            onPress={() => {
              update((p) => ({ ...p, usage: { ...p.usage, monthlyKwh: Math.round(bill / rate), monthlyBillUsd: bill } }));
              setStep(3);
            }}
          />
        ) : null}
        {step === 3 ? <PrimaryButton label="Show my solar plan" icon={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} onPress={finish} /> : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    welcome: { flex: 1, backgroundColor: "#000" },
    welcomeBody: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, gap: 14 },
    welcomeEyebrow: { color: "#ffc247", fontSize: 14, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase" },
    welcomeTitle: { color: onPhoto.text, fontSize: 42, fontWeight: "800", letterSpacing: -1, lineHeight: 46 },
    welcomeCopy: { color: onPhoto.muted, fontSize: 17, lineHeight: 24, marginBottom: 12 },
    screen: { flex: 1, backgroundColor: c.bg },
    topBar: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
    back: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surfaceRaised, alignItems: "center", justifyContent: "center" },
    progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.surfaceRaised, overflow: "hidden" },
    progressFill: { height: 6, borderRadius: 3 },
    stepCount: { color: c.textMuted, fontSize: 13, fontWeight: "600" },
    body: { padding: 24, gap: 16 },
    title: { color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.8, lineHeight: 37 },
    copy: { color: c.textMuted, fontSize: 16, lineHeight: 23 },
    label: { color: c.text, fontSize: 16, fontWeight: "700", marginTop: 8 },
    note: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    found: { flexDirection: "row", alignItems: "center", gap: 8 },
    foundText: { color: c.text, fontSize: 15, fontWeight: "600" },
    card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    facings: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    facing: {
      flexBasis: "46%",
      flexGrow: 1,
      height: 110,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    facingActive: { backgroundColor: c.sun, borderColor: c.sun },
    facingText: { color: c.text, fontSize: 17, fontWeight: "700" },
    bestTag: { position: "absolute", top: 10, right: 12, color: c.leaf, fontSize: 12, fontWeight: "800" },
    footer: { paddingHorizontal: 24, paddingTop: 8 },
  });
