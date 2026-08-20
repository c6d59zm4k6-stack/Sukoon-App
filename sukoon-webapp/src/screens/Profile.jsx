import { ChevronRight, Bell, ShieldCheck, CreditCard, LifeBuoy, LogOut } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import "./Profile.css";

const ROWS = [
  { Icon: Bell, label: "Notifications" },
  { Icon: ShieldCheck, label: "Privacy & data" },
  { Icon: CreditCard, label: "Subscription & billing" },
  { Icon: LifeBuoy, label: "Help & support" },
];

export default function Profile({ name = "Ananya" }) {
  return (
    <div className="profile-screen">
      <TopBar title="You" tagline={name} compact />

      <div className="profile-screen__content">
        <div className="card profile-screen__identity">
          <div className="profile-screen__avatar">{name[0]}</div>
          <div>
            <strong>{name}</strong>
            <span>PCOS Care · Mental Well-being</span>
          </div>
        </div>

        <div className="card profile-screen__rows">
          {ROWS.map(({ Icon, label }) => (
            <button className="profile-screen__row" key={label}>
              <Icon size={18} color="var(--indigo-mid)" />
              <span>{label}</span>
              <ChevronRight size={16} color="var(--ink-soft)" />
            </button>
          ))}
        </div>

        <button className="profile-screen__signout">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
