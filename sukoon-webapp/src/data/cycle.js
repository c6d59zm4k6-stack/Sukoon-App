// Lightweight, client-side-only cycle math from logged period-start dates —
// no backend, same fidelity as the rest of the app's mocked tracking.
// Mirrors the basic Flo/Clue idea (average past cycle length -> predict the
// next one) without the depth those apps have (no flow intensity, no
// fertile-window modelling — that's real future scope, not this pass).
const DEFAULT_CYCLE_LENGTH = 28;

function sorted(periods) {
  return [...periods].sort();
}

// Parses a "YYYY-MM-DD" key as a UTC-midnight timestamp so day-diffs are
// exact — comparing it against `new Date()` (local "now", with a live
// time-of-day) instead would round the diff up depending on the reader's
// timezone offset (e.g. logging a period at 10pm IST reads as day 2, not 1).
function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function estimateCycleLength(periods) {
  if (periods.length < 2) return DEFAULT_CYCLE_LENGTH;
  const s = sorted(periods);
  const gaps = [];
  for (let i = 1; i < s.length; i++) {
    const days = Math.round((parseDateKey(s[i]) - parseDateKey(s[i - 1])) / 86400000);
    if (days >= 15 && days <= 60) gaps.push(days);
  }
  if (!gaps.length) return DEFAULT_CYCLE_LENGTH;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function currentCycleDay(periods, today = new Date()) {
  if (!periods.length) return null;
  const lastMs = parseDateKey(sorted(periods).slice(-1)[0]);
  const todayMs = parseDateKey(dateKey(today));
  const diffDays = Math.round((todayMs - lastMs) / 86400000);
  return diffDays >= 0 ? diffDays + 1 : null;
}

export function nextPeriodDate(periods) {
  if (!periods.length) return null;
  const cycleLen = estimateCycleLength(periods);
  const lastMs = parseDateKey(sorted(periods).slice(-1)[0]);
  const nextMs = lastMs + cycleLen * 86400000;
  return new Date(nextMs).toISOString().slice(0, 10);
}
