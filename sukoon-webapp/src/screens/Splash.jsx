import { ShieldCheck, Leaf, ArrowRight } from "lucide-react";
import "./Splash.css";

// Simplified 2026-08-24 at the human's request: the feature-icon row, the
// separate "Create an account"/"Log in" links, and the (not-yet-wired-up)
// social sign-in row were cut so the screen isn't competing with itself.
// Logging in isn't lost -- Begin Your Journey lands on Auth, which has its
// own Sign up/Log in toggle right there. Remaining content (mascot,
// wordmark, tagline, CTA, secure line) is grouped and pushed toward the
// bottom of the screen (see .splash__content's margin-top: auto in
// Splash.css) so it doesn't cluster at the very top with a dead gap below.
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
        <button className="pill-button pill-button--primary splash__cta" onClick={onBegin}>
          Begin Your Journey <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p className="splash__secure"><ShieldCheck size={14} /> Your health data is private and secure</p>
      </div>
    </div>
  );
}
