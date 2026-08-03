import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NetworkBanner } from '../components/NetworkBanner';
import { isAdmin, getAdminRole } from '../services/admin';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ========== SCREENS ==========
// Main tabs
import HomeScreen from '../screens/HomeScreen';
import MyAlertsScreen from '../screens/MyAlertsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import NotificationHistoryScreen from '../screens/NotificationHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Stack screens
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import GuardianApplicationForm from '../screens/GuardianApplicationForm';
import GuardianDashboard from '../screens/GuardianDashboard';
import TrustedContactsScreen from '../screens/TrustedContactsScreen';

// ========== ADMIN SCREENS ==========
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import AdminApplicationsScreen from '../screens/AdminApplicationsScreen';
import AdminApplicationDetailScreen from '../screens/AdminApplicationDetailScreen';
import AdminGuardiansScreen from '../screens/AdminGuardiansScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';
import AdminInvitesScreen from '../screens/AdminInvitesScreen';
import AdminForgotPasswordScreen from '../screens/AdminForgotPasswordScreen';
import AdminResetPasswordScreen from '../screens/AdminResetPasswordScreen';
import AdminSignupScreen from '../screens/AdminSignupScreen';
import AdminAlertFeedScreen from '../screens/AdminAlertFeedScreen';
import AdminGuardianPerformanceScreen from '../screens/AdminGuardianPerformanceScreen';
import AdminGuardianDetailScreen from '../screens/AdminGuardianDetailScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ---------- Bottom Tabs Navigator ----------
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

// ---------- Admin Stack (for admin screens) ----------
function AdminStack() {
  const { theme } = useTheme();

  return (
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
      <Stack.Screen
        name="AdminAlertFeed"
        component={AdminAlertFeedScreen}
        options={{ title: 'Live Alert Feed' }}
      />
      <Stack.Screen
        name="AdminGuardianPerformance"
        component={AdminGuardianPerformanceScreen}
        options={{ title: 'Guardian Performance' }}
      />
      <Stack.Screen
        name="AdminGuardianDetail"
        component={AdminGuardianDetailScreen}
        options={{ title: 'Guardian Details' }}
      />
    </Stack.Navigator>
  );
}

// ---------- Custom Drawer Content ----------
function CustomDrawerContent({ navigation, state, descriptors, ...props }) {
  const { theme } = useTheme();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminRole, setAdminRole] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const admin = await isAdmin();
      setIsAdminUser(admin);
      const role = await getAdminRole();
      setAdminRole(role || '');
    };
    checkAdmin();
  }, []);

  const styles = StyleSheet.create({
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 8,
    },
    drawerItemActive: {
      backgroundColor: theme.primaryLight || '#fef2f2',
    },
    drawerItemText: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    drawerItemTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    icon: {
      fontSize: 22,
      color: theme.textSecondary,
      width: 28,
    },
    iconActive: {
      color: theme.primary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    header: {
      padding: 16,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.primary,
    },
    headerSub: {
      fontSize: 14,
      color: theme.textSecondary,
    },
  });

  const renderItem = (label, icon, route, params = {}) => {
    const isActive = state.routes[state.index]?.name === route;
    return (
      <TouchableOpacity
        style={[styles.drawerItem, isActive && styles.drawerItemActive]}
        onPress={() => {
          navigation.navigate(route, params);
          navigation.closeDrawer();
        }}
        key={label}
      >
        <Text style={[styles.icon, isActive && styles.iconActive]}>{icon}</Text>
        <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zenca</Text>
        <Text style={styles.headerSub}>Guardian Network</Text>
      </View>

      {renderItem('Alerts', '🚨', 'Main', { screen: 'Alerts' })}
      {renderItem('My Alerts', '📋', 'Main', { screen: 'My Alerts' })}
      {renderItem('Emergency Contacts', '📞', 'Main', { screen: 'Emergency Contacts' })}
      {renderItem('Notifications', '🔔', 'Main', { screen: 'Notifications' })}
      {renderItem('Settings', '⚙️', 'Main', { screen: 'Settings' })}
      {renderItem('Help', '❓', 'Main', { screen: 'Help' })}

      <View style={styles.divider} />

      {renderItem('Guardian Application', '🛡️', 'GuardianApplication')}
      {renderItem('Guardian Dashboard', '📊', 'GuardianDashboard')}
      {renderItem('Trusted Contacts', '👥', 'TrustedContacts')}

      <View style={styles.divider} />

      {/* Admin section */}
      {isAdminUser ? (
        renderItem(`Admin Panel (${adminRole})`, '🔐', 'AdminStack', { screen: 'AdminPanel' })
      ) : (
        renderItem('Admin Login', '🔐', 'AdminStack', { screen: 'AdminLogin' })
      )}

      <View style={{ flex: 1 }} />
      <View style={styles.divider} />
      <TouchableOpacity
        style={[styles.drawerItem]}
        onPress={() => {
          // Logout logic? We'll handle logout inside AdminPanel.
          // For now, just close drawer.
          navigation.closeDrawer();
        }}
      >
        <Text style={[styles.icon, { color: '#d32f2f' }]}>🚪</Text>
        <Text style={[styles.drawerItemText, { color: '#d32f2f' }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Main Drawer Navigator ----------
function DrawerNavigator() {
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.background,
          width: 280,
        },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen name="Main" component={MainTabs} />
      <Drawer.Screen name="GuardianApplication" component={GuardianApplicationForm} />
      <Drawer.Screen name="GuardianDashboard" component={GuardianDashboard} />
      <Drawer.Screen name="TrustedContacts" component={TrustedContactsScreen} />
      <Drawer.Screen name="AdminStack" component={AdminStack} />
    </Drawer.Navigator>
  );
}

// ---------- Root Stack (for deep linking and modals) ----------
export default function AppNavigator() {
  const { theme } = useTheme();

  // Deep linking configuration
  const linking = {
    prefixes: ['zenca://', 'https://zenca.com'],
    config: {
      screens: {
        AlertDetail: 'alert/:id',
        Main: {
          screens: {
            Alerts: 'alerts',
            MyAlerts: 'myalerts',
            EmergencyContacts: 'contacts',
            Notifications: 'notifications',
            Settings: 'settings',
            Help: 'help',
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking} theme={{
      colors: {
        background: theme.background,
        card: theme.card,
        text: theme.text,
        border: theme.border,
        primary: theme.primary,
      },
    }}>
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
          name="Drawer"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlertDetail"
          component={AlertDetailScreen}
          options={{ title: 'Alert Details' }}
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
      </Stack.Navigator>
      <NetworkBanner />
    </NavigationContainer>
  );
}