/**
 * useGaze — exact port of the reference look() function.
 *
 * Eye positions (from reference CSS):
 *   Left iris:  left 10.87%  top 30.27%  width 31.58%
 *   Right iris: left 56.71%  top 30.4%   width 31.58%
 *   Eye centres: x = [26.7%, 72.5%] of owl width
 *                y = 42.1%            of owl height
 *
 * All mutable values are accepted as refs so the single RAF loop
 * always reads the latest state without stale closures or re-mounts.
 */
import { useEffect } from 'react';

const SMOOTH     = 11;       // smoothing factor — matches reference
const MAX_TRAVEL = 0.0306;   // max iris travel as fraction of owl width
const EYE_X      = [0.267, 0.725]; // left / right eye x-centre fractions
const EYE_Y      = 0.421;          // y-centre fraction
const IDLE_MS    = 3500;           // ms before switching to idle target

export function useGaze({
  tiltRef,    // ref → .tilt div
  ilRef,      // ref → left iris img
  irRef,      // ref → right iris img
  wordmarkRef,// ref → .wm div  (idle target: hero)
  badgeRef,   // ref → .badge   (idle target: verify)
  ctaRef,     // ref → .cta     (idle target: attesting)
  appStateRef,// ref → current appState string
  isDownRef,  // ref → boolean, verify section visible
}) {
  useEffect(() => {
    const s = {
      gx: [0, 0], gy: [0, 0],
      tl: [0, 0],
      ptr: null, lastMove: 0,
      t: 0, last: performance.now(),
      raf: null,
    };

    const onMove = (e) => {
      s.ptr = { x: e.clientX, y: e.clientY };
      s.lastMove = performance.now();
    };
    const onLeave = () => { s.ptr = null; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    /** Determine where the eyes should look. Reads refs for freshest state. */
    const getTarget = (r) => {
      const now    = performance.now();
      const appSt  = appStateRef?.current ?? 'idle';
      const isDown = isDownRef?.current ?? false;
      const drift  = Math.sin(s.t * 1.3) * r.width * 0.12;
      const owlCx  = r.left + r.width / 2;
      const owlCy  = r.top + r.height * EYE_Y;

      // Pointer is active
      if (s.ptr && (now - s.lastMove) < IDLE_MS) return s.ptr;

      // During attestation: dart around the button area
      if (appSt === 'attesting' && ctaRef?.current) {
        const cb = ctaRef.current.getBoundingClientRect();
        return {
          x: cb.left + cb.width  / 2 + Math.sin(s.t * 4.2) * r.width * 0.8,
          y: cb.top  + cb.height / 2 + Math.sin(s.t * 2.1) * r.width * 0.1,
        };
      }

      // Verify section visible: look at CTA if it is on screen, else badge
      if (isDown) {
        if (ctaRef?.current) {
          const cr = ctaRef.current.getBoundingClientRect();
          const onScreen = cr.top > -60 && cr.bottom < window.innerHeight + 60;
          if (onScreen) return { x: cr.left + cr.width / 2 + drift * 0.4, y: cr.top + cr.height / 2 };
        }
        if (badgeRef?.current) {
          const br = badgeRef.current.getBoundingClientRect();
          return { x: br.left + br.width / 2, y: br.top + br.height * 0.4 };
        }
      }

      // Hero: look at wordmark
      if (wordmarkRef?.current) {
        const wr = wordmarkRef.current.getBoundingClientRect();
        if (wr.bottom > 0 && wr.top < window.innerHeight) {
          return { x: wr.left + wr.width / 2, y: wr.top + wr.height / 2 };
        }
      }

      // Later sections / fallback: gentle drift
      return { x: owlCx + drift, y: owlCy };
    };

    const tick = (now) => {
      s.raf = requestAnimationFrame(tick);
      const dt = Math.min((now - s.last) / 1000, 0.1);
      s.last = now;
      s.t += dt;

      const tiltEl = tiltRef?.current;
      const ilEl   = ilRef?.current;
      const irEl   = irRef?.current;
      if (!tiltEl || !ilEl || !irEl) return;

      const r = tiltEl.getBoundingClientRect();
      if (r.width === 0) return;

      const k  = 1 - Math.exp(-dt * SMOOTH);
      const tr = r.width * MAX_TRAVEL;
      const g  = getTarget(r);

      const cx = [r.left + r.width * EYE_X[0], r.left + r.width * EYE_X[1]];
      const cy = r.top + r.height * EYE_Y;

      [ilEl, irEl].forEach((el, i) => {
        const dx = g.x - cx[i];
        const dy = g.y - cy;
        const d  = Math.hypot(dx, dy) || 1;
        const m  = Math.min(1, d / (r.width * 0.8));
        s.gx[i] += (dx / d * tr * m - s.gx[i]) * k;
        s.gy[i] += (dy / d * tr * m - s.gy[i]) * k;
        el.style.transform = `translate3d(${s.gx[i].toFixed(2)}px,${s.gy[i].toFixed(2)}px,0)`;
      });

      // Head tilt (±3 deg, ±0.8%/0.6% translate)
      const hx = Math.max(-1, Math.min(1, (g.x - (r.left + r.width / 2)) / (window.innerWidth  * 0.5)));
      const hy = Math.max(-1, Math.min(1, (g.y - cy)                      / (window.innerHeight * 0.5)));
      s.tl[0] += (hx - s.tl[0]) * k;
      s.tl[1] += (hy - s.tl[1]) * k;
      tiltEl.style.transform =
        `translate(${(s.tl[0] * 0.8).toFixed(2)}%,${(s.tl[1] * 0.6).toFixed(2)}%) ` +
        `rotate(${(s.tl[0] * 3).toFixed(2)}deg)`;
    };

    s.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []); // single mount — all values read through refs
}
