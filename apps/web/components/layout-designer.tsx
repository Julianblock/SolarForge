"use client";

import { useMemo, useState } from "react";
import { Disclaimer } from "./visuals";

interface Panel {
  id: string;
  x: number;
  y: number;
}

interface Obstacle {
  id: string;
  kind: "vent" | "skylight" | "chimney" | "exclusion";
  x: number;
  y: number;
  w: number;
  h: number;
}

const panelSize = { portrait: { w: 1.13, h: 1.72 }, landscape: { w: 1.72, h: 1.13 } };

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function LayoutDesigner() {
  const [width, setWidth] = useState(8);
  const [length, setLength] = useState(5);
  const [portrait, setPortrait] = useState(true);
  const [spacing, setSpacing] = useState(0.02);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [history, setHistory] = useState<Panel[][]>([]);
  const [future, setFuture] = useState<Panel[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const size = portrait ? panelSize.portrait : panelSize.landscape;

  function commit(next: Panel[]) {
    setHistory((stack) => [...stack, panels]);
    setFuture([]);
    setPanels(next);
  }

  function addPanel() {
    const candidate = { id: crypto.randomUUID(), x: 0.2, y: 0.2 };
    const box = { ...candidate, w: size.w, h: size.h };
    const blocked = panels.some((panel) => overlaps(box, { ...panel, w: size.w + spacing, h: size.h + spacing })) || obstacles.some((item) => overlaps(box, item));
    if (box.x + box.w > width || box.y + box.h > length || blocked) {
      setMessage("The next module does not fit in the open corner. Drag existing modules, or enlarge the measured roof.");
      return;
    }
    commit([...panels, candidate]);
    setMessage(null);
  }

  function onPointer(id: string, event: React.PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const start = svg.createSVGPoint();
    start.x = event.clientX;
    start.y = event.clientY;
    const cursor = start.matrixTransform(svg.getScreenCTM()?.inverse());
    const panel = panels.find((item) => item.id === id);
    if (!panel) return;
    const origin = { ...panel };
    function move(ev: PointerEvent) {
      const point = svg!.createSVGPoint();
      point.x = ev.clientX;
      point.y = ev.clientY;
      const local = point.matrixTransform(svg!.getScreenCTM()?.inverse());
      const snap = 0.05;
      const x = Math.round(Math.min(width - size.w, Math.max(0, origin.x + (local.x - cursor.x) / zoom)) / snap) * snap;
      const y = Math.round(Math.min(length - size.h, Math.max(0, origin.y + (local.y - cursor.y) / zoom)) / snap) * snap;
      const box = { x, y, w: size.w, h: size.h };
      const hit = panels.some((item) => item.id !== id && overlaps(box, { ...item, w: size.w + spacing, h: size.h + spacing }));
      const obstacleHit = obstacles.some((item) => overlaps(box, item));
      if (!hit && !obstacleHit) setPanels((current) => current.map((item) => (item.id === id ? { ...item, x, y } : item)));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setPanels((current) => {
        setHistory((stack) => [...stack, panels]);
        return current;
      });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const watts = panels.length * 400;
  const footprint = panels.length * size.w * size.h;
  const scale = 80 * zoom;
  const collisions = useMemo(() => {
    return panels.some((panel, index) => panels.slice(index + 1).some((other) => overlaps({ ...panel, w: size.w, h: size.h }, { ...other, w: size.w, h: size.h })));
  }, [panels, size.h, size.w]);

  return (
    <div className="wrap section">
      <p className="kicker">Layout</p>
      <h1 className="display">Draw the roof you measured.</h1>
      <Disclaimer>Type the width and length you measured with a tape. A photo or a map is not a measurement, and this drawing is not a permit.</Disclaimer>
      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <div className="card fields">
          <label>Roof width, m<input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label>
          <label>Slope length, m<input type="number" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label>
          <label>Spacing, m<input type="number" step="0.01" value={spacing} onChange={(event) => setSpacing(Number(event.target.value))} /></label>
          <label>Arrangement
            <select value={portrait ? "portrait" : "landscape"} onChange={(event) => setPortrait(event.target.value === "portrait")}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="button" onClick={addPanel}>Add panel</button>
            <button className="btn btn-secondary" type="button" onClick={() => setObstacles((items) => [...items, { id: crypto.randomUUID(), kind: "vent", x: 2, y: 2, w: 0.4, h: 0.4 }])}>Add vent</button>
            <button className="btn btn-secondary" type="button" disabled={history.length === 0} onClick={() => { const previous = history[history.length - 1]; if (!previous) return; setFuture((stack) => [panels, ...stack]); setHistory((stack) => stack.slice(0, -1)); setPanels(previous); }}>Undo</button>
            <button className="btn btn-secondary" type="button" disabled={future.length === 0} onClick={() => { const next = future[0]; if (!next) return; setHistory((stack) => [...stack, panels]); setFuture((stack) => stack.slice(1)); setPanels(next); }}>Redo</button>
            <button className="btn btn-ghost" type="button" onClick={() => setZoom((value) => Math.min(2.4, value + 0.2))}>Zoom in</button>
            <button className="btn btn-ghost" type="button" onClick={() => setZoom((value) => Math.max(0.6, value - 0.2))}>Zoom out</button>
          </div>
          {message ? <p className="banner">{message}</p> : null}
          {collisions ? <p className="banner">Modules overlap. Move them apart before treating the count as usable.</p> : null}
          <p>{panels.length} modules · {(watts / 1000).toFixed(2)} kW DC if each is the 400 W sample · footprint {footprint.toFixed(1)} m² · roof {width * length} m²</p>
          <p className="muted">Drag a module. It snaps to 5 cm and stops at another module or an obstacle. Sample wattage is not a product you can buy from this screen.</p>
        </div>
        <div className="card" style={{ overflow: "auto" }}>
          <svg width={width * scale + 20} height={length * scale + 20} role="img" aria-label="Roof plan">
            <rect x="10" y="10" width={width * scale} height={length * scale} fill="#102033" stroke="#f5b942" />
            {obstacles.map((item) => (
              <rect key={item.id} x={10 + item.x * scale} y={10 + item.y * scale} width={item.w * scale} height={item.h * scale} fill="#ef6b6b" opacity="0.8" />
            ))}
            {panels.map((panel) => (
              <rect key={panel.id} x={10 + panel.x * scale} y={10 + panel.y * scale} width={size.w * scale} height={size.h * scale} fill="#f5b942" stroke="#1b1406" style={{ cursor: "grab" }} onPointerDown={(event) => onPointer(panel.id, event)} />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
