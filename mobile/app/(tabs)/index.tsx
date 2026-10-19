import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { exampleProject } from "@solarforge/shared";
import { PlannerForm } from "@/components/PlannerForm";

export default function HomeScreen() {
  const [project, setProject] = useState(() => exampleProject());
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Svg width={36} height={36} viewBox="0 0 32 32">
        <Rect width={32} height={32} rx={8} fill="#122238" />
        <Circle cx={16} cy={13} r={4.5} fill="#f5b942" />
        <Path d="M6 23h20M8 20h16" stroke="#f07a32" strokeWidth={1.4} />
      </Svg>
      <Text style={styles.title}>Design the system before you buy it.</Text>
      <Text style={styles.copy}>This phone uses the same calculation engine as the website. The Denver coordinates below are an example until you change them.</Text>
      <PlannerForm project={project} onChange={setProject} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, gap: 12 },
  title: { color: "#e8eef8", fontSize: 32, fontWeight: "600" },
  copy: { color: "#93a4bf", fontSize: 16 },
});
