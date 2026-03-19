import React from "react";
import { useApp } from "../App";
import BottomNav from "../components/BottomNav";

export default function SettingsScreen() {
  const {
    darkMode,  setDarkMode,
    fontScale, setFontScale,
    currentTheme: t,
  } = useApp();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.colors.bg,
        paddingBottom: "88px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "52px 20px 20px",
          background: `linear-gradient(180deg, ${t.colors.bgCard} 0%, ${t.colors.bg} 100%)`,
        }}
      >
        <h1
          style={{
            fontFamily: t.fonts.heading,
            fontSize: "24px",
            fontWeight: "700",
            color: t.colors.text,
            margin: 0,
          }}
        >
          Settings
        </h1>
        <p style={{ color: t.colors.textMuted, fontSize: "13px", marginTop: "4px" }}>
          Customise your experience
        </p>
      </div>

      <div style={{ padding: "8px 20px" }}>

        {/* ── Appearance ── */}
        <SectionLabel text="Appearance" t={t} />

        {/* Dark / Light mode */}
        <SettingCard t={t} style={{ marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: t.fonts.heading,
                fontWeight: "600",
                color: t.colors.text,
                fontSize: "15px",
                marginBottom: "3px",
              }}
            >
              {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </div>
            <div style={{ color: t.colors.textMuted, fontSize: "12px" }}>
              {darkMode
                ? "Easy on the eyes — great at night"
                : "Clean & bright for daytime use"}
            </div>
          </div>
          <Toggle value={darkMode} onChange={setDarkMode} t={t} />
        </SettingCard>

        {/* ── Text ── */}
        <SectionLabel text="Text" t={t} />

        {/* Font size */}
        <SettingCard t={t} style={{ flexDirection: "column", alignItems: "stretch", gap: "14px" }}>
          <div>
            <div
              style={{
                fontFamily: t.fonts.heading,
                fontWeight: "600",
                color: t.colors.text,
                fontSize: "15px",
                marginBottom: "3px",
              }}
            >
              🔡 Font Size
            </div>
            <div style={{ color: t.colors.textMuted, fontSize: "12px" }}>
              Affects text size across the app
            </div>
          </div>

          {/* S / M / L picker */}
          <div style={{ display: "flex", gap: "10px" }}>
            {[
              { key: "sm", label: "Small",  sampleSize: "13px" },
              { key: "md", label: "Medium", sampleSize: "16px" },
              { key: "lg", label: "Large",  sampleSize: "20px" },
            ].map(({ key, label, sampleSize }) => {
              const isSelected = fontScale === key;
              return (
                <button
                  key={key}
                  onClick={() => setFontScale(key)}
                  style={{
                    flex: 1,
                    padding: "14px 8px",
                    borderRadius: t.radii.md,
                    border: `1.5px solid ${isSelected ? t.colors.accent : t.colors.border}`,
                    background: isSelected ? t.colors.accentDim : t.colors.bgElevated,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: t.fonts.heading,
                      fontWeight: "700",
                      fontSize: sampleSize,
                      color: isSelected ? t.colors.accent : t.colors.textMuted,
                      lineHeight: 1,
                    }}
                  >
                    A
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: t.fonts.body,
                      color: isSelected ? t.colors.accent : t.colors.textMuted,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live preview */}
          <div
            style={{
              background: t.colors.bg,
              border: `1px solid ${t.colors.border}`,
              borderRadius: t.radii.sm,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                color: t.colors.textMuted,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "6px",
                fontFamily: t.fonts.body,
              }}
            >
              Preview
            </p>
            <p
              style={{
                fontFamily: t.fonts.body,
                color: t.colors.text,
                fontSize: `${
                  fontScale === "sm" ? 13 : fontScale === "lg" ? 19 : 16
                }px`,
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              The quick brown fox jumped over the lazy dog.
            </p>
          </div>
        </SettingCard>

        {/* ── App info ── */}
        <SectionLabel text="About" t={t} />
        <SettingCard t={t}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: t.fonts.heading,
                fontWeight: "600",
                color: t.colors.text,
                fontSize: "15px",
                marginBottom: "3px",
              }}
            >
              ⚡ MicroLearn
            </div>
            <div style={{ color: t.colors.textMuted, fontSize: "12px" }}>
              Version 1.0 · Built with Claude AI
            </div>
          </div>
        </SettingCard>
      </div>

      <BottomNav active="settings" />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text, t }) {
  return (
    <div
      style={{
        color: t.colors.textMuted,
        fontSize: "11px",
        fontFamily: t.fonts.heading,
        fontWeight: "600",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "8px",
        marginLeft: "2px",
        marginTop: "16px",
      }}
    >
      {text}
    </div>
  );
}

function SettingCard({ children, t, style = {} }) {
  return (
    <div
      style={{
        background: t.colors.bgCard,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radii.lg,
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "10px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ value, onChange, t }) {
  return (
    <div
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      style={{
        width: "50px",
        height: "28px",
        borderRadius: t.radii.full,
        background: value ? t.colors.accent : t.colors.border,
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "25px" : "3px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: value ? t.colors.bg : t.colors.bgElevated,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 5px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
}
