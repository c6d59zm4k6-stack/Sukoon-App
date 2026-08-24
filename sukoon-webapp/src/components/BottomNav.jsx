import { Home, CalendarCheck, HeartPulse, Stethoscope, Cloud, User } from "lucide-react";
import "./BottomNav.css";

const TABS = [
  { id: "home", label: "Home", Icon: Home },
  { id: "plan", label: "Plan", Icon: CalendarCheck },
  { id: "track", label: "Track", Icon: HeartPulse },
  { id: "care", label: "Talk to Experts", Icon: Stethoscope },
  { id: "sukoon", label: "Sukoon", Icon: Cloud },
  { id: "profile", label: "You", Icon: User },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            className={"bottom-nav__item" + (isActive ? " is-active" : "")}
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{label}</span>
            {isActive && <span className="bottom-nav__dot" />}
          </button>
        );
      })}
    </nav>
  );
}
