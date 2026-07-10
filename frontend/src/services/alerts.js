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
      .select('id, text, location, device_uuid, category, photo_url, audio_url')
      .eq('id', alertId)
      .single();
    if (error || !alert) return;
    fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/broadcast-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, alert }),
    }).catch(err => console.warn('Broadcast fetch failed', err));
  } catch (err) {
    console.warn('Broadcast trigger failed', err);
  }
}

// --- Upload photo from base64 string ---
export const uploadAlertPhoto = async (base64, device_uuid) => {
  try {
    if (!base64) return null;
    const fileExt = 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${device_uuid}/${fileName}`;
    const contentType = `image/${fileExt}`;

    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    const { data, error } = await supabase.storage
      .from('alert-photos')
      .upload(filePath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('alert-photos').getPublicUrl(filePath);
    console.log('Uploaded photo URL:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('Photo upload failed:', err);
    return null;
  }
};

// --- Upload audio (works with blob from fetch) ---
export const uploadAlertAudio = async (uri, device_uuid) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = 'm4a';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${device_uuid}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('alert-photos')
      .upload(filePath, blob, {
        contentType: 'audio/mp4',
        cacheControl: '3600',
        upsert: false,
      });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('alert-photos').getPublicUrl(filePath);
    console.log('Uploaded audio URL:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('Audio upload failed:', err);
    return null;
  }
};

// --- Send alert (with photo and/or audio) ---
export const sendAlert = async (text, category = 'other', photoBase64 = null, audioUri = null) => {
  const device_uuid = await getDeviceUUID();
  const { lat, lng } = await getCurrentPosition(3);

  let photoUrl = null;
  if (photoBase64) {
    photoUrl = await uploadAlertPhoto(photoBase64, device_uuid);
  }
  let audioUrl = null;
  if (audioUri) {
    audioUrl = await uploadAlertAudio(audioUri, device_uuid);
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      text: text || null,
      category,
      location: `POINT(${lng} ${lat})`,
      photo_url: photoUrl,
      audio_url: audioUrl,
      device_uuid,
    })
    .select('id')
    .single();

  if (error) throw error;
  broadcastAlert(data.id, 'new');
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
      .select('id, text, category, created_at, edit_count, photo_url, audio_url')
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
    const device_uuid = await getDeviceUUID();
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ text: newText, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('device_uuid', device_uuid);
    if (updateError) throw updateError;
    const { error: incError } = await supabase.rpc('increment', { row_id: id });
    if (incError) console.warn('Increment failed', incError);
    broadcastAlert(id, 'edit');
  } catch (err) {
    console.error('Update error:', err);
    throw new Error(err.message || 'Could not update alert.');
  }
};

// --- Delete alert ---
export const deleteAlert = async (id) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data: alert, error: fetchError } = await supabase
      .from('alerts')
      .select('device_uuid')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await supabase
      .from('alerts')
      .update({ deleted: true })
      .eq('id', id)
      .eq('device_uuid', device_uuid);
    if (error) throw error;
    await sendPrivateNotification(
      alert.device_uuid,
      'Thank You',
      'Thank you for correcting the record. No penalty for honest mistakes. Zenca trusts you.'
    );
    broadcastAlert(id, 'delete');
  } catch (err) {
    console.error('Delete error:', err);
    throw new Error(err.message || 'Could not delete alert.');
  }
};

// --- Report alert ---
export const reportAlert = async (alertId) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data: existing, error: checkError } = await supabase
      .from('alert_reports')
      .select('id')
      .eq('alert_id', alertId)
      .eq('reporter_device_uuid', device_uuid)
      .maybeSingle();
    if (checkError) throw checkError;
    if (existing) {
      throw new Error('You have already reported this alert.');
    }
    const { error: insertError } = await supabase
      .from('alert_reports')
      .insert({
        alert_id: alertId,
        reporter_device_uuid: device_uuid,
      });
    if (insertError) throw insertError;
    const { count, error: countError } = await supabase
      .from('alert_reports')
      .select('id', { count: 'exact', head: true })
      .eq('alert_id', alertId);
    if (countError) throw countError;
    const THRESHOLD = 3;
    if (count >= THRESHOLD) {
      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .select('device_uuid')
        .eq('id', alertId)
        .single();
      if (!alertError && alert) {
        await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/send-report-nudge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_id: alertId,
            sender_device_uuid: alert.device_uuid,
            report_count: count,
            threshold: THRESHOLD,
          }),
        }).catch(err => console.warn('Nudge failed', err));
      }
    }
    return true;
  } catch (err) {
    console.error('Report error:', err);
    throw new Error(err.message || 'Could not report alert.');
  }
};

// --- Check if user already reported ---
export const hasUserReportedAlert = async (alertId) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('alert_reports')
      .select('id')
      .eq('alert_id', alertId)
      .eq('reporter_device_uuid', device_uuid)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (err) {
    console.warn('Check report error:', err);
    return false;
  }
};