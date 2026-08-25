import { useState } from "react";
import { ChevronDown, Clock, Sparkles } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { contentForJourneys } from "../data/library.js";
import { journeyById } from "../data/journeys.js";
import "./Library.css";

export default function Library({ profile, onBack, highlightJourney }) {
  // highlightJourney comes from a journey-matched deep link (e.g. an
  // Instagram bio link tagged ?journey=pcos) -- merged into the filter so
  // the linked journey's content shows immediately, even for an existing
  // user whose saved profile.journeys might differ or not be loaded yet.
  const journeyIds = highlightJourney
    ? [...new Set([...(profile?.journeys ?? []), highlightJourney])]
    : profile?.journeys ?? [];
  const items = contentForJourneys(journeyIds);
  const [expandedId, setExpandedId] = useState(null);
  const highlightLabel = highlightJourney ? journeyById(highlightJourney)?.title : null;

  return (
    <div className="library-screen">
      <TopBar title="For You" tagline="Picked for your journey" onBack={onBack} />

      <div className="library-screen__content">
        {highlightLabel && (
          <div className="card library-screen__highlight-banner">
            <span className="library-screen__highlight-icon"><Sparkles size={16} /></span>
            <span>Showing what's relevant to <strong>{highlightLabel}</strong>, since that's what brought you here.</span>
          </div>
        )}

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
