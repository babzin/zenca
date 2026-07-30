import { supabase } from './supabase';

// ---------- AUTH ----------
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const role = user?.user_metadata?.role || null;
  return ['super_admin', 'agency_admin', 'read_only'].includes(role);
};

export const getAdminRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user?.user_metadata?.role || null;
};

export const adminSignIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const adminSignOut = async () => {
  await supabase.auth.signOut();
};

// ---------- DASHBOARD ----------
export const getDashboardStats = async () => {
  const { count: total } = await supabase.from('guardians').select('*', { count: 'exact', head: true });
  const { count: pending } = await supabase.from('guardian_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: active } = await supabase.from('guardians').select('*', { count: 'exact', head: true }).eq('is_available', true).eq('is_verified', true);
  const { data: alerts } = await supabase.from('guardian_alerts').select('accepted_at, created_at').eq('status', 'completed');
  let avgResponse = 0;
  if (alerts && alerts.length > 0) {
    const totalMs = alerts.reduce((acc, a) => acc + (new Date(a.accepted_at) - new Date(a.created_at)), 0);
    avgResponse = Math.round(totalMs / alerts.length / 60000);
  }
  return { totalGuardians: total || 0, pendingApplications: pending || 0, activeGuardians: active || 0, avgResponseTime: avgResponse };
};

export const getRecentActivity = async () => {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('*, guardians(full_name), alerts(text)')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) return [];
  return data || [];
};

// ---------- APPLICATIONS ----------
export const getApplications = async (filter = 'all', state = null) => {
  let query = supabase.from('guardian_applications').select('*').order('created_at', { ascending: false });
  if (filter !== 'all') query = query.eq('status', filter);
  if (state && state !== 'all') query = query.eq('state', state);
  const { data, error } = await query;
  if (error) return [];
  return data || [];
};

export const getApplicationDetail = async (id) => {
  const { data, error } = await supabase.from('guardian_applications').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const updateApplication = async (id, status, comment = '') => {
  // Get admin who is making the change
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = user?.email || 'unknown';

  const { error } = await supabase
    .from('guardian_applications')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: adminEmail })
    .eq('id', id);
  if (error) throw error;

  // Log the action
  await logAdminAction(adminEmail, `application_${status}`, { appId: id, comment });

  // Send email notification
  const app = await getApplicationDetail(id);
  if (app) {
    await sendEmailNotification(
      app.email,
      `Application ${status}`,
      `Your guardian application has been ${status}.${comment ? ` Comment: ${comment}` : ''}`
    );
  }

  // If approved, insert into guardians table
  if (status === 'approved') {
    if (app) {
      await supabase.from('guardians').insert({
        device_uuid: app.device_uuid,
        full_name: app.full_name,
        phone: app.phone,
        email: app.email,
        is_verified: true,
        certification: app.certification,
        insurance_provider: app.insurance_provider,
        insurance_policy: app.insurance_policy,
        reputation_score: 5.0,
        state: app.state || null,
      });
    }
  }
  return true;
};

// ---------- GUARDIANS ----------
export const getGuardians = async (state = null) => {
  let query = supabase.from('guardians').select('*').order('reputation_score', { ascending: false });
  if (state && state !== 'all') query = query.eq('state', state);
  const { data, error } = await query;
  if (error) return [];
  return data || [];
};

// ---------- ANALYTICS ----------
export const getAnalytics = async () => {
  const { count: total } = await supabase.from('guardian_alerts').select('*', { count: 'exact', head: true });
  const { data: alerts } = await supabase.from('guardian_alerts').select('accepted_at, created_at').eq('status', 'completed');
  let avgResponse = 0;
  if (alerts && alerts.length > 0) {
    const totalMs = alerts.reduce((acc, a) => acc + (new Date(a.accepted_at) - new Date(a.created_at)), 0);
    avgResponse = Math.round(totalMs / alerts.length / 60000);
  }
  const { count: accepted } = await supabase.from('guardian_alerts').select('*', { count: 'exact', head: true }).eq('status', 'accepted');
  const totalAlerts = total || 1;
  const acceptanceRate = Math.round((accepted / totalAlerts) * 100);
  const { data: categories } = await supabase.from('alerts').select('category').eq('is_guardian_alert', true);
  const breakdown = {};
  if (categories) {
    categories.forEach(a => { breakdown[a.category] = (breakdown[a.category] || 0) + 1; });
  }
  return { totalAlerts: total || 0, avgResponseTime: avgResponse, acceptanceRate, categoryBreakdown: breakdown };
};

// ---------- INVITES ----------
export const getInvites = async () => {
  const { data, error } = await supabase.from('admin_invites').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const generateInvite = async (email, role, secret) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not logged in');
  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/generate-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ email, role }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to generate invite');
  
  // Log invite generation
  const { data: { user } } = await supabase.auth.getUser();
  await logAdminAction(user?.email || 'unknown', 'generate_invite', { email, role });

  // Send email notification to the invited user
  await sendEmailNotification(
    email,
    'You have been invited to Zenca Admin',
    `
      <h2>You've been invited!</h2>
      <p>You have been invited to join the Zenca Admin Panel as a <strong>${role}</strong>.</p>
      <p>Click the link below to create your account:</p>
      <p><a href="${data.inviteLink}">${data.inviteLink}</a></p>
      <p>This link will expire in 7 days.</p>
      <br>
      <p>– Zenca Team</p>
    `
  );

  return data;
};

// ---------- GUARDIAN PERFORMANCE ----------
export const getGuardianPerformance = async (guardianDeviceUuid) => {
  const { data: alerts, error } = await supabase
    .from('guardian_alerts')
    .select('*')
    .eq('guardian_device_uuid', guardianDeviceUuid);

  if (error) return null;

  const { data: ratings, error: ratingsError } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('guardian_device_uuid', guardianDeviceUuid);

  if (ratingsError) return null;

  const totalResponses = alerts.length;
  const accepted = alerts.filter(a => a.status === 'accepted' || a.status === 'en_route' || a.status === 'arrived' || a.status === 'completed').length;
  const completed = alerts.filter(a => a.status === 'completed').length;
  const avgRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;

  const acceptedAlerts = alerts.filter(a => a.accepted_at);
  let avgResponseTime = 0;
  if (acceptedAlerts.length > 0) {
    const totalMs = acceptedAlerts.reduce((acc, a) => {
      return acc + (new Date(a.accepted_at) - new Date(a.created_at));
    }, 0);
    avgResponseTime = Math.round(totalMs / acceptedAlerts.length / 60000);
  }

  const arrivedAlerts = alerts.filter(a => a.arrived_at);
  let avgArrivalTime = 0;
  if (arrivedAlerts.length > 0) {
    const totalMs = arrivedAlerts.reduce((acc, a) => {
      return acc + (new Date(a.arrived_at) - new Date(a.accepted_at));
    }, 0);
    avgArrivalTime = Math.round(totalMs / arrivedAlerts.length / 60000);
  }

  return {
    totalResponses,
    accepted,
    completed,
    avgRating,
    avgResponseTime,
    avgArrivalTime,
    successRate: totalResponses > 0 ? Math.round((completed / totalResponses) * 100) : 0,
    acceptanceRate: totalResponses > 0 ? Math.round((accepted / totalResponses) * 100) : 0,
  };
};

export const getAllGuardiansWithPerformance = async (state = null) => {
  const guardians = await getGuardians(state);
  const result = [];
  for (const guardian of guardians) {
    const performance = await getGuardianPerformance(guardian.device_uuid);
    result.push({
      ...guardian,
      ...performance,
    });
  }
  return result;
};

// ---------- EMAIL NOTIFICATIONS ----------
export const sendEmailNotification = async (to, subject, htmlContent) => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px; }
              .header { color: #d32f2f; font-size: 24px; font-weight: bold; margin-bottom: 16px; }
              .content { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
              .footer { margin-top: 16px; font-size: 12px; color: #9ca3af; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">Zenca</div>
              <div class="content">
                ${htmlContent}
              </div>
              <div class="footer">This is an automated message from Zenca. Please do not reply.</div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      console.error('Email sending failed:', err);
    }
  } catch (err) {
    console.error('Email notification error:', err);
  }
};

// ---------- ADMIN LOGS ----------
export const logAdminAction = async (adminEmail, action, details = {}) => {
  try {
    const ip = await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'unknown');
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_email: adminEmail,
        action,
        details,
        ip_address: ip,
      });
    if (error) console.error('Failed to log admin action:', error);
  } catch (err) {
    console.error('Admin logging error:', err);
  }
};

export const getAdminLogs = async (limit = 100, offset = 0) => {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return [];
  return data || [];
};