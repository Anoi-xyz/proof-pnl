import React from 'react';

const STEP_LABELS = [
  'Loading SDK…',
  'Connecting to extension…',
  'Building request…',
  'Signing request…',
  'Generating zkTLS proof…',
];

export default function StatusPill({ appState, attestStep, error }) {
  let text = '';
  let cls  = 'status';

  if (appState === 'attesting') {
    cls  = 'status on';
    text = STEP_LABELS[attestStep] ?? 'Processing…';
  } else if (appState === 'success') {
    cls  = 'status on ok';
    text = 'Verified by Primus zkTLS ✓';
  } else if (appState === 'error' && error) {
    cls  = 'status on err';
    const code = error.code ?? '';
    switch (code) {
      case 'NO_EXTENSION':      text = 'Extension not installed'; break;
      case 'USER_CANCELLED':    text = 'Cancelled'; break;
      case 'SIGNING_FAILED':    text = 'Signing / config error'; break;
      case 'ATTESTATION_FAILED':text = 'Attestation failed'; break;
      default: text = error.message?.slice(0, 60) ?? 'Unknown error';
    }
  }

  if (!text) return null;

  return (
    <div className={cls} role="status" aria-live="polite">
      <i aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
