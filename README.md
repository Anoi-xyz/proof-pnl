# ProofPnL 🔐📊

> A zkTLS-verified Binance Spot PnL badge, powered by [Primus Network](https://primuslabs.xyz).

Generate a cryptographically provable badge of your Binance Spot PnL Rate.  
Your API keys, credentials, and trade history **never leave your browser session** — only the PnL rate is revealed.

---

## How it works

```
Browser (Vite + React)                  Backend (/api/sign)
──────────────────────────────          ─────────────────────────────────────
PrimusZKTLS.init(appId)
generateRequestParams()
    │
    ├──→ POST /api/sign ──────────────→  Reads APP_SECRET from env
    │     { requestStr: string }         Calls primus.sign(requestStr)
    │◄────────────────────────────────── Returns { signedRequestStr: string }
    │
startAttestation(signedRequestStr)  ←→  [Primus Chrome Extension]
verifyAttestation(result)
render badge
```

- **Local dev**: `/api/sign` is proxied to a local Express server (`server/index.cjs`) on port 3001.
- **Production (Vercel)**: `/api/sign` is served by `api/sign.js` as a Vercel Serverless Function.  
  `APP_SECRET` lives only in the Vercel environment — it is never bundled into the browser.

---

## Prerequisites

- **Node.js ≥ 18**
- **[Primus Chrome Extension](https://chromewebstore.google.com/detail/pado/iglbgmakmggfkoidiagnhknlndljlolb)** installed in your browser
- A **[Primus Developer Hub](https://hub.primuslabs.xyz)** account with a project (for App ID + App Secret)

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/<you>/proof-pnl.git
cd proof-pnl
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Then edit .env — two values required:
```

| Variable | Where | Description |
|---|---|---|
| `VITE_APP_ID` | Frontend + Backend | Your Primus Developer Hub App ID |
| `APP_SECRET` | Backend only | Your Primus App Secret (Ethereum private key) |

> ⚠️ `APP_SECRET` must **never** have a `VITE_` prefix — that would expose it in the browser bundle.

### 3. Run (frontend + local signing proxy)

```bash
npm start
```

Opens:
- **Frontend** → `http://localhost:5173`
- **Signing proxy** → `http://localhost:3001` (proxied via Vite's `/api` → `:3001`)

Open `http://localhost:5173` in Chrome with the Primus extension, then click **"verify my pnl"**.

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

When prompted, set the environment variables:

```bash
vercel env add VITE_APP_ID
vercel env add APP_SECRET
```

### Option B — Vercel Dashboard

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. In **Project Settings → Environment Variables**, add:
   - `VITE_APP_ID` — your Primus App ID
   - `APP_SECRET` — your Primus App Secret
4. Deploy. Vercel auto-detects Vite and the `api/` serverless functions.

### What Vercel does automatically

| | |
|---|---|
| Build command | `npm run build` (Vite) |
| Output directory | `dist/` |
| Serverless function | `api/sign.js` → exposed at `/api/sign` |
| SPA fallback | `vercel.json` rewrites all non-`/api` paths to `index.html` |

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start frontend (Vite :5173) + local signing proxy (Express :3001) |
| `npm run dev` | Frontend only (no signing — for UI work) |
| `npm run server` | Local signing proxy only |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `vercel dev` | Full local Vercel emulation (Vite + `api/sign.js` on one port) |

---

## Privacy guarantee

- The Primus extension opens a **local TLS session** to Binance — no proxy or third party sees your credentials.
- The **MPC-based zkTLS protocol** means no single attestor node can reconstruct your session.
- Only `spotPnlRate` is extracted from the response; everything else is discarded.
- You can verify the attestation signature using Primus' on-chain contracts.

---

## Data format

The attestation `data` field is a JSON string. After `JSON.parse()`:

```json
{ "spotPnlRate": "-0.04460000" }
```

Displayed as: `(value × 100).toFixed(2)` with sign → **`-4.46%`**

---

## Project structure

```
proof-pnl/
├── api/
│   └── sign.js              # Vercel Serverless Function — POST /api/sign
├── server/
│   └── index.cjs            # Local Express signing proxy (same contract as api/sign.js)
├── public/assets/           # Owl + Primus brand assets
├── src/
│   ├── App.jsx              # State machine: idle → attesting → success | error
│   ├── index.css            # Design tokens, keyframes, all component styles
│   ├── components/
│   │   ├── IntroSection.jsx    # Hero: wordmark animation + tagline
│   │   ├── VerifyBlock.jsx     # Owl mascot + badge card + CTA
│   │   ├── AttestationBadge.jsx
│   │   ├── HowItWorksSection.jsx
│   │   ├── PrivacySection.jsx
│   │   ├── StickyNav.jsx
│   │   ├── StatusPill.jsx
│   │   └── Footer.jsx
│   └── hooks/
│       ├── usePrimusAttestation.js  # Primus SDK wrapper
│       ├── useGaze.js               # Owl eye-tracking (RAF loop)
│       └── useScrollReveal.js       # IntersectionObserver reveal
├── vercel.json              # SPA rewrite rule
├── vite.config.js           # Vite config + /api proxy for local dev
├── .env.example             # Template — copy to .env
└── index.html
```

---

## Template info

| Field | Value |
|---|---|
| Data source | Binance Spot PnL Rate |
| Revealed field | `spotPnlRate` |
| SDK | `@primuslabs/zktls-js-sdk` |
