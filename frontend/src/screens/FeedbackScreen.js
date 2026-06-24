import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Linking,
  Alert,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function FeedbackScreen() {
  const { theme, isDark, themeMode, toggleTheme } = useTheme();

  const handleEmail = (subject, body = '') => {
    const emailUrl = `mailto:support@zenca.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        'No Email App',
        'Please email zenca963@gmail.com manually from your email app.'
      );
    });
  };

  const handleDemoRequest = () => {
    const demoFormUrl = 'https://tally.so/r/rjYXbL';
    Linking.openURL(demoFormUrl).catch(() => {
      Alert.alert(
        'Cannot Open Link',
        'Please visit our website to request a demo.'
      );
    });
  };

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
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 30,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.text,
    },
    cardText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    buttonReport: {
      backgroundColor: '#d32f2f',
    },
    buttonSuggest: {
      backgroundColor: '#4caf50',
    },
    buttonDemo: {
      backgroundColor: '#ff9800',
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    note: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 30,
    },
    darkModeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    darkModeLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Feedback</Text>
      <Text style={styles.subtitle}>We're here to help you stay safe.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report a Problem</Text>
        <Text style={styles.cardText}>
          Found a bug or issue? Let us know so we can fix it quickly.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonReport]}
          onPress={() => handleEmail('Problem Report: Zenca', 'Please describe the issue:\n\n')}
        >
          <Text style={styles.buttonText}>Report Problem</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suggest a Feature</Text>
        <Text style={styles.cardText}>
          Have an idea to make Zenca better? We'd love to hear it.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonSuggest]}
          onPress={() => handleEmail('Feature Suggestion: Zenca', 'Describe your idea:\n\n')}
        >
          <Text style={styles.buttonText}>Suggest Feature</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request a Demo</Text>
        <Text style={styles.cardText}>
          Interested in Zenca for your community, organization, or state?
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonDemo]}
          onPress={handleDemoRequest}
        >
          <Text style={styles.buttonText}>Request Demo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dark Mode</Text>
        <Text style={styles.cardText}>
          Choose your preferred appearance.
        </Text>
        <View style={styles.darkModeRow}>
          <Text style={styles.darkModeLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={() => toggleTheme(isDark ? 'light' : 'dark')}
            trackColor={{ false: '#ccc', true: '#d32f2f' }}
            thumbColor={isDark ? '#fff' : '#fff'}
          />
        </View>
        <TouchableOpacity
          style={{ marginTop: 8 }}
          onPress={() => toggleTheme('system')}
        >
          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
            {themeMode === 'system' ? 'Use System Theme' : 'Use System Theme'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        You can also email us directly at: zenca963@gmail.com
      </Text>
    </ScrollView>
  );
}