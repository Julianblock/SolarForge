import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { SolarPosition } from "@solarforge/engine";
import { useTheme } from "@/lib/ThemeContext";

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export function MonthlyBars({
  values,
  usage,
  width,
  height = 170,
}: {
  values: number[];
  usage?: number;
  width: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const current = new Date().getMonth();
  const max = Math.max(...values, usage ?? 0, 1);
  const chartHeight = height - 22;
  const slot = width / values.length;
  const barWidth = slot * 0.58;
  const usageY = usage ? chartHeight - (usage / max) * chartHeight : null;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffd25a" />
          <Stop offset="1" stopColor="#ff6a13" />
        </LinearGradient>
        <LinearGradient id="barDim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffb224" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#ff6a13" stopOpacity={0.15} />
        </LinearGradient>
      </Defs>
      {values.map((value, index) => {
        const barHeight = Math.max(4, (value / max) * chartHeight);
        const x = index * slot + (slot - barWidth) / 2;
        return (
          <G key={index}>
            <Rect
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2.6}
              fill={index === current ? "url(#bar)" : "url(#barDim)"}
            />
            <SvgText
              x={x + barWidth / 2}
              y={height - 4}
              fontSize={11}
              fontWeight={index === current ? "700" : "500"}
              fill={index === current ? colors.text : colors.textFaint}
              textAnchor="middle"
            >
              {MONTH_LETTERS[index]}
            </SvgText>
          </G>
        );
      })}
      {usageY !== null ? (
        <Line x1={0} x2={width} y1={usageY} y2={usageY} stroke={colors.sky} strokeWidth={1.5} strokeDasharray="5 5" />
      ) : null}
    </Svg>
  );
}

export function SunArc({ path, width, height = 150 }: { path: SolarPosition[]; width: number; height?: number }) {
  const { colors } = useTheme();
  const now = new Date();
  const hourNow = now.getHours() + now.getMinutes() / 60;
  const peak = Math.max(...path.map((p) => p.elevationDeg), 10);
  const horizon = height * 0.78;
  const x = (hour: number) => (hour / 23) * width;
  const y = (elevation: number) => horizon - (elevation / peak) * (horizon - 16);
  const points = path.map((p, hour) => `${x(hour).toFixed(1)},${y(p.elevationDeg).toFixed(1)}`);
  const line = `M ${points.join(" L ")}`;
  const lower = Math.floor(hourNow);
  const upper = Math.min(23, lower + 1);
  const t = hourNow - lower;
  const elevationNow = path[lower].elevationDeg * (1 - t) + path[upper].elevationDeg * t;
  const sunX = x(hourNow);
  const sunY = y(elevationNow);
  const daylight = elevationNow > 0;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffb224" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#ffb224" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={horizon} fill="url(#sky)" opacity={0.6} />
      <Path d={line} stroke={colors.sun} strokeOpacity={0.9} strokeWidth={2.5} fill="none" strokeDasharray="2 6" strokeLinecap="round" />
      <Line x1={0} x2={width} y1={horizon} y2={horizon} stroke={colors.textFaint} strokeWidth={1} />
      {daylight ? (
        <G>
          <Circle cx={sunX} cy={sunY} r={20} fill={colors.sun} opacity={0.18} />
          <Circle cx={sunX} cy={sunY} r={11} fill={colors.sun} />
        </G>
      ) : (
        <Circle cx={sunX} cy={horizon + 10} r={7} fill={colors.textFaint} />
      )}
      {[6, 12, 18].map((hour) => (
        <SvgText key={hour} x={x(hour)} y={height - 6} fontSize={11} fill={colors.textFaint} textAnchor="middle">
          {hour === 12 ? "Noon" : hour === 6 ? "6 AM" : "6 PM"}
        </SvgText>
      ))}
    </Svg>
  );
}

export function Compass({ azimuthDeg, size = 200, preferredDeg }: { azimuthDeg: number; size?: number; preferredDeg?: number }) {
  const { colors } = useTheme();
  const c = size / 2;
  const r = c - 14;
  const point = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: c + radius * Math.cos(rad), y: c + radius * Math.sin(rad) };
  };
  const tip = point(azimuthDeg, r - 18);
  const left = point(azimuthDeg - 90, 9);
  const right = point(azimuthDeg + 90, 9);
  const tail = point(azimuthDeg + 180, 26);
  const best = preferredDeg !== undefined ? point(preferredDeg, r) : null;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="needle" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffd25a" />
          <Stop offset="1" stopColor="#ff6a13" />
        </LinearGradient>
      </Defs>
      <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={1.5} fill={colors.surfaceRaised} />
      <Circle cx={c} cy={c} r={r - 26} stroke={colors.border} strokeWidth={1} fill="none" />
      {Array.from({ length: 72 }, (_, i) => {
        const deg = i * 5;
        const major = deg % 45 === 0;
        const a = point(deg, r);
        const b = point(deg, r - (major ? 10 : 5));
        return <Line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major ? colors.textMuted : colors.textFaint} strokeWidth={major ? 1.6 : 1} />;
      })}
      {(["N", "E", "S", "W"] as const).map((label, i) => {
        const p = point(i * 90, r - 22);
        return (
          <SvgText key={label} x={p.x} y={p.y + 5} fontSize={14} fontWeight="700" fill={label === "N" ? colors.danger : colors.text} textAnchor="middle">
            {label}
          </SvgText>
        );
      })}
      {best ? <Circle cx={best.x} cy={best.y} r={6} fill={colors.leaf} stroke={colors.bg} strokeWidth={2} /> : null}
      <Polygon points={`${tip.x},${tip.y} ${left.x},${left.y} ${tail.x},${tail.y} ${right.x},${right.y}`} fill="url(#needle)" />
      <Circle cx={c} cy={c} r={6} fill={colors.text} />
    </Svg>
  );
}

export function TiltDiagram({ tiltDeg, width, height = 140 }: { tiltDeg: number; width: number; height?: number }) {
  const { colors } = useTheme();
  const ground = height - 18;
  const pivotX = width * 0.38;
  const length = Math.min(width * 0.5, 150);
  const rad = (tiltDeg * Math.PI) / 180;
  const endX = pivotX + length * Math.cos(rad);
  const endY = ground - length * Math.sin(rad);
  const arc = Math.min(46, length * 0.4);
  const arcEnd = { x: pivotX + arc * Math.cos(rad), y: ground - arc * Math.sin(rad) };
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3a7bfd" />
          <Stop offset="1" stopColor="#5ac8fa" />
        </LinearGradient>
      </Defs>
      {[0, 1, 2].map((i) => (
        <Line
          key={i}
          x1={width - 20 - i * 26}
          y1={12 + i * 8}
          x2={endX - 10 - i * 30}
          y2={endY + 14 + i * 16}
          stroke={colors.sun}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeDasharray="4 5"
        />
      ))}
      <Circle cx={width - 22} cy={18} r={12} fill={colors.sun} />
      <Line x1={12} x2={width - 12} y1={ground} y2={ground} stroke={colors.textFaint} strokeWidth={1.5} />
      <Line x1={pivotX} y1={ground} x2={endX} y2={endY} stroke="url(#panel)" strokeWidth={9} strokeLinecap="round" />
      <Line x1={endX} y1={endY} x2={endX} y2={ground} stroke={colors.textFaint} strokeWidth={2} />
      <Path d={`M ${pivotX + arc} ${ground} A ${arc} ${arc} 0 0 0 ${arcEnd.x} ${arcEnd.y}`} stroke={colors.sun} strokeWidth={1.5} fill="none" />
      <SvgText x={pivotX + arc + 8} y={ground - 8} fontSize={13} fontWeight="700" fill={colors.sun}>
        {`${Math.round(tiltDeg)}°`}
      </SvgText>
    </Svg>
  );
}

export function PaybackChart({
  netCost,
  yearlySavings,
  width,
  height = 180,
}: {
  netCost: number;
  yearlySavings: number[];
  width: number;
  height?: number;
}) {
  const { colors } = useTheme();
  let running = -netCost;
  const cumulative = [running, ...yearlySavings.map((s) => (running += s))];
  const min = Math.min(...cumulative);
  const max = Math.max(...cumulative, 1);
  const pad = 10;
  const x = (i: number) => pad + (i / (cumulative.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + ((max - v) / (max - min)) * (height - pad * 2 - 16);
  const line = cumulative.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(cumulative.length - 1)} ${y(min)} L ${x(0)} ${y(min)} Z`;
  const zeroY = y(0);
  const crossIndex = cumulative.findIndex((v) => v >= 0);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.leaf} stopOpacity={0.35} />
          <Stop offset="1" stopColor={colors.leaf} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#area)" />
      <Line x1={pad} x2={width - pad} y1={zeroY} y2={zeroY} stroke={colors.textFaint} strokeDasharray="4 4" />
      <Path d={line} stroke={colors.leaf} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {crossIndex > 0 ? (
        <G>
          <Circle cx={x(crossIndex)} cy={y(cumulative[crossIndex])} r={10} fill={colors.leaf} opacity={0.25} />
          <Circle cx={x(crossIndex)} cy={y(cumulative[crossIndex])} r={5} fill={colors.leaf} />
        </G>
      ) : null}
      {[0, 5, 10, 15, 20, 25].filter((yr) => yr < cumulative.length).map((yr) => (
        <SvgText
          key={yr}
          x={x(yr)}
          y={height - 2}
          fontSize={11}
          fill={colors.textFaint}
          textAnchor={yr === 0 ? "start" : yr === cumulative.length - 1 ? "end" : "middle"}
        >
          {yr === 0 ? "Today" : `Yr ${yr}`}
        </SvgText>
      ))}
    </Svg>
  );
}

export function Ring({ fraction, size = 120, label, caption }: { fraction: number; size?: number; label: string; caption: string }) {
  const { colors } = useTheme();
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1, fraction));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffd25a" />
            <Stop offset="1" stopColor="#ff6a13" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceRaised} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * shown} ${circumference}`}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={[ringStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[ringStyles.caption, { color: colors.textMuted }]}>{caption}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  center: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  caption: { fontSize: 12, fontWeight: "600" },
});
