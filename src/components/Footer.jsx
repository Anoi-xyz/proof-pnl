import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        ProofPnL uses{' '}
        <a href="https://primuslabs.xyz" target="_blank" rel="noopener noreferrer">
          Primus zkTLS
        </a>{' '}
        to prove your data without revealing credentials.
      </p>
      <p style={{ marginTop: 4 }}>
        Only your spot PnL rate is revealed. Everything else stays private.
      </p>
    </footer>
  );
}
