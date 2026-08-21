import { Plus } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import "./Track.css";

const LOGS = [
  { emoji: "😌", label: "Mood", value: "Calm" },
  { emoji: "🌙", label: "Sleep", value: "7h 20m" },
  { emoji: "💧", label: "Water", value: "5 / 8 glasses" },
  { emoji: "🩸", label: "Cycle", value: "Day 12" },
];

const WEEK = [
  { day: "M", value: 0.4 }, { day: "T", value: 0.55 }, { day: "W", value: 0.5 },
  { day: "T", value: 0.65 }, { day: "F", value: 0.9 }, { day: "S", value: 0.7 }, { day: "S", value: 0.35 },
];

const WATER_TREND = [
  { day: "M", value: 0.6 }, { day: "T", value: 0.75 }, { day: "W", value: 0.5 },
  { day: "T", value: 0.85 }, { day: "F", value: 0.9 }, { day: "S", value: 0.65 }, { day: "S", value: 0.62 },
];

export default function Track() {
  return (
    <div className="track-screen">
      <TopBar title="Track" tagline="A few taps a day is enough." />

      <div className="track-screen__content">
        <section>
          <h2 className="section-title">Today's log</h2>
          <div className="track-screen__grid">
            {LOGS.map((l) => (
              <div className="card track-screen__item" key={l.label}>
                <span className="track-screen__emoji">{l.emoji}</span>
                <strong>{l.value}</strong>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </section>

        <button className="card track-screen__add">
          <Plus size={18} color="var(--indigo-mid)" />
          <span>Log something else</span>
        </button>

        <section>
          <h2 className="section-title">This week</h2>
          <div className="card track-screen__weekly">
            <div className="track-screen__weekly-mid">
              <p className="track-screen__weekly-praise">Great going, Ananya! 💜</p>
              <p className="track-screen__weekly-sub">You're building a healthier you.</p>
              <div className="track-screen__bars">
                {WEEK.map((d, i) => (
                  <div key={i} className="track-screen__bar-col">
                    <div className="track-screen__bar" style={{ height: `${d.value * 100}%` }} />
                    <span>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="track-screen__weekly-stats">
              <div><span>❤️ 4</span><small>Day streak</small></div>
              <div><span>🌿 12</span><small>Goals completed</small></div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="section-title">Water intake this week</h2>
          <div className="card track-screen__trend">
            <div className="track-screen__bars">
              {WATER_TREND.map((d, i) => (
                <div key={i} className="track-screen__bar-col">
                  <div className="track-screen__bar track-screen__bar--water" style={{ height: `${d.value * 100}%` }} />
                  <span>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
