import { supabase } from './supabase';
import { getDeviceUUID } from './device';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

export const uploadAlertPhoto = async (base64, device_uuid) => {
  // We'll implement base64 upload to Supabase Storage
  // For now, return null (no photo)
  return null;
};

export const sendAlert = async (text, category, lat, lng, photoBase64 = null, audioBlob = null) => {
  const device_uuid = getDeviceUUID();

  // Upload photo/audio if provided
  let photoUrl = null;
  let audioUrl = null;
  if (photoBase64) {
    // Upload to Supabase Storage
    // We'll implement later
  }
  if (audioBlob) {
    // Upload audio
  }

  // 1. Insert alert
  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      device_uuid,
      text: text || null,
      category,
      location: `POINT(${lng} ${lat})`,
      photo_url: photoUrl,
      audio_url: audioUrl,
      is_guardian_alert: true,
      alert_status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw error;

  // 2. Call find-guardians Edge Function
  const findRes = await fetch(`${EDGE_URL}/find-guardians`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, user_device_uuid: device_uuid }),
  });
  if (!findRes.ok) {
    const err = await findRes.json();
    throw new Error(err.error || 'Failed to find guardians');
  }
  const { guardians } = await findRes.json();
  if (!guardians || guardians.length === 0) {
    // No guardians – we could fallback to SMS
    // For now, throw
    throw new Error('No guardians available nearby');
  }

  // 3. Call notify-guardians
  const notifyRes = await fetch(`${EDGE_URL}/notify-guardians`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_id: alert.id,
      guardians,
      user_device_uuid: device_uuid,
      text: text || '',
      category,
      photo_url: photoUrl,
      audio_url: audioUrl,
      lat,
      lng,
    }),
  });
  if (!notifyRes.ok) {
    const err = await notifyRes.json();
    // Log but don't throw – alert is already inserted
    console.warn('Guardian notification failed:', err);
  }

  // 4. Return alert id
  return alert.id;
};

export const fetchNearbyAlerts = async (lat, lng, radius_km = 5) => {
  const radius_m = radius_km * 1000;
  const { data, error } = await supabase.rpc('nearby_alerts', {
    lat,
    lng,
    radius_m,
    limit_count: 20,
    offset_count: 0,
  });
  if (error) throw error;
  return data || [];
};

export const updateAlert = async (id, newText) => {
  const device_uuid = getDeviceUUID();
  const { error } = await supabase
    .from('alerts')
    .update({ text: newText, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('device_uuid', device_uuid);
  if (error) throw error;
  // Broadcast edit via Edge Function
  await fetch(`${EDGE_URL}/broadcast-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'edit', alert: { id, text: newText } }),
  }).catch(console.warn);
};

export const deleteAlert = async (id) => {
  const device_uuid = getDeviceUUID();
  const { error } = await supabase
    .from('alerts')
    .update({ deleted: true })
    .eq('id', id)
    .eq('device_uuid', device_uuid);
  if (error) throw error;
  // Broadcast delete
  await fetch(`${EDGE_URL}/broadcast-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'delete', alert: { id } }),
  }).catch(console.warn);
};