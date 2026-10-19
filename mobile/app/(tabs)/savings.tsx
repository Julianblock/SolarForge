import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { FinanceScenario, ScenarioId } from "@solarforge/engine";
import { PaybackChart } from "@/components/charts";
import { Card, Hero, SectionTitle, Segmented, Stat, Stepper, tap } from "@/components/ui";
import { palette, photos, radius } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";

const usd = (value: number) => `${value < 0 ? "−" : ""}$${Math.abs(Math.round(value)).toLocaleString()}`;

const CASES: { value: FinanceScenario["name"]; label: string }[] = [
  { value: "low", label: "Cautious" },
  { value: "medium", label: "Expected" },
  { value: "high", label: "Optimistic" },
];

const SCENARIO_ICONS: Record<ScenarioId, SymbolViewProps["name"]> = {
  "lowest-cost": { ios: "tag.fill", android: "sell", web: "sell" },
  "max-production": { ios: "bolt.fill", android: "bolt", web: "bolt" },
  "best-backup": { ios: "battery.100.bolt", android: "battery_charging_full", web: "battery_charging_full" },
  independence: { ios: "house.fill", android: "home", web: "home" },
  balanced: { ios: "scalemass.fill", android: "balance", web: "balance" },
};

export default function SavingsScreen() {
  const { width } = useWindowDimensions();
  const { project, results, update } = useProject();
  const [caseName, setCaseName] = useState<FinanceScenario["name"]>("medium");
  const [showAssumptions, setShowAssumptions] = useState(false);
  const scenario = results?.finance.scenarios.find((s) => s.name === caseName);
  const rate = project.finance?.importRateUsdPerKwh ?? project.usage.rateUsdPerKwh ?? 0.16;
  const perWatt = project.finance?.usdPerWatt ?? 2.5;

  const setFinance = (patch: Partial<NonNullable<typeof project.finance>>) =>
    update((p) => ({
      ...p,
      finance: {
        importRateUsdPerKwh: rate,
        exportRateUsdPerKwh: 0,
        escalationRate: 0.02,
        discountRate: 0.05,
        analysisYears: 25,
        annualMaintenanceUsd: 0,
        ...p.finance,
        ...patch,
      },
      usage: patch.importRateUsdPerKwh ? { ...p.usage, rateUsdPerKwh: patch.importRateUsdPerKwh } : p.usage,
    }));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Hero
        image={photos.pinkSkyArray}
        eyebrow="Over 25 years"
        title={scenario ? usd(scenario.lifetimeSavingsUsd) : "—"}
        subtitle="in estimated bill savings, before you count what the system cost."
        height={320}
      />

      <View style={styles.body}>
        <Segmented options={CASES} value={caseName} onChange={setCaseName} />

        {scenario ? (
          <>
            <Card>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Break-even</Text>
                <Text style={styles.chartValue}>{scenario.simplePaybackYears ? `Year ${scenario.simplePaybackYears.toFixed(1)}` : "Not within 25 years"}</Text>
              </View>
              <PaybackChart netCost={scenario.netCostUsd} yearlySavings={scenario.years.map((y) => y.savingsUsd)} width={width - 76} />
              <Text style={styles.caption}>Cumulative savings minus the system cost. The line crosses zero when it has paid for itself.</Text>
            </Card>

            <View style={styles.grid}>
              <Stat icon={{ ios: "creditcard.fill", android: "credit_card", web: "credit_card" }} label="System cost" value={usd(scenario.netCostUsd)} />
              <Stat icon={{ ios: "leaf.fill", android: "eco", web: "eco" }} label="Year-one savings" value={usd(scenario.firstYearSavingsUsd)} tint={palette.leaf} />
              <Stat icon={{ ios: "chart.bar.fill", android: "bar_chart", web: "bar_chart" }} label="Net present value" value={usd(scenario.netPresentValueUsd)} tint={palette.sky} />
              <Stat
                icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                label="Monthly savings"
                value={usd(scenario.firstYearSavingsUsd / 12)}
                tint={palette.leaf}
              />
            </View>
          </>
        ) : null}

        <SectionTitle title="Your numbers" caption="Swap these for your utility bill and installer quote." />
        <Card>
          <Stepper label="Electricity rate" value={rate} unit="$/kWh" step={0.01} min={0.01} max={1} format={(v) => `$${v.toFixed(2)}`} onChange={(importRateUsdPerKwh) => setFinance({ importRateUsdPerKwh })} />
          <View style={styles.divider} />
          <Stepper label="Installed cost per watt" value={perWatt} step={0.1} min={0.5} max={8} format={(v) => `$${v.toFixed(2)}`} unit="/W" onChange={(usdPerWatt) => setFinance({ usdPerWatt })} />
        </Card>

        {results ? (
          <>
            <SectionTitle title="Ways to build it" caption="Same roof, different priorities." />
            {results.scenarios.map((option) => (
              <Card key={option.id} style={styles.scenario}>
                <View style={styles.scenarioIcon}>
                  <SymbolView name={SCENARIO_ICONS[option.id]} tintColor={palette.sun} size={22} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.scenarioTitle}>{option.title}</Text>
                  <Text style={styles.caption}>{option.description}</Text>
                  <Text style={styles.scenarioMeta}>
                    {option.array.arrayKw.toFixed(1)} kW · {option.array.panelCount} panels · {Math.round(option.array.offsetFraction * 100)}% covered
                    {option.battery ? ` · ${option.battery.usableBankKwh.toFixed(0)} kWh battery` : ""}
                  </Text>
                </View>
              </Card>
            ))}

            <Pressable
              onPress={() => {
                tap();
                setShowAssumptions((v) => !v);
              }}
              style={styles.assumptionsToggle}
            >
              <Text style={styles.assumptionsToggleText}>{showAssumptions ? "Hide assumptions" : "Show assumptions"}</Text>
              <SymbolView name={{ ios: showAssumptions ? "chevron.up" : "chevron.down", android: "expand_more", web: "expand_more" }} tintColor={palette.textMuted} size={14} />
            </Pressable>
            {showAssumptions ? (
              <Card>
                {results.assumptions.map((line) => (
                  <Text key={line} style={styles.caption}>
                    • {line}
                  </Text>
                ))}
              </Card>
            ) : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: 20, gap: 14, marginTop: -6 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  chartTitle: { color: palette.textMuted, fontSize: 14, fontWeight: "600" },
  chartValue: { color: palette.leaf, fontSize: 20, fontWeight: "800" },
  caption: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.border },
  scenario: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  scenarioIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,178,36,0.14)", alignItems: "center", justifyContent: "center" },
  scenarioTitle: { color: palette.text, fontSize: 17, fontWeight: "700" },
  scenarioMeta: { color: palette.sun, fontSize: 13, fontWeight: "600", marginTop: 2 },
  assumptionsToggle: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: radius.pill },
  assumptionsToggleText: { color: palette.textMuted, fontSize: 14, fontWeight: "600" },
});
