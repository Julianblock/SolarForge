"use client";

import { useMemo, useState } from "react";
import {
  checkStrings,
  estimateFinance,
  estimateProduction,
  estimateShading,
  orientationAdvice,
  sizeArray,
  sizeBatteryBank,
} from "@solarforge/engine";
import { kwh, kw } from "@/lib/format";
import { Disclaimer, MonthBars } from "./visuals";

export function ToolPage({ slug, title, intro }: { slug: string; title: string; intro: string }) {
  const [latitude, setLatitude] = useState(39.74);
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(180);
  const [daily, setDaily] = useState(30);
  const [panelWatts, setPanelWatts] = useState(400);
  const [shading, setShading] = useState(0);
  const [cost, setCost] = useState(18000);
  const [rate, setRate] = useState(0.16);
  const [autonomy, setAutonomy] = useState(2);
  const [treeHeight, setTreeHeight] = useState(8);
  const [treeDistance, setTreeDistance] = useState(12);
  const [series, setSeries] = useState(10);

  const advice = orientationAdvice(latitude);
  const production = useMemo(() => {
    try {
      return estimateProduction({ latitudeDeg: latitude, tiltDeg: tilt, azimuthDeg: azimuth, arrayKw: 5, losses: { shading } });
    } catch {
      return null;
    }
  }, [latitude, tilt, azimuth, shading]);

  const sized = useMemo(() => {
    try {
      return sizeArray({ dailyAcKwh: daily, latitudeDeg: latitude, tiltDeg: tilt, azimuthDeg: azimuth, offsetFraction: 1, panelWatts, shading });
    } catch {
      return null;
    }
  }, [daily, latitude, tilt, azimuth, panelWatts, shading]);

  return (
    <article className="wrap section">
      <p className="kicker">Calculator</p>
      <h1 className="display">{title}</h1>
      <p className="lede">{intro}</p>
      <Disclaimer />
      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <form className="card fields" onSubmit={(event) => event.preventDefault()}>
          <label>Latitude<input type="number" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} /></label>
          {"solar-battery-calculator,off-grid-solar-calculator,solar-payback-calculator,solar-system-size-calculator,solar-calculator,solar-panel-cost-calculator".includes(slug) ? (
            <label>Daily use, kWh<input type="number" value={daily} onChange={(event) => setDaily(Number(event.target.value))} /></label>
          ) : null}
          <label>Tilt, degrees<input type="number" value={tilt} onChange={(event) => setTilt(Number(event.target.value))} /></label>
          <label>Azimuth, degrees clockwise from north<input type="number" value={azimuth} onChange={(event) => setAzimuth(Number(event.target.value))} /></label>
          <p className="muted">{advice.summary} Rule of thumb: {advice.preferredAzimuthDeg}° at {advice.ruleOfThumbTiltDeg}°.</p>
          {slug === "solar-shading-calculator" ? (
            <>
              <label>Tree height, m<input type="number" value={treeHeight} onChange={(event) => setTreeHeight(Number(event.target.value))} /></label>
              <label>Distance, m<input type="number" value={treeDistance} onChange={(event) => setTreeDistance(Number(event.target.value))} /></label>
            </>
          ) : null}
          {slug === "solar-inverter-calculator" ? (
            <label>Modules in series<input type="number" value={series} onChange={(event) => setSeries(Number(event.target.value))} /></label>
          ) : null}
          {slug === "solar-payback-calculator" || slug === "solar-panel-cost-calculator" ? (
            <>
              <label>Installed cost, USD<input type="number" value={cost} onChange={(event) => setCost(Number(event.target.value))} /></label>
              <label>Import rate, USD/kWh<input type="number" step="0.01" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label>
            </>
          ) : null}
          <label>Shading loss, fraction<input type="number" step="0.01" value={shading} onChange={(event) => setShading(Number(event.target.value))} /></label>
        </form>
        <div className="card fields">
          <Results slug={slug} production={production} sized={sized} latitude={latitude} longitude={-104.99} timezone={-6} treeHeight={treeHeight} treeDistance={treeDistance} azimuth={azimuth} series={series} cost={cost} rate={rate} daily={daily} autonomy={autonomy} setAutonomy={setAutonomy} tilt={tilt} />
        </div>
      </div>
    </article>
  );
}

function Results(props: {
  slug: string;
  production: ReturnType<typeof estimateProduction> | null;
  sized: ReturnType<typeof sizeArray> | null;
  latitude: number;
  longitude: number;
  timezone: number;
  treeHeight: number;
  treeDistance: number;
  azimuth: number;
  series: number;
  cost: number;
  rate: number;
  daily: number;
  autonomy: number;
  setAutonomy: (value: number) => void;
  tilt: number;
}) {
  if (!props.production || !props.sized) return <p>Enter values inside the allowed ranges.</p>;
  if (props.slug === "solar-panel-angle-calculator") {
    return (
      <>
        <h2>Annual kWh per installed kW</h2>
        <ul>
          {[0, 15, 30, 45].map((tilt) => {
            const row = estimateProduction({ latitudeDeg: props.latitude, tiltDeg: tilt, azimuthDeg: props.azimuth, arrayKw: 1 });
            return <li key={tilt}>{tilt}° tilt: {kwh(row.annualAcKwh)} / kW</li>;
          })}
        </ul>
      </>
    );
  }
  if (props.slug === "solar-shading-calculator") {
    const shade = estimateShading({
      latitudeDeg: props.latitude,
      longitudeDeg: props.longitude,
      timezoneOffsetHours: props.timezone,
      obstacles: [{ id: "tree", label: "Tree", kind: "tree", heightM: props.treeHeight, distanceM: props.treeDistance, azimuthDeg: props.azimuth, widthM: 6 }],
    });
    return (
      <>
        <p className="stat">{Math.round(shade.suggestedEnergyLossFraction * 100)}%<small>suggested energy loss</small></p>
        <p>{shade.notes.join(" ")}</p>
        <MonthBars values={shade.monthlyBlockedFraction.map((value) => value * 100)} labels={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]} />
      </>
    );
  }
  if (props.slug === "solar-inverter-calculator") {
    const check = checkStrings({
      module: { stcWatts: 400, vmpV: 31, impA: 12.9, vocV: 37.2, iscA: 13.7, betaVocPerC: -0.0028, betaVmpPerC: -0.0035, alphaIscPerC: 0.0005 },
      inverter: { ratedAcKw: 7.6, maxDcVoltageV: 500, mpptMinV: 200, mpptMaxV: 480, maxDcCurrentA: 20 },
      modulesInSeries: props.series,
      parallelStrings: 1,
      coldCellC: -10,
      hotCellC: 60,
    });
    return (
      <>
        <p className="chip">Sample module and sample inverter, not certified datasheets</p>
        <p>Cold Voc {check.coldVocV.toFixed(0)} V. Hot Vmp {check.hotVmpV.toFixed(0)} V. DC/AC {check.dcAcRatio.toFixed(2)}.</p>
        <ul>{check.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
      </>
    );
  }
  if (props.slug === "solar-battery-calculator" || props.slug === "off-grid-solar-calculator") {
    const bank = sizeBatteryBank({
      dailyAcKwh: props.daily,
      daysOfAutonomy: props.autonomy,
      inverterEfficiency: 0.95,
      busVoltageV: 51.2,
      module: { chemistry: "lifepo4", nominalVoltageV: 51.2, ampHours: 100, usableDepthOfDischarge: 0.9, dischargeEfficiency: 0.96, continuousDischargeKw: 5 },
    });
    return (
      <>
        <label>Days of autonomy<input type="number" value={props.autonomy} onChange={(event) => props.setAutonomy(Number(event.target.value))} /></label>
        <p className="stat">{bank.usableBankKwh.toFixed(1)} kWh<small>usable, from {bank.nominalBankKwh.toFixed(1)} kWh nominal</small></p>
        <p>{bank.seriesCount} series × {bank.parallelCount} parallel sample 51.2 V modules. {bank.assumptions[0]}</p>
        {props.slug === "off-grid-solar-calculator" ? <p>Array suggestion: {props.sized.panelCount} panels, {kw(props.sized.arrayKw)}. Size the array for the winter month before you rely on the annual total.</p> : null}
      </>
    );
  }
  if (props.slug === "solar-payback-calculator" || props.slug === "solar-panel-cost-calculator") {
    const finance = estimateFinance({
      installedCostUsd: props.cost,
      annualProductionKwh: props.sized.production.annualAcKwh,
      annualConsumptionKwh: props.daily * 365,
      importRateUsdPerKwh: props.rate,
      exportRateUsdPerKwh: 0,
    });
    return (
      <>
        {finance.scenarios.map((scenario) => (
          <p key={scenario.name}>{scenario.name}: first year ${scenario.firstYearSavingsUsd.toFixed(0)}, payback {scenario.simplePaybackYears?.toFixed(1) ?? "beyond 60 years"}, NPV ${scenario.netPresentValueUsd.toFixed(0)}.</p>
        ))}
        <p className="muted">{finance.assumptions[0]}</p>
      </>
    );
  }
  return (
    <>
      <p className="stat">{kwh(props.sized.production.annualAcKwh)}<small>AC from {props.sized.panelCount} × sample-size modules</small></p>
      <p>{kw(props.sized.arrayKw)} DC. Capacity factor {(props.sized.production.capacityFactor * 100).toFixed(1)}%. Residual annual use {kwh(props.sized.residualAcKwh)}.</p>
      <MonthBars values={props.sized.production.monthly.map((month) => month.acKwh)} labels={props.sized.production.monthly.map((month) => month.month)} />
    </>
  );
}
