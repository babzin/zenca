// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { encryptedStorage } from '../utils/encryptedStorage';
import { getDeviceUUID } from '../services/device';
import { getEmergencyNumber } from '../services/emergencyNumber';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [deviceId, setDeviceId] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const uuid = await getDeviceUUID();
      setDeviceId(uuid);
      const num = await getEmergencyNumber();
      setEmergencyNumber(num);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">App Version: 1.0.0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Device UUID: <span className="font-mono text-xs">{deviceId}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Emergency Number: <span className="font-bold text-primary">{emergencyNumber}</span>
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
                localStorage.clear();
                alert('All local data cleared. Please refresh the page.');
                window.location.reload();
              }
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            🗑️ Clear All Local Data
          </button>
        </div>
      </div>
    </div>
  );
}