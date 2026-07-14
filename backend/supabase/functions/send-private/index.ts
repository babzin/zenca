// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

async function sendFcm(token, title, body, data) {
  const accessToken = await getFcmAccessToken();
  const projectId = Deno.env.get('FCM_PROJECT_ID');
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      },
    }),
  });
  if (!response.ok) console.error('FCM error', await response.text());
}

let cachedToken = null;
let tokenExpiry = 0;

async function getFcmAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const serviceAccount = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON'));
  const jwt = await createJwt(serviceAccount);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const { access_token, expires_in } = await response.json();
  cachedToken = access_token;
  tokenExpiry = Date.now() + (expires_in - 60) * 1000;
  return cachedToken;
}

async function createJwt(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signatureInput));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureInput}.${encodedSignature}`;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-+(BEGIN|END) PRIVATE KEY-+/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const { fcm_token, title, body } = await req.json();
    if (!fcm_token || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }
    await sendFcm(fcm_token, title, body, { type: 'private' });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error in send-private:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});