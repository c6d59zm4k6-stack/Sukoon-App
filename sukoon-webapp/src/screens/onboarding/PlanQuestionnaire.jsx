import { useState } from "react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import { buildPlan } from "../../data/planTemplates.js";
import "./PlanQuestionnaire.css";

const QUESTIONS = [
  {
    id: "goal",
    type: "select",
    question: "What's your main goal right now?",
    options: [
      "Feel more in control of my symptoms",
      "Build a consistent routine",
      "Get medical guidance",
      "Track my progress over time",
    ],
  },
  {
    id: "concerns",
    type: "multiselect",
    question: "Anything specific you'd like to flag?",
    hint: "Select all that apply (optional)",
    options: [
      "Irregular periods", "Weight changes", "Low energy",
      "Sleep issues", "Mood swings", "Skin / hair changes",
    ],
  },
  {
    id: "activity",
    type: "select",
    question: "How active are you day-to-day?",
    options: ["Mostly sedentary", "Lightly active", "Active", "Very active"],
  },
  {
    id: "medicalSupport",
    type: "select",
    question: "Do you currently see a doctor for this?",
    options: [
      "Yes, regularly", "Occasionally",
      "Not yet, but open to it", "Prefer to start with lifestyle first",
    ],
  },
  {
    id: "reminderTime",
    type: "select",
    question: "When should we check in with you?",
    options: ["Mornings", "Afternoons", "Evenings", "Don't remind me"],
  },
];

export default function PlanQuestionnaire({ journeys, onBack, onContinue }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const value = answers[q.id];
  const canContinue = q.type === "multiselect" || !!value;

  const selectSingle = (option) => {
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
  };

  const toggleMulti = (option) => {
    setAnswers((prev) => {
      const current = new Set(prev[q.id] ?? []);
      current.has(option) ? current.delete(option) : current.add(option);
      return { ...prev, [q.id]: [...current] };
    });
  };

  const handleNext = () => {
    if (isLast) {
      onContinue({ answers, plan: buildPlan(journeys, answers) });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  };

  return (
    <div className="plan-quiz">
      <OnboardingHeader
        title="Building your plan"
        subtitle={`Question ${step + 1} of ${QUESTIONS.length}`}
        onBack={handleBack}
      />
      <div className="plan-quiz__body">
        <div className="plan-quiz__card">
          <p className="plan-quiz__question">{q.question}</p>
          {q.hint && <p className="plan-quiz__hint">{q.hint}</p>}
          <div className="chip-row plan-quiz__options">
            {q.options.map((option) => {
              const isActive = q.type === "multiselect"
                ? (value ?? []).includes(option)
                : value === option;
              return (
                <button
                  type="button"
                  key={option}
                  className={"chip" + (isActive ? " is-active" : "")}
                  onClick={() => (q.type === "multiselect" ? toggleMulti(option) : selectSingle(option))}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="plan-quiz__footer">
        <button
          className="pill-button pill-button--primary plan-quiz__cta"
          disabled={!canContinue}
          onClick={handleNext}
        >
          {isLast ? "Generate my plan" : "Next"} <span aria-hidden="true">→</span>
        </button>
        <p className="plan-quiz__note">🔒 Your data is private &amp; secure</p>
      </div>
    </div>
  );
}
