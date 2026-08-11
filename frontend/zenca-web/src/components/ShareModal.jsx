import React, { useState } from 'react';
import { generateShareMessage, shareViaWhatsApp, shareViaTwitter, shareViaFacebook, shareViaTelegram, copyToClipboard, shareViaNative } from '../services/share';

export default function ShareModal({ alert, isOpen, onClose }) {
  const [showModal, setShowModal] = useState(isOpen);

  if (!isOpen) return null;

  const message = generateShareMessage(alert);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Share Alert</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Share this alert to your social networks or contacts.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => shareViaWhatsApp(message)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>💬</span> WhatsApp
          </button>
          <button
            onClick={() => shareViaTwitter(message)}
            className="bg-blue-400 hover:bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>🐦</span> Twitter
          </button>
          <button
            onClick={() => shareViaFacebook(message)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📘</span> Facebook
          </button>
          <button
            onClick={() => shareViaTelegram(message)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <span>📲</span> Telegram
          </button>
          <button
            onClick={() => copyToClipboard(message)}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 col-span-2"
          >
            <span>📋</span> Copy Link
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => shareViaNative(message)}
            className="flex-1 bg-primary hover:bg-red-700 text-white py-2 px-4 rounded-lg"
          >
            📤 Share via...
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}