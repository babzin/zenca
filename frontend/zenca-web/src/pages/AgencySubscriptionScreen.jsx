import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkSubscription, initializePayment } from '../services/payment';
import { showToast } from '../utils/toast';
import ZencaLoader from '../components/ZencaLoader';

export default function AgencySubscriptionScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subStatus, setSubStatus] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
        setSubStatus(result.status || 'inactive');
      } catch (err) {
        console.error('Subscription check failed:', err);
        showToast.error('Could not check subscription status.');
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user, navigate]);

  // Handle payment initiation
  const handleSubscribe = async () => {
    setPaymentProcessing(true);
    try {
      const { authorization_url } = await initializePayment(
        user.email,
        user.user_metadata?.name || user.email?.split('@')[0] || 'Agency',
        ''
      );
      // Open Paystack payment page in a new tab
      window.open(authorization_url, '_blank');
      // Poll for subscription status after a delay (or rely on webhook)
      // We'll show a message to the user and let them come back.
      showToast.info('Payment page opened. Complete payment and return to this tab.');
      // After a few seconds, we can check status again
      setTimeout(async () => {
        const result = await checkSubscription(user.email);
        if (result.subscribed) {
          setSubscribed(true);
          setSubStatus('active');
          showToast.success('Subscription activated!');
          navigate('/admin');
        } else {
          showToast.info('Payment not yet confirmed. Please check your email or try again.');
        }
      }, 10000); // 10 seconds
    } catch (err) {
      showToast.error(err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Manual refresh status
  const refreshStatus = async () => {
    setLoading(true);
    try {
      const result = await checkSubscription(user.email);
      setSubscribed(result.subscribed);
      setSubStatus(result.status || 'inactive');
      if (result.subscribed) {
        showToast.success('Subscription is active!');
        navigate('/admin');
      } else {
        showToast.info('Still inactive. Please complete payment.');
      }
    } catch (err) {
      showToast.error('Failed to refresh status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ZencaLoader fullScreen />;

  if (subscribed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Active Subscription</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your agency is subscribed. You have full access to the Admin Panel.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-6 bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
        Agency Subscription
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Unlock full admin capabilities for your agency.
      </p>

      {/* Pricing Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
        <div className="bg-primary px-6 py-4 text-white text-center">
          <span className="text-sm font-semibold uppercase tracking-wider">Annual Plan</span>
        </div>
        <div className="p-6 text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            ₦8,600,000
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">per year</div>
          <ul className="mt-6 space-y-2 text-left text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Full Admin Dashboard
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Guardian & Application Management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Real-time Analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Invite Management
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Audit Logs
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✔</span> 24/7 Support
            </li>
          </ul>

          <div className="mt-6">
            <button
              onClick={handleSubscribe}
              disabled={paymentProcessing}
              className="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {paymentProcessing ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>

          {subStatus === 'expired' && (
            <div className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Your previous subscription has expired. Subscribe to regain access.
            </div>
          )}

          <button
            onClick={refreshStatus}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Check status again
          </button>

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Secure payment via Paystack. Your subscription is automatically activated upon confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}