"use client";

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ClickCatcher({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function SiteMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number;
  longitude: number;
  onPick: (latitude: number, longitude: number) => void;
}) {
  return (
    <div style={{ height: 280 }}>
      <MapContainer center={[latitude, longitude]} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: "#f5b942" }} />
        <ClickCatcher onPick={onPick} />
      </MapContainer>
      <p className="muted">Map tiles show a place. They do not measure the roof.</p>
    </div>
  );
}
