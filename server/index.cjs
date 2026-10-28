/**
 * ProofPnL — Backend signing proxy
 *
 * Uses the Primus SDK's own sign() method in Node so the signing logic
 * is always in sync with the SDK version.
 *
 * sign() internally:
 *   1. Creates an ethers.Wallet from APP_SECRET (Ethereum private key)
 *   2. Computes keccak256(requestStr) → signs with EIP-191
 *   3. Returns JSON: { attRequest, appSignature }
 *
 * Route: POST /api/sign
 *   Body:    { requestStr: string }
 *   Returns: { signedRequestStr: string }
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT ?? 3001;

const APP_ID     = process.env.VITE_APP_ID  ?? '';
const APP_SECRET = process.env.APP_SECRET   ?? '';

if (!APP_SECRET) {
  console.error('[ProofPnL] ERROR: APP_SECRET is not set in .env');
}
if (!APP_ID) {
  console.warn('[ProofPnL] WARNING: VITE_APP_ID is not set in .env');
}

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '64kb' }));

// ── SDK instance (lazy, cached) ─────────────────────────────────
let primusInstance = null;
async function getPrimus() {
  if (primusInstance) return primusInstance;
  // Dynamic ESM import in a CJS context
  const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
  const p = new PrimusZKTLS();
  // init() is synchronous; it just stores appId + appSecret on the instance
  p.init(APP_ID, APP_SECRET);
  primusInstance = p;
  return p;
}

// ── Routes ──────────────────────────────────────────────────────
app.post('/api/sign', async (req, res) => {
  console.log('[/api/sign] body keys:', Object.keys(req.body ?? {}));
  console.log('[/api/sign] requestStr type:', typeof req.body?.requestStr);
  if (req.body?.requestStr) {
    console.log('[/api/sign] requestStr (first 120):', String(req.body.requestStr).slice(0, 120));
  }

  const { requestStr } = req.body ?? {};

  if (!requestStr || typeof requestStr !== 'string') {
    console.error('[/api/sign] REJECTED: requestStr missing or not a string. Got:', typeof requestStr);
    return res.status(400).json({ error: `requestStr is required and must be a string (got ${typeof requestStr})` });
  }
  if (!APP_SECRET) {
    return res.status(500).json({ error: 'APP_SECRET not configured on server' });
  }

  try {
    const primus = await getPrimus();
    // sign() takes the JSON string and returns JSON.stringify({ attRequest, appSignature })
    const signedRequestStr = await primus.sign(requestStr);

    // [DEBUG-b] log what sign() returned before we send it back
    console.log('[/api/sign][b] typeof signedRequestStr from sign():', typeof signedRequestStr);
    console.log('[/api/sign][b] signedRequestStr length:', signedRequestStr?.length);

    // Return as-is in a JSON field — frontend reads data.signedRequestStr (a string)
    return res.json({ signedRequestStr });
  } catch (err) {
    console.error('[sign] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, appId: APP_ID ? APP_ID.slice(0, 8) + '…' : 'NOT SET' }));

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ProofPnL] Signing proxy → http://localhost:${PORT}`);
  console.log(`[ProofPnL] APP_ID:     ${APP_ID ? APP_ID.slice(0,8) + '…' : '⚠ NOT SET'}`);
  console.log(`[ProofPnL] APP_SECRET: ${APP_SECRET ? '✓ set' : '⚠ NOT SET'}`);
});
