import { useState } from "react";
import { Heart, Bell, ChevronDown, Salad, Droplet, Footprints, Brain } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import "./Plan.css";

const DAILY_PROGRESS = [
  { Icon: Salad, label: "Eat balanced meals", done: true },
  { Icon: Droplet, label: "Drink more water", done: true },
  { Icon: Footprints, label: "Walk / Move 10 min", done: false, percent: 60 },
  { Icon: Brain, label: "Mind care moment", done: false, percent: 20 },
];

const REMINDERS = [
  { title: "Take Letrozole", subtitle: "9:00 AM • Take with water", badge: "Today" },
  { title: "Follicular scan", subtitle: "Day 10 • 11:30 AM", badge: "Tomorrow" },
];

const STATUS_LABEL = { current: "Current", upcoming: "Upcoming", done: "Done" };

export default function Plan({ profile }) {
  const phases = profile?.plan?.phases ?? [];
  const [expandedId, setExpandedId] = useState(
    () => phases.find((p) => p.status === "current")?.id
  );

  return (
    <div className="plan-screen">
      <TopBar title="Your Plan" tagline="A plan, just for you." />

      <div className="plan-screen__content">
        <div className="card plan-screen__hint">
          <span className="plan-screen__hint-icon"><Heart size={18} /></span>
          <p>Small daily steps can help you feel more like you again.</p>
        </div>

        {phases.length > 0 && (
          <section>
            <h2 className="section-title">Full Roadmap</h2>
            <div className="plan-screen__roadmap">
              {phases.map((phase) => {
                const isExpanded = expandedId === phase.id;
                const done = phase.actions.filter((a) => a.done).length;
                const total = phase.actions.length;
                const percent = total ? Math.round((done / total) * 100) : 0;
                return (
                  <div className="card plan-screen__phase" key={phase.id}>
                    <button
                      type="button"
                      className="plan-screen__phase-header"
                      onClick={() => setExpandedId(isExpanded ? null : phase.id)}
                    >
                      <div className="plan-screen__phase-text">
                        <span className={"plan-screen__badge plan-screen__badge--" + phase.status}>
                          {STATUS_LABEL[phase.status]}
                        </span>
                        <strong>{phase.title}</strong>
                        <span>{done} of {total} done</span>
                      </div>
                      <ProgressRing percent={percent} size={40} stroke={4} />
                      <ChevronDown
                        size={18}
                        color="var(--ink-soft)"
                        className={"plan-screen__phase-chevron" + (isExpanded ? " is-open" : "")}
                      />
                    </button>
                    {isExpanded && (
                      <ul className="plan-screen__phase-actions">
                        {phase.actions.map((a) => (
                          <li key={a.id}>
                            <span className={"plan-screen__check" + (a.done ? "" : " is-pending")}>
                              {a.done ? "✓" : ""}
                            </span>
                            <span>{a.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title">Daily Progress</h2>
          <div className="plan-screen__daily-grid">
            {DAILY_PROGRESS.map(({ Icon, label, done, percent }) => (
              <div className="card plan-screen__daily-item" key={label}>
                <div className="plan-screen__daily-icon"><Icon size={22} /></div>
                <span>{label}</span>
                {done ? (
                  <span className="plan-screen__check">✓</span>
                ) : (
                  <ProgressRing percent={percent} size={26} stroke={3} />
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">Upcoming Reminders</h2>
          <div className="card plan-screen__reminders">
            {REMINDERS.map((r) => (
              <div className="plan-screen__reminder" key={r.title}>
                <span className="plan-screen__reminder-icon"><Bell size={18} /></span>
                <div className="plan-screen__reminder-text">
                  <strong>{r.title}</strong>
                  <span>{r.subtitle}</span>
                </div>
                <span className="plan-screen__badge">{r.badge}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
