import React, { useEffect, useRef } from 'react';

/**
 * StickyNav
 *
 * Props:
 *   username        {string}   — current username ('' if none yet)
 *   onChangeUsername {fn}      — open the gate again so user can pick a new name
 *   theme           {string}   — 'light' | 'dark'
 *   onToggleTheme   {fn}       — flip the theme
 */
export default function StickyNav({ username, onChangeUsername, theme, onToggleTheme }) {
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

      {/* Username display — quiet muted text + "change" link */}
      {username && (
        <div className="nav-user" aria-label={`Signed in as ${username}`}>
          <span className="nav-user-name" title={`@${username}`}>@{username}</span>
          <button
            className="nav-user-change"
            type="button"
            onClick={onChangeUsername}
            aria-label="Change username"
          >
            change
          </button>
        </div>
      )}

      <ul className="nav-links" role="list">
        <li className="hide-sm">
          <a href="#how-it-works">How it works</a>
        </li>
        <li className="hide-sm">
          <a href="#privacy">Privacy</a>
        </li>

        {/* Dark / Light theme toggle */}
        <li>
          <button
            className="nav-theme"
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </li>

        <li>
          <a href="#verify" className="nav-cta">Verify PnL</a>
        </li>
      </ul>
    </nav>
  );
}
