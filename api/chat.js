export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured." });
  }
  try {
    const { system, messages, model, max_tokens, plain_text, reasoning_effort, session_id, disable_thinking } = req.body || {};
    if (!system || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request." });
    }
    const modelId = model || "openai/gpt-oss-120b";
    // Only models OpenRouter has actually confirmed support explicit cache_control.
    // Anthropic: all Claude routes. Alibaba/Qwen: only qwen3-max, qwen-plus,
    // qwen3.6-plus, and the coder variants — NOT qwen3.8-2.4t-a95b, which isn't on
    // their supported list. Everyone else on our roster (DeepSeek, Kimi, GLM, Grok)
    // caches automatically and should never receive a cache_control marker.
    const EXPLICIT_CACHE_MODELS = new Set([
      "qwen/qwen3-max", "qwen/qwen-plus", "qwen/qwen3.6-plus",
      "qwen/qwen3-coder-plus", "qwen/qwen3-coder-flash"
    ]);
    const needsExplicitCache = modelId.startsWith("anthropic/") || EXPLICIT_CACHE_MODELS.has(modelId);
    // `system` is either a plain string (classify/evaluator/coder/memory calls —
    // already 100% static, nothing to split) or a {static, dynamic} object (main/
    // retry calls, built by conversation/prompt.js). Only the static half ever gets
    // a cache breakpoint; the dynamic half (memory, scope directives) is appended
    // uncached so a changing tail never breaks the match on the static prefix.
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
    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
        // DeepSeek V4 defaults to thinking mode ON and rejects reasoning_effort:"none" —
        // it needs this differently-shaped field to actually turn thinking off.
        ...(disable_thinking ? { thinking: { type: "disabled" } } : {}),
        // Keeps repeat calls in the same conversation routed to the same provider
        // endpoint, which is what actually keeps a cache warm across calls.
        ...(session_id ? { session_id } : {}),
        ...(plain_text ? {} : { response_format: { type: "json_object" } }),
        ...(reasoning_effort ? { reasoning: { effort: reasoning_effort } } : {})
      })
    });
    const data = await openrouterResponse.json();
    if (!openrouterResponse.ok) {
      console.error("OpenRouter API error:", data);
      const retryAfter = openrouterResponse.headers.get("retry-after");
      return res.status(openrouterResponse.status).json({
        error: data?.error?.message || "OpenRouter request failed.",
        retryAfter: retryAfter ? Number(retryAfter) : null
      });
    }
    if (data?.usage) console.log("[Sukoon] usage:", modelId, data.usage);
    const text = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Unable to reach the AI service." });
  }
}
