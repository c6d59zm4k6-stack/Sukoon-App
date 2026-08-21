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
import Profile from "./screens/Profile.jsx";
import ChatEmbed from "./screens/ChatEmbed.jsx";

const EMPTY_PLAN = { phases: [], answers: {} };

// stage: "splash" | "about" | "journey" | "plan-quiz" | "app"
export default function App() {
  const [stage, setStage] = useState("splash");
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState({
    name: "", gender: "", age: "", tags: [], location: "",
    journeys: [], quizAnswers: {}, plan: EMPTY_PLAN,
  });

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
        return <Track />;
      case "care":
        return <Experts />;
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
