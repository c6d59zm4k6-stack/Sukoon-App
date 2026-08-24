// Single source of truth for upcoming reminders — previously Home.jsx and
// Plan.jsx each hardcoded their own separate mock list (an audit found they
// partially overlapped and could silently drift). Home shows consultations
// only (its "Upcoming Medical Consultations" card); Plan shows everything,
// medication included, in "Upcoming Reminders". Same mock-data fidelity as
// the rest of the app — no backend yet, just one array instead of two.
export const REMINDERS = [
  { id: "letrozole", title: "Take Letrozole", subtitle: "9:00 AM • Take with water", badge: "Today", type: "medication" },
  { id: "follicular-scan", title: "Follicular scan", subtitle: "Day 10 • 11:30 AM", badge: "Tomorrow", type: "consultation" },
  { id: "nutritionist-checkin", title: "Nutritionist check-in", subtitle: "Fri • 4:00 PM", badge: "This week", type: "consultation" },
];

export function consultationReminders() {
  return REMINDERS.filter((r) => r.type === "consultation");
}
