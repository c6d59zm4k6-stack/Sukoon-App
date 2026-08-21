import { useState } from "react";
import { User, ChevronDown, MapPin } from "lucide-react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import "./AboutYou.css";

const TAGS = [
  "Irregular periods", "Weight concerns", "Acne / Skin issues",
  "Hair fall", "Sleep issues", "Anxiety / Stress", "Other",
];

export default function AboutYou({ onBack, onContinue }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Female");
  const [age, setAge] = useState("");
  const [tags, setTags] = useState(new Set());
  const [location, setLocation] = useState("");

  const toggleTag = (t) => {
    setTags((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  return (
    <div className="about-you">
      <OnboardingHeader
        title="Let's get to know you"
        subtitle="This helps us personalise your plans and support."
        onBack={onBack}
      />
      <form
        className="about-you__body"
        onSubmit={(e) => {
          e.preventDefault();
          onContinue({ name, gender, age, tags: [...tags], location });
        }}
      >
        <div className="about-you__card">
          <label className="field">
            <span className="field__label">What should we call you?</span>
            <span className="field__input">
              <User size={18} />
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </span>
          </label>

          <div className="field">
            <span className="field__label">Gender</span>
            <div className="segmented">
              {["Female", "Male", "Prefer not to say"].map((g) => (
                <button
                  type="button"
                  key={g}
                  className={"segmented__item" + (gender === g ? " is-active" : "")}
                  onClick={() => setGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field__label">Age</span>
            <span className="field__input">
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="" disabled>Select your age</option>
                {Array.from({ length: 63 }, (_, i) => i + 13).map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </span>
          </label>

          <div className="field">
            <span className="field__label">Anything we should know?</span>
            <span className="field__hint">Select all that apply (optional)</span>
            <div className="chip-row">
              {TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={"chip" + (tags.has(t) ? " is-active" : "")}
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field__label">Where are you located?</span>
            <span className="field__input">
              <MapPin size={18} />
              <input type="text" placeholder="Enter city or area (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
            </span>
          </label>
        </div>

        <button type="submit" className="pill-button pill-button--primary about-you__cta">
          Continue <span aria-hidden="true">→</span>
        </button>
        <p className="about-you__note">🔒 Your data is private &amp; secure</p>
      </form>
    </div>
  );
}
