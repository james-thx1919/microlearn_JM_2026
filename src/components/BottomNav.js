import React from "react";
import { useApp } from "../App";
import { theme } from "../theme";

const NAV = [
  { id: "home", screen: "dashboard", icon: "🏠", label: "Home" },
  { id: "history", screen: "history", icon: "📖", label: "History" },
  { id: "profile", screen: "profile", icon: "👤", label: "Profile" },
];

export default function BottomNav({ active }) {
  const { navigate } = useApp();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: "430px",
        margin: "0 auto",
        background: `${theme.colors.bgCard}F2`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: `1px solid ${theme.colors.border}`,
        display: "flex",
        padding: "6px 0 22px",
        zIndex: 100,
      }}
    >
      {NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.screen)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              padding: "8px 0",
            }}
          >
            <span style={{ fontSize: "20px", opacity: isActive ? 1 : 0.45 }}>
              {item.icon}
            </span>
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontSize: "10px",
                letterSpacing: "0.3px",
                fontWeight: isActive ? "600" : "400",
                color: isActive ? theme.colors.accent : theme.colors.textMuted,
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: theme.colors.accent,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
