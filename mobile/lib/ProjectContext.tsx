import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { evaluateProject, exampleProject, type ProjectResults, type SolarProject } from "@solarforge/shared";
import { loadProjects, saveProject } from "@/lib/projects";

const ONBOARDED_KEY = "solarforge.mobile.onboarded";

interface ProjectContextValue {
  project: SolarProject;
  results: ProjectResults | null;
  error: string | null;
  /** True once storage has been read, so first-run checks don't fire early. */
  loaded: boolean;
  onboarded: boolean;
  update: (change: (project: SolarProject) => SolarProject) => void;
  finishOnboarding: () => void;
  restartOnboarding: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<SolarProject>(() => exampleProject());
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    Promise.all([loadProjects(), AsyncStorage.getItem(ONBOARDED_KEY)])
      .then(([[stored], flag]) => {
        if (stored) setProject(stored);
        setOnboarded(flag === "1");
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const timer = setTimeout(() => void saveProject(project).catch(() => undefined), 400);
    return () => clearTimeout(timer);
  }, [project, loaded]);

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
      loaded,
      onboarded,
      update: (change) => {
        dirty.current = true;
        setProject((current) => ({ ...change(current), updatedAt: new Date().toISOString() }));
      },
      finishOnboarding: () => {
        setOnboarded(true);
        void AsyncStorage.setItem(ONBOARDED_KEY, "1").catch(() => undefined);
      },
      restartOnboarding: () => {
        setOnboarded(false);
        void AsyncStorage.removeItem(ONBOARDED_KEY).catch(() => undefined);
      },
    }),
    [project, results, error, loaded, onboarded],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useProject must be used inside ProjectProvider");
  return value;
}
