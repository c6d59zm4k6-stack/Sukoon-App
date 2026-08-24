import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, X } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import ExpertCard from "../components/ExpertCard.jsx";
import { conciergeOpeningMessage } from "../data/doctorConciergePrompt.js";
import { extractQuickReplies, extractRecommendation, messageBeforeRecommendation } from "../data/conciergeMapper.js";
import { expertByName } from "../data/experts.js";
import "./DoctorConcierge.css";

const APPROX_QUESTION_COUNT = 6;
const REFINE_OPTIONS = ["More affordable", "Closer", "Female doctor", "Earlier appointment"];

function renderBubbleText(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export default function DoctorConcierge({ profile, onBack }) {
  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: conciergeOpeningMessage(profile?.name) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, recommendation]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const progressPercent = recommendation
    ? 100
    : Math.min(90, Math.round((userTurns / APPROX_QUESTION_COUNT) * 100));

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setQuickReplies([]);
    setRecommendation(null);
    setConfirmation(null);
    setLoading(true);
    try {
      const res = await fetch("/api/doctor-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const rec = extractRecommendation(data.text);
      const rawVisible = rec ? messageBeforeRecommendation(data.text) : data.text;
      const { text: visibleText, options } = extractQuickReplies(rawVisible);
      if (visibleText) {
        setMessages((prev) => [...prev, { role: "assistant", content: visibleText }]);
      }
      if (rec) {
        setRecommendation(rec);
      } else {
        setQuickReplies(options);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hmm, connection issue on my end. Could you try sending that again?" }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const matchedExpert = recommendation ? expertByName(recommendation.doctorName) : null;

  return (
    <div className="concierge">
      <TopBar title="Find the Right Expert" tagline="Chat with Sukoon to get matched" onBack={onBack} />
      <div className="concierge__progress-track" aria-hidden="true">
        <div className="concierge__progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="concierge__thread">
        {messages.map((m, i) => (
          <div key={i} className={"concierge__bubble-row" + (m.role === "user" ? " is-user" : "")}>
            <div className="concierge__bubble">{renderBubbleText(m.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="concierge__bubble-row">
            <div className="concierge__bubble concierge__bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {matchedExpert && (
          <div className="concierge__recommendation">
            <ExpertCard
              expert={matchedExpert}
              onOnline={() => setConfirmation(`Online consultation requested with ${matchedExpert.name}. We'll send you the video link shortly.`)}
              onBook={() => setConfirmation(`Request sent to ${matchedExpert.name}. Our team will confirm your slot shortly.`)}
            />
            <div className="card concierge__rec-reasons-card">
              <span className="concierge__rec-reasons-label">Why this match</span>
              <ul className="concierge__rec-reasons">
                {(recommendation.reasons || []).map((reason) => (
                  <li key={reason}><CheckCircle2 size={14} color="var(--online-dot)" /> {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {confirmation && (
          <div className="card experts-screen__confirmation">
            <CheckCircle2 size={20} color="var(--online-dot)" />
            <p>{confirmation}</p>
            <button aria-label="Dismiss" onClick={() => setConfirmation(null)}><X size={16} /></button>
          </div>
        )}

        {matchedExpert && !confirmation && (
          <div className="concierge__refine">
            <p>Would you like me to find another option?</p>
            <div className="chip-row">
              {REFINE_OPTIONS.map((option) => (
                <button key={option} type="button" className="chip" onClick={() => send(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="concierge__footer">
        {quickReplies.length > 0 && !loading && (
          <div className="chip-row concierge__quick-replies">
            {quickReplies.map((option) => (
              <button key={option} type="button" className="chip" onClick={() => send(option)}>
                {option}
              </button>
            ))}
          </div>
        )}
        <div className="concierge__input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer…"
            rows={1}
          />
          <button
            type="button"
            className="concierge__send"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="concierge__note">🔒 Your data is private &amp; secure</p>
      </div>
    </div>
  );
}
