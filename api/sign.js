/**
 * Vercel Serverless Function — POST /api/sign
 *
 * Signs a Primus zkTLS attestation request with APP_SECRET.
 * This runs only in Node (Vercel edge), so APP_SECRET is never
 * bundled into the browser or exposed to the client.
 *
 * Request  (JSON):  { requestStr: string }       ← output of generateRequestParams().toJsonString()
 * Response (JSON):  { signedRequestStr: string }  ← passed to startAttestation()
 *               or  { error: string }             ← on failure
 *
 * Same request/response contract as the local server/index.cjs route.
 */

const APP_ID     = process.env.VITE_APP_ID  ?? '';
const APP_SECRET = process.env.APP_SECRET   ?? '';

/** Lazy-cached SDK instance (survives warm invocations). */
let primusInstance = null;
async function getPrimus() {
  if (primusInstance) return primusInstance;
  // Dynamic import because @primuslabs/zktls-js-sdk is ESM-only.
  const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
  const p = new PrimusZKTLS();
  // init() stores appId + appSecret on the instance; no network call.
  p.init(APP_ID, APP_SECRET);
  primusInstance = p;
  return p;
}

/**
 * Parse request body.
 * Vercel auto-parses JSON (Content-Type: application/json) and sets req.body,
 * but we fall back to manual stream parsing for safety / other environments.
 */
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end',  ()      => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    req.on('error',()      => resolve({}));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await parseBody(req);
  const { requestStr } = body;

  if (!requestStr || typeof requestStr !== 'string') {
    console.error('[/api/sign] REJECTED: requestStr missing or not a string. Got:', typeof requestStr);
    return res.status(400).json({
      error: `requestStr is required and must be a string (got ${typeof requestStr})`,
    });
  }

  if (!APP_SECRET) {
    console.error('[/api/sign] APP_SECRET not configured');
    return res.status(500).json({ error: 'APP_SECRET not configured on server' });
  }

  try {
    const primus = await getPrimus();
    // sign() accepts the JSON string and returns JSON.stringify({ attRequest, appSignature })
    const signedRequestStr = await primus.sign(requestStr);
    return res.json({ signedRequestStr });
  } catch (err) {
    console.error('[/api/sign] sign() error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
