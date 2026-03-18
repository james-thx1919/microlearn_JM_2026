import React, { useState, useEffect } from "react";
import { useApp } from "../App";
import { generateQuiz } from "../utils/ai";
import { saveSession, updateUserStats } from "../utils/db";
import {
  xpForQuiz,
  getLevelForXP,
  calcNewStreak,
  checkNewBadges,
} from "../utils/gamification";
import { theme, topicConfig } from "../theme";

export default function QuizScreen() {
  const {
    apiKey,
    currentLesson,
    lessonTopic,
    navigate,
    authUser,
    userProfile,
    reloadProfile,
  } = useApp();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [saving, setSaving] = useState(false);

  const cfg = topicConfig[lessonTopic] || topicConfig["Tech"];

  useEffect(() => {
    if (!currentLesson) {
      navigate("dashboard");
      return;
    }
    fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const q = await generateQuiz(currentLesson, apiKey);
      setQuiz(q);
    } catch {
      await finishSession(0, 3);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qi, oi) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    await finishSession(correct, quiz.questions.length);
  };

  const finishSession = async (correct, total) => {
    setSaving(true);
    const earned = xpForQuiz(correct, total || 3);
    setXpEarned(earned);

    const { newStreak } = calcNewStreak(
      userProfile?.streak || 0,
      userProfile?.lastSessionDate
    );
    const newXP = (userProfile?.xp || 0) + earned;
    const newLevel = getLevelForXP(newXP).level;
    const newTotal = (userProfile?.totalSessions || 0) + 1;

    const updatedProfile = {
      ...userProfile,
      xp: newXP,
      level: newLevel,
      streak: newStreak,
      totalSessions: newTotal,
    };
    const badges = checkNewBadges(
      updatedProfile,
      { quizScore: correct },
      userProfile?.badges || []
    );
    setNewBadges(badges);

    try {
      await saveSession(authUser.uid, {
        topic: lessonTopic,
        lessonTitle: currentLesson?.title || lessonTopic,
        quizScore: correct,
        xpEarned: earned,
      });
      await updateUserStats(authUser.uid, {
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastSessionDate: new Date(),
        totalSessions: newTotal,
        badges: [...(userProfile?.badges || []), ...badges.map((b) => b.id)],
      });
      await reloadProfile();
    } catch (e) {
      console.error("Session save error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
        <h2
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: "20px",
            color: theme.colors.text,
          }}
        >
          Generating quiz…
        </h2>
      </Center>
    );
  }

  if (submitted) {
    const total = quiz?.questions?.length || 3;
    const percent = Math.round((score / total) * 100);
    const emoji = percent === 100 ? "🎯" : percent >= 66 ? "🌟" : "💪";
    const msg =
      percent === 100
        ? "Perfect score!"
        : percent >= 66
        ? "Great work!"
        : "Keep going!";

    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.colors.bg,
          display: "flex",
          flexDirection: "column",
          padding: "60px 24px 40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "64px", marginBottom: "12px" }}>{emoji}</div>
          <h1
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "30px",
              fontWeight: "800",
              color: theme.colors.text,
              marginBottom: "6px",
            }}
          >
            {msg}
          </h1>
          <p style={{ color: theme.colors.textMuted, fontSize: "15px" }}>
            {score} / {total} correct
          </p>
        </div>

        <div
          style={{
            background: theme.colors.accentDim,
            border: `1px solid ${theme.colors.accent}25`,
            borderRadius: theme.radii.lg,
            padding: "20px",
            textAlign: "center",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "40px",
              fontWeight: "800",
              color: theme.colors.accent,
            }}
          >
            +{xpEarned} XP
          </div>
          <div style={{ color: theme.colors.textMuted, fontSize: "13px" }}>
            earned this session
          </div>
        </div>

        {quiz?.questions?.map((q, i) => {
          const userAns = answers[i];
          const correct = q.correct;
          return (
            <div
              key={i}
              style={{
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.md,
                padding: "14px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>
                  {userAns === correct ? "✅" : "❌"}
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: theme.colors.text,
                    lineHeight: "1.4",
                  }}
                >
                  {q.question}
                </p>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: theme.colors.textMuted,
                  paddingLeft: "24px",
                  lineHeight: "1.5",
                }}
              >
                <strong style={{ color: theme.colors.success }}>
                  ✓ {q.options[correct]}
                </strong>
                {" — "}
                {q.explanation}
              </p>
            </div>
          );
        })}

        {newBadges.length > 0 && (
          <div
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.lg,
              padding: "16px",
              marginBottom: "14px",
            }}
          >
            <h3
              style={{
                fontFamily: theme.fonts.heading,
                color: theme.colors.text,
                marginBottom: "12px",
                fontSize: "15px",
              }}
            >
              🏆 New Badges!
            </h3>
            {newBadges.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "28px" }}>{b.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.text,
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    {b.title}
                  </div>
                  <div
                    style={{ color: theme.colors.textMuted, fontSize: "12px" }}
                  >
                    {b.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate("dashboard")}
          style={{
            background: theme.colors.accent,
            color: "#000",
            border: "none",
            borderRadius: theme.radii.md,
            padding: "16px",
            width: "100%",
            fontFamily: theme.fonts.heading,
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "auto",
          }}
        >
          Back to Dashboard →
        </button>
      </div>
    );
  }

  const allAnswered = quiz?.questions?.every(
    (_, i) => answers[i] !== undefined
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.bg,
        padding: "20px",
        paddingTop: "54px",
      }}
    >
      <button
        onClick={() => navigate("lesson")}
        style={{
          background: "none",
          border: "none",
          color: theme.colors.textMuted,
          cursor: "pointer",
          fontFamily: theme.fonts.body,
          fontSize: "13px",
          marginBottom: "20px",
          display: "block",
        }}
      >
        ← Back to lesson
      </button>

      <h1
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: "24px",
          fontWeight: "700",
          color: theme.colors.text,
          marginBottom: "4px",
        }}
      >
        Quick Quiz
      </h1>
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        {quiz?.questions?.length} questions on {lessonTopic}
      </p>

      {quiz?.questions?.map((q, qi) => (
        <div
          key={qi}
          style={{
            background: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            padding: "18px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "15px",
              fontWeight: "600",
              color: theme.colors.text,
              lineHeight: "1.45",
              marginBottom: "14px",
            }}
          >
            {qi + 1}. {q.question}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {q.options.map((opt, oi) => {
              const sel = answers[qi] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(qi, oi)}
                  style={{
                    background: sel ? cfg.bg : theme.colors.bgElevated,
                    border: `1px solid ${
                      sel ? cfg.color : theme.colors.border
                    }`,
                    borderRadius: theme.radii.md,
                    padding: "11px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: sel ? cfg.color : theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                    fontSize: "14px",
                    fontWeight: sel ? "500" : "400",
                    transition: "all 0.15s",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || saving}
        style={{
          background: allAnswered
            ? theme.colors.accent
            : theme.colors.bgElevated,
          color: allAnswered ? "#000" : theme.colors.textDim,
          border: "none",
          borderRadius: theme.radii.md,
          padding: "16px",
          width: "100%",
          fontFamily: theme.fonts.heading,
          fontSize: "16px",
          fontWeight: "700",
          cursor: allAnswered ? "pointer" : "default",
          marginTop: "4px",
          marginBottom: "32px",
          transition: "all 0.2s",
        }}
      >
        {saving
          ? "Saving…"
          : allAnswered
          ? "Submit Quiz →"
          : `Answer all ${quiz?.questions?.length} questions`}
      </button>
    </div>
  );
}

function Center({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {children}
    </div>
  );
}
