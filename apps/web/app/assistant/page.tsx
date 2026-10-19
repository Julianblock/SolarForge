"use client";

import { useEffect, useState } from "react";
import { answerProjectQuestion, evaluateProject, type SolarProject } from "@solarforge/shared";
import { readProjects } from "@/lib/storage";

const prompts = [
  "How many panels do I need?",
  "What's the best azimuth for my roof?",
  "Should I buy a 5 kW or 8 kW inverter?",
  "How big should my battery bank be?",
  "Why is my winter production lower?",
];

export default function AssistantPage() {
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState(prompts[0] ?? "");
  const [answer, setAnswer] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const saved = readProjects();
    setProjects(saved);
    setProjectId(saved[0]?.id ?? "");
  }, []);

  async function ask(text: string) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      setAnswer("Save a project first. The assistant reads that project and does not invent a site.");
      return;
    }
    const local = answerProjectQuestion(text, project, evaluateProject(project));
    setAnswer(local.answer);
    setNotes(local.assumptions);
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: text, project }),
    });
    if (response.ok) {
      const payload = (await response.json()) as { answer?: string; mode?: string };
      if (payload.answer && payload.mode === "openai") {
        setAnswer(payload.answer);
        setNotes(["The provider was asked to explain the engine results, not replace them.", ...local.assumptions]);
      }
    }
  }

  return (
    <div className="wrap section">
      <p className="kicker">Assistant</p>
      <h1 className="display">Ask about this project.</h1>
      <p className="muted">Without an OpenAI key, answers come from the calculation engine on this device. Wiring and permits are not certified.</p>
      {projects.length === 0 ? <p className="banner">No saved project yet.</p> : (
        <label>Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
      )}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "1rem 0" }}>
        {prompts.map((prompt) => (
          <button key={prompt} className="btn btn-secondary" type="button" onClick={() => { setQuestion(prompt); void ask(prompt); }}>{prompt}</button>
        ))}
      </div>
      <label>Question<textarea value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
      <button className="btn btn-primary" type="button" onClick={() => void ask(question)}>Ask</button>
      {answer ? <article className="card" style={{ marginTop: "1rem" }}><p>{answer}</p>{notes.map((note) => <p key={note} className="muted">{note}</p>)}</article> : null}
    </div>
  );
}
