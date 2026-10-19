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
        <h1 className="display">No saved plans yet.</h1>
        <p className="muted">A plan stays in this browser until you create an account. Start with one house. It is free.</p>
        <Link className="btn btn-primary" href="/start">Start Designing — Free</Link>
      </div>
    );
  }

  return (
    <div className="wrap section">
      <p className="kicker">Saved on this browser</p>
      <h1 className="display">Your plans</h1>
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
                    <p className="stat">{kw(results.arrayKw)}<small>system size</small></p>
                    <p className="stat">{results.panelCount}<small>solar panels</small></p>
                    <p className="stat">{results.battery ? `${results.battery.usableBankKwh.toFixed(1)} kWh` : "None"}<small>battery you can actually use</small></p>
                    <p className="stat">{kwh(results.array.production.annualAcKwh)}<small>electricity per year</small></p>
                    <p className="stat">{Math.round(results.array.offsetFraction * 100)}%<small>of the yearly bill this might cover</small></p>
                    <p className="stat">{usd(results.finance.scenarios[1]?.netCostUsd ?? 0)}<small>rough cost, not a quote</small></p>
                  </div>
                  <h3>Electricity by month</h3>
                  <MonthBars values={results.array.production.monthly.map((month) => month.acKwh)} labels={results.array.production.monthly.map((month) => month.month)} />
                  <p className="muted">This plan has a place, a power bill, and a panel direction. {project.site.areaM2 ? "Roof area is filled in." : "Roof area is still blank, which is fine."} {results.battery ? "A battery is included." : "No battery yet."}</p>
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
