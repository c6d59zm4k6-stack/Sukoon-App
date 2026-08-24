// Ported from the root chat app's index.html inline script (the original,
// frozen "Sukoon" companion). This file is the non-React half of that port:
// all state/logic, no DOM, no React. Companion.jsx + useCompanionEngine.js
// are the rendering/binding half. Ported near line-for-line on purpose —
// this is a hand-tuned, safety-relevant state machine (crisis detection,
// motivational-interviewing move selection, self-evaluation, MITI coaching
// scoring), not incidental UI glue, so fidelity to the original statement
// order matters more than "clean" restructuring.
//
// One addition not in the original: buildUserContextBlock() feeds the
// person's existing plan + tracking history (from Supabase) into the prompt
// via companionPrompt.js's designed userContext extension point.
import { buildConversationPrompt, SPECIFIC_QUESTION_SYSTEM_PROMPT } from "../data/companionPrompt.js";
import { summarizePlan, summarizeTracking } from "../data/profileContext.js";

// ---- Model selection (plumbing kept, no UI — see Companion.jsx notes) ----
const MODEL_OPTIONS = [
  { id: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5", reasoning: null },
  { id: "qwen/qwen3.8-2.4t-a95b", label: "Qwen3.8 2.4T A95B", reasoning: "low" },
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", reasoning: null, disableThinking: true },
  { id: "z-ai/glm-5.2", label: "GLM-5.2", reasoning: null },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", reasoning: null, disableThinking: true },
  { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6", reasoning: null },
  { id: "moonshotai/kimi-k3", label: "Kimi K3", reasoning: "low" },
  { id: "qwen/qwen3.6-plus", label: "Qwen3.6 Plus", reasoning: null },
  { id: "anthropic/claude-opus-4.8", label: "Claude Opus 4.8", reasoning: null },
  { id: "x-ai/grok-4.6", label: "Grok 4.6", reasoning: null },
];
function loadSelectedModel() { try { return localStorage.getItem("sukoon_model") || MODEL_OPTIONS[0].id; } catch (e) { return MODEL_OPTIONS[0].id; } }
function saveSelectedModel(id) { try { localStorage.setItem("sukoon_model", id); } catch (e) {} }
function currentModelConfig(state) { return MODEL_OPTIONS.find((m) => m.id === state.selectedModel) || MODEL_OPTIONS[0]; }

const HISTORY_WINDOW = 16;

const ACTIVITIES = [
  { id: "sleep_hygiene", category: "sleep", title: "Sleep hygiene reset", duration: "5 min read", desc: "A few small habit shifts that make falling asleep easier." },
  { id: "stimulus_control", category: "sleep", title: "Stimulus control basics", duration: "5 min", desc: "Re-teaching your bed to mean 'sleep', not 'lying awake'." },
  { id: "winddown_breath", category: "sleep", title: "Wind-down breathing", duration: "4 min audio", desc: "A slow breathing pattern to settle the body before bed." },
  { id: "small_pleasant", category: "mood", title: "One small pleasant thing", duration: "10 min", desc: "A tiny, doable activity just for the enjoyment of it." },
  { id: "small_win", category: "mood", title: "One small win", duration: "10 min", desc: "A tiny task that gives a real sense of finishing something." },
  { id: "worry_dump", category: "anxiety", title: "Worry dump", duration: "5 min", desc: "Getting the looping worries out of your head and onto paper." },
  { id: "worry_cycle", category: "anxiety", title: "Naming the worry cycle", duration: "6 min read", desc: "Seeing the pattern that keeps worry feeding itself." },
  { id: "slow_breath_reset", category: "panic", title: "Slow breath reset", duration: "3 min audio", desc: "A short breathing exercise for when panic spikes." },
  { id: "ground_yourself", category: "panic", title: "Ground yourself", duration: "3 min", desc: "Using your senses to come back into the room." },
  { id: "three_step_problem_solving", category: "stress", title: "Problem-solving in 3 steps", duration: "8 min", desc: "Clarify, brainstorm, pick one small next step." },
  { id: "boundary_checkin", category: "stress", title: "Boundary check-in", duration: "6 min", desc: "A short reflection on where you need to say no." },
  { id: "i_statement", category: "relationships", title: "Try an I-statement", duration: "5 min", desc: "A simple way to say a hard thing without it turning into a fight." },
];
const CATEGORY_KEYWORDS = {
  sleep: ["sleep", "insomnia", "cant sleep", "can't sleep", "awake at night", "tired all day", "wide awake"],
  mood: ["sad", "low mood", "down", "depress", "hopeless", "empty", "numb", "no motivation"],
  anxiety: ["anxious", "anxiety", "worry", "worried", "nervous", "overthinking", "racing thoughts"],
  panic: ["panic", "panic attack", "cant breathe", "can't breathe", "heart racing", "chest tight"],
  stress: ["stress", "overwhelmed", "burnt out", "burnout", "deadline", "too much to do"],
  relationships: ["relationship", "partner", "fight", "argument", "family conflict", "breakup", "boyfriend", "girlfriend", "husband", "wife"],
};
const CRISIS_PATTERNS = ["suicide", "kill myself", "end my life", "ending my life", "want to die", "dont want to live", "don't want to live", "no reason to live", "better off dead", "self harm", "self-harm", "hurt myself", "hurting myself", "cant go on", "can't go on", "no way out", "end it all"];
function normalise(text) { return text.toLowerCase().replace(/[^a-z0-9' ]/g, " "); }
function isCrisisMessage(text) { const n = normalise(text); return CRISIS_PATTERNS.some((p) => n.includes(p.replace("'", ""))); }
function pickActivity(text, usedIds) {
  const n = normalise(text);
  let bestCat = null, bestScore = 0;
  for (const cat in CATEGORY_KEYWORDS) {
    const hits = CATEGORY_KEYWORDS[cat].filter((k) => n.includes(normalise(k))).length;
    if (hits > bestScore) { bestScore = hits; bestCat = cat; }
  }
  if (!bestCat) return null;
  const pool = ACTIVITIES.filter((a) => a.category === bestCat), fresh = pool.filter((a) => !usedIds.has(a.id));
  return (fresh.length ? fresh : pool)[0] || null;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const TOKEN_BUDGETS = { classifier: 150, evaluator: 120, evaluator_audit: 120, coder: 100, memory: 200, main: 800, retry: 800, quick_replies: 80 };

async function callGroq(state, systemPrompt, messages, stage, maxTokens, _isRetryAttempt, overrideModel, overrideReasoning) {
  const budget = maxTokens || TOKEN_BUDGETS[stage] || 300;
  const modelToUse = overrideModel || state.selectedModel;
  const reasoningToUse = overrideModel ? overrideReasoning : currentModelConfig(state).reasoning;
  const disableThinkingToUse = overrideModel ? false : !!currentModelConfig(state).disableThinking;
  let response;
  try {
    response = await fetch("/api/companion-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: systemPrompt, messages, model: modelToUse, max_tokens: budget, plain_text: stage === "main" || stage === "retry", reasoning_effort: reasoningToUse, session_id: state.sessionId, disable_thinking: disableThinkingToUse }),
    });
  } catch (e) {
    throw new Error((stage || "AI") + " network error: " + (e && e.message ? e.message : String(e)));
  }
  let data;
  try { data = await response.json(); } catch (e) { throw new Error((stage || "AI") + " returned non-JSON HTTP " + response.status); }
  if (response.status === 400 && !_isRetryAttempt && /failed to (generate|validate) json/i.test((data && data.error) || "")) {
    console.warn("[Sukoon]", stage, "hit a JSON-generation miss, retrying once");
    await sleep(400);
    return callGroq(state, systemPrompt, messages, stage, maxTokens, true, overrideModel, overrideReasoning);
  }
  if (response.status === 429 && !_isRetryAttempt) {
    const waitSec = Math.min(Math.max((data && data.retryAfter) || 6, 3), 20);
    console.warn("[Sukoon]", stage, "hit 429, backing off", waitSec, "s before one retry");
    await sleep(waitSec * 1000);
    return callGroq(state, systemPrompt, messages, stage, maxTokens, true, overrideModel, overrideReasoning);
  }
  if (!response.ok) throw new Error((stage || "AI") + " HTTP " + response.status + ": " + (data.error || JSON.stringify(data)));
  if (!data.text) {
    if (!_isRetryAttempt) {
      console.warn("[Sukoon]", stage, "returned empty text, retrying once");
      return callGroq(state, systemPrompt, messages, stage, maxTokens, true, overrideModel, overrideReasoning);
    }
    throw new Error((stage || "AI") + " returned empty text");
  }
  return data.text;
}

const MAX_REPLY_WORDS = 70, MAX_READING_GRADE = 10, MIN_WORDS_FOR_READING_CHECK = 8;
function wordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}
function fleschKincaidGrade(text) {
  const sentences = text.split(/[.!?]+|—|\n+/).map((s) => s.trim()).filter(Boolean),
    words = text.split(/\s+/).map((w) => w.replace(/[^a-zA-Z']/g, "")).filter(Boolean);
  if (!words.length) return 0;
  const sc = Math.max(sentences.length, 1), wc = words.length;
  let syllables = 0; words.forEach((w) => (syllables += countSyllables(w)));
  return 0.39 * (wc / sc) + 11.8 * (syllables / wc) - 15.59;
}
function extractQuestion(text) { const m = text.match(/([^.!?]*\?)/); return m ? normalise(m[1]).trim() : null; }
function questionSimilarity(a, b) {
  const wa = new Set(a.split(" ").filter(Boolean)), wb = new Set(b.split(" ").filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let overlap = 0; wa.forEach((w) => { if (wb.has(w)) overlap++; });
  return overlap / new Set([...wa, ...wb]).size;
}
function isRepeatedQuestion(text, askedQs) { const q = extractQuestion(text); if (!q) return false; return askedQs.some((prior) => questionSimilarity(q, prior) > 0.7); }
const MAX_QUESTION_MARKS = 3;
function deterministicChecks(text, askedQs) {
  if (wordCount(text) > MAX_REPLY_WORDS) return { pass: false, issue: "too_long" };
  if (wordCount(text) >= MIN_WORDS_FOR_READING_CHECK && fleschKincaidGrade(text) > MAX_READING_GRADE) return { pass: false, issue: "reading_level_too_high" };
  if ((text.match(/\?/g) || []).length > MAX_QUESTION_MARKS) return { pass: false, issue: "multiple_questions" };
  if (isRepeatedQuestion(text, askedQs || [])) return { pass: false, issue: "repeated_question" };
  return { pass: true, issue: null };
}
function safeParseJSON(text) { try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch (e) { return null; } }

const MI_TARGETS = { rq_ratio: { target: 1, tolerance: 0.15, label: "Reflection:Question ratio" }, pct_open: { target: 0.7, tolerance: 0.15, label: "Open questions (of all questions)" }, pct_complex: { target: 0.3, tolerance: 0.15, label: "Complex reflections (of all reflections)" } };
const MIN_CODED_TURNS_BEFORE_STEERING = 4;
const emptyTally = () => ({ simple_reflection: 0, complex_reflection: 0, open_question: 0, closed_question: 0, advice: 0, other: 0, turns: 0 });
const CODER_SYSTEM = 'You are a MITI-style behavioral coder for a supportive chat companion\'s single reply. Given the user\'s message and the companion\'s reply, identify which behaviors the reply contains. Definitions: simple_reflection mirrors back what the person said, adding little or no new meaning. complex_reflection names an unspoken feeling, meaning, or implication beyond what was literally said. open_question cannot be answered with yes/no or a single word. closed_question can. advice is a suggestion, recommendation, tip, or instruction. Assign AT MOST ONE reflection and AT MOST ONE question. Respond ONLY with compact JSON: {"codes":["..."]}';
function regexFallbackCodes(reply) {
  const codes = [], qMatch = reply.match(/[^.!?]*\?/);
  if (qMatch) { const q = qMatch[0].trim().toLowerCase(); codes.push(/^(do|does|did|is|are|was|were|can|could|will|would|have|has|had|should|any|would you)\b/.test(q) ? "closed_question" : "open_question"); }
  if (!codes.length) codes.push("other");
  return codes;
}
async function codeCompanionTurn(state, callbacks, userText, replyText) {
  let codes;
  try {
    const raw = await callGroq(state, CODER_SYSTEM, [{ role: "user", content: "User said:\n" + userText + "\n\nCompanion replied:\n" + replyText }], "coder");
    const parsed = safeParseJSON(raw);
    codes = parsed && Array.isArray(parsed.codes) && parsed.codes.length ? parsed.codes : regexFallbackCodes(replyText);
  } catch (e) { codes = regexFallbackCodes(replyText); }
  const reflection = codes.includes("complex_reflection") ? "complex_reflection" : codes.includes("simple_reflection") ? "simple_reflection" : null,
    question = codes.includes("open_question") ? "open_question" : codes.includes("closed_question") ? "closed_question" : null,
    clean = [reflection, question].filter(Boolean);
  if (codes.includes("advice")) clean.push("advice");
  if (!clean.length) clean.push("other");
  clean.forEach((c) => { if (c in state.sessionTally) state.sessionTally[c]++; });
  state.sessionTally.turns++;
  await persistAggregate(state, clean);
  callbacks.onFidelityUpdate();
}
function computeMetrics(t) {
  const reflections = t.simple_reflection + t.complex_reflection, questions = t.open_question + t.closed_question;
  return { rq_ratio: questions ? reflections / questions : null, pct_open: questions ? t.open_question / questions : null, pct_complex: reflections ? t.complex_reflection / reflections : null, reflections, questions, advice: t.advice, turns: t.turns };
}
function bandStatus(key, value) {
  if (value === null) return "no data";
  const cfg = MI_TARGETS[key], lo = cfg.target * (1 - cfg.tolerance), hi = cfg.target * (1 + cfg.tolerance);
  return value < lo ? "below band" : value > hi ? "above band" : "in band";
}
function buildSteeringDirective(state) {
  if (state.sessionTally.turns < MIN_CODED_TURNS_BEFORE_STEERING) return "";
  const m = computeMetrics(state.sessionTally), notes = [];
  if (bandStatus("rq_ratio", m.rq_ratio) === "below band") notes.push("You have been asking more than reflecting this session — favour a reflection this turn instead of a question.");
  if (bandStatus("rq_ratio", m.rq_ratio) === "above band") notes.push("You have been reflecting much more than asking — a short open question would help move things forward this turn.");
  if (bandStatus("pct_open", m.pct_open) === "below band") notes.push("Too many of your questions have been yes/no ones — if you ask this turn, make it genuinely open.");
  if (bandStatus("pct_complex", m.pct_complex) === "above band") notes.push("You have been inferring unspoken meaning quite often — stay closer to their literal words this turn.");
  return notes.length ? "CONVERSATION BALANCE (internal note): " + notes.join(" ") : "";
}

async function loadMemory() { try { const v = localStorage.getItem("sukoon_memory"); return v ? JSON.parse(v) : []; } catch (e) { return []; } }
async function saveMemory(arr) { try { localStorage.setItem("sukoon_memory", JSON.stringify(arr)); } catch (e) {} }
async function loadMemoryEnabled() { try { const v = localStorage.getItem("sukoon_memory_enabled"); return v ? JSON.parse(v) : true; } catch (e) { return true; } }
async function saveMemoryEnabled(val) { try { localStorage.setItem("sukoon_memory_enabled", JSON.stringify(val)); } catch (e) {} }
async function loadAggregateInto(state) {
  try {
    const v = localStorage.getItem("sukoon_mi_aggregate");
    if (v) { const parsed = JSON.parse(v); state.aggregateTally = Object.assign(emptyTally(), parsed.tally || {}); state.aggregateSessions = parsed.sessions || 0; }
  } catch (e) {}
}
async function persistAggregate(state, codes) {
  codes.forEach((c) => { if (c in state.aggregateTally) state.aggregateTally[c]++; });
  state.aggregateTally.turns++;
  try { localStorage.setItem("sukoon_mi_aggregate", JSON.stringify({ tally: state.aggregateTally, sessions: state.aggregateSessions })); } catch (e) {}
}

// ---- ABOUT THIS PERSON — new, not in the original. Reuses the same
// summarizers already feeding Plan Quiz / Doctor Concierge context. ----
function buildUserContextBlock(profile) {
  if (!profile) return "";
  const lines = [];
  if (profile.name) lines.push(`Their name is ${profile.name}.`);
  const planSummary = summarizePlan(profile.plan);
  if (planSummary) lines.push(planSummary);
  const trackingSummary = summarizeTracking(profile.tracking);
  if (trackingSummary) lines.push(trackingSummary);
  if (!lines.length) return "";
  return (
    "ABOUT THIS PERSON — from their profile/plan/tracking data in the app, not something they told you in this chat. " +
    "Use naturally if relevant (e.g. don't ask something already covered here), never announce or cite this as data you have on them:\n" +
    lines.map((l) => "- " + l).join("\n")
  );
}

let bubbleIdCounter = 0;
function nextBubbleId() { return "b" + ++bubbleIdCounter; }

function addBubble(callbacks, role, text, chipActivity, quickReplies) {
  const id = nextBubbleId();
  callbacks.onBubble({ id, role, kind: "message", text, chipActivity: chipActivity || null, quickReplies: quickReplies || null });
  return id;
}
function addCrisisCard(callbacks) {
  const id = nextBubbleId();
  callbacks.onBubble({ id, role: "assistant", kind: "crisis" });
  return id;
}
function addStarterChips(callbacks, quickReplies) {
  const id = nextBubbleId();
  callbacks.onBubble({ id, role: "assistant", kind: "starter-chips", quickReplies });
  return id;
}

const BUBBLE_SPLIT_MAX = 3;
const BUBBLE_STAGGER_BASE_MS = 700, BUBBLE_STAGGER_PER_WORD_MS = 90, BUBBLE_STAGGER_MAX_MS = 2200;
function bubbleStaggerDelay(nextPartText) { return Math.min(BUBBLE_STAGGER_MAX_MS, BUBBLE_STAGGER_BASE_MS + wordCount(nextPartText) * BUBBLE_STAGGER_PER_WORD_MS); }
function splitIntoBubbles(text) {
  let parts = (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) parts = [(text || "").trim()];
  if (parts.length > BUBBLE_SPLIT_MAX) {
    const head = parts.slice(0, BUBBLE_SPLIT_MAX - 1), tail = parts.slice(BUBBLE_SPLIT_MAX - 1).join(" ");
    parts = [...head, tail];
  }
  return parts;
}
async function renderBubbleSequence(callbacks, role, text, chipActivity, quickReplies) {
  const parts = splitIntoBubbles(text);
  let lastId = null;
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) { callbacks.onTypingStart(); await sleep(bubbleStaggerDelay(parts[i])); callbacks.onTypingEnd(); }
    const isLast = i === parts.length - 1;
    lastId = addBubble(callbacks, role, parts[i], isLast ? chipActivity : null, isLast ? quickReplies : null);
  }
  return lastId;
}

const CLASSIFY_SYSTEM = 'You are a safety and scope classifier for a supportive, non-clinical AI companion chat. Given the latest user message and brief recent context, output ONLY compact JSON: {"risk":"none"|"crisis"|"elevated_distress","scope":"in_scope"|"medical_advice_seeking"|"diagnosis_seeking"|"unrelated_task"|"confused_by_question"}. crisis = explicit or strongly implied suicidal ideation, self-harm intent, or immediate danger. elevated_distress = significant distress or hopelessness without explicit crisis. medical_advice_seeking = medication/dose/treatment. diagnosis_seeking = asking for a condition/diagnosis. unrelated_task = coding, homework, trivia, etc. confused_by_question = the person says they don\'t understand, are confused by, or are pushing back on the companion\'s own last question or reflection (e.g. \'I don\'t understand what you mean\', \'what does that even mean\', \'that question doesn\'t make sense\', \'huh?\'). Do not use this for general life confusion unrelated to the companion\'s last message. in_scope = normal supportive conversation.';
async function classify(state, latestUserText) {
  const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
  try {
    const raw = await callGroq(state, CLASSIFY_SYSTEM, [{ role: "user", content: "Latest user message:\n" + latestUserText + "\n\nRecent context:\n" + recentContext }], "classifier");
    const parsed = safeParseJSON(raw);
    if (parsed && parsed.risk && parsed.scope) return parsed;
  } catch (e) {}
  return { risk: "none", scope: "in_scope" };
}

const FOCUS_MODEL = "openai/gpt-oss-120b";
const READINESS_MODEL = "openai/gpt-oss-120b";
const FOCUS_SYSTEM = `Task: read a short supportive chat. Decide what matters most right now, whether it just changed, and whether two things are genuinely pulling against each other.

Output ONLY this JSON, nothing else:
{"stage":"understanding"|"moving","core_focus":"<5-8 words>","focus_changed":true|false,"wants_change":true|false,"tension":null|{"a":"<short phrase>","b":"<short phrase>"}}

stage: "understanding" = still gathering facts or background, no feeling/reason explored yet. "moving" = a feeling, reason, or next step tied to the core focus is being explored.

core_focus: the ONE thing driving how the person feels or what they want right now - not the topic, the specific thing underneath it. Their own words if possible. Keep it short.

focus_changed: true ONLY if the newest message reveals something MORE central than before - not just another fact about the same thing. False if just more detail, or if this is the first message.

wants_change: true ONLY if they directly and unmistakably said they want to change, fix, stop, or improve the core_focus itself ("I want to stop doing this"). False if only describing or reacting to it, even with frustration.

tension: null almost always. Only set it when the person's own words show two things genuinely pulling against each other AT THE SAME TIME - not two separate facts said one after another, not a past-vs-present contrast, an actual internal pull ("part of me wanted X, but I also didn't want Y"). Each side is a short phrase in their terms.

Test before setting it: could both things be true or done AT THE SAME TIME without contradicting each other? If yes - e.g. they did two things together as one coordinated response, like staying calm WHILE also speaking up - that is NOT tension, that's just two actions in the same effort. Tension requires the two things to actually pull against each other, not sit comfortably side by side. Do not manufacture a tension merely to sound insightful - if you are not sure it is really there, output null.

You get the previous focus you reported last turn. Keep it unless the new message clearly points somewhere more central.

Example A:
Previous focus: (none)
user: my manager criticized my report in front of the team
assistant: what happened after that?
user: I just said okay and left. but I keep replaying it
assistant: what part keeps coming back?
user: that I didn't say anything back. I never do
Output: {"stage":"moving","core_focus":"never speaking up when criticized","focus_changed":true,"wants_change":false,"tension":null}

Example B:
Previous focus: (none)
user: I procrastinate a lot and I want to stop
Output: {"stage":"understanding","core_focus":"wants to stop procrastinating","focus_changed":true,"wants_change":true,"tension":null}

Example C (tension):
Previous focus: unsure whether to have confronted a rude coworker
user: should I have said something back to him
assistant: what stopped you?
user: I try to stay professional, I don't want to be the kind of person who snaps at people
Output: {"stage":"moving","core_focus":"staying professional under provocation","focus_changed":false,"wants_change":false,"tension":{"a":"wanting to have stood up for himself in the moment","b":"valuing being someone who stays calm and doesn't snap"}}

Example D (NOT tension - a common mistake to avoid):
Previous focus: handling someone shouting at them
user: I tried taking deep breaths and kept telling them their problem is resolvable and that shouting is rude, we don't talk like that
Output: {"stage":"moving","core_focus":"staying calm while confronting rude shouting","focus_changed":false,"wants_change":false,"tension":null}
(Staying calm and naming the behavior as rude were done TOGETHER, as one coordinated response - not two things pulling against each other. This is not tension even though two things are mentioned.)

Example E (NOT focus change - a common mistake to avoid):
Previous focus: getting the polytech forms handed in
user: after talking to you, I got Donna to help me out. that was helpful
Output: {"stage":"moving","core_focus":"getting the polytech forms handed in","focus_changed":false,"wants_change":false,"tension":null}
(Donna is an incidental detail about HOW the forms got moving, not a new central thing - the forms are still what's driving this. A passing mention of a person, place, or other detail that helped does not by itself make it the new focus. Only flip focus_changed if that detail itself is now what matters most to the person - not just background to the thing that already mattered.)

Only output the JSON object. No explanation, no markdown.`;
const READINESS_SYSTEM = `Task: the person has already said they want to work on or change something. Read a short chat and decide how ready they seem to actually do it, right now.

Output ONLY this JSON, nothing else:
{"readiness":"precontemplation"|"contemplation"|"preparation"|"action"|"maintenance"}

precontemplation = does not really see it as a problem, or resists the idea of changing it
contemplation = sees it as an issue, is thinking about it, but has no real plan ("I guess I would like to...")
preparation = wants to try something soon, open to a small concrete step
action = actively trying something right now
maintenance = already changed it, working on keeping it up

Rules:
- You will get the readiness you reported last turn. Keep that same stage unless the newest message clearly moves it.
- Only move backward a stage if the person clearly pushed back, gave up, or sounded discouraged in their newest message.
- If unsure or there is too little evidence, keep the same stage as before.

Example:
Previous readiness: contemplation
user: I want to stop procrastinating on reports
assistant: what does it usually look like when you start avoiding one?
user: I open my laptop then just browse instead. I know it's dumb
assistant: what do you think is happening in that moment?
user: honestly I don't know. maybe I'd try setting a timer if you have ideas
Output: {"readiness":"preparation"}

Output only the JSON object. No explanation, no markdown.`;
async function callGroqDirect(system, user, model, reasoningEffort, maxTokens) {
  const response = await fetch("/api/companion-classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, user, model, max_tokens: maxTokens || 150, reasoning_effort: reasoningEffort }) });
  const data = await response.json();
  if (!response.ok) throw new Error((data?.error || "groq classify failed") + (data?.failedGeneration ? " | raw: " + data.failedGeneration : ""));
  return data.text || "";
}
async function classifyFocus(state, latestUserText) {
  const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
  const userContent = "Previous focus: " + (state.conversationFocus || "(none)") + "\n\n" + recentContext + "\nuser: " + latestUserText;
  try {
    const raw = await callGroqDirect(FOCUS_SYSTEM, userContent, FOCUS_MODEL, "low", 1000);
    const parsed = safeParseJSON(raw);
    if (parsed && typeof parsed.core_focus === "string") return parsed;
  } catch (e) { console.error("[Sukoon] focus classifier failed:", e); }
  return { stage: "understanding", core_focus: state.conversationFocus, focus_changed: false, wants_change: false, tension: null };
}
async function classifyReadiness(state, latestUserText) {
  const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
  const userContent = "Previous readiness: " + (state.readinessStage || "(none)") + "\n\n" + recentContext + "\nuser: " + latestUserText;
  try {
    const raw = await callGroqDirect(READINESS_SYSTEM, userContent, READINESS_MODEL, "low", 1000);
    const parsed = safeParseJSON(raw);
    if (parsed && parsed.readiness) return parsed.readiness;
  } catch (e) { console.error("[Sukoon] readiness classifier failed:", e); }
  return state.readinessStage || "contemplation";
}

function buildStateNote(state, focusResult) {
  let focusChangedNote = "", otherNote = "";
  if (focusResult.focus_changed && state.conversationFocus) {
    focusChangedNote = "FOCUS just changed to: " + focusResult.core_focus + ". Check in on this, in your own words, before moving on to anything else — this takes priority over whatever you were about to ask next.";
  }
  state.conversationFocus = focusResult.core_focus || state.conversationFocus;
  const genuinelyNewTopic = focusResult.focus_changed && !focusResult.tension && (state.goalMode === null || state.goalMode === "pending");
  if (genuinelyNewTopic) {
    state.focusStableTurns = 0; state.depthPushed = false; state.landingOffered = false; state.turnsSinceDepthPush = 0;
    state.hypothesisRejectCount = 0; state.landingForced = false; state.tensionSurfaced = false;
  } else {
    state.focusStableTurns++;
  }
  if (focusResult.focus_changed) {
    state.movingStageTurnCount = 0; state.thinReplyStreak = 0;
  } else if (focusResult.stage === "moving") {
    state.movingStageTurnCount++;
  }
  if ((state.goalMode === "validation_only" || state.goalMode === "wants_change") && state.depthPushed && !state.landingOffered) state.turnsSinceDepthPush++;
  if (state.goalMode === "pending") {
    state.goalMode = focusResult.wants_change ? "wants_change" : "validation_only";
  } else if (state.goalMode === null && focusResult.wants_change) {
    state.goalMode = "wants_change";
  } else if (state.goalMode === null && state.focusStableTurns >= 2 && focusResult.stage === "moving") {
    otherNote = "The focus has settled on: " + state.conversationFocus + ". Naturally ask, once, plainly: is this something they'd want to work on, or did they mostly just want to get it out? Don't push toward either answer.";
    state.goalMode = "pending";
  } else if (state.goalMode === "wants_change" && !state.depthPushed && state.focusStableTurns >= 3) {
    otherNote = "You have a clear, concrete picture of what's going on now. Shift from gathering more detail to exploring what this is like for them — how they feel about it, what it's costing them, or what pulls them two ways about it. Don't ask another fact-gathering question this turn.";
    state.depthPushed = true;
  } else if (state.goalMode === "validation_only" && !state.depthPushed && state.focusStableTurns >= 3) {
    otherNote = "You have enough of the picture. Stop asking clarifying questions — reflect back what this seems to feel like for them, and let the conversation settle rather than digging for more detail.";
    state.depthPushed = true;
  } else if (state.goalMode === "validation_only" && state.depthPushed && !state.landingOffered && state.turnsSinceDepthPush >= 2) {
    otherNote = "They've had space to sit with this. Offer a natural landing: name what they seem to be feeling, then invite them to either keep sharing anything else on their mind, or gently suggest something small that might help release the feeling right now — like a short walk, a minute of slow breathing, or music (ask what usually helps them rather than prescribing one thing) — or offer to pause here and pick this back up later. Let them choose; don't push any one option.";
    state.landingOffered = true;
  } else if (state.goalMode === "wants_change" && state.depthPushed && !state.landingOffered && state.turnsSinceDepthPush >= 2) {
    otherNote = "They've had space to explore this. Bring it together: briefly name the pattern or tension you've picked up on, then check in on direction — ask if they want to explore further, try something small based on what's come up, or wind down for now. If a concrete idea comes to mind, offer it as one option among the choices, not a directive.";
    state.landingOffered = true;
  }
  return { focusChangedNote, otherNote };
}

const THIN_REPLY_WORD_THRESHOLD = 5, THIN_REPLY_STREAK_TRIGGER = 2;
const HYPOTHESIS_CHECK_PATTERN = /does that fit|does that sound right|sound closer|does this land|am i reading|is that fair|does that feel true|does that ring true/i;
const PUSHBACK_PATTERN = /\bnot really\b|\bnot quite\b|\bnot exactly\b|\bnah\b|\bnot the case\b|\bnot it\b|^no[,.]|\bactually no\b|\bdon'?t think so\b|\bthat'?s not\b/i;
function looksLikeHypothesisCheck(text) { return HYPOTHESIS_CHECK_PATTERN.test(text); }
function looksLikePushback(text) { return PUSHBACK_PATTERN.test(normalise(text)); }
const CLOSED_QUESTION_STARTER = /^(do|does|did|is|are|was|were|can|could|will|would|have|has|had|should|any|would you)\b/;
function classifyQuestionTypeLocal(replyText) { const q = extractQuestion(replyText); if (!q) return null; return CLOSED_QUESTION_STARTER.test(q) ? "closed" : "open"; }

const MAX_MOVING_TURNS = 12, MAX_HYPOTHESIS_REJECTIONS = 3;
function maxReachedNoteFor(state) {
  if (state.landingForced) return "";
  if (state.movingStageTurnCount >= MAX_MOVING_TURNS || state.hypothesisRejectCount >= MAX_HYPOTHESIS_REJECTIONS) {
    state.landingForced = true;
    const expertLine = state.goalMode === "wants_change" ? ", or connect with a human expert to go deeper on this" : "";
    return "You've been exploring this for a while without landing on a clear next step. This turn, be honest about that: briefly name what you've understood so far, even if it's partial, then offer a plain choice — pause and pick this up later, keep talking with no pressure" + expertLine + ". Don't ask another exploratory question this turn.";
  }
  return "";
}
function thinReplyNoteFor(state, stage) {
  if (state.thinReplyStreak < THIN_REPLY_STREAK_TRIGGER) return "";
  if (stage === "understanding") {
    return "Replies have stayed short after a couple of open prompts. This turn, nudge for a bigger response by naming the kind of detail you want — for example, ask them to say more about a specific moment: how they felt, how they reacted, what the other person was doing. Keep it to one plain ask.";
  }
  return "Replies have stayed short after open questions. Switch this turn — use a closed or multiple-choice question, or a brief affirmation, instead of another open question.";
}
function stageNoteFor(stage) {
  if (stage === "understanding") return "Still gathering the picture. Favor open questions and short minimal encouragers ('mm.', 'right...', 'yeah, go on.') — hold off on affirmations, there's nothing concrete to affirm yet.";
  if (stage === "moving") return "Enough is on the table to work with. Default to offering a tentative read this turn (a complex reflection they can correct) rather than another plain open question — affirmation and summary are both fair game here too, but don't let either be the whole reply: pair it with a check-in or a next question so the turn still leads somewhere.";
  return "";
}
function tensionNoteFor(state, tension) {
  if (!tension || !tension.a || !tension.b) return "";
  if (state.tensionSurfaced) return "";
  state.tensionSurfaced = true;
  return "There's a real pull between two things here: " + tension.a + " — but also " + tension.b + ". Name that tension directly this turn as a double-sided reflection (see section 6) — don't just validate one side of it, and don't ask another question yet.";
}
const DIRECT_HELP_PATTERN = new RegExp(
  [
    "\\bhow (?:should|do|can|would) (?:i|you) (?:stop|handle|deal with|prevent|fix|approach|respond to|manage|cope with|get (?:this|that|it|them) to stop|make (?:this|that|it) stop)\\b",
    "\\bwhat (?:should|can) i do\\b",
    "\\bwhat do you think i should do\\b",
    "\\bwhat would you do\\b",
    "\\bwhat(?:'s| is) the best way to\\b",
    "\\b(?:can|could) you help(?: me)?\\b",
    "\\bhelp me (?:figure|with|out)\\b",
    "\\bhow can you help\\b",
    "\\bany (?:suggestions|advice|tips|ideas)\\b",
    "\\bgot any (?:ideas|suggestions|tips)\\b",
    "\\bwhat do you suggest\\b",
    "\\bis there anything i can do\\b",
    "\\bhow do you (?:deal with|handle) (?:this|that)\\b",
  ].join("|"),
  "i"
);
const PAST_TENSE_HELP_PATTERN = /\b(got|asked|had|made)\b[^.?!]{0,30}\bto help me\b|\bhelped me\b/i;
function looksLikeDirectHelpAsk(text) { const n = normalise(text); if (PAST_TENSE_HELP_PATTERN.test(n)) return false; return DIRECT_HELP_PATTERN.test(n); }
function directAskNoteFor() {
  return "They just directly asked for help or what to do. Answer practically and briefly this turn (see section 30) — don't respond with another reflection question, and don't hold back a concrete idea just because readiness looked early; asking directly like this is itself a sign they're ready to hear one.";
}
function buildArbiterNote({ scopeGuardrail, pendingSteeringNote, directAskNote, maxReachedNote, thinReplyNote, tensionNote, focusChangedNote, ventCheckNote, otherStateNote, readinessNote, stageDefaultNote }) {
  const guardrails = [scopeGuardrail, pendingSteeringNote].filter(Boolean).join(" ");
  const moveNote = directAskNote || maxReachedNote || thinReplyNote || tensionNote || focusChangedNote || ventCheckNote || otherStateNote || readinessNote || stageDefaultNote || "";
  return [guardrails, moveNote].filter(Boolean).join(" ");
}
function readinessNoteFor(stage) {
  if (stage === "precontemplation") return "READINESS: they don't seem to see this as something to change yet. Stay with reflection and validation — do not suggest next steps.";
  if (stage === "contemplation") return "READINESS: they're thinking about this but have no plan yet. Reflection is still the right move — don't jump to suggestions.";
  return "";
}
const SCOPE_NOTES = {
  medical_advice_seeking: "SCOPE: medical_advice_seeking — explain briefly this is outside this chat and steer back to how they are feeling.",
  diagnosis_seeking: "SCOPE: diagnosis_seeking — do not name or suggest a diagnosis; explain this is outside this chat and steer back to their experience.",
  unrelated_task: "SCOPE: unrelated_task — decline briefly and steer back to how they are doing.",
  confused_by_question: "SCOPE: confused_by_question — do not ask another abstract or meta question about their confusion. Either drop the question and reflect back something concrete and simple in their own words, or ask one very plain, concrete question tied to something specific they already told you.",
};
function scopeDirectiveFor(state, cls) {
  if (cls.scope === "confused_by_question" && state.consecutiveConfusionTurns >= 1) {
    return "SCOPE: confused_by_question (already happened once) — do not reflect the confusion again; instead pick one concrete thing they already told you and turn it into a single simple, closed, easy-to-answer next step.";
  }
  if (SCOPE_NOTES[cls.scope]) return SCOPE_NOTES[cls.scope];
  if (cls.risk === "elevated_distress") return "RISK: elevated_distress — prioritize warmth and validation; don't suggest an activity.";
  return "";
}

const EVALUATOR_RULES = 'Judge: no unsolicited advice unless explicitly asked; no diagnosis/clinical language; no medication/treatment recommendations; warm and validating; no unrelated tasks; no parasocial claims; no unearned complex reflection; no fabricated detail. fabricated_detail = the reply references a specific activity, object, event, or detail that the person did not actually say, even loosely — check the recent conversation provided, not just the last message. Respond ONLY JSON: {"pass":true|false,"issue":null|"unsolicited_advice"|"diagnosis_language"|"medication_mention"|"low_empathy"|"out_of_scope"|"parasocial_overclaim"|"unearned_complex_reflection"|"fabricated_detail"}';
const EVALUATOR_SYSTEM = "You are a strict output evaluator for a supportive, non-clinical AI companion reply. " + EVALUATOR_RULES;
const AUDIT_SYSTEM = "You are the second, more careful review of a reply that a faster, first-pass evaluator already flagged as a possible issue. That first pass is tuned for speed and can only reliably catch obvious problems — on anything requiring real judgment (is this actually advice vs. a validating reflection with a question, is the empathy actually low, is a reflection actually unearned, is a detail actually fabricated, does this actually name a diagnosis, is this actually an overclaimed relationship) it produces a lot of false flags. Do not treat its flag as ground truth. Judge the reply fresh, independently, using your own better judgment, and only agree with the flag if you would genuinely raise it yourself, looking at the reply cold. " + EVALUATOR_RULES;
const EVALUATOR_MODEL = "openai/gpt-oss-120b";
async function evaluateReply(state, userText, draftReply) {
  try {
    const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
    const userContent = "Recent conversation:\n" + recentContext + "\n\nUser's last message:\n" + userText + "\n\nDraft reply:\n" + draftReply;
    const raw = await callGroqDirect(EVALUATOR_SYSTEM, userContent, EVALUATOR_MODEL, "low", 800);
    const parsed = safeParseJSON(raw);
    if (parsed && typeof parsed.pass === "boolean") return parsed;
  } catch (e) { console.error("[Sukoon] evaluator failed:", e); }
  return { pass: true, issue: null };
}
const QUICK_REPLY_MODEL = "openai/gpt-oss-120b";
const QUICK_REPLY_SYSTEM = 'Given a supportive companion\'s reply and recent context, suggest up to 3 short quick-reply button options the user could tap to answer — a few words each, answers only, never questions. If nothing fits well, return an empty list. Respond ONLY JSON: {"quick_replies":["...","..."]}';
const QUICK_REPLY_STALE_MS = 1000;
function shouldOfferQuickReplies(state, replyText) {
  if (!replyText.includes("?")) return false;
  if (state.quickReplyStreak >= 2) return false;
  return true;
}
async function fetchQuickReplies(state, replyText) {
  const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
  try {
    const raw = await callGroqDirect(QUICK_REPLY_SYSTEM, "Recent conversation:\n" + recentContext + "\n\nCompanion's reply:\n" + replyText, QUICK_REPLY_MODEL, "low", 300);
    const parsed = safeParseJSON(raw);
    if (parsed && Array.isArray(parsed.quick_replies)) return parsed.quick_replies.filter((qr) => qr && qr.trim()).slice(0, 3);
  } catch (e) {}
  return [];
}
function maybeAttachQuickReplies(state, callbacks, bubbleId, replyText, myGeneration) {
  if (!shouldOfferQuickReplies(state, replyText)) { state.quickReplyStreak = 0; return; }
  const _t0 = performance.now();
  fetchQuickReplies(state, replyText).then((list) => {
    const elapsed = performance.now() - _t0;
    if (myGeneration !== state.replyGeneration || elapsed > QUICK_REPLY_STALE_MS || !list.length) {
      state.quickReplyStreak = 0;
      return;
    }
    callbacks.onUpdateBubble(bubbleId, { quickReplies: list });
    state.quickReplyStreak++;
  });
}

const COMPLEX_EVALUATOR_ISSUES = new Set(["unsolicited_advice", "low_empathy", "unearned_complex_reflection", "diagnosis_language", "parasocial_overclaim", "fabricated_detail"]);
const REVIEW_ONLY_ISSUES = new Set(["unsolicited_advice"]);
async function auditComplexFlag(state, userText, replyText, issue) {
  try {
    const recentContext = state.history.slice(-6).map((m) => m.role + ": " + m.content).join("\n");
    const raw = await callGroq(state, AUDIT_SYSTEM, [{ role: "user", content: "Recent conversation:\n" + recentContext + "\n\nUser's last message:\n" + userText + "\n\nDraft reply:\n" + replyText + "\n\nThe fast-pass evaluator flagged this reply for: " + issue }], "evaluator_audit");
    const parsed = safeParseJSON(raw);
    if (parsed && parsed.pass === false && parsed.issue === issue) {
      if (!REVIEW_ONLY_ISSUES.has(issue)) {
        state.pendingSteeringNote = "Your previous reply was flagged for " + issue + " on a closer look — this turn, deliberately avoid repeating that pattern.";
      }
    }
  } catch (e) { /* fail silently — no steering note, nothing blocks on this */ }
}

const SAFE_FALLBACK_REPLIES = ["I want to make sure I'm actually being helpful here rather than just talking — could you tell me a bit more about what's going on?", "Thanks for saying that again — I hear you. Tell me a bit more, in your own words, whenever you're ready.", "I don't want to just repeat myself here. What feels most important to say about this right now?"];
function pickFallbackReply(state) {
  const pool = SAFE_FALLBACK_REPLIES.filter((r) => r !== state.lastFallbackText);
  const choice = pool[Math.floor(Math.random() * pool.length)];
  state.lastFallbackText = choice;
  return choice;
}
const EXTRACT_SYSTEM = 'Extract 1-3 short factual memory notes from this conversation that would help a supportive, non-clinical companion continue naturally in a future session. Each note under 12 words, factual. Do NOT include self-harm, suicide, or crisis content. Respond ONLY with compact JSON: {"notes":["...","..."]}';
async function extractMemory(state, callbacks) {
  if (!state.memoryEnabled) return;
  const recent = state.history.slice(-10);
  if (recent.length < 2) return;
  try {
    const raw = await callGroq(state, EXTRACT_SYSTEM, recent, "memory");
    const parsed = safeParseJSON(raw);
    const notes = parsed && Array.isArray(parsed.notes) ? parsed.notes : null;
    if (notes && notes.length) {
      state.memoryFacts = notes.concat(state.memoryFacts).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);
      await saveMemory(state.memoryFacts);
      callbacks.onMemoryChange(state.memoryFacts, state.memoryEnabled);
    }
  } catch (e) {}
}
function parseReplyPlain(raw) {
  const reply = (raw || "").replace(/^REPLY:\s*/i, "").trim();
  return { reply: reply || (raw || "").trim() };
}
function buildCanonicalSystemPrompt(state, contextNote) {
  state.lastCandidateActivity = null;
  return buildConversationPrompt({
    memoryFacts: state.memoryEnabled ? state.memoryFacts.slice(0, 5) : [],
    scopeDirective: contextNote,
    userContext: buildUserContextBlock(state.profile),
  });
}

const VENT_PATTERNS = ["just want to vent", "just wanted to vent", "just needed to vent", "want to vent", "wanted to vent"];
const VENT_CHECKIN_AT_TURN = 6;
const SPECIFIC_QUESTION_PATTERNS = ["specific question"];

function createCompanionState() {
  return {
    sessionId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    selectedModel: loadSelectedModel(),
    profile: null,
    history: [],
    memoryFacts: [],
    memoryEnabled: true,
    usedActivityIds: new Set(),
    lastCandidateActivity: null,
    userTurnCount: 0,
    askedQuestions: [],
    consecutiveConfusionTurns: 0,
    conversationFocus: "",
    focusStableTurns: 0,
    goalMode: null,
    readinessStage: null,
    depthPushed: false,
    landingOffered: false,
    turnsSinceDepthPush: 0,
    movingStageTurnCount: 0,
    hypothesisRejectCount: 0,
    landingForced: false,
    tensionSurfaced: false,
    thinReplyStreak: 0,
    lastQuestionType: null,
    pendingHypothesisCheck: false,
    replyGeneration: 0,
    initialIntent: null,
    ventCheckInDone: false,
    sessionTally: emptyTally(),
    aggregateTally: emptyTally(),
    aggregateSessions: 0,
    pendingSteeringNote: "",
    quickReplyStreak: 0,
    lastFallbackText: null,
  };
}

export function createCompanionEngine(callbacks) {
  const state = createCompanionState();

  async function sendMessage(text, opts) {
    opts = opts || {};
    if (!text || !text.trim()) return;
    const myGeneration = ++state.replyGeneration;
    callbacks.onCompactChange(true);
    callbacks.onClearQuickReplies();
    addBubble(callbacks, "user", text);
    state.history.push({ role: "user", content: text });
    state.userTurnCount++;
    if (state.userTurnCount === 1) {
      const n = normalise(text);
      if (VENT_PATTERNS.some((p) => n.includes(normalise(p)))) state.initialIntent = "vent";
      else if (SPECIFIC_QUESTION_PATTERNS.some((p) => n.includes(normalise(p)))) state.initialIntent = "specific_question";
    }
    const isDirectQA = state.initialIntent === "specific_question";

    if (state.pendingHypothesisCheck) {
      if (looksLikePushback(text)) state.hypothesisRejectCount++; else state.hypothesisRejectCount = 0;
      state.pendingHypothesisCheck = false;
    }
    if (state.lastQuestionType === "open") {
      if (wordCount(text) <= THIN_REPLY_WORD_THRESHOLD) state.thinReplyStreak++; else state.thinReplyStreak = 0;
    }

    if (isCrisisMessage(text)) {
      addCrisisCard(callbacks);
      state.history.push({ role: "assistant", content: "[Sukoon showed crisis support resources.]" });
      return;
    }
    callbacks.onSendingChange(true);
    callbacks.onTypingStart();

    const wantsReadiness = state.goalMode === "wants_change";
    const [cls, focusResult, readinessResult] = opts.skipClassify
      ? [{ risk: "none", scope: "in_scope" }, { stage: "understanding", core_focus: state.conversationFocus, focus_changed: false, wants_change: false, tension: null }, state.readinessStage]
      : isDirectQA
      ? await Promise.all([classify(state, text), Promise.resolve({ stage: "understanding", core_focus: state.conversationFocus, focus_changed: false, wants_change: false, tension: null }), Promise.resolve(state.readinessStage)])
      : await Promise.all([classify(state, text), classifyFocus(state, text), wantsReadiness ? classifyReadiness(state, text) : Promise.resolve(state.readinessStage)]);

    if (cls.risk === "crisis") {
      callbacks.onTypingEnd();
      addCrisisCard(callbacks);
      state.history.push({ role: "assistant", content: "[Sukoon showed crisis support resources.]" });
      callbacks.onSendingChange(false);
      return;
    }
    state.readinessStage = readinessResult;

    let ventCheckNote = "";
    if (state.initialIntent === "vent" && !state.ventCheckInDone && state.userTurnCount >= VENT_CHECKIN_AT_TURN) {
      ventCheckNote = "They said early on they just wanted to vent — that's been the assumed goal. It's been a few turns now: this turn, naturally check in, genuinely open to either answer — are they looking to keep talking it through, or is there something they're trying to figure out or do about it? Don't push toward solutions, just ask.";
      state.ventCheckInDone = true;
    }

    const { focusChangedNote, otherNote } = isDirectQA ? { focusChangedNote: "", otherNote: "" } : buildStateNote(state, focusResult);
    const readinessNote = !isDirectQA && wantsReadiness ? readinessNoteFor(state.readinessStage) : "";
    const maxReachedNote = isDirectQA ? "" : maxReachedNoteFor(state);
    const thinReplyNote = isDirectQA ? "" : thinReplyNoteFor(state, focusResult.stage);
    const stageDefaultNote = isDirectQA ? "" : stageNoteFor(focusResult.stage);
    const tensionNote = isDirectQA ? "" : tensionNoteFor(state, focusResult.tension);
    const directAskNote = isDirectQA ? "" : looksLikeDirectHelpAsk(text) ? directAskNoteFor() : "";

    const contextNote = isDirectQA
      ? ""
      : buildArbiterNote({
          scopeGuardrail: scopeDirectiveFor(state, cls),
          pendingSteeringNote: state.pendingSteeringNote,
          directAskNote,
          maxReachedNote,
          thinReplyNote,
          tensionNote,
          focusChangedNote,
          ventCheckNote,
          otherStateNote: otherNote,
          readinessNote,
          stageDefaultNote,
        });

    if (cls.scope === "confused_by_question") state.consecutiveConfusionTurns++; else state.consecutiveConfusionTurns = 0;
    if (state.pendingSteeringNote) state.pendingSteeringNote = "";

    try {
      const systemPrompt = isDirectQA ? SPECIFIC_QUESTION_SYSTEM_PROMPT : buildCanonicalSystemPrompt(state, contextNote);
      const windowedHistory = state.history.slice(-HISTORY_WINDOW);
      let raw = await callGroq(state, systemPrompt, windowedHistory, "main");
      let parsed = parseReplyPlain(raw);

      state.lastCandidateActivity = !isDirectQA && cls.risk !== "elevated_distress" && cls.scope === "in_scope" ? pickActivity(text, state.usedActivityIds) : null;

      let evalResult = await evaluateReply(state, text, parsed.reply);
      if (evalResult.pass) {
        const det = deterministicChecks(parsed.reply, state.askedQuestions);
        if (!det.pass) evalResult = det;
      } else if (COMPLEX_EVALUATOR_ISSUES.has(evalResult.issue)) {
        auditComplexFlag(state, text, parsed.reply, evalResult.issue);
        evalResult = { pass: true, issue: null };
      }

      if (!evalResult.pass) {
        const repeatNote = evalResult.issue === "repeated_question" ? " You already asked a very similar question earlier in this conversation — ask something NEW that builds on exactly what they just told you, do not reuse the same question." : "";
        const retryNote = "\n\nYour previous draft failed review because: " + evalResult.issue + "." + repeatNote + " Revise it to fix that issue. Do not mention the revision.";
        const retrySystem = typeof systemPrompt === "string" ? systemPrompt + retryNote : { static: systemPrompt.static, dynamic: (systemPrompt.dynamic || "") + retryNote };
        try {
          const retryRaw = await callGroq(state, retrySystem, windowedHistory, "retry");
          const retryParsed = parseReplyPlain(retryRaw);
          let retryEval = await evaluateReply(state, text, retryParsed.reply);
          if (retryEval.pass) {
            const retryDet = deterministicChecks(retryParsed.reply, state.askedQuestions);
            if (!retryDet.pass) retryEval = retryDet;
          } else if (COMPLEX_EVALUATOR_ISSUES.has(retryEval.issue)) {
            auditComplexFlag(state, text, retryParsed.reply, retryEval.issue);
            retryEval = { pass: true, issue: null };
          }
          parsed = retryEval.pass ? retryParsed : { reply: pickFallbackReply(state) };
        } catch (e2) {
          console.error("[Sukoon DEBUG] retry failed:", e2);
          parsed = { reply: pickFallbackReply(state) };
        }
      }

      callbacks.onTypingEnd();
      let chip = null;
      if (state.lastCandidateActivity && parsed.reply.toLowerCase().includes(state.lastCandidateActivity.title.toLowerCase())) {
        chip = state.lastCandidateActivity;
        state.usedActivityIds.add(state.lastCandidateActivity.id);
      }
      const isFallback = SAFE_FALLBACK_REPLIES.includes(parsed.reply);
      if (!isFallback) {
        const askedQ = extractQuestion(parsed.reply);
        if (askedQ) state.askedQuestions.push(askedQ);
      }
      if (!isFallback) {
        state.pendingHypothesisCheck = looksLikeHypothesisCheck(parsed.reply);
        state.lastQuestionType = classifyQuestionTypeLocal(parsed.reply);
      }
      state.history.push({ role: "assistant", content: parsed.reply });
      const replyId = await renderBubbleSequence(callbacks, "assistant", parsed.reply, chip, null);
      if (!isFallback) {
        if (!isDirectQA) codeCompanionTurn(state, callbacks, text, parsed.reply);
        maybeAttachQuickReplies(state, callbacks, replyId, parsed.reply, myGeneration);
      } else {
        state.quickReplyStreak = 0;
      }
    } catch (e) {
      callbacks.onTypingEnd();
      console.error("[Sukoon DEBUG] main flow failed:", e);
      const fallback = pickFallbackReply(state);
      state.history.push({ role: "assistant", content: fallback });
      addBubble(callbacks, "assistant", fallback);
    } finally {
      callbacks.onSendingChange(false);
    }
    if (state.userTurnCount > 0 && state.userTurnCount % 4 === 0) extractMemory(state, callbacks);
  }

  async function init() {
    state.memoryEnabled = await loadMemoryEnabled();
    state.memoryFacts = state.memoryEnabled ? await loadMemory() : [];
    await loadAggregateInto(state);
    state.aggregateSessions++;
    try { localStorage.setItem("sukoon_mi_aggregate", JSON.stringify({ tally: state.aggregateTally, sessions: state.aggregateSessions })); } catch (e) {}
    callbacks.onMemoryChange(state.memoryFacts, state.memoryEnabled);
    if (state.memoryFacts.length) {
      addBubble(callbacks, "assistant", "Hi again — glad you're back. Last time, " + state.memoryFacts[0].toLowerCase().replace(/\.$/, "") + " came up. Want to pick up from there, or start fresh?", null, ["Pick up from there", "Let's start fresh"]);
    } else {
      addStarterChips(callbacks, ["Specific question", "Change a habit", "Want to vent", "Something else on my mind"]);
    }
  }

  function setProfile(profile) { state.profile = profile; }

  async function setMemoryEnabled(enabled) {
    state.memoryEnabled = enabled;
    await saveMemoryEnabled(enabled);
    callbacks.onMemoryChange(state.memoryFacts, state.memoryEnabled);
  }

  async function forgetMemory() {
    state.memoryFacts = [];
    await saveMemory([]);
    callbacks.onMemoryChange(state.memoryFacts, state.memoryEnabled);
  }

  function getDebugSnapshot() {
    const s = computeMetrics(state.sessionTally), a = computeMetrics(state.aggregateTally);
    const withStatus = (metrics) => ({
      rq_ratio: { value: metrics.rq_ratio, status: bandStatus("rq_ratio", metrics.rq_ratio), target: MI_TARGETS.rq_ratio },
      pct_open: { value: metrics.pct_open, status: bandStatus("pct_open", metrics.pct_open), target: MI_TARGETS.pct_open },
      pct_complex: { value: metrics.pct_complex, status: bandStatus("pct_complex", metrics.pct_complex), target: MI_TARGETS.pct_complex },
      advice: metrics.advice,
      turns: metrics.turns,
    });
    return {
      session: withStatus(s),
      allTime: { sessions: state.aggregateSessions, ...withStatus(a) },
      raw: { ...state.sessionTally },
      minCodedTurnsBeforeSteering: MIN_CODED_TURNS_BEFORE_STEERING,
    };
  }

  async function resetAggregate() {
    state.aggregateTally = emptyTally();
    state.aggregateSessions = 0;
    try { localStorage.setItem("sukoon_mi_aggregate", JSON.stringify({ tally: state.aggregateTally, sessions: 0 })); } catch (e) {}
    callbacks.onFidelityUpdate();
  }

  function setModel(id) {
    state.selectedModel = id;
    saveSelectedModel(id);
  }

  // "Need help now" header button — shows crisis resources directly,
  // independent of anything the user has typed (matches the original's
  // helpBtn -> addCrisisCard wiring exactly).
  function showHelp() {
    addCrisisCard(callbacks);
  }

  return { sendMessage, init, setProfile, setMemoryEnabled, forgetMemory, getDebugSnapshot, resetAggregate, setModel, showHelp, MODEL_OPTIONS };
}
