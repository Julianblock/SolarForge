import { ScrollView, StyleSheet, Text } from "react-native";
import { useState } from "react";
import { exampleProject } from "@solarforge/shared";
import { PlannerForm } from "@/components/PlannerForm";

export default function DesignScreen() {
  const [project, setProject] = useState(() => exampleProject());
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Azimuth and tilt</Text>
      <Text style={styles.note}>0° is north, 90° east, 180° south, 270° west. A roof dimension still has to be measured; this screen does not read it from a photo.</Text>
      <PlannerForm project={project} onChange={setProject} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, gap: 12 },
  title: { color: "#e8eef8", fontSize: 28, fontWeight: "600" },
  note: { color: "#93a4bf" },
});
