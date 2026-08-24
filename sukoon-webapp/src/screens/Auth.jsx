import { useState } from "react";
import { Mail, Lock, MailCheck } from "lucide-react";
import OnboardingHeader from "../components/OnboardingHeader.jsx";
import { supabase } from "../lib/supabaseClient.js";
import "./Auth.css";

export default function Auth({ initialMode = "signup", onBack, onAuthed }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: authError } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup" && !data.session) {
      // "Confirm email" is still on for this project -- no session yet.
      setCheckEmail(true);
      return;
    }
    onAuthed(data.session);
  };

  if (checkEmail) {
    return (
      <div className="auth-screen">
        <OnboardingHeader title="Check your inbox" onBack={onBack} />
        <div className="auth-screen__body">
          <div className="card auth-screen__check-email">
            <span className="auth-screen__check-email-icon"><MailCheck size={20} /></span>
            <div>
              <strong>Confirm your email</strong>
              <span>We sent a confirmation link to {email}. Click it, then come back and log in.</span>
            </div>
          </div>
          <button
            type="button"
            className="pill-button pill-button--primary auth-screen__cta"
            onClick={() => { setCheckEmail(false); setMode("login"); }}
          >
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <OnboardingHeader
        title={mode === "signup" ? "Create your account" : "Welcome back"}
        subtitle={mode === "signup" ? "Your plan and progress will save here." : "Log in to pick up where you left off."}
        onBack={onBack}
      />
      <form className="auth-screen__body" onSubmit={submit}>
        <div className="card auth-screen__card">
          <div className="segmented">
            <button
              type="button"
              className={"segmented__item" + (mode === "signup" ? " is-active" : "")}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </button>
            <button
              type="button"
              className={"segmented__item" + (mode === "login" ? " is-active" : "")}
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
          </div>

          <label className="field">
            <span className="field__label">Email</span>
            <span className="field__input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <span className="field__input">
              <Lock size={18} />
              <input
                type="password"
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </span>
          </label>

          {error && <p className="auth-screen__error">{error}</p>}
        </div>

        <button type="submit" className="pill-button pill-button--primary auth-screen__cta" disabled={loading}>
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
        <p className="auth-screen__note">🔒 Your health data is private and secure</p>
      </form>
    </div>
  );
}
