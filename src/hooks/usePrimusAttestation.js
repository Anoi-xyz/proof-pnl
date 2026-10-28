import { useCallback, useRef } from 'react';
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk';

const APP_ID = import.meta.env.VITE_APP_ID ?? '';
const TEMPLATE_ID =
  import.meta.env.VITE_TEMPLATE_ID ?? '369e1db8-47c9-4dc6-85b5-037cd02d3383';
const USER_ADDRESS = '0x1529CFA271435e91C0043550D60Cc7b9Ea578F2c';

// ── SDK type contract (from reading dist/index.js) ────────────────────────────
//
//  generateRequestParams(templateId, userAddress) → AttRequest OBJECT
//    .toJsonString()  → JSON string  (this is what sign() expects as input)
//
//  sign(jsonString) → JSON.stringify({ attRequest, appSignature })  (a string)
//    ↑ runs on BACKEND (needs appSecret / ethers.Wallet)
//
//  startAttestation(signedStr) → attestation object
//    ↑ expects the exact string that sign() returned
//
//  init(appId) → Promise  (MUST be awaited; sets isInitialized via extension msg)
//    ↑ throws ZkAttestationError('00006') if extension not installed

export default function usePrimusAttestation() {
  const primusRef = useRef(null);

  const startAttestation = useCallback(async (onStep) => {

    // ── Step 0: Instantiate ──────────────────────────────────────────────────
    onStep?.(0);
    if (!primusRef.current) {
      primusRef.current = new PrimusZKTLS();
    }
    const primus = primusRef.current;

    // ── Step 1: Init SDK (MUST await — sets isInitialized via extension msg) ─
    onStep?.(1);
    try {
      await primus.init(APP_ID);
      // init() resolves once the extension responds; isInitialized is now true
    } catch (e) {
      // ZkAttestationError('00006') = extension not installed
      const code = e?.code ?? e?.message ?? '';
      const isNoExt =
        String(code).includes('00006') ||
        (e?.message ?? '').toLowerCase().includes('extension') ||
        (e?.message ?? '').toLowerCase().includes('install');
      const err = new Error(e?.message ?? 'Extension not found');
      err.code = isNoExt ? 'NO_EXTENSION' : 'ATTESTATION_FAILED';
      throw err;
    }

    // ── Step 2: Build request params — toJsonString() is critical ────────────
    onStep?.(2);
    let requestStr; // MUST be a string before we POST it
    try {
      const attRequest = primus.generateRequestParams(TEMPLATE_ID, USER_ADDRESS);
      // attRequest is an AttRequest OBJECT — must convert to JSON string
      requestStr = attRequest.toJsonString();

      // [DEBUG-a] log what we send to /api/sign
      console.log('[ProofPnL][a] typeof requestStr sent to /api/sign:', typeof requestStr);
      console.log('[ProofPnL][a] requestStr preview:', requestStr.slice(0, 120));
    } catch (e) {
      const err = new Error(e?.message ?? 'generateRequestParams failed');
      err.code = 'ATTESTATION_FAILED';
      throw err;
    }

    // ── Step 3: Backend signs — /api/sign returns { signedRequestStr: string } ─
    onStep?.(3);
    let signedRequestStr;
    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // requestStr is a string → serialises to {"requestStr":"<json>"}
        body: JSON.stringify({ requestStr }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      signedRequestStr = data.signedRequestStr;

      // [DEBUG-c] log what we receive from backend and what we pass to startAttestation
      console.log('[ProofPnL][c] typeof signedRequestStr before startAttestation:', typeof signedRequestStr);
      if (typeof signedRequestStr !== 'string') {
        throw new Error(`Backend returned wrong type for signedRequestStr: ${typeof signedRequestStr}`);
      }
      console.log('[ProofPnL][c] signedRequestStr length:', signedRequestStr.length);
    } catch (e) {
      const err = new Error(e?.message ?? 'Signing request failed');
      err.code = 'SIGNING_FAILED';
      throw err;
    }

    // ── Step 4: Attestation (extension handles zkTLS proof) ──────────────────
    onStep?.(4); // re-using step slot — overlay shows "Generating proof"
    let attestation;
    try {
      // startAttestation() expects the string from sign() — exactly as-is
      attestation = await primus.startAttestation(signedRequestStr);
    } catch (e) {
      const msg = (e?.message ?? '').toLowerCase();
      const code = String(e?.code ?? '');
      if (
        code === '00006' ||
        msg.includes('extension') ||
        msg.includes('install') ||
        msg.includes('not found')
      ) {
        const err = new Error(e.message);
        err.code = 'NO_EXTENSION';
        throw err;
      }
      if (
        code === '00004' ||
        code === '00005' ||
        msg.includes('cancel') ||
        msg.includes('reject') ||
        msg.includes('abort') ||
        msg.includes('denied') ||
        msg.includes('user close')
      ) {
        const err = new Error(e.message);
        err.code = 'USER_CANCELLED';
        throw err;
      }
      const err = new Error(e?.message ?? 'Attestation failed');
      err.code = 'ATTESTATION_FAILED';
      throw err;
    }

    // ── Step 5: Local verify ─────────────────────────────────────────────────
    try {
      const valid = primus.verifyAttestation(attestation);
      if (!valid) {
        const err = new Error('Attestation signature verification failed');
        err.code = 'ATTESTATION_FAILED';
        throw err;
      }
    } catch (e) {
      if (e.code) throw e;
      const err = new Error(e?.message ?? 'Verification failed');
      err.code = 'ATTESTATION_FAILED';
      throw err;
    }

    return attestation;
  }, []);

  return { startAttestation };
}
