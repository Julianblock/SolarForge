"use client";

import { useEffect, useState } from "react";
import { evaluateProject, type SolarProject } from "@solarforge/shared";
import { buildTextPdf } from "@/lib/pdf";
import { kwh, usd } from "@/lib/format";
import { readProjects } from "@/lib/storage";
import { Disclaimer } from "./visuals";

export function ReportView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<SolarProject | null>(null);

  useEffect(() => {
    setProject(readProjects().find((item) => item.id === projectId) ?? null);
  }, [projectId]);

  if (!project) return <p className="wrap section">That project is not saved in this browser.</p>;
  const results = evaluateProject(project);
  const medium = results.finance.scenarios.find((scenario) => scenario.name === "medium");
  const lines = [
    "PRELIMINARY ESTIMATE — NOT AN ENGINEERING-CERTIFIED PLAN",
    project.name,
    project.location.label,
    `Latitude ${project.location.latitudeDeg}, longitude ${project.location.longitudeDeg}`,
    `Azimuth ${project.array.azimuthDeg} degrees clockwise from true north`,
    `Tilt ${project.array.tiltDeg} degrees`,
    `Panels ${results.panelCount} at ${project.array.panelWatts} W`,
    `DC nameplate ${results.arrayKw.toFixed(2)} kW`,
    `Annual AC ${results.array.production.annualAcKwh.toFixed(0)} kWh`,
    `Annual offset ${(results.array.offsetFraction * 100).toFixed(0)} percent`,
    results.battery ? `Battery nominal ${results.battery.nominalBankKwh.toFixed(1)} kWh, usable ${results.battery.usableBankKwh.toFixed(1)} kWh` : "No battery enabled",
    medium ? `Medium net cost ${medium.netCostUsd.toFixed(0)} USD, simple payback ${medium.simplePaybackYears?.toFixed(1) ?? "n/a"} years` : "",
    "",
    "Assumptions",
    ...results.assumptions,
  ];

  function download() {
    const bytes = buildTextPdf("SolarForge planning report", lines);
    const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${project!.name.replace(/\s+/g, "-").toLowerCase()}-preliminary.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="wrap section">
      <p className="kicker">Report</p>
      <h1 className="display">{project.name}</h1>
      <Disclaimer />
      <div className="no-print" style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
        <button className="btn btn-primary" type="button" onClick={download}>Download PDF</button>
        <button className="btn btn-secondary" type="button" onClick={() => window.print()}>Print</button>
      </div>
      <div className="card">
        {lines.filter(Boolean).map((line) => <p key={line}>{line.startsWith("Annual AC") ? kwh(results.array.production.annualAcKwh) + " estimated AC" : line.startsWith("Medium") && medium ? `Medium case ${usd(medium.netCostUsd)} net, payback ${medium.simplePaybackYears?.toFixed(1) ?? "n/a"} years` : line}</p>)}
      </div>
    </article>
  );
}
