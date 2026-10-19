import * as Location from "expo-location";
import { orientationAdvice } from "@solarforge/engine";
import type { SolarProject } from "@solarforge/shared";
import type { City } from "@/constants/theme";

type Place = Pick<City, "latitudeDeg" | "longitudeDeg" | "timezoneOffsetHours"> & { label: string };

/** Move the project to a place and face the panels the right way for that hemisphere. */
export function moveTo(project: SolarProject, place: Place): SolarProject {
  const advice = orientationAdvice(place.latitudeDeg);
  return {
    ...project,
    location: { ...project.location, ...place },
    array: { ...project.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg },
  };
}

export function cityPlace(city: City): Place {
  return { label: city.name, latitudeDeg: city.latitudeDeg, longitudeDeg: city.longitudeDeg, timezoneOffsetHours: city.timezoneOffsetHours };
}

/** Returns null with a reason when GPS can't be used. */
export async function gpsPlace(): Promise<{ place: Place } | { reason: string }> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { reason: "Location is off for SolarForge. Pick the nearest city instead." };
    const { coords } = await Location.getCurrentPositionAsync({});
    return {
      place: {
        label: "Your location",
        latitudeDeg: Number(coords.latitude.toFixed(4)),
        longitudeDeg: Number(coords.longitude.toFixed(4)),
        timezoneOffsetHours: -new Date().getTimezoneOffset() / 60,
      },
    };
  } catch {
    return { reason: "Couldn’t get a GPS fix. Pick the nearest city instead." };
  }
}
