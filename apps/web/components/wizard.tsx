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
const steps = [
  "Name this plan",
  "What kind of system",
  "Where is the house",
  "Roof or ground",
  "Your power bill",
  "What you want",
  "Which way the panels face",
  "Your estimate",
];

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
      <p className="kicker">Step {step + 1} of {steps.length}</p>
      <h1 className="display">{steps[step]}</h1>
      <p className="muted">One page at a time. Skip anything you do not know. Every number is an estimate until a local installer checks it.</p>
      <label>
        Jump to another step
        <select value={step} onChange={(event) => setStep(Number(event.target.value))}>
          {steps.map((label, index) => (
            <option key={label} value={index}>{index + 1}. {label}</option>
          ))}
        </select>
      </label>
      {error ? <p className="banner">{error}</p> : null}
      <div className="card" style={{ marginTop: "1rem" }}>
        {step === 0 && (
          <div className="fields">
            <label>Name this plan<span className="hint">For example, “Main house.” You can change it later.</span><input value={project.name} onChange={(event) => update({ name: event.target.value })} /></label>
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
            <label>Kilowatt-hours on the bill<span className="hint">Look for kWh. That is energy used, not the dollar amount.</span><input type="number" value={project.usage.monthlyKwh ?? ""} onChange={(event) => update({ usage: { ...project.usage, monthlyKwh: event.target.value ? Number(event.target.value) : undefined, annualKwh: undefined } })} /></label>
            <label>Or the monthly bill in dollars<span className="hint">Use this if you cannot find the kilowatt-hours.</span><input type="number" value={project.usage.monthlyBillUsd ?? ""} onChange={(event) => update({ usage: { ...project.usage, monthlyBillUsd: event.target.value ? Number(event.target.value) : undefined } })} /></label>
            <label>What you pay per kilowatt-hour<span className="hint">Often around 10 to 30 cents. 0.16 means 16 cents.</span><input type="number" step="0.01" value={project.usage.rateUsdPerKwh ?? 0.16} onChange={(event) => update({ usage: { ...project.usage, rateUsdPerKwh: Number(event.target.value) } })} /></label>
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
              <label>Direction {project.array.azimuthDeg}°<span className="hint">0 is north, 90 is east, 180 is south, 270 is west.</span><input type="range" min={0} max={359} value={project.array.azimuthDeg} onChange={(event) => update({ array: { ...project.array, azimuthDeg: Number(event.target.value) } })} /></label>
              <label>Slope {project.array.tiltDeg}°<span className="hint">0 is flat. A house roof is often about 20 to 30.</span><input type="range" min={0} max={60} value={project.array.tiltDeg} onChange={(event) => update({ array: { ...project.array, tiltDeg: Number(event.target.value) } })} /></label>
              <label>Watts of one panel<span className="hint">A common panel is about 400 watts. Bigger panels are not always better if the roof is small.</span><input type="number" value={project.array.panelWatts} onChange={(event) => update({ array: { ...project.array, panelWatts: Number(event.target.value) } })} /></label>
              <button className="btn btn-secondary" type="button" onClick={() => {
                const advice = orientationAdvice(project.location.latitudeDeg);
                update({ array: { ...project.array, azimuthDeg: advice.preferredAzimuthDeg, tiltDeg: advice.ruleOfThumbTiltDeg } });
              }}>Point the panels toward the sun</button>
              <p className="muted">{results?.orientation.summary}</p>
            </div>
            <SunPath latitude={project.location.latitudeDeg} longitude={project.location.longitudeDeg} timezone={project.location.timezoneOffsetHours} />
          </div>
        )}
        {step === 7 && results && (
          <div className="fields">
            <Disclaimer />
            <div className="grid-3">
              <p className="stat">{results.panelCount}<small>solar panels</small></p>
              <p className="stat">{kw(results.arrayKw)}<small>how big the system is</small></p>
              <p className="stat">{kwh(results.array.production.annualAcKwh)}<small>electricity it might make in a year</small></p>
            </div>
            <MonthBars values={results.array.production.monthly.map((month) => month.acKwh)} labels={results.array.production.monthly.map((month) => month.month)} />
            <h3>Five ways to build it</h3>
            {results.scenarios.map((scenario) => (
              <p key={scenario.id}><strong>{scenario.title}.</strong> {scenario.description} {scenario.array.panelCount} panels, {kwh(scenario.array.production.annualAcKwh)} / year{scenario.battery ? `, battery ${scenario.battery.usableBankKwh.toFixed(1)} kWh usable` : ""}.</p>
            ))}
            <p>{middleYears(results.finance.scenarios[1]?.simplePaybackYears)} The price used here is a placeholder of {usd(results.finance.scenarios[1]?.netCostUsd ?? 0)}, not a quote from an installer.</p>
            <button className="btn btn-primary" type="button" onClick={save}>Save project</button>
          </div>
        )}
        {step === 7 && !results ? <p className="banner">The draft has a number the model cannot use yet. Check latitude, usage, and tilt.</p> : null}
      </div>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <button className="btn btn-secondary" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</button>
        {step < steps.length - 1 ? <button className="btn btn-primary" type="button" onClick={() => { track("wizard_step", { step: steps[step + 1] ?? "" }); setStep((value) => value + 1); }}>Next step</button> : null}
      </div>
    </div>
  );
}

function middleYears(years: number | null | undefined) {
  if (years == null) return "A middle guess does not pay for itself within 60 years in this model.";
  return `A middle guess pays for itself in about ${years.toFixed(1)} years.`;
}

function safeEvaluate(project: SolarProject) {
  try {
    return evaluateProject(project);
  } catch {
    return null;
  }
}
