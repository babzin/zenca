import { supabase, getDeviceUUID } from './supabase';
import Constants from 'expo-constants';

// --- Submit guardian application ---
export const submitGuardianApplication = async (formData) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('guardian_applications')
      .insert({
        device_uuid,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        certification: formData.certification,
        certification_id: formData.certificationId,
        insurance_provider: formData.insuranceProvider,
        insurance_policy: formData.insurancePolicy,
        nin: formData.nin,
        bvn: formData.bvn,
        ref1_name: formData.ref1Name,
        ref1_phone: formData.ref1Phone,
        ref2_name: formData.ref2Name,
        ref2_phone: formData.ref2Phone,
        status: 'pending',
      });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Application submission failed:', err);
    throw new Error(err.message || 'Failed to submit application.');
  }
};

// --- Check if user has an existing application ---
export const getApplicationStatus = async () => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('guardian_applications')
      .select('status, created_at, reviewed_at')
      .eq('device_uuid', device_uuid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (err) {
    console.error('Failed to get application status:', err);
    return null;
  }
};

// --- Check if user is a verified guardian ---
export const isVerifiedGuardian = async () => {
  try {
    const device_uuid = await getDeviceUUID();
    const { data, error } = await supabase
      .from('guardians')
      .select('is_verified, is_available')
      .eq('device_uuid', device_uuid)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (err) {
    console.error('Failed to check guardian status:', err);
    return null;
  }
};

// --- Update guardian availability ---
export const updateGuardianAvailability = async (isAvailable) => {
  try {
    const device_uuid = await getDeviceUUID();
    const { error } = await supabase
      .from('guardians')
      .update({
        is_available: isAvailable,
        last_active: new Date().toISOString(),
      })
      .eq('device_uuid', device_uuid);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Failed to update availability:', err);
    throw new Error(err.message || 'Failed to update availability.');
  }
};

// --- Get guardian's own alerts ---
export const getGuardianAlerts = async (status = null) => {
  try {
    const device_uuid = await getDeviceUUID();
    let query = supabase
      .from('guardian_alerts')
      .select(`
        id,
        status,
        accepted_at,
        en_route_at,
        arrived_at,
        completed_at,
        eta_seconds,
        dispatcher_link,
        created_at,
        alert:alert_id (
          id,
          text,
          category,
          created_at,
          location,
          photo_url,
          audio_url,
          alert_status
        ),
        user:user_device_uuid
      `)
      .eq('guardian_device_uuid', device_uuid)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get guardian alerts:', err);
    return [];
  }
};

// --- Accept a guardian alert ---
export const acceptGuardianAlert = async (guardianAlertId) => {
  try {
    const device_uuid = await getDeviceUUID();
    const response = await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/accept-guardian`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardian_alert_id: guardianAlertId,
        guardian_device_uuid: device_uuid,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to accept alert.');
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to accept alert:', err);
    throw new Error(err.message || 'Could not accept alert.');
  }
};

// --- Update guardian status (en_route, arrived, completed) ---
export const updateGuardianStatus = async (guardianAlertId, status) => {
  try {
    const response = await fetch(`${Constants.expoConfig?.extra?.supabaseEdgeFunctionUrl}/update-guardian-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardian_alert_id: guardianAlertId,
        status,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update status.');
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to update status:', err);
    throw new Error(err.message || 'Could not update status.');
  }
};