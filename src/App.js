import React, { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "./firebase";
import { getOrCreateUser, refreshUserProfile } from "./utils/db";

import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import LessonScreen from "./screens/LessonScreen";
import QuizScreen from "./screens/QuizScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { theme } from "./theme";

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function Splash() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: theme.colors.bg,
        gap: "12px",
      }}
    >
      <div style={{ fontSize: "40px" }}>⚡</div>
      <div
        style={{
          fontFamily: theme.fonts.heading,
          color: theme.colors.accent,
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

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState("dashboard");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonTopic, setLessonTopic] = useState(null);

  const apiKey = process.env.REACT_APP_ANTHROPIC_KEY || "";

  useEffect(() => {
    let unsubscribe = () => {};

    // CRITICAL: check redirect result FIRST before setting up auth listener
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // Coming back from Google redirect — handle immediately
          const profile = await getOrCreateUser(result.user);
          setAuthUser(result.user);
          setUserProfile(profile);
          setLoading(false);
          return; // Don't need auth listener — already handled
        }

        // No redirect result — set up normal auth listener
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
        // Fall back to auth listener on error
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

  const navigate = (s, params = {}) => {
    if (params.lesson !== undefined) setCurrentLesson(params.lesson);
    if (params.topic !== undefined) setLessonTopic(params.topic);
    setScreen(s);
    window.scrollTo(0, 0);
  };

  const reloadProfile = async () => {
    if (authUser) {
      const p = await refreshUserProfile(authUser.uid);
      if (p) setUserProfile(p);
    }
  };

  if (loading) return <Splash />;
  if (!authUser) return <LoginScreen />;

  const ctx = {
    authUser,
    userProfile,
    setUserProfile,
    reloadProfile,
    apiKey,
    screen,
    navigate,
    currentLesson,
    setCurrentLesson,
    lessonTopic,
    setLessonTopic,
  };

  return (
    <AppContext.Provider value={ctx}>
      {screen === "dashboard" && <DashboardScreen />}
      {screen === "lesson" && <LessonScreen />}
      {screen === "quiz" && <QuizScreen />}
      {screen === "history" && <HistoryScreen />}
      {screen === "profile" && <ProfileScreen />}
    </AppContext.Provider>
  );
}
