import React, { useRef } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

const STEPS = [
  {
    num: '01',
    title: 'Connect to Binance',
    body: 'The Primus extension opens a live Binance session inside a secure zkTLS tunnel. Your credentials never leave your browser.',
  },
  {
    num: '02',
    title: 'Generate the proof',
    body: 'A zero-knowledge proof is generated from your session data. Only the spot PnL rate is extracted — nothing else is read or stored.',
  },
  {
    num: '03',
    title: 'Share the badge',
    body: 'Primus attestors sign the result on-chain. Anyone can verify the badge is authentic without seeing your account details.',
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const visible = useScrollReveal(ref, { threshold: 0.15, once: false });

  return (
    <section id="how-it-works" className="hiw" ref={ref}>
      <div className="section-inner">
        <h2 className="section-title">
          How it <span>works</span>
        </h2>
        <div className="step-grid">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`step-card reveal-item${visible ? ' visible' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="step-num">{s.num}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
