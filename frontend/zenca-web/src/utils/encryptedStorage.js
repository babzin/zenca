// src/utils/encryptedStorage.js

const ENCRYPTED_PREFIX = 'enc::';

// Fixed salt and pepper (change this to a strong secret in production)
const SALT = new TextEncoder().encode('zenca-salt-2024');
const PEPPER = 'zenca-pepper-2024';

let cryptoKey = null;

// Derive a symmetric key from a static pepper using PBKDF2
async function getOrCreateKey() {
  if (cryptoKey) return cryptoKey;

  // Use a passphrase derived from the pepper + device fingerprint (optional)
  const passphrase = PEPPER + (navigator.userAgent || '') + (navigator.language || '');
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return cryptoKey;
}

// Encrypt a string value
async function encrypt(value) {
  const key = await getOrCreateKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(value);

  // Generate a random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  // Combine IV + ciphertext into one Uint8Array
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

// Decrypt an encrypted string
async function decrypt(encryptedBase64) {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

// ---- Public API ----

// Keys that should NOT be encrypted (e.g., theme, radius, etc.)
const PLAINTEXT_KEYS = [
  'theme',
  'alert_radius',
  'notification_sound_enabled',
];

export const encryptedStorage = {
  /**
   * Get an item from localStorage, decrypting if it's encrypted.
   * If the value is not encrypted, returns as is.
   */
  async getItem(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    // If it starts with the encrypted prefix, decrypt it
    if (raw.startsWith(ENCRYPTED_PREFIX)) {
      try {
        const encryptedData = raw.slice(ENCRYPTED_PREFIX.length);
        const decrypted = await decrypt(encryptedData);
        return decrypted;
      } catch (err) {
        console.warn(`Failed to decrypt key "${key}":`, err);
        // If decryption fails, return the raw value (maybe it's plaintext)
        return raw;
      }
    }
    // Plaintext value
    return raw;
  },

  /**
   * Set an item in localStorage, encrypting it by default.
   * Pass encrypt = false to store in plaintext.
   */
  async setItem(key, value, encrypt = true) {
    // If the key is in the plaintext list, store as is
    if (PLAINTEXT_KEYS.includes(key) || !encrypt) {
      localStorage.setItem(key, value);
      return;
    }

    // Encrypt the value and store with prefix
    try {
      const encrypted = await encrypt(value);
      localStorage.setItem(key, ENCRYPTED_PREFIX + encrypted);
    } catch (err) {
      console.error(`Failed to encrypt key "${key}":`, err);
      // Fallback: store in plaintext if encryption fails
      localStorage.setItem(key, value);
    }
  },

  /**
   * Remove an item from localStorage.
   */
  removeItem(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage (use with caution).
   */
  clear() {
    localStorage.clear();
  },

  /**
   * Migrate existing plaintext keys to encrypted format.
   * Call this once on app startup.
   */
  async migrate() {
    const keysToMigrate = [
      'device_uuid',
      '@zenca_contacts',
      '@zenca_emergency_number',
      '@zenca_notification_history',
    ];
    for (const key of keysToMigrate) {
      const raw = localStorage.getItem(key);
      if (raw && !raw.startsWith(ENCRYPTED_PREFIX)) {
        // It's plaintext – encrypt it
        try {
          const encrypted = await encrypt(raw);
          localStorage.setItem(key, ENCRYPTED_PREFIX + encrypted);
          console.log(`Migrated key "${key}" to encrypted storage.`);
        } catch (err) {
          console.error(`Failed to migrate key "${key}":`, err);
        }
      }
    }
  },
};