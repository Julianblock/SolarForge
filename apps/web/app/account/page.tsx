"use client";

import { useState } from "react";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message ?? "Done.");
  }

  return (
    <div className="wrap section">
      <h1 className="display">Account</h1>
      <p className="muted">Accounts need PostgreSQL and AUTH_SECRET. Until then, projects stay in this browser and this form will say the database is not configured.</p>
      <div className="card fields">
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary" type="button" onClick={() => void submit("/api/auth/register")}>Create account</button>
          <button className="btn btn-secondary" type="button" onClick={() => void submit("/api/auth/login")}>Sign in</button>
          <button className="btn btn-ghost" type="button" onClick={() => void submit("/api/auth/logout")}>Sign out</button>
        </div>
        {message ? <p className="banner">{message}</p> : null}
      </div>
    </div>
  );
}
