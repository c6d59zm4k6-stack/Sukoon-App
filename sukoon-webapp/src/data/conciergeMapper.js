// Parses the AI concierge's replies — a "QUICK_REPLIES: A | B | C" line
// (same convention as planQuizPrompt.js) and a <<<RECOMMENDATION>>> JSON
// block once enough has been asked.

export function extractQuickReplies(replyText) {
  const lines = replyText.split("\n");
  const markerIndex = lines.findIndex((l) => l.trim().startsWith("QUICK_REPLIES:"));
  if (markerIndex === -1) return { text: replyText, options: [] };
  const options = lines[markerIndex]
    .trim()
    .slice("QUICK_REPLIES:".length)
    .split("|")
    .map((o) => o.trim())
    .filter(Boolean);
  const text = lines.filter((_, i) => i !== markerIndex).join("\n").trim();
  return { text, options };
}

export function extractRecommendation(replyText) {
  if (!replyText.includes("<<<RECOMMENDATION>>>") || !replyText.includes("<<<END_RECOMMENDATION>>>")) return null;
  const jsonStr = replyText.split("<<<RECOMMENDATION>>>")[1].split("<<<END_RECOMMENDATION>>>")[0].trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function messageBeforeRecommendation(replyText) {
  return replyText.split("<<<RECOMMENDATION>>>")[0].trim();
}
