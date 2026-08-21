import { ChevronLeft } from "lucide-react";
import "./TopBar.css";

export default function TopBar({ title, tagline, onBack, compact = false }) {
  return (
    <header className={"top-bar" + (compact ? " top-bar--compact" : "")}>
      <div className="top-bar__art" aria-hidden="true" />
      <div className="top-bar__scrim" aria-hidden="true" />
      {onBack && (
        <div className="top-bar__row">
          <button className="top-bar__icon-btn" onClick={onBack} aria-label="Go back">
            <ChevronLeft size={20} />
          </button>
        </div>
      )}
      <div className={"top-bar__text" + (onBack ? "" : " top-bar__text--no-row")}>
        <h1>{title}</h1>
        {tagline && <p>{tagline}</p>}
      </div>
    </header>
  );
}
