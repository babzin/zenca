// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabase = createClient(
  Deno.env.get('URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { service, error_message, alert_id, device_uuid, stack_trace, metadata } = await req.json();

    if (!service || !error_message) {
      return new Response(
        JSON.stringify({ error: 'Missing service or error_message' }),
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('error_logs')
      .insert({
        service,
        error_message,
        alert_id,
        device_uuid,
        stack_trace,
        metadata,
      });

    if (error) {
      console.error('Failed to insert error log:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log error' }),
        { status: 500 }
      );
    }

    // Optional webhook (if you set ERROR_WEBHOOK_URL)
    const webhookUrl = Deno.env.get('ERROR_WEBHOOK_URL');
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, error_message, alert_id, device_uuid, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in log-error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});