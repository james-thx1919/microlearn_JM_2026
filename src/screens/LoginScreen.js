import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { theme } from '../theme';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Login error:', e.code, e.message);
      setError(e.message || 'Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const pill = (text) => (
    <span key={text} style={{
      background: theme.colors.bgElevated,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radii.full,
      padding: '5px 13px',
      fontSize: '13px',
      color: theme.colors.textMuted,
      whiteSpace: 'nowrap',
    }}>{text}</span>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(168,255,62,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '280px', height: '280px',
        background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 28px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: theme.colors.accentDim,
            border: `1px solid rgba(168,255,62,0.25)`,
            borderRadius: theme.radii.full,
            padding: '8px 18px', marginBottom: '28px',
          }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontFamily: theme.fonts.heading, color: theme.colors.accent, fontWeight: '600', fontSize: '15px' }}>
              MicroLearn
            </span>
          </div>

          <h1 style={{
            fontFamily: theme.fonts.heading,
            fontSize: '42px', fontWeight: '800',
            color: theme.colors.text,
            lineHeight: '1.1', letterSpacing: '-1.5px',
            marginBottom: '16px',
          }}>
            Learn something<br />
            <span style={{ color: theme.colors.accent }}>every day.</span>
          </h1>

          <p style={{
            color: theme.colors.textMuted,
            fontSize: '17px', lineHeight: '1.65',
            maxWidth: '320px',
          }}>
            Replace scroll time with 5-minute AI-powered lessons that actually stick.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '48px' }}>
          {['⚡ AI lessons', '🔥 Streaks', '🎯 Quizzes', '🏆 Badges', '📊 Progress'].map(pill)}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            width: '100%',
            background: loading ? theme.colors.bgElevated : '#ffffff',
            color: '#111',
            border: 'none', borderRadius: theme.radii.md,
            padding: '17px',
            fontFamily: theme.fonts.heading,
            fontSize: '16px', fontWeight: '600',
            cursor: loading ? 'default' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? <span style={{ color: theme.colors.textMuted }}>Signing in…</span>
            : <><GoogleIcon /> Continue with Google</>}
        </button>

        {error && (
          <p style={{ color: theme.colors.error, textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
            {error}
          </p>
        )}

        <p style={{
          color: theme.colors.textDim, fontSize: '12px',
          textAlign: 'center', marginTop: '24px', lineHeight: '1.6',
        }}>
          Personal learning data stored securely in Firebase.
        </p>
      </div>
    </div>
  );
}
