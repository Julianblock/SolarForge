import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { sizeBatteryBank } from "@solarforge/engine";

export default function CalculatorsScreen() {
  const [daily, setDaily] = useState("10");
  const [days, setDays] = useState("2");
  let summary = "Enter a daily load.";
  const dailyKwh = Number(daily);
  const autonomy = Number(days);
  if (dailyKwh > 0 && autonomy > 0) {
    const bank = sizeBatteryBank({
      dailyAcKwh: dailyKwh,
      daysOfAutonomy: autonomy,
      inverterEfficiency: 0.95,
      busVoltageV: 51.2,
      module: {
        chemistry: "lifepo4",
        nominalVoltageV: 51.2,
        ampHours: 100,
        usableDepthOfDischarge: 0.9,
        dischargeEfficiency: 0.96,
        continuousDischargeKw: 5,
      },
    });
    summary = `${bank.usableBankKwh.toFixed(1)} kWh usable from ${bank.nominalBankKwh.toFixed(1)} kWh nominal. ${bank.moduleCount} sample modules, ${bank.seriesCount}S${bank.parallelCount}P. Nominal is larger because depth of discharge and efficiency are not 100%.`;
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Battery calculator</Text>
      <Text style={styles.label}>Daily kWh</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={daily} onChangeText={setDaily} />
      <Text style={styles.label}>Days of autonomy</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={days} onChangeText={setDays} />
      <Text style={styles.copy}>{summary}</Text>
      <Text style={styles.note}>Sample LiFePO4 module, not a certified datasheet. This is the same function the website calls.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  content: { padding: 20, gap: 10 },
  title: { color: "#e8eef8", fontSize: 28, fontWeight: "600" },
  label: { color: "#93a4bf" },
  input: { backgroundColor: "#122238", color: "#e8eef8", borderRadius: 10, padding: 12 },
  copy: { color: "#e8eef8", fontSize: 18 },
  note: { color: "#93a4bf" },
});
