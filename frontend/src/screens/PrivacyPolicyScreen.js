import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
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
    bullet: {
      fontSize: 14,
      lineHeight: 22,
      color: theme.text,
      marginLeft: 16,
      marginBottom: 4,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last updated: July 20, 2026</Text>

      <Text style={styles.section}>1. No Login, No Registration</Text>
      <Text style={styles.text}>
        Zenca does not require you to create an account or provide any personal information such as your name, email address, or phone number. You remain completely anonymous while using the app.
      </Text>

      <Text style={styles.section}>2. Information We Collect</Text>
      <Text style={styles.text}>
        We collect and temporarily store the following information solely to provide emergency response functionality:
      </Text>
      <Text style={styles.bullet}>• Device UUID (randomly generated, not linked to any personal identifier)</Text>
      <Text style={styles.bullet}>• Your approximate location (GPS coordinates) – used only to find nearby guardians and send your location to them</Text>
      <Text style={styles.bullet}>• FCM push notification token – used to deliver alerts to guardians</Text>
      <Text style={styles.bullet}>• Alert messages, photos, and voice notes you voluntarily submit – stored for up to 1 hour</Text>
      <Text style={styles.bullet}>• If you apply to be a guardian, additional verification data (NIN, BVN, certifications) is stored securely and used only for vetting</Text>

      <Text style={styles.section}>3. How We Use Your Information</Text>
      <Text style={styles.text}>
        • Find the 5 closest verified guardians within 500 m of your location when you trigger an SOS{'\n'}
        • Send your location and alert details to those guardians{'\n'}
        • Notify your trusted contacts (family/friends) via SMS (with your consent){'\n'}
        • Allow you to edit or delete your own alerts within 1 hour{'\n'}
        • Enable guardians to respond and update their status (en route, arrived, resolved)
      </Text>

      <Text style={styles.section}>4. Data Retention</Text>
      <Text style={styles.text}>
        Alert data is automatically deleted from our servers after 1 hour. Your device UUID and FCM token are stored only while you have the app installed. Photos and voice notes are also deleted after 1 hour. Guardian application data is retained for vetting purposes and can be deleted upon request.
      </Text>

      <Text style={styles.section}>5. No Government Backdoor</Text>
      <Text style={styles.text}>
        Zenca has no administrative panel, no ability to remotely edit or delete user messages, and no government access. You own and control your data entirely.
      </Text>

      <Text style={styles.section}>6. Third-Party Services</Text>
      <Text style={styles.text}>
        We use Supabase (database and storage), Firebase Cloud Messaging (push notifications), and Nominatim (reverse geocoding). Each has its own privacy policy. We do not share your data with any other third parties.
      </Text>

      <Text style={styles.section}>7. Children's Privacy</Text>
      <Text style={styles.text}>
        Zenca is not intended for children under 13. We do not knowingly collect personal information from children.
      </Text>

      <Text style={styles.section}>8. Changes to This Policy</Text>
      <Text style={styles.text}>
        We may update this Privacy Policy from time to time. You will be notified of any material changes via an in-app notice.
      </Text>

      <Text style={styles.section}>9. Contact Us</Text>
      <Text style={styles.text}>
        If you have questions about this Privacy Policy, please contact us at: zenca963@gmail.com
      </Text>
    </ScrollView>
  );
}