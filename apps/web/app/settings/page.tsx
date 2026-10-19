"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { readPlan } from "@/lib/storage";
import { useState } from "react";

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function deleteAccount() {
    const response = await fetch("/api/account", { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message ?? "Account request finished.");
  }

  return (
    <div className="wrap section">
      <h1 className="display">Settings</h1>
      <p>Browser plan: {readPlan()}.</p>
      <ThemeToggle />
      <p className="muted">Theme is stored in this browser. Account deletion removes the signed-in user when the database is configured.</p>
      <button className="btn btn-secondary" type="button" onClick={() => void deleteAccount()}>Delete account</button>
      {message ? <p className="banner">{message}</p> : null}
    </div>
  );
}
