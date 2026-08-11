import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import ZencaLoader from '../components/ZencaLoader';
import { showToast } from '../utils/toast';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

export default function GuardianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(true);
  const [guardianUuid, setGuardianUuid] = useState(null);

  useEffect(() => {
    const fetchGuardianData = async () => {
      if (!user) return;
      const { data: guardian, error: gError } = await supabase
        .from('guardians')
        .select('device_uuid, is_available')
        .eq('email', user.email)
        .single();
      if (gError) {
        showToast.error('Guardian profile not found. Please apply.');
        navigate('/guardian/apply');
        return;
      }
      setGuardianUuid(guardian.device_uuid);
      setAvailability(guardian.is_available || false);

      // Subscribe to incoming alerts
      const subscription = supabase
        .channel('guardian_alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'guardian_alerts',
            filter: `guardian_device_uuid=eq.${guardian.device_uuid}`,
          },
          (payload) => {
            setAlerts((prev) => [payload.new, ...prev]);
            showToast.info('New incoming alert!');
          }
        )
        .subscribe();

      // Load existing alerts
      const { data: existing, error: eError } = await supabase
        .from('guardian_alerts')
        .select('*, alerts(*)')
        .eq('guardian_device_uuid', guardian.device_uuid)
        .order('created_at', { ascending: false });
      if (!eError) {
        setAlerts(existing || []);
      }
      setLoading(false);

      return () => {
        supabase.removeChannel(subscription);
      };
    };
    fetchGuardianData();
  }, [user, navigate]);

  const handleAvailabilityToggle = async () => {
    const newStatus = !availability;
    setAvailability(newStatus);
    await supabase
      .from('guardians')
      .update({ is_available: newStatus })
      .eq('device_uuid', guardianUuid);
    showToast.success(newStatus ? 'You are now available.' : 'You are now offline.');
  };

  const acceptAlert = async (guardianAlertId) => {
    try {
      const res = await fetch(`${EDGE_URL}/accept-guardian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardian_alert_id: guardianAlertId,
          guardian_device_uuid: guardianUuid,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to accept');
      }
      const data = await res.json();
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === guardianAlertId ? { ...a, status: 'accepted' } : a
        )
      );
      showToast.success('✅ Alert accepted. Proceed to location.');
      navigate(`/alert/${data.alert_id}`, { state: { isGuardian: true } });
    } catch (err) {
      showToast.error('❌ Error accepting alert: ' + err.message);
    }
  };

  const updateStatus = async (guardianAlertId, status) => {
    try {
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
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === guardianAlertId ? { ...a, status } : a
        )
      );
      showToast.success(`✅ Status updated to ${status}.`);
    } catch (err) {
      showToast.error('❌ Error updating status: ' + err.message);
    }
  };

  if (loading) return <ZencaLoader fullScreen />;

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const activeAlerts = alerts.filter((a) => ['accepted', 'en_route', 'arrived'].includes(a.status));
  const completedAlerts = alerts.filter((a) => ['completed', 'expired'].includes(a.status));

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      en_route: 'bg-purple-100 text-purple-800',
      arrived: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guardian Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Available</label>
          <button
            onClick={handleAvailabilityToggle}
            className={`px-3 py-1 rounded-full text-sm font-semibold ${availability ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
          >
            {availability ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingAlerts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeAlerts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedAlerts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Incoming Alerts</h2>
      {pendingAlerts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pending alerts.</p>
      ) : (
        <div className="space-y-3">
          {pendingAlerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-yellow-400">
              <p className="font-medium text-gray-900 dark:text-white">
                {alert.alerts?.text || 'Emergency alert'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(alert.created_at).toLocaleString()}
              </p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => acceptAlert(alert.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  Accept
                </button>
                <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-md text-sm">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">Active Alerts</h2>
      {activeAlerts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No active alerts.</p>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-400">
              <p className="font-medium text-gray-900 dark:text-white">
                {alert.alerts?.text || 'Alert'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(alert.status)}`}>{alert.status}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alert.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(alert.id, 'en_route')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    En Route
                  </button>
                )}
                {['accepted', 'en_route'].includes(alert.status) && (
                  <button
                    onClick={() => updateStatus(alert.id, 'arrived')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Arrived
                  </button>
                )}
                {alert.status === 'arrived' && (
                  <button
                    onClick={() => updateStatus(alert.id, 'completed')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Resolve
                  </button>
                )}
                {alert.dispatcher_link && (
                  <a
                    href={alert.dispatcher_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Call 112
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}