"use client";

import { dailySunPath } from "@solarforge/engine";

export function Disclaimer({ children }: { children?: string }) {
  return (
    <p className="banner">
      {children ??
        "This is a rough plan, not a permit. A local electrician still has to check the roof, the wires, and the rules where you live."}
    </p>
  );
}

export function MonthBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <>
    <p className="fine">Each bar is one month. January is on the left. December is on the right.</p>
    <div className="bars" role="img" aria-label="Monthly values, January through December">
      {values.map((value, index) => (
        <div key={labels[index] ?? index} style={{ height: `${Math.max(6, (value / max) * 100)}%` }} title={`${labels[index]} ${Math.round(value)}`}>
          <span>{labels[index]?.slice(0, 1)}</span>
        </div>
      ))}
    </div>
    </>
  );
}

export function SunPath({ latitude, longitude, timezone }: { latitude: number; longitude: number; timezone: number }) {
  const summer = dailySunPath(latitude, longitude, { year: 2024, month: 6, day: 21, timezoneOffsetHours: timezone });
  const winter = dailySunPath(latitude, longitude, { year: 2024, month: 12, day: 21, timezoneOffsetHours: timezone });
  const plot = (samples: typeof summer) =>
    samples
      .filter((sample) => sample.elevationDeg > -2)
      .map((sample) => `${((sample.azimuthDeg / 360) * 320 + 20).toFixed(1)},${(160 - (sample.elevationDeg / 90) * 140).toFixed(1)}`)
      .join(" ");
  return (
    <svg viewBox="0 0 360 190" role="img" aria-label="Sun path by azimuth and elevation">
      <text x="20" y="20" fill="currentColor" fontSize="12">Elevation vs azimuth</text>
      <polyline fill="none" stroke="#f5b942" strokeWidth="3" points={plot(summer)} />
      <polyline fill="none" stroke="#f07a32" strokeWidth="3" points={plot(winter)} />
      <text x="20" y="180" fill="currentColor" fontSize="11">N</text>
      <text x="160" y="180" fill="currentColor" fontSize="11">S</text>
      <text x="310" y="180" fill="currentColor" fontSize="11">W</text>
    </svg>
  );
}

export function Compass({ azimuth, onChange }: { azimuth: number; onChange?: (degrees: number) => void }) {
  function onKey(event: React.KeyboardEvent) {
    if (!onChange) return;
    if (event.key === "ArrowRight") onChange((azimuth + 5) % 360);
    if (event.key === "ArrowLeft") onChange((azimuth + 355) % 360);
  }
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(azimuth)}
      aria-label="Panel azimuth, degrees clockwise from north"
      onKeyDown={onKey}
      style={{ width: 180, height: 180, margin: "0 auto" }}
    >
      <svg viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="70" fill="none" stroke="currentColor" opacity="0.3" />
        <text x="84" y="22" fontSize="12">N</text>
        <text x="158" y="96" fontSize="12">E</text>
        <text x="84" y="170" fontSize="12">S</text>
        <text x="8" y="96" fontSize="12">W</text>
        <g transform={`rotate(${azimuth} 90 90)`}>
          <polygon points="90,28 98,96 90,88 82,96" fill="#f5b942" />
        </g>
      </svg>
    </div>
  );
}
