import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as Location from "expo-location";
import { orientationAdvice } from "@solarforge/engine";
import type { SolarProject } from "@solarforge/shared";
import { Compass, MonthlyBars, TiltDiagram } from "@/components/charts";
import { Card, GhostButton, Hero, Pill, PrimaryButton, SectionTitle, Segmented, Stepper, tap } from "@/components/ui";
import { palette, photos, radius } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";

const DIRECTIONS = [
  { value: "0", label: "N" },
  { value: "90", label: "E" },
  { value: "180", label: "S" },
  { value: "270", label: "W" },
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

export default function DesignScreen() {
  const { width } = useWindowDimensions();
  const { project, results, error, update, save, savedAt } = useProject();
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const advice = orientationAdvice(project.location.latitudeDeg);
  const inner = width - 40 - 36;

  const setArray = (patch: Partial<SolarProject["array"]>) => update((p) => ({ ...p, array: { ...p.array, ...patch } }));

  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNotice("Location permission was denied. Adjust latitude by hand below.");
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      const best = orientationAdvice(coords.latitude);
      update((p) => ({
        ...p,
        location: {
          ...p.location,
          label: "Your location",
          latitudeDeg: Number(coords.latitude.toFixed(5)),
          longitudeDeg: Number(coords.longitude.toFixed(5)),
          timezoneOffsetHours: -new Date().getTimezoneOffset() / 60,
        },
        array: { ...p.array, azimuthDeg: best.preferredAzimuthDeg, tiltDeg: best.ruleOfThumbTiltDeg },
      }));
      setNotice("Located. Panels now face the equator at a rule-of-thumb tilt.");
    } catch {
      setNotice("Couldn’t read GPS. Adjust latitude by hand below.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
      <Hero image={photos.rooftopInstall} eyebrow="Design studio" title="Shape your array." subtitle="Every change reruns the same engine the website uses." height={300} />

      <View style={styles.body}>
        <Card>
          <Text style={styles.label}>Project name</Text>
          <TextInput
            style={styles.input}
            value={project.name}
            onChangeText={(name) => update((p) => ({ ...p, name }))}
            placeholder="My solar project"
            placeholderTextColor={palette.textFaint}
          />
        </Card>

        <SectionTitle title="Location" caption={project.location.label} />
        <Card>
          <GhostButton label={locating ? "Locating…" : "Use my location"} icon={{ ios: "location.fill", android: "my_location", web: "my_location" }} onPress={() => void locate()} />
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <Stepper
            label="Latitude"
            value={project.location.latitudeDeg}
            unit="°"
            step={0.5}
            min={-89}
            max={89}
            format={(v) => v.toFixed(2)}
            onChange={(latitudeDeg) => update((p) => ({ ...p, location: { ...p.location, latitudeDeg, label: "Custom latitude" } }))}
          />
        </Card>

        <SectionTitle title="Direction" caption="Which way the panels face, clockwise from north." />
        <Card style={{ alignItems: "center" }}>
          <Compass azimuthDeg={project.array.azimuthDeg} preferredDeg={advice.preferredAzimuthDeg} size={Math.min(240, inner)} />
          <Text style={styles.bigReadout}>
            {Math.round(project.array.azimuthDeg)}° <Text style={styles.readoutWord}>{compassWord(project.array.azimuthDeg)}</Text>
          </Text>
          <View style={{ alignSelf: "stretch", gap: 12 }}>
            <Segmented options={DIRECTIONS} value={String(Math.round(project.array.azimuthDeg) % 360)} onChange={(v) => setArray({ azimuthDeg: Number(v) })} />
            <Stepper label="Fine-tune" value={project.array.azimuthDeg} unit="°" step={5} min={0} max={355} onChange={(azimuthDeg) => setArray({ azimuthDeg })} />
          </View>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: palette.leaf }]} />
            <Text style={styles.legendText}>Best direction for your latitude</Text>
          </View>
        </Card>

        <SectionTitle title="Tilt" caption="Angle of the panels from flat." />
        <Card>
          <TiltDiagram tiltDeg={project.array.tiltDeg} width={inner} />
          <Stepper label="Tilt angle" value={project.array.tiltDeg} unit="°" step={5} min={0} max={90} onChange={(tiltDeg) => setArray({ tiltDeg })} />
        </Card>

        <GhostButton
          label="Snap to best orientation"
          icon={{ ios: "wand.and.stars", android: "auto_fix_high", web: "auto_fix_high" }}
          onPress={() => setArray({ azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg })}
        />

        <SectionTitle title="Your home" />
        <Card>
          <Stepper
            label="Monthly electricity use"
            value={project.usage.monthlyKwh ?? 0}
            unit="kWh"
            step={50}
            min={50}
            max={10000}
            format={(v) => v.toLocaleString()}
            onChange={(monthlyKwh) => update((p) => ({ ...p, usage: { ...p.usage, monthlyKwh } }))}
          />
          <View style={styles.divider} />
          <Text style={styles.label}>Panel size</Text>
          <Segmented options={PANEL_SIZES} value={String(project.array.panelWatts)} onChange={(v) => setArray({ panelWatts: Number(v) })} />
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Home battery</Text>
              <Text style={styles.label}>Sample LiFePO4 bank for backup</Text>
            </View>
            <Switch
              value={Boolean(project.battery?.enabled)}
              trackColor={{ true: palette.sun }}
              onValueChange={(enabled) => {
                tap();
                update((p) => ({ ...p, battery: { ...(p.battery ?? SAMPLE_BATTERY), enabled } }));
              }}
            />
          </View>
          {project.battery?.enabled ? (
            <Stepper
              label="Days of backup"
              value={project.battery.daysOfAutonomy}
              step={0.5}
              min={0.5}
              max={7}
              unit="days"
              onChange={(daysOfAutonomy) => update((p) => ({ ...p, battery: { ...(p.battery ?? SAMPLE_BATTERY), daysOfAutonomy } }))}
            />
          ) : null}
        </Card>

        <SectionTitle title="Live result" />
        <Card>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {results ? (
            <>
              <View style={styles.resultRow}>
                <View>
                  <Text style={styles.resultBig}>{results.arrayKw.toFixed(1)} kW</Text>
                  <Text style={styles.label}>
                    {results.panelCount} panels · {Math.round(results.array.production.annualAcKwh).toLocaleString()} kWh/yr
                  </Text>
                </View>
                {results.battery ? <Pill label={`${results.battery.usableBankKwh.toFixed(1)} kWh battery`} tint={palette.sky} /> : null}
              </View>
              <MonthlyBars values={results.array.production.monthly.map((m) => m.acKwh)} usage={results.consumption.monthlyAcKwh} width={inner} height={130} />
              <Text style={styles.notice}>{advice.summary}</Text>
            </>
          ) : null}
        </Card>

        <PrimaryButton label="Save project" icon={{ ios: "checkmark", android: "check", web: "check" }} onPress={() => void save()} />
        <Text style={styles.footnote}>
          {savedAt ? `Saved on this phone at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : "The free plan keeps one project on this device."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: 20, gap: 14, marginTop: -6 },
  label: { color: palette.textMuted, fontSize: 13, fontWeight: "500" },
  input: { backgroundColor: palette.surfaceRaised, color: palette.text, borderRadius: radius.sm, padding: 14, fontSize: 17, fontWeight: "600" },
  notice: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  bigReadout: { color: palette.text, fontSize: 34, fontWeight: "800", letterSpacing: -0.6 },
  readoutWord: { color: palette.sun, fontSize: 20, fontWeight: "700" },
  legend: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: palette.textMuted, fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchTitle: { color: palette.text, fontSize: 17, fontWeight: "600" },
  resultRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  resultBig: { color: palette.text, fontSize: 34, fontWeight: "800", letterSpacing: -0.6 },
  error: { color: palette.danger, fontSize: 15 },
  footnote: { color: palette.textFaint, fontSize: 13, textAlign: "center" },
});
