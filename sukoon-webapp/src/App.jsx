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
import Library from "./screens/Library.jsx";
import { buildPlan as buildFallbackPlan } from "./data/planTemplates.js";
import { todayKey } from "./data/habits.js";
import { supabase, supabaseConfigError } from "./lib/supabaseClient.js";
import { EMPTY_PROFILE, fetchUserData, saveProfileFields, saveTracking } from "./data/db.js";
import { hasStrugglePattern } from "./data/checkins.js";

function resumeStageFor(profile) {
  if (!profile.name) return "about";
  if (!profile.journeys?.length) return "journey";
  if (!profile.plan?.phases?.length) return "plan-quiz";
  return "app";
}

// stage: "loading" | "splash" | "auth" | "account-error" | "about" | "journey" | "plan-quiz" | "app"
export default function App() {
  const [stage, setStage] = useState("loading");
  const [tab, setTab] = useState("home");
  const [careView, setCareView] = useState(null);
  const [homeView, setHomeView] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signup");
  const [profile, setProfile] = useState(EMPTY_PROFILE);

  // Journey-matched deep link -- e.g. an Instagram bio link tagged
  // ?journey=pcos. Two effects, not one: (1) pre-selects (never locks) that
  // journey on Choose Journey for a brand-new visitor, and (2) for anyone
  // who lands with an existing session (skips onboarding entirely), jumps
  // straight to the Library filtered to that journey the moment the app
  // resolves.
  //
  // 2026-08-25: live testing found the query string can go missing by the
  // time login finishes (confirmed: present in the link, gone from the
  // address bar right after signing in) -- something in the login detour
  // (a redirect, or the browser itself) drops it before this component
  // ever gets to react to "app" stage. Persisting the value to
  // sessionStorage the instant it's seen means a later reload/redirect in
  // the same browser tab still finds it, even if the URL itself no longer
  // carries it by then.
  const [deepLinkJourney] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("journey");
    if (fromUrl) {
      try { sessionStorage.setItem("sukoon_deeplink_journey", fromUrl); } catch { /* private mode etc -- fine, just no persistence */ }
      return fromUrl;
    }
    try { return sessionStorage.getItem("sukoon_deeplink_journey"); } catch { return null; }
  });
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    if (stage === "app" && deepLinkJourney && !deepLinkHandled) {
      setTab("home");
      setHomeView("library");
      setDeepLinkHandled(true);
    }
  }, [stage, deepLinkJourney, deepLinkHandled]);

  // Shared by the initial session bootstrap, post-login, and the
  // account-error screen's retry button -- one place that decides where an
  // authenticated person lands. `fetchUserData` already retries once
  // internally; if it still fails here, this deliberately does NOT fall
  // back to resumeStageFor(EMPTY_PROFILE) -- that used to be exactly what
  // made an existing user intermittently land back on "About You" instead
  // of Home, since a transient fetch failure looked identical to a
  // brand-new profile. A real fetch failure now shows a retriable error
  // screen instead of silently guessing.
  const loadProfileAndResume = async (userId) => {
    const { profile: p, tracking: t, hasError } = await fetchUserData(userId);
    if (hasError) {
      setStage("account-error");
      return;
    }
    const loaded = { ...p, tracking: t };
    setProfile(loaded);
    setStage(resumeStageFor(loaded));
  };

  useEffect(() => {
    if (supabaseConfigError) return; // nothing to bootstrap -- render() shows the error instead
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session: current } }) => {
        if (!active) return;
        setSession(current);
        if (current) {
          await loadProfileAndResume(current.user.id);
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

  const logCheckin = (value) => {
    const key = todayKey();
    const nextCheckinLog = { ...profileRef.current.tracking.checkinLog, [key]: { value } };
    persistTracking({
      ...profileRef.current.tracking,
      checkinLog: nextCheckinLog,
      flaggedForExpertAt: hasStrugglePattern(nextCheckinLog)
        ? profileRef.current.tracking.flaggedForExpertAt || new Date().toISOString()
        : null,
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
        <Splash onBegin={() => { setAuthMode("signup"); setStage("auth"); }} />
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
            await loadProfileAndResume(newSession.user.id);
          }}
        />
      </div>
    );
  }

  if (stage === "account-error") {
    return (
      <div className="app-shell">
        <div className="app-account-error" role="alert">
          <strong>Couldn't load your account</strong>
          <p>This is usually a brief connection hiccup, not a problem with your account or data.</p>
          <button type="button" onClick={() => loadProfileAndResume(session.user.id)}>Try again</button>
        </div>
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
          preselect={deepLinkJourney}
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
        return homeView === "library"
          ? <Library profile={profile} highlightJourney={deepLinkJourney} onBack={() => setHomeView(null)} />
          : <Home profile={profile} onOpenPlan={() => setTab("plan")} onNavigateToCare={() => setTab("care")} onOpenLibrary={() => setHomeView("library")} />;
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
            onLogCheckin={logCheckin}
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
