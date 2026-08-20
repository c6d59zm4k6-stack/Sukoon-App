// Streaming counterpart to api/chat.js — used ONLY for the main/retry
// conversational reply (the one shown live in the chat, token by token).
// Everything else (classify, classifyFocus, classifyReadiness, evaluator,
// evaluator_audit, coder, memory, quick_replies) still goes through the
// existing non-streaming api/chat.js — those are short JSON verdicts with
// nothing to gain from streaming, so they're deliberately left untouched.
//
// Needs the Edge Runtime (not the default Node.js function) because that's
// what lets a Vercel Function return a live ReadableStream instead of
// buffering the whole response before sending it.
export const config = { runtime: "edge" };

const EXPLICIT_CACHE_MODELS = new Set([
  "qwen/qwen3-max", "qwen/qwen-plus", "qwen/qwen3.6-plus",
  "qwen/qwen3-coder-plus", "qwen/qwen3-coder-flash"
]);

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not configured." }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }

  const { system, messages, model, max_tokens, reasoning_effort, session_id, disable_thinking } = body || {};
  if (!system || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400 });
  }

  const modelId = model || "openai/gpt-oss-120b";
  const needsExplicitCache = modelId.startsWith("anthropic/") || EXPLICIT_CACHE_MODELS.has(modelId);
  // Same {static, dynamic} split as api/chat.js — only the static half ever
  // gets a cache breakpoint, kept identical so caching behaves the same way
  // it does for the non-streamed calls.
  const staticText = typeof system === "string" ? system : (system.static || "");
  const dynamicText = typeof system === "string" ? "" : (system.dynamic || "");
  let systemMessage;
  if (!needsExplicitCache) {
    systemMessage = { role: "system", content: dynamicText ? staticText + "\n\n" + dynamicText : staticText };
  } else {
    const blocks = [{ type: "text", text: staticText, cache_control: { type: "ephemeral" } }];
    if (dynamicText) blocks.push({ type: "text", text: dynamicText });
    systemMessage = { role: "system", content: blocks };
  }

  let upstream;
  try {
    upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://your-vercel-app-url.vercel.app",
        "X-Title": "Sukoon"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          systemMessage,
          ...messages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content || "")
          }))
        ],
        max_tokens: Math.min(Number(max_tokens) || 300, 800),
        temperature: 0.7,
        provider: { sort: "latency" },
        stream: true,
        // Main/retry are always plain text, never JSON mode — no response_format here.
        ...(disable_thinking ? { thinking: { type: "disabled" } } : {}),
        ...(session_id ? { session_id } : {}),
        ...(reasoning_effort ? { reasoning: { effort: reasoning_effort } } : {})
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unable to reach the AI service." }), { status: 500 });
  }

  if (!upstream.ok || !upstream.body) {
    let errText = "OpenRouter request failed.";
    try {
      const errJson = await upstream.json();
      errText = errJson?.error?.message || errText;
    } catch (e) {}
    return new Response(JSON.stringify({ error: errText }), { status: upstream.status || 500 });
  }

  // Re-parse OpenRouter's SSE ("data: {...}\n\n", terminated by "data: [DONE]")
  // and re-emit as newline-delimited JSON: {"delta":"..."} per chunk, then a
  // final {"done":true}. NDJSON instead of raw SSE so the client can just split
  // on "\n" — no separate SSE parser needed for a single, simple event shape.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let sseBuffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      let done, value;
      try {
        ({ done, value } = await reader.read());
      } catch (e) {
        controller.enqueue(encoder.encode(JSON.stringify({ done: true, error: "stream read failed" }) + "\n"));
        controller.close();
        return;
      }
      if (done) {
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
        controller.close();
        return;
      }
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop(); // keep any partial line for the next pull
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue; // the {done:true} above covers this
        try {
          const json = JSON.parse(payload);
          const delta = json?.choices?.[0]?.delta?.content || "";
          if (delta) controller.enqueue(encoder.encode(JSON.stringify({ delta }) + "\n"));
        } catch (e) {
          // Partial/malformed SSE line — next pull's buffer prepend will complete it.
        }
      }
    },
    cancel(reason) {
      // Client aborted (e.g. the live buffer check tripped) — stop pulling
      // from OpenRouter too instead of burning tokens nobody will see.
      try { reader.cancel(reason); } catch (e) {}
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }
  });
}
