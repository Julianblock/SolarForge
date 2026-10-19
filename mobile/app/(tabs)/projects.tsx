import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import * as Location from "expo-location";
import { createProjectId, exampleProject, type SolarProject } from "@solarforge/shared";
import { orientationAdvice } from "@solarforge/engine";
import { PlannerForm } from "@/components/PlannerForm";
import { saveProject } from "@/lib/projects";

export default function ProjectsScreen() {
  const [project, setProject] = useState<SolarProject>(() => exampleProject({ id: createProjectId(), name: "Phone project" }));
  const [message, setMessage] = useState("The free phone plan keeps one project on this device.");

  async function locate() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setMessage("Location permission was denied. Type the latitude instead.");
      return;
    }
    const position = await Location.getCurrentPositionAsync({});
    const advice = orientationAdvice(position.coords.latitude);
    setProject((current) => ({
      ...current,
      location: {
        ...current.location,
        label: "Device GPS",
        latitudeDeg: Number(position.coords.latitude.toFixed(5)),
        longitudeDeg: Number(position.coords.longitude.toFixed(5)),
        timezoneOffsetHours: -new Date().getTimezoneOffset() / 60,
      },
      array: { ...current.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg },
    }));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My project</Text>
      <TextInput style={styles.input} value={project.name} onChangeText={(name) => setProject({ ...project, name })} />
      <Pressable style={styles.secondary} onPress={() => void locate()}><Text style={styles.secondaryText}>Use GPS</Text></Pressable>
      <PlannerForm project={project} onChange={setProject} />
      <Pressable style={styles.primary} onPress={() => void saveProject(project).then(() => setMessage("Saved on this phone. The free plan replaces the previous project."))}><Text style={styles.primaryText}>Save project</Text></Pressable>
      <Text style={styles.note}>{message}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, gap: 12 },
  title: { color: "#e8eef8", fontSize: 28, fontWeight: "600" },
  input: { backgroundColor: "#122238", color: "#e8eef8", borderRadius: 10, padding: 12 },
  primary: { backgroundColor: "#f5b942", borderRadius: 999, padding: 14, alignItems: "center" },
  primaryText: { color: "#1b1406", fontWeight: "700" },
  secondary: { borderColor: "#2a3d5c", borderWidth: 1, borderRadius: 999, padding: 12, alignItems: "center" },
  secondaryText: { color: "#e8eef8" },
  note: { color: "#93a4bf" },
});
