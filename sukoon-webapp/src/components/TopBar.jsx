import { Menu, MoreHorizontal } from "lucide-react";
import "./TopBar.css";

export default function TopBar({ title, tagline, onMenu, onMore, compact = false }) {
  return (
    <header className={"top-bar" + (compact ? " top-bar--compact" : "")}>
      <div className="top-bar__art" aria-hidden="true" />
      <div className="top-bar__scrim" aria-hidden="true" />
      <div className="top-bar__row">
        <button className="top-bar__icon-btn" onClick={onMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="top-bar__actions">
          <button className="top-bar__pill">Need help now</button>
          <button className="top-bar__icon-btn" onClick={onMore} aria-label="More options">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
      <div className="top-bar__text">
        <h1>{title}</h1>
        {tagline && <p>{tagline}</p>}
      </div>
    </header>
  );
}
