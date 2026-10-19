"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APPLIANCE_TEMPLATES,
  evaluateProject,
  exampleProject,
  systemTypeLabels,
  systemTypes,
  type SolarProject,
} from "@solarforge/shared";
import { orientationAdvice } from "@solarforge/engine";
import { kwh, kw, usd } from "@/lib/format";
import { saveProject } from "@/lib/storage";
import { track } from "@/lib/track";
import { Compass, Disclaimer, MonthBars, SunPath } from "./visuals";

const SiteMap = dynamic(() => import("./site-map"), { ssr: false });
const steps = ["About", "System", "Location", "Site", "Usage", "Goals", "Array", "Results"];

export function ProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [project, setProject] = useState<SolarProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAppliances, setUseAppliances] = useState(false);

  useEffect(() => {
    const offset = -new Date().getTimezoneOffset() / 60;
    setProject(exampleProject({ location: { label: "Example coordinates — Denver, not your roof", latitudeDeg: 39.74, longitudeDeg: -104.99, timezoneOffsetHours: offset } }));
  }, []);

  const results = useMemo(() => (project ? safeEvaluate(project) : null), [project]);

  if (!project) return <p className="wrap">Preparing a draft…</p>;

  function update(patch: Partial<SolarProject>) {
    setProject({ ...project!, ...patch, updatedAt: new Date().toISOString() });
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("This browser did not provide geolocation. Enter coordinates instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const advice = orientationAdvice(position.coords.latitude);
        setProject((current) =>
          current
            ? {
                ...current,
                location: {
                  ...current.location,
                  label: "Device GPS",
                  latitudeDeg: Number(position.coords.latitude.toFixed(5)),
                  longitudeDeg: Number(position.coords.longitude.toFixed(5)),
                  elevationM: position.coords.altitude ?? undefined,
                  timezoneOffsetHours: -new Date().getTimezoneOffset() / 60,
                },
                array: { ...current.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg },
              }
            : current,
        );
        setError(null);
      },
      () => setError("Location permission was denied. Enter latitude and longitude instead."),
    );
  }

  function save() {
    const saved = saveProject(project!);
    if (!saved.ok) {
      setError(saved.reason);
      return;
    }
    track("project_saved", { system: project!.systemType });
    router.push(`/dashboard?project=${project!.id}`);
  }

  return (
    <div className="wrap section">
      <p className="kicker">New project</p>
      <h1 className="display">Tell SolarForge about the site.</h1>
      <p className="muted">Optional fields can be skipped. Numbers you skip stay labeled as estimates.</p>
      <ol style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: 0, listStyle: "none" }}>
        {steps.map((label, index) => (
          <li key={label}><button className={index === step ? "btn btn-primary" : "btn btn-secondary"} type="button" onClick={() => setStep(index)}>{label}</button></li>
        ))}
      </ol>
      {error ? <p className="banner">{error}</p> : null}
      <div className="card" style={{ marginTop: "1rem" }}>
        {step === 0 && (
          <div className="fields">
            <label>Project name<input value={project.name} onChange={(event) => update({ name: event.target.value })} /></label>
            <label>Experience
              <select value={project.experience} onChange={(event) => update({ experience: event.target.value as SolarProject["experience"] })}>
                <option value="beginner">Beginner — plain explanations</option>
                <option value="advanced">Advanced — engineering inputs stay visible</option>
              </select>
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="fields">
            <label>System type
              <select value={project.systemType} onChange={(event) => update({ systemType: event.target.value as SolarProject["systemType"] })}>
                {systemTypes.map((type) => <option key={type} value={type}>{systemTypeLabels[type]}</option>)}
              </select>
            </label>
            {project.experience === "beginner" ? <p className="muted">Grid-tied sends extra energy to the utility. Off-grid has to cover the dark days itself. Hybrid keeps a battery and a grid connection.</p> : null}
          </div>
        )}
        {step === 2 && (
          <div className="fields two">
            <label>Location label<input value={project.location.label} onChange={(event) => update({ location: { ...project.location, label: event.target.value } })} /></label>
            <label>Latitude<input type="number" value={project.location.latitudeDeg} onChange={(event) => update({ location: { ...project.location, latitudeDeg: Number(event.target.value) } })} /></label>
            <label>Longitude<input type="number" value={project.location.longitudeDeg} onChange={(event) => update({ location: { ...project.location, longitudeDeg: Number(event.target.value) } })} /></label>
            <label>Timezone offset, hours east of UTC<input type="number" value={project.location.timezoneOffsetHours} onChange={(event) => update({ location: { ...project.location, timezoneOffsetHours: Number(event.target.value) } })} /></label>
            <button className="btn btn-secondary" type="button" onClick={locate}>Use device GPS</button>
            <SiteMap
              latitude={project.location.latitudeDeg}
              longitude={project.location.longitudeDeg}
              onPick={(latitudeDeg, longitudeDeg) => update({ location: { ...project.location, label: "Map pin", latitudeDeg: Number(latitudeDeg.toFixed(5)), longitudeDeg: Number(longitudeDeg.toFixed(5)) } })}
            />
            <p className="muted">A pin is not a roof measurement. Elevation is stored only when the device provides it. One offset does not model a daylight-saving change by itself.</p>
          </div>
        )}
        {step === 3 && (
          <div className="fields two">
            <label>Mount
              <select value={project.site.mount} onChange={(event) => update({ site: { ...project.site, mount: event.target.value as SolarProject["site"]["mount"] } })}>
                <option value="roof">Roof</option>
                <option value="ground">Ground</option>
                <option value="rv">RV or van</option>
                <option value="unknown">Not sure yet</option>
              </select>
            </label>
            <label>Available area, m² (optional)<input type="number" placeholder="Skip if unknown" value={project.site.areaM2 ?? ""} onChange={(event) => update({ site: { ...project.site, areaM2: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label>Roof pitch, degrees (optional)<input type="number" value={project.site.roofPitchDeg ?? ""} onChange={(event) => update({ site: { ...project.site, roofPitchDeg: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label>Grid
              <select value={project.site.grid} onChange={(event) => update({ site: { ...project.site, grid: event.target.value as SolarProject["site"]["grid"] } })}>
                <option value="grid-tied">Grid-tied</option>
                <option value="hybrid">Hybrid</option>
                <option value="off-grid">Off-grid</option>
                <option value="unspecified">Unspecified</option>
              </select>
            </label>
            <label>Backup hours (optional)<input type="number" value={project.site.backupHours ?? ""} onChange={(event) => update({ site: { ...project.site, backupHours: event.target.value ? Number(event.target.value) : undefined } })} /></label>
          </div>
        )}
        {step === 4 && (
          <div className="fields">
            <label>Monthly kWh<input type="number" value={project.usage.monthlyKwh ?? ""} onChange={(event) => update({ usage: { ...project.usage, monthlyKwh: event.target.value ? Number(event.target.value) : undefined, annualKwh: undefined } })} /></label>
            <label>Or monthly bill, USD<input type="number" value={project.usage.monthlyBillUsd ?? ""} onChange={(event) => update({ usage: { ...project.usage, monthlyBillUsd: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label>Energy rate, USD per kWh<input type="number" step="0.01" value={project.usage.rateUsdPerKwh ?? 0.16} onChange={(event) => update({ usage: { ...project.usage, rateUsdPerKwh: Number(event.target.value) } })} /></label>
            <button className="btn btn-secondary" type="button" onClick={() => setUseAppliances((value) => !value)}>{useAppliances ? "Hide appliances" : "Add appliances"}</button>
            {useAppliances && APPLIANCE_TEMPLATES.map((template) => {
              const selected = project.usage.appliances.some((item) => item.id === template.id);
              return (
                <label key={template.id} style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
                  <input type="checkbox" checked={selected} onChange={(event) => {
                    const appliances = event.target.checked
                      ? [...project.usage.appliances, { ...template, quantity: 1 }]
                      : project.usage.appliances.filter((item) => item.id !== template.id);
                    update({ usage: { ...project.usage, appliances, monthlyKwh: undefined, annualKwh: undefined } });
                  }} />
                  {template.name} · {template.watts} W
                </label>
              );
            })}
            {project.experience === "beginner" ? <p className="muted">kWh is energy over time. A bill in dollars is only turned into kWh if the rate is just the energy charge.</p> : null}
          </div>
        )}
        {step === 5 && (
          <div className="fields two">
            <label>Annual offset, fraction<input type="number" step="0.05" value={project.goals.offsetFraction} onChange={(event) => update({ goals: { ...project.goals, offsetFraction: Number(event.target.value) } })} /></label>
            <label>Budget, USD (optional)<input type="number" value={project.goals.budgetUsd ?? ""} onChange={(event) => update({ goals: { ...project.goals, budgetUsd: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label>Autonomy days (optional)<input type="number" value={project.goals.autonomyDays ?? ""} onChange={(event) => update({ goals: { ...project.goals, autonomyDays: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
              <input type="checkbox" checked={Boolean(project.battery?.enabled)} onChange={(event) => update({
                battery: event.target.checked ? {
                  enabled: true,
                  chemistry: "lifepo4",
                  nominalVoltageV: 51.2,
                  ampHours: 100,
                  usableDepthOfDischarge: 0.9,
                  dischargeEfficiency: 0.96,
                  continuousDischargeKw: 5,
                  busVoltageV: 51.2,
                  inverterEfficiency: 0.95,
                  daysOfAutonomy: project.goals.autonomyDays || 1,
                  temperatureFactor: 1,
                } : undefined,
              })} />
              Size a sample LiFePO4 bank. The module numbers are illustrative, not a product listing.
            </label>
          </div>
        )}
        {step === 6 && (
          <div className="fields two">
            <Compass azimuth={project.array.azimuthDeg} onChange={(azimuthDeg) => update({ array: { ...project.array, azimuthDeg } })} />
            <div>
              <label>Azimuth {project.array.azimuthDeg}°<input type="range" min={0} max={359} value={project.array.azimuthDeg} onChange={(event) => update({ array: { ...project.array, azimuthDeg: Number(event.target.value) } })} /></label>
              <label>Tilt {project.array.tiltDeg}°<input type="range" min={0} max={60} value={project.array.tiltDeg} onChange={(event) => update({ array: { ...project.array, tiltDeg: Number(event.target.value) } })} /></label>
              <label>Module STC watts<input type="number" value={project.array.panelWatts} onChange={(event) => update({ array: { ...project.array, panelWatts: Number(event.target.value) } })} /></label>
              <button className="btn btn-secondary" type="button" onClick={() => {
                const advice = orientationAdvice(project.location.latitudeDeg);
                update({ array: { ...project.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg } });
              }}>Use equator-facing suggestion</button>
              <p className="muted">{results?.orientation.summary}</p>
            </div>
            <SunPath latitude={project.location.latitudeDeg} longitude={project.location.longitudeDeg} timezone={project.location.timezoneOffsetHours} />
          </div>
        )}
        {step === 7 && results && (
          <div className="fields">
            <Disclaimer />
            <div className="grid-3">
              <p className="stat">{results.panelCount}<small>modules</small></p>
              <p className="stat">{kw(results.arrayKw)}<small>DC nameplate</small></p>
              <p className="stat">{kwh(results.array.production.annualAcKwh)}<small>AC per year</small></p>
            </div>
            <MonthBars values={results.array.production.monthly.map((month) => month.acKwh)} labels={results.array.production.monthly.map((month) => month.month)} />
            <h3>Scenarios</h3>
            {results.scenarios.map((scenario) => (
              <p key={scenario.id}><strong>{scenario.title}.</strong> {scenario.description} {scenario.array.panelCount} panels, {kwh(scenario.array.production.annualAcKwh)} / year{scenario.battery ? `, battery ${scenario.battery.usableBankKwh.toFixed(1)} kWh usable` : ""}.</p>
            ))}
            <p>Medium payback: {results.finance.scenarios[1]?.simplePaybackYears?.toFixed(1) ?? "not paid back in the model"} years. Placeholder installed cost {usd(results.finance.scenarios[1]?.netCostUsd ?? 0)}.</p>
            <button className="btn btn-primary" type="button" onClick={save}>Save project</button>
          </div>
        )}
        {step === 7 && !results ? <p className="banner">The draft has a number the model cannot use yet. Check latitude, usage, and tilt.</p> : null}
      </div>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <button className="btn btn-secondary" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</button>
        {step < steps.length - 1 ? <button className="btn btn-primary" type="button" onClick={() => { track("wizard_step", { step: steps[step + 1] ?? "" }); setStep((value) => value + 1); }}>Continue</button> : null}
      </div>
    </div>
  );
}

function safeEvaluate(project: SolarProject) {
  try {
    return evaluateProject(project);
  } catch {
    return null;
  }
}
