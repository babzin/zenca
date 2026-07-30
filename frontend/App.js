import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { NetworkBanner } from './src/components/NetworkBanner';
import { NotificationPermissionReminder } from './src/components/NotificationPermissionReminder';
import { NotificationBanner } from './src/components/NotificationBanner';

// Services
import { initSupabase } from './src/services/supabase';
import { requestPermissions, registerForPushNotifications } from './src/services/fcm';
import { initLocationTracking } from './src/services/location';
import { saveNotification } from './src/services/notificationStorage';
import { getNotificationSoundEnabled } from './src/services/notificationSound';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MyAlertsScreen from './src/screens/MyAlertsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsScreen from './src/screens/TermsScreen';
import EmergencyDisclaimerScreen from './src/screens/EmergencyDisclaimerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import NotificationHistoryScreen from './src/screens/NotificationHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GuardianApplicationForm from './src/screens/GuardianApplicationForm';
import GuardianDashboard from './src/screens/GuardianDashboard';
import TrustedContactsScreen from './src/screens/TrustedContactsScreen';

// ========== ADMIN SCREENS ==========
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminPanelScreen from './src/screens/AdminPanelScreen';
import AdminApplicationsScreen from './src/screens/AdminApplicationsScreen';
import AdminApplicationDetailScreen from './src/screens/AdminApplicationDetailScreen';
import AdminGuardiansScreen from './src/screens/AdminGuardiansScreen';
import AdminAnalyticsScreen from './src/screens/AdminAnalyticsScreen';
import AdminInvitesScreen from './src/screens/AdminInvitesScreen';
import AdminForgotPasswordScreen from './src/screens/AdminForgotPasswordScreen';
import AdminResetPasswordScreen from './src/screens/AdminResetPasswordScreen';
import AdminSignupScreen from './src/screens/AdminSignupScreen';

// Utils
import { isDuplicateAlert, recordAlertLocation } from './src/utils/duplicateFilter';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Navigation ref for deep linking
export const navigationRef = React.createRef();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const data = notification.request.content.data;
      const body = notification.request.content.body || 'Alert';

      // Save to history
      if (data && data.alert_id) {
        saveNotification({
          alert_id: data.alert_id,
          category: data.category || 'other',
          text: body,
        });
      }

      // Show in‑app banner (only if app is foreground)
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

      // Check sound setting
      const soundEnabled = await getNotificationSoundEnabled();

      // Duplicate suppression
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

// --- Bottom Tab Navigator ---
function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.headerBackground,
        },
        headerTitleStyle: {
          color: theme.headerText,
        },
        headerTintColor: theme.primary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          switch (route.name) {
            case 'Alerts':
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              break;
            case 'My Alerts':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Emergency Contacts':
              IconComponent = MaterialIcons;
              iconName = focused ? 'contacts' : 'contacts';
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Help':
              iconName = focused ? 'help-circle' : 'help-circle-outline';
              break;
            default:
              iconName = 'help';
          }
          return <IconComponent name={iconName} size={size} color={color} />;
        },
        swipeEnabled: true,
      })}
    >
      <Tab.Screen name="Alerts" component={HomeScreen} />
      <Tab.Screen name="My Alerts" component={MyAlertsScreen} />
      <Tab.Screen name="Emergency Contacts" component={ContactsScreen} />
      <Tab.Screen name="Notifications" component={NotificationHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Help" component={FeedbackScreen} />
    </Tab.Navigator>
  );
}

// --- Stack Navigator ---
function AppNavigator() {
  const { theme } = useTheme();

  // Listen for notification responses (user taps notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const body = response.notification.request.content.body || 'Alert';
        if (data && data.alert_id) {
          saveNotification({
            alert_id: data.alert_id,
            category: data.category || 'other',
            text: body,
          });
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // Handle deep linking (for password reset)
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      if (url && url.includes('admin/reset-password')) {
        // Extract token from URL
        const token = url.split('token=')[1] || '';
        // Navigate to reset password screen
        if (navigationRef.current) {
          navigationRef.current.navigate('AdminResetPassword', { token });
        }
      }
    };
    // Listen to initial URL
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('admin/reset-password')) {
        const token = url.split('token=')[1] || '';
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('AdminResetPassword', { token });
          }
        }, 500);
      }
    });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.headerBackground,
            },
            headerTitleStyle: {
              color: theme.headerText,
            },
            headerTintColor: theme.primary,
          }}
        >
          {/* Main tabs */}
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          {/* Legal screens */}
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ title: 'Privacy Policy' }}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{ title: 'Terms & Conditions' }}
          />

          {/* Alert detail */}
          <Stack.Screen
            name="AlertDetail"
            component={AlertDetailScreen}
            options={{ title: 'Alert Details' }}
          />

          {/* Guardian screens */}
          <Stack.Screen
            name="GuardianApplication"
            component={GuardianApplicationForm}
            options={{ title: 'Apply as Guardian' }}
          />
          <Stack.Screen
            name="GuardianDashboard"
            component={GuardianDashboard}
            options={{ title: 'Guardian Dashboard' }}
          />

          {/* Trusted contacts */}
          <Stack.Screen
            name="TrustedContacts"
            component={TrustedContactsScreen}
            options={{ title: 'Trusted Contacts' }}
          />

          {/* ========== ADMIN SCREENS ========== */}
          <Stack.Screen
            name="AdminLogin"
            component={AdminLoginScreen}
            options={{ title: 'Admin Login' }}
          />
          <Stack.Screen
            name="AdminForgotPassword"
            component={AdminForgotPasswordScreen}
            options={{ title: 'Forgot Password' }}
          />
          <Stack.Screen
            name="AdminResetPassword"
            component={AdminResetPasswordScreen}
            options={{ title: 'Reset Password' }}
          />
          <Stack.Screen
            name="AdminSignup"
            component={AdminSignupScreen}
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen
            name="AdminPanel"
            component={AdminPanelScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AdminApplications"
            component={AdminApplicationsScreen}
            options={{ title: 'Applications' }}
          />
          <Stack.Screen
            name="AdminApplicationDetail"
            component={AdminApplicationDetailScreen}
            options={{ title: 'Application Details' }}
          />
          <Stack.Screen
            name="AdminGuardians"
            component={AdminGuardiansScreen}
            options={{ title: 'Guardians' }}
          />
          <Stack.Screen
            name="AdminAnalytics"
            component={AdminAnalyticsScreen}
            options={{ title: 'Analytics' }}
          />
          <Stack.Screen
            name="AdminInvites"
            component={AdminInvitesScreen}
            options={{ title: 'Invites' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <NetworkBanner />
    </View>
  );
}

// --- Main App ---
export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [bannerNotification, setBannerNotification] = useState(null);

  // Register global callback for the notification banner
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
    <ThemeProvider>
      <AppNavigator />
      <NotificationPermissionReminder />
      <NotificationBanner
        notification={bannerNotification}
        onDismiss={() => setBannerNotification(null)}
      />
    </ThemeProvider>
  );
}