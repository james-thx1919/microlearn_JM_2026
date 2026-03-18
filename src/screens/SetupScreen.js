import React, { useState } from "react";
import { theme } from "../theme";

export default function SetupScreen({ onSave }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError('Anthropic API keys start with "sk-ant-". Please double-check.');
      return;
    }
    onSave(trimmed);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "320px",
          background:
            "radial-gradient(circle, rgba(168,255,62,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔑</div>
          <h1
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: "26px",
              fontWeight: "700",
              color: theme.colors.text,
              letterSpacing: "-0.5px",
              marginBottom: "10px",
            }}
          >
            One last step
          </h1>
          <p
            style={{
              color: theme.colors.textMuted,
              lineHeight: "1.6",
              fontSize: "15px",
            }}
          >
            Paste your Anthropic API key to power AI-generated lessons. Get one
            free at{" "}
            <span style={{ color: theme.colors.accent }}>
              console.anthropic.com
            </span>
          </p>
        </div>

        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError("");
          }}
          placeholder="sk-ant-api03-…"
          style={{
            width: "100%",
            background: theme.colors.bgCard,
            border: `1px solid ${
              error ? theme.colors.error : theme.colors.border
            }`,
            borderRadius: theme.radii.md,
            padding: "16px",
            color: theme.colors.text,
            fontSize: "15px",
            outline: "none",
            marginBottom: error ? "8px" : "16px",
            transition: "border-color 0.2s",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />

        {error && (
          <p
            style={{
              color: theme.colors.error,
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            background: theme.colors.accent,
            color: "#000",
            border: "none",
            borderRadius: theme.radii.md,
            padding: "16px",
            fontFamily: theme.fonts.heading,
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Start Learning →
        </button>

        {[
          {
            icon: "🔒",
            text: "Key is stored only in your browser's localStorage — never sent to our servers.",
          },
          {
            icon: "💳",
            text: "New Anthropic accounts get free credits to get you started.",
          },
        ].map(({ icon, text }) => (
          <div
            key={icon}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.md,
              padding: "12px 14px",
              marginTop: "10px",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>{icon}</span>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
