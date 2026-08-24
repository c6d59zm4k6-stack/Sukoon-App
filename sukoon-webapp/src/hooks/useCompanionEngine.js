import { useEffect, useRef, useState } from "react";
import { createCompanionEngine } from "../lib/companionEngine.js";

// Thin React binding around companionEngine.js — this is the only place in
// the companion feature that touches useState/useEffect. The engine itself
// stays plain JS so the ported logic can be reviewed for fidelity to the
// original independently of rendering concerns.
export function useCompanionEngine(profile) {
  const [bubbles, setBubbles] = useState([]);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [compact, setCompact] = useState(false);
  const [memory, setMemory] = useState({ facts: [], enabled: true });
  const [debugSnapshot, setDebugSnapshot] = useState(null);
  const debugOpenRef = useRef(false);

  const engineRef = useRef(null);
  const initedRef = useRef(false);
  if (!engineRef.current) {
    engineRef.current = createCompanionEngine({
      onBubble: (bubble) => setBubbles((prev) => [...prev, bubble]),
      onUpdateBubble: (id, patch) => setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b))),
      onClearQuickReplies: () => setBubbles((prev) => prev.map((b) => (b.quickReplies ? { ...b, quickReplies: null } : b))),
      onTypingStart: () => setTyping(true),
      onTypingEnd: () => setTyping(false),
      onSendingChange: setSending,
      onCompactChange: setCompact,
      onMemoryChange: (facts, enabled) => setMemory({ facts, enabled }),
      onFidelityUpdate: () => {
        if (debugOpenRef.current) setDebugSnapshot(engineRef.current.getDebugSnapshot());
      },
    });
  }

  useEffect(() => {
    // Guards against React StrictMode's dev-only double-invoke of effects —
    // without this, the opening starter chips / welcome-back bubble render
    // twice in development (harmless in a StrictMode-free production build,
    // but still a real idempotency bug worth not having).
    if (initedRef.current) return;
    initedRef.current = true;
    engineRef.current.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current.setProfile(profile);
  }, [profile]);

  const openDebug = () => {
    debugOpenRef.current = true;
    setDebugSnapshot(engineRef.current.getDebugSnapshot());
  };
  const closeDebug = () => {
    debugOpenRef.current = false;
  };

  return {
    bubbles,
    typing,
    sending,
    compact,
    memory,
    debugSnapshot,
    openDebug,
    closeDebug,
    sendMessage: engineRef.current.sendMessage,
    setMemoryEnabled: engineRef.current.setMemoryEnabled,
    forgetMemory: engineRef.current.forgetMemory,
    resetAggregate: engineRef.current.resetAggregate,
    showHelp: engineRef.current.showHelp,
  };
}
