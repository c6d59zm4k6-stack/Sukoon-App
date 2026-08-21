import { useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Splash from "./screens/Splash.jsx";
import ChooseJourney from "./screens/onboarding/ChooseJourney.jsx";
import AboutYou from "./screens/onboarding/AboutYou.jsx";
import Home from "./screens/Home.jsx";
import Plan from "./screens/Plan.jsx";
import Track from "./screens/Track.jsx";
import Experts from "./screens/Experts.jsx";
import Profile from "./screens/Profile.jsx";
import ChatEmbed from "./screens/ChatEmbed.jsx";

// stage: "splash" | "about" | "journey" | "app"
export default function App() {
  const [stage, setStage] = useState("splash");
  const [tab, setTab] = useState("home");
  const [homeView, setHomeView] = useState("home"); // "home" | "experts"

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
        <AboutYou onBack={() => setStage("splash")} onContinue={() => setStage("journey")} />
      </div>
    );
  }

  if (stage === "journey") {
    return (
      <div className="app-shell">
        <ChooseJourney onBack={() => setStage("about")} onContinue={() => setStage("app")} />
      </div>
    );
  }

  const renderTab = () => {
    switch (tab) {
      case "home":
        return homeView === "experts"
          ? <Experts onBack={() => setHomeView("home")} />
          : <Home onOpenExperts={() => setHomeView("experts")} />;
      case "plan":
        return <Plan />;
      case "track":
        return <Track />;
      case "chat":
        return <ChatEmbed />;
      case "profile":
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell__body">{renderTab()}</div>
      <BottomNav
        active={tab}
        onChange={(next) => { setTab(next); setHomeView("home"); }}
      />
    </div>
  );
}
