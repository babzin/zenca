import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../hooks/useLocation';
import { sendAlert, fetchNearbyAlerts } from '../services/alerts';
import { supabase } from '../services/supabase';
import AlertCard from '../components/AlertCard';
import ShareModal from '../components/ShareModal';
import ZencaLoader from '../components/ZencaLoader';
import { showToast } from '../utils/toast';

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const { position, error, loading: locationLoading } = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [sosText, setSosText] = useState('');
  const [category, setCategory] = useState('other');
  const [sending, setSending] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastAlert, setLastAlert] = useState(null);

  // Fetch alerts when location is available
  useEffect(() => {
    if (position) {
      fetchNearbyAlerts(position.lat, position.lng, 5)
        .then(setAlerts)
        .catch((err) => {
          console.error(err);
          showToast.error('Failed to load nearby alerts');
        });
    }
  }, [position]);

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  };

  const sendSOS = async () => {
    if (!position) {
      showToast.error('Location not available. Please enable GPS.');
      return;
    }
    setSending(true);
    try {
      const alertId = await sendAlert(
        sosText || 'SOS',
        category,
        position.lat,
        position.lng,
        photoFile ? await toBase64(photoFile) : null,
        audioFile
      );
      // Fetch the full alert details to share
      const { data: alertData } = await supabase
        .from('alerts')
        .select('*')
        .eq('id', alertId)
        .single();
      setLastAlert(alertData);
      setShowShareModal(true);
      showToast.success('✅ SOS sent! Guardians are on the way.');
      // Reset form
      setSosText('');
      setCategory('other');
      setPhotoFile(null);
      setAudioFile(null);
      // Navigate to alert detail after a short delay
      setTimeout(() => {
        navigate(`/alert/${alertId}`);
      }, 1500);
    } catch (err) {
      showToast.error('❌ Failed to send SOS: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (locationLoading) {
    return <ZencaLoader fullScreen />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* SOS Button – Big Circle */}
      <div className="flex-1 flex items-center justify-center py-4">
        <button
          onClick={sendSOS}
          disabled={sending || !position}
          className="w-56 h-56 rounded-full bg-primary hover:bg-red-700 text-white text-3xl font-bold shadow-2xl transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-8 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: '0 0 0 8px rgba(211, 47, 47, 0.2), 0 10px 25px -5px rgba(0,0,0,0.3)',
          }}
        >
          {sending ? '⏳' : '🚨 SOS'}
        </button>
      </div>

      {/* Location status */}
      {!position && !locationLoading && (
        <p className="text-center text-red-500 text-sm mt-2">Location unavailable. Please enable GPS.</p>
      )}

      {/* Always‑Visible Form */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-t-2xl shadow-lg mt-2">
        <div className="space-y-3">
          <input
            type="text"
            maxLength={140}
            placeholder="Describe the threat (optional, max 140 chars)"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white"
            value={sosText}
            onChange={(e) => setSosText(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <select
              className="flex-1 min-w-[120px] border border-gray-300 dark:border-gray-600 rounded-md p-2 dark:bg-gray-700 dark:text-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="kidnapping">Kidnapping</option>
              <option value="banditry">Banditry</option>
              <option value="terrorism">Terrorism</option>
              <option value="accident">Accident</option>
              <option value="other">Other</option>
            </select>
            <label className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300">
              📷 Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files[0])}
              />
            </label>
            <label className="cursor-pointer bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300">
              🎤 Audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setAudioFile(e.target.files[0])}
              />
            </label>
          </div>
          {(photoFile || audioFile) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {photoFile && <span>📷 {photoFile.name} </span>}
              {audioFile && <span>🎤 {audioFile.name}</span>}
            </div>
          )}
          <button
            onClick={sendSOS}
            disabled={sending || !position}
            className="w-full bg-primary hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send SOS'}
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg p-4 max-h-60 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Nearby Alerts</h3>
          {alerts.length > 3 && (
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </button>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No alerts nearby.</p>
        ) : (
          alerts.slice(0, 3).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onClick={() => navigate(`/alert/${alert.id}`)} />
          ))
        )}
      </div>

      {/* Share Modal */}
      {lastAlert && (
        <ShareModal
          alert={lastAlert}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}