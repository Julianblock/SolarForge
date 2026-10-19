import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { dailySunPath, sunriseSunset } from "@solarforge/engine";
import { MonthlyBars, Ring, SunArc } from "@/components/charts";
import { Card, PrimaryButton, SectionTitle, Hero, tap } from "@/components/ui";
import { gradients, onPhoto, photos, radius, type ThemeColors } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";
import { useStyles, useTheme } from "@/lib/ThemeContext";

const usd = (value: number) => `$${Math.round(value).toLocaleString()}`;

function clock(hours: number | null) {
  if (hours === null) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const NEXT: { title: string; caption: string; image: string; href: Href }[] = [
  { title: "Adjust your roof", caption: "Direction, angle, battery", image: photos.rooftopInstall, href: "/design" },
  { title: "See 25 years of savings", caption: "Cost, payback, options", image: photos.pinkSkyArray, href: "/savings" },
  { title: "Ask a question", caption: "Answers from your own plan", image: photos.blueSkyField, href: "/assistant" },
];

export default function PlanScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { project, results, error, loaded, onboarded } = useProject();
  const { latitudeDeg, longitudeDeg, timezoneOffsetHours, label } = project.location;

  useEffect(() => {
    if (loaded && !onboarded) router.push("/onboarding");
  }, [loaded, onboarded]);

  const sun = useMemo(() => {
    const now = new Date();
    const day = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), timezoneOffsetHours };
    return { path: dailySunPath(latitudeDeg, longitudeDeg, day), times: sunriseSunset(latitudeDeg, longitudeDeg, day) };
  }, [latitudeDeg, longitudeDeg, timezoneOffsetHours]);

  const finance = results?.finance.scenarios.find((s) => s.name === "medium");
  const payback = finance?.simplePaybackYears ?? null;
  const annual = results?.array.production.annualAcKwh ?? 0;
  const coverage = results?.array.offsetFraction ?? 0;
  const inner = width - 40;

  const verdict = payback === null ? "Solar won’t pay back here." : payback <= 12 ? "Solar pays off here." : payback <= 20 ? "Solar pays off, slowly." : "Solar is a long wait here.";

  const answers: { icon: SymbolViewProps["name"]; label: string; value: string; detail: string; tint: string }[] = finance
    ? [
        { icon: { ios: "creditcard.fill", android: "credit_card", web: "credit_card" }, label: "Costs about", value: usd(finance.netCostUsd), detail: "up front, before incentives", tint: colors.sun },
        {
          icon: { ios: "leaf.fill", android: "eco", web: "eco" },
          label: "Saves you",
          value: `${usd(finance.firstYearSavingsUsd / 12)}/mo`,
          detail: `${usd(finance.firstYearSavingsUsd)} in the first year`,
          tint: colors.leaf,
        },
        {
          icon: { ios: "hourglass", android: "hourglass_bottom", web: "hourglass_bottom" },
          label: "Pays for itself in",
          value: payback ? `${payback.toFixed(1)} years` : "Not within 25 years",
          detail: "then it’s savings",
          tint: colors.sky,
        },
      ]
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Hero
        image={photos.sunsetRoof}
        eyebrow={label}
        title={results ? verdict : "Let’s check your numbers"}
        subtitle={
          results
            ? `A ${results.arrayKw.toFixed(1)} kW system with ${results.panelCount} panels would make about ${Math.round(annual).toLocaleString()} kWh a year — ${Math.round(coverage * 100)}% of the electricity you use.`
            : undefined
        }
        height={340}
      />

      <View style={styles.body}>
        {!onboarded ? (
          <Card style={styles.sampleCard}>
            <Text style={styles.sampleTitle}>You’re looking at a sample home</Text>
            <Text style={styles.muted}>Answer three questions to see numbers for your own roof.</Text>
            <PrimaryButton label="Set up my home" onPress={() => router.push("/onboarding")} />
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <SectionTitle title="The short answer" />
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          {answers.map((row, index) => (
            <View key={row.label} style={[styles.answerRow, index > 0 && styles.answerDivider]}>
              <View style={[styles.answerIcon, { backgroundColor: `${row.tint}22` }]}>
                <SymbolView name={row.icon} tintColor={row.tint} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.muted}>{row.label}</Text>
                <Text style={styles.answerValue}>{row.value}</Text>
                <Text style={styles.faint}>{row.detail}</Text>
              </View>
            </View>
          ))}
        </Card>

        <SectionTitle title="Your year in sunshine" caption="Summer makes more than you use, winter makes less. Over a year it evens out." />
        <Card>
          <View style={styles.chartHead}>
            <Ring fraction={coverage} size={84} label={`${Math.round(coverage * 100)}%`} caption="covered" />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.legendRow}>
                <LinearGradient colors={gradients.sun} style={styles.legendBar} />
                <Text style={styles.muted}>What your panels make</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDash, { borderColor: colors.sky }]} />
                <Text style={styles.muted}>What your home uses</Text>
              </View>
            </View>
          </View>
          <MonthlyBars values={results?.array.production.monthly.map((m) => m.acKwh) ?? []} usage={results?.consumption.monthlyAcKwh} width={inner - 36} />
        </Card>

        <SectionTitle title="The sun today" caption={`Sunrise ${clock(sun.times.sunriseLocalHours)} · Sunset ${clock(sun.times.sunsetLocalHours)}`} />
        <Card style={{ paddingHorizontal: 0, paddingBottom: 10 }}>
          <SunArc path={sun.path} width={inner} />
        </Card>

        <SectionTitle title="Next steps" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} snapToInterval={width * 0.72 + 14} decelerationRate="fast">
        {NEXT.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => {
              tap();
              router.navigate(item.href);
            }}
            style={({ pressed }) => [styles.tile, { width: width * 0.72 }, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient colors={gradients.photoScrim} locations={[0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{item.title}</Text>
              <Text style={styles.tileCaption}>{item.caption}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.disclaimer}>Estimates from the SolarForge engine, not an installer quote, engineering stamp, or permit set.</Text>
    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingBottom: 120 },
    body: { paddingHorizontal: 20, gap: 12, marginTop: 14 },
    sampleCard: { borderColor: c.sun, borderWidth: 1 },
    sampleTitle: { color: c.text, fontSize: 18, fontWeight: "700" },
    muted: { color: c.textMuted, fontSize: 14 },
    faint: { color: c.textFaint, fontSize: 13 },
    error: { color: c.danger, fontSize: 15 },
    answerRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
    answerDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    answerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    answerValue: { color: c.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
    chartHead: { flexDirection: "row", alignItems: "center", gap: 16 },
    legendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    legendBar: { width: 10, height: 18, borderRadius: 4 },
    legendDash: { width: 18, borderTopWidth: 2, borderStyle: "dashed" },
    carousel: { paddingHorizontal: 20, gap: 14, paddingTop: 12 },
    tile: { height: 200, borderRadius: radius.lg, overflow: "hidden", backgroundColor: c.surface },
    tileText: { position: "absolute", left: 18, right: 18, bottom: 18, gap: 4 },
    tileTitle: { color: onPhoto.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.4 },
    tileCaption: { color: onPhoto.muted, fontSize: 14 },
    disclaimer: { color: c.textFaint, fontSize: 12, textAlign: "center", paddingHorizontal: 32, marginTop: 24, lineHeight: 17 },
  });
