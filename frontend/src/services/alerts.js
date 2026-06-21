import { supabase, getDeviceUUID } from './supabase';
import { getCurrentPosition } from './location';
import Constants from 'expo-constants';

// --- Private notification (amnesty) ---
async function sendPrivateNotification(device_uuid, title, body) {
  try {
    const { data: device, error } = await supabase
      .from('device_tokens')
      .select('fcm_token')
      .eq('device_uuid', device_uuid)
      .single();
    if (error || !device) return;
    await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/send-private`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fcm_token: device.fcm_token, title, body }),
    });
  } catch (err) {
    console.warn('Private notification failed', err);
  }
}

// --- Broadcast to Edge Function (fire-and-forget) ---
async function broadcastAlert(alertId, type) {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('id, text, location, device_uuid, category, photo_url')
      .eq('id', alertId)
      .single();
    if (error || !alert) return;
    // Don't await – fire and forget
    fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/broadcast-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, alert }),
    }).catch(err => console.warn('Broadcast fetch failed', err));
  } catch (err) {
    console.warn('Broadcast trigger failed', err);
  }
}

// --- Upload photo ---
export const uploadAlertPhoto = async (uri, device_uuid) => {
  try {
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${device_uuid}/${fileName}`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileExt}`,
    });
    const { data, error } = await supabase.storage
      .from('alert-photos')
      .upload(filePath, formData, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('alert-photos').getPublicUrl(filePath);
    return publicUrl;
  } catch (err) {
    console.error('Photo upload failed', err);
    return null;
  }
};

// --- Send alert ---
export const sendAlert = async (text, category = 'other', photoUri = null) => {
  const device_uuid = await getDeviceUUID();
  const { lat, lng } = await getCurrentPosition(3);

  let photoUrl = null;
  if (photoUri) {
    photoUrl = await uploadAlertPhoto(photoUri, device_uuid);
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      text: text || null,
      category,
      location: `POINT(${lng} ${lat})`,
      photo_url: photoUrl,
      device_uuid,
    })
    .select('id')
    .single();

  if (error) throw error;
  broadcastAlert(data.id, 'new'); // fire-and-forget
  return data.id;
};

// --- Fetch nearby alerts (pagination) ---
export const fetchNearbyAlerts = async (limit = 20, offset = 0) => {
  try {
    const { lat, lng } = await getCurrentPosition(2);
    const { data, error } = await supabase.rpc('nearby_alerts', {
      lat,
      lng,
      radius_m: 5000,
      limit_count: limit,
      offset_count: offset,
    });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

// --- Fetch my alerts ---
export const fetchMyAlerts = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data, error } = await supabase
      .from('alerts')
      .select('id, text, category, created_at, edit_count, photo_url')
      .eq('deleted', false)
      .gt('created_at', oneHourAgo);
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
};

// --- Update alert ---
export const updateAlert = async (id, newText) => {
  try {
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ text: newText, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) throw updateError;
    const { error: incError } = await supabase.rpc('increment', { row_id: id });
    if (incError) console.warn('Increment failed', incError);
    broadcastAlert(id, 'edit');
  } catch (err) {
    console.error('Update error', err);
    throw new Error(err.message || 'Could not update alert.');
  }
};

// --- Delete alert ---
export const deleteAlert = async (id) => {
  try {
    const { data: alert, error: fetchError } = await supabase
      .from('alerts')
      .select('device_uuid')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await supabase
      .from('alerts')
      .update({ deleted: true })
      .eq('id', id);
    if (error) throw error;
    await sendPrivateNotification(
      alert.device_uuid,
      'Thank You',
      'Thank you for correcting the record. No penalty for honest mistakes. Zenca trusts you.'
    );
    broadcastAlert(id, 'delete');
  } catch (err) {
    console.error('Delete error', err);
    throw new Error(err.message || 'Could not delete alert.');
  }
};