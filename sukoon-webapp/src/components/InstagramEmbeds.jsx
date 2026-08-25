import { useEffect, useRef, useState } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import "./InstagramEmbeds.css";

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";
const FALLBACK_TIMEOUT_MS = 5000;

// Instagram's own embed.js (no API key needed for a public post) turns any
// <blockquote class="instagram-media" data-instgrm-permalink="..."> into
// the real, live post -- same mechanism Instagram's own "Embed" button
// gives you on instagram.com. It only scans the DOM once on load, so any
// time a new blockquote appears we have to explicitly ask it to re-scan
// via window.instgrm.Embeds.process().
//
// 2026-08-25: live testing found the section can render completely blank
// with no error -- likely a browser tracking-protection setting or ad
// blocker silently dropping the instagram.com/embed.js request (both are
// common on mobile browsers and out of this app's control), though a slow
// network or Instagram itself failing to resolve a post would look
// identical. Either way, silently blank is never acceptable, so each post
// now falls back to a plain "view on Instagram" link if the real embed
// hasn't appeared after a few seconds.
function loadEmbedScript(onReady, onError) {
  if (window.instgrm) {
    onReady();
    return;
  }
  const existing = document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`);
  if (existing) {
    existing.addEventListener("load", onReady, { once: true });
    existing.addEventListener("error", onError, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = EMBED_SCRIPT_SRC;
  script.async = true;
  script.addEventListener("load", onReady, { once: true });
  script.addEventListener("error", onError, { once: true });
  document.body.appendChild(script);
}

function InstagramPost({ post }) {
  const containerRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let settled = false;
    const container = containerRef.current;

    const observer = new MutationObserver(() => {
      if (container?.querySelector("iframe")) {
        settled = true;
        setShowFallback(false);
        observer.disconnect();
      }
    });
    if (container) observer.observe(container, { childList: true });

    const fallbackTimer = setTimeout(() => {
      if (!settled) setShowFallback(true);
    }, FALLBACK_TIMEOUT_MS);

    loadEmbedScript(
      () => window.instgrm?.Embeds.process(),
      () => { settled = true; setShowFallback(true); }
    );

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [post.permalink]);

  return (
    <div className="instagram-embeds__item" ref={containerRef}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={post.permalink}
        data-instgrm-version="14"
        style={showFallback ? { display: "none" } : undefined}
      />
      {showFallback && (
        <a className="instagram-embeds__fallback" href={post.permalink} target="_blank" rel="noreferrer">
          <span className="instagram-embeds__fallback-icon"><Instagram size={18} /></span>
          <span className="instagram-embeds__fallback-text">
            <strong>View this post on Instagram</strong>
            <span>Opens in the Instagram app or website</span>
          </span>
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

export default function InstagramEmbeds({ posts }) {
  if (!posts.length) return null;
  return (
    <div className="instagram-embeds">
      {posts.map((post) => <InstagramPost key={post.id} post={post} />)}
    </div>
  );
}
