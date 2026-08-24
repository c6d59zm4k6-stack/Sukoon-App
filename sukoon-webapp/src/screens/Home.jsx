import { Sparkles, ChevronRight, Bell, BookOpen } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { journeyLabel, journeyEmoji } from "../data/journeys.js";
import { consultationReminders } from "../data/reminders.js";
import { noticedMessage } from "../data/insights.js";
import { contentForJourneys } from "../data/library.js";
import "./Home.css";

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const TODAY_INDEX = 2; // mock: mid-week
const EVENT_DAYS = new Set([3, 5]); // mock: days with a reminder/appointment

export default function Home({ profile, onOpenPlan, onNavigateToCare, onOpenLibrary }) {
  const { name, journeys = [], plan } = profile ?? {};
  const currentPhase = plan?.phases?.find((p) => p.status === "current");
  const doneCount = currentPhase?.actions.filter((a) => a.done).length ?? 0;
  const totalCount = currentPhase?.actions.length ?? 0;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const noticed = noticedMessage(profile);
  const libraryPreview = contentForJourneys(journeys, 2);

  return (
    <div className="home-screen">
      <TopBar title={`Hi, ${name || "there"} 👋`} />

      <div className="home-screen__content">
        <div className="card home-screen__journey">
          <span className="home-screen__journey-emoji">{journeyEmoji(journeys)}</span>
          <div>
            <span className="home-screen__journey-label">Your journey</span>
            <strong>{journeyLabel(journeys)}</strong>
          </div>
        </div>

        <div className="card home-screen__calendar">
          {WEEK_DAYS.map((day, i) => (
            <div key={i} className={"home-screen__cal-col" + (i === TODAY_INDEX ? " is-today" : "")}>
              <span className="home-screen__cal-day">{day}</span>
              <span className="home-screen__cal-marker">
                {EVENT_DAYS.has(i) && <span className="home-screen__cal-dot" />}
              </span>
            </div>
          ))}
        </div>

        {currentPhase && (
          <section>
            <h2 className="section-title">Today's Plan</h2>
            <button className="card home-screen__plan" onClick={onOpenPlan}>
              <span className="home-screen__plan-icon"><Sparkles size={20} /></span>
              <div className="home-screen__plan-text">
                <strong>{currentPhase.title}</strong>
                <span>{doneCount} of {totalCount} steps done</span>
              </div>
              <ProgressRing percent={percent} size={48} />
              <ChevronRight size={18} color="var(--ink-soft)" />
            </button>
          </section>
        )}

        <section>
          <h2 className="section-title">Upcoming Medical Consultations</h2>
          <button className="card home-screen__consultations" onClick={onNavigateToCare}>
            {consultationReminders().map((c) => (
              <div className="home-screen__consultation" key={c.id}>
                <span className="home-screen__consultation-icon"><Bell size={16} /></span>
                <div className="home-screen__consultation-text">
                  <strong>{c.title}</strong>
                  <span>{c.subtitle}</span>
                </div>
                <span className="home-screen__badge">{c.badge}</span>
              </div>
            ))}
          </button>
        </section>

        <div className="card home-screen__noticed">
          <span className="home-screen__noticed-icon"><Sparkles size={18} /></span>
          <p>{noticed}</p>
        </div>

        {libraryPreview.length > 0 && (
          <section>
            <div className="section-title-row">
              <h2 className="section-title">For You</h2>
              <button type="button" className="link-btn" onClick={onOpenLibrary}>
                See all <ChevronRight size={14} />
              </button>
            </div>
            <div className="card home-screen__library">
              {libraryPreview.map((item) => (
                <button type="button" className="home-screen__library-item" key={item.id} onClick={onOpenLibrary}>
                  <span className="home-screen__library-icon"><BookOpen size={16} /></span>
                  <div className="home-screen__library-text">
                    <span className="home-screen__library-category">{item.category}</span>
                    <strong>{item.title}</strong>
                  </div>
                  <ChevronRight size={16} color="var(--ink-soft)" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
