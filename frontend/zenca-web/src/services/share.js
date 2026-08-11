// src/services/share.js
export const generateShareMessage = (alert) => {
  const category = alert.category || 'Emergency';
  const text = alert.text || 'I need help!';
  const date = new Date(alert.created_at).toLocaleString();

  let message = `🚨 ZENCA SOS ALERT\n`;
  message += `Type: ${category.toUpperCase()}\n`;
  message += `Details: ${text}\n`;
  message += `Time: ${date}\n`;
  message += `Location: https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}\n\n`;
  message += `📲 Download Zenca: https://zenca.com/download`;
  return message;
};

export const shareViaWhatsApp = (message) => {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const shareViaTwitter = (message) => {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const shareViaFacebook = (message) => {
  const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(message)}&u=${encodeURIComponent('https://zenca.com')}`;
  window.open(url, '_blank');
};

export const shareViaTelegram = (message) => {
  const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const copyToClipboard = (message) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Link copied to clipboard!');
    });
  } else {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = message;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Link copied to clipboard!');
  }
};

export const shareViaNative = async (message) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Zenca SOS Alert',
        text: message,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  } else {
    // Fallback to WhatsApp if native share is not available
    shareViaWhatsApp(message);
  }
};