// The AI questionnaire's output (see planQuizPrompt.js's <<<PLAN>>> contract)
// is much richer than a flat list of phases/actions, and isn't a 1:1 fit for
// the app's existing Plan-tab shape. This maps it deliberately rather than
// dumping the raw structure into the UI:
//
//   - plate + movement tips  -> "Lifestyle Foundations" phase actions
//   - tests + clinician tips -> "Medical Care & Supervision" phase actions
//   - timeline checkpoints   -> "Consistency & Tracking" phase actions
//
// That keeps the existing phases/ProgressRing machinery (Home's "Today's
// Plan" snippet, Plan's roadmap cards) working unchanged for AI-generated
// plans too. The fields with real structure worth keeping in full fidelity
// (profile classification, tagged tests, timeline) are kept as their own
// top-level fields as well, for the dedicated Plan-tab sections that render
// them properly instead of squashing them into plain text labels.

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function toActions(labels) {
  return (labels || []).map((label) => ({ id: nextId("action"), label, done: false }));
}

export function mapAiPlanToAppPlan(aiPlan) {
  const testActions = (aiPlan.tests || []).map((t) => `${t.name} — ${t.note}`);
  const clinicianActions = aiPlan.clinician || [];
  const timelineActions = (aiPlan.timeline || []).map((t) => `${t.when}: ${t.what}`);

  const phases = [
    {
      id: "lifestyle",
      title: "Lifestyle Foundations",
      status: "current",
      actions: toActions([...(aiPlan.plate || []), ...(aiPlan.movement || [])]),
    },
    {
      id: "medical",
      title: "Medical Care & Supervision",
      status: "upcoming",
      actions: toActions([...testActions, ...clinicianActions]),
    },
    {
      id: "consistency",
      title: "Consistency & Tracking",
      status: "upcoming",
      actions: toActions(timelineActions),
    },
  ];

  return {
    source: "ai",
    phases,
    typeProfile: aiPlan.profile || null,
    tests: aiPlan.tests || [],
    plateNote: aiPlan.plateNote || "",
    movementNote: aiPlan.movementNote || "",
    clinicianNote: aiPlan.clinicianNote || "",
    timeline: aiPlan.timeline || [],
  };
}

// Pulls the <<<PLAN>>>...<<<END_PLAN>>> JSON block out of a chat reply.
// Returns null if the reply doesn't contain a complete plan yet (the
// conversation is still in progress).
export function extractAiPlan(replyText) {
  if (!replyText.includes("<<<PLAN>>>") || !replyText.includes("<<<END_PLAN>>>")) return null;
  const jsonStr = replyText.split("<<<PLAN>>>")[1].split("<<<END_PLAN>>>")[0].trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function messageBeforePlan(replyText) {
  return replyText.split("<<<PLAN>>>")[0].trim();
}

// Pulls a "QUICK_REPLIES: A | B | C" line out of a reply (see
// planQuizPrompt.js) and returns the visible message with that line
// stripped, plus the parsed options (empty array if there was no line —
// the question needs a real typed answer instead).
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
