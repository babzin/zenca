import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NetworkBanner } from '../components/NetworkBanner';
import { saveNotification } from '../services/notificationStorage';

// Screens
import HomeScreen from '../screens/HomeScreen';
import MyAlertsScreen from '../screens/MyAlertsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GuardianApplicationForm from '../screens/GuardianApplicationForm';
import GuardianDashboard from '../screens/GuardianDashboard';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
export default function AppNavigator() {
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

  return (
    <NavigationContainer
      theme={{
        colors: {
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          primary: theme.primary,
        },
      }}
    >
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
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen
          name="AlertDetail"
          component={AlertDetailScreen}
          options={{ title: 'Alert Details' }}
        />
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
        <Stack.Screen
          name="TrustedContacts"
          component={TrustedContactsScreen}
          options={{ title: 'Trusted Contacts' }}
        />
      </Stack.Navigator>
      <NetworkBanner />
    </NavigationContainer>
  );
}