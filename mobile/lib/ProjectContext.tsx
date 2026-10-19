import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { evaluateProject, exampleProject, type ProjectResults, type SolarProject } from "@solarforge/shared";
import { loadProjects, saveProject } from "@/lib/projects";

interface ProjectContextValue {
  project: SolarProject;
  results: ProjectResults | null;
  error: string | null;
  update: (change: (project: SolarProject) => SolarProject) => void;
  save: () => Promise<void>;
  savedAt: Date | null;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<SolarProject>(() => exampleProject());
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadProjects()
      .then(([stored]) => {
        if (stored) setProject(stored);
      })
      .catch(() => undefined);
  }, []);

  const { results, error } = useMemo(() => {
    try {
      return { results: evaluateProject(project), error: null };
    } catch (caught) {
      return { results: null, error: caught instanceof Error ? caught.message : "Check the numbers." };
    }
  }, [project]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project,
      results,
      error,
      savedAt,
      update: (change) => setProject((current) => ({ ...change(current), updatedAt: new Date().toISOString() })),
      save: async () => {
        await saveProject(project);
        setSavedAt(new Date());
      },
    }),
    [project, results, error, savedAt],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useProject must be used inside ProjectProvider");
  return value;
}
