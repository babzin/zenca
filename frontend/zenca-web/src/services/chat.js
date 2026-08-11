import { supabase } from './supabase';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

export const sendChatMessage = async (alertId, senderType, message) => {
  const res = await fetch(`${EDGE_URL}/chat-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send',
      alert_id: alertId,
      sender_type: senderType,
      message,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
};

export const getChatMessages = async (alertId) => {
  const res = await fetch(`${EDGE_URL}/chat-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get',
      alert_id: alertId,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch messages');
  }
  const data = await res.json();
  return data.messages || [];
};

export const subscribeToChat = (alertId, onMessage) => {
  const channel = supabase
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
        onMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};