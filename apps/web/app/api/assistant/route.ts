import { answerProjectQuestion, evaluateProject, projectSchema } from "@solarforge/shared";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`assistant:${request.headers.get("x-forwarded-for") ?? "local"}`, 20)) {
    return Response.json({ message: "Too many questions." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { question?: string; project?: unknown } | null;
  const project = projectSchema.safeParse(body?.project);
  if (!project.success || !body?.question) return Response.json({ message: "Send a question and a project." }, { status: 400 });
  const local = answerProjectQuestion(body.question, project.data, evaluateProject(project.data));
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ mode: "engine", answer: local.answer, assumptions: local.assumptions });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Explain the SolarForge calculation results. Do not invent measurements or replace the numbers. If the question is about wiring, structure, or permits, say a qualified person must verify them.",
        },
        { role: "user", content: `${body.question}\n\nEngine answer:\n${local.answer}\n\nAssumptions:\n${local.assumptions.join("\n")}` },
      ],
    }),
  });
  if (!response.ok) return Response.json({ mode: "engine", answer: local.answer, assumptions: local.assumptions });
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return Response.json({ mode: "openai", answer: payload.choices?.[0]?.message?.content || local.answer, assumptions: local.assumptions });
}
