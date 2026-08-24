import { Heart, MessageCircle, Users, TrendingUp, ShieldCheck, Leaf, ArrowRight, Phone } from "lucide-react";
import "./Splash.css";

const FEATURES = [
  { Icon: Heart, label: "Personalised plans" },
  { Icon: MessageCircle, label: "24x7 AI companion" },
  { Icon: Users, label: "Trusted experts" },
  { Icon: TrendingUp, label: "Track what matters" },
];

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon(props) {
  return (
    <svg viewBox="0 0 384 512" width="15" height="15" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

const SOCIAL_PROVIDERS = [
  { key: "google", label: "Google", Icon: GoogleIcon },
  { key: "apple", label: "Apple", Icon: AppleIcon },
  { key: "phone", label: "Phone", Icon: Phone },
];

export default function Splash({ onBegin, onCreateAccount, onLogin }) {
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

        <ul className="splash__features">
          {FEATURES.map(({ Icon, label }) => (
            <li className="splash__feature" key={label}>
              <span className="splash__feature-icon"><Icon size={20} /></span>
              <span className="splash__feature-label">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="splash__footer">
        <button className="pill-button pill-button--primary splash__cta" onClick={onBegin}>
          Begin Your Journey <ArrowRight size={20} aria-hidden="true" />
        </button>
        <p className="splash__account">
          New here? <button className="splash__link" onClick={onCreateAccount}>Create an account</button>
        </p>
        <p className="splash__account">
          Already have an account? <button className="splash__link" onClick={onLogin}>Log in</button>
        </p>
        <p className="splash__divider"><span>or continue with</span></p>
        <div className="splash__social">
          {SOCIAL_PROVIDERS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className="splash__social-btn"
              disabled
              aria-disabled="true"
              aria-label={`Continue with ${label} — coming soon`}
            >
              <Icon className="splash__social-icon" />
              <span>{label}</span>
              <span className="splash__social-soon">Soon</span>
            </button>
          ))}
        </div>
        <p className="splash__secure"><ShieldCheck size={14} /> Your health data is private and secure</p>
      </div>
    </div>
  );
}
