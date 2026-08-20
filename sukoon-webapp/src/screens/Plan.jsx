import { Heart, Bell, ChevronRight, Sparkles, Salad, Droplet, Footprints, Brain } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import "./Plan.css";

const DAILY_PROGRESS = [
  { Icon: Salad, label: "Eat balanced meals", done: true },
  { Icon: Droplet, label: "Drink more water", done: true },
  { Icon: Footprints, label: "Walk / Move 10 min", done: false, percent: 60 },
  { Icon: Brain, label: "Mind care moment", done: false, percent: 20 },
];

const WEEK = [
  { day: "M", value: 0.4 }, { day: "T", value: 0.55 }, { day: "W", value: 0.5 },
  { day: "T", value: 0.65 }, { day: "F", value: 0.9 }, { day: "S", value: 0.7 }, { day: "S", value: 0.35 },
];

const REMINDERS = [
  { title: "Take Letrozole", subtitle: "9:00 AM • Take with water", badge: "Today" },
  { title: "Follicular scan", subtitle: "Day 10 • 11:30 AM", badge: "Tomorrow" },
];

export default function Plan() {
  return (
    <div className="plan-screen">
      <TopBar title="Your Plan" tagline="A plan, just for you." />

      <div className="plan-screen__content">
        <div className="card plan-screen__hint">
          <span className="plan-screen__hint-icon"><Heart size={18} /></span>
          <p>Small daily steps can help you feel more like you again.</p>
        </div>

        <section>
          <h2 className="section-title">Today's Focus</h2>
          <div className="card plan-screen__focus">
            <span className="plan-screen__focus-icon"><Sparkles size={20} /></span>
            <div className="plan-screen__focus-text">
              <strong>Boost energy &amp; reduce cravings</strong>
              <span>2 of 5 steps done</span>
            </div>
            <ProgressRing percent={40} size={54} label="Today" />
            <ChevronRight size={18} color="var(--ink-soft)" />
          </div>
        </section>

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
          <div className="section-title-row">
            <h2 className="section-title">Weekly Overview</h2>
            <button className="link-btn">View all <ChevronRight size={14} /></button>
          </div>
          <div className="card plan-screen__weekly">
            <ProgressRing percent={65} size={72} label="This week" />
            <div className="plan-screen__weekly-mid">
              <p className="plan-screen__weekly-praise">Great going, Ananya! 💜</p>
              <p className="plan-screen__weekly-sub">You're building a healthier you.</p>
              <div className="plan-screen__bars">
                {WEEK.map((d, i) => (
                  <div key={i} className="plan-screen__bar-col">
                    <div className="plan-screen__bar" style={{ height: `${d.value * 100}%` }} />
                    <span>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="plan-screen__weekly-stats">
              <div><span>❤️ 4</span><small>Day streak</small></div>
              <div><span>🌿 12</span><small>Goals completed</small></div>
            </div>
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
