import { todayKey, lastNDays } from "./habits.js";

// The daily plan-adherence check-in: one low-friction gesture ("how did
// today go against your plan?") instead of itemized logging. Deliberately
// separate from habitLog/symptomLog -- research on tracking fatigue (high
// activation cost when tired/busy/stressed, "future you" not being around
// to do Sunday's planning) says the one thing that should be effortless
// every day is a single gestalt judgment, not a checklist. Everything else
// on Track stays optional detail, unchanged.
export const CHECKIN_SCALE = [
  { value: 1, emoji: "😞", label: "Struggled" },
  { value: 2, emoji: "😕", label: "Off track" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const STRUGGLE_MAX_VALUE = 2; // 1-2 counts as "struggled" for today
const STRUGGLE_WINDOW_DAYS = 7;
const STRUGGLE_COUNT_TO_FLAG = 3; // 3+ struggling days in the window

export function isStruggleValue(value) {
  return value != null && value <= STRUGGLE_MAX_VALUE;
}

// Whether the trailing week has enough struggling check-ins to flag this
// person for their care team -- the actual trigger, computed and stored
// (tracking.flaggedForExpertAt) so it's queryable once an expert-facing
// surface exists. No such surface is built yet; this only maintains the
// underlying fact.
export function hasStrugglePattern(checkinLog) {
  const recentDays = lastNDays(STRUGGLE_WINDOW_DAYS);
  const struggleCount = recentDays.filter((d) => isStruggleValue(checkinLog[todayKey(d)]?.value)).length;
  return struggleCount >= STRUGGLE_COUNT_TO_FLAG;
}

// Small, on-the-spot modifications for a struggling day -- aimed at
// lowering activation cost (the actual research-backed problem: healthy
// choices need more decisions/steps than convenient ones, especially when
// tired), not at willpower or more tracking. Driver-matched where a plan
// exists, same pattern as recipes.js's ordering tips; a general fallback
// otherwise.
const DRIVER_STRUGGLE_TIPS = {
  "Insulin-driven": "Skip cooking tonight if you need to — just pair whatever you do eat with something protein-forward (curd, dal, an egg) so it's not carbs alone.",
  "Gut-inflammation-driven": "No energy to cook a full meal? A simple curd- or dal-based side with whatever's quick still keeps today gut-friendly.",
  "Androgen-driven": "If today's a wash, just don't let it turn into a sugary drink or fried snack by default — plain water or chaas is an equally low-effort swap.",
  "Stress-driven": "On a rough day, the sleep-focused habit matters more than the food ones — prioritize winding down over anything else on the list tonight.",
};
const GENERAL_STRUGGLE_TIP = "One small thing counts: pick the single easiest habit on your list and just do that one today. Tomorrow can carry the rest.";

export function suggestionForCheckin(profile) {
  const driver = profile?.plan?.typeProfile?.mainDriver;
  return DRIVER_STRUGGLE_TIPS[driver] || GENERAL_STRUGGLE_TIP;
}
