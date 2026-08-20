import { useState } from "react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import "./ChooseJourney.css";

const JOURNEYS = [
  { id: "pcos", emoji: "🌸", title: "PCOS Care", desc: "Manage PCOS, balance hormones & improve well-being" },
  { id: "fertility", emoji: "🪷", title: "Fertility & Trying to Conceive", desc: "Support for your fertility journey and conception" },
  { id: "mental", emoji: "🧠", title: "Mental Well-being", desc: "Sleep, anxiety, depression & habit change support" },
  { id: "nutrition", emoji: "🥗", title: "Nutrition & Lifestyle", desc: "Healthy eating, weight management & lifestyle guidance" },
  { id: "yoga", emoji: "🧘", title: "Yoga & Movement", desc: "Yoga, mindful movement & stress relief" },
  { id: "general", emoji: "🩺", title: "General Health", desc: "General consultations & everyday health" },
];

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
