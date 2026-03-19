import React from "react";
import { useApp } from "../App";

const NAV_ITEMS = [
  { id: "dashboard", emoji: "🏠", label: "Home"     },
  { id: "history",   emoji: "📚", label: "History"  },
  { id: "profile",   emoji: "👤", label: "Profile"  },
  { id: "settings",  emoji: "⚙️", label: "Settings" },
];

export default function BottomNav({ active }) {
  const { navigate, currentTheme: t } = useApp();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: t.isDark
          ? `${t.colors.bgCard}F2`
          : `${t.colors.bgCard}F5`,
        borderTop: `1px solid ${t.colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {NAV_ITEMS.map(({ id, emoji, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 20px",
              borderRadius: t.radii.md,
              position: "relative",
            }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: t.colors.accent,
                }}
              />
            )}

            <span
              style={{
                fontSize: "20px",
                opacity: isActive ? 1 : 0.45,
                transition: "opacity 0.15s, transform 0.15s",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                display: "block",
              }}
            >
              {emoji}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontFamily: t.fonts.body,
                fontWeight: isActive ? "600" : "400",
                color: isActive ? t.colors.accent : t.colors.textMuted,
                transition: "color 0.15s",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
