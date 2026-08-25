// Supabase-backed persistence for profile + tracking data. The signup
// trigger in supabase/schema.sql guarantees a profiles/tracking row
// already exists for any authenticated user, so saves here are always
// UPDATE, never INSERT.
import { supabase } from "../lib/supabaseClient.js";

export const EMPTY_PLAN = { phases: [], answers: {} };
export const EMPTY_TRACKING = {
  habitLog: {}, periods: [], symptomLog: {}, weightLog: [],
  checkinLog: {}, flaggedForExpertAt: null,
};
export const EMPTY_PROFILE = {
  name: "", gender: "", age: "", tags: [], location: "",
  journeys: [], quizAnswers: {}, plan: EMPTY_PLAN, tracking: EMPTY_TRACKING,
  expertNotificationsEnabled: false,
};

function rowToProfile(row) {
  if (!row) return { ...EMPTY_PROFILE };
  return {
    name: row.name ?? "",
    gender: row.gender ?? "",
    age: row.age != null ? String(row.age) : "",
    tags: row.tags ?? [],
    location: row.location ?? "",
    journeys: row.journeys ?? [],
    quizAnswers: row.quiz_answers ?? {},
    plan: row.plan ?? EMPTY_PLAN,
    expertNotificationsEnabled: row.expert_notifications_enabled ?? false,
  };
}

function rowToTracking(row) {
  if (!row) return { ...EMPTY_TRACKING };
  return {
    habitLog: row.habit_log ?? {},
    periods: row.periods ?? [],
    symptomLog: row.symptom_log ?? {},
    weightLog: row.weight_log ?? [],
    checkinLog: row.checkin_log ?? {},
    flaggedForExpertAt: row.flagged_for_expert_at ?? null,
  };
}

// A fetch failure must never hard-crash the app -- log and fall back
// to empty defaults, same as a brand new signup would see.
export async function fetchUserData(userId) {
  const [{ data: profileRow, error: profileError }, { data: trackingRow, error: trackingError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("tracking").select("*").eq("user_id", userId).single(),
    ]);
  if (profileError) console.error("fetchUserData: profile fetch failed", profileError);
  if (trackingError) console.error("fetchUserData: tracking fetch failed", trackingError);
  return { profile: rowToProfile(profileRow), tracking: rowToTracking(trackingRow) };
}

const PROFILE_FIELD_TO_COLUMN = {
  name: "name",
  gender: "gender",
  location: "location",
  tags: "tags",
  journeys: "journeys",
  plan: "plan",
  expertNotificationsEnabled: "expert_notifications_enabled",
};

export async function saveProfileFields(userId, fields) {
  const update = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === "age") {
      update.age = value ? Number(value) : null;
    } else if (key === "quizAnswers") {
      update.quiz_answers = value;
    } else if (PROFILE_FIELD_TO_COLUMN[key]) {
      update[PROFILE_FIELD_TO_COLUMN[key]] = value;
    }
  }
  if (!Object.keys(update).length) return;
  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) console.error("saveProfileFields failed", error);
}

export async function saveTracking(userId, tracking) {
  const { error } = await supabase
    .from("tracking")
    .update({
      habit_log: tracking.habitLog,
      periods: tracking.periods,
      symptom_log: tracking.symptomLog,
      weight_log: tracking.weightLog,
      checkin_log: tracking.checkinLog,
      flagged_for_expert_at: tracking.flaggedForExpertAt,
    })
    .eq("user_id", userId);
  if (error) console.error("saveTracking failed", error);
}
