import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { requestPermissions, registerForPushNotifications } from './src/services/fcm';
import { initLocationTracking } from './src/services/location';
import { initSupabase } from './src/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import MyAlertsScreen from './src/screens/MyAlertsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsScreen from './src/screens/TermsScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import EmergencyDisclaimerScreen from './src/screens/EmergencyDisclaimerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { Alert } from 'react-native';
import MapScreen from './src/screens/MapScreen';
import { isDuplicateAlert, recordAlertLocation } from './src/utils/duplicateFilter';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Alerts" component={HomeScreen} />
      <Tab.Screen name="My Alerts" component={MyAlertsScreen} />
      <Tab.Screen name="Emergency Contacts" component={ContactsScreen} />
      <Tab.Screen name="Help" component={FeedbackScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initSupabase();
      await requestPermissions();
      await registerForPushNotifications();
      await initLocationTracking();

      
      const onboardingSeen = await AsyncStorage.getItem('@zenca_onboarding_seen');
      setShowOnboarding(!onboardingSeen);
      setAppReady(true);
    };
    init().catch(err => Alert.alert('Init Error', err.message));
  }, []);

  if (!appReady) {
    return null;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      </Stack.Navigator>
      <EmergencyDisclaimerScreen onAgree={() => {}} />
    </NavigationContainer>
  );

  Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    if (data && data.latitude && data.longitude) {
      const isDuplicate = await isDuplicateAlert(data.latitude, data.longitude);
      if (isDuplicate) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
      await recordAlertLocation(data.latitude, data.longitude);
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});
}