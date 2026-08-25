import { useEffect } from "react";
import "./InstagramEmbeds.css";

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";

// Instagram's own embed.js (no API key needed for a public post) turns any
// <blockquote class="instagram-media" data-instgrm-permalink="..."> into
// the real, live post -- same mechanism Instagram's own "Embed" button
// gives you on instagram.com. It only scans the DOM once on load, so any
// time the list of blockquotes changes (new journey filter, first mount)
// we have to explicitly ask it to re-scan via window.instgrm.Embeds.process().
function loadEmbedScript(onReady) {
  if (window.instgrm) {
    onReady();
    return;
  }
  const existing = document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`);
  if (existing) {
    existing.addEventListener("load", onReady, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = EMBED_SCRIPT_SRC;
  script.async = true;
  script.addEventListener("load", onReady, { once: true });
  document.body.appendChild(script);
}

export default function InstagramEmbeds({ posts }) {
  useEffect(() => {
    if (!posts.length) return;
    loadEmbedScript(() => window.instgrm?.Embeds.process());
  }, [posts]);

  if (!posts.length) return null;

  return (
    <div className="instagram-embeds">
      {posts.map((post) => (
        <blockquote
          key={post.id}
          className="instagram-media"
          data-instgrm-permalink={post.permalink}
          data-instgrm-version="14"
        />
      ))}
    </div>
  );
}
