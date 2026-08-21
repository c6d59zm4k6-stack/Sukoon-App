import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import OnboardingHeader from "../../components/OnboardingHeader.jsx";
import { openingMessage, APPROX_QUESTION_COUNT } from "../../data/planQuizPrompt.js";
import { extractAiPlan, messageBeforePlan, mapAiPlanToAppPlan, extractQuickReplies } from "../../data/aiPlanMapper.js";
import { buildPlan as buildFallbackPlan } from "../../data/planTemplates.js";
import "./PlanQuestionnaire.css";

// The AI's replies use **bold** for the actual question, per the prompt's
// formatting instructions — render that instead of showing literal asterisks.
function renderBubbleText(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

export default function PlanQuestionnaire({ profile, onBack, onContinue }) {
  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: openingMessage(profile?.name) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readyPlan, setReadyPlan] = useState(null);
  const [quickReplies, setQuickReplies] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const progressPercent = readyPlan
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      const aiPlan = extractAiPlan(data.text);
      const rawVisible = aiPlan ? messageBeforePlan(data.text) : data.text;
      const { text: visibleText, options } = extractQuickReplies(rawVisible);
      if (visibleText) {
        setMessages((prev) => [...prev, { role: "assistant", content: visibleText }]);
      }
      if (!aiPlan) {
        setQuickReplies(options);
      }
      if (aiPlan) {
        setReadyPlan(mapAiPlanToAppPlan(aiPlan));
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hmm, connection issue on my end. Could you try sending that again?" }]);
      setError(true);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const skipToFallback = () => {
    onContinue({ answers: messages, plan: buildFallbackPlan(profile?.journeys, {}) });
  };

  return (
    <div className="plan-quiz">
      <OnboardingHeader
        title="Building your plan"
        subtitle="A few quick questions to personalise it"
        onBack={onBack}
      />
      <div className="plan-quiz__progress-track" aria-hidden="true">
        <div className="plan-quiz__progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="plan-quiz__thread">
        {messages.map((m, i) => (
          <div key={i} className={"plan-quiz__bubble-row" + (m.role === "user" ? " is-user" : "")}>
            <div className="plan-quiz__bubble">{renderBubbleText(m.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="plan-quiz__bubble-row">
            <div className="plan-quiz__bubble plan-quiz__bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        {readyPlan && (
          <div className="plan-quiz__ready-card">
            <p>Your plan is ready 🎉</p>
            <button
              type="button"
              className="pill-button pill-button--primary plan-quiz__ready-cta"
              onClick={() => onContinue({ answers: messages, plan: readyPlan })}
            >
              See my plan <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!readyPlan && (
        <div className="plan-quiz__footer">
          <button type="button" className="plan-quiz__skip" onClick={skipToFallback}>
            {error ? "Skip for now, use a starter plan instead" : "Skip for now, take me to the app"}
          </button>
          {quickReplies.length > 0 && !loading && (
            <div className="chip-row plan-quiz__quick-replies">
              {quickReplies.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="chip"
                  onClick={() => send(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          <div className="plan-quiz__input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your answer…"
              rows={1}
            />
            <button
              type="button"
              className="plan-quiz__send"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="plan-quiz__note">🔒 Your data is private &amp; secure</p>
        </div>
      )}
    </div>
  );
}
