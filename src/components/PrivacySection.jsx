import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

const HIDDEN = [
  'Your Binance login credentials',
  'Full account balance',
  'Individual trade history',
  'Deposit & withdrawal records',
  'Personal account details',
];

const REVEALED = [
  'Spot PnL rate (single decimal number)',
];

export default function PrivacySection() {
  const ref = useRef(null);
  const visible = useScrollReveal(ref, { threshold: 0.15, once: false });

  return (
    <section id="privacy" className="priv" ref={ref}>
      <div className="section-inner">
        <h2 className="section-title">
          What stays <span>private</span>
        </h2>
        <div className={`privacy-grid reveal-item${visible ? ' visible' : ''}`}>
          <div className="privacy-col hidden-col">
            <p className="privacy-col-title">Hidden — never revealed</p>
            <ul className="privacy-list">
              {HIDDEN.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="privacy-col revealed-col">
            <p className="privacy-col-title">Revealed — one field only</p>
            <ul className="privacy-list">
              {REVEALED.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
