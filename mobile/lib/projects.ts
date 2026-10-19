import AsyncStorage from "@react-native-async-storage/async-storage";
import { exampleProject, projectSchema, type SolarProject } from "@solarforge/shared";

const KEY = "solarforge.mobile.projects";

export async function loadProjects(): Promise<SolarProject[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown[];
  return parsed.flatMap((item) => {
    const result = projectSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

export async function saveProject(project: SolarProject): Promise<void> {
  const projects = await loadProjects();
  const next = [project, ...projects.filter((item) => item.id !== project.id)].slice(0, 1);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export function draftProject(): SolarProject {
  return exampleProject({ name: "Phone draft" });
}
