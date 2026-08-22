import { BadgeCheck, Star, MapPin, Video } from "lucide-react";
import "./ExpertCard.css";

export default function ExpertCard({ expert, onOnline, onBook }) {
  const isToday = expert.avail.includes("today");

  return (
    <div className="card expert-card">
      <div className="expert-card__top">
        <div className="expert-card__avatar-wrap">
          <div className="expert-card__avatar">{expert.name.split(" ")[1]?.[0] ?? expert.name[0]}</div>
          {expert.verified && (
            <span className="expert-card__badge"><BadgeCheck size={12} color="#fff" fill="var(--indigo-mid)" /></span>
          )}
          <span className={"expert-card__dot" + (isToday ? " is-online" : "")} />
        </div>

        <div className="expert-card__info">
          <strong>{expert.name}</strong>
          <span className="expert-card__role">{expert.role}</span>
        </div>

        <div className="expert-card__avail">
          <span className={isToday ? "is-today" : "is-tomorrow"}>{expert.avail}</span>
          <small>{expert.hours}</small>
        </div>
      </div>

      {expert.tags?.length > 0 && (
        <div className="expert-card__tags">
          {expert.tags.map((tag) => (
            <span className="expert-card__tag" key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className="expert-card__meta">
        <span className="expert-card__rating"><Star size={12} fill="currentColor" /> {expert.rating}</span>
        <span>{expert.experienceYears}+ yrs exp.</span>
        <span><MapPin size={12} /> {expert.distanceKm} km</span>
      </div>

      <div className="expert-card__actions">
        <button type="button" className="expert-card__online-btn" onClick={onOnline}>
          <Video size={13} /> Online
        </button>
        <button type="button" className="expert-card__book-btn" onClick={onBook}>
          Book
        </button>
      </div>
    </div>
  );
}
