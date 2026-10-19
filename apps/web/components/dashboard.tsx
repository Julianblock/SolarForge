"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { evaluateProject, type SolarProject } from "@solarforge/shared";
import { kwh, kw, usd } from "@/lib/format";
import { deleteProject, duplicateProject, readProjects } from "@/lib/storage";
import { Disclaimer, MonthBars } from "./visuals";

export function Dashboard() {
  const params = useSearchParams();
  const focus = params.get("project");
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => setProjects(readProjects()), []);

  if (projects.length === 0) {
    return (
      <div className="wrap section">
        <h1 className="display">No saved projects yet.</h1>
        <p className="muted">Projects stay in this browser until you create an account with the database running.</p>
        <Link className="btn btn-primary" href="/start">Start Designing — Free</Link>
      </div>
    );
  }

  return (
    <div className="wrap section">
      <p className="kicker">Dashboard</p>
      <h1 className="display">Your planning set.</h1>
      {message ? <p className="banner">{message}</p> : null}
      <div className="fields">
        {projects.map((project) => {
          let results: ReturnType<typeof evaluateProject> | null = null;
          try {
            results = evaluateProject(project);
          } catch {
            results = null;
          }
          return (
            <article key={project.id} className="card" style={focus === project.id ? { outline: "2px solid var(--sun)" } : undefined}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <h2>{project.name}</h2>
                <span className="chip">{project.location.label}</span>
              </div>
              {results ? (
                <>
                  <Disclaimer />
                  <div className="grid-3">
                    <p className="stat">{kw(results.arrayKw)}<small>DC capacity</small></p>
                    <p className="stat">{results.panelCount}<small>panels</small></p>
                    <p className="stat">{results.battery ? `${results.battery.usableBankKwh.toFixed(1)} kWh` : "—"}<small>usable battery</small></p>
                    <p className="stat">{kwh(results.array.production.annualAcKwh)}<small>annual AC</small></p>
                    <p className="stat">{Math.round(results.array.offsetFraction * 100)}%<small>annual offset</small></p>
                    <p className="stat">{usd(results.finance.scenarios[1]?.netCostUsd ?? 0)}<small>cost assumption</small></p>
                  </div>
                  <h3>Monthly generation</h3>
                  <MonthBars values={results.array.production.monthly.map((month) => month.acKwh)} labels={results.array.production.monthly.map((month) => month.month)} />
                  <p className="muted">Completion: location, usage, and array are set. {project.site.areaM2 ? "Area is entered." : "Area is still blank."} {results.battery ? "Battery is sized." : "Battery is off."}</p>
                </>
              ) : <p className="banner">This saved project could not be recalculated.</p>}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link className="btn btn-primary" href={`/report?project=${project.id}`}>Export report</Link>
                <Link className="btn btn-secondary" href="/design">Layout</Link>
                <button className="btn btn-secondary" type="button" onClick={() => {
                  const copy = duplicateProject(project.id);
                  setMessage(copy.ok ? "Duplicate saved." : copy.reason);
                  setProjects(readProjects());
                }}>Duplicate</button>
                <button className="btn btn-ghost" type="button" onClick={() => { deleteProject(project.id); setProjects(readProjects()); }}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
