import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!rateLimit(`pvwatts:${request.headers.get("x-forwarded-for") ?? "local"}`, 20)) {
    return Response.json({ message: "Too many PVWatts requests." }, { status: 429 });
  }
  const key = process.env.NREL_API_KEY;
  if (!key) return Response.json({ mode: "unavailable", message: "NREL_API_KEY is not set. The on-device estimate stays labeled approximate." }, { status: 503 });
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  const capacity = url.searchParams.get("capacity") ?? "1";
  const tilt = url.searchParams.get("tilt") ?? "20";
  const azimuth = url.searchParams.get("azimuth") ?? "180";
  const upstream = new URL("https://developer.nrel.gov/api/pvwatts/v8.json");
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("lat", lat ?? "");
  upstream.searchParams.set("lon", lon ?? "");
  upstream.searchParams.set("system_capacity", capacity);
  upstream.searchParams.set("azimuth", azimuth);
  upstream.searchParams.set("tilt", tilt);
  upstream.searchParams.set("array_type", "1");
  upstream.searchParams.set("module_type", "0");
  upstream.searchParams.set("losses", "14");
  upstream.searchParams.set("timeframe", "monthly");
  const response = await fetch(upstream);
  const payload = await response.json();
  return Response.json({ mode: "nrel-pvwatts-v8", payload }, { status: response.ok ? 200 : 502 });
}
