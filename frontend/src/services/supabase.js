

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const env = (globalThis as any).process?.env ?? {};

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ??
  env.EXPO_PUBLIC_SUPABASE_URL ??
  '';

const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // No auth — device identity only
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Sets the device_uuid as a Postgres session variable so RLS policies can use it.
 * Call this after generating the device_uuid on first launch.
 */
export async function setSessionDeviceUUID(deviceUUID: string): Promise<void> {
  const { error } = await supabase.rpc('set_config', {
    setting: 'app.device_uuid',
    value: deviceUUID,
    is_local: false,
  });
  if (error) {
    // set_config is a Postgres built-in; if the RPC isn't exposed, use a custom wrapper
    console.warn('[Supabase] Could not set session device_uuid:', error.message);
  }
}