import { useState } from "react";
import { ShieldCheck, Clock, Lock, Video, Star, Cloud, MapPin, Phone, Users, CheckCircle2, X } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { SPECIALTIES, EXPERTS, CLINIC, clinicMapsUrl, formatPhone } from "../data/experts.js";
import "./Experts.css";

const TRUST = [
  { Icon: ShieldCheck, label: "Verified Experts" },
  { Icon: Clock, label: "Quick Appointments" },
  { Icon: Lock, label: "Private & Confidential" },
  { Icon: Video, label: "Online or In-Clinic" },
];

const ONLINE_SLOTS = ["Today, 4:00 PM", "Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM"];

const BROWSE_MODES = [
  { id: "doctor", label: "By Doctor", Icon: Users },
  { id: "clinic", label: "Visit a Clinic", Icon: MapPin },
  { id: "online", label: "Online Consultation", Icon: Video },
];

export default function Experts({ onBack, onOpenConcierge }) {
  const [specialty, setSpecialty] = useState(null);
  const [mode, setMode] = useState("doctor");
  const [confirmation, setConfirmation] = useState(null);

  const matchingExperts = specialty ? EXPERTS.filter((e) => e.specialties.includes(specialty)) : EXPERTS;
  const specialtyTitle = SPECIALTIES.find((s) => s.id === specialty)?.title;

  const selectSpecialty = (id) => {
    setSpecialty(id);
    setConfirmation(null);
  };

  return (
    <div className="experts-screen">
      <TopBar title="Talk to Experts" tagline="Trusted care. Human expertise." onBack={onBack} />

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
              <button
                className={"card experts-screen__specialty" + (specialty === s.id ? " is-active" : "")}
                key={s.id}
                onClick={() => selectSpecialty(s.id)}
              >
                <span>{s.emoji}</span>
                <strong>{s.title}</strong>
                <p>{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {specialty && (
          <section>
            <h2 className="section-title">How would you like to connect?</h2>
            <div className="experts-screen__mode-row">
              {BROWSE_MODES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={"experts-screen__mode" + (mode === id ? " is-active" : "")}
                  onClick={() => { setMode(id); setConfirmation(null); }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {confirmation && (
          <div className="card experts-screen__confirmation">
            <CheckCircle2 size={20} color="var(--online-dot)" />
            <p>{confirmation}</p>
            <button aria-label="Dismiss" onClick={() => setConfirmation(null)}><X size={16} /></button>
          </div>
        )}

        {(!specialty || mode === "doctor") && (
          <section>
            <h2 className="section-title">{specialty ? `${specialtyTitle} experts` : "Top experts in your area"}</h2>
            <div className="experts-screen__doctor-list">
              {matchingExperts.map((e) => (
                <div className="card experts-screen__doctor" key={e.name}>
                  <div className="experts-screen__row">
                    <div className="experts-screen__avatar">{e.name.split(" ")[1]?.[0] ?? e.name[0]}</div>
                    <div className="experts-screen__info">
                      <strong>{e.name}</strong>
                      <span>{e.role}</span>
                      <span className="experts-screen__rating"><Star size={12} fill="currentColor" /> {e.rating}</span>
                    </div>
                    <div className="experts-screen__book">
                      <span className={e.avail.includes("today") ? "is-today" : "is-tomorrow"}>{e.avail}</span>
                      <small>{e.time}</small>
                    </div>
                  </div>
                  <div className="experts-screen__connect-row">
                    <a
                      className="experts-screen__connect-pill"
                      href={clinicMapsUrl()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin size={13} /> {CLINIC.name}
                    </a>
                    <button
                      type="button"
                      className="experts-screen__connect-pill"
                      onClick={() => setConfirmation(`Online consultation requested with ${e.name}. We'll send you the video link shortly.`)}
                    >
                      <Video size={13} /> Online
                    </button>
                    {CLINIC.phone && (
                      <a className="experts-screen__connect-pill" href={`tel:+91${CLINIC.phone}`}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {specialty && mode === "clinic" && (
          <section>
            <h2 className="section-title">Visit a clinic</h2>
            <div className="card experts-screen__clinic">
              <div className="experts-screen__clinic-header">
                <span className="experts-screen__clinic-icon"><MapPin size={20} /></span>
                <div className="experts-screen__clinic-text">
                  <strong>{CLINIC.name}</strong>
                  <span>{CLINIC.address}</span>
                  <span>{CLINIC.hours}</span>
                </div>
              </div>
              <div className="experts-screen__clinic-actions">
                <a
                  className="experts-screen__connect-pill"
                  href={clinicMapsUrl()}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={13} /> Directions
                </a>
                {CLINIC.phone && (
                  <a className="experts-screen__connect-pill" href={`tel:+91${CLINIC.phone}`}>
                    <Phone size={13} /> {formatPhone(CLINIC.phone)}
                  </a>
                )}
              </div>
              <button
                className="experts-screen__book-btn experts-screen__clinic-cta"
                onClick={() => setConfirmation(`Got it — ${CLINIC.name}. Our team will call you to confirm a slot.`)}
              >
                Book at this clinic
              </button>
            </div>
          </section>
        )}

        {specialty && mode === "online" && (
          <section>
            <h2 className="section-title">Online consultation</h2>
            <div className="card experts-screen__online">
              <span className="experts-screen__clinic-icon"><Video size={20} /></span>
              <div className="experts-screen__clinic-text">
                <strong>Consult from home via video call</strong>
                <span>Pick a slot that works for you</span>
              </div>
            </div>
            <div className="experts-screen__slot-row">
              {ONLINE_SLOTS.map((slot) => (
                <button
                  key={slot}
                  className="chip"
                  onClick={() => setConfirmation(`Online consultation requested for ${slot}. We'll send you the video link shortly.`)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </section>
        )}

        <button className="card experts-screen__quiz" onClick={onOpenConcierge}>
          <span className="experts-screen__quiz-icon"><Cloud size={20} /></span>
          <div>
            <strong>Not sure whom to consult?</strong>
            <span>Chat with Sukoon and we'll find the right expert for you.</span>
          </div>
        </button>
      </div>
    </div>
  );
}
