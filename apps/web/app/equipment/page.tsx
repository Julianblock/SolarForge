"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS, SAMPLE_CATALOG, type CatalogItem, type EquipmentCategory } from "@solarforge/shared";

const KEY = "solarforge.custom-equipment";

export default function EquipmentPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EquipmentCategory | "all">("all");
  const [custom, setCustom] = useState<CatalogItem[]>([]);
  const [model, setModel] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    try {
      setCustom(JSON.parse(raw) as CatalogItem[]);
    } catch {
      setCustom([]);
    }
  }, []);

  const items = [...SAMPLE_CATALOG, ...custom].filter((item) => {
    const haystack = `${item.manufacturer} ${item.model} ${item.summary}`.toLowerCase();
    return (category === "all" || item.category === category) && haystack.includes(query.toLowerCase());
  });

  function addCustom() {
    if (!model.trim()) return;
    const next: CatalogItem = {
      id: crypto.randomUUID(),
      category: category === "all" ? "panel" : category,
      verified: false,
      sample: true,
      manufacturer: "Your note",
      model: model.trim(),
      summary: "Entered by you. SolarForge has not verified this row.",
      specs: { Status: "Unverified user entry" },
    };
    const stored = [next, ...custom];
    setCustom(stored);
    window.localStorage.setItem(KEY, JSON.stringify(stored));
    setModel("");
  }

  return (
    <div className="wrap section">
      <p className="kicker">Catalog</p>
      <h1 className="display">Equipment notes</h1>
      <p className="banner">The built-in rows are a sample catalog for development. They are not manufacturer-certified specifications.</p>
      <div className="fields two" style={{ margin: "1rem 0" }}>
        <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Category
          <select value={category} onChange={(event) => setCategory(event.target.value as EquipmentCategory | "all")}>
            <option value="all">All</option>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <label>Add your own unverified model<input value={model} onChange={(event) => setModel(event.target.value)} /></label>
        <button className="btn btn-secondary" type="button" onClick={addCustom}>Save to this browser</button>
      </div>
      <div className="grid-2">
        {items.map((item) => (
          <article key={item.id} className="card">
            <p className="chip">{item.sample ? "Sample / unverified" : "Verified"}</p>
            <h2>{item.model}</h2>
            <p className="muted">{CATEGORY_LABELS[item.category]} · {item.manufacturer}</p>
            <p>{item.summary}</p>
            <table>
              <tbody>
                {Object.entries(item.specs).map(([key, value]) => (
                  <tr key={key}><th>{key}</th><td>{value}</td></tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </div>
  );
}
