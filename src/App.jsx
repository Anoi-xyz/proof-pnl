import React, { useState, useCallback, useEffect, useRef } from 'react';
import StickyNav          from './components/StickyNav.jsx';
import IntroSection       from './components/IntroSection.jsx';
import VerifyBlock        from './components/VerifyBlock.jsx';
import HowItWorksSection  from './components/HowItWorksSection.jsx';
import PrivacySection     from './components/PrivacySection.jsx';
import Footer             from './components/Footer.jsx';
import StatusPill         from './components/StatusPill.jsx';
import UsernameGate       from './components/UsernameGate.jsx';
import usePrimusAttestation from './hooks/usePrimusAttestation.js';
import { useTheme }       from './hooks/useTheme.js';

const USERNAME_KEY = 'ppnl_username';

/**
 * App
 *
 * State machine:  idle → attesting → success | error → idle
 *
 * Gate phases:
 *   'show'   — UsernameGate overlay is visible (first visit or "change" clicked)
 *   'fading' — overlay transitioning out (CSS opacity → 0 over 500 ms)
 *   'done'   — overlay removed; main site is fully visible
 *
 * Animation class management on .pg:
 *   .play    added once after the gate closes (or immediately for returning users)
 *   .down    toggled by IntersectionObserver via handleSectionVisible
 *   .verify  set when appState === 'attesting'
 *   .ok      added when appState === 'success'
 *   .err     added on error, removed after shake animation
 */
export default function App() {
  // ── Theme ────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  // ── Username + gate ──────────────────────────────────────────
  const [username,   setUsername]   = useState(() => localStorage.getItem(USERNAME_KEY) ?? '');
  const [gatePhase,  setGatePhase]  = useState(() => localStorage.getItem(USERNAME_KEY) ? 'done' : 'show');

  // ── Attestation state ────────────────────────────────────────
  const [appState,   setAppState]   = useState('idle');
  const [attestStep, setAttestStep] = useState(0);
  const [pnlData,    setPnlData]    = useState(null);
  const [error,      setError]      = useState(null);

  // ── Refs shared with child components ────────────────────────
  const pgRef        = useRef(null);
  const appStateRef  = useRef('idle');
  const isDownRef    = useRef(false);
  const introPlayed  = useRef(false);   // guard: never play intro twice

  // Focal element refs (idle gaze targets)
  const wordmarkRef = useRef(null);
  const badgeRef    = useRef(null);
  const ctaRef      = useRef(null);

  const { startAttestation } = usePrimusAttestation();

  // ── Trigger intro (.play) — called once, after gate is done ──
  const triggerIntro = useCallback(() => {
    if (introPlayed.current) return;
    introPlayed.current = true;
    setTimeout(() => pgRef.current?.classList.add('play'), 80);
  }, []);

  // For returning users (gate already 'done' on mount), play intro immediately
  useEffect(() => {
    if (gatePhase === 'done') triggerIntro();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gate submit ──────────────────────────────────────────────
  const handleGateSubmit = useCallback((name) => {
    // Save to localStorage — name is plain text, set via textContent in UI
    localStorage.setItem(USERNAME_KEY, name);
    setUsername(name);
    setGatePhase('fading');
    // After the 500 ms CSS fade, remove the overlay and start the intro
    setTimeout(() => {
      setGatePhase('done');
      triggerIntro();
    }, 520);
  }, [triggerIntro]);

  // ── Change username — re-show the gate without replaying intro ──
  const handleChangeUsername = useCallback(() => {
    setGatePhase('show');
  }, []);

  // ── Sync appState → .pg DOM classes ─────────────────────────
  useEffect(() => {
    appStateRef.current = appState;
    const el = pgRef.current;
    if (!el) return;

    if (appState === 'attesting') {
      el.classList.remove('ok', 'err');
      el.classList.add('verify');
    } else if (appState === 'success') {
      el.classList.remove('err');
      el.classList.add('ok');
    } else if (appState === 'error') {
      el.classList.remove('ok');
      el.classList.add('err');
      const id = setTimeout(() => el.classList.remove('err', 'verify'), 1200);
      return () => clearTimeout(id);
    } else {
      el.classList.remove('verify', 'ok', 'err');
    }
  }, [appState]);

  // ── Callback from IntersectionObserver in VerifyBlock ────────
  const handleSectionVisible = useCallback((visible) => {
    isDownRef.current = visible;
    const el = pgRef.current;
    if (!el) return;
    if (visible) {
      el.classList.remove('down');
      void el.offsetWidth;
      el.classList.add('down');
    } else {
      el.classList.remove('down');
    }
  }, []);

  // ── Verify flow ──────────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (appState === 'attesting') return;
    setAppState('attesting');
    setError(null);
    setPnlData(null);
    setAttestStep(0);

    try {
      const result = await startAttestation((step) => setAttestStep(step));
      const parsed = JSON.parse(result.data);
      const rate   = parseFloat(parsed.spotPnlRate);
      const pct    = (rate * 100).toFixed(2);
      setPnlData({ pct, rate, attestation: result });
      setAppState('success');
    } catch (err) {
      console.error('[ProofPnL] attestation failed:', err);
      setError(err);
      setAppState('error');
    }
  }, [appState, startAttestation]);

  // ── Reset to idle ────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const el = pgRef.current;
    if (el) {
      el.classList.remove('verify', 'ok', 'err');
      if (isDownRef.current) {
        el.classList.remove('down');
        void el.offsetWidth;
        el.classList.add('down');
      }
    }
    setAppState('idle');
    setPnlData(null);
    setError(null);
    setAttestStep(0);
    appStateRef.current = 'idle';
  }, []);

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Username gate — rendered until gatePhase is 'done' */}
      {gatePhase !== 'done' && (
        <UsernameGate
          fading={gatePhase === 'fading'}
          onSubmit={handleGateSubmit}
        />
      )}

      {/* Fixed dot-grid / glow background */}
      <div className="bgl" aria-hidden="true" />

      <StickyNav
        username={username}
        onChangeUsername={handleChangeUsername}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/*
        .pg — hero + verify film strip.
        Animation classes (play, down, verify, ok, err) all live here.
      */}
      <div className="pg" ref={pgRef}>
        <IntroSection wordmarkRef={wordmarkRef} />

        <VerifyBlock
          appState={appState}
          appStateRef={appStateRef}
          isDownRef={isDownRef}
          pnlData={pnlData}
          attestStep={attestStep}
          error={error}
          wordmarkRef={wordmarkRef}
          badgeRef={badgeRef}
          ctaRef={ctaRef}
          username={username}
          onVerify={handleVerify}
          onReset={handleReset}
          onSectionVisible={handleSectionVisible}
        />
      </div>

      <HowItWorksSection />
      <PrivacySection />
      <Footer />

      {/* Fixed status pill */}
      <StatusPill appState={appState} attestStep={attestStep} error={error} />
    </>
  );
}
