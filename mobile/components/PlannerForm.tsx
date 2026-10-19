import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { estimateProduction, orientationAdvice } from "@solarforge/engine";
import { evaluateProject, type SolarProject } from "@solarforge/shared";

export function PlannerForm({
  project,
  onChange,
}: {
  project: SolarProject;
  onChange: (project: SolarProject) => void;
}) {
  const advice = orientationAdvice(project.location.latitudeDeg);
  let annual = 0;
  let error: string | null = null;
  try {
    annual = estimateProduction({
      latitudeDeg: project.location.latitudeDeg,
      tiltDeg: project.array.tiltDeg,
      azimuthDeg: project.array.azimuthDeg,
      arrayKw: 5,
    }).annualAcKwh;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Check the numbers.";
  }
  const full = safeFull(project);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Latitude</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(project.location.latitudeDeg)}
        onChangeText={(value) => onChange({ ...project, location: { ...project.location, latitudeDeg: Number(value) } })}
      />
      <Text style={styles.label}>Tilt</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(project.array.tiltDeg)}
        onChangeText={(value) => onChange({ ...project, array: { ...project.array, tiltDeg: Number(value) } })}
      />
      <Text style={styles.label}>Azimuth, clockwise from north</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(project.array.azimuthDeg)}
        onChangeText={(value) => onChange({ ...project, array: { ...project.array, azimuthDeg: Number(value) } })}
      />
      <Text style={styles.note}>{advice.summary}</Text>
      <Text style={styles.stat}>{Math.round(annual).toLocaleString()} kWh</Text>
      <Text style={styles.note}>Approximate AC energy for a 5 kW array. Not measured weather.</Text>
      {full ? (
        <Text style={styles.note}>
          {full.panelCount} modules of {project.array.panelWatts} W cover the draft usage. {full.battery ? `${full.battery.usableBankKwh.toFixed(1)} kWh usable battery.` : "Battery is off."}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={() => onChange({ ...project, array: { ...project.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg } })}
      >
        <Text style={styles.buttonText}>Use equator-facing tilt</Text>
      </Pressable>
    </View>
  );
}

function safeFull(project: SolarProject) {
  try {
    return evaluateProject(project);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#122238", borderRadius: 16, padding: 16, gap: 8 },
  label: { color: "#93a4bf" },
  input: { backgroundColor: "#07111f", color: "#e8eef8", borderRadius: 10, padding: 10 },
  note: { color: "#93a4bf" },
  stat: { color: "#f5b942", fontSize: 32, fontWeight: "600" },
  error: { color: "#ef6b6b" },
  button: { backgroundColor: "#f5b942", borderRadius: 999, padding: 12, alignItems: "center" },
  buttonText: { color: "#1b1406", fontWeight: "600" },
});
