import React from 'react';

/**
 * IntroSection
 * Renders the hero area: wordmark (outline + fill), animated dot, tagline.
 * CSS animations are triggered by the 'play' class on the parent .pg div
 * (added by App.jsx after 80 ms on mount).
 * Assets are the real /public/assets files.
 */
export default function IntroSection({ wordmarkRef }) {
  return (
    <section className="hero" aria-label="Hero">
      {/* Wordmark: outline draws first, fill sweeps over it */}
      <div className="wm" role="img" aria-label="Primus" ref={wordmarkRef}>
        <img
          className="ol"
          src="/assets/primus-wordmark-outline.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <img
          className="fl"
          src="/assets/primus-wordmark-fill.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        {/* Animated dot that drops then runs across the wordmark */}
        <i className="dot" aria-hidden="true" />
      </div>

      {/* Tagline with blue selection sweep */}
      <p className="tag">
        <span>prove your pnl. show nothing else.</span>
      </p>
    </section>
  );
}
