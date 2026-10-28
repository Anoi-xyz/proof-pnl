import React, { useRef, useEffect, useState } from 'react';

/** Username validation: 2–20 chars, letters / numbers / _ . - only */
const VALID_RE = /^[a-zA-Z0-9_.\-]+$/;

function validate(raw) {
  const v = raw.trim();
  if (v.length < 2)       return 'At least 2 characters, please.';
  if (v.length > 20)      return 'Max 20 characters.';
  if (!VALID_RE.test(v))  return 'Letters, numbers, _ . - only.';
  return null;
}

/**
 * UsernameGate
 *
 * Full-screen overlay shown before the main site.
 * Contains:
 *   - Primus wordmark (fill only — no draw animation)
 *   - Text input + validation + continue button
 *   - Owl peeking from the bottom edge; eyes follow the cursor
 *
 * Props:
 *   fading   {boolean}  — when true, overlay transitions to opacity 0
 *   onSubmit {fn}       — called with the trimmed, validated username string
 */
export default function UsernameGate({ fading, onSubmit }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const tiltRef  = useRef(null);  // bounding-box reference for iris tracking
  const ilRef    = useRef(null);  // left iris element
  const irRef    = useRef(null);  // right iris element

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simplified cursor → iris tracking (no idle target needed on the gate)
  useEffect(() => {
    const MAX_X = 7;   // % of iris width
    const MAX_Y = 4;

    const handleMove = (e) => {
      const tilt = tiltRef.current;
      const il   = ilRef.current;
      const ir   = irRef.current;
      if (!tilt || !il || !ir) return;

      const r  = tilt.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      // Normalise to [-1, 1] relative to half the viewport
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth  / 2)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));

      const tx = dx * MAX_X;
      const ty = dy * MAX_Y;
      il.style.transform = `translate(${tx}%, ${ty}%)`;
      ir.style.transform = `translate(${tx}%, ${ty}%)`;
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setError(err); return; }
    onSubmit(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={`gate${fading ? ' fading' : ''}`} aria-label="Choose a username to get started">
      {/* Wordmark — fill only; the draw animation plays after the gate closes */}
      <div className="gate-wm" role="img" aria-label="Primus">
        <img
          src="/assets/primus-wordmark-fill.png"
          alt="Primus"
          draggable={false}
        />
      </div>

      {/* Input form */}
      <div className="gate-form">
        <p className="gate-label" id="gate-lbl">choose a username</p>
        <input
          ref={inputRef}
          id="gate-input"
          className="gate-input"
          type="text"
          placeholder="e.g. satoshi"
          value={value}
          maxLength={22}
          aria-labelledby="gate-lbl"
          autoComplete="username"
          spellCheck={false}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
        />
        {/* Error uses textContent only (no innerHTML) */}
        <div className="gate-error" role="alert" aria-live="polite">
          {error}
        </div>
        <button
          id="gate-continue"
          className="gate-btn"
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          continue
        </button>
      </div>

      {/* Owl peeking from the bottom edge — eyes follow cursor */}
      <div className="gate-owl-wrap" aria-hidden="true">
        <div className="tilt" ref={tiltRef}>
          <img
            className="body"
            src="/assets/owl-body.webp"
            alt=""
            draggable={false}
          />
          <i className="eg l" />
          <i className="eg r" />
          <img className="iris l" ref={ilRef} src="/assets/owl-iris-left.webp"  alt="" draggable={false} />
          <img className="iris r" ref={irRef} src="/assets/owl-iris-right.webp" alt="" draggable={false} />
        </div>
      </div>
    </div>
  );
}
