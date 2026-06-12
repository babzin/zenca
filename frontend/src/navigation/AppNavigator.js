import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MyAlertsScreen from '../screens/MyAlertsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import MapScreen from '../screens/MapScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

export default function AppNavigator() {
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