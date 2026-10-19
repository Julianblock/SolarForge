import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { orientationAdvice } from "@solarforge/engine";
import type { SolarProject } from "@solarforge/shared";
import { Compass, MonthlyBars, TiltDiagram } from "@/components/charts";
import { Card, Chip, GhostButton, Hero, Segmented, StepTitle, Stepper, tap } from "@/components/ui";
import { CITIES, photos, type ThemeColors } from "@/constants/theme";
import { cityPlace, gpsPlace, moveTo } from "@/lib/location";
import { useProject } from "@/lib/ProjectContext";
import { useStyles, useTheme } from "@/lib/ThemeContext";

const DIRECTIONS = [
  { value: "0", label: "North" },
  { value: "90", label: "East" },
  { value: "180", label: "South" },
  { value: "270", label: "West" },
];

const PANEL_SIZES = [
  { value: "350", label: "350 W" },
  { value: "400", label: "400 W" },
  { value: "450", label: "450 W" },
];

const SAMPLE_BATTERY: NonNullable<SolarProject["battery"]> = {
  enabled: true,
  chemistry: "lifepo4",
  nominalVoltageV: 51.2,
  ampHours: 100,
  usableDepthOfDischarge: 0.9,
  dischargeEfficiency: 0.96,
  continuousDischargeKw: 5,
  busVoltageV: 51.2,
  inverterEfficiency: 0.95,
  daysOfAutonomy: 1,
};

function compassWord(deg: number) {
  const words = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return words[Math.round(deg / 45) % 8];
}

function slopeWord(tilt: number) {
  if (tilt < 12) return "nearly flat";
  if (tilt < 25) return "a gentle slope";
  if (tilt < 40) return "a typical pitched roof";
  return "a steep roof";
}

export default function AdjustScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { project, results, error, update } = useProject();
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const advice = orientationAdvice(project.location.latitudeDeg);
  const inner = width - 40 - 36;
  const rate = project.usage.rateUsdPerKwh ?? 0.16;
  const monthlyKwh = project.usage.monthlyKwh ?? 900;
  const payback = results?.finance.scenarios.find((s) => s.name === "medium")?.simplePaybackYears ?? null;
  const facingBest = project.array.azimuthDeg === advice.preferredAzimuthDeg;

  const setArray = (patch: Partial<SolarProject["array"]>) => update((p) => ({ ...p, array: { ...p.array, ...patch } }));

  async function locate() {
    setLocating(true);
    const result = await gpsPlace();
    setLocating(false);
    if ("reason" in result) {
      setNotice(result.reason);
      return;
    }
    update((p) => moveTo(p, result.place));
    setNotice("Using your current location. Panels now face the best way for it.");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Hero image={photos.rooftopInstall} eyebrow="Adjust your plan" title="Fine-tune it for your roof." subtitle="Change anything below. Your plan updates instantly and saves itself." height={260} />

      <View style={styles.body}>
        <Card style={styles.summary}>
          {results ? (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{results.arrayKw.toFixed(1)} kW</Text>
                <Text style={styles.summaryLabel}>system</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{results.panelCount}</Text>
                <Text style={styles.summaryLabel}>panels</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{payback ? `${payback.toFixed(1)} yr` : "—"}</Text>
                <Text style={styles.summaryLabel}>payback</Text>
              </View>
            </>
          ) : (
            <Text style={styles.error}>{error}</Text>
          )}
        </Card>

        <StepTitle step={1} title="Where you live" caption={`Now: ${project.location.label}`} />
        <Card>
          <GhostButton label={locating ? "Finding you…" : "Use my current location"} icon={{ ios: "location.fill", android: "my_location", web: "my_location" }} onPress={() => void locate()} />
          {notice ? <Text style={styles.muted}>{notice}</Text> : null}
          <View style={styles.chips}>
            {CITIES.map((city) => (
              <Chip key={city.name} label={city.name} active={project.location.label === city.name} onPress={() => update((p) => moveTo(p, cityPlace(city)))} />
            ))}
          </View>
        </Card>

        <StepTitle step={2} title="How much electricity you use" caption="Your average monthly bill sets how big the system needs to be." />
        <Card>
          <Stepper
            label="Monthly electric bill"
            value={Math.round(monthlyKwh * rate)}
            step={10}
            min={20}
            max={1500}
            format={(v) => `$${v}`}
            hint={`≈ ${monthlyKwh.toLocaleString()} kWh a month at $${rate.toFixed(2)}/kWh`}
            onChange={(bill) => update((p) => ({ ...p, usage: { ...p.usage, monthlyKwh: Math.round(bill / rate), monthlyBillUsd: bill } }))}
          />
        </Card>

        <StepTitle step={3} title="Which way the panels face" caption={facingBest ? "This is the best direction for where you live." : `Facing ${compassWord(advice.preferredAzimuthDeg)} would make the most power.`} />
        <Card style={{ alignItems: "center" }}>
          <Compass azimuthDeg={project.array.azimuthDeg} preferredDeg={advice.preferredAzimuthDeg} size={Math.min(220, inner)} />
          <Text style={styles.bigReadout}>Facing {compassWord(project.array.azimuthDeg)}</Text>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: colors.leaf }]} />
            <Text style={styles.muted}>Green dot = best direction</Text>
          </View>
          <View style={{ alignSelf: "stretch", gap: 12 }}>
            <Segmented options={DIRECTIONS} value={String(Math.round(project.array.azimuthDeg) % 360)} onChange={(v) => setArray({ azimuthDeg: Number(v) })} />
            <Stepper label="Exact direction" value={project.array.azimuthDeg} unit="°" step={5} min={0} max={355} hint="0° north · 90° east · 180° south · 270° west" onChange={(azimuthDeg) => setArray({ azimuthDeg })} />
          </View>
        </Card>

        <StepTitle step={4} title="How steep the roof is" caption={`${Math.round(project.array.tiltDeg)}° is ${slopeWord(project.array.tiltDeg)}.`} />
        <Card>
          <TiltDiagram tiltDeg={project.array.tiltDeg} width={inner} />
          <Stepper label="Roof angle" value={project.array.tiltDeg} unit="°" step={5} min={0} max={60} onChange={(tiltDeg) => setArray({ tiltDeg })} />
          {project.array.tiltDeg !== advice.ruleOfThumbTiltDeg || !facingBest ? (
            <GhostButton
              label="Use the best direction and angle"
              icon={{ ios: "wand.and.stars", android: "auto_fix_high", web: "auto_fix_high" }}
              onPress={() => setArray({ azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg })}
            />
          ) : null}
        </Card>

        <StepTitle step={5} title="Extras" caption="Optional. Leave these alone if you’re not sure." />
        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Home battery</Text>
              <Text style={styles.muted}>Keeps power on during outages</Text>
            </View>
            <Switch
              value={Boolean(project.battery?.enabled)}
              trackColor={{ true: colors.sun }}
              onValueChange={(enabled) => {
                tap();
                update((p) => ({ ...p, battery: { ...(p.battery ?? SAMPLE_BATTERY), enabled } }));
              }}
            />
          </View>
          {project.battery?.enabled ? (
            <Stepper
              label="Backup without sun"
              value={project.battery.daysOfAutonomy}
              step={0.5}
              min={0.5}
              max={7}
              unit="days"
              hint={results?.battery ? `${results.battery.usableBankKwh.toFixed(1)} kWh of usable storage` : undefined}
              onChange={(daysOfAutonomy) => update((p) => ({ ...p, battery: { ...(p.battery ?? SAMPLE_BATTERY), daysOfAutonomy } }))}
            />
          ) : null}
          <View style={styles.divider} />
          <Text style={styles.muted}>Panel size (bigger panels, fewer of them)</Text>
          <Segmented options={PANEL_SIZES} value={String(project.array.panelWatts)} onChange={(v) => setArray({ panelWatts: Number(v) })} />
        </Card>

        {results ? (
          <Card>
            <Text style={styles.switchTitle}>Monthly output with these settings</Text>
            <MonthlyBars values={results.array.production.monthly.map((m) => m.acKwh)} usage={results.consumption.monthlyAcKwh} width={inner} height={130} />
          </Card>
        ) : null}

        <GhostButton label="Start over with setup" icon={{ ios: "arrow.counterclockwise", android: "restart_alt", web: "restart_alt" }} onPress={() => router.push("/onboarding")} />
        <Text style={styles.footnote}>Changes save automatically on this phone.</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingBottom: 120 },
    body: { paddingHorizontal: 20, gap: 12, marginTop: 14 },
    summary: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 16 },
    summaryItem: { alignItems: "center", gap: 2 },
    summaryValue: { color: c.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
    summaryLabel: { color: c.textMuted, fontSize: 13, fontWeight: "500" },
    muted: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    bigReadout: { color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    legend: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    switchTitle: { color: c.text, fontSize: 17, fontWeight: "600" },
    error: { color: c.danger, fontSize: 15 },
    footnote: { color: c.textFaint, fontSize: 13, textAlign: "center" },
  });
