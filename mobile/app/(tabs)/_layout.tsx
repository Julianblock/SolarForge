import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { useTheme } from "@/lib/ThemeContext";

export default function TabLayout() {
  const { colors } = useTheme();
  const dark = colors.scheme === "dark";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sun,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { position: "absolute", borderTopColor: colors.border, backgroundColor: "transparent", elevation: 0 },
        tabBarBackground: () => (
          <BlurView tint={dark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"} intensity={90} style={StyleSheet.absoluteFill} />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "My Plan", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "sun.max.fill", android: "wb_sunny", web: "wb_sunny" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="design"
        options={{ title: "Adjust", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="savings"
        options={{ title: "Savings", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "dollarsign.circle.fill", android: "payments", web: "payments" }} tintColor={color} size={24} /> }}
      />
      <Tabs.Screen
        name="assistant"
        options={{ title: "Ask", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }} tintColor={color} size={24} /> }}
      />
    </Tabs>
  );
}
