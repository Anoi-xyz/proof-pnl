import React, { useEffect, useRef } from 'react';

export default function StickyNav() {
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      navRef.current?.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="nav" ref={navRef} aria-label="Main navigation">
      <a href="#" className="nav-logo" aria-label="ProofPnL home">
        <img src="/assets/primus-icon.png" alt="Primus" width="28" height="28" />
        Proof<span style={{ color: 'var(--acc)' }}>PnL</span>
      </a>

      <ul className="nav-links" role="list">
        <li className="hide-sm">
          <a href="#how-it-works">How it works</a>
        </li>
        <li className="hide-sm">
          <a href="#privacy">Privacy</a>
        </li>
        <li>
          <a href="#verify" className="nav-cta">Verify PnL</a>
        </li>
      </ul>
    </nav>
  );
}
