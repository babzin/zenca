// supabase/functions/register-device/index.ts
// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabase = createClient(
  Deno.env.get('URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
);

serve(async (req: Request) => {
  try {
    const { device_uuid, fcm_token, lat, lng } = await req.json();
    if (!device_uuid || !fcm_token) {
      return new Response(JSON.stringify({ error: 'Missing device_uuid or fcm_token' }), { status: 400 });
    }
    let location = null;
    if (lat !== undefined && lng !== undefined) {
      location = `POINT(${lng} ${lat})`;
    }
    const { error } = await supabase.from('device_tokens').upsert({
      device_uuid,
      fcm_token,
      last_location: location,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'device_uuid' });
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});