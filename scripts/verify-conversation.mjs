import { CANONICAL_SYSTEM_PROMPT, buildConversationPrompt } from "../conversation/prompt.js";
import { TEST_SCENARIOS } from "../conversation/test-scenarios.js";

const required = [
  "1. RESPOND TO WHAT THEY SAID",
  "17. NO MANUFACTURED METAPHORS",
  "FINAL CHECK",
  "Reply with your message only",
];

for (const text of required) {
  if (!CANONICAL_SYSTEM_PROMPT.includes(text)) {
    throw new Error(`Canonical prompt is missing: ${text}`);
  }
}

if (TEST_SCENARIOS.length < 5 || TEST_SCENARIOS.some((scenario) => !scenario.turns?.length)) {
  throw new Error("Conversation regression fixtures are incomplete.");
}

const runtimePrompt = buildConversationPrompt({
  memoryFacts: ["Work deadlines feel stressful."],
  scopeDirective: "Do not give medication advice.",
});

// buildConversationPrompt returns {static, dynamic}, not a string — checking
// .includes() on the object itself was always a TypeError, never a real check.
if (
  !runtimePrompt.dynamic.includes("Work deadlines feel stressful.") ||
  !runtimePrompt.dynamic.includes("Do not give medication advice.")
) {
  throw new Error("Runtime memory or safety context was not included.");
}

console.log(`Conversation checks passed: ${TEST_SCENARIOS.length} frozen scenarios available.`);
