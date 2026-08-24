// Home's "Sukoon noticed" card — replaces the earlier first-draft version,
// which picked one of 3 fixed strings by day-of-week (new Date().getDay() %
// 3), completely unrelated to what the person had actually logged. This
// looks at real tracking/plan state and picks the single most relevant
// thing to say, most-specific signal first, falling back to something
// honest ("nothing to notice yet") for a brand-new user rather than
// claiming a pattern that doesn't exist.
import { HABITS, todayKey, lastNDays, currentStreak, countHabitDays } from "./habits.js";
import { daysUntilNextPeriod } from "./cycle.js";

function recentMoodTrend(symptomLog, days) {
  const moods = days.map((d) => symptomLog[todayKey(d)]?.mood).filter(Boolean);
  if (moods.length < 3) return null;
  const goodShare = moods.filter((m) => m === "Good").length / moods.length;
  const lowShare = moods.filter((m) => m === "Low").length / moods.length;
  if (goodShare >= 0.6) return "good";
  if (lowShare >= 0.6) return "low";
  return null;
}

function hasLoggedAnything(tracking) {
  return Boolean(
    Object.keys(tracking.habitLog ?? {}).length ||
    (tracking.periods ?? []).length ||
    Object.keys(tracking.symptomLog ?? {}).length ||
    (tracking.weightLog ?? []).length
  );
}

export function noticedMessage(profile) {
  const name = profile?.name;
  const tracking = profile?.tracking ?? { habitLog: {}, periods: [], symptomLog: {}, weightLog: [] };
  const plan = profile?.plan;
  const last7 = lastNDays(7);

  const streak = currentStreak(tracking.habitLog);
  if (streak >= 3) {
    return `Sukoon noticed you've kept up your daily habits ${streak} days running — that consistency is exactly what moves the needle 💜`;
  }

  const waterDays = countHabitDays(tracking.habitLog, "water", last7);
  if (waterDays >= 5) {
    return `Sukoon noticed you've logged water ${waterDays} of the last 7 days — small wins add up 💧`;
  }

  const moodTrend = recentMoodTrend(tracking.symptomLog, last7);
  if (moodTrend === "good") {
    return "Sukoon noticed you've been feeling good the past few days. Here's to keeping that going 🌿";
  }
  if (moodTrend === "low") {
    return "Sukoon noticed the last few days have felt heavier than usual. No pressure — just here whenever you want to talk.";
  }

  const daysToNextPeriod = daysUntilNextPeriod(tracking.periods);
  if (daysToNextPeriod !== null && daysToNextPeriod <= 2 && daysToNextPeriod >= -3) {
    return "Sukoon noticed your next period is expected any day now — logging it when it starts keeps your predictions sharp.";
  }

  const currentPhase = plan?.phases?.find((p) => p.status === "current");
  if (currentPhase?.actions?.length) {
    const done = currentPhase.actions.filter((a) => a.done).length;
    if (done === currentPhase.actions.length) {
      return `Sukoon noticed you've completed every step in "${currentPhase.title}" — ready to see what's next in your plan? ✨`;
    }
  }

  const activeThisWeek = last7.some((d) => {
    const log = tracking.habitLog[todayKey(d)];
    return log && HABITS.some((h) => log[h.id]);
  });
  if (!activeThisWeek && hasLoggedAnything(tracking)) {
    return "Sukoon noticed it's been a few days since your last check-in — no pressure, just here when you're ready.";
  }

  if (!hasLoggedAnything(tracking)) {
    return `Welcome${name ? ", " + name : ""} 👋 Log a habit, your mood, or your cycle on the Track tab, and Sukoon will start noticing your patterns here.`;
  }

  return "Sukoon noticed you're off to a good start — keep logging, and this space will fill up with your own patterns 🌱";
}
