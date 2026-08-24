import { Heart, MessageCircle, Users, TrendingUp, ShieldCheck, Leaf, ArrowRight } from "lucide-react";
import "./Splash.css";

// Simplified 2026-08-24 at the human's request: the separate "Create an
// account"/"Log in" links and the (not-yet-wired-up) social sign-in row
// were cut so the screen isn't competing with itself. Logging in isn't
// lost -- the CTA lands on Auth, which has its own Sign up/Log in toggle
// right there. Mascot/wordmark/tagline stay pinned at their original top
// position; the feature row was asked back afterward, now placed directly
// above the CTA (in the footer) rather than under the tagline where it
// used to sit.
const FEATURES = [
  { Icon: Heart, label: "Personalised plans" },
  { Icon: MessageCircle, label: "24x7 AI companion" },
  { Icon: Users, label: "Trusted experts" },
  { Icon: TrendingUp, label: "Track what matters" },
];

export default function Splash({ onBegin }) {
  return (
    <div className="splash">
      <div className="splash__art" aria-hidden="true" />
      <div className="splash__gradient" aria-hidden="true" />

      <div className="splash__content">
        <img className="splash__mascot" src="/brand/mascot-cloud.png" alt="" aria-hidden="true" />
        <h1 className="splash__wordmark">
          <span className="splash__wordmark-inner">
            <span className="splash__leaf" aria-hidden="true"><Leaf size={14} /></span>
            Sukoon Health
          </span>
        </h1>
        <p className="splash__tagline">Your journey. Your plan. Your peace.</p>
      </div>

      <div className="splash__footer">
        <ul className="splash__features">
          {FEATURES.map(({ Icon, label }) => (
            <li className="splash__feature" key={label}>
              <span className="splash__feature-icon"><Icon size={20} /></span>
              <span className="splash__feature-label">{label}</span>
            </li>
          ))}
        </ul>
        <button className="pill-button pill-button--primary splash__cta" onClick={onBegin}>
          Continue to Your Journey <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p className="splash__secure"><ShieldCheck size={14} /> Your health data is private and secure</p>
      </div>
    </div>
  );
}
