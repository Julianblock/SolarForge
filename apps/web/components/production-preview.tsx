"use client";

import { useMemo, useState } from "react";
import { estimateProduction } from "@solarforge/engine";
import { kwh } from "@/lib/format";

const places = [
  { name: "Denver", latitude: 39.74, longitude: -104.99, note: "Denver is north of the equator, so these panels face south." },
  { name: "Sydney", latitude: -33.87, longitude: 151.21, note: "Sydney is south of the equator, so these panels face north." },
  { name: "Quito", latitude: -0.18, longitude: -78.47, note: "Quito is near the equator. The sun passes overhead, so tilt matters less." },
];

export function ProductionPreview() {
  const [place, setPlace] = useState(places[0]!);
  const azimuth = place.latitude < 0 ? 0 : 180;
  const result = useMemo(
    () =>
      estimateProduction({
        latitudeDeg: place.latitude,
        tiltDeg: 30,
        azimuthDeg: azimuth,
        arrayKw: 5,
      }),
    [place, azimuth],
  );

  return (
    <div className="card" aria-label="Example yearly electricity">
      <p className="kicker">Example only. Not your house.</p>
      <p className="stat">
        {kwh(result.annualAcKwh)}
        <small>of electricity in one year, from a 5 kilowatt system in {place.name}</small>
      </p>
      <div className="city-row" role="group" aria-label="Example city">
        {places.map((item) => (
          <button
            key={item.name}
            className={item.name === place.name ? "btn btn-primary" : "btn btn-secondary"}
            type="button"
            onClick={() => setPlace(item)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="fine">{place.note} The weather in this example is approximate, not a measured weather file.</p>
    </div>
  );
}
