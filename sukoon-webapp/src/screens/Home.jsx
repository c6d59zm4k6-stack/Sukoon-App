import { ChevronRight } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import "./Home.css";

const DOMAINS = [
  { emoji: "🌸", title: "PCOS Care" },
  { emoji: "🪷", title: "Fertility" },
  { emoji: "🧠", title: "Mental Well-being" },
  { emoji: "🥗", title: "Nutrition" },
  { emoji: "🧘", title: "Yoga & Movement" },
  { emoji: "🩺", title: "General Health" },
];

export default function Home({ name = "Ananya", onOpenExperts }) {
  return (
    <div className="home-screen">
      <TopBar title={`Hi, ${name} 👋`} tagline="What's on your mind today?" />

      <div className="home-screen__content">
        <section>
          <h2 className="section-title">Your areas of focus</h2>
          <div className="home-screen__domain-grid">
            {DOMAINS.map((d) => (
              <button className="card home-screen__domain" key={d.title}>
                <span>{d.emoji}</span>
                <strong>{d.title}</strong>
              </button>
            ))}
          </div>
        </section>

        <section>
          <button className="card home-screen__experts-banner" onClick={onOpenExperts}>
            <div>
              <strong>Talk to Experts</strong>
              <span>Verified gynaecologists, psychiatrists &amp; more</span>
            </div>
            <ChevronRight size={18} color="var(--indigo-mid)" />
          </button>
        </section>
      </div>
    </div>
  );
}
