import { useState } from "react";
import { CalendarHeart, Scale } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { HABITS, todayKey, lastNDays, currentStreak, habitCompletionPercent } from "../data/habits.js";
import { currentCycleDay, nextPeriodDate } from "../data/cycle.js";
import { HabitHeatmap, WeightTrend } from "../components/ProgressCharts.jsx";
import { CHECKIN_SCALE, isStruggleValue, suggestionForCheckin } from "../data/checkins.js";
import "./Track.css";

const MOODS = ["Low", "Okay", "Good"];
const ENERGY_LEVELS = ["Low", "Okay", "High"];
const SKIN_SYMPTOMS = ["Acne", "Hair thinning", "Bloating", "Fatigue"];

function totalCompletions(habitLog) {
  return Object.values(habitLog).reduce((sum, day) => sum + Object.values(day).filter(Boolean).length, 0);
}

export default function Track({ profile, onToggleHabit, onLogPeriod, onLogSymptom, onLogWeight, onLogCheckin }) {
  const tracking = profile?.tracking ?? { habitLog: {}, periods: [], symptomLog: {}, weightLog: [], checkinLog: {} };
  const key = todayKey();
  const todaysHabits = tracking.habitLog[key] || {};
  const todaysCheckin = tracking.checkinLog?.[key]?.value ?? null;
  const todaysSymptoms = tracking.symptomLog[key] || { mood: null, energy: null, skin: [] };
  const [weightInput, setWeightInput] = useState("");

  const cycleDay = currentCycleDay(tracking.periods);
  const predictedNext = nextPeriodDate(tracking.periods);
  const periodLoggedToday = tracking.periods.includes(key);
  const last14 = lastNDays(14);

  const weekDays = lastNDays(7);
  const last30 = lastNDays(30);
  const streak = currentStreak(tracking.habitLog);
  const goalsCompleted = totalCompletions(tracking.habitLog);

  const latestWeight = tracking.weightLog[tracking.weightLog.length - 1];

  const submitWeight = () => {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    onLogWeight(kg);
    setWeightInput("");
  };

  return (
    <div className="track-screen">
      <TopBar title="Track" tagline="A few taps a day is enough." />

      <div className="track-screen__content">
        <section>
          <h2 className="section-title">How did today go?</h2>
          <div className="card track-screen__checkin">
            <span className="track-screen__checkin-label">Sticking to your plan today</span>
            <div className="track-screen__checkin-row">
              {CHECKIN_SCALE.map(({ value, emoji, label }) => (
                <button
                  type="button"
                  key={value}
                  className={"track-screen__checkin-btn" + (todaysCheckin === value ? " is-selected" : "")}
                  onClick={() => onLogCheckin(value)}
                  aria-label={label}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {isStruggleValue(todaysCheckin) && (
              <p className="track-screen__checkin-suggestion">{suggestionForCheckin(profile)}</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="section-title">Today's Habits</h2>
          <div className="track-screen__habit-grid">
            {HABITS.map(({ id, label, Icon }) => {
              const done = !!todaysHabits[id];
              return (
                <button
                  type="button"
                  key={id}
                  className={"card track-screen__habit" + (done ? " is-done" : "")}
                  onClick={() => onToggleHabit(id)}
                >
                  <span className="track-screen__habit-icon"><Icon size={20} /></span>
                  <span>{label}</span>
                  <span className={"track-screen__check" + (done ? "" : " is-pending")}>{done ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="section-title">Your Cycle</h2>
          <div className="card track-screen__cycle">
            <div className="track-screen__cycle-row">
              <span className="track-screen__cycle-icon"><CalendarHeart size={20} /></span>
              <div className="track-screen__cycle-text">
                <strong>{cycleDay ? `Day ${cycleDay} of your cycle` : "No period logged yet"}</strong>
                <span>{predictedNext ? `Next period expected around ${predictedNext}` : "Log your period to get a prediction"}</span>
              </div>
            </div>
            <div className="track-screen__cal-dots">
              {last14.map((d) => {
                const dKey = todayKey(d);
                const isPeriod = tracking.periods.includes(dKey);
                return <span key={dKey} className={"track-screen__cal-dot" + (isPeriod ? " is-period" : "")} title={dKey} />;
              })}
            </div>
            <button
              type="button"
              className="track-screen__cycle-btn"
              disabled={periodLoggedToday}
              onClick={onLogPeriod}
            >
              {periodLoggedToday ? "Period logged today ✓" : "Log period start today"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="section-title">How are you feeling?</h2>
          <div className="card track-screen__feelings">
            <span className="track-screen__feelings-label">Mood</span>
            <div className="chip-row">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={"chip" + (todaysSymptoms.mood === m ? " is-active" : "")}
                  onClick={() => onLogSymptom("mood", m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="track-screen__feelings-label">Energy</span>
            <div className="chip-row">
              {ENERGY_LEVELS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={"chip" + (todaysSymptoms.energy === e ? " is-active" : "")}
                  onClick={() => onLogSymptom("energy", e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <span className="track-screen__feelings-label">Any of these today?</span>
            <div className="chip-row">
              {SKIN_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={"chip" + (todaysSymptoms.skin.includes(s) ? " is-active" : "")}
                  onClick={() => onLogSymptom("skin", s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title">This week</h2>
          <div className="card track-screen__weekly">
            <div className="track-screen__weekly-mid">
              <p className="track-screen__weekly-praise">Great going{profile?.name ? `, ${profile.name}` : ""}! 💜</p>
              <p className="track-screen__weekly-sub">You're building a healthier you.</p>
              <div className="track-screen__bars">
                {weekDays.map((d) => {
                  const dKey = todayKey(d);
                  const percent = habitCompletionPercent(tracking.habitLog[dKey]);
                  return (
                    <div key={dKey} className="track-screen__bar-col">
                      <div className="track-screen__bar" style={{ height: `${Math.max(percent * 100, 4)}%` }} />
                      <span>{d.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="track-screen__weekly-stats">
              <div><span>❤️ {streak}</span><small>Day streak</small></div>
              <div><span>🌿 {goalsCompleted}</span><small>Goals completed</small></div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title">Your Progress</h2>
          <div className="card track-screen__progress">
            <span className="track-screen__progress-label">Habit consistency, last 30 days</span>
            <HabitHeatmap habitLog={tracking.habitLog} days={last30} />
            {tracking.weightLog.length >= 2 && (
              <>
                <span className="track-screen__progress-label track-screen__progress-label--spaced">Weight trend</span>
                <WeightTrend weightLog={tracking.weightLog} />
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="section-title">Weight</h2>
          <div className="card track-screen__weight">
            <span className="track-screen__cycle-icon"><Scale size={20} /></span>
            <div className="track-screen__weight-text">
              <strong>{latestWeight ? `${latestWeight.kg} kg` : "No entries yet"}</strong>
              <span>{latestWeight ? `Last logged ${latestWeight.date}` : "Logged weekly, not daily"}</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="track-screen__weight-input"
            />
            <button type="button" className="track-screen__weight-btn" onClick={submitWeight}>Log</button>
          </div>
        </section>
      </div>
    </div>
  );
}
