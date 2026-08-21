// Vercel serverless function, scoped to the sukoon-webapp project — same
// pattern as api/plan-quiz.js (native Groq call, key server-side only).
import { buildConciergeSystemPrompt } from "../src/data/doctorConciergePrompt.js";

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

    const systemPrompt = buildConciergeSystemPrompt(profile || {});

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || ""),
          })),
        ],
        max_tokens: 900,
        temperature: 0.6,
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
    console.error("doctor-concierge server error:", error);
    return res.status(500).json({ error: "Unable to reach the AI service." });
  }
}
