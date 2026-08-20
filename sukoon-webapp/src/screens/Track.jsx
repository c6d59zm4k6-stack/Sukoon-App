import { Plus } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import "./Track.css";

const LOGS = [
  { emoji: "😌", label: "Mood", value: "Calm" },
  { emoji: "🌙", label: "Sleep", value: "7h 20m" },
  { emoji: "💧", label: "Water", value: "5 / 8 glasses" },
  { emoji: "🩸", label: "Cycle", value: "Day 12" },
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
          <div className="card track-screen__placeholder">
            <p>Your trends will show up here once you've logged a few days.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
