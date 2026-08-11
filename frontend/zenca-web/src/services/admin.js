import { supabase } from './supabase';
import { convertToCSV, downloadCSV } from './export';

// ============================================================
// 1. ANALYTICS FUNCTIONS
// ============================================================

/**
 * Fetch all analytics data for the admin dashboard
 */
export const getAnalytics = async () => {
  // 1. Total guardians
  const { count: totalGuardians } = await supabase
    .from('guardians')
    .select('*', { count: 'exact', head: true });

  // 2. Pending applications
  const { count: pendingApplications } = await supabase
    .from('guardian_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 3. Active guardians (available + verified)
  const { count: activeGuardians } = await supabase
    .from('guardians')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true)
    .eq('is_verified', true);

  // 4. Average response time (from guardian_alerts where completed)
  const { data: completedAlerts } = await supabase
    .from('guardian_alerts')
    .select('created_at, accepted_at, completed_at')
    .eq('status', 'completed');

  let avgResponseTime = 0;
  if (completedAlerts && completedAlerts.length > 0) {
    const totalTime = completedAlerts.reduce((acc, alert) => {
      const accepted = new Date(alert.accepted_at);
      const created = new Date(alert.created_at);
      return acc + (accepted - created);
    }, 0);
    avgResponseTime = totalTime / completedAlerts.length / 60000; // in minutes
  }

  // 5. Category breakdown (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: categoryData } = await supabase
    .from('alerts')
    .select('category')
    .eq('is_guardian_alert', true)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const categoryCounts = {};
  if (categoryData) {
    categoryData.forEach((alert) => {
      const cat = alert.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  }

  // 6. Alerts per day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: dailyData } = await supabase
    .from('alerts')
    .select('created_at')
    .eq('is_guardian_alert', true)
    .gte('created_at', sevenDaysAgo.toISOString());

  const dailyCounts = {};
  if (dailyData) {
    dailyData.forEach((alert) => {
      const day = new Date(alert.created_at).toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
  }

  // 7. Recent activity (last 5 guardian alerts)
  const { data: recentActivity } = await supabase
    .from('guardian_alerts')
    .select('*, guardians(full_name), alerts(text)')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    totalGuardians: totalGuardians || 0,
    pendingApplications: pendingApplications || 0,
    activeGuardians: activeGuardians || 0,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    categoryCounts,
    dailyCounts,
    recentActivity: recentActivity || [],
  };
};

// ============================================================
// 2. EXPORT FUNCTIONS
// ============================================================

/**
 * Export guardians list to CSV
 */
export const exportGuardiansCSV = async () => {
  const { data, error } = await supabase
    .from('guardians')
    .select('device_uuid, full_name, phone, email, certification, reputation_score, is_available, created_at');
  if (error) throw error;

  const headers = [
    { key: 'device_uuid', label: 'Device UUID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'certification', label: 'Certification' },
    { key: 'reputation_score', label: 'Reputation Score' },
    { key: 'is_available', label: 'Available' },
    { key: 'created_at', label: 'Created At' },
  ];

  const csvData = convertToCSV(data, headers);
  downloadCSV(csvData, `guardians_${new Date().toISOString().split('T')[0]}`);
};

/**
 * Export applications list to CSV
 */
export const exportApplicationsCSV = async () => {
  const { data, error } = await supabase
    .from('guardian_applications')
    .select('id, full_name, phone, email, certification, status, created_at');
  if (error) throw error;

  const headers = [
    { key: 'id', label: 'Application ID' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'certification', label: 'Certification' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Submitted At' },
  ];

  const csvData = convertToCSV(data, headers);
  downloadCSV(csvData, `applications_${new Date().toISOString().split('T')[0]}`);
};