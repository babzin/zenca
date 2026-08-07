import { supabase, getDeviceUUID } from './supabase';
import Constants from 'expo-constants';

// Send a message
export const sendChatMessage = async (alertId, message, isGuardian = false) => {
  try {
    const device_uuid = await getDeviceUUID();
    const response = await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/send-chat-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_id: alertId,
        message,
        sender_device_uuid: device_uuid,
        is_guardian: isGuardian,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to send message.');
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to send message:', err);
    throw new Error(err.message || 'Could not send message.');
  }
};

// Subscribe to messages for an alert
export const subscribeToChatMessages = (alertId, onMessage, onError) => {
  const device_uuid = getDeviceUUID(); // not used directly but needed for RLS

  const subscription = supabase
    .channel(`chat-${alertId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `alert_id=eq.${alertId}`,
      },
      (payload) => {
        if (onMessage) onMessage(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to chat channel:', alertId);
      }
      if (status === 'CHANNEL_ERROR') {
        if (onError) onError(new Error('Subscription error'));
      }
    });

  return () => {
    supabase.removeChannel(subscription);
  };
};