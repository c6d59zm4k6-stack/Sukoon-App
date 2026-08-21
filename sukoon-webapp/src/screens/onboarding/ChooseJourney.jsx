import { useState } from "react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import { JOURNEYS } from "../../data/journeys.js";
import "./ChooseJourney.css";

export default function ChooseJourney({ onBack, onContinue }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
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
            return (
              <button
                key={j.id}
                className={"journey-card" + (isActive ? " is-active" : "")}
                onClick={() => toggle(j.id)}
              >
                <span className="journey-card__check" aria-hidden="true">
                  {isActive && "✓"}
                </span>
                <span className="journey-card__emoji" aria-hidden="true">{j.emoji}</span>
                <span className="journey-card__title">{j.title}</span>
                <span className="journey-card__desc">{j.desc}</span>
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
        <p className="choose-journey__note">🔒 Your data is private &amp; secure</p>
      </div>
    </div>
  );
}
