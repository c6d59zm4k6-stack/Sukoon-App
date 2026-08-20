import { ChevronLeft } from "lucide-react";
import "./OnboardingHeader.css";

export default function OnboardingHeader({ title, subtitle, onBack }) {
  return (
    <div className="onboarding-header">
      <div className="onboarding-header__art" aria-hidden="true" />
      <div className="onboarding-header__scrim" aria-hidden="true" />
      <button className="onboarding-header__back" onClick={onBack} aria-label="Go back">
        <ChevronLeft size={20} />
      </button>
      <div className="onboarding-header__content">
        <img className="onboarding-header__mascot" src="/brand/sukoon-logo-mascot.svg" alt="" aria-hidden="true" />
        <h1>{title} <span aria-hidden="true">🌿</span></h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
