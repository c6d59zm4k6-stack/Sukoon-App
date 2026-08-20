import { ShieldCheck, Clock, Lock, Video, Star, Sparkles } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import "./Experts.css";

const TRUST = [
  { Icon: ShieldCheck, label: "Verified Experts" },
  { Icon: Clock, label: "Quick Appointments" },
  { Icon: Lock, label: "Private & Confidential" },
  { Icon: Video, label: "Online or In-Clinic" },
];

const SPECIALTIES = [
  { emoji: "🌸", title: "Gynaecology & Women's Health", desc: "PCOS, periods, hormones, women's well-being" },
  { emoji: "🎯", title: "Fertility", desc: "Conception, IVF, IUI, trying to conceive" },
  { emoji: "🧠", title: "Psychiatry", desc: "Anxiety, depression, sleep, stress, habit change" },
  { emoji: "🌱", title: "Nutrition", desc: "Diet plans, gut health, weight & lifestyle" },
];

const EXPERTS = [
  { name: "Dr. Neha Mehta", role: "Gynaecologist • 12+ yrs", rating: "4.9 (120)", avail: "Available today", time: "10:00 AM" },
  { name: "Dr. Ritu Sharma", role: "Fertility Specialist • 10+ yrs", rating: "4.8 (96)", avail: "Available today", time: "12:00 PM" },
  { name: "Dr. Ankit Verma", role: "Psychiatrist • 8+ yrs", rating: "4.9 (110)", avail: "Available today", time: "4:00 PM" },
  { name: "Dt. Priya Kapoor", role: "Nutritionist • 7+ yrs", rating: "4.8 (88)", avail: "Available tomorrow", time: "11:00 AM" },
];

export default function Experts() {
  return (
    <div className="experts-screen">
      <TopBar title="Talk to Experts" tagline="Trusted care. Human expertise." />

      <div className="experts-screen__content">
        <div className="card experts-screen__trust">
          {TRUST.map(({ Icon, label }) => (
            <div key={label} className="experts-screen__trust-item">
              <Icon size={20} color="var(--indigo-mid)" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section>
          <h2 className="section-title">Choose a specialty</h2>
          <div className="experts-screen__specialty-grid">
            {SPECIALTIES.map((s) => (
              <button className="card experts-screen__specialty" key={s.title}>
                <span>{s.emoji}</span>
                <strong>{s.title}</strong>
                <p>{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="section-title-row">
            <h2 className="section-title">Top experts in your area</h2>
            <button className="link-btn">See all</button>
          </div>
          <div className="card experts-screen__list">
            {EXPERTS.map((e) => (
              <div className="experts-screen__row" key={e.name}>
                <div className="experts-screen__avatar">{e.name.split(" ")[1]?.[0] ?? e.name[0]}</div>
                <div className="experts-screen__info">
                  <strong>{e.name}</strong>
                  <span>{e.role}</span>
                  <span className="experts-screen__rating"><Star size={12} fill="currentColor" /> {e.rating}</span>
                </div>
                <div className="experts-screen__book">
                  <span className={e.avail.includes("today") ? "is-today" : "is-tomorrow"}>{e.avail}</span>
                  <small>{e.time}</small>
                  <button className="experts-screen__book-btn">Book</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button className="card experts-screen__quiz">
          <Sparkles size={20} color="var(--indigo-mid)" />
          <div>
            <strong>Not sure whom to consult?</strong>
            <span>Take a quick assessment and we'll find the right expert.</span>
          </div>
        </button>
      </div>
    </div>
  );
}
