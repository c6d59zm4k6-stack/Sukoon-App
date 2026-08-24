// Shared "what does the AI already know" summarizers, used by both the
// Plan Questionnaire and the Doctor Concierge system prompts so a
// returning user's existing plan and recent tracking history inform the
// conversation instead of being ignored.
import { todayKey, lastNDays } from "./habits.js";

export function summarizePlan(plan) {
  if (!plan || !plan.phases?.length) return null;
  const lines = [];
  if (plan.typeProfile?.title) {
    const driver = [plan.typeProfile.mainDriver, plan.typeProfile.overlay].filter(Boolean).join(", ");
    lines.push(`Existing plan type: ${plan.typeProfile.title}${driver ? ` (${driver})` : ""}.`);
  }
  if (plan.typeProfile?.explanation) lines.push(plan.typeProfile.explanation);
  const currentPhase = plan.phases.find((p) => p.status === "current");
  if (currentPhase) {
    const doneCount = currentPhase.actions?.filter((a) => a.done).length ?? 0;
    lines.push(`Currently in the "${currentPhase.title}" phase (${doneCount}/${currentPhase.actions?.length ?? 0} actions done).`);
  }
  if (plan.tests?.length) lines.push(`Suggested tests on file: ${plan.tests.map((t) => t.name).join(", ")}.`);
  return lines.length ? lines.join(" ") : null;
}

export function summarizeTracking(tracking) {
  if (!tracking) return null;
  const days = lastNDays(7);
  const activeDays = days.filter((d) => {
    const log = tracking.habitLog?.[todayKey(d)];
    return log && Object.values(log).some(Boolean);
  }).length;
  const recentPeriods = (tracking.periods || []).slice(-3);
  const lastWeight = tracking.weightLog?.length ? tracking.weightLog[tracking.weightLog.length - 1] : null;

  const lines = [];
  if (activeDays) lines.push(`Logged at least one habit on ${activeDays}/7 of the last 7 days.`);
  if (recentPeriods.length) lines.push(`Recent period log dates: ${recentPeriods.join(", ")}.`);
  if (lastWeight) lines.push(`Last logged weight: ${lastWeight.kg}kg on ${lastWeight.date}.`);
  return lines.length ? lines.join(" ") : null;
}
