// Application-wide constants

export const CATEGORIES = [
  { value: 'kidnapping', label: 'Kidnapping' },
  { value: 'banditry', label: 'Banditry' },
  { value: 'terrorism', label: 'Terrorism' },
  { value: 'accident', label: 'Accident' },
  { value: 'other', label: 'Other' },
];

export const CATEGORY_COLORS = {
  kidnapping: '#d32f2f',
  banditry: '#ff9800',
  terrorism: '#9c27b0',
  accident: '#2196f3',
  other: '#757575',
};

export const CATEGORY_ICONS = {
  kidnapping: '🚨',
  banditry: '⚔️',
  terrorism: '💣',
  accident: '🚑',
  other: '⚠️',
};

export const GUARDIAN_STATUSES = {
  pending: 'Pending',
  accepted: 'Accepted',
  en_route: 'En Route',
  arrived: 'Arrived',
  completed: 'Completed',
  expired: 'Expired',
};

export const GUARDIAN_STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  en_route: '#8b5cf6',
  arrived: '#10b981',
  completed: '#6b7280',
  expired: '#ef4444',
};

export const ALERT_RADIUS_DEFAULT = 5; // km
export const ALERT_RADIUS_MAX = 10;
export const ALERT_RADIUS_MIN = 1;
export const ALERT_TEXT_MAX_LENGTH = 140;

export const APP_NAME = 'Zenca';
export const APP_DESCRIPTION = 'Guardian Network – Emergency response for Nigeria';
export const APP_VERSION = '1.0.0';

export const EMERGENCY_NUMBER_DEFAULT = '112';

export const LOCAL_STORAGE_KEYS = {
  DEVICE_UUID: 'device_uuid',
  THEME: 'theme',
  ALERT_RADIUS: 'alert_radius',
  NOTIFICATION_HISTORY: 'notification_history',
  TRUSTED_CONTACTS: 'trusted_contacts',
  EMERGENCY_NUMBER: 'emergency_number',
  CATEGORY_FILTER: 'category_filter',
};

export const API_ENDPOINTS = {
  FIND_GUARDIANS: 'find-guardians',
  NOTIFY_GUARDIANS: 'notify-guardians',
  ACCEPT_GUARDIAN: 'accept-guardian',
  UPDATE_GUARDIAN_STATUS: 'update-guardian-status',
  NOTIFY_CONTACTS: 'notify-contacts',
  CHAT_MESSAGES: 'chat-messages',
  GENERATE_INVITE: 'generate-invite',
  GENERATE_GUARDIAN_INVITES: 'generate-guardian-invites',
  APPROVE_GUARDIAN: 'approve-guardian',
  ADMIN_LOG: 'admin-log',
  VALIDATE_INVITE: 'validate-invite',
  CHECK_SUBSCRIPTION: 'check-subscription',
  INITIALIZE_PAYMENT: 'initialize-payment',
  PAYSTACK_WEBHOOK: 'paystack-webhook',
};