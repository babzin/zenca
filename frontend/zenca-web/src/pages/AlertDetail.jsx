// src/pages/AlertDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import ChatBubble from '../components/ChatBubble';
import ZencaLoader from '../components/ZencaLoader';

export default function AlertDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const isGuardian = location.state?.isGuardian || false;

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setAlert(data);
      } catch (err) {
        console.error('Error fetching alert:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlert();
  }, [id]);

  if (loading) {
    return <ZencaLoader fullScreen />;
  }

  if (!alert) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Alert not found.
      </div>
    );
  }

  const getCategoryName = (cat) => {
    const names = {
      kidnapping: 'Kidnapping',
      banditry: 'Banditry',
      terrorism: 'Terrorism',
      accident: 'Accident',
      other: 'Other',
    };
    return names[cat] || cat;
  };

  const handleCallEmergency = () => {
    window.location.href = 'tel:112';
  };

  // Extract lat/lng from location geometry (PostGIS)
  let latitude = null;
  let longitude = null;
  if (alert.location) {
    const match = alert.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match) {
      longitude = parseFloat(match[1]);
      latitude = parseFloat(match[2]);
    }
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alert Details
          </h1>
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {getCategoryName(alert.category)}
          </span>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-gray-800 dark:text-gray-200 text-lg">
            {alert.text || 'No description provided.'}
          </p>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Sent: {new Date(alert.created_at).toLocaleString()}</p>
            {alert.updated_at && (
              <p>Updated: {new Date(alert.updated_at).toLocaleString()}</p>
            )}
            {alert.alert_status && (
              <p>Status: <span className="font-semibold">{alert.alert_status}</span></p>
            )}
          </div>

          {alert.photo_url && (
            <div className="mt-3">
              <img
                src={alert.photo_url}
                alt="Alert photo"
                className="rounded-lg max-h-80 w-full object-cover"
              />
            </div>
          )}

          {alert.audio_url && (
            <div className="mt-3">
              <audio controls className="w-full">
                <source src={alert.audio_url} type="audio/mp4" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {latitude && longitude && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Location: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleCallEmergency}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              📞 Call 112
            </button>
            {latitude && longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
              >
                View on Map
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Chat Bubble – only if alert is still active (not resolved) */}
      {alert.alert_status !== 'completed' && alert.alert_status !== 'expired' && (
        <ChatBubble alertId={id} isGuardian={isGuardian} />
      )}
    </div>
  );
}