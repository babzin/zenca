import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { checkSubscription } from '../services/payment';
import { exportGuardiansCSV, exportApplicationsCSV } from '../services/admin';
import AdminAnalytics from './AdminAnalytics';
import { showToast } from '../utils/toast';
import ZencaLoader from '../components/ZencaLoader';

const EDGE_URL = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guardians');
  const [guardians, setGuardians] = useState([]);
  const [applications, setApplications] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(null);
  const [checking, setChecking] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [countInput, setCountInput] = useState(1);

  // Check subscription status on mount
  useEffect(() => {
    const check = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        const result = await checkSubscription(user.email);
        setSubscribed(result.subscribed);
        if (!result.subscribed) {
          showToast.error('Your subscription is inactive. Please subscribe.');
          navigate('/subscribe');
          return;
        }
      } catch (err) {
        console.error('Subscription check failed:', err);
        showToast.error('Could not verify subscription.');
        navigate('/subscribe');
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [user, navigate]);

  const fetchGuardians = async () => {
    const { data, error } = await supabase
      .from('guardians')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setGuardians(data || []);
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('guardian_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setApplications(data || []);
  };

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from('guardian_invites')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setInvites(data || []);
  };

  useEffect(() => {
    if (activeTab === 'guardians') fetchGuardians();
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'invites') fetchInvites();
  }, [activeTab]);

  const generateInvites = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${EDGE_URL}/generate-guardian-invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput || undefined,
          count: countInput,
          created_by: user.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate invites');
      }
      const { invites } = await res.json();
      showToast.success(`✅ Generated ${invites.length} invite(s)`);
      setEmailInput('');
      setCountInput(1);
      fetchInvites();
    } catch (err) {
      showToast.error('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const revokeInvite = async (token) => {
    if (!confirm('Revoke this invite?')) return;
    await supabase.from('guardian_invites').delete().eq('token', token);
    fetchInvites();
    showToast.success('🗑️ Invite revoked.');
  };

  const approveApplication = async (applicationId) => {
    if (!confirm('Approve this application?')) return;
    try {
      const res = await fetch(`${EDGE_URL}/approve-guardian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to approve');
      }
      showToast.success('✅ Application approved!');
      fetchApplications();
      fetchGuardians();
    } catch (err) {
      showToast.error('❌ ' + err.message);
    }
  };

  const handleExportGuardians = async () => {
    try {
      await exportGuardiansCSV();
      showToast.success('📥 Guardians exported successfully!');
    } catch (err) {
      showToast.error('❌ ' + err.message);
    }
  };

  const handleExportApplications = async () => {
    try {
      await exportApplicationsCSV();
      showToast.success('📥 Applications exported successfully!');
    } catch (err) {
      showToast.error('❌ ' + err.message);
    }
  };

  if (checking) return <ZencaLoader fullScreen />;
  if (!subscribed) return null; // Already redirected

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
        <nav className="-mb-px flex space-x-8">
          {['guardians', 'applications', 'invites', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* GUARDIANS TAB */}
        {activeTab === 'guardians' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Guardians</h2>
              <button
                onClick={handleExportGuardians}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                📥 Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reputation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {guardians.map((g) => (
                    <tr key={g.device_uuid}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{g.full_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{g.email}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${g.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {g.is_available ? 'Available' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{g.reputation_score?.toFixed(1) || '5.0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Applications</h2>
              <button
                onClick={handleExportApplications}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                📥 Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{app.full_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{app.email}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : app.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => approveApplication(app.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INVITES TAB */}
        {activeTab === 'invites' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invites</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <form onSubmit={generateInvites} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (optional for single invite)</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of invites</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white"
                    value={countInput}
                    onChange={(e) => setCountInput(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Invites'}
                </button>
              </form>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invites.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">{inv.token.substring(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{inv.email || 'Any'}</td>
                      <td className="px-4 py-2 text-sm">{inv.used_at ? '✅' : '❌'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <button onClick={() => revokeInvite(inv.token)} className="text-red-600 hover:underline text-xs">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && <AdminAnalytics />}
      </div>
    </div>
  );
}