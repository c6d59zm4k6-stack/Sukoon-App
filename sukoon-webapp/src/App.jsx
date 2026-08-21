import { useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Splash from "./screens/Splash.jsx";
import ChooseJourney from "./screens/onboarding/ChooseJourney.jsx";
import AboutYou from "./screens/onboarding/AboutYou.jsx";
import PlanQuestionnaire from "./screens/onboarding/PlanQuestionnaire.jsx";
import Home from "./screens/Home.jsx";
import Plan from "./screens/Plan.jsx";
import Track from "./screens/Track.jsx";
import Experts from "./screens/Experts.jsx";
import DoctorConcierge from "./screens/DoctorConcierge.jsx";
import Profile from "./screens/Profile.jsx";
import ChatEmbed from "./screens/ChatEmbed.jsx";
import { buildPlan as buildFallbackPlan } from "./data/planTemplates.js";
import { todayKey } from "./data/habits.js";

const EMPTY_PLAN = { phases: [], answers: {} };
const EMPTY_TRACKING = { habitLog: {}, periods: [], symptomLog: {}, weightLog: [] };

// stage: "splash" | "about" | "journey" | "plan-quiz" | "app"
export default function App() {
  const [stage, setStage] = useState("splash");
  const [tab, setTab] = useState("home");
  const [careView, setCareView] = useState(null);
  const [profile, setProfile] = useState({
    name: "", gender: "", age: "", tags: [], location: "",
    journeys: [], quizAnswers: {}, plan: EMPTY_PLAN, tracking: EMPTY_TRACKING,
  });

  const toggleHabit = (habitId) => {
    const key = todayKey();
    setProfile((p) => {
      const today = p.tracking.habitLog[key] || {};
      return {
        ...p,
        tracking: {
          ...p.tracking,
          habitLog: { ...p.tracking.habitLog, [key]: { ...today, [habitId]: !today[habitId] } },
        },
      };
    });
  };

  const logPeriodToday = () => {
    const key = todayKey();
    setProfile((p) => ({
      ...p,
      tracking: {
        ...p.tracking,
        periods: p.tracking.periods.includes(key) ? p.tracking.periods : [...p.tracking.periods, key],
      },
    }));
  };

  const logSymptom = (field, value) => {
    const key = todayKey();
    setProfile((p) => {
      const today = p.tracking.symptomLog[key] || { mood: null, energy: null, skin: [] };
      let updated;
      if (field === "skin") {
        const has = today.skin.includes(value);
        updated = { ...today, skin: has ? today.skin.filter((s) => s !== value) : [...today.skin, value] };
      } else {
        updated = { ...today, [field]: today[field] === value ? null : value };
      }
      return { ...p, tracking: { ...p.tracking, symptomLog: { ...p.tracking.symptomLog, [key]: updated } } };
    });
  };

  const logWeight = (kg) => {
    const key = todayKey();
    setProfile((p) => ({
      ...p,
      tracking: {
        ...p.tracking,
        weightLog: [...p.tracking.weightLog.filter((w) => w.date !== key), { date: key, kg }],
      },
    }));
  };

  if (stage === "splash") {
    return (
      <div className="app-shell">
        <Splash onBegin={() => setStage("about")} onCreateAccount={() => setStage("about")} />
      </div>
    );
  }

  if (stage === "about") {
    return (
      <div className="app-shell">
        <AboutYou
          onBack={() => setStage("splash")}
          onContinue={(aboutData) => {
            setProfile((p) => ({ ...p, ...aboutData }));
            setStage("journey");
          }}
        />
      </div>
    );
  }

  if (stage === "journey") {
    return (
      <div className="app-shell">
        <ChooseJourney
          onBack={() => setStage("about")}
          onContinue={(journeyIds) => {
            setProfile((p) => ({ ...p, journeys: journeyIds }));
            setStage("plan-quiz");
          }}
          onSkip={() => {
            setProfile((p) => ({
              ...p,
              journeys: p.journeys.length ? p.journeys : ["pcos"],
              plan: buildFallbackPlan(p.journeys.length ? p.journeys : ["pcos"], {}),
            }));
            setStage("app");
          }}
        />
      </div>
    );
  }

  if (stage === "plan-quiz") {
    return (
      <div className="app-shell">
        <PlanQuestionnaire
          profile={profile}
          onBack={() => setStage("journey")}
          onContinue={({ answers, plan }) => {
            setProfile((p) => ({ ...p, quizAnswers: answers, plan }));
            setStage("app");
          }}
        />
      </div>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case "home":
        return <Home profile={profile} onOpenPlan={() => setTab("plan")} onNavigateToCare={() => setTab("care")} />;
      case "plan":
        return <Plan profile={profile} />;
      case "track":
        return (
          <Track
            profile={profile}
            onToggleHabit={toggleHabit}
            onLogPeriod={logPeriodToday}
            onLogSymptom={logSymptom}
            onLogWeight={logWeight}
          />
        );
      case "care":
        return careView === "concierge"
          ? <DoctorConcierge profile={profile} onBack={() => setCareView(null)} />
          : <Experts onOpenConcierge={() => setCareView("concierge")} />;
      case "sukoon":
        return <ChatEmbed />;
      case "profile":
        return <Profile profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell__body">{renderTab()}</div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
