import "./ChatEmbed.css";

// Points at the live deployment of the original chat app (kept as a
// completely separate, untouched project). Set VITE_CHAT_APP_URL in your
// Vercel project / .env to the chat app's deployed URL.
const CHAT_URL = import.meta.env.VITE_CHAT_APP_URL;

export default function ChatEmbed() {
  if (!CHAT_URL) {
    return (
      <div className="chat-embed chat-embed--empty">
        <p>
          Set <code>VITE_CHAT_APP_URL</code> to the chat app's deployed URL
          (or <code>http://localhost:3000</code> while running it locally
          with <code>vercel dev</code>) to preview it here.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-embed">
      <iframe
        src={CHAT_URL}
        title="Sukoon Chat"
        className="chat-embed__frame"
        allow="clipboard-write"
      />
    </div>
  );
}
