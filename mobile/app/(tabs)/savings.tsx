import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { FinanceScenario, ScenarioId } from "@solarforge/engine";
import { PaybackChart } from "@/components/charts";
import { Card, Hero, SectionTitle, Segmented, Stat, Stepper, tap } from "@/components/ui";
import { photos, radius, type ThemeColors } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";
import { useStyles, useTheme } from "@/lib/ThemeContext";

const usd = (value: number) => `${value < 0 ? "−" : ""}$${Math.abs(Math.round(value)).toLocaleString()}`;

const CASES: { value: FinanceScenario["name"]; label: string; caption: string }[] = [
  { value: "low", label: "Cautious", caption: "Less sun and a pricier install than expected." },
  { value: "medium", label: "Expected", caption: "Our best estimate for your home." },
  { value: "high", label: "Optimistic", caption: "More sun and a cheaper install than expected." },
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
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
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

  const profit = scenario ? scenario.lifetimeSavingsUsd - scenario.netCostUsd : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Hero
        image={photos.pinkSkyArray}
        eyebrow="Your money"
        title={scenario ? `${usd(profit)} ahead` : "—"}
        subtitle={scenario ? `after 25 years. You’d spend ${usd(scenario.netCostUsd)} and save ${usd(scenario.lifetimeSavingsUsd)} on electric bills.` : undefined}
        height={300}
      />

      <View style={styles.body}>
        <Segmented options={CASES} value={caseName} onChange={setCaseName} />
        <Text style={styles.caseCaption}>{CASES.find((c) => c.value === caseName)?.caption}</Text>

        {scenario ? (
          <>
            <Card>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>When you break even</Text>
                <Text style={styles.chartValue}>{scenario.simplePaybackYears ? `Year ${Math.ceil(scenario.simplePaybackYears)}` : "Not within 25 years"}</Text>
              </View>
              <PaybackChart netCost={scenario.netCostUsd} yearlySavings={scenario.years.map((y) => y.savingsUsd)} width={width - 76} />
              <Text style={styles.caption}>The line starts below zero (what you paid) and climbs as bills shrink. Above the dashed line, you’re ahead.</Text>
            </Card>

            <View style={styles.grid}>
              <Stat icon={{ ios: "creditcard.fill", android: "credit_card", web: "credit_card" }} label="You pay up front" value={usd(scenario.netCostUsd)} />
              <Stat icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }} label="Saved each month" value={usd(scenario.firstYearSavingsUsd / 12)} tint={colors.leaf} />
              <Stat icon={{ ios: "leaf.fill", android: "eco", web: "eco" }} label="Saved in year one" value={usd(scenario.firstYearSavingsUsd)} tint={colors.leaf} />
              <Stat icon={{ ios: "chart.line.uptrend.xyaxis", android: "trending_up", web: "trending_up" }} label="Profit after 25 years" value={usd(profit)} tint={colors.sky} />
            </View>
          </>
        ) : null}

        <SectionTitle title="Make it match your bill" caption="Swap in the rate from your utility bill and the price from an installer quote." />
        <Card>
          <Stepper label="What you pay per kWh" value={rate} step={0.01} min={0.01} max={1} format={(v) => `$${v.toFixed(2)}`} hint="Find it on your electric bill" onChange={(importRateUsdPerKwh) => setFinance({ importRateUsdPerKwh })} />
          <View style={styles.divider} />
          <Stepper label="Install price per watt" value={perWatt} step={0.1} min={0.5} max={8} format={(v) => `$${v.toFixed(2)}`} hint="Typical U.S. quotes run $2.50–$3.50" onChange={(usdPerWatt) => setFinance({ usdPerWatt })} />
        </Card>

        {results ? (
          <>
            <SectionTitle title="Other ways to build it" caption="Same roof, different priorities." />
            {results.scenarios.map((option) => (
              <Card key={option.id} style={styles.scenario}>
                <View style={[styles.scenarioIcon, { backgroundColor: `${colors.sun}22` }]}>
                  <SymbolView name={SCENARIO_ICONS[option.id]} tintColor={colors.sun} size={22} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.scenarioTitle}>{option.title}</Text>
                  <Text style={styles.caption}>{option.description}</Text>
                  <Text style={[styles.scenarioMeta, { color: colors.sun }]}>
                    {option.array.panelCount} panels · {Math.round(option.array.offsetFraction * 100)}% of your power
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
              <Text style={styles.assumptionsToggleText}>{showAssumptions ? "Hide the fine print" : "How we calculated this"}</Text>
              <SymbolView name={{ ios: showAssumptions ? "chevron.up" : "chevron.down", android: "expand_more", web: "expand_more" }} tintColor={colors.textMuted} size={14} />
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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingBottom: 120 },
    body: { paddingHorizontal: 20, gap: 12, marginTop: 14 },
    caseCaption: { color: c.textMuted, fontSize: 13, textAlign: "center", marginTop: -4 },
    chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    chartTitle: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
    chartValue: { color: c.leaf, fontSize: 20, fontWeight: "800" },
    caption: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    scenario: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
    scenarioIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    scenarioTitle: { color: c.text, fontSize: 17, fontWeight: "700" },
    scenarioMeta: { fontSize: 13, fontWeight: "600", marginTop: 2 },
    assumptionsToggle: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: radius.pill },
    assumptionsToggleText: { color: c.textMuted, fontSize: 14, fontWeight: "600" },
  });
