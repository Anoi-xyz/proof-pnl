import React, { useRef, useEffect } from 'react';
import AttestationBadge from './AttestationBadge.jsx';
import { useGaze } from '../hooks/useGaze.js';

/**
 * VerifyBlock
 *
 * Houses the owl (cam → owl → tilt), badge card, dim overlay, and verify CTA.
 * The owl structure mirrors the reference exactly:
 *   .cam > .owl > .tilt > [.body, .eg.l, .eg.r, .iris.l, .iris.r]
 *              > .beam
 *              > .shock
 *
 * IntersectionObserver watches the whole <section id="verify"> element.
 * 'down' stays active as long as ANY part of the section is in the viewport —
 * not just the first pixel — so the badge/CTA never disappear mid-scroll.
 */
export default function VerifyBlock({
  appState,
  appStateRef,
  isDownRef,
  pnlData,
  attestStep,
  error,
  wordmarkRef,
  badgeRef,
  ctaRef,
  username,
  onVerify,
  onReset,
  onSectionVisible,
}) {
  const tiltRef    = useRef(null);
  const ilRef      = useRef(null);
  const irRef      = useRef(null);
  const sectionRef = useRef(null);   // ← observe the whole section

  /* Eye-tracking — all values via refs, single RAF loop, never re-mounts */
  useGaze({ tiltRef, ilRef, irRef, wordmarkRef, badgeRef, ctaRef, appStateRef, isDownRef });

  /*
   * Observe the entire section so `onSectionVisible` fires true whenever
   * any part of the verify block is in the viewport (threshold:0 = any pixel).
   * This keeps .down on .pg while the user is scrolling through this area.
   */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => onSectionVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSectionVisible]);

  /* CTA label */
  const ctaLabel = {
    idle:      'verify my pnl',
    attesting: 'verifying\u2026',
    success:   'verified \u2713',
    error:     'try again',
  }[appState] ?? 'verify my pnl';

  const ctaCls = [
    'cta',
    appState === 'error' ? 'err-btn' : '',
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (appState === 'error')     { onReset(); return; }
    if (appState !== 'attesting') { onVerify(); }
  };

  return (
    /* id="verify" is the scroll anchor for nav links */
    <section id="verify" ref={sectionRef} aria-label="Verify your PnL">

      {/*
        Dim overlay — position:fixed in CSS, z-index:3.
        Animated by .verify .dim selector on the .pg ancestor.
      */}
      <div className="dim" aria-hidden="true" />

      {/* ── Owl camera ────────────────────────────────────────── */}
      <div className="cam" aria-hidden="true">
        <div className="owl">
          <div className="tilt" ref={tiltRef}>
            <img
              className="body"
              src="/assets/owl-body.webp"
              alt="Primus owl mascot"
              draggable={false}
            />
            {/* Eye glow circles */}
            <i className="eg l" />
            <i className="eg r" />
            {/* Iris layers — translated by useGaze */}
            <img className="iris l" ref={ilRef} src="/assets/owl-iris-left.webp"  alt="" draggable={false} />
            <img className="iris r" ref={irRef} src="/assets/owl-iris-right.webp" alt="" draggable={false} />
          </div>
        </div>
        {/* Scan beam (animated by .verify .beam) */}
        <i className="beam" aria-hidden="true" />
        {/* Shockwave (animated by .ok .shock) */}
        <i className="shock" aria-hidden="true" />
      </div>

      {/* ── Badge card + action buttons ───────────────────────── */}
      <AttestationBadge
        badgeRef={badgeRef}
        pnlData={pnlData}
        appState={appState}
        username={username}
      />

      {/* ── Verify button ──────────────────────────────────────── */}
      <button
        id="verify-btn"
        ref={ctaRef}
        className={ctaCls}
        type="button"
        onClick={handleClick}
        disabled={appState === 'attesting'}
        aria-live="polite"
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </button>

      {/* Reset link appears after success or error */}
      <button
        className="reset-btn"
        type="button"
        onClick={onReset}
        aria-label="Verify again"
      >
        {appState === 'success' ? 'verify again' : 'start over'}
      </button>

    </section>
  );
}
