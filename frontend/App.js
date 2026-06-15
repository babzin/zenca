import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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

// Configure notification handler for duplicate filtering (safe with try/catch)
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const data = notification.request.content.data;
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
    } catch (err) {
      console.warn('Duplicate filter error', err);
    }
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
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: '#d32f2f',
        tabBarInactiveTintColor: '#757575',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          switch (route.name) {
            case 'Alerts':
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'My Alerts':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Emergency Contacts':
              IconComponent = MaterialIcons;
              iconName = focused ? 'contacts' : 'contacts';
              break;
            case 'Help':
              iconName = focused ? 'help-circle' : 'help-circle-outline';
              break;
            default:
              iconName = 'help';
          }
          return <IconComponent name={iconName} size={size} color={color} />;
        },
      })}
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
        // 1. Initialize Supabase (generates device UUID)
        await initSupabase();

        // 2. Request permissions – each wrapped individually to prevent crash
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

        // 3. Delay location initialization to avoid race conditions after permission grant
        setTimeout(async () => {
          try {
            await initLocationTracking();
          } catch (err) {
            console.error('Location tracking failed', err);
            Alert.alert('Warning', 'Location features may not work: ' + err.message);
          }
        }, 1000);

        // 4. Check if onboarding has been shown
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
        setAppReady(true); // still show app to avoid stuck spinner
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
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}