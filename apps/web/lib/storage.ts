import { planById, projectSchema, type PlanId, type SolarProject } from "@solarforge/shared";

const PROJECTS = "solarforge.projects.v1";
const PLAN = "solarforge.plan";

export function readPlan(): PlanId {
  if (typeof window === "undefined") return "free";
  const value = window.localStorage.getItem(PLAN);
  if (value === "pro" || value === "professional" || value === "free") return value;
  return "free";
}

export function writePlan(plan: PlanId): void {
  window.localStorage.setItem(PLAN, plan);
}

export function readProjects(): SolarProject[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PROJECTS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.flatMap((item) => {
      const result = projectSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function writeProjects(projects: SolarProject[]): void {
  window.localStorage.setItem(PROJECTS, JSON.stringify(projects));
}

export function saveProject(project: SolarProject): { ok: true } | { ok: false; reason: string } {
  const projects = readProjects();
  const limit = planById(readPlan()).projectLimit;
  const existing = projects.some((item) => item.id === project.id);
  if (limit !== null && !existing && projects.length >= limit) {
    return { ok: false, reason: `The ${readPlan()} plan keeps ${limit} saved project. Upgrade to save another.` };
  }
  const next = existing ? projects.map((item) => (item.id === project.id ? project : item)) : [project, ...projects];
  writeProjects(next);
  return { ok: true };
}

export function deleteProject(id: string): void {
  writeProjects(readProjects().filter((item) => item.id !== id));
}

export function duplicateProject(id: string): { ok: true; project: SolarProject } | { ok: false; reason: string } {
  if (readPlan() === "free") return { ok: false, reason: "Project duplication is part of Professional." };
  const source = readProjects().find((item) => item.id === id);
  if (!source) return { ok: false, reason: "Project was not found." };
  const copy: SolarProject = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name} copy`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const saved = saveProject(copy);
  return saved.ok ? { ok: true, project: copy } : saved;
}
