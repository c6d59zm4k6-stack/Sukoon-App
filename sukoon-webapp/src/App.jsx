import { useEffect, useRef, useState } from "react";
import BottomNav from "./components/BottomNav.jsx";
import Splash from "./screens/Splash.jsx";
import Auth from "./screens/Auth.jsx";
import ChooseJourney from "./screens/onboarding/ChooseJourney.jsx";
import AboutYou from "./screens/onboarding/AboutYou.jsx";
import PlanQuestionnaire from "./screens/onboarding/PlanQuestionnaire.jsx";
import Home from "./screens/Home.jsx";
import Plan from "./screens/Plan.jsx";
import Track from "./screens/Track.jsx";
import Experts from "./screens/Experts.jsx";
import DoctorConcierge from "./screens/DoctorConcierge.jsx";
import Profile from "./screens/Profile.jsx";
import Companion from "./screens/Companion.jsx";
import { buildPlan as buildFallbackPlan } from "./data/planTemplates.js";
import { todayKey } from "./data/habits.js";
import { supabase, supabaseConfigError } from "./lib/supabaseClient.js";
import { EMPTY_PROFILE, fetchUserData, saveProfileFields, saveTracking } from "./data/db.js";

function resumeStageFor(profile) {
  if (!profile.name) return "about";
  if (!profile.journeys?.length) return "journey";
  if (!profile.plan?.phases?.length) return "plan-quiz";
  return "app";
}

// stage: "loading" | "splash" | "auth" | "about" | "journey" | "plan-quiz" | "app"
export default function App() {
  const [stage, setStage] = useState("loading");
  const [tab, setTab] = useState("home");
  const [careView, setCareView] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signup");
  const [profile, setProfile] = useState(EMPTY_PROFILE);

  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (supabaseConfigError) return; // nothing to bootstrap -- render() shows the error instead
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session: current } }) => {
        if (!active) return;
        setSession(current);
        if (current) {
          const { profile: p, tracking: t } = await fetchUserData(current.user.id);
          if (!active) return;
          const loaded = { ...p, tracking: t };
          setProfile(loaded);
          setStage(resumeStageFor(loaded));
        } else {
          setStage("splash");
        }
      })
      .catch((error) => {
        // A session/profile fetch failure must never leave the app stuck on
        // the loading spinner forever -- fall back to a logged-out state so
        // the person can at least reach Splash and try again.
        console.error("Session bootstrap failed:", error);
        if (!active) return;
        setStage("splash");
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_OUT") {
        setProfile(EMPTY_PROFILE);
        setTab("home");
        setStage("splash");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const persistTracking = (nextTracking) => {
    setProfile((p) => ({ ...p, tracking: nextTracking }));
    if (session?.user?.id) saveTracking(session.user.id, nextTracking);
  };

  const toggleHabit = (habitId) => {
    const key = todayKey();
    const today = profileRef.current.tracking.habitLog[key] || {};
    persistTracking({
      ...profileRef.current.tracking,
      habitLog: { ...profileRef.current.tracking.habitLog, [key]: { ...today, [habitId]: !today[habitId] } },
    });
  };

  const logPeriodToday = () => {
    const key = todayKey();
    const { periods } = profileRef.current.tracking;
    persistTracking({
      ...profileRef.current.tracking,
      periods: periods.includes(key) ? periods : [...periods, key],
    });
  };

  const logSymptom = (field, value) => {
    const key = todayKey();
    const today = profileRef.current.tracking.symptomLog[key] || { mood: null, energy: null, skin: [] };
    let updated;
    if (field === "skin") {
      const has = today.skin.includes(value);
      updated = { ...today, skin: has ? today.skin.filter((s) => s !== value) : [...today.skin, value] };
    } else {
      updated = { ...today, [field]: today[field] === value ? null : value };
    }
    persistTracking({
      ...profileRef.current.tracking,
      symptomLog: { ...profileRef.current.tracking.symptomLog, [key]: updated },
    });
  };

  const logWeight = (kg) => {
    const key = todayKey();
    const { weightLog } = profileRef.current.tracking;
    persistTracking({
      ...profileRef.current.tracking,
      weightLog: [...weightLog.filter((w) => w.date !== key), { date: key, kg }],
    });
  };

  if (supabaseConfigError) {
    return (
      <div className="app-shell">
        <div className="app-config-error" role="alert">
          <strong>Configuration problem</strong>
          <p>{supabaseConfigError}</p>
          <p>This is a deployment setup issue, not something to fix by reloading — check the Vercel project's Environment Variables.</p>
        </div>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="app-shell">
        <div className="app-loading" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (stage === "splash") {
    return (
      <div className="app-shell">
        <Splash
          onBegin={() => { setAuthMode("signup"); setStage("auth"); }}
          onCreateAccount={() => { setAuthMode("signup"); setStage("auth"); }}
          onLogin={() => { setAuthMode("login"); setStage("auth"); }}
        />
      </div>
    );
  }

  if (stage === "auth") {
    return (
      <div className="app-shell">
        <Auth
          initialMode={authMode}
          onBack={() => setStage("splash")}
          onAuthed={async (newSession) => {
            setSession(newSession);
            try {
              const { profile: p, tracking: t } = await fetchUserData(newSession.user.id);
              const loaded = { ...p, tracking: t };
              setProfile(loaded);
              setStage(resumeStageFor(loaded));
            } catch (error) {
              console.error("Post-auth profile fetch failed:", error);
              setStage(resumeStageFor(EMPTY_PROFILE));
            }
          }}
        />
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
            if (session?.user?.id) saveProfileFields(session.user.id, aboutData);
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
            if (session?.user?.id) saveProfileFields(session.user.id, { journeys: journeyIds });
            setStage("plan-quiz");
          }}
          onSkip={() => {
            const journeys = profileRef.current.journeys.length ? profileRef.current.journeys : ["pcos"];
            const plan = buildFallbackPlan(journeys, {});
            setProfile((p) => ({ ...p, journeys, plan }));
            if (session?.user?.id) saveProfileFields(session.user.id, { journeys, plan });
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
            if (session?.user?.id) saveProfileFields(session.user.id, { quizAnswers: answers, plan });
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
        return <Companion profile={profile} />;
      case "profile":
        return <Profile profile={profile} onSignOut={() => supabase.auth.signOut()} />;
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
