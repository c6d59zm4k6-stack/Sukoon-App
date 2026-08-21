// Every journey gets the same 3-phase framework — lifestyle modification,
// medical supervision, then consistency — since that's the shared shape of
// care for lifestyle/age-based conditions. Only the specific actions inside
// each phase vary by journey.
export const PHASE_FRAMEWORK = [
  { id: "lifestyle", title: "Lifestyle Foundations" },
  { id: "medical", title: "Medical Care & Supervision" },
  { id: "consistency", title: "Consistency & Tracking" },
];

const JOURNEY_ACTIONS = {
  pcos: {
    lifestyle: ["Switch to low-GI, balanced meals", "20-minute walk after dinner", "Wind down screens before bed"],
    medical: ["Book an endocrinologist consult", "Discuss Metformin / Inositol options", "Get a baseline hormone panel"],
    consistency: ["Log symptoms 3x a week", "Weekly weigh-in", "Track your cycle every day"],
  },
  fertility: {
    lifestyle: ["Track ovulation daily", "Cut down caffeine & alcohol", "Prioritise 7-8 hours of sleep"],
    medical: ["Book an OB-GYN / fertility consult", "Ask about a fertility work-up panel", "Review any current medication with your doctor"],
    consistency: ["Log cycle & symptoms daily", "Weekly check-in with your plan", "Revisit your plan every 4 weeks"],
  },
  mental: {
    lifestyle: ["Keep a consistent sleep schedule", "5-minute daily journaling", "Short walk outdoors each day"],
    medical: ["Book a psychiatrist / therapist consult", "Discuss a sleep or mood assessment", "Review any current medication"],
    consistency: ["Log mood daily", "Weekly reflection check-in", "Track sleep every night"],
  },
  nutrition: {
    lifestyle: ["Plan balanced meals for the week", "Drink 8 glasses of water a day", "Reduce processed/sugary food"],
    medical: ["Book a nutritionist consult", "Get baseline bloodwork (iron, B12, vitamin D)", "Discuss any supplements with your doctor"],
    consistency: ["Log meals 3x a week", "Weekly weigh-in", "Track water intake daily"],
  },
  yoga: {
    lifestyle: ["3x a week gentle yoga sessions", "5-minute breathing practice daily", "Stretch before bed"],
    medical: ["Check in with a physiotherapist if needed", "Get cleared for movement if you have any injuries", "Discuss stress levels with your doctor"],
    consistency: ["Log movement sessions daily", "Weekly stretch/flexibility check-in", "Track stress levels weekly"],
  },
  general: {
    lifestyle: ["Balanced meals through the day", "30 minutes of movement daily", "Consistent sleep schedule"],
    medical: ["Book a general health check-up", "Get baseline bloodwork done", "Review family health history with your doctor"],
    consistency: ["Log how you're feeling daily", "Weekly health check-in", "Track sleep & water daily"],
  },
};

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function buildPlan(journeyIds = [], answers = {}) {
  const primary = journeyIds[0] ?? "general";
  const secondary = journeyIds.slice(1);

  const phases = PHASE_FRAMEWORK.map((phase, index) => {
    const primaryActions = JOURNEY_ACTIONS[primary]?.[phase.id] ?? JOURNEY_ACTIONS.general[phase.id];
    const extra = secondary
      .flatMap((id) => JOURNEY_ACTIONS[id]?.[phase.id]?.slice(0, 1) ?? [])
      .filter((label) => !primaryActions.includes(label));

    const actions = [...primaryActions, ...extra].slice(0, 4).map((label) => ({
      id: nextId("action"),
      label,
      done: false,
    }));

    return {
      id: phase.id,
      title: phase.title,
      status: index === 0 ? "current" : "upcoming",
      actions,
    };
  });

  return { phases, answers };
}
