import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { contentForJourneys } from "../data/library.js";
import "./Library.css";

export default function Library({ profile, onBack }) {
  const items = contentForJourneys(profile?.journeys ?? []);
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="library-screen">
      <TopBar title="For You" tagline="Picked for your journey" onBack={onBack} />

      <div className="library-screen__content">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div className="card library-screen__item" key={item.id}>
              <button
                type="button"
                className="library-screen__header"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="library-screen__header-text">
                  <span className="library-screen__category">{item.category}</span>
                  <strong>{item.title}</strong>
                  {!isExpanded && <span className="library-screen__summary">{item.summary}</span>}
                  <span className="library-screen__meta"><Clock size={12} /> {item.readTime}</span>
                </div>
                <ChevronDown size={18} color="var(--ink-soft)" className={"library-screen__chevron" + (isExpanded ? " is-open" : "")} />
              </button>
              {isExpanded && (
                <div className="library-screen__body">
                  {item.body.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
