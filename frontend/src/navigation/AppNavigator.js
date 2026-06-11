

// @ts-nocheck
/** @jsxRuntime classic */
/** @jsx React.createElement */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import MyAlertsScreen from '../screens/MyAlertsScreen';
import ContactsScreen from '../screens/ContactsScreen';

const Tab = createBottomTabNavigator();

interface Props {
  deviceUUID: string;
  detectedState: string;
  demoMode: boolean;
}

export default function AppNavigator({ deviceUUID, detectedState, demoMode }: Props) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0d0d0d',
            borderTopColor: '#1a1a1a',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#FF2222',
          tabBarInactiveTintColor: '#444',
          tabBarLabelStyle: { fontSize: 10, letterSpacing: 1 },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: 'ALERTS',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚠️</Text>,
          }}
        >
          {() => <HomeScreen deviceUUID={deviceUUID} demoMode={demoMode} />}
        </Tab.Screen>

        <Tab.Screen
          name="MyAlerts"
          options={{
            tabBarLabel: 'MY ALERTS',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📋</Text>,
          }}
        >
          {() => <MyAlertsScreen deviceUUID={deviceUUID} />}
        </Tab.Screen>

        <Tab.Screen
          name="Contacts"
          options={{
            tabBarLabel: 'CONTACTS',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📞</Text>,
          }}
        >
          {() => <ContactsScreen detectedState={detectedState} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}