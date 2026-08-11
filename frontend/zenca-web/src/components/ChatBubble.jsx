import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getChatMessages, subscribeToChat } from '../services/chat';

export default function ChatBubble({ alertId, isGuardian = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const senderType = isGuardian ? 'guardian' : 'victim';

  // Load messages on open
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const unsubscribe = subscribeToChat(alertId, (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      });
      return () => unsubscribe();
    }
  }, [isOpen, alertId]);

  const loadMessages = async () => {
    try {
      const msgs = await getChatMessages(alertId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      await sendChatMessage(alertId, senderType, input.trim());
      setInput('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-red-700 text-white shadow-lg flex items-center justify-center text-2xl z-50 transition-transform hover:scale-105"
        aria-label="Open chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 max-w-[90vw] h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-2 flex justify-between items-center">
            <span className="font-semibold">Chat</span>
            <span className="text-xs opacity-80">
              {isGuardian ? 'Guardian' : 'Victim'}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    msg.sender_type === senderType
                      ? 'bg-primary text-white self-end ml-auto'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start'
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">
                    {msg.sender_type === 'guardian' ? '🛡️ Guardian' : '👤 Victim'}
                  </p>
                  {msg.message}
                  <p className="text-[10px] opacity-50 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-gray-700 p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}