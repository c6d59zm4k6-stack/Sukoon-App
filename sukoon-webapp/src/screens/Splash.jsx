import { Heart, MessageCircle, Users, TrendingUp, ShieldCheck } from "lucide-react";
import "./Splash.css";

const FEATURES = [
  { Icon: Heart, label: "Personalised plans" },
  { Icon: MessageCircle, label: "AI companion that listens" },
  { Icon: Users, label: "Trusted experts" },
  { Icon: TrendingUp, label: "Track what matters" },
];

export default function Splash({ onBegin, onCreateAccount }) {
  return (
    <div className="splash">
      <div className="splash__sky" aria-hidden="true" />
      <div className="splash__art" aria-hidden="true" />
      <div className="splash__gradient" aria-hidden="true" />

      <div className="splash__content">
        <img className="splash__mascot" src="/brand/sukoon-logo-mascot.svg" alt="" aria-hidden="true" />
        <h1 className="splash__wordmark">Sukoon <span aria-hidden="true">🌿</span></h1>
        <p className="splash__tagline">Your journey. Your plan. Your peace.</p>

        <div className="splash__features">
          {FEATURES.map(({ Icon, label }) => (
            <div className="splash__feature" key={label}>
              <div className="splash__feature-icon"><Icon size={20} /></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="splash__footer">
        <button className="pill-button pill-button--primary splash__cta" onClick={onBegin}>
          Begin Your Journey <span aria-hidden="true">→</span>
        </button>
        <p className="splash__account">
          New here? <button className="splash__link" onClick={onCreateAccount}>Create an account</button>
        </p>
        <p className="splash__divider"><span>or continue with</span></p>
        <div className="splash__social">
          <button className="splash__social-btn">Google</button>
          <button className="splash__social-btn">Apple</button>
        </div>
        <p className="splash__secure"><ShieldCheck size={14} /> Your health data is private and secure</p>
      </div>
    </div>
  );
}
