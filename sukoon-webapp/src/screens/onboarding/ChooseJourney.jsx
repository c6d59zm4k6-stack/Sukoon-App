import { useState } from "react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import { JOURNEYS } from "../../data/journeys.js";
import "./ChooseJourney.css";

// Only PCOS Care is live for now — the other journeys are shown greyed out
// (not hidden, so people can see what's coming) rather than removed.
const ENABLED_JOURNEYS = new Set(["pcos"]);

export default function ChooseJourney({ onBack, onContinue, onSkip }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    if (!ENABLED_JOURNEYS.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="choose-journey">
      <OnboardingHeader
        title="Choose Your Journey"
        subtitle="What brings you to Sukoon today?"
        onBack={onBack}
      />
      <div className="choose-journey__body">
        <div className="choose-journey__grid">
          {JOURNEYS.map((j) => {
            const isActive = selected.has(j.id);
            const isEnabled = ENABLED_JOURNEYS.has(j.id);
            return (
              <button
                key={j.id}
                className={"journey-card" + (isActive ? " is-active" : "") + (isEnabled ? "" : " is-disabled")}
                onClick={() => toggle(j.id)}
                disabled={!isEnabled}
                aria-disabled={!isEnabled}
              >
                <span className="journey-card__check" aria-hidden="true">
                  {isActive && "✓"}
                </span>
                <span className="journey-card__emoji" aria-hidden="true">{j.emoji}</span>
                <span className="journey-card__title">{j.title}</span>
                <span className="journey-card__desc">{j.desc}</span>
                {!isEnabled && <span className="journey-card__soon">Coming soon</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="choose-journey__footer">
        <button
          className="pill-button pill-button--primary choose-journey__cta"
          disabled={selected.size === 0}
          onClick={() => onContinue([...selected])}
        >
          Continue <span aria-hidden="true">→</span>
        </button>
        {onSkip && (
          <button type="button" className="choose-journey__skip" onClick={onSkip}>
            Skip for now, take me to the app
          </button>
        )}
        <p className="choose-journey__note">🔒 Your data is private &amp; secure</p>
      </div>
    </div>
  );
}
