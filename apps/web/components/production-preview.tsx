"use client";

import { useMemo, useState } from "react";
import { estimateProduction } from "@solarforge/engine";
import { kwh } from "@/lib/format";
import { Compass, SunPath } from "./visuals";

const places = [
  { name: "Denver example", latitude: 39.74, longitude: -104.99, timezone: -6 },
  { name: "Sydney example", latitude: -33.87, longitude: 151.21, timezone: 10 },
  { name: "Quito example", latitude: -0.18, longitude: -78.47, timezone: -5 },
];

export function ProductionPreview() {
  const [place, setPlace] = useState(places[0]!);
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(place.latitude < 0 ? 0 : 180);
  const result = useMemo(
    () =>
      estimateProduction({
        latitudeDeg: place.latitude,
        tiltDeg: tilt,
        azimuthDeg: azimuth,
        arrayKw: 5,
      }),
    [place, tilt, azimuth],
  );

  return (
    <div className="card" aria-label="Interactive production preview">
      <p className="kicker">5 kW example</p>
      <p className="stat">
        {kwh(result.annualAcKwh)}
        <small>approximate AC energy per year</small>
      </p>
      <div className="fields" style={{ marginTop: "1rem" }}>
        <label>
          Example site
          <select
            value={place.name}
            onChange={(event) => {
              const next = places.find((item) => item.name === event.target.value) ?? places[0]!;
              setPlace(next);
              setAzimuth(next.latitude < 0 ? 0 : 180);
            }}
          >
            {places.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Tilt {tilt}°
          <input type="range" min={0} max={60} value={tilt} onChange={(event) => setTilt(Number(event.target.value))} />
        </label>
        <label>
          Azimuth {azimuth}° (0 north, 180 south)
          <input type="range" min={0} max={359} value={azimuth} onChange={(event) => setAzimuth(Number(event.target.value))} />
        </label>
      </div>
      <Compass azimuth={azimuth} onChange={setAzimuth} />
      <SunPath latitude={place.latitude} longitude={place.longitude} timezone={place.timezone} />
      <p className="muted">Gold is June 21. Orange is December 21. These sites are examples, and the climate curve is approximate until you import irradiation or an NREL key.</p>
    </div>
  );
}
