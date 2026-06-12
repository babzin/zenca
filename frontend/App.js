import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, ActivityIndicator } from 'react-native';

// Services
import { initSupabase } from './src/services/supabase';
import { requestPermissions, registerForPushNotifications } from './src/services/fcm';
import { initLocationTracking } from './src/services/location';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MyAlertsScreen from './src/screens/MyAlertsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import MapScreen from './src/screens/MapScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsScreen from './src/screens/TermsScreen';
import EmergencyDisclaimerScreen from './src/screens/EmergencyDisclaimerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Utils
import { isDuplicateAlert, recordAlertLocation } from './src/utils/duplicateFilter';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Configure notification handler for duplicate filtering
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    if (data && data.latitude && data.longitude) {
      const isDuplicate = await isDuplicateAlert(
        parseFloat(data.latitude),
        parseFloat(data.longitude)
      );
      if (isDuplicate) {
        // Suppress duplicate notification
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
      // Record this alert as seen
      await recordAlertLocation(parseFloat(data.latitude), parseFloat(data.longitude));
    }
    // Show normal notification
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#d32f2f',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen name="Alerts" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="My Alerts" component={MyAlertsScreen} />
      <Tab.Screen name="Emergency Contacts" component={ContactsScreen} />
      <Tab.Screen name="Help" component={FeedbackScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Supabase (generates device UUID)
        await initSupabase();

        // Request permissions
        await requestPermissions();
        await registerForPushNotifications();
        await initLocationTracking();

        // Check if onboarding has been shown
        const onboardingSeen = await AsyncStorage.getItem('@zenca_onboarding_seen');
        setShowOnboarding(!onboardingSeen);

        // Disclaimer is shown after onboarding (or immediately if onboarding already seen)
        if (onboardingSeen) {
          const disclaimerSeen = await AsyncStorage.getItem('@zenca_disclaimer_seen');
          setShowDisclaimer(!disclaimerSeen);
        }

        setAppReady(true);
      } catch (error) {
        console.error('Init error', error);
        Alert.alert('Init Error', error.message);
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
          // After onboarding, check disclaimer
          AsyncStorage.getItem('@zenca_disclaimer_seen').then((seen) => {
            setShowDisclaimer(!seen);
          });
        }}
      />
    );
  }

  if (showDisclaimer) {
    return (
      <EmergencyDisclaimerScreen
        onAgree={() => {
          setShowDisclaimer(false);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}