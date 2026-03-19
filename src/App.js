import React, { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "./firebase";
import { getOrCreateUser, refreshUserProfile } from "./utils/db";

import LoginScreen    from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import LessonScreen   from "./screens/LessonScreen";
import QuizScreen     from "./screens/QuizScreen";
import HistoryScreen  from "./screens/HistoryScreen";
import ProfileScreen  from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { getTheme }   from "./theme";

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ─── Splash ───────────────────────────────────────────────────────────────────

function Splash({ t }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: t.colors.bg,
        gap: "12px",
      }}
    >
      <div style={{ fontSize: "40px" }}>⚡</div>
      <div
        style={{
          fontFamily: t.fonts.heading,
          color: t.colors.accent,
          fontSize: "22px",
          fontWeight: "700",
          letterSpacing: "-0.5px",
        }}
      >
        MicroLearn
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [authUser,      setAuthUser]      = useState(null);
  const [userProfile,   setUserProfile]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [screen,        setScreen]        = useState("dashboard");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonTopic,   setLessonTopic]   = useState(null);

  // ── Preferences (persisted to localStorage) ────────────────────────────────
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem("ml_dark_mode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [fontScale, setFontScaleState] = useState(
    () => localStorage.getItem("ml_font_scale") || "md"
  );

  const setDarkMode = (v) => {
    setDarkModeState(v);
    localStorage.setItem("ml_dark_mode", JSON.stringify(v));
  };

  const setFontScale = (v) => {
    setFontScaleState(v);
    localStorage.setItem("ml_font_scale", v);
  };

  // ── Derived theme ──────────────────────────────────────────────────────────
  const currentTheme = getTheme(darkMode, fontScale);

  // Apply body background immediately when theme changes (avoids flash)
  useEffect(() => {
    document.body.style.background = currentTheme.colors.bg;
    document.body.style.margin     = "0";
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API key ────────────────────────────────────────────────────────────────
  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY || "";

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe = () => {};

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const profile = await getOrCreateUser(result.user);
          setAuthUser(result.user);
          setUserProfile(profile);
          setLoading(false);
          return;
        }

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const profile = await getOrCreateUser(user);
            setAuthUser(user);
            setUserProfile(profile);
          } else {
            setAuthUser(null);
            setUserProfile(null);
          }
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error("Redirect error:", err);
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const profile = await getOrCreateUser(user);
            setAuthUser(user);
            setUserProfile(profile);
          } else {
            setAuthUser(null);
            setUserProfile(null);
          }
          setLoading(false);
        });
      });

    return () => unsubscribe();
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (s, params = {}) => {
    if (params.lesson !== undefined) setCurrentLesson(params.lesson);
    if (params.topic  !== undefined) setLessonTopic(params.topic);
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const reloadProfile = async () => {
    if (authUser) {
      const p = await refreshUserProfile(authUser.uid);
      if (p) setUserProfile(p);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <Splash t={currentTheme} />;
  if (!authUser) return <LoginScreen />;

  const ctx = {
    // auth & profile
    authUser, userProfile, setUserProfile, reloadProfile,
    // API
    apiKey,
    // navigation
    screen, navigate, currentLesson, setCurrentLesson, lessonTopic, setLessonTopic,
    // theme preferences
    darkMode,    setDarkMode,
    fontScale,   setFontScale,
    currentTheme,
  };

  return (
    <AppContext.Provider value={ctx}>
      {screen === "dashboard" && <DashboardScreen />}
      {screen === "lesson"    && <LessonScreen />}
      {screen === "quiz"      && <QuizScreen />}
      {screen === "history"   && <HistoryScreen />}
      {screen === "profile"   && <ProfileScreen />}
      {screen === "settings"  && <SettingsScreen />}
    </AppContext.Provider>
  );
}
