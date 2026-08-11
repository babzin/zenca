import { supabase } from './supabase';
import { getDeviceUUID } from './device';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

/**
 * Submit guardian application (with invite token).
 */
export const applyGuardianWithInvite = async (formData, inviteToken) => {
  const device_uuid = getDeviceUUID();
  // First validate the invite token
  const validateRes = await fetch(`${EDGE_URL}/validate-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: inviteToken }),
  });
  const validateData = await validateRes.json();
  if (!validateData.valid) {
    throw new Error(validateData.error || 'Invalid or expired invite token');
  }

  // Create guardian application record
  const { data, error } = await supabase.from('guardian_applications').insert({
    device_uuid,
    full_name: formData.fullName,
    phone: formData.phone,
    email: formData.email,
    certification: formData.certification || 'other',
    certification_id: formData.certificationId || '',
    insurance_provider: formData.insuranceProvider || '',
    insurance_policy: formData.insurancePolicy || '',
    nin: formData.nin || '',
    bvn: formData.bvn || '',
    ref1_name: formData.ref1Name || '',
    ref1_phone: formData.ref1Phone || '',
    ref2_name: formData.ref2Name || '',
    ref2_phone: formData.ref2Phone || '',
    status: 'pending',
  }).select().single();

  if (error) throw error;

  // Mark invite as used
  await fetch(`${EDGE_URL}/mark-invite-used`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: inviteToken }),
  }).catch(console.warn);

  return data;
};

/**
 * Get the current guardian profile (if any).
 */
export const getGuardianProfile = async () => {
  const device_uuid = getDeviceUUID();
  const { data, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('device_uuid', device_uuid)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

/**
 * Check if the current user is a verified guardian.
 */
export const isVerifiedGuardian = async () => {
  const profile = await getGuardianProfile();
  return profile ? profile.is_verified === true : false;
};

/**
 * Update guardian availability.
 */
export const updateGuardianAvailability = async (isAvailable) => {
  const device_uuid = getDeviceUUID();
  const { error } = await supabase
    .from('guardians')
    .update({ is_available: isAvailable, last_active: new Date().toISOString() })
    .eq('device_uuid', device_uuid);
  if (error) throw error;
  return true;
};

/**
 * Get guardian alerts (incoming, active, history).
 */
export const getGuardianAlerts = async (status = null) => {
  const device_uuid = getDeviceUUID();
  let query = supabase
    .from('guardian_alerts')
    .select('*, alerts(*)')
    .eq('guardian_device_uuid', device_uuid)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Accept a guardian alert.
 */
export const acceptGuardianAlert = async (guardianAlertId) => {
  const device_uuid = getDeviceUUID();
  const res = await fetch(`${EDGE_URL}/accept-guardian`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guardian_alert_id: guardianAlertId,
      guardian_device_uuid: device_uuid,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to accept alert');
  }
  return res.json();
};

/**
 * Update guardian status (en_route, arrived, completed).
 */
export const updateGuardianStatus = async (guardianAlertId, status) => {
  const res = await fetch(`${EDGE_URL}/update-guardian-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guardian_alert_id: guardianAlertId,
      status,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update status');
  }
  return res.json();
};

/**
 * Get guardian statistics (total responses, success rate, average response time).
 */
export const getGuardianStats = async () => {
  const device_uuid = getDeviceUUID();
  // We'll query the guardian_alerts table for stats
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('status, created_at, accepted_at, completed_at')
    .eq('guardian_device_uuid', device_uuid);

  if (error) throw error;

  const total = data.length;
  const accepted = data.filter(a => a.status === 'accepted' || a.status === 'en_route' || a.status === 'arrived' || a.status === 'completed').length;
  const completed = data.filter(a => a.status === 'completed').length;
  const successRate = total > 0 ? (completed / total) * 100 : 0;

  // Average response time (time from created to accepted)
  const acceptedAlerts = data.filter(a => a.accepted_at);
  let avgResponseTime = 0;
  if (acceptedAlerts.length > 0) {
    const totalTime = acceptedAlerts.reduce((acc, a) => {
      const created = new Date(a.created_at);
      const acceptedAt = new Date(a.accepted_at);
      return acc + (acceptedAt - created);
    }, 0);
    avgResponseTime = totalTime / acceptedAlerts.length / 60000; // in minutes
  }

  // Average arrival time (time from accepted to arrived)
  const arrivedAlerts = data.filter(a => a.arrived_at);
  let avgArrivalTime = 0;
  if (arrivedAlerts.length > 0) {
    const totalTime = arrivedAlerts.reduce((acc, a) => {
      const acceptedAt = new Date(a.accepted_at);
      const arrivedAt = new Date(a.arrived_at);
      return acc + (arrivedAt - acceptedAt);
    }, 0);
    avgArrivalTime = totalTime / arrivedAlerts.length / 60000; // in minutes
  }

  return {
    total,
    accepted,
    completed,
    successRate: Math.round(successRate * 10) / 10,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    avgArrivalTime: Math.round(avgArrivalTime * 10) / 10,
  };
};