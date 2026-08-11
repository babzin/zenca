import { supabase } from './supabase';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

/**
 * Initialize a Paystack payment for agency subscription
 */
export const initializePayment = async (email, name, phone) => {
  const res = await fetch(`${EDGE_URL}/initialize-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, phone }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Payment initialization failed');
  }
  return res.json(); // { authorization_url, access_code, reference }
};

/**
 * Check if an agency has an active subscription
 */
export const checkSubscription = async (email) => {
  const res = await fetch(`${EDGE_URL}/check-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to check subscription');
  }
  return res.json(); // { subscribed, status }
};

/**
 * Verify payment (manual – we rely on webhook)
 * This is kept for optional manual verification.
 */
export const verifyPayment = async (reference) => {
  // We rely on the webhook, but we can also verify manually if needed
  // For now, we'll just return a stub.
  return { success: true };
};