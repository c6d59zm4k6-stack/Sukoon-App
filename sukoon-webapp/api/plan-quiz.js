// Vercel serverless function, scoped to the sukoon-webapp project (this
// file lives under sukoon-webapp/, whose Vercel Root Directory is
// sukoon-webapp — so this deploys as part of the webapp's own project,
// not the frozen root chat-app project. Needs its own GROQ_API_KEY set on
// the sukoon-webapp Vercel project's env vars.
//
// Pattern copied from the root project's api/groq-classify.js (a native
// Groq call, key kept server-side) rather than api/chat.js's fancier
// OpenRouter multi-model routing, which is overkill here.
import { buildSystemPrompt } from "../src/data/planQuizPrompt.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured." });
  }
  try {
    const { messages, profile } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const systemPrompt = buildSystemPrompt(profile || {});

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || ""),
          })),
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    const data = await groqResponse.json();
    if (!groqResponse.ok) {
      console.error("Groq API error:", data);
      return res.status(groqResponse.status).json({
        error: data?.error?.message || "Groq request failed.",
      });
    }
    const text = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (error) {
    console.error("plan-quiz server error:", error);
    return res.status(500).json({ error: "Unable to reach the AI service." });
  }
}
