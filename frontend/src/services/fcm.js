/** @jsx React.createElement */

// src/services/fcm.ts
// Handles Firebase Cloud Messaging for push notifications.

declare module '@react-native-firebase/messaging' {
  const messaging: any;
  export default messaging;
}

import messaging from '@react-native-firebase/messaging';
import { createClient } from '@supabase/supabase-js';
import type { DeviceLocation } from '../types';

const env = (globalThis as any).process?.env as Record<string, string> | undefined;
const supabase = createClient(
  env?.EXPO_PUBLIC_SUPABASE_URL ?? '',
  env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
);
const EDGE_FUNCTION_BASE = (env?.EXPO_PUBLIC_SUPABASE_URL ?? '') + '/functions/v1';

export async function initFCM() {
  await requestAndGetFCMToken();
  setupBackgroundMessageHandler();
}
export async function requestAndGetFCMToken(): Promise<string | null> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    const token = await messaging().getToken();
    return token;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

async function broadcastAlert(alertId: string, type: 'new' | 'edit' | 'delete') {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('id, text, location, device_uuid')
      .eq('id', alertId)
      .single();
    if (error) {
      console.error('[FCM] broadcastAlert error:', error);
      return;
    }
  } catch (err) {
    console.error('[FCM] broadcastAlert error:', err);
  }
}

export async function registerDevice(
  deviceUUID: string,
  fcmToken: string,
  location: DeviceLocation
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const anonKey = env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

    const response = await fetch(`${EDGE_FUNCTION_BASE}/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        device_uuid: deviceUUID,
        fcm_token: fcmToken,
        lat: location.lat,
        lng: location.lng,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[FCM] register-device failed:', err);
    }
  } catch (err) {
    console.error('[FCM] registerDevice error:', err);
  }
}


export function setupForegroundMessageHandler(
  onMessage: (title: string, body: string, data: Record<string, string>) => void
): () => void {
  const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
    const title = remoteMessage.notification?.title ?? 'Zenca';
    const body = remoteMessage.notification?.body ?? '';
    const data = (remoteMessage.data ?? {}) as Record<string, string>;
    onMessage(title, body, data);
  });

  return unsubscribe;
}


export function setupBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async (_remoteMessage: any) => {
    // Background message received — no-op; OS displays the notification automatically
  });
}