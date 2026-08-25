import { useState } from "react";
import { Heart, Bell, ChevronDown, Download, MessageCircle, Mail, UtensilsCrossed, ExternalLink, Clock3 } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import { downloadPlanPdf } from "../utils/planPdf.js";
import { buildReportSummaryText } from "../data/planReport.js";
import { HABITS, todayKey } from "../data/habits.js";
import { REMINDERS } from "../data/reminders.js";
import { recipesForPlan, orderingTipsForPlan, ZOMATO_URL, SWIGGY_URL } from "../data/recipes.js";
import "./Plan.css";

const STATUS_LABEL = { current: "Current", upcoming: "Upcoming", done: "Done" };
const TEST_TAG_LABEL = { priority: "Priority", confirmatory: "Confirmatory", rule_out: "Rule out", base: "Baseline" };

export default function Plan({ profile }) {
  const phases = profile?.plan?.phases ?? [];
  const typeProfile = profile?.plan?.typeProfile;
  const tests = profile?.plan?.tests ?? [];
  const hasFullReport = Boolean(profile?.plan?.raw);
  const recipes = phases.length ? recipesForPlan(profile?.plan) : [];
  const orderingTips = phases.length ? orderingTipsForPlan(profile?.plan) : [];
  const todaysHabits = profile?.tracking?.habitLog?.[todayKey()] || {};
  const [expandedId, setExpandedId] = useState(
    () => phases.find((p) => p.status === "current")?.id
  );
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);

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

        {recipes.length > 0 && (
          <section>
            <h2 className="section-title">Recipes for You</h2>
            <div className="plan-screen__recipes">
              {recipes.map((r) => {
                const isRecipeOpen = expandedRecipeId === r.id;
                return (
                  <div className="card plan-screen__recipe" key={r.id}>
                    <div className="plan-screen__recipe-top">
                      <div className="plan-screen__recipe-icon"><UtensilsCrossed size={18} /></div>
                      <div className="plan-screen__recipe-text">
                        <strong>{r.name}</strong>
                        <span>{r.summary}</span>
                        <span className="plan-screen__recipe-why">{r.whyItHelps}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="plan-screen__recipe-view-btn"
                      onClick={() => setExpandedRecipeId(isRecipeOpen ? null : r.id)}
                    >
                      {isRecipeOpen ? "Hide recipe" : "View recipe"}
                      <ChevronDown size={14} className={"plan-screen__phase-chevron" + (isRecipeOpen ? " is-open" : "")} />
                    </button>

                    {isRecipeOpen && (
                      <div className="plan-screen__recipe-details">
                        <div>
                          <strong>Ingredients</strong>
                          <ul>
                            {r.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong>Steps</strong>
                          <ol>
                            {r.steps.map((step) => <li key={step}>{step}</li>)}
                          </ol>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            <div className="card plan-screen__ordering">
              <div className="plan-screen__ordering-head">
                <span className="plan-screen__recipe-icon"><Clock3 size={18} /></span>
                <strong>Too busy to cook?</strong>
              </div>
              <p className="plan-screen__ordering-sub">If you're ordering in or eating out today, here's what to actually look for on the menu:</p>
              <ul className="plan-screen__ordering-tips">
                {orderingTips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
              <div className="plan-screen__recipe-actions">
                <a className="plan-screen__recipe-link" href={ZOMATO_URL} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> Open Zomato
                </a>
                <a className="plan-screen__recipe-link" href={SWIGGY_URL} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> Open Swiggy
                </a>
              </div>
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
              <div className="plan-screen__reminder" key={r.id}>
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
