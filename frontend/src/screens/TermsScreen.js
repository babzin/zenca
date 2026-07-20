import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function TermsScreen() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: theme.primary,
    },
    lastUpdated: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    section: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 8,
      color: theme.primary,
    },
    text: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.text,
      marginBottom: 12,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.lastUpdated}>Last updated: July 20, 2026</Text>

      <Text style={styles.section}>1. Acceptance of Terms</Text>
      <Text style={styles.text}>
        By downloading, installing, or using Zenca ("the App"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the App.
      </Text>

      <Text style={styles.section}>2. Emergency Use Only</Text>
      <Text style={styles.text}>
        Zenca is designed for genuine emergency situations including kidnapping, banditry, terrorism, and similar threats. You agree to use the App responsibly and only to report real emergencies. False alerts may endanger lives and waste emergency resources.
      </Text>

      <Text style={styles.section}>3. Community Guardian System</Text>
      <Text style={styles.text}>
        Zenca uses a network of verified guardians (trained civilians, off-duty medics, police) who respond to alerts within 500 m. The App does not broadcast alerts to the general public. You acknowledge that guardians are volunteers and not official emergency services.
      </Text>

      <Text style={styles.section}>4. No Guarantee of Response</Text>
      <Text style={styles.text}>
        While we strive to connect you with nearby guardians, we cannot guarantee that any guardian will respond or that emergency services will be notified. Always call official emergency numbers (e.g., 112) when possible.
      </Text>

      <Text style={styles.section}>5. User Responsibility</Text>
      <Text style={styles.text}>
        You are solely responsible for the content of alerts you send. You agree not to post false, misleading, or illegal information. Zenca reserves the right to block users who abuse the system (e.g., repeated false alarms).
      </Text>

      <Text style={styles.section}>6. No AI / No Offline Mode</Text>
      <Text style={styles.text}>
        Zenca does not use any artificial intelligence or machine learning models. The App requires an active internet connection to send and receive alerts. Offline functionality is not supported.
      </Text>

      <Text style={styles.section}>7. Location & Notifications</Text>
      <Text style={styles.text}>
        The App requires access to your device's location and push notifications to function properly. You may revoke these permissions at any time, but the App will not work as intended.
      </Text>

      <Text style={styles.section}>8. Limitation of Liability</Text>
      <Text style={styles.text}>
        To the fullest extent permitted by law, Zenca and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of life, injury, or property damage arising from your use of or inability to use the App.
      </Text>

      <Text style={styles.section}>9. No Warranty</Text>
      <Text style={styles.text}>
        The App is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or secure.
      </Text>

      <Text style={styles.section}>10. Modifications to Terms</Text>
      <Text style={styles.text}>
        We may revise these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.
      </Text>

      <Text style={styles.section}>11. Governing Law</Text>
      <Text style={styles.text}>
        These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
      </Text>

      <Text style={styles.section}>12. Contact</Text>
      <Text style={styles.text}>
        For questions about these Terms, contact: zenca963@gmail.com
      </Text>
    </ScrollView>
  );
}