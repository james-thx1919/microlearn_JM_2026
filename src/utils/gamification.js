import { LEVELS } from "../theme";

export function getLevelForXP(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function xpForQuiz(correct, total) {
  const base = 20;
  const bonus = Math.floor((correct / total) * 30);
  return base + bonus;
}

export function xpForRating(rating) {
  return rating >= 4 ? 10 : 5;
}

export function calcNewStreak(currentStreak, lastSessionDate) {
  if (!lastSessionDate) return { newStreak: 1, broken: false };

  const last = lastSessionDate.toDate
    ? lastSessionDate.toDate()
    : new Date(lastSessionDate);
  const now = new Date();

  const diffMs = now.setHours(0, 0, 0, 0) - new Date(last).setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return { newStreak: currentStreak, broken: false };
  if (diffDays === 1) return { newStreak: currentStreak + 1, broken: false };
  return { newStreak: 1, broken: true };
}

export const BADGES = {
  FIRST_LESSON: {
    id: "first_lesson",
    icon: "🌱",
    title: "First Step",
    desc: "Completed your first lesson",
  },
  STREAK_3: {
    id: "streak_3",
    icon: "🔥",
    title: "On Fire",
    desc: "3-day streak",
  },
  STREAK_7: {
    id: "streak_7",
    icon: "⚡",
    title: "Lightning",
    desc: "7-day streak",
  },
  STREAK_30: {
    id: "streak_30",
    icon: "💎",
    title: "Diamond",
    desc: "30-day streak",
  },
  PERFECT_QUIZ: {
    id: "perfect_quiz",
    icon: "🎯",
    title: "Sharpshooter",
    desc: "Perfect quiz score",
  },
  SESSIONS_5: {
    id: "sessions_5",
    icon: "📖",
    title: "Page Turner",
    desc: "5 lessons completed",
  },
  SESSIONS_10: {
    id: "sessions_10",
    icon: "📚",
    title: "Bookworm",
    desc: "10 lessons completed",
  },
  SESSIONS_25: {
    id: "sessions_25",
    icon: "🏆",
    title: "Champion",
    desc: "25 lessons completed",
  },
  LEVEL_5: {
    id: "level_5",
    icon: "⭐",
    title: "Scholar",
    desc: "Reached Level 5",
  },
  LEVEL_8: {
    id: "level_8",
    icon: "👑",
    title: "Master",
    desc: "Reached Level 8",
  },
};

export function checkNewBadges(
  updatedProfile,
  sessionData,
  existingBadgeIds = []
) {
  const earned = new Set(existingBadgeIds);
  const newOnes = [];

  const add = (badge) => {
    if (!earned.has(badge.id)) newOnes.push(badge);
  };

  if (updatedProfile.totalSessions >= 1) add(BADGES.FIRST_LESSON);
  if (updatedProfile.totalSessions >= 5) add(BADGES.SESSIONS_5);
  if (updatedProfile.totalSessions >= 10) add(BADGES.SESSIONS_10);
  if (updatedProfile.totalSessions >= 25) add(BADGES.SESSIONS_25);
  if (updatedProfile.streak >= 3) add(BADGES.STREAK_3);
  if (updatedProfile.streak >= 7) add(BADGES.STREAK_7);
  if (updatedProfile.streak >= 30) add(BADGES.STREAK_30);
  if (updatedProfile.level >= 5) add(BADGES.LEVEL_5);
  if (updatedProfile.level >= 8) add(BADGES.LEVEL_8);
  if (sessionData?.quizScore === 3) add(BADGES.PERFECT_QUIZ);

  return newOnes;
}
