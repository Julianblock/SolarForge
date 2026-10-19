import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { palette } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.sun,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: { position: "absolute", borderTopColor: palette.border, backgroundColor: "transparent", elevation: 0 },
        tabBarBackground: () => <BlurView tint="systemChromeMaterialDark" intensity={90} style={StyleSheet.absoluteFill} />,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "sun.max.fill", android: "wb_sunny", web: "wb_sunny" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="design"
        options={{ title: "Design", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "square.grid.3x3.fill", android: "grid_view", web: "grid_view" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="savings"
        options={{ title: "Savings", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "chart.line.uptrend.xyaxis", android: "trending_up", web: "trending_up" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="assistant"
        options={{ title: "Ask", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} tintColor={color} size={24} /> }}
      />
    </Tabs>
  );
}
