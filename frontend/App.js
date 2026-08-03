import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationPermissionReminder } from './src/components/NotificationPermissionReminder';
import { NotificationBanner } from './src/components/NotificationBanner';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, ActivityIndicator } from 'react-native';
import { initSupabase } from './src/services/supabase';
import { requestPermissions, registerForPushNotifications } from './src/services/fcm';
import { initLocationTracking } from './src/services/location';
import { saveNotification } from './src/services/notificationStorage';
import { getNotificationSoundEnabled } from './src/services/notificationSound';
import { isDuplicateAlert, recordAlertLocation } from './src/utils/duplicateFilter';
import EmergencyDisclaimerScreen from './src/screens/EmergencyDisclaimerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const data = notification.request.content.data;
      const body = notification.request.content.body || 'Alert';

      if (data && data.alert_id) {
        saveNotification({
          alert_id: data.alert_id,
          category: data.category || 'other',
          text: body,
        });
      }

      if (data && data.alert_id && typeof window !== 'undefined' && window._setBannerNotification) {
        window._setBannerNotification({
          alert_id: data.alert_id,
          category: data.category || 'other',
          body: body,
          distance: data.distance ? parseFloat(data.distance) : 0,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
          photo_url: data.photo_url || null,
          audio_url: data.audio_url || null,
        });
      }

      const soundEnabled = await getNotificationSoundEnabled();

      if (data && data.latitude && data.longitude) {
        const isDuplicate = await isDuplicateAlert(
          parseFloat(data.latitude),
          parseFloat(data.longitude)
        );
        if (isDuplicate) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
        await recordAlertLocation(parseFloat(data.latitude), parseFloat(data.longitude));
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: soundEnabled,
        shouldSetBadge: false,
      };
    } catch (err) {
      console.warn('Notification handler error', err);
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    }
  },
});

function MainApp() {
  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [bannerNotification, setBannerNotification] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._setBannerNotification = setBannerNotification;
      return () => {
        window._setBannerNotification = null;
      };
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initSupabase();

        try {
          await requestPermissions();
        } catch (err) {
          console.error('Permission request failed', err);
          Alert.alert('Warning', 'Notifications may not work: ' + err.message);
        }

        try {
          await registerForPushNotifications();
        } catch (err) {
          console.error('Push registration failed', err);
          Alert.alert('Warning', 'Push notifications may not work: ' + err.message);
        }

        setTimeout(async () => {
          try {
            await initLocationTracking();
          } catch (err) {
            console.error('Location tracking failed', err);
            Alert.alert('Warning', 'Location features may not work: ' + err.message);
          }
        }, 1000);

        const onboardingSeen = await AsyncStorage.getItem('@zenca_onboarding_seen');
        setShowOnboarding(!onboardingSeen);

        if (onboardingSeen) {
          const disclaimerSeen = await AsyncStorage.getItem('@zenca_disclaimer_seen');
          setShowDisclaimer(!disclaimerSeen);
        }

        setAppReady(true);
      } catch (error) {
        console.error('Fatal init error', error);
        Alert.alert('Init Error', error.message);
        setAppReady(true);
      }
    };

    initApp();
  }, []);

  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setShowOnboarding(false);
          AsyncStorage.getItem('@zenca_disclaimer_seen').then((seen) => {
            setShowDisclaimer(!seen);
          });
        }}
      />
    );
  }

  if (showDisclaimer) {
    return <EmergencyDisclaimerScreen onAgree={() => setShowDisclaimer(false)} />;
  }

  return (
    <>
      <AppNavigator />
      <NotificationPermissionReminder />
      <NotificationBanner
        notification={bannerNotification}
        onDismiss={() => setBannerNotification(null)}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}