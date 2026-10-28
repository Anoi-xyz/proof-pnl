import React, { useEffect, useRef, useState } from 'react';

const SAMPLE_PCT   = '+8.42';
const SAMPLE_ADDR  = '0x5ed3…8c14';
const SAMPLE_SIG   = '0x4c2f…5c11';

function shorten(s, n = 4) {
  if (!s || s.length < n * 2 + 2) return s ?? '—';
  return `${s.slice(0, 2 + n)}…${s.slice(-n)}`;
}

function formatTs(ms) {
  if (!ms) return '—';
  try {
    return new Date(Number(ms)).toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

export default function AttestationBadge({ badgeRef, pnlData, appState }) {
  const [displayPct, setDisplayPct] = useState(null);
  const rafRef = useRef(null);

  /* Count-up animation when success arrives */
  useEffect(() => {
    if (appState !== 'success' || !pnlData) return;
    const target   = parseFloat(pnlData.pct);
    const duration = 1300;
    const start    = performance.now();

    const tick = (now) => {
      const p    = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayPct((target * ease).toFixed(2));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [appState, pnlData]);

  /* Reset display when going back to idle */
  useEffect(() => {
    if (appState === 'idle') setDisplayPct(null);
  }, [appState]);

  const isVerified = appState === 'success' && pnlData;
  const att        = pnlData?.attestation;

  const pctValue   = isVerified
    ? (displayPct !== null ? displayPct : pnlData.pct)
    : SAMPLE_PCT;
  const isNeg      = parseFloat(pctValue) < 0;
  const pctDisplay = isVerified
    ? `${parseFloat(pctValue) >= 0 ? '+' : ''}${pctValue}%`
    : `${SAMPLE_PCT}%`;

  const attestor  = isVerified ? shorten(att?.attestorAddr ?? att?.attRequest?.attestorAddr) : SAMPLE_ADDR;
  const sig       = isVerified ? shorten(att?.signature) : SAMPLE_SIG;
  const timestamp = isVerified ? formatTs(att?.attRequest?.timestamp ?? att?.timestamp) : null;

  const handleShare = async () => {
    const sign  = parseFloat(pnlData?.pct) >= 0 ? '+' : '';
    const text  = `My Binance spot PnL is ${sign}${pnlData?.pct}%, verified by Primus zkTLS 🔐`;
    if (navigator.share) {
      try { await navigator.share({ text, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(badgeRef.current, { scale: 2, useCORS: true });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'proofpnl-badge.png';
      a.click();
    } catch {
      alert('Screenshot your badge to save it.');
    }
  };

  return (
    <>
      <div className="badge" id="badge-card" ref={badgeRef}>
        {/* Header row */}
        <div className="bt">
          <b>
            <img src="/assets/primus-icon.png" width="26" height="26" alt="" aria-hidden="true" />
            ProofPnL
          </b>
          <span className="pill">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 8.5l4 4L14 4" />
            </svg>
            Verified by Primus zkTLS
          </span>
        </div>

        {/* PnL percentage */}
        <div className={`pct${isNeg && isVerified ? ' neg' : ''}`} aria-live="polite">
          {pctDisplay}
        </div>
        <div className="lbl">
          Binance Spot PnL Rate{!isVerified && ' (sample)'}
        </div>

        {/* Key-value rows — inline animationDelay ensures correct stagger */}
        <div className="kv" style={{ animationDelay: '1.9s' }}>
          Attestor <span>{attestor}</span>
        </div>
        <div className="kv" style={{ animationDelay: '2.2s' }}>
          Signature <span>{sig}</span>
        </div>
        <div className="kv" style={{ animationDelay: '2.5s' }}>
          {isVerified ? 'Timestamp' : 'Fields revealed'}{' '}
          <span>{isVerified ? timestamp : '1'}</span>
        </div>
      </div>

      {/* Action buttons — only visible after success (.ok class via CSS) */}
      <div className="badge-actions">
        <button className="btn-ghost" type="button" onClick={handleShare}>
          Share
        </button>
        <button className="btn-ghost" type="button" onClick={handleDownload}>
          Download card
        </button>
      </div>
    </>
  );
}
