import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { dailySunPath, sunriseSunset } from "@solarforge/engine";
import { MonthlyBars, Ring, SunArc } from "@/components/charts";
import { Card, Hero, PrimaryButton, SectionTitle, Stat, tap } from "@/components/ui";
import { gradients, palette, photos, radius } from "@/constants/theme";
import { useProject } from "@/lib/ProjectContext";

const usd = (value: number) => `$${Math.round(value).toLocaleString()}`;

function clock(hours: number | null) {
  if (hours === null) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

const explore: { title: string; caption: string; image: string; href: Href }[] = [
  { title: "Point your panels", caption: "Compass, tilt and live output", image: photos.rooftopInstall, href: "/design" },
  { title: "See the payback", caption: "25 years of savings, charted", image: photos.pinkSkyArray, href: "/savings" },
  { title: "Ask anything", caption: "Answers from your own numbers", image: photos.blueSkyField, href: "/assistant" },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { project, results, error } = useProject();
  const { latitudeDeg, longitudeDeg, timezoneOffsetHours, label } = project.location;

  const sun = useMemo(() => {
    const now = new Date();
    const day = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), timezoneOffsetHours };
    return { path: dailySunPath(latitudeDeg, longitudeDeg, day), times: sunriseSunset(latitudeDeg, longitudeDeg, day) };
  }, [latitudeDeg, longitudeDeg, timezoneOffsetHours]);

  const finance = results?.finance.scenarios.find((s) => s.name === "medium");
  const monthly = results?.array.production.monthly.map((m) => m.acKwh) ?? [];
  const annual = results?.array.production.annualAcKwh ?? 0;
  const inner = width - 40;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Hero image={photos.sunsetRoof} eyebrow={project.name} title={`${Math.round(annual).toLocaleString()} kWh`} subtitle="of clean electricity a year from your roof, estimated.">
        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {label} · {latitudeDeg.toFixed(2)}°, {longitudeDeg.toFixed(2)}°
          </Text>
        </View>
      </Hero>

      <View style={styles.body}>
        {error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
          </Card>
        ) : null}

        <View style={styles.grid}>
          <Stat icon={{ ios: "bolt.fill", android: "bolt", web: "bolt" }} label="System size" value={results ? results.arrayKw.toFixed(1) : "—"} unit="kW" />
          <Stat icon={{ ios: "square.grid.2x2.fill", android: "grid_view", web: "grid_view" }} label="Panels" value={results ? String(results.panelCount) : "—"} unit={`× ${project.array.panelWatts} W`} tint={palette.sky} />
          <Stat
            icon={{ ios: "hourglass", android: "hourglass_bottom", web: "hourglass_bottom" }}
            label="Payback"
            value={finance?.simplePaybackYears ? finance.simplePaybackYears.toFixed(1) : "—"}
            unit="yrs"
            tint={palette.leaf}
          />
          <Stat icon={{ ios: "dollarsign.circle.fill", android: "payments", web: "payments" }} label="Year-one savings" value={finance ? usd(finance.firstYearSavingsUsd) : "—"} tint={palette.leaf} />
        </View>

        <SectionTitle title="Today’s sun" caption="Where the sun is over your site right now." />
        <Card style={{ paddingHorizontal: 0, paddingBottom: 10 }}>
          <View style={styles.sunTimes}>
            <View>
              <Text style={styles.sunLabel}>Sunrise</Text>
              <Text style={styles.sunValue}>{clock(sun.times.sunriseLocalHours)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.sunLabel}>Sunset</Text>
              <Text style={styles.sunValue}>{clock(sun.times.sunsetLocalHours)}</Text>
            </View>
          </View>
          <SunArc path={sun.path} width={inner} />
        </Card>

        <SectionTitle title="Month by month" caption="Bars are estimated production. The dashed line is your monthly use." />
        <Card>
          <MonthlyBars values={monthly} usage={results?.consumption.monthlyAcKwh} width={inner - 36} />
        </Card>

        <Card style={styles.offsetCard}>
          <Ring fraction={results?.array.offsetFraction ?? 0} label={`${Math.round((results?.array.offsetFraction ?? 0) * 100)}%`} caption="covered" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.offsetTitle}>Of your electricity, covered by sun</Text>
            <Text style={styles.offsetCopy}>
              {results ? `${Math.round(results.consumption.annualAcKwh).toLocaleString()} kWh used a year, against ${Math.round(annual).toLocaleString()} kWh produced.` : "Adjust your design to see coverage."}
            </Text>
          </View>
        </Card>

        <PrimaryButton label="Design your system" icon={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }} onPress={() => router.navigate("/design")} />

        <SectionTitle title="Explore" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} snapToInterval={width * 0.72 + 14} decelerationRate="fast">
        {explore.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => {
              tap();
              router.navigate(item.href);
            }}
            style={({ pressed }) => [styles.tile, { width: width * 0.72 }, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient colors={gradients.dusk} locations={[0.3, 0.7, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{item.title}</Text>
              <Text style={styles.tileCaption}>{item.caption}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.disclaimer}>Preliminary estimates from the SolarForge engine. Not an engineering stamp or permit set.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingBottom: 120 },
  body: { paddingHorizontal: 20, gap: 14, marginTop: -6 },
  locationRow: { flexDirection: "row", marginTop: 8 },
  locationText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  error: { color: palette.danger, fontSize: 15 },
  sunTimes: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18 },
  sunLabel: { color: palette.textMuted, fontSize: 13 },
  sunValue: { color: palette.text, fontSize: 20, fontWeight: "700" },
  offsetCard: { flexDirection: "row", alignItems: "center", gap: 18 },
  offsetTitle: { color: palette.text, fontSize: 17, fontWeight: "700" },
  offsetCopy: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  carousel: { paddingHorizontal: 20, gap: 14, paddingTop: 12 },
  tile: { height: 220, borderRadius: radius.lg, overflow: "hidden", backgroundColor: palette.surface },
  tileText: { position: "absolute", left: 18, right: 18, bottom: 18, gap: 4 },
  tileTitle: { color: palette.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  tileCaption: { color: "rgba(245,247,251,0.8)", fontSize: 14 },
  disclaimer: { color: palette.textFaint, fontSize: 12, textAlign: "center", paddingHorizontal: 32, marginTop: 24, lineHeight: 17 },
});
