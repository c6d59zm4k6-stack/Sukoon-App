import { useState } from "react";
import { Heart, Bell, ChevronDown, Download, MessageCircle, Mail } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { downloadPlanPdf } from "../utils/planPdf.js";
import { buildReportSummaryText } from "../data/planReport.js";
import { HABITS, todayKey } from "../data/habits.js";
import "./Plan.css";

const REMINDERS = [
  { title: "Take Letrozole", subtitle: "9:00 AM • Take with water", badge: "Today" },
  { title: "Follicular scan", subtitle: "Day 10 • 11:30 AM", badge: "Tomorrow" },
];

const STATUS_LABEL = { current: "Current", upcoming: "Upcoming", done: "Done" };
const TEST_TAG_LABEL = { priority: "Priority", confirmatory: "Confirmatory", rule_out: "Rule out", base: "Baseline" };

export default function Plan({ profile }) {
  const phases = profile?.plan?.phases ?? [];
  const typeProfile = profile?.plan?.typeProfile;
  const tests = profile?.plan?.tests ?? [];
  const hasFullReport = Boolean(profile?.plan?.raw);
  const todaysHabits = profile?.tracking?.habitLog?.[todayKey()] || {};
  const [expandedId, setExpandedId] = useState(
    () => phases.find((p) => p.status === "current")?.id
  );

  const handleDownload = () => downloadPlanPdf(profile);

  const handleWhatsApp = () => {
    const text = buildReportSummaryText(profile) + "\n\n(I've downloaded the full PDF — attaching it here.)";
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = `${profile?.name ? profile.name + "'s" : "My"} Sukoon Health Plan`;
    const body = buildReportSummaryText(profile) + "\n\n(Remember to attach the downloaded PDF before sending.)";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="plan-screen">
      <TopBar title="Your Plan" tagline="A plan, just for you." />

      <div className="plan-screen__content">
        <div className="card plan-screen__hint">
          <span className="plan-screen__hint-icon"><Heart size={18} /></span>
          <p>Small daily steps can help you feel more like you again.</p>
        </div>

        {typeProfile && (
          <section>
            <h2 className="section-title">My Likely Type</h2>
            <div className="card plan-screen__type">
              <div className="plan-screen__type-tags">
                <span className="plan-screen__type-tag">{typeProfile.mainDriver}</span>
                {typeProfile.overlay && <span className="plan-screen__type-tag plan-screen__type-tag--overlay">{typeProfile.overlay}</span>}
                {typeProfile.ruleOut && <span className="plan-screen__type-tag plan-screen__type-tag--ruleout">Rule out: {typeProfile.ruleOut}</span>}
              </div>
              <strong className="plan-screen__type-title">{typeProfile.title}</strong>
              <p>{typeProfile.explanation}</p>
            </div>
          </section>
        )}

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

        {tests.length > 0 && (
          <section>
            <h2 className="section-title">Tests to Get</h2>
            <div className="card plan-screen__tests">
              {tests.map((t) => (
                <div className="plan-screen__test" key={t.name}>
                  <div className="plan-screen__test-text">
                    <strong>{t.name}</strong>
                    <span>{t.note}</span>
                  </div>
                  <span className={"plan-screen__badge plan-screen__badge--" + (t.tag || "base")}>
                    {TEST_TAG_LABEL[t.tag] || "Test"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasFullReport && (
          <section>
            <h2 className="section-title">Your Full Report</h2>
            <div className="card plan-screen__report">
              <p>Download your complete plan, or share it with someone you trust.</p>
              <div className="plan-screen__report-actions">
                <button type="button" onClick={handleDownload}>
                  <Download size={16} /> Download PDF
                </button>
                <button type="button" onClick={handleWhatsApp}>
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button type="button" onClick={handleEmail}>
                  <Mail size={16} /> Email
                </button>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title">Daily Progress</h2>
          <div className="plan-screen__daily-grid">
            {HABITS.map(({ id, label, Icon }) => {
              const done = !!todaysHabits[id];
              return (
                <div className="card plan-screen__daily-item" key={id}>
                  <div className="plan-screen__daily-icon"><Icon size={22} /></div>
                  <span>{label}</span>
                  <span className={"plan-screen__check" + (done ? "" : " is-pending")}>{done ? "✓" : ""}</span>
                </div>
              );
            })}
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
