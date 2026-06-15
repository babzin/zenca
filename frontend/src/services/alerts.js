import { supabase } from './supabase';
import { getCurrentPosition } from './location';
import Constants from 'expo-constants';
import { getDeviceUUID } from './supabase';

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
      body: JSON.stringify({
        fcm_token: device.fcm_token,
        title,
        body,
      }),
    });
  } catch (err) {
    console.warn('Private notification failed', err);
  }
}

async function broadcastAlert(alertId, type) {
  try {
    const { data: alert, error } = await supabase
      .from('alerts')
      .select('id, text, location, device_uuid, category') // added category
      .eq('id', alertId)
      .single();

    if (error || !alert) return;

    await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/broadcast-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, alert }),
    });
  } catch (err) {
    console.warn('Broadcast trigger failed', err);
  }
}

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
      .upload(filePath, formData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('alert-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Photo upload failed', err);
    return null;
  }
};

export const sendAlert = async (text, category = 'other', photoUri = null) => {
  const { lat, lng } = await getCurrentPosition(3);
  const device_uuid = await getDeviceUUID();

  let photoUrl = null;
  if (photoUri) {
    photoUrl = await uploadAlertPhoto(photoUri, device_uuid);
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      text: text || null,
      category: category,
      location: `POINT(${lng} ${lat})`,
      photo_url: photoUrl,
    })
    .select('id')
    .single();

  if (error) throw error;
  broadcastAlert(data.id, 'new');
  return data.id;
};

export const fetchNearbyAlerts = async (limit = 50, offset = 0) => {
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

export const updateAlert = async (id, newText) => {
  const { error: updateError } = await supabase
    .from('alerts')
    .update({ text: newText, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) throw updateError;
  await supabase.rpc('increment', { row_id: id });
  broadcastAlert(id, 'edit');
};

export const deleteAlert = async (id) => {
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

  // Amnesty message – encourages users to delete false alarms
  await sendPrivateNotification(
    alert.device_uuid,
    'Thank You 🙏',
    'Thank you for correcting the record. No penalty for honest mistakes. Zenca trusts you.'
  );

  broadcastAlert(id, 'delete');
};