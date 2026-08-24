import { useEffect, useRef, useState } from "react";
import { useCompanionEngine } from "../hooks/useCompanionEngine.js";
import "./Companion.css";

// Ported verbatim from the original header's inline SVG mascot (breathing/
// blink animation comes from the CSS classes already applied via
// .companion-mascot-eyes below).
const MASCOT_SVG = `<svg viewBox="0 0 120 100"><defs><radialGradient id="cg" cx="32%" cy="20%" r="90%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#F3EFFC"/><stop offset="100%" stop-color="#C7D2F2"/></radialGradient><linearGradient id="cshade" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8E9AC9" stop-opacity="0"/><stop offset="100%" stop-color="#8E9AC9" stop-opacity=".38"/></linearGradient></defs><ellipse cx="60" cy="97" rx="44" ry="5" fill="#C3CDE8" opacity="0.3"/><path id="cloudPath" d="M77.78,21.04 L73.11,16.33 L68.42,13.67 L63.23,12.24 L57.84,12.11 L53.61,12.95 L48.69,15.13 L45.23,17.70 L42.22,21.04 L35.48,21.82 L29.68,24.74 L26.31,27.95 L23.82,31.88 L22.37,36.29 L22.00,40.13 L17.88,41.22 L14.47,43.15 L11.63,45.85 L9.54,49.16 L8.48,52.11 L8.01,55.69 L5.99,59.03 L5.06,62.73 L5.56,67.77 L7.56,71.74 L9.75,74.05 L12.44,75.75 L18.26,76.99 L22.24,82.08 L27.73,85.55 L31.29,86.63 L35.00,87.00 L38.71,86.63 L42.21,85.58 L45.41,88.78 L49.16,91.28 L54.41,93.31 L58.87,93.97 L64.49,93.56 L69.83,91.79 L74.59,88.78 L77.79,85.58 L81.29,86.63 L85.00,87.00 L91.40,85.89 L97.05,82.69 L99.69,80.05 L101.74,76.99 L105.77,76.44 L109.74,74.44 L112.05,72.25 L113.75,69.56 L115.00,64.00 L114.44,60.23 L111.99,55.69 L111.31,51.36 L109.72,47.77 L107.31,44.69 L104.89,42.70 L101.39,40.94 L98.00,40.13 L97.63,36.29 L96.18,31.88 L94.26,28.68 L91.05,25.31 L85.40,22.11 L81.79,21.21 L77.78,21.04 Z" fill="url(#cg)" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity="0.4"/><use href="#cloudPath" fill="url(#cshade)"/><ellipse cx="78" cy="62" rx="26" ry="13" fill="#FFD9A0" opacity="0.16"/><ellipse cx="40" cy="28" rx="17" ry="10" fill="#FFFFFF" opacity="0.65"/><circle cx="34" cy="22" r="3.2" fill="#FFFFFF" opacity="0.85"/><ellipse cx="30" cy="64" rx="5.5" ry="3.5" fill="#F0AFA0" opacity="0.6"/><ellipse cx="90" cy="64" rx="5.5" ry="3.5" fill="#F0AFA0" opacity="0.6"/><g class="companion-mascot-eyes"><circle cx="44" cy="58" r="4.2" fill="#2E3357"/><circle cx="76" cy="58" r="4.2" fill="#2E3357"/></g><path d="M50,68 Q63,74 76,68" stroke="#2E3357" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>`;

// Ported verbatim from addTyping()'s inline SVG in the original.
const TYPING_SVG = `<svg class="companion-typing-scene" viewBox="0 0 74 44" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="tcg" cx="32%" cy="20%" r="90%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#F3EFFC"/><stop offset="100%" stop-color="#C7D2F2"/></radialGradient><linearGradient id="tshade" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8E9AC9" stop-opacity="0"/><stop offset="100%" stop-color="#8E9AC9" stop-opacity=".38"/></linearGradient><radialGradient id="tglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFD9A0" stop-opacity=".9"/><stop offset="55%" stop-color="#EDAA9C" stop-opacity=".4"/><stop offset="100%" stop-color="#EDAA9C" stop-opacity="0"/></radialGradient></defs><ellipse class="companion-typing-glow" cx="27" cy="19" rx="30" ry="26" fill="url(#tglow)"/><ellipse cx="26" cy="38" rx="20" ry="2.7" fill="#C9C2DD" opacity="0.3"/><g class="companion-typing-cloud"><path id="tp" d="M32.08,5.86 L30.08,3.85 L28.08,2.72 L25.86,2.10 L23.56,2.05 L21.76,2.40 L19.66,3.34 L18.18,4.43 L16.89,5.86 L14.02,6.19 L11.54,7.44 L10.10,8.81 L9.04,10.49 L8.41,12.37 L8.26,14.01 L6.50,14.48 L5.04,15.30 L3.83,16.45 L2.94,17.87 L2.49,19.13 L2.28,20.65 L1.42,22.08 L1.03,23.66 L1.24,25.82 L2.09,27.51 L3.03,28.49 L4.18,29.22 L6.66,29.75 L8.36,31.92 L10.71,33.41 L12.23,33.87 L13.81,34.02 L15.39,33.87 L16.89,33.42 L18.25,34.78 L19.86,35.85 L22.10,36.72 L24.00,37.00 L26.40,36.83 L28.68,36.07 L30.72,34.78 L32.08,33.42 L33.58,33.87 L35.16,34.02 L37.89,33.55 L40.31,32.18 L41.43,31.06 L42.31,29.75 L44.03,29.52 L45.73,28.66 L46.71,27.73 L47.44,26.58 L47.97,24.20 L47.73,22.59 L46.69,20.65 L46.39,18.80 L45.72,17.28 L44.69,15.96 L43.65,15.11 L42.16,14.36 L40.71,14.01 L40.56,12.37 L39.93,10.49 L39.11,9.12 L37.74,7.68 L35.33,6.32 L33.79,5.93 L32.08,5.86 Z" fill="url(#tcg)" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.4"/><use href="#tp" fill="url(#tshade)"/><ellipse cx="32.2" cy="23.4" rx="11.1" ry="5.6" fill="#FFD9A0" opacity="0.16"/><ellipse cx="15.9" cy="8.8" rx="7.3" ry="4.3" fill="#FFFFFF" opacity="0.6"/><ellipse cx="11.7" cy="24.2" rx="2.3" ry="1.5" fill="#F0AFA0" opacity="0.6"/><ellipse cx="37.3" cy="24.2" rx="2.3" ry="1.5" fill="#F0AFA0" opacity="0.6"/><g class="companion-typing-eyes"><circle cx="17.7" cy="21.6" r="1.8" fill="#2E3357"/><circle cx="31.3" cy="21.6" r="1.8" fill="#2E3357"/></g><path d="M20.2,25.9 Q25.8,28.5 31.3,25.9" stroke="#2E3357" stroke-width="1.2" fill="none" stroke-linecap="round"/></g><rect x="44" y="23" width="20" height="13" rx="2" fill="#FFFFFF" stroke="#E9E6DE" stroke-width="1"/><path d="M48,27 L58,27 M48,30.5 L55,30.5" stroke="#DAD5EA" stroke-width="1.2" stroke-linecap="round"/><g class="companion-typing-quill"><path d="M50,33 L61,13" stroke="#C9785D" stroke-width="2" stroke-linecap="round"/><path d="M61,13 Q65,11 63,6 Q59,9 58,13 Z" fill="#DB9459"/></g></svg>`;

function QuickReplies({ list, centered, onTap }) {
  const visible = centered ? list : list.slice(0, 3).filter((qr) => qr && qr.trim() && !qr.includes("?"));
  if (!visible.length) return null;
  return (
    <div className={"companion-quick-replies" + (centered ? " companion-quick-replies--centered" : "")}>
      {visible.map((qr) => (
        <button key={qr} type="button" className="companion-quick-chip" onClick={() => onTap(qr)}>
          {qr}
        </button>
      ))}
    </div>
  );
}

function CompanionBubble({ bubble, onChipTap }) {
  if (bubble.kind === "crisis") {
    return (
      <div className="companion-bubble-row companion-bubble-row--assistant">
        <div className="companion-crisis-card">
          <h3>You don't have to go through this alone</h3>
          <p>What you're feeling matters, and there are people ready to listen right now — free and confidential.</p>
          <div className="companion-crisis-lines">
            <div className="companion-crisis-line">
              <strong>Tele-MANAS (24/7, govt. helpline)</strong>
              <a href="tel:14416">14416</a>
            </div>
            <div className="companion-crisis-line">
              <strong>Vandrevala Foundation (24/7)</strong>
              <a href="tel:+919999666555">+91 9999 666 555</a>
            </div>
          </div>
          <p className="companion-crisis-close-note">You can keep talking here too — I'm not going anywhere.</p>
        </div>
      </div>
    );
  }

  if (bubble.kind === "starter-chips") {
    return <QuickReplies list={bubble.quickReplies || []} centered onTap={onChipTap} />;
  }

  const isUser = bubble.role === "user";
  return (
    <div className={"companion-bubble-row " + (isUser ? "companion-bubble-row--user" : "companion-bubble-row--assistant")}>
      <div className="companion-bubble">{bubble.text}</div>
      {bubble.chipActivity && (
        <div className="companion-chip" title={bubble.chipActivity.desc}>
          🧭 Suggested: <b>{bubble.chipActivity.title}</b> · {bubble.chipActivity.duration}
        </div>
      )}
      {bubble.quickReplies && bubble.quickReplies.length > 0 && <QuickReplies list={bubble.quickReplies} onTap={onChipTap} />}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="companion-bubble-row companion-bubble-row--assistant companion-bubble-row--typing">
      <div className="companion-typing">
        <span dangerouslySetInnerHTML={{ __html: TYPING_SVG }} />
        <div className="companion-typing-dots"><span /><span /><span /></div>
      </div>
    </div>
  );
}

function MemoryModal({ facts, enabled, onToggle, onForget, onClose }) {
  return (
    <div className="companion-modal-overlay" onClick={onClose}>
      <div className="companion-modal" onClick={(e) => e.stopPropagation()}>
        <h2>What Sukoon remembers</h2>
        <p className="companion-modal-sub">Private to you. A few short notes from past chats, so conversations don't start from zero.</p>
        {facts.length ? (
          <ul className="companion-memory-list">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        ) : (
          <p className="companion-memory-empty">Nothing saved yet — Sukoon remembers little things as you talk, so it's less repetitive next time.</p>
        )}
        <div className="companion-toggle-row">
          <span>Remember future conversations</span>
          <label className="companion-switch">
            <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
            <span className="companion-slider" />
          </label>
        </div>
        <div className="companion-modal-actions">
          <button className="companion-btn companion-btn--danger" onClick={onForget}>Forget everything</button>
          <button className="companion-btn companion-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function metricStatusClass(status) {
  if (status === "in band") return "companion-status--ok";
  if (status === "no data") return "companion-status--na";
  return "companion-status--off";
}
function formatMetric(value, isPct) {
  if (value === null || value === undefined) return "—";
  return isPct ? (value * 100).toFixed(0) + "%" : value.toFixed(2);
}
function MetricRow({ label, metric, isPct }) {
  const targetDisp = isPct ? (metric.target.target * 100).toFixed(0) + "%" : metric.target.target.toFixed(2);
  return (
    <div className="companion-metric-row">
      <span>{label}<br /><span className="companion-metric-target">target {targetDisp} ±{metric.target.tolerance * 100}%</span></span>
      <span>
        <span className="companion-metric-val">{formatMetric(metric.value, isPct)}</span>
        <span className={"companion-status " + metricStatusClass(metric.status)}>{metric.status}</span>
      </span>
    </div>
  );
}

function DebugModal({ snapshot, onReset, onClose }) {
  if (!snapshot) return null;
  return (
    <div className="companion-modal-overlay" onClick={onClose}>
      <div className="companion-modal" onClick={(e) => e.stopPropagation()}>
        <h2>MI fidelity (internal)</h2>
        <p className="companion-modal-sub">Hidden diagnostic view — not shown to users. Opened by tapping the mascot 5 times.</p>
        <div className="companion-metric-block">
          <h4>This session ({snapshot.session.turns} coded turns)</h4>
          <MetricRow label="Reflection : Question" metric={snapshot.session.rq_ratio} isPct={false} />
          <MetricRow label="Open questions" metric={snapshot.session.pct_open} isPct />
          <MetricRow label="Complex reflections" metric={snapshot.session.pct_complex} isPct />
          <div className="companion-metric-row"><span>Advice given</span><span className="companion-metric-val">{snapshot.session.advice}</span></div>
          <p className="companion-metric-note">Steering starts after {snapshot.minCodedTurnsBeforeSteering} coded turns.</p>
        </div>
        <div className="companion-metric-block">
          <h4>All-time ({snapshot.allTime.turns} turns)</h4>
          <div className="companion-metric-row"><span>Reflection : Question</span><span className="companion-metric-val">{formatMetric(snapshot.allTime.rq_ratio.value, false)}</span></div>
          <div className="companion-metric-row"><span>Open questions</span><span className="companion-metric-val">{formatMetric(snapshot.allTime.pct_open.value, true)}</span></div>
          <div className="companion-metric-row"><span>Complex reflections</span><span className="companion-metric-val">{formatMetric(snapshot.allTime.pct_complex.value, true)}</span></div>
          <div className="companion-metric-row"><span>Advice given</span><span className="companion-metric-val">{snapshot.allTime.advice}</span></div>
        </div>
        <div className="companion-metric-block">
          <h4>Raw counts (session)</h4>
          <div className="companion-metric-row"><span>Simple reflections</span><span className="companion-metric-val">{snapshot.raw.simple_reflection}</span></div>
          <div className="companion-metric-row"><span>Complex reflections</span><span className="companion-metric-val">{snapshot.raw.complex_reflection}</span></div>
          <div className="companion-metric-row"><span>Open questions</span><span className="companion-metric-val">{snapshot.raw.open_question}</span></div>
          <div className="companion-metric-row"><span>Closed questions</span><span className="companion-metric-val">{snapshot.raw.closed_question}</span></div>
          <div className="companion-metric-row"><span>Other</span><span className="companion-metric-val">{snapshot.raw.other}</span></div>
        </div>
        <div className="companion-modal-actions">
          <button className="companion-btn companion-btn--danger" onClick={onReset}>Reset all-time</button>
          <button className="companion-btn companion-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Companion({ profile }) {
  const {
    bubbles, typing, sending, compact, memory, debugSnapshot,
    openDebug, closeDebug, sendMessage, setMemoryEnabled, forgetMemory, resetAggregate, showHelp,
  } = useCompanionEngine(profile);

  const [input, setInput] = useState("");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, typing]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendMessage(text, { skipClassify: false });
  };

  const handleChipTap = (text) => {
    sendMessage(text, { skipClassify: true });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 110) + "px"; }
  };

  const handleMascotTap = () => {
    tapCountRef.current++;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1200);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setDebugOpen(true);
      openDebug();
    }
  };

  return (
    <div className={"companion" + (compact ? " is-compact" : "")}>
      <header className="companion__header">
        <div className="companion__header-bg" aria-hidden="true" />
        <div className="companion__header-scrim" aria-hidden="true" />
        <div className="companion__avatar-wrap">
          <button type="button" className="companion__avatar-ring" onClick={handleMascotTap} aria-label="Sukoon mascot">
            <span dangerouslySetInnerHTML={{ __html: MASCOT_SVG }} />
          </button>
          <span className="companion__status-dot" />
        </div>
        <div className="companion__header-text">
          <h1>Sukoon</h1>
          <p className="companion__tagline">
            <svg className="companion__tagline-leaf" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#5E9C5B" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3C7 3 4 7 4 12c0 5 4 8 8 8 0-6 0-11 5-15-3 0-9 0-5 8" />
            </svg>
            Always here to listen
          </p>
        </div>
        <div className="companion__header-actions">
          <button type="button" className="companion__icon-btn" onClick={showHelp}>Need help now</button>
          <div className="companion__more-wrap">
            <button
              type="button"
              className="companion__icon-btn companion__icon-btn--icon-only"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-label="More options"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {moreOpen && (
              <div className="companion__more-panel">
                <button type="button" className="companion__more-item" onClick={() => { setMoreOpen(false); setMemoryOpen(true); }}>
                  <span>Memory</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="companion__chat">
        <div className="companion__hero">
          <p>What's on your mind today?</p>
          <div className="companion__hero-divider">
            <span />
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3C7 3 4 7 4 12c0 5 4 8 8 8 0-6 0-11 5-15-3 0-9 0-5 8" />
            </svg>
            <span />
          </div>
        </div>
        {bubbles.map((b) => <CompanionBubble key={b.id} bubble={b} onChipTap={handleChipTap} />)}
        {typing && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="companion__input-bar">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type here."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="companion__send-btn" onClick={handleSend} disabled={sending} aria-label="Send">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18l5-7 3 3 4-6 6 10H3z" fill="#fff" stroke="none" />
            <path d="M14 9l4-4m0 0h-3.2m3.2 0v3.2" />
          </svg>
        </button>
      </div>
      <p className="companion__disclaimer">Sukoon offers supportive conversation only — it's not a substitute for professional care.</p>
      <p className="companion__tagline-footer">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 20l6-10 4 6 3-4 5 8H3z" />
        </svg>
        Breathe · Pause · Be kind
      </p>

      {memoryOpen && (
        <MemoryModal
          facts={memory.facts}
          enabled={memory.enabled}
          onToggle={setMemoryEnabled}
          onForget={forgetMemory}
          onClose={() => setMemoryOpen(false)}
        />
      )}
      {debugOpen && (
        <DebugModal
          snapshot={debugSnapshot}
          onReset={resetAggregate}
          onClose={() => { setDebugOpen(false); closeDebug(); }}
        />
      )}
    </div>
  );
}
