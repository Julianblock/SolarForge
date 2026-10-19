import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme].tint;
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: tint, headerStyle: { backgroundColor: "#07111f" }, headerTintColor: "#e8eef8", tabBarStyle: { backgroundColor: "#0d1a2c" } }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "sun.max", android: "wb_sunny", web: "wb_sunny" }} tintColor={color} size={24} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "folder", android: "folder", web: "folder" }} tintColor={color} size={24} /> }} />
      <Tabs.Screen name="design" options={{ title: "Design", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "compass.drawing", android: "explore", web: "explore" }} tintColor={color} size={24} /> }} />
      <Tabs.Screen name="calculators" options={{ title: "Calculators", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "function", android: "functions", web: "functions" }} tintColor={color} size={24} /> }} />
      <Tabs.Screen name="assistant" options={{ title: "Assistant", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "bubble.left", android: "chat", web: "chat" }} tintColor={color} size={24} /> }} />
    </Tabs>
  );
}
