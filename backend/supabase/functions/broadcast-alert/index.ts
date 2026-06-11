// supabase/functions/broadcast-alert/index.ts
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0?target=deno&no-check';

declare const Deno: {
  env: {
    get(key: string): string | null;
  };
};

interface FcmServiceAccount {
  client_email: string;
  private_key: string;
}

interface DeviceRecord {
  fcm_token: string;
}

const supabase = createClient(
  Deno.env.get('URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
);

// ---------- FCM helpers ----------
async function sendFcm(token: string, title: string, body: string, data: Record<string, string>) {
  const accessToken = await getFcmAccessToken();
  const projectId = Deno.env.get('FCM_PROJECT_ID')!;
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
        data,
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error(`FCM send error to ${token}: ${errText}`);
  }
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getFcmAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const serviceAccount = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')!);
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
  if (!cachedToken) throw new Error('Failed to obtain FCM access token');
  return cachedToken;
}

async function createJwt(serviceAccount: any): Promise<string> {
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

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-+(BEGIN|END) PRIVATE KEY-+/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
// ---------- end FCM helpers ----------

serve(async (req: Request) => {
  try {
    const { type, alert } = await req.json();
    if (!alert || !alert.location || !alert.device_uuid) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Parse location: "POINT(lng lat)"
    const match = alert.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) throw new Error('Invalid location format');
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);

    // Get devices within 5km
    const { data: devices, error } = await supabase.rpc<DeviceRecord[]>('devices_within_radius', {
      alert_lat: lat,
      alert_lng: lng,
      radius_m: 5000,
      exclude_device_uuid: alert.device_uuid,
    });
    if (error) throw error;

    let title = 'Zenca Alert';
    let body = alert.text?.substring(0, 80) || 'Emergency alert nearby';
    if (type === 'edit') {
      title = 'Zenca Alert Updated';
      body = `Sender updated alert: ${alert.text?.substring(0, 60) || 'Check app'}`;
    } else if (type === 'delete') {
      title = 'Zenca Alert Deleted';
      body = 'Sender deleted their alert – may be false or corrected';
    }

    // Send notifications concurrently (batch up to 1000 devices)
    const promises = (devices ?? []).map((device: DeviceRecord) => sendFcm(device.fcm_token, title, body, {
      alert_id: alert.id,
      type: type,
    }));
    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, count: devices.length }), { status: 200 });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});