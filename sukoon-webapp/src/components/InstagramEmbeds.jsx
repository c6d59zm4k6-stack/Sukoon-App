import { useEffect, useRef, useState } from "react";
import { Instagram, ExternalLink } from "lucide-react";
import "./InstagramEmbeds.css";

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";
const NO_IFRAME_TIMEOUT_MS = 5000; // give up if embed.js never even swaps in an iframe
const IFRAME_GROW_TIMEOUT_MS = 8000; // give a Reel's video longer to load than a photo post
const POLL_INTERVAL_MS = 400;
const MIN_RENDERED_HEIGHT = 100;

// Instagram's own embed.js (no API key needed for a public post) turns any
// <blockquote class="instagram-media" data-instgrm-permalink="..."> into
// the real, live post -- same mechanism Instagram's own "Embed" button
// gives you on instagram.com. It only scans the DOM once on load, so any
// time a new blockquote appears we have to explicitly ask it to re-scan
// via window.instgrm.Embeds.process().
//
// 2026-08-25: live testing found two distinct failure modes, both silent.
// (1) The section can render completely blank -- likely a browser
// tracking-protection setting or ad blocker silently dropping the
// instagram.com/embed.js request (common on mobile). (2) Instagram *does*
// swap the blockquote for an iframe (so a naive "did an iframe appear"
// check reports success), but the iframe itself collapses to a sliver
// with no visible content -- seen consistently across reel permalinks,
// so the classic embed.js/blockquote method likely doesn't reliably
// render Reels the way it does photo posts, or the iframe's own resize
// postMessage gets blocked (e.g. third-party cookie restrictions). Either
// way, checking the iframe actually rendered at a real height -- not just
// that it exists -- is what catches case (2).
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
    let pollTimer;
    let growTimeout;
    const container = containerRef.current;
    const startedAt = Date.now();

    const giveUp = () => {
      if (settled) return;
      settled = true;
      clearInterval(pollTimer);
      clearTimeout(growTimeout);
      const iframe = container?.querySelector("iframe");
      if (iframe) iframe.style.display = "none";
      setShowFallback(true);
    };

    // A Reel's video needs to load before its iframe grows to a real
    // height, unlike a photo post's iframe which sizes itself almost
    // immediately -- so once an iframe shows up at all, poll its height
    // for a while rather than judging it after one fixed delay.
    const pollHeight = () => {
      const iframe = container?.querySelector("iframe");
      if (!iframe) return;
      if (iframe.getBoundingClientRect().height >= MIN_RENDERED_HEIGHT) {
        settled = true;
        clearInterval(pollTimer);
        clearTimeout(growTimeout);
        setShowFallback(false);
        return;
      }
      if (Date.now() - startedAt >= IFRAME_GROW_TIMEOUT_MS) giveUp();
    };

    const observer = new MutationObserver(() => {
      if (container?.querySelector("iframe") && !pollTimer) {
        pollTimer = setInterval(pollHeight, POLL_INTERVAL_MS);
        growTimeout = setTimeout(giveUp, IFRAME_GROW_TIMEOUT_MS);
      }
    });
    if (container) observer.observe(container, { childList: true });

    const noIframeTimer = setTimeout(() => {
      if (!container?.querySelector("iframe")) giveUp();
    }, NO_IFRAME_TIMEOUT_MS);

    loadEmbedScript(() => window.instgrm?.Embeds.process(), giveUp);

    return () => {
      observer.disconnect();
      clearInterval(pollTimer);
      clearTimeout(growTimeout);
      clearTimeout(noIframeTimer);
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
