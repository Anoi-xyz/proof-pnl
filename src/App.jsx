import React, { useState, useCallback, useEffect, useRef } from 'react';
import StickyNav          from './components/StickyNav.jsx';
import IntroSection       from './components/IntroSection.jsx';
import VerifyBlock        from './components/VerifyBlock.jsx';
import HowItWorksSection  from './components/HowItWorksSection.jsx';
import PrivacySection     from './components/PrivacySection.jsx';
import Footer             from './components/Footer.jsx';
import StatusPill         from './components/StatusPill.jsx';
import usePrimusAttestation from './hooks/usePrimusAttestation.js';

/**
 * App
 *
 * State machine:  idle → attesting → success | error → idle
 *
 * Animation class management:
 *   .play    added once after 80 ms (triggers intro animations)
 *   .down    toggled by IntersectionObserver via handleSectionVisible
 *            (forced reflow ensures animations replay on re-entry)
 *   .verify  set when appState === 'attesting'
 *   .ok      added (alongside .verify) when appState === 'success'
 *   .err     added on error, removed after shake animation
 *
 * All classes are applied directly to the .pg DOM node via pgRef
 * to avoid React batching / stale-closure issues with animation replay.
 */
export default function App() {
  // ── State ───────────────────────────────────────────────────
  const [appState,  setAppState]  = useState('idle');   // idle|attesting|success|error
  const [attestStep, setAttestStep] = useState(0);
  const [pnlData,   setPnlData]   = useState(null);
  const [error,     setError]     = useState(null);

  // ── Refs shared with child components ───────────────────────
  const pgRef       = useRef(null);   // .pg wrapper — receives all animation classes
  const appStateRef = useRef('idle'); // mutable, read by useGaze closure
  const isDownRef   = useRef(false);  // mutable, read by useGaze closure

  // Focal element refs (idle gaze targets for useGaze)
  const wordmarkRef = useRef(null);
  const badgeRef    = useRef(null);
  const ctaRef      = useRef(null);

  const { startAttestation } = usePrimusAttestation();

  // ── Intro: add 'play' once on mount ─────────────────────────
  useEffect(() => {
    const id = setTimeout(() => pgRef.current?.classList.add('play'), 80);
    return () => clearTimeout(id);
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
      // Keep 'verify' (its CSS animations are timing-based), add 'ok'
      el.classList.remove('err');
      el.classList.add('ok');
    } else if (appState === 'error') {
      el.classList.remove('ok');
      el.classList.add('err');
      // Remove err + verify after the shake/dimout animations finish
      const id = setTimeout(() => {
        el.classList.remove('err', 'verify');
      }, 1200);
      return () => clearTimeout(id);
    } else {
      // idle / reset
      el.classList.remove('verify', 'ok', 'err');
    }
  }, [appState]);

  // ── Callback from IntersectionObserver in VerifyBlock ───────
  const handleSectionVisible = useCallback((visible) => {
    isDownRef.current = visible;
    const el = pgRef.current;
    if (!el) return;

    if (visible) {
      // Force reflow so CSS animations replay on re-entry
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

      // Parse the data field (it's a JSON string per Primus docs)
      const parsed  = JSON.parse(result.data);
      const rate    = parseFloat(parsed.spotPnlRate); // e.g. -0.04460000
      const pct     = (rate * 100).toFixed(2);        // "-4.46"

      setPnlData({ pct, rate, attestation: result });
      setAppState('success');
    } catch (err) {
      console.error('[ProofPnL] attestation failed:', err);
      setError(err);
      setAppState('error');
    }
  }, [appState, startAttestation]);

  // ── Reset back to idle ───────────────────────────────────────
  const handleReset = useCallback(() => {
    const el = pgRef.current;
    if (el) {
      el.classList.remove('verify', 'ok', 'err');
      // Re-trigger badge / cta animations if section still visible
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
      {/* Fixed dot-grid / glow background (below everything) */}
      <div className="bgl" aria-hidden="true" />

      <StickyNav />

      {/*
        .pg — the hero + verify film strip.
        All animation classes (play, down, verify, ok, err) live here.
        HowItWorks, Privacy, Footer sit OUTSIDE .pg so those selectors
        don't bleed into the later sections.
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
          onVerify={handleVerify}
          onReset={handleReset}
          onSectionVisible={handleSectionVisible}
        />
      </div>

      <HowItWorksSection />
      <PrivacySection />
      <Footer />

      {/* Fixed status pill — visible during attesting / success / error */}
      <StatusPill
        appState={appState}
        attestStep={attestStep}
        error={error}
      />
    </>
  );
}
